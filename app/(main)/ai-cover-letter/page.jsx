import { getCoverLetters } from "@/actions/cover-letter";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoverLetterList from "./_components/cover-letter-list";

export default async function CoverLetterPage() {
  const coverLetters = await getCoverLetters();
  const totalLetters = coverLetters?.length || 0;

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1400px] -translate-x-1/2 px-0 sm:w-[calc(100vw-3rem)]">
      <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_22px_70px_-40px_rgba(8,145,178,0.55)]">
        <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
              AI writing workspace
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl md:text-[44px]">
              Cover Letter Studio
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">
              Manage polished, recruiter-ready cover letters for every role in
              your application pipeline.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Saved letters
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-100">
                {totalLetters}
              </p>
            </div>
            <Link href="/ai-cover-letter/new">
              <Button className="h-11 rounded-xl border border-cyan-400/25 bg-cyan-500 px-5 font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(34,211,238,0.75)] transition-all hover:bg-cyan-400">
                <Plus className="h-4 w-4" />
                Create New
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <CoverLetterList coverLetters={coverLetters} />
    </div>
  );
}
