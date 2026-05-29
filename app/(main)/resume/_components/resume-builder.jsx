"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  Edit,
  Loader2,
  Monitor,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveResume } from "@/actions/resume";
import { EntryForm } from "./entry-form";
import useFetch from "@/hooks/use-fetch";
import {
  buildResumeMarkdown,
  descriptionToBulletItems,
  normalizeResumeFormData,
  parseResumeContent,
  serializeResumeContent,
} from "@/app/lib/helper";
import { resumeSchema } from "@/app/lib/schema";

export default function ResumeBuilder({ initialContent }) {
  const parsedInitialContent = useMemo(
    () => parseResumeContent(initialContent),
    [initialContent]
  );
  const [activeTab, setActiveTab] = useState("edit");
  const [previewContent, setPreviewContent] = useState(
    parsedInitialContent.markdown
  );
  const [resumeMode, setResumeMode] = useState("preview");
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useUser();

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resumeSchema),
    defaultValues: parsedInitialContent.formData,
    shouldUnregister: false,
    mode: "onChange",
  });

  const {
    loading: isSaving,
    fn: saveResumeFn,
    data: saveResult,
    error: saveError,
  } = useFetch(saveResume);

  const formValues = watch();

  useEffect(() => {
    if (parsedInitialContent.markdown) {
      setPreviewContent(parsedInitialContent.markdown);
      setActiveTab("preview");
    }
  }, [parsedInitialContent.markdown]);

  useEffect(() => {
    if (activeTab === "edit") {
      const newContent = getCombinedContent();
      setPreviewContent(newContent || parsedInitialContent.markdown);
    }
  }, [formValues, activeTab, parsedInitialContent.markdown]);

  useEffect(() => {
    if (saveResult && !isSaving) {
      toast.success("Resume saved successfully!");
    }
    if (saveError) {
      toast.error(saveError.message || "Failed to save resume");
    }
  }, [saveResult, saveError, isSaving]);

  const getCombinedContent = () => {
    return buildResumeMarkdown(formValues, user?.fullName || "Your Name");
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("resume-pdf");
      const opt = {
        margin: [0, 0],
        filename: "careersphere-resume.pdf",
        image: { type: "jpeg", quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: 794,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all"] },
      };

      const html2pdf = (await import("html2pdf.js/dist/html2pdf.min.js")).default;
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async () => {
    const sourceContent =
      activeTab === "preview" && resumeMode === "edit"
        ? previewContent
        : buildResumeMarkdown(formValues, user?.fullName || "Your Name");
    const formattedContent = sourceContent
      .replace(/\n/g, "\n")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    await saveResumeFn(
      serializeResumeContent({
        formData: normalizeResumeFormData(formValues),
        markdown: formattedContent,
      })
    );
  };

  return (
    <div data-color-mode="light" className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mx-auto w-full max-w-[1420px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_22px_70px_-40px_rgba(8,145,178,0.55)]">
          <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                AI Resume Builder
              </h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">
                Build an ATS-friendly resume with academic details, polished sections,
                and AI-enhanced wording.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                variant="outline"
                className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-slate-200 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.9)] transition-all hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-slate-50"
                onClick={handleSubmit(onSubmit)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
              <Button
                className="h-11 rounded-xl border border-cyan-400/25 bg-cyan-500 px-5 text-sm font-semibold text-slate-950 shadow-[0_14px_30px_-18px_rgba(34,211,238,0.75)] transition-all hover:-translate-y-0.5 hover:bg-cyan-400 hover:shadow-[0_18px_36px_-18px_rgba(34,211,238,0.95)]"
                onClick={generatePDF}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border-t border-white/10 px-5 pb-5 pt-4 sm:px-7 lg:px-8">
            <TabsList className="rounded-xl border border-white/10 bg-slate-950/70 p-1">
              <TabsTrigger
                value="edit"
                className="rounded-lg px-4 text-slate-400 data-[state=active]:bg-white/[0.08] data-[state=active]:text-slate-50"
              >
                Form
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="rounded-lg px-4 text-slate-400 data-[state=active]:bg-white/[0.08] data-[state=active]:text-slate-50"
              >
                Preview
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="edit">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto w-full max-w-[1420px] space-y-8"
          >
            <section className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-white/10 bg-white/[0.05] p-4 md:grid-cols-2">
                <FieldError label="Email" error={errors.contactInfo?.email}>
                  <Controller
                    name="contactInfo.email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                      />
                    )}
                  />
                </FieldError>
                <FieldError label="Mobile Number" error={errors.contactInfo?.mobile}>
                  <Controller
                    name="contactInfo.mobile"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+91 98765 43210"
                      />
                    )}
                  />
                </FieldError>
                <FieldError label="LinkedIn URL" error={errors.contactInfo?.linkedin}>
                  <Controller
                    name="contactInfo.linkedin"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://linkedin.com/in/your-profile"
                      />
                    )}
                  />
                </FieldError>
                <FieldError label="GitHub URL" error={errors.contactInfo?.github}>
                  <Controller
                    name="contactInfo.github"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://github.com/your-username"
                      />
                    )}
                  />
                </FieldError>
                <FieldError label="Portfolio URL" error={errors.contactInfo?.portfolio}>
                  <Controller
                    name="contactInfo.portfolio"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://your-portfolio.com"
                      />
                    )}
                  />
                </FieldError>
                <FieldError label="X / Twitter URL" error={errors.contactInfo?.twitter}>
                  <Controller
                    name="contactInfo.twitter"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://x.com/your-handle"
                      />
                    )}
                  />
                </FieldError>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-medium">Academic Performance</h3>
              <div className="grid grid-cols-1 gap-4 rounded-lg border border-white/10 bg-white/[0.05] p-4 md:grid-cols-3">
                <FieldError label="10th marks / percentage / CGPA">
                  <Controller
                    name="academicPerformance.tenth"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="e.g., 92% or 9.2 CGPA"
                      />
                    )}
                  />
                </FieldError>
                <FieldError label="12th marks / percentage / CGPA">
                  <Controller
                    name="academicPerformance.twelfth"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="e.g., 88% or 8.8 CGPA"
                      />
                    )}
                  />
                </FieldError>
                <FieldError label="Undergraduate CGPA">
                  <Controller
                    name="academicPerformance.ug"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="e.g., 9.0 / 10"
                      />
                    )}
                  />
                </FieldError>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-lg font-medium">Technical Skills</h3>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32 bg-background/70"
                    placeholder="Languages: JavaScript, Python, Java, SQL&#10;Frontend: React.js, Next.js, HTML, CSS, Tailwind CSS&#10;Backend: Node.js, Express.js&#10;Database: PostgreSQL, MongoDB, MySQL&#10;Tools: Git, GitHub, Postman, VS Code"
                  />
                )}
              />
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Key Courses Taken</h3>
                <p className="text-sm text-muted-foreground">
                  Add one course per line for a compact ATS-friendly academic section.
                </p>
              </div>
              <Controller
                name="keyCourses"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32 bg-background/70"
                    placeholder="Data Structures & Algorithms&#10;Operating Systems&#10;Database Management Systems&#10;Object-Oriented Programming"
                  />
                )}
              />
            </section>

            <ResumeEntries
              title="Work Experience"
              name="experience"
              control={control}
              errors={errors}
            />
            <ResumeEntries
              title="Education"
              name="education"
              type="Education"
              control={control}
              errors={errors}
            />
            <ResumeEntries
              title="Projects"
              name="projects"
              type="Project"
              control={control}
              errors={errors}
            />
            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">
                  Achievements / Certifications
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add one achievement, certification, award, or coding milestone per line.
                </p>
              </div>
              <Controller
                name="certifications"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    className="h-32 bg-background/70"
                    placeholder="Solved 500+ DSA problems on LeetCode&#10;AWS Certified Cloud Practitioner&#10;Winner - Smart India Hackathon"
                  />
                )}
              />
              {errors.certifications && (
                <p className="text-sm text-red-500">
                  {errors.certifications.message}
                </p>
              )}
            </section>
          </form>
        </TabsContent>

        <TabsContent value="preview" className="mt-5">
          <div className="mx-auto w-full max-w-[1420px] rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_80px_-60px_rgba(15,23,42,0.95)] sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">
                  Resume workspace
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-50">
                  ATS resume preview
                </h2>
              </div>
              {activeTab === "preview" && (
                <Button
                  variant="ghost"
                  type="button"
                  className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.08] hover:text-slate-50"
                  onClick={() =>
                    setResumeMode(resumeMode === "preview" ? "edit" : "preview")
                  }
                >
                  {resumeMode === "preview" ? (
                    <>
                      <Edit className="h-4 w-4" />
                      Edit Markdown
                    </>
                  ) : (
                    <>
                      <Monitor className="h-4 w-4" />
                      Show Preview
                    </>
                  )}
                </Button>
              )}
            </div>

            {activeTab === "preview" && resumeMode !== "preview" && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-amber-200">
                <Edit className="h-5 w-5" />
                <span className="text-sm">
                  You will lose edited markdown if you update the form data.
                </span>
              </div>
            )}

            <div
              data-color-mode="dark"
              className="resume-preview-workspace mx-auto w-full max-w-[1140px] overflow-hidden rounded-[22px] border border-white/[0.11] bg-[#111827] shadow-[0_30px_90px_-54px_rgba(0,0,0,0.95),0_12px_32px_-28px_rgba(14,165,233,0.55),inset_0_1px_0_rgba(255,255,255,0.055)]"
            >
              <MDEditor
                value={previewContent}
                onChange={setPreviewContent}
                height={800}
                preview={resumeMode}
                className="resume-preview-editor"
              />
            </div>
          </div>
          <div className="hidden">
            <ResumePdfDocument
              id="resume-pdf"
              name={user?.fullName || "Your Name"}
              formData={formValues}
              markdown={previewContent}
              structured={parsedInitialContent.isStructured || activeTab === "edit"}
            />
          </div>
          <style jsx global>{`
            .resume-preview-editor.w-md-editor,
            .resume-preview-editor .w-md-editor {
              background: #111827 !important;
              color: #e2e8f0 !important;
              box-shadow: none !important;
            }

            .resume-preview-editor .w-md-editor-toolbar {
              min-height: 46px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
              background: #0b1220 !important;
              padding: 6px 10px !important;
            }

            .resume-preview-editor .w-md-editor-toolbar li > button {
              color: #94a3b8 !important;
              border-radius: 10px !important;
              transition: background-color 150ms ease, color 150ms ease;
            }

            .resume-preview-editor .w-md-editor-toolbar li > button:hover {
              background: rgba(255, 255, 255, 0.08) !important;
              color: #f8fafc !important;
            }

            .resume-preview-editor .w-md-editor-content,
            .resume-preview-editor .w-md-editor-input,
            .resume-preview-editor .w-md-editor-preview {
              background: #111827 !important;
            }

            .resume-preview-editor .w-md-editor-text-input,
            .resume-preview-editor .w-md-editor-text-pre > code,
            .resume-preview-editor .w-md-editor-text-pre {
              color: #e2e8f0 !important;
              caret-color: #22d3ee;
            }

            .resume-preview-editor .wmde-markdown {
              background: transparent !important;
              color: #e2e8f0 !important;
              font-family: Inter, Arial, Helvetica, sans-serif !important;
              padding: 34px 40px !important;
            }

            .resume-preview-editor .wmde-markdown h1,
            .resume-preview-editor .wmde-markdown h2 {
              border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
              color: #f8fafc !important;
              font-weight: 700 !important;
              padding-bottom: 10px !important;
            }

            .resume-preview-editor .wmde-markdown h1 {
              font-size: 30px !important;
              line-height: 1.2 !important;
            }

            .resume-preview-editor .wmde-markdown h2 {
              font-size: 18px !important;
              margin-top: 28px !important;
            }

            .resume-preview-editor .wmde-markdown h3,
            .resume-preview-editor .wmde-markdown strong {
              color: #f8fafc !important;
            }

            .resume-preview-editor .wmde-markdown p,
            .resume-preview-editor .wmde-markdown li {
              color: #cbd5e1 !important;
              font-size: 15.5px !important;
              line-height: 1.75 !important;
            }

            .resume-preview-editor .wmde-markdown ul,
            .resume-preview-editor .wmde-markdown ol {
              padding-left: 24px !important;
            }

            .resume-preview-editor .wmde-markdown a {
              color: #67e8f9 !important;
            }

            .resume-preview-editor .wmde-markdown hr {
              border-color: rgba(255, 255, 255, 0.08) !important;
            }
          `}</style>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// formatContactString is no longer needed globally as we strictly map types below.

