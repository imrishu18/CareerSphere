export const MAX_REPLY_LENGTH = 12000;
export const GEMINI_TIMEOUT_MS = 20000;
export const TOKEN_BUDGETS = {
  simple: 1600,
  medium: 2600,
  roadmap: 4096,
};

const DEFAULT_REPLY =
  "We could not generate a response right now. Please try again with your target role, current skills, and timeline.";

export function buildCareerNavigatorFallback(overrides = {}) {
  return {
    success: true,
    reply: DEFAULT_REPLY,
    suggestedPrompts: [
      "Create a 30-day preparation roadmap for my target role",
      "Review the skills I should improve first",
      "Give me interview practice questions",
    ],
    fallbackUsed: true,
    ...overrides,
  };
}

export function withTimeout(promise, timeoutMs = GEMINI_TIMEOUT_MS) {
  let timeoutId;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        const error = new Error("Gemini request timed out");
        error.code = "CAREER_NAVIGATOR_TIMEOUT";
        reject(error);
      }, timeoutMs);
    }),
  ]).finally(() => clearTimeout(timeoutId));
}

export function classifyCareerNavigatorRequest(input = "") {
  const text = String(input).toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const roadmapPatterns = [
    /\b\d{1,3}\s*[- ]?\s*(day|week|month)s?\b/,
    /\broadmap\b/,
    /\bcareer transition\b/,
    /\btransition plan\b/,
    /\blearning path\b/,
    /\bstep[- ]by[- ]step\b/,
    /\bweekly plan\b/,
    /\bmonthly plan\b/,
    /\baction plan for the next\b/,
  ];

  if (roadmapPatterns.some((pattern) => pattern.test(text))) {
    return "roadmap";
  }

  const mediumPatterns = [
    /\bskill gap\b/,
    /\bgap analysis\b/,
    /\binterview prep\b/,
    /\binterview preparation\b/,
    /\bpreparation plan\b/,
    /\bportfolio\b/,
    /\bproject plan\b/,
    /\bmock interview\b/,
    /\bcompare\b/,
    /\banalyze\b/,
    /\bstrategy\b/,
    /\bimprove\b.*\bskills?\b/,
  ];

  if (mediumPatterns.some((pattern) => pattern.test(text)) || wordCount > 18) {
    return "medium";
  }

  return "simple";
}

export function getTokenBudgetForRequestType(requestType = "simple") {
  return TOKEN_BUDGETS[requestType] || TOKEN_BUDGETS.simple;
}

export function truncateReply(text, maxLength = MAX_REPLY_LENGTH) {
  const reply = typeof text === "string" ? text.trim() : "";

  if (!reply) return DEFAULT_REPLY;
  if (reply.length <= maxLength) return reply;

  const truncated = reply.slice(0, maxLength);
  const lastBreak = Math.max(
    truncated.lastIndexOf("\n## "),
    truncated.lastIndexOf("\n### "),
    truncated.lastIndexOf("\n\n")
  );
  const safeText = truncated.slice(0, lastBreak > 1200 ? lastBreak : maxLength).trim();

  return `${safeText}\n\n### Response Truncated\n\nThis plan was shortened for reliability. Ask for a deeper breakdown of any section and I will expand it.`;
}

export function normalizeAiText(text) {
  const cleaned = typeof text === "string" ? text.trim() : "";

  if (!cleaned) return "";

  const unwrapped = cleaned
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/g, "")
    .trim();

  return extractReplyFromAccidentalJson(unwrapped) || unwrapped;
}

export function extractReplyFromAccidentalJson(text) {
  if (typeof text !== "string") return "";
  const trimmed = text.trim();
  if (!trimmed) return "";

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace <= firstBrace) return "";

  const candidate = trimmed.slice(firstBrace, lastBrace + 1);
  try {
    const parsed = JSON.parse(candidate);
    return typeof parsed.reply === "string" ? parsed.reply.trim() : "";
  } catch {
    return "";
  }
}

export function getProfileTrack(profileContext = {}) {
  const text = [
    profileContext.industry,
    profileContext.subIndustry,
    ...(Array.isArray(profileContext.skills) ? profileContext.skills : []),
    profileContext.interests,
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("manufacturing") || text.includes("industrial")) {
    return "manufacturing";
  }
  if (text.includes("healthcare") || text.includes("medical") || text.includes("clinical")) {
    return "medical";
  }
  if (text.includes("finance") || text.includes("banking") || text.includes("investment")) {
    return "finance";
  }
  if (text.includes("cyber") || text.includes("security") || text.includes("soc")) {
    return "cybersecurity";
  }
  if (
    text.includes("data") ||
    text.includes("analytics") ||
    text.includes("sql") ||
    text.includes("tableau") ||
    text.includes("power bi")
  ) {
    return "dataAnalytics";
  }
  if (text.includes("backend") || text.includes("node") || text.includes("api")) {
    return "backend";
  }
  if (text.includes("frontend") || text.includes("react") || text.includes("next.js")) {
    return "frontend";
  }
  if (text.includes("technology") || text.includes("software") || text.includes("tech")) {
    return "technology";
  }

  return "general";
}

