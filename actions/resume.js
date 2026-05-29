"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Save or update a user's resume in the database.
 * Uses Prisma upsert for reliability and revalidates cache for UI sync.
 *
 * @param {string} content - Resume content to be saved
 * @returns {Promise<Object>} The saved/updated resume record
 */
export async function saveResume(content) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized: User not logged in");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found in database");

  try {
    const resume = await db.resume.upsert({
      where: { userId: user.id },
      update: { content },
      create: { userId: user.id, content },
    });

    // Refresh cache so UI shows the latest resume
    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Database error saving resume:", error);
    throw new Error("Failed to save resume. Please try again.");
  }
}

/**
 * Fetch the logged-in user's resume from the database.
 *
 * @returns {Promise<Object|null>} Resume object if found, otherwise null
 */
export async function getResume() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized: User not logged in");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error("User not found in database");

  return db.resume.findUnique({
    where: { userId: user.id },
  });
}

/**
 * Enhance a section of the resume using AI.
 * Ensures improvements are ATS-friendly, professional, and concise.
 *
 * @param {Object} params
 * @param {string} params.current - Current text to improve
 * @param {string} params.type - Section type (summary, experience, education, etc.)
 * @returns {Promise<string>}
 */
export async function improveWithAI({ current, type }) {
  if (!current || typeof current !== "string") {
    throw new Error("Invalid input: Resume content must be a non-empty string");
  }

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized: User not logged in");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });
  if (!user) throw new Error("User not found in database");

  const normalizedType = String(type || "section").toLowerCase();
  const sectionGuidance = {
    project: `
Project Requirements:
- Write like a strong software engineering internship or product-company project.
- Emphasize architecture, API integration, deployment, performance, reliability, automation, and maintainability when supported by the input.
- Include relevant technologies naturally if they are present or clearly implied by the input.
- Max 3 bullets. 1 line per bullet. Keep each bullet concise and technically dense.`,
    experience: `
Experience Requirements:
- Write like a FAANG/product-company internship or junior software engineering experience.
- Emphasize engineering ownership: implementation, debugging, API workflows, optimization, automation, reliability, testing, deployment, and collaboration.
- Convert task descriptions into achievement-oriented bullets without inventing fake metrics.
- Max 4 bullets. 1 line per bullet. Keep each bullet concise, specific, and recruiter-scannable.`,
    education: `
Education Requirements:
- Keep it minimal, formal, and ATS-friendly.
- Use "Undergraduate CGPA" instead of generic "CGPA" when referencing college performance.`,
  };

  const prompt = `
You are an expert FAANG-style technical resume writer for software engineering, web development, data analytics, and product-company roles.
Your task is to significantly elevate this ${normalizedType} section into ATS-friendly, recruiter-focused resume bullets.

Current content:
"${current}"

Rewrite rules:
- **Tone:** Modern, technical, confident, and product-company ready. Avoid fluff and generic student wording.
- **Impact:** Emphasize scalability, optimization, performance, reliability, automation, architecture, APIs, deployment, testing, and collaboration whenever supported by the input.
- **ATS:** Naturally include relevant engineering keywords, tools, frameworks, platforms, and software development terminology from the input.
- **Truth:** Preserve all facts. Do NOT invent metrics, companies, users, technologies, scale, or outcomes. If no metric exists, describe qualitative impact.
- **Action:** Start every bullet with a strong action verb such as Engineered, Optimized, Developed, Implemented, Integrated, Automated, Architected, Scaled, Enhanced, Streamlined, or Improved.
- **Quality:** Each bullet should read like a polished resume bullet for FAANG internships, startups, product companies, SWE internships, web development roles, or data analyst roles.
- **Concision:** Keep bullets tight, specific, and high-signal. Avoid repeated sentence structure.
- **Format:** Return ONLY the clean bullet points. No introductory text, no explanations, no markdown fences (\`\`\`).
- **Exclusions:** Do NOT include dates, employer names, or role titles. No paragraphs.
- **Avoid:** "Worked on", "helped with", "responsible for", "utilized", "leveraged", "synergy", and vague claims like "improved efficiency" without context.

${sectionGuidance[normalizedType] || ""}

Return ONLY the polished bullet points.
`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    text = text.replace(/```[\s\S]*?```/g, "").trim();

    if (!text) throw new Error("AI returned an empty response");

    return text;
  } catch (error) {
    console.error("AI resume improvement error:", error);
    throw new Error("Failed to improve resume content. Please try again.");
  }
}