function ResumePdfDocument({ id, name, formData, markdown, structured }) {
  const data = normalizeResumeFormData(formData);
  const certificationRows = String(data.certifications || "")
    .split("\n")
    .map((item) => item.replace(/^[\u2022\-*]\s*/, "").trim())
    .filter(Boolean);
  const descriptionLength = [
    ...data.experience,
    ...data.education,
    ...data.projects,
  ].reduce((sum, entry) => sum + String(entry.description || "").length, 0);
  const entryCount =
    data.experience.length +
    data.education.length +
    data.projects.length +
    certificationRows.length;
  const density = entryCount > 7 || descriptionLength > 1900 ? "compact" : "standard";
  const keyCourseRows = String(data.keyCourses || "")
    .split(/[\r\n,]+/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
  const skillRows = String(data.skills || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const hasAcademicRecord =
    data.academicPerformance?.ug ||
    data.academicPerformance?.twelfth ||
    data.academicPerformance?.tenth;

  if (!structured) {
    return (
      <div id={id} className="resume-pdf resume-pdf-page">
        <MDEditor.Markdown source={markdown} />
      </div>
    );
  }

  return (
    <article id={id} className={`resume-pdf resume-pdf-page ${density}`}>
      <header className="resume-header">
        <h1>{name}</h1>
        <div className="resume-contact">
          {[
            { value: data.contactInfo.email, label: data.contactInfo.email },
            { value: data.contactInfo.mobile, label: data.contactInfo.mobile },
            { value: data.contactInfo.github, label: "GitHub" },
            { value: data.contactInfo.linkedin, label: "LinkedIn" },
            { value: data.contactInfo.portfolio, label: "Portfolio" },
            { value: data.contactInfo.twitter, label: "Twitter" },
          ]
            .filter((item) => Boolean(item.value))
            .map((item) => {
              const href = item.value.startsWith("http")
                ? item.value
                : item.value.includes("@")
                ? `mailto:${item.value}`
                : `https://${item.value}`;
              return (
                <span key={item.label}>
                  <a href={href} className="resume-link" target="_blank" rel="noreferrer">
                    {item.label}
                  </a>
                </span>
              );
            })}
        </div>
      </header>

      {hasAcademicRecord && (
        <ResumePdfSection title="Academic Record">
          <AcademicPdfRows
            academicPerformance={data.academicPerformance}
          />
        </ResumePdfSection>
      )}

      <ResumePdfSection title="Technical Skills">
        <div className="resume-skills">
          {skillRows.length ? (
            skillRows.map((row) => <SkillRow key={row} row={row} />)
          ) : (
            <p>{data.skills}</p>
          )}
        </div>
      </ResumePdfSection>

      {keyCourseRows.length > 0 && (
        <ResumePdfSection title="Key Courses Taken">
          <div className="resume-key-courses-inline">
            {keyCourseRows.join(" • ")}
          </div>
        </ResumePdfSection>
      )}

      <ResumePdfSection title="Projects">
        {data.projects.map((entry, index) => (
          <ResumePdfEntry key={`${entry.title}-${index}`} entry={entry} isProject={true} />
        ))}
      </ResumePdfSection>

      <ResumePdfSection title="Work Experience">
        {data.experience.map((entry, index) => (
          <ResumePdfEntry
            key={`${entry.title}-${index}`}
            entry={entry}
            forceBullets
          />
        ))}
      </ResumePdfSection>

      <ResumePdfSection title="Education">
        {data.education.map((entry, index) => (
          <ResumePdfEntry key={`${entry.title}-${index}`} entry={entry} compact />
        ))}
      </ResumePdfSection>

      {certificationRows.length > 0 && (
        <ResumePdfSection title="Achievements / Certifications">
          <ul>
            {certificationRows.map((certification) => (
              <li key={certification}>{certification}</li>
            ))}
          </ul>
        </ResumePdfSection>
      )}
    </article>
  );
}

function ResumePdfSection({ title, children }) {
  const hasContent = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children);
  if (!hasContent) return null;

  return (
    <section className="resume-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function SkillRow({ row }) {
  const [label, ...rest] = row.split(":");
  if (!rest.length) return <p>{row}</p>;

  return (
    <p>
      <strong>{label.trim()}:</strong> {rest.join(":").trim()}
    </p>
  );
}

function extractLinks(text) {
  if (!text) return { cleanText: "", links: [] };
  const urlRegex = /(https?:\/\/[^\s,]+)/g;
  const links = [];
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    links.push(match[1]);
  }
  // Strip the URLs and clean up any dangling commas/spaces
  let cleanText = text.replace(urlRegex, "").trim();
  cleanText = cleanText.replace(/,\s*$/, "").replace(/^\s*,\s*/, "").trim();
  return { cleanText, links };
}

function ResumePdfEntry({
  entry,
  compact = false,
  isProject = false,
  forceBullets = false,
}) {
  const descriptionLines = forceBullets
    ? descriptionToBulletItems(entry.description)
    : String(entry.description || "")
        .split("\n")
        .map((line) => line.replace(/^[\u2022\-*]\s*/, "").trim())
        .filter(Boolean);
  const dateRange = entry.current
    ? `${entry.startDate} - Present`
    : [entry.startDate, entry.endDate].filter(Boolean).join(" - ");

  // Extract raw URLs hacked into title or organization fields
  const { cleanText: cleanTitle, links: titleLinks } = extractLinks(entry.title);
  const { cleanText: cleanOrg, links: orgLinks } = extractLinks(entry.organization);
  const allLinks = [...titleLinks, ...orgLinks];

  const formattedLinks = allLinks.map((link) => {
    const lower = link.toLowerCase();
    let label = "Link";
    if (lower.includes("github.com")) label = "GitHub";
    else if (lower.includes("linkedin.com")) label = "LinkedIn";
    else label = "Demo";
    return { href: link, label };
  });

  const TitleLinksComponent = () => {
    if (!formattedLinks.length) return null;
    return (
      <span className="resume-entry-links">
        <span className="separator">|</span>
        {formattedLinks.map((link, idx) => (
          <span key={idx}>
            <a href={link.href} className="resume-link" target="_blank" rel="noreferrer">
              {link.label}
            </a>
            {idx < formattedLinks.length - 1 && <span className="separator">|</span>}
          </span>
        ))}
      </span>
    );
  };

  if (isProject) {
    const techStack = cleanOrg ? cleanOrg.split(",").map(s=>s.trim()).filter(Boolean).join(" • ") : "";
    return (
      <div className="resume-entry">
        <div className="resume-entry-heading">
          <div className="resume-entry-title">
            <strong>{cleanTitle}</strong>
            <TitleLinksComponent />
          </div>
          <span className="resume-date">{dateRange}</span>
        </div>
        {techStack && <div className="resume-tech-stack">{techStack}</div>}
        {descriptionLines.length > 1 || (forceBullets && descriptionLines.length) ? (
          <ul>
            {descriptionLines.map((line, index) => (
              <li key={`${line}-${index}`}>{line}</li>
            ))}
          </ul>
        ) : descriptionLines.length === 1 ? (
          <p className="resume-single-desc">{descriptionLines[0]}</p>
        ) : null}
      </div>
    );
  }

  let finalTitle = cleanTitle;
  if (compact && cleanTitle.toLowerCase() === "computer science") {
    finalTitle = "Bachelor of Technology in Computer Science";
  }

  if (compact) {
    return (
      <div className="resume-entry">
        <div className="resume-entry-heading">
          <div className="resume-entry-title">
            <strong>{finalTitle}</strong>
          </div>
        </div>
        <div className="resume-org-row-flex">
          {cleanOrg && <span className="resume-org">{cleanOrg}</span>}
          <span className="resume-date">{dateRange}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-entry">
      <div className="resume-entry-heading">
        <div className="resume-entry-title">
          <strong>{cleanTitle}</strong>
          <TitleLinksComponent />
          {cleanOrg && (
            <span className="resume-org">
              <span className="separator">,</span>
              {cleanOrg}
            </span>
          )}
        </div>
        <span className="resume-date">{dateRange}</span>
      </div>
      {descriptionLines.length > 1 || (forceBullets && descriptionLines.length) ? (
        <ul>
          {descriptionLines.map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>
      ) : descriptionLines.length === 1 ? (
        <p className="resume-single-desc">{descriptionLines[0]}</p>
      ) : null}
    </div>
  );
}

function AcademicPdfRows({ academicPerformance }) {
  const rows = [
    ["Undergraduate CGPA", academicPerformance?.ug],
    ["Class XII", academicPerformance?.twelfth],
    ["Class X", academicPerformance?.tenth],
  ].filter(([, value]) => value);

  if (!rows.length) return null;

  return (
    <div className="resume-academic-inline">
      {rows.map(([label, value], index) => (
        <span key={label} className="resume-academic-item">
          <strong>{label}:</strong> {value}
          {index < rows.length - 1 && <span className="separator">|</span>}
        </span>
      ))}
    </div>
  );
}

function FieldError({ label, error, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}

function ResumeEntries({ title, name, type = "Experience", control, errors }) {
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <EntryForm type={type} entries={field.value} onChange={field.onChange} />
        )}
      />
      {errors[name] && (
        <p className="text-sm text-red-500">{errors[name].message}</p>
      )}
    </section>
  );
}
