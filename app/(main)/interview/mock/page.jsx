import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Quiz from "../_components/quiz";

export default function MockInterviewPage() {
  return (
    <div className="container mx-auto space-y-4 py-6">
      <div className="mx-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_22px_70px_-40px_rgba(8,145,178,0.55)]">
        <div className="px-5 py-6 sm:px-7 lg:px-8">
          <Link href="/interview">
            <Button
              variant="link"
              className="mb-4 gap-2 pl-0 text-slate-400 hover:text-cyan-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Interview Preparation
            </Button>
          </Link>

          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
              AI interview practice
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl md:text-[44px]">
              Mock Interview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">
              Test your knowledge with industry-specific questions.
            </p>
          </div>
        </div>
      </div>

      <Quiz />
    </div>
  );
}
