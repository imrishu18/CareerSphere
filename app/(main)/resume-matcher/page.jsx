"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  FileSearch,
  Loader2,
  RefreshCw,
  Sparkles,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

const initialResult = null;

function scoreTone(score) {
  if (score >= 85) return "text-emerald-300";
  if (score >= 70) return "text-cyan-300";
  if (score >= 55) return "text-amber-300";
  return "text-rose-300";
}

export default function ResumeMatcherPage() {
  const fileInputRef = useRef(null);
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [result, setResult] = useState(initialResult);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const canAnalyze = resumeFile && jobDescription.trim().length >= 60 && !loading;
  const showErrorState = Boolean(error) && !loading && !result;

  const categoryRows = useMemo(() => {
    if (!result?.categoryScores) return [];
    return [
      ["Technical skills", result.categoryScores.technicalSkills],
      ["Experience fit", result.categoryScores.experienceFit],
      ["Education fit", result.categoryScores.educationFit],
      ["Keyword alignment", result.categoryScores.keywordAlignment],
      ["Presentation", result.categoryScores.presentation],
    ];
  }, [result]);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF resume only.");
      setResumeFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Resume PDF must be 5MB or smaller.");
      setResumeFile(null);
      return;
    }
    setError("");
    setResumeFile(file);
  };

  const analyzeResume = async () => {
    if (!resumeFile) {
      setError("Please upload your resume PDF.");
      return;
    }
    if (jobDescription.trim().length < 60) {
      setError("Please paste a complete job description before analyzing.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/resume-matcher", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Resume analysis failed.");
      }
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setJobDescription("");
    setResumeFile(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadReport = () => {
    if (!result) return;
    const report = `CareerSphere Resume Match Report
Generated: ${new Date(result.analyzedAt).toLocaleString()}
File: ${result.fileName}

Match Score: ${result.matchScore}%
ATS Score: ${result.atsScore}%

Summary:
${result.summary}

Resume Strengths:
${(result.strengths || []).map((item) => `- ${item}`).join("\n")}

Matched Keywords:
${result.matchedKeywords.map((item) => `- ${item}`).join("\n")}

Missing Skills:
${result.missingSkills.map((item) => `- ${item}`).join("\n")}

Improvement Suggestions:
${result.improvementSuggestions.map((item) => `- ${item}`).join("\n")}
`;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "careersphere-resume-match-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1420px] -translate-x-1/2 space-y-5 sm:w-[calc(100vw-3rem)]">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/55 px-5 py-5 shadow-[0_22px_70px_-48px_rgba(8,145,178,0.55)] md:flex-row md:items-center md:justify-between lg:px-7">
        <div className="max-w-4xl">
          <Badge className="mb-3 border border-cyan-400/15 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15">
            <Sparkles className="mr-2 h-3 w-3" />
            ATS-style AI analysis
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50 md:text-[42px]">
            Resume Matcher & Score Analysis
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-[15px]">
            Upload your PDF resume, paste a target job description, and get a
            structured match score with keyword gaps and improvement actions.
          </p>
        </div>
        {result && (
          <Button
            variant="outline"
            className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-slate-300 transition-all hover:bg-white/[0.08] hover:text-slate-50"
            onClick={reset}
          >
            <RefreshCw className="h-4 w-4" />
            New Analysis
          </Button>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <Card className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
          <CardHeader className="px-5 pb-2 pt-4">
            <CardTitle className="text-lg font-semibold text-slate-50">
              Input Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-4">
            <div
              className={`cursor-pointer rounded-2xl border border-dashed p-5 text-center transition-all duration-200 hover:-translate-y-0.5 ${
                dragging
                  ? "border-cyan-300 bg-cyan-400/10 shadow-[0_18px_40px_-28px_rgba(34,211,238,0.85)]"
                  : "border-white/15 bg-white/[0.03] hover:border-cyan-300/45 hover:bg-white/[0.05]"
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
                handleFile(event.dataTransfer.files?.[0]);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              {resumeFile ? (
                <div className="space-y-2">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-300" />
                  <p className="font-semibold text-slate-100">{resumeFile.name}</p>
                  <p className="text-sm text-slate-500">Click to replace the file.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="mx-auto h-9 w-9 text-cyan-300" />
                  <p className="font-semibold text-slate-100">Drop your PDF resume here</p>
                  <p className="text-sm text-slate-500">PDF only, up to 5MB.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-200">Target job description</span>
                <span className="text-slate-500">{jobDescription.length} characters</span>
              </div>
              <Textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the full job description, including responsibilities, required skills, qualifications, and preferred experience."
                className="min-h-[210px] resize-none rounded-xl border-white/10 bg-slate-950/80 text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-400"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              className="h-11 w-full rounded-xl border border-cyan-400/25 bg-cyan-500 font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(34,211,238,0.75)] transition-all hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-[0_18px_36px_-18px_rgba(34,211,238,0.95)]"
              disabled={!canAnalyze}
              onClick={analyzeResume}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing resume...
                </>
              ) : (
                <>
                  <FileSearch className="h-4 w-4" />
                  Generate Match Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
          <CardHeader className="flex flex-row items-center justify-between px-5 pb-2 pt-4">
            <CardTitle className="text-lg font-semibold text-slate-50">
              Analysis Results
            </CardTitle>
            {result && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-slate-50"
                onClick={downloadReport}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent
            className={`px-4 pb-4 sm:px-5 ${
              result ? "" : "min-h-[448px] lg:min-h-[456px]"
            }`}
          >
            {loading && (
              <AnalysisSkeleton />
            )}

            {showErrorState && (
              <div className="flex min-h-[416px] flex-col items-center justify-center text-center lg:min-h-[424px]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-400/10">
                  <AlertCircle className="h-6 w-6 text-rose-300" />
                </div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Analysis paused
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  {error}
                </p>
              </div>
            )}

            {!loading && !result && !showErrorState && (
              <div className="flex min-h-[416px] flex-col items-center justify-center text-center lg:min-h-[424px]">
                <BarChart3 className="mb-4 h-14 w-14 text-muted-foreground" />
                <h2 className="text-xl font-bold text-slate-100">Ready for analysis</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Your match score, skill gaps, strengths, and recommendations will appear here.
                </p>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-3">
                <div className="grid items-start gap-3 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <ScoreCard
                      label="ATS readiness"
                      score={result.atsScore}
                      tone="emerald"
                    />
                    <ScoreCard
                      label="Match score"
                      score={result.matchScore}
                      tone="cyan"
                    />
                  </div>
                  <KeywordChips
                    title="Missing Skills"
                    icon={<XCircle className="h-4 w-4 text-rose-300" />}
                    items={result.missingSkills}
                    empty="No missing skills returned."
                    compact
                  />
                </div>

                <div className="grid items-stretch gap-3 xl:grid-cols-[0.95fr_1.05fr]">
                  <section className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                      Recruiter summary
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {result.summary}
                    </p>
                  </section>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {categoryRows.map(([label, value]) => (
                      <CategoryMeter key={label} label={label} value={value} />
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-3">
                  <InsightList
                    title="Resume Strengths"
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                    items={result.strengths}
                    empty="No strengths returned."
                  />
                  <KeywordChips
                    title="Keyword Matches"
                    icon={<CheckCircle2 className="h-4 w-4 text-cyan-300" />}
                    items={result.matchedKeywords}
                    empty="No matched keywords returned."
                  />
                  <InsightList
                    title="ATS Improvements"
                    icon={<Sparkles className="h-4 w-4 text-cyan-300" />}
                    items={result.improvementSuggestions}
                    empty="No recommendations returned."
                    numbered
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InsightList({
  title,
  icon,
  items,
  empty,
  numbered = false,
  compact = false,
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_14px_40px_-34px_rgba(15,23,42,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.055] ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-100">
        {icon}
        {title}
      </div>
      {items?.length ? (
        <ul className="space-y-2 text-sm leading-5 text-slate-400">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2">
              <span className="shrink-0 text-cyan-300">
                {numbered ? `${index + 1}.` : "-"}
              </span>
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{empty}</p>
      )}
    </div>
  );
}

function KeywordChips({ title, icon, items, empty, compact = false }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_14px_40px_-34px_rgba(15,23,42,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.055] ${
        compact ? "p-3.5" : "p-4"
      }`}
    >
      <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-slate-100">
        {icon}
        {title}
      </div>
      {items?.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="max-w-full rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 text-xs font-medium leading-5 text-cyan-100"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">{empty}</p>
      )}
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="flex min-h-[416px] items-center justify-center lg:min-h-[424px]">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_18px_46px_-24px_rgba(34,211,238,0.85)]">
          <Loader2 className="h-7 w-7 animate-spin text-cyan-300" />
        </div>
        <h2 className="text-lg font-semibold text-slate-100">
          Generating ATS Analysis...
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Analyzing resume structure, keywords, and recruiter alignment.
        </p>
      </div>
    </div>
  );
}

function ScoreCard({ label, score, tone }) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-300/20 bg-emerald-400/10 shadow-emerald-950/20 hover:border-emerald-300/35"
      : "border-cyan-300/20 bg-cyan-400/10 shadow-cyan-950/20 hover:border-cyan-300/35";

  return (
    <div
      className={`flex min-h-[96px] flex-col items-center justify-center rounded-2xl border px-4 py-3.5 text-center shadow-[0_18px_50px_-36px_rgba(34,211,238,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-40px_rgba(34,211,238,0.85)] ${toneClasses}`}
    >
      <p className={`text-center text-3xl font-black leading-none tracking-tight ${scoreTone(score)}`}>
        {score}%
      </p>
      <p className="mt-1.5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
    </div>
  );
}

function CategoryMeter({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.05]">
      <div className="mb-1.5 flex justify-between gap-3 text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className={`font-semibold ${scoreTone(value)}`}>{value}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
