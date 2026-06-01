import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/prisma";
import { PREMIUM_MARKDOWN_RESPONSE_RULES } from "@/lib/ai-utils";
import {
  GEMINI_TIMEOUT_MS,
  buildApiResponse,
  buildCareerNavigatorFallback,
  buildFailureResponse,
  buildPlainTextPrompt,
  classifyCareerNavigatorRequest,
  getTokenBudgetForRequestType,
  withTimeout,
} from "./response-helpers";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_CAREER_NAVIGATOR_API_KEY);

function getCareerNavigatorModel(maxOutputTokens) {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      maxOutputTokens,
      temperature: 0.45,
    },
  });
}

const fallback = buildCareerNavigatorFallback();

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
    const requestType = classifyCareerNavigatorRequest(latest);
    const tokenBudget = getTokenBudgetForRequestType(requestType);

    const prompt = buildPlainTextPrompt({
      profileContext,
      conversation,
      formattingRules: PREMIUM_MARKDOWN_RESPONSE_RULES,
      requestType,
    });

    try {
      console.info("[CareerNavigator] AI request started");
      console.info("[CareerNavigator] Request classification", {
        requestType,
        tokenBudget,
      });
      console.info("[CareerNavigator] Prompt length", {
        length: prompt.length,
      });
      const startedAt = Date.now();
      const result = await withTimeout(
        getCareerNavigatorModel(tokenBudget).generateContent(prompt),
        GEMINI_TIMEOUT_MS
      );
      const responseTimeMs = Date.now() - startedAt;
      const aiText = result?.response?.text?.() || "";
      console.info("[CareerNavigator] AI response received");
      console.info("[CareerNavigator] Gemini response time", {
        responseTimeMs,
      });
      console.info("[CareerNavigator] Response length", {
        length: aiText.length,
      });

      const response = buildApiResponse({
        aiText,
        profileContext,
        fallbackUsed: !aiText.trim(),
      });
      console.info("[CareerNavigator] Formatted response length", {
        length: response.reply.length,
      });

      if (response.fallbackUsed) {
        console.warn("[CareerNavigator] Fallback activated");
      }

      return NextResponse.json(response);
    } catch (error) {
      const isTimeout = error?.code === "CAREER_NAVIGATOR_TIMEOUT";
      console.error(
        isTimeout
          ? "[CareerNavigator] Timeout activated"
          : "[CareerNavigator] API failure",
        {
          error: error?.message || error,
        }
      );
      console.warn("[CareerNavigator] Fallback activated");

      return NextResponse.json(buildFailureResponse({ profileContext, reply: fallback.reply }));
    }
  } catch (error) {
    console.error("CareerNavigator error:", {
      error: error?.message || error,
    });
    console.warn("[CareerNavigator] Fallback activated");
    return NextResponse.json(buildFailureResponse());
  }
}
