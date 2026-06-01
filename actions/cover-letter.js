"use server"; 

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_COVER_LETTER_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const MAX_RESUME_UPLOAD_SIZE = 5 * 1024 * 1024;
const ACCEPTED_RESUME_MIME_TYPES = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function getFileExtension(fileName = "") {
  return String(fileName).split(".").pop()?.toLowerCase() || "";
}

function normalizeCoverLetterInput(data) {
  if (data && typeof data.get === "function") {
    const resume = data.get("resume");
    return {
      companyName: String(data.get("companyName") || "").trim(),
      jobTitle: String(data.get("jobTitle") || "").trim(),
      jobDescription: String(data.get("jobDescription") || "").trim(),
      resume:
        resume && typeof resume !== "string" && resume.size > 0
          ? resume
          : null,
    };
  }

  return {
    companyName: String(data?.companyName || "").trim(),
    jobTitle: String(data?.jobTitle || "").trim(),
    jobDescription: String(data?.jobDescription || "").trim(),
    resume: null,
  };
}

async function resumeToInlineData(file) {
  if (!file) return null;

  const extension = getFileExtension(file.name);
  const mimeType = file.type || ACCEPTED_RESUME_MIME_TYPES[extension];

  if (!ACCEPTED_RESUME_MIME_TYPES[extension]) {
    throw new Error("Resume must be a PDF, DOC, or DOCX file");
  }

  if (file.size > MAX_RESUME_UPLOAD_SIZE) {
    throw new Error("Resume file must be 5MB or smaller");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

/**
 * Generates a professional cover letter for a given job.
 * Uses AI to generate content and stores it in the database.
 *
 * @param {Object} data - Cover letter request data
 * @param {string} data.jobTitle - Job title applied for
 * @param {string} data.companyName - Target company name
 * @param {string} data.jobDescription - Description of the job role
 * @returns {Promise<Object>} Newly created cover letter entry
 * @throws {Error} If user is unauthorized, missing fields, or AI request fails
 */
export async function generateCoverLetter(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const input = normalizeCoverLetterInput(data);

  if (!input.jobTitle || !input.companyName || !input.jobDescription) {
    throw new Error("Missing required fields");
  }

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (!user) throw new Error("User not found");

  let uploadedResumePart = null;
  let uploadedResumeName = input.resume?.name || "Not uploaded";

  if (input.resume) {
    try {
      uploadedResumePart = await resumeToInlineData(input.resume);
    } catch (error) {
      console.error(
        "Uploaded resume preparation failed, continuing without file:",
        error.message
      );
      uploadedResumeName = `${input.resume.name} (not readable)`;
    }
  }

  const prompt = `
You are CareerSphere's senior career writing assistant.
Write a polished, recruiter-ready cover letter for the following application.

Allowed data sources:
1. Job role: ${input.jobTitle}
2. Company name: ${input.companyName}
3. Job description: ${input.jobDescription}
4. Uploaded resume: ${uploadedResumeName}

Strict data-source rules:
- Use ONLY the job role, company name, job description, and attached uploaded resume.
- Do not use stored CareerSphere profile data, onboarding inputs, saved bio, preferences, stored skills, saved resume data, or account information.
- If an uploaded resume is attached, extract factual skills, projects, technologies, experience, education, achievements, certifications, and strengths from it.
- Align resume-backed evidence with the role, company, and job description.
- Mention projects, achievements, or technologies only when supported by the uploaded resume or job description.
- If the uploaded resume is missing or unreadable, write a concise role-specific letter using only the job role, company name, and job description.

Target role:
- Company: ${input.companyName}
- Job title: ${input.jobTitle}
- Job description: ${input.jobDescription}

Requirements:
- Return clean Markdown only.
- Use this exact business-letter structure:
  [Candidate Name from uploaded resume or Your Name]
  [Phone from uploaded resume or Phone Number]
  [Email from uploaded resume or Email]
  [LinkedIn from uploaded resume or LinkedIn]
  [Portfolio/GitHub from uploaded resume or Portfolio/GitHub]
  ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}

  Hiring Manager
  ${input.companyName}

  Subject: Application for ${input.jobTitle}

  Dear Hiring Manager,

  Paragraph 1: professional introduction, role, company interest, strong hook.
  Paragraph 2: skills, projects/experience, achievements, job-description match.
  Paragraph 3: why fit, enthusiasm, contribution.

  Sincerely,
  [Candidate Name from uploaded resume or Your Name]
- Tailor the content to the job description and resume-backed candidate evidence.
- Prioritize resume-backed evidence over generic claims.
- Emphasize fit, relevant strengths, and motivation.
- Do not invent employers, degrees, achievements, or metrics not provided.
- Do not hallucinate technologies or experience not found in the uploaded resume or job description.
- Keep the tone confident, warm, concise, and human.
- Avoid generic AI wording like "I am writing to express my keen interest" when a sharper opening is possible.
- Keep it between 250 and 400 words and fit for one PDF page.
`;

  try {
    let result;
    try {
      result = await model.generateContent(
        uploadedResumePart ? [prompt, uploadedResumePart] : prompt
      );
    } catch (error) {
      if (!uploadedResumePart) throw error;
      console.error("Uploaded resume context failed, retrying without file:", error.message);
      result = await model.generateContent(prompt);
    }
    const content = result.response.text().trim();

    return await db.coverLetter.create({
      data: {
        content,
        jobDescription: input.jobDescription,
        companyName: input.companyName,
        jobTitle: input.jobTitle,
        status: "completed",
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Error generating cover letter:", error.message);
    throw new Error("Failed to generate cover letter");
  }
}

/**
 * Fetch all cover letters for the authenticated user.
 *
 * @returns {Promise<Array>} List of cover letters ordered by newest first
 * @throws {Error} If user is unauthorized or query fails
 */
export async function getCoverLetters() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    return await db.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching cover letters:", error.message);
    throw new Error("Failed to fetch cover letters");
  }
}

/**
 * Fetch a single cover letter by ID for the authenticated user.
 *
 * @param {string} id - Cover letter ID
 * @returns {Promise<Object|null>} Cover letter object or null if not found
 * @throws {Error} If user is unauthorized or query fails
 */
export async function getCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    return await db.coverLetter.findFirst({
      where: { id, userId: user.id },
    });
  } catch (error) {
    console.error("Error fetching cover letter:", error.message);
    throw new Error("Failed to fetch cover letter");
  }
}

/**
 * Delete a cover letter by ID for the authenticated user.
 *
 * @param {string} id - Cover letter ID
 * @returns {Promise<Object>} Deleted cover letter entry
 * @throws {Error} If user is unauthorized or deletion fails
 */
export async function deleteCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    return await db.coverLetter.deleteMany({
      where: { id, userId: user.id },
    });
  } catch (error) {
    console.error("Error deleting cover letter:", error.message);
    throw new Error("Failed to delete cover letter");
  }
}

