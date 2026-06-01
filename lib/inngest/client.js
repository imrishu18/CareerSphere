import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "careersphere",
  name: "CareerSphere",
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_INDUSTRY_INSIGHTS_API_KEY,
    },
  },
});