export function buildSuggestedPrompts(profileContext = {}) {
  const track = getProfileTrack(profileContext);

  const promptsByTrack = {
    manufacturing: [
      "Create a 60-day manufacturing roadmap",
      "Top manufacturing interview questions",
      "Best certifications for production planning",
      "How to improve Lean Manufacturing skills",
    ],
    medical: [
      "Create a clinical preparation roadmap",
      "Top healthcare interview questions",
      "How to improve case discussion skills",
      "Best certifications for my medical path",
    ],
    finance: [
      "Create a finance analyst roadmap",
      "Top finance interview questions",
      "How to improve financial modeling skills",
      "Best certifications for finance roles",
    ],
    cybersecurity: [
      "Create a SOC analyst roadmap",
      "Top cybersecurity interview questions",
      "How to improve network security skills",
      "Best labs for cybersecurity practice",
    ],
    dataAnalytics: [
      "Create a data analyst roadmap",
      "Top SQL interview questions",
      "Best Power BI projects",
      "How to improve analytics storytelling",
    ],
    backend: [
      "Create a backend roadmap",
      "Top system design questions",
      "Best API design projects",
      "How to improve database skills",
    ],
    frontend: [
      "Create a React roadmap",
      "Top frontend interview questions",
      "Best Next.js projects",
      "How to improve JavaScript skills",
    ],
    technology: [
      "Create a backend roadmap",
      "Top system design questions",
      "Best React projects",
      "How to improve DSA skills",
    ],
    general: [
      "Create a 30-day career roadmap",
      "Top interview questions for my role",
      "Best certifications for my profile",
      "How to improve my strongest skill gaps",
    ],
  };

  return promptsByTrack[track] || promptsByTrack.general;
}

export function buildPlainTextPrompt({
  profileContext,
  conversation,
  formattingRules,
  requestType = "simple",
}) {
  const responseScopeInstructions = {
    simple: `- Answer only the user's specific question.
- Do not add a roadmap, weekly plan, career transition plan, or broad action plan unless the user explicitly asks for one.
- Do not include an "Immediate Next Steps" section unless it is directly needed to answer the question.
- Use 1-3 compact sections maximum.`,
    medium: `- Provide a complete focused answer for the requested analysis or preparation topic.
- Include practical recommendations and measurable checkpoints when useful.
- Do not expand into a full 30/60/90-day roadmap unless the user explicitly asks for a roadmap or timeline.
- Include an "Immediate Next Steps" section only when it improves usefulness.`,
    roadmap: `- Finish every requested roadmap, transition plan, or long action plan before ending the response.
- For 30-day roadmaps, include exactly 4 weekly phases plus an "Immediate Next Steps" section.
- For 60-day or 90-day roadmaps, include phases that cover the full requested timeline from start to finish.
- Every roadmap or action plan must include measurable outputs and practical checkpoints.
- Include an "Immediate Next Steps" section with 3-5 practical actions.
- If the answer is long, compress wording instead of omitting final sections.`,
  }[requestType] || "";

  return `
You are CareerNavigator AI inside CareerSphere, a premium AI-powered career readiness platform.
Write PLAIN MARKDOWN TEXT ONLY.

Do not return JSON.
Do not wrap the response in code fences.
Do not include XML, YAML, or any machine-readable object.
Do not apologize unless a user request is impossible.

PERSONALIZATION RULES:
- Tailor all advice, roadmaps, learning paths, and interview prep specifically to the user's industry, sub-industry, skills, experience, and goals.
- Different users must receive different technologies, interview questions, and career paths based on their profile.
- If profile fields are "Not specified", provide graceful fallback advice and ask for the missing context.
- Adapt the complexity of your advice to the user's experience level.
- Do not claim certifications, projects, grades, or experience the user did not provide.

RESPONSE RULES:
- Keep the answer focused, but complete. Do not stop midway through a plan.
- Match the response depth to this request type: ${requestType}.
${responseScopeInstructions}
- Avoid giant walls of text.
${formattingRules}

Profile context:
${JSON.stringify(profileContext, null, 2)}

Recent conversation:
${conversation}
`;
}

export function buildApiResponse({ aiText, profileContext, fallbackUsed = false }) {
  const normalized = normalizeAiText(aiText);
  const reply = truncateReply(normalized || DEFAULT_REPLY);

  return {
    success: true,
    reply,
    suggestedPrompts: buildSuggestedPrompts(profileContext).slice(0, 4),
    fallbackUsed: fallbackUsed || !normalized,
  };
}

export function buildFailureResponse({ profileContext, reply = DEFAULT_REPLY } = {}) {
  return {
    ...buildCareerNavigatorFallback({ reply }),
    suggestedPrompts: buildSuggestedPrompts(profileContext).slice(0, 4),
  };
}
