import {
  Bot,
  FileCheck2,
  FileSearch,
  LineChart,
  MessageSquareText,
  PenLine,
} from "lucide-react";

export const features = [
  {
    icon: <FileCheck2 className="mb-4 h-10 w-10 text-cyan-300" />,
    title: "AI Resume Builder",
    description:
      "Create ATS-friendly resumes with stronger wording, clean structure, and recruiter-ready formatting.",
  },
  {
    icon: <FileSearch className="mb-4 h-10 w-10 text-emerald-300" />,
    title: "Resume Matcher",
    description:
      "Compare your resume against job descriptions, uncover missing skills, and improve your match score.",
  },
  {
    icon: <Bot className="mb-4 h-10 w-10 text-violet-300" />,
    title: "CareerNavigator AI",
    description:
      "Get conversational career guidance, skill roadmaps, resume advice, and job preparation support.",
  },
  {
    icon: <MessageSquareText className="mb-4 h-10 w-10 text-amber-300" />,
    title: "Interview Preparation",
    description:
      "Practice role-specific questions, review performance analytics, and receive improvement tips.",
  },
  {
    icon: <LineChart className="mb-4 h-10 w-10 text-sky-300" />,
    title: "Industry Insights",
    description:
      "Explore market trends, salary ranges, recommended skills, and career demand signals.",
  },
  {
    icon: <PenLine className="mb-4 h-10 w-10 text-rose-300" />,
    title: "Cover Letter Studio",
    description:
      "Generate polished, role-specific cover letters with professional PDF export.",
  },
];
