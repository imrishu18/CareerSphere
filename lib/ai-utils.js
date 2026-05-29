export function cleanJsonResponse(text) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export function parseJsonResponse(text, fallback) {
  try {
    return JSON.parse(cleanJsonResponse(text));
  } catch (error) {
    console.error("Failed to parse AI JSON response:", error);
    return fallback;
  }
}

export function clampScore(value) {
  const score = Number(value);
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const PREMIUM_MARKDOWN_RESPONSE_RULES = `
Global response formatting rules:
- NEVER return giant messy paragraphs or walls of text.
- Use # Main Heading for the primary topic.
- Use ## Section Heading for major categories.
- Use ### Subsection for specific details.
- Include tasteful contextual emojis (e.g., 🚀, 💡, 🎯) for headings, tips, and roadmaps to make the response feel modern and engaging. Do not overuse them.
- Use bulleted lists ONLY for: strengths, weaknesses, recommendations, technologies, interview tips, action items, skills, improvements.
- Use numbered lists ONLY for: workflows, preparation plans, roadmaps, interview steps, learning paths, processes.
- Do NOT repeat headings unnecessarily. Keep hierarchy extremely clean and intuitive.
- Use whitespace properly. Make it feel modern, concise, and highly readable.
- Avoid markdown tables unless explicitly requested.
`;
