import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  PREMIUM_MARKDOWN_RESPONSE_RULES,
  clampScore,
  parseJsonResponse,
} from "@/lib/ai-utils";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const fallbackAnalysis = {
  matchScore: 0,
  atsScore: 0,
  matchedKeywords: [],
  missingSkills: [],
  strengths: [],
  improvementSuggestions: [
    "The AI response could not be parsed. Try again with a clearer resume PDF and complete job description.",
  ],
  categoryScores: {
    technicalSkills: 0,
    experienceFit: 0,
    educationFit: 0,
    keywordAlignment: 0,
    presentation: 0,
  },
  summary: "CareerSphere could not complete a structured analysis for this request.",
};

function uniqueList(value, limit) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function normalizeScores(parsed) {
  const matchedKeywords = uniqueList(parsed.matchedKeywords, 14);
  const missingSkills = uniqueList(parsed.missingSkills, 12);
  const strengths = uniqueList(parsed.strengths, 8);
  const improvementSuggestions = uniqueList(parsed.improvementSuggestions, 8);
  const categoryScores = {
    technicalSkills: clampScore(parsed.categoryScores?.technicalSkills),
    experienceFit: clampScore(parsed.categoryScores?.experienceFit),
    educationFit: clampScore(parsed.categoryScores?.educationFit),
    keywordAlignment: clampScore(parsed.categoryScores?.keywordAlignment),
    presentation: clampScore(parsed.categoryScores?.presentation),
  };

  const evidenceCount = matchedKeywords.length + strengths.length;
  let matchScore = clampScore(parsed.matchScore);
  let atsScore = clampScore(parsed.atsScore);

  if (evidenceCount < 4) {
    matchScore = Math.min(matchScore, 58);
    atsScore = Math.min(atsScore, 62);
  } else if (matchedKeywords.length < missingSkills.length) {
    matchScore = Math.min(matchScore, 72);
  }

  if (improvementSuggestions.length < 2) {
    atsScore = Math.min(atsScore, 68);
  }

  return {
    ...fallbackAnalysis,
    ...parsed,
    matchScore,
    atsScore,
    matchedKeywords,
    missingSkills,
    strengths,
    improvementSuggestions: improvementSuggestions.length
      ? improvementSuggestions
      : fallbackAnalysis.improvementSuggestions,
    categoryScores,
  };
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const resume = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    if (!resume || typeof resume === "string") {
      return NextResponse.json({ error: "Please upload a PDF resume." }, { status: 400 });
    }

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 60) {
      return NextResponse.json(
        { error: "Please paste a job description with at least 60 characters." },
        { status: 400 }
      );
    }

    if (resume.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF resumes are supported." }, { status: 400 });
    }

    if (resume.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Resume PDF must be 5MB or smaller." }, { status: 400 });
    }

    const buffer = Buffer.from(await resume.arrayBuffer());
    const base64Resume = buffer.toString("base64");

    const prompt = `
You are CareerSphere's senior ATS resume analyst.
Compare the attached PDF resume against the job description below.
Return ONLY valid JSON with this exact shape:
{
  "matchScore": number,
  "atsScore": number,
  "matchedKeywords": ["string"],
  "missingSkills": ["string"],
  "strengths": ["string"],
  "improvementSuggestions": ["string"],
  "categoryScores": {
    "technicalSkills": number,
    "experienceFit": number,
    "educationFit": number,
    "keywordAlignment": number,
    "presentation": number
  },
  "summary": "string"
}

Scoring rules:
- Scores must be integers from 0 to 100.
- Use conservative scoring. A high score requires clear evidence from the resume.
- matchedKeywords should contain role-relevant skills/phrases actually found in the resume.
- missingSkills should contain high-value job requirements not clearly present.
- improvementSuggestions should be actionable, concise, and recruiter-friendly.
- Do not invent credentials or experience.
- If the resume text is not readable, return low scores and explain the parsing issue.
- Format summary and recommendations using concise, recruiter-friendly language.
${PREMIUM_MARKDOWN_RESPONSE_RULES}

Job description:
${jobDescription.trim()}
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Resume,
          mimeType: "application/pdf",
        },
      },
    ]);

    const parsed = parseJsonResponse(result.response.text(), fallbackAnalysis);
    const normalized = normalizeScores(parsed);
    const analysis = {
      ...normalized,
      fileName: resume.name,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Resume matcher error:", error);
    return NextResponse.json(
      { error: "Failed to analyze resume. Please try again." },
      { status: 500 }
    );
  }
}
