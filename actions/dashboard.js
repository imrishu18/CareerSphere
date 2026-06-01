"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_INDUSTRY_INSIGHTS_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// One week in milliseconds, used for scheduling insight refreshes
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generates AI-driven industry insights for a given industry.
 * Uses Google Generative AI to return structured JSON with
 * salary ranges, growth rate, demand level, skills, and trends.
 *
 * @param {string} industry - The industry name (e.g., "Software Engineering")
 * @returns {Promise<Object>} Parsed JSON containing industry insights
 * @throws {Error} If industry is missing or AI response is invalid
 */
export const generateAIInsights = async (industry) => {
  if (!industry) throw new Error("Industry not provided");

  const prompt = `
    Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
    {
      "salaryRanges": [
        { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
      ],
      "growthRate": number,
      "demandLevel": "High" | "Medium" | "Low",
      "topSkills": ["skill1", "skill2"],
      "marketOutlook": "Positive" | "Neutral" | "Negative",
      "keyTrends": ["trend1", "trend2"],
      "recommendedSkills": ["skill1", "skill2"]
    }

    IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
    Include at least 5 common roles for salary ranges.
    Growth rate should be a percentage.
    Include at least 5 skills and trends.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("AI Insights generation failed:", err);
    throw new Error("Failed to generate industry insights");
  }
};

/**
 * Retrieves industry insights for the authenticated user.
 * If no insights exist, generates them using AI and stores in DB.
 *
 * @returns {Promise<Object>} Industry insights from DB (or newly generated)
 * @throws {Error} If user is unauthorized, not found, or missing industry
 */
export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized user");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");
  if (!user.industry) throw new Error("User industry not set");

  // If no insights exist for this user, generate and store them
  if (!user.industryInsight) {
    const insights = await generateAIInsights(user.industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        salaryRanges: insights.salaryRanges ?? [],
        growthRate: insights.growthRate ?? 0,
        demandLevel: insights.demandLevel ?? "Medium",
        topSkills: insights.topSkills ?? [],
        marketOutlook: insights.marketOutlook ?? "Neutral",
        keyTrends: insights.keyTrends ?? [],
        recommendedSkills: insights.recommendedSkills ?? [],
        nextUpdate: new Date(Date.now() + ONE_WEEK_MS), // schedule next refresh
      },
    });

    return industryInsight;
  }

  if (user.industryInsight.nextUpdate <= new Date()) {
    try {
      const insights = await generateAIInsights(user.industry);
      return await db.industryInsight.update({
        where: { industry: user.industry },
        data: {
          salaryRanges: insights.salaryRanges ?? user.industryInsight.salaryRanges,
          growthRate: insights.growthRate ?? user.industryInsight.growthRate,
          demandLevel: insights.demandLevel ?? user.industryInsight.demandLevel,
          topSkills: insights.topSkills ?? user.industryInsight.topSkills,
          marketOutlook: insights.marketOutlook ?? user.industryInsight.marketOutlook,
          keyTrends: insights.keyTrends ?? user.industryInsight.keyTrends,
          recommendedSkills:
            insights.recommendedSkills ?? user.industryInsight.recommendedSkills,
          lastUpdated: new Date(),
          nextUpdate: new Date(Date.now() + ONE_WEEK_MS),
        },
      });
    } catch (error) {
      console.error("Industry insight refresh failed:", error.message);
    }
  }

  return user.industryInsight;
}

export async function getDashboardMetrics() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized user");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      industry: true,
      experience: true,
      bio: true,
      skills: true,
      resume: {
        select: {
          content: true,
        },
      },
      assessments: {
        orderBy: { createdAt: "asc" },
        take: 12,
        select: {
          category: true,
          createdAt: true,
          quizScore: true,
        },
      },
      industryInsight: {
        select: {
          recommendedSkills: true,
        },
      },
    },
  });

  if (!user) throw new Error("User not found");

  const interviewAssessments = await db.assessment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      category: true,
      createdAt: true,
      quizScore: true,
    },
  });

  const profileFields = [
    user.industry,
    user.experience !== null && user.experience !== undefined ? "set" : "",
    user.bio,
    user.skills?.length ? "set" : "",
  ];
  const profileCompleteness = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );
  const averageInterviewScore = interviewAssessments.length
    ? Math.round(
        interviewAssessments.reduce(
          (sum, assessment) => sum + assessment.quizScore,
          0
        ) / interviewAssessments.length
      )
    : 0;
  const userSkills = new Set((user.skills || []).map((skill) => skill.toLowerCase()));
  const recommendedSkills = user.industryInsight?.recommendedSkills || [];
  const coveredRecommendedSkills = recommendedSkills.filter((skill) =>
    userSkills.has(skill.toLowerCase())
  );
  const skillCoverage = recommendedSkills.length
    ? Math.round((coveredRecommendedSkills.length / recommendedSkills.length) * 100)
    : 0;
  const resumeReadiness = user.resume?.content ? 100 : 0;
  const practiceActivity = Math.min(100, user.assessments.length * 12);
  const careerReadinessScore = Math.round(
    profileCompleteness * 0.25 +
      resumeReadiness * 0.25 +
      averageInterviewScore * 0.25 +
      skillCoverage * 0.15 +
      practiceActivity * 0.1
  );

  return {
    profileCompleteness,
    resumeReadiness,
    averageInterviewScore,
    skillCoverage,
    practiceActivity,
    careerReadinessScore,
    assessmentsCount: user.assessments.length,
    hasResume: Boolean(user.resume?.content),
    recommendedCertifications: recommendedSkills
      .filter((skill) => !userSkills.has(skill.toLowerCase()))
      .slice(0, 4)
      .map((skill) => `${skill} certification or guided project`),
    interviewTrend: interviewAssessments.map((assessment) => ({
      date: assessment.createdAt,
      score: assessment.quizScore,
      category: assessment.category,
    })),
  };
}
