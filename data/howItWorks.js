import { Bot, ClipboardCheck, FileSearch, UserPlus } from "lucide-react";

export const howItWorks = [
  {
    title: "Build Your Profile",
    description: "Add your industry, experience, and skills for personalized guidance.",
    icon: <UserPlus className="h-8 w-8 text-cyan-300" />,
  },
  {
    title: "Create Career Documents",
    description: "Build resumes and cover letters with AI-enhanced wording.",
    icon: <ClipboardCheck className="h-8 w-8 text-emerald-300" />,
  },
  {
    title: "Match Target Roles",
    description: "Analyze resume fit against job descriptions and close skill gaps.",
    icon: <FileSearch className="h-8 w-8 text-violet-300" />,
  },
  {
    title: "Navigate Your Next Move",
    description: "Use CareerNavigator AI and interview analytics to prepare with confidence.",
    icon: <Bot className="h-8 w-8 text-amber-300" />,
  },
];