/**
 * Update a cover letter by ID for the authenticated user.
 */
export async function updateCoverLetter(id, newContent) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });
    if (!user) throw new Error("User not found");

    const existing = await db.coverLetter.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) throw new Error("Cover letter not found");

    return await db.coverLetter.update({
      where: { id },
      data: { content: newContent },
    });
  } catch (error) {
    console.error("Error updating cover letter:", error.message);
    throw new Error("Failed to update cover letter");
  }
}

/**
 * Regenerate a cover letter using AI based on existing job descriptions.
 */
export async function regenerateCoverLetter(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");

  const existing = await db.coverLetter.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error("Cover letter not found");

  const prompt = `
You are CareerSphere's senior career writing assistant.
Write a polished, recruiter-ready cover letter for the following application.
(This is a regeneration request. Make it slightly different, more engaging, and incredibly polished.)

Allowed data sources:
1. Job role: ${existing.jobTitle}
2. Company name: ${existing.companyName}
3. Job description: ${existing.jobDescription}

Strict data-source rules:
- Use ONLY the job role, company name, and job description above.
- Do not use stored CareerSphere profile data, onboarding inputs, saved bio, preferences, stored skills, saved resume data, or account information.
- Do not invent candidate experience, projects, employers, degrees, achievements, or metrics.
- Keep the letter role-specific and recruiter-ready even when candidate details are unavailable.

Target role:
- Company: ${existing.companyName}
- Job title: ${existing.jobTitle}
- Job description: ${existing.jobDescription}

Requirements:
- Return clean Markdown only.
- Use this exact business-letter structure:
  [Your Name]
  [Phone Number]
  [Email]
  [LinkedIn]
  [Portfolio/GitHub]
  ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}

  Hiring Manager
  ${existing.companyName}

  Subject: Application for ${existing.jobTitle}

  Dear Hiring Manager,

  Paragraph 1: professional introduction, role, company interest, strong hook.
  Paragraph 2: skills, projects/experience, achievements, job-description match.
  Paragraph 3: why fit, enthusiasm, contribution.

  Sincerely,
  [Your Name]
- Tailor the content to the job description and role requirements.
- Emphasize fit, relevant strengths, and motivation.
- Do not invent employers, degrees, achievements, or metrics not provided.
- Keep the tone confident, warm, concise, and human.
- Avoid generic AI wording like "I am writing to express my keen interest" when a sharper opening is possible.
- Keep it between 250 and 400 words and fit for one PDF page.
`;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text().trim();

    return await db.coverLetter.update({
      where: { id },
      data: { content },
    });
  } catch (error) {
    console.error("Error regenerating cover letter:", error.message);
    throw new Error("Failed to regenerate cover letter");
  }
}
