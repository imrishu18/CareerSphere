import assert from "node:assert/strict";
import {
  GEMINI_TIMEOUT_MS,
  MAX_REPLY_LENGTH,
  buildApiResponse,
  buildFailureResponse,
  buildPlainTextPrompt,
  buildSuggestedPrompts,
  classifyCareerNavigatorRequest,
  getTokenBudgetForRequestType,
  getProfileTrack,
  withTimeout,
} from "../app/api/career-navigator/response-helpers.js";

const profiles = {
  manufacturing: {
    industry: "manufacturing-industrial-manufacturing",
    subIndustry: "Industrial Manufacturing",
    skills: ["Lean Manufacturing", "Production Planning"],
  },
  technology: {
    industry: "tech-software-development",
    subIndustry: "Software Development",
    skills: ["React", "Node.js", "DSA"],
  },
  medical: {
    industry: "healthcare-healthcare-services",
    subIndustry: "Healthcare Services",
    skills: ["Clinical Communication", "Anatomy"],
  },
  finance: {
    industry: "finance-investment-banking",
    subIndustry: "Investment Banking",
    skills: ["Financial Modeling", "Valuation"],
  },
  cybersecurity: {
    industry: "tech-cybersecurity",
    subIndustry: "Cybersecurity",
    skills: ["SOC", "Network Security"],
  },
  dataAnalytics: {
    industry: "tech-data-science-&-analytics",
    subIndustry: "Data Science & Analytics",
    skills: ["SQL", "Power BI", "Tableau"],
  },
};

function assertSafeResponse(response) {
  assert.equal(response.success, true);
  assert.equal(typeof response.reply, "string");
  assert.ok(response.reply.trim().length > 0);
  assert.ok(Array.isArray(response.suggestedPrompts));
  assert.ok(response.suggestedPrompts.length >= 3);
  assert.equal(typeof response.fallbackUsed, "boolean");
}

assert.equal(classifyCareerNavigatorRequest("What skills should I learn?"), "simple");
assert.equal(
  classifyCareerNavigatorRequest("Top certifications for data analyst?"),
  "simple"
);
assert.equal(
  classifyCareerNavigatorRequest("Create an interview preparation plan"),
  "medium"
);
assert.equal(classifyCareerNavigatorRequest("Skill gap analysis"), "medium");
assert.equal(classifyCareerNavigatorRequest("Create a 30-day roadmap"), "roadmap");
assert.equal(
  classifyCareerNavigatorRequest("Create a career transition plan"),
  "roadmap"
);
assert.ok(getTokenBudgetForRequestType("simple") < getTokenBudgetForRequestType("medium"));
assert.ok(getTokenBudgetForRequestType("medium") < getTokenBudgetForRequestType("roadmap"));

const prompt = buildPlainTextPrompt({
  profileContext: profiles.technology,
  conversation: "User: Create a 30-day roadmap",
  formattingRules: "",
  requestType: "roadmap",
});

assert.match(prompt, /PLAIN MARKDOWN TEXT ONLY/);
assert.match(prompt, /Do not return JSON/);
assert.match(prompt, /finish every requested roadmap/i);
assert.match(prompt, /exactly 4 weekly phases/i);
assert.doesNotMatch(prompt, /suggestedPrompts/);

const simplePrompt = buildPlainTextPrompt({
  profileContext: profiles.dataAnalytics,
  conversation: "User: Top SQL certifications?",
  formattingRules: "",
  requestType: "simple",
});
assert.match(simplePrompt, /Answer only the user's specific question/);
assert.match(simplePrompt, /Do not add a roadmap/);
assert.doesNotMatch(simplePrompt, /exactly 4 weekly phases/);

assertSafeResponse(
  buildApiResponse({
    aiText: "# Backend Roadmap\n\n### Immediate Next Steps\n\n- Build one API",
    profileContext: profiles.technology,
  })
);

const longRoadmap = "# 90-Day Roadmap\n\n".repeat(900);
const truncated = buildApiResponse({
  aiText: longRoadmap,
  profileContext: profiles.technology,
});
assertSafeResponse(truncated);
assert.ok(truncated.reply.length <= MAX_REPLY_LENGTH + 180);
assert.match(truncated.reply, /Response Truncated/);

assertSafeResponse(
  buildApiResponse({
    aiText: "# 30-Day Roadmap\n\nWeek 1: fundamentals",
    profileContext: profiles.technology,
  })
);

assertSafeResponse(
  buildApiResponse({
    aiText: "# Interview Preparation\n\n### Immediate Next Steps\n\n- Practice 5 questions",
    profileContext: profiles.technology,
  })
);

const emptyResponse = buildApiResponse({
  aiText: "",
  profileContext: profiles.technology,
});
assertSafeResponse(emptyResponse);
assert.equal(emptyResponse.fallbackUsed, true);

assertSafeResponse(
  buildApiResponse({
    aiText: "{ this is not json and it is fine because plain text is accepted }",
    profileContext: profiles.technology,
  })
);

const accidentalJson = buildApiResponse({
  aiText:
    '```json\n{"reply":"# Complete Roadmap\\n\\n## Phase 1\\n\\nFinish fundamentals.\\n\\n### Immediate Next Steps\\n\\n- Start today","suggestedPrompts":["ignored"]}\n```',
  profileContext: profiles.technology,
});
assertSafeResponse(accidentalJson);
assert.match(accidentalJson.reply, /Complete Roadmap/);
assert.doesNotMatch(accidentalJson.reply, /suggestedPrompts/);

const quotaFallback = buildFailureResponse({
  profileContext: profiles.technology,
  reply: "We could not generate a response right now. Please try again.",
});
assertSafeResponse(quotaFallback);
assert.equal(quotaFallback.fallbackUsed, true);

await assert.rejects(
  () => withTimeout(new Promise((resolve) => setTimeout(resolve, 25)), 1),
  /timed out/
);
assert.ok(GEMINI_TIMEOUT_MS <= 20000);

assert.equal(getProfileTrack(profiles.manufacturing), "manufacturing");
assert.match(buildSuggestedPrompts(profiles.manufacturing).join(" "), /manufacturing/i);

assert.equal(getProfileTrack(profiles.technology), "backend");
assert.match(buildSuggestedPrompts(profiles.technology).join(" "), /backend|system design|DSA/i);

assert.equal(getProfileTrack(profiles.medical), "medical");
assert.match(buildSuggestedPrompts(profiles.medical).join(" "), /clinical|healthcare|medical/i);

assert.equal(getProfileTrack(profiles.finance), "finance");
assert.match(buildSuggestedPrompts(profiles.finance).join(" "), /finance|financial/i);

assert.equal(getProfileTrack(profiles.cybersecurity), "cybersecurity");
assert.match(buildSuggestedPrompts(profiles.cybersecurity).join(" "), /cybersecurity|SOC|network/i);

assert.equal(getProfileTrack(profiles.dataAnalytics), "dataAnalytics");
assert.match(buildSuggestedPrompts(profiles.dataAnalytics).join(" "), /data|SQL|analytics/i);

console.log("Career Navigator response helper tests passed.");
