import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/prisma";
import { PREMIUM_MARKDOWN_RESPONSE_RULES, parseJsonResponse } from "@/lib/ai-utils";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const fallback = {
  reply:
    "### Quick Reset\n\nI could not format a complete response this time.\n\n### What To Send Next\n\n- Your target role\n- Your current skills\n- The deadline or interview date\n- The specific area you want to improve\n\n### Immediate Action\n\nAsk again with those details and I will build a focused plan.",
  suggestedPrompts: [
    "Create a 30-day preparation roadmap for my target role",
    "Review the skills I should improve first",
    "Give me interview practice questions",
  ],
};

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages.slice(-8) : [];

    if (!messages.length) {
      return NextResponse.json({ error: "Message history is required." }, { status: 400 });
    }

    const latest = messages[messages.length - 1]?.content?.trim();
    if (!latest) {
      return NextResponse.json({ error: "Please enter a career question." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      include: { industryInsight: true, resume: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const profileContext = {
      name: user.name || "User",
      industry: user.industry || "Not specified",
      subIndustry: user.industry?.split("-")?.slice(1)?.join(" ")?.replace(/\b\w/g, (c) => c.toUpperCase()) || "Not specified",
      experience: user.experience || "Not specified",
      skills: user.skills?.length ? user.skills : ["Not specified"],
      interests: user.bio || "Not specified",
      goals: "Career advancement and job readiness in target industry",
      educationBackground: "Not specified (assume standard degree path unless stated otherwise)",
      recommendedSkillsForIndustry: user.industryInsight?.recommendedSkills ?? [],
      topIndustrySkills: user.industryInsight?.topSkills ?? [],
      hasResume: Boolean(user.resume?.content),
    };

    const conversation = messages
      .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
      .join("\n\n");

const prompt = `
You are CareerNavigator AI inside CareerSphere, a premium AI-powered career readiness platform.
You must deeply personalize your response based on the user's exact profile data.

Return ONLY valid JSON:
{
  "reply": "Markdown response following strict formatting rules",
  "suggestedPrompts": ["string", "string", "string"]
}

PERSONALIZATION RULES:
- Tailor all advice, roadmaps, learning paths, and interview prep specifically to the user's industry, sub-industry, skills, experience, and goals.
- Different users must receive entirely different technologies, interview questions, and career paths based on their profile.
- If profile fields (like experience or skills) are "Not specified", provide graceful fallback advice but gently encourage them to provide that context in the chat.
- Adapt the complexity of your advice. (e.g., beginner vs senior).
- Do NOT hardcode generic responses. Make every response feel intelligent and custom-built for this exact user.

GENERAL RULES:
- Be specific, honest, and action-oriented.
- Do not claim certifications, projects, grades, or experience the user did not provide.
- Include an "Immediate Next Steps" section with 3-5 practical actions.
- If the user asks for a roadmap, include precise time blocks and measurable outputs.
- Keep the reply useful, highly focused, and recruiter-ready.
${PREMIUM_MARKDOWN_RESPONSE_RULES}

Profile context:
${JSON.stringify(profileContext, null, 2)}

Recent conversation:
${conversation}
`;

    const result = await model.generateContent(prompt);
    const parsed = parseJsonResponse(result.response.text(), fallback);

    return NextResponse.json({
      reply: typeof parsed.reply === "string" ? parsed.reply : fallback.reply,
      suggestedPrompts: Array.isArray(parsed.suggestedPrompts)
        ? parsed.suggestedPrompts.slice(0, 3)
        : fallback.suggestedPrompts,
    });
  } catch (error) {
    console.error("CareerNavigator error:", error);
    return NextResponse.json(
      { error: "CareerNavigator AI could not respond. Please try again." },
      { status: 500 }
    );
  }
}
