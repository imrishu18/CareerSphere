"use client";

import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import {
  ArrowLeft,
  Download,
  Edit3,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { updateCoverLetter, regenerateCoverLetter } from "@/actions/cover-letter";

const slug = (value) =>
  value
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "cover-letter";

const CoverLetterPreview = ({
  id,
  content: initialContent,
  jobTitle,
  companyName,
}) => {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const downloadPDF = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById("cover-letter-pdf");
      await html2pdf()
        .set({
          margin: [0, 0],
          filename: `careersphere-${slug(companyName)}-${slug(jobTitle)}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            windowWidth: 794,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .save();
    } catch (error) {
      console.error("Cover letter PDF error:", error);
      toast.error("Failed to download cover letter PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCoverLetter(id, content);
      setIsEditing(false);
      toast.success("Cover letter updated successfully");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to save cover letter");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const updated = await regenerateCoverLetter(id);
      setContent(updated.content);
      toast.success("Cover letter regenerated successfully");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Failed to regenerate cover letter");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1480px] -translate-x-1/2 space-y-5 sm:w-[calc(100vw-3rem)]">
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-2.5 shadow-[0_24px_80px_-48px_rgba(8,145,178,0.7)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3 px-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-xl px-3.5 text-slate-400 transition-all hover:bg-white/[0.07] hover:text-slate-100"
              onClick={() => router.push("/ai-cover-letter")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="hidden h-8 w-px bg-white/10 sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                {jobTitle}
              </p>
              <p className="truncate text-xs text-slate-500">
                {companyName} cover letter
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl px-4 text-slate-400 transition-all hover:bg-white/[0.07] hover:text-slate-100"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-10 rounded-xl border border-cyan-200/30 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 px-4 font-semibold text-white shadow-[0_14px_30px_-18px_rgba(14,165,233,0.95)] transition-all hover:-translate-y-0.5 hover:from-cyan-400 hover:via-sky-400 hover:to-blue-400 hover:shadow-[0_18px_36px_-18px_rgba(14,165,233,1)]"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl px-4 text-slate-400 transition-all hover:bg-white/[0.07] hover:text-slate-100"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl px-4 text-slate-400 transition-all hover:bg-white/[0.07] hover:text-slate-100"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                >
                  <RotateCcw
                    className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
                  />
                  {regenerating ? "Regenerating..." : "Regenerate"}
                </Button>
                <Button
                  size="sm"
                  className="h-11 rounded-xl border border-cyan-400/25 bg-cyan-500 px-5 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(34,211,238,0.75)] transition-all hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-[0_18px_36px_-18px_rgba(34,211,238,0.95)]"
                  onClick={downloadPDF}
                  disabled={downloading || !content || regenerating}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_80px_-60px_rgba(15,23,42,0.95)] sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        {isEditing ? (
          <div className="mx-auto w-full max-w-[1120px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/25">
            <MDEditor
              value={content}
              onChange={setContent}
              height={720}
              className="!bg-transparent"
            />
          </div>
        ) : (
          <article className="mx-auto w-full max-w-[1140px] rounded-[22px] border border-white/[0.11] bg-[#111827] px-6 py-8 text-slate-100 shadow-[0_30px_90px_-54px_rgba(0,0,0,0.95),0_12px_32px_-28px_rgba(14,165,233,0.55),inset_0_1px_0_rgba(255,255,255,0.055)] sm:px-10 sm:py-10 lg:px-14 lg:py-11 xl:px-16">
            <header className="mb-7 border-b border-white/[0.08] pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                Cover Letter
              </p>
              <h1 className="mt-3 text-2xl font-semibold leading-tight text-slate-50 sm:text-[31px]">
                {jobTitle}
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-400">
                {companyName}
              </p>
            </header>

            <div className="text-[15.5px] leading-[1.82] text-slate-200 sm:text-base">
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => (
                    <p className="mb-[18px] text-slate-200 last:mb-0" {...props} />
                  ),
                  h1: ({ node, ...props }) => (
                    <h1
                      className="mb-5 mt-8 border-b border-white/[0.08] pb-3 text-2xl font-semibold text-slate-50"
                      {...props}
                    />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="mb-4 mt-8 border-b border-white/[0.07] pb-2 text-xl font-semibold text-slate-50"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="mb-3 mt-7 text-lg font-semibold text-slate-100"
                      {...props}
                    />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="mb-5 list-outside list-disc space-y-2 pl-6 text-slate-200 marker:text-cyan-300/75"
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol
                      className="mb-5 list-outside list-decimal space-y-2 pl-6 text-slate-200 marker:text-cyan-300/75"
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                  strong: ({ node, ...props }) => (
                    <strong className="font-semibold text-slate-50" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      className="font-medium text-cyan-300 underline-offset-4 transition-colors hover:text-cyan-200 hover:underline"
                      {...props}
                    />
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </article>
        )}
      </div>

      <div className="hidden">
        <CoverLetterPdfDocument
          id="cover-letter-pdf"
          content={content}
          jobTitle={jobTitle}
          companyName={companyName}
        />
      </div>
    </div>
  );
};

function CoverLetterPdfDocument({ id, content, jobTitle, companyName }) {
  const cleanContent = String(content || "")
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .trim();
  const paragraphs = cleanContent
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const wordCount = cleanContent.split(/\s+/).filter(Boolean).length;

  return (
    <article
      id={id}
      className={`cover-letter-pdf cover-letter-pdf-page ${
        wordCount > 360 ? "compact" : ""
      }`}
    >
      <div className="cover-letter-body">
        {paragraphs.length ? (
          paragraphs.map((paragraph, index) => (
            <p key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>
          ))
        ) : (
          <p>
            Cover letter for {jobTitle} at {companyName}.
          </p>
        )}
      </div>
    </article>
  );
}

export default CoverLetterPreview;
