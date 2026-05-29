"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateCoverLetter } from "@/actions/cover-letter";
import useFetch from "@/hooks/use-fetch";
import { coverLetterSchema } from "@/app/lib/schema";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_RESUME_EXTENSIONS = ["pdf", "doc", "docx"];
const MAX_RESUME_SIZE = 5 * 1024 * 1024;

function getFileExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function formatFileSize(size = 0) {
  if (!size) return "0 KB";
  const sizeInMb = size / (1024 * 1024);
  return sizeInMb >= 1
    ? `${sizeInMb.toFixed(1)} MB`
    : `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function CoverLetterGenerator() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState("");
  const [dragging, setDragging] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(coverLetterSchema),
  });

  const {
    loading: generating,
    fn: generateLetterFn,
    data: generatedLetter,
  } = useFetch(generateCoverLetter);

  // Update content when letter is generated
  useEffect(() => {
    if (generatedLetter) {
      toast.success("Cover letter generated successfully!");
      router.push(`/ai-cover-letter/${generatedLetter.id}`);
      reset();
      setResumeFile(null);
      setResumeError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [generatedLetter]);

  const handleResumeFile = (file) => {
    if (!file) return;

    const extension = getFileExtension(file.name);
    const isAccepted =
      ACCEPTED_RESUME_TYPES.includes(file.type) ||
      ACCEPTED_RESUME_EXTENSIONS.includes(extension);

    if (!isAccepted) {
      setResumeFile(null);
      setResumeError("Upload a PDF, DOC, or DOCX resume.");
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      setResumeFile(null);
      setResumeError("Resume file must be 5MB or smaller.");
      return;
    }

    setResumeError("");
    setResumeFile(file);
  };

  const removeResume = (event) => {
    event.stopPropagation();
    setResumeFile(null);
    setResumeError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("companyName", data.companyName);
      formData.append("jobTitle", data.jobTitle);
      formData.append("jobDescription", data.jobDescription);
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      await generateLetterFn(formData);
    } catch (error) {
      toast.error(error.message || "Failed to generate cover letter");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-slate-950/55 shadow-[0_22px_70px_-44px_rgba(8,145,178,0.45)]">
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
          <CardDescription>
            Provide the target role so CareerSphere can generate a tailored, recruiter-ready letter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Form fields remain the same */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., Google"
                  className="bg-background/70"
                  {...register("companyName")}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-500">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Associate Software Engineer"
                  className="bg-background/70"
                  {...register("jobTitle")}
                />
                {errors.jobTitle && (
                  <p className="text-sm text-red-500">
                    {errors.jobTitle.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 md:w-[calc(50%-0.5rem)]">
              <Label>Resume Upload</Label>
              <div
                className={`group cursor-pointer rounded-xl border border-dashed px-3.5 py-3 shadow-sm transition-colors duration-200 ${
                  dragging
                    ? "border-cyan-300/70 bg-cyan-400/[0.04] ring-1 ring-cyan-300/15"
                    : "border-input bg-background/70 hover:border-cyan-300/45"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  handleResumeFile(event.dataTransfer.files?.[0]);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(event) => handleResumeFile(event.target.files?.[0])}
                />

                {resumeFile ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-cyan-300">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-300" />
                          <p className="truncate text-sm font-semibold text-slate-100">
                            {resumeFile.name}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          Ready for AI context - {formatFileSize(resumeFile.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs text-slate-300 hover:bg-white/[0.07] hover:text-slate-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-rose-300"
                        onClick={removeResume}
                        title="Remove resume"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-cyan-300">
                        <UploadCloud className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100">
                          Upload Resume
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          PDF, DOC, DOCX - Max 5MB
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Adds resume-backed skills, projects, and achievements.
                        </p>
                      </div>
                    </div>
                    <div className="flex h-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-cyan-200 transition-colors duration-200 group-hover:border-cyan-300/35 group-hover:bg-cyan-400/[0.06] sm:shrink-0">
                      Browse
                    </div>
                  </div>
                )}
              </div>
              {resumeError && (
                <p className="text-sm text-red-500">{resumeError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                placeholder="Paste responsibilities, required skills, and qualifications from the job description."
                className="h-40 bg-background/70"
                {...register("jobDescription")}
              />
              {errors.jobDescription && (
                <p className="text-sm text-red-500">
                  {errors.jobDescription.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                type="submit"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating polished letter...
                  </>
                ) : (
                  "Generate Cover Letter"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
