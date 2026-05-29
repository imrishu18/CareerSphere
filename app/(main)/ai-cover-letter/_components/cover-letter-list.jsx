"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Eye, Trash2, Edit3 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCoverLetter } from "@/actions/cover-letter";

const previewFromContent = (content) => {
  const lines = String(content || "")
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const greetingIndex = lines.findIndex((line) =>
    /^dear hiring manager/i.test(line)
  );
  const candidateLines = (
    greetingIndex >= 0 ? lines.slice(greetingIndex + 1) : lines
  )
    .filter(
      (line) =>
        line.length > 35 &&
        !/^subject:/i.test(line) &&
        !/^sincerely/i.test(line) &&
        !/^hiring manager/i.test(line) &&
        !/^\+?\d[\d\s()-]{7,}$/.test(line) &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line) &&
        !/^https?:\/\//i.test(line)
    )
    .slice(0, 2)
    .join(" ");
  return candidateLines;
};

export default function CoverLetterList({ coverLetters }) {
  const router = useRouter();

  const handleDelete = async (id) => {
    try {
      await deleteCoverLetter(id);
      toast.success("Cover letter deleted successfully!");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to delete cover letter");
    }
  };

  if (!coverLetters?.length) {
    return (
      <Card className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_22px_65px_-45px_rgba(15,23,42,0.9)]">
        <CardHeader className="items-center px-6 py-14 text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-200">
            <Edit3 className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl font-semibold text-slate-100">
            No cover letters yet
          </CardTitle>
          <CardDescription className="max-w-md text-sm leading-6 text-slate-400">
            Create your first AI-assisted letter and keep every tailored
            application draft in one focused workspace.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {coverLetters.map((letter) => (
        <Card
          key={letter.id}
          className="group relative flex min-h-[236px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-[0_16px_45px_-35px_rgba(15,23,42,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-slate-900/80 hover:shadow-[0_22px_60px_-38px_rgba(34,211,238,0.55)]"
        >
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="truncate text-[17px] font-semibold leading-6 tracking-tight text-slate-50">
                  {letter.jobTitle}
                </CardTitle>
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
                  <span className="max-w-[11rem] truncate rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-medium text-slate-300">
                    {letter.companyName}
                  </span>
                  <span className="font-medium text-slate-500">
                    {format(new Date(letter.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            <p className="mb-6 line-clamp-2 flex-1 text-sm leading-6 text-slate-400">
              {previewFromContent(letter.content) ||
                `Recruiter-ready letter for ${letter.jobTitle} at ${letter.companyName}.`}
            </p>

            <div className="flex items-center gap-2 border-t border-white/[0.07] pt-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition-all hover:border-cyan-300/25 hover:bg-cyan-400/10 hover:text-cyan-200"
                onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
                title="Edit Cover Letter"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-slate-100"
                onClick={() => router.push(`/ai-cover-letter/${letter.id}`)}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>

              <div className="ml-auto">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition-all hover:border-rose-300/25 hover:bg-rose-500/10 hover:text-rose-300"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-white/10 bg-background/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-slate-100">
                        Delete Cover Letter?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        This action cannot be undone. This will permanently
                        delete your cover letter for {letter.jobTitle} at{" "}
                        {letter.companyName}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-slate-100">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(letter.id)}
                        className="bg-rose-600 text-rose-50 hover:bg-rose-500"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
