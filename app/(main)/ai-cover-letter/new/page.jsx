import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterGenerator from "../_components/cover-letter-generator";

export default function NewCoverLetterPage() {
  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1400px] -translate-x-1/2 py-6 sm:w-[calc(100vw-3rem)]">
      <div className="mb-8 flex flex-col space-y-3">
        <Link href="/ai-cover-letter">
          <Button variant="link" className="gap-2 pl-0">
            <ArrowLeft className="h-4 w-4" />
            Back to Cover Letters
          </Button>
        </Link>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_22px_70px_-40px_rgba(8,145,178,0.55)]">
          <div className="px-5 py-6 sm:px-7 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl md:text-[44px]">
              Create Cover Letter
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">
              Generate a tailored cover letter for your job application.
            </p>
          </div>
        </div>
      </div>

      <CoverLetterGenerator />
    </div>
  );
}
