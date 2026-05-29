export const defaultResumeFormData = {
  contactInfo: {
    email: "",
    mobile: "",
    linkedin: "",
    github: "",
    portfolio: "",
    twitter: "",
  },
  academicPerformance: {
    tenth: "",
    twelfth: "",
    ug: "",
  },
  summary: "",
  skills: "",
  keyCourses: "",
  experience: [],
  education: [],
  projects: [],
  certifications: "",
};

const RESUME_CONTENT_VERSION = 1;

const normalizeString = (value) => (typeof value === "string" ? value : "");
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

function stripSummarySections(markdown) {
  return normalizeString(markdown)
    .replace(
      /(^|\n)##\s*(Professional Summary|Career Objective|Objective|About Me)\s*\n[\s\S]*?(?=\n##\s|\s*$)/gi,
      "\n"
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeResumeFormData(value = {}) {
  return {
    contactInfo: {
      ...defaultResumeFormData.contactInfo,
      ...(value.contactInfo || {}),
    },
    academicPerformance: {
      ...defaultResumeFormData.academicPerformance,
      ...(value.academicPerformance || {}),
    },
    summary: normalizeString(value.summary),
    skills: normalizeString(value.skills),
    keyCourses: normalizeString(value.keyCourses),
    experience: normalizeArray(value.experience),
    education: normalizeArray(value.education),
    projects: normalizeArray(value.projects),
    certifications: Array.isArray(value.certifications)
      ? value.certifications
          .map((certification) =>
            [
              certification.name,
              certification.issuer,
              certification.issueDate,
              certification.credentialUrl,
            ]
              .filter(Boolean)
              .join(" | ")
          )
          .join("\n")
      : normalizeString(value.certifications),
  };
}

export function serializeResumeContent({ formData, markdown }) {
  return JSON.stringify({
    type: "careersphere.resume",
    version: RESUME_CONTENT_VERSION,
    formData: normalizeResumeFormData(formData),
    markdown: normalizeString(markdown),
    updatedAt: new Date().toISOString(),
  });
}

export function parseResumeContent(content) {
  if (!content) {
    return {
      isStructured: true,
      formData: normalizeResumeFormData(),
      markdown: "",
    };
  }

  try {
    const parsed = JSON.parse(content);
    if (parsed?.type === "careersphere.resume" && parsed?.version >= 1) {
      return {
        isStructured: true,
        formData: normalizeResumeFormData(parsed.formData),
        markdown: stripSummarySections(parsed.markdown),
      };
    }
  } catch {
    // Legacy resumes were saved as plain markdown.
  }

  return {
    isStructured: false,
    formData: normalizeResumeFormData(),
    markdown: stripSummarySections(content),
  };
}

export function buildResumeMarkdown(formValues, name = "Your Name") {
  const {
    skills,
    keyCourses,
    experience,
    education,
    projects,
    certifications,
    academicPerformance,
    contactInfo,
  } = normalizeResumeFormData(formValues);

  const parts = [];
  if (contactInfo.email) parts.push(`Email: ${contactInfo.email}`);
  if (contactInfo.mobile) parts.push(`Phone: ${contactInfo.mobile}`);
  if (contactInfo.linkedin) parts.push(`[LinkedIn](${contactInfo.linkedin})`);
  if (contactInfo.github) parts.push(`[GitHub](${contactInfo.github})`);
  if (contactInfo.portfolio) parts.push(`[Portfolio](${contactInfo.portfolio})`);
  if (contactInfo.twitter) parts.push(`[X/Twitter](${contactInfo.twitter})`);

  const contactMarkdown = parts.length
    ? `# <div align="center">${name}</div>\n\n<div align="center">${parts.join(" | ")}</div>`
    : "";

  return [
    contactMarkdown,
    skills && `## Skills\n\n${skills}`,
    keyCourses && `## Key Courses Taken\n\n${linesToBullets(keyCourses)}`,
    academicToMarkdown(academicPerformance),
    entriesToMarkdown(experience, "Work Experience"),
    entriesToMarkdown(education, "Education"),
    entriesToMarkdown(projects, "Projects"),
    certificationsToMarkdown(certifications),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function linesToBullets(value) {
  return normalizeString(value)
    .split("\n")
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");
}

export function descriptionToBulletItems(value) {
  const source = Array.isArray(value)
    ? value.flatMap((item) => String(item || "").split(/\r?\n/))
    : String(value || "").split(/\r?\n/);

  return source
    .flatMap((line) => {
      const cleaned = line
        .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
        .trim();

      if (!cleaned) return [];

      const bulletParts = cleaned
        .split(/\s+•\s+|\s+-\s+(?=[A-Z0-9])/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (bulletParts.length > 1) return bulletParts;

      const sentenceParts = cleaned
        .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
        .map((item) => item.trim())
        .filter(Boolean);

      return sentenceParts.length > 1 ? sentenceParts : [cleaned];
    })
    .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}

export function descriptionToBulletMarkdown(value) {
  return descriptionToBulletItems(value)
    .map((item) => `- ${item}`)
    .join("\n");
}

// Helper function to convert entries to markdown
export function entriesToMarkdown(entries, type) {
  if (!entries?.length) return "";

  return (
    `## ${type}\n\n` +
    entries
      .map((entry) => {
        const dateRange = entry.current
          ? `${entry.startDate} - Present`
          : `${entry.startDate} - ${entry.endDate}`;
        const description =
          type === "Work Experience"
            ? descriptionToBulletMarkdown(entry.description)
            : entry.description;
        return `### ${entry.title} @ ${entry.organization}\n${dateRange}\n\n${description}`;
      })
      .join("\n\n")
  );
}

export function certificationsToMarkdown(certifications) {
  if (!certifications?.length) return "";

  if (typeof certifications === "string") {
    const rows = certifications
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!rows.length) return "";

    return "## Certifications\n\n" + rows.map((item) => `- ${item}`).join("\n");
  }

  return (
    "## Certifications\n\n" +
    certifications
      .map((certification) => {
        const issuer = certification.issuer
          ? `, ${certification.issuer}`
          : "";
        const date = certification.issueDate
          ? ` (${certification.issueDate})`
          : "";
        const url = certification.credentialUrl
          ? `\n${certification.credentialUrl}`
          : "";
        const description = certification.description
          ? `\n\n${certification.description}`
          : "";

        return `### ${certification.name}${issuer}${date}${url}${description}`;
      })
      .join("\n\n")
  );
}

export function academicToMarkdown(academicPerformance) {
  const rows = [
    ["10th", academicPerformance?.tenth],
    ["12th", academicPerformance?.twelfth],
    ["Undergraduate CGPA", academicPerformance?.ug],
  ].filter(([, value]) => value?.trim());

  if (!rows.length) return "";

  return (
    "## Academic Performance\n\n" +
    rows.map(([label, value]) => `- **${label}:** ${value.trim()}`).join("\n")
  );
}
