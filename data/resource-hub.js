import { industries } from "@/data/industries";

const slugifySubIndustry = (value = "") => value.toLowerCase().replace(/ /g, "-");

const titleCase = (value = "") =>
  value
    .replace(/[-_/&()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const parseIndustry = (industryValue = "") => {
  const [domainId = "", ...subParts] = industryValue.split("-");
  const subSlug = subParts.join("-");
  const domain = industries.find((item) => item.id === domainId);
  const subdomain =
    domain?.subIndustries.find((item) => slugifySubIndustry(item) === subSlug) ||
    titleCase(subSlug);

  return {
    domainId,
    domainName: domain?.name || titleCase(domainId) || "Career",
    subdomainName: subdomain || "Career Development",
  };
};

const hasAny = (text, terms) => terms.some((term) => text.includes(term));

const inferTrack = ({ domainId, subdomainName, skills = [], bio = "" }) => {
  const text = [domainId, subdomainName, bio, ...skills].join(" ").toLowerCase();

  if (domainId === "tech") {
    if (hasAny(text, ["cyber", "security", "soc", "penetration", "network security"])) {
      return "cybersecurity";
    }
    if (hasAny(text, ["data", "analytics", "tableau", "power bi", "sql", "excel", "dashboard"])) {
      return "dataAnalytics";
    }
    if (hasAny(text, ["cloud", "aws", "azure", "gcp", "devops", "kubernetes"])) {
      return "cloud";
    }
    if (hasAny(text, ["machine learning", "artificial intelligence", "ai", "ml", "deep learning"])) {
      return "aiMl";
    }
    return "software";
  }

  if (domainId === "healthcare") return "healthcare";
  if (domainId === "manufacturing") return "manufacturing";
  if (domainId === "finance") return "finance";
  if (domainId === "consulting") return "consulting";
  if (domainId === "education") return "education";
  if (domainId === "energy") return "energy";
  if (domainId === "transportation") return "supplyChain";

  return "general";
};

const inferTargetRole = (track, subdomainName, skills = []) => {
  const skillText = skills.join(" ").toLowerCase();

  const roleMap = {
    cybersecurity: "Cybersecurity Analyst",
    dataAnalytics: "Data Analyst",
    cloud: "Cloud Engineer",
    aiMl: "AI/ML Practitioner",
    healthcare: "Healthcare Professional",
    manufacturing: "Manufacturing Operations Professional",
    finance: "Finance Analyst",
    consulting: "Consulting Associate",
    education: "Learning Experience Professional",
    energy: "Energy Operations Professional",
    supplyChain: "Supply Chain Professional",
    general: `${subdomainName} Professional`,
  };

  if (track === "software") {
    if (hasAny(skillText, ["react", "css", "html", "frontend", "front-end"])) {
      return "Frontend Engineer";
    }
    if (hasAny(skillText, ["node", "java", "spring", "api", "database", "backend", "back-end"])) {
      return "Backend Engineer";
    }
    if (hasAny(skillText, ["mobile", "android", "ios", "flutter", "react native"])) {
      return "Mobile Engineer";
    }
    return "Software Engineer";
  }

  return roleMap[track];
};

const inferSkillFocus = (track, skills = []) => {
  const listedSkills = skills.filter(Boolean).slice(0, 4);
  if (listedSkills.length) return listedSkills;

  const fallback = {
    software: ["DSA", "System Design", "Git", "APIs"],
    dataAnalytics: ["SQL", "Excel", "Dashboards", "Statistics"],
    cybersecurity: ["Networking", "OWASP", "Linux", "Threat Analysis"],
    cloud: ["AWS", "Azure", "Containers", "Architecture"],
    aiMl: ["Python", "Modeling", "MLOps", "Evaluation"],
    healthcare: ["Clinical Skills", "Communication", "Evidence Review", "Case Practice"],
    manufacturing: ["Lean", "Six Sigma", "Safety", "Process Improvement"],
    finance: ["Valuation", "Financial Modeling", "Risk", "Markets"],
    consulting: ["Cases", "Market Sizing", "Storytelling", "Analysis"],
    education: ["Instructional Design", "Assessment", "EdTech", "Learner Outcomes"],
    energy: ["Renewables", "Grid Systems", "Safety", "Operations"],
    supplyChain: ["Logistics", "Planning", "Warehousing", "Optimization"],
    general: ["Role Skills", "Interview Prep", "Projects", "Credentials"],
  };

  return fallback[track] || fallback.general;
};

const resource = (title, description, category, difficulty, href, provider) => ({
  title,
  description,
  category,
  difficulty,
  href,
  provider,
});

const youtubePlaylist = (title, description, creator, difficulty, href) => ({
  title,
  description,
  creator,
  difficulty,
  href,
});

const resourcesByTrack = {
  software: {
    roadmaps: [
      resource("Frontend Roadmap", "Structured progression for HTML, CSS, JavaScript, React, testing, and modern frontend depth.", "Roadmap", "Beginner", "https://roadmap.sh/frontend", "roadmap.sh"),
      resource("Backend Roadmap", "A practical backend path covering APIs, databases, authentication, caching, and deployment fundamentals.", "Roadmap", "Intermediate", "https://roadmap.sh/backend", "roadmap.sh"),
      resource("System Design Roadmap", "Progress from core architecture concepts to scalable distributed-system tradeoffs.", "Roadmap", "Advanced", "https://roadmap.sh/system-design", "roadmap.sh"),
    ],
    interview: [
      resource("NeetCode Practice", "Curated coding patterns and Blind 75-style preparation for technical interviews.", "Interview Prep", "Intermediate", "https://neetcode.io/practice", "NeetCode"),
      resource("System Design Primer", "Open-source system design concepts, examples, and interview walkthroughs.", "Interview Prep", "Advanced", "https://github.com/donnemartin/system-design-primer", "GitHub"),
      resource("LeetCode Database", "SQL interview practice for joins, filtering, grouping, and common query patterns.", "Interview Prep", "Intermediate", "https://leetcode.com/problemset/database/", "LeetCode"),
    ],
    certifications: [
      resource("AWS Cloud Practitioner", "Recognized foundation credential for cloud fluency across engineering roles.", "Certification", "Beginner", "https://aws.amazon.com/certification/certified-cloud-practitioner/", "AWS"),
      resource("Meta Front-End Developer", "Professional certificate focused on React, UI implementation, and frontend project work.", "Course", "Beginner", "https://www.coursera.org/professional-certificates/meta-front-end-developer", "Meta"),
      resource("Google IT Automation with Python", "Applied Python, Git, and automation training useful for software and platform roles.", "Course", "Intermediate", "https://www.coursera.org/professional-certificates/google-it-automation", "Google"),
    ],
    tools: [
      resource("LeetCode", "Algorithm and data-structure practice with company-style interview questions.", "Practice Platform", "Intermediate", "https://leetcode.com/", "LeetCode"),
      resource("HackerRank", "Coding, SQL, and language-specific practice used widely in hiring screens.", "Practice Platform", "Beginner", "https://www.hackerrank.com/", "HackerRank"),
      resource("GitHub Skills", "Hands-on learning for GitHub workflows, pull requests, Actions, and collaboration.", "Tool", "Beginner", "https://skills.github.com/", "GitHub"),
    ],
  },
  dataAnalytics: {
    roadmaps: [
      resource("Data Analyst Roadmap", "A focused path through spreadsheets, SQL, statistics, BI dashboards, and portfolio projects.", "Roadmap", "Beginner", "https://roadmap.sh/data-analyst", "roadmap.sh"),
      resource("Mode SQL Tutorial", "Practical SQL progression from fundamentals to analytics-ready querying.", "Learning Path", "Beginner", "https://mode.com/sql-tutorial/", "Mode"),
      resource("Kaggle Learn", "Short applied modules for Python, pandas, data cleaning, visualization, and ML basics.", "Learning Path", "Intermediate", "https://www.kaggle.com/learn", "Kaggle"),
    ],
    interview: [
      resource("HackerRank SQL", "High-signal SQL problems aligned with common analyst screening rounds.", "Interview Prep", "Beginner", "https://www.hackerrank.com/domains/sql", "HackerRank"),
      resource("StrataScratch", "Analytics interview questions from data roles with SQL and product analytics practice.", "Interview Prep", "Intermediate", "https://www.stratascratch.com/", "StrataScratch"),
      resource("Tableau Training Videos", "Official skill-building for dashboards, calculations, and visual analytics.", "Interview Prep", "Beginner", "https://www.tableau.com/learn/training", "Tableau"),
    ],
    certifications: [
      resource("Google Data Analytics", "Industry-recognized certificate covering data cleaning, analysis, visualization, and case studies.", "Certification", "Beginner", "https://www.coursera.org/professional-certificates/google-data-analytics", "Google"),
      resource("Microsoft Power BI Data Analyst", "Certification path for Power BI modeling, DAX, dashboards, and reporting.", "Certification", "Intermediate", "https://learn.microsoft.com/en-us/credentials/certifications/power-bi-data-analyst-associate/", "Microsoft"),
      resource("Tableau Desktop Specialist", "Recognized credential for Tableau fundamentals and dashboard-building fluency.", "Certification", "Beginner", "https://www.tableau.com/learn/certification/desktop-specialist", "Tableau"),
    ],
    tools: [
      resource("Kaggle", "Datasets, notebooks, and competitions for portfolio-ready analytics practice.", "Practice Platform", "Intermediate", "https://www.kaggle.com/", "Kaggle"),
      resource("Tableau Public", "Publish dashboards and build a visible analytics portfolio.", "Tool", "Beginner", "https://public.tableau.com/", "Tableau"),
      resource("Google Colab", "Browser-based notebooks for Python analysis without local setup.", "Tool", "Beginner", "https://colab.research.google.com/", "Google"),
    ],
  },
  cybersecurity: {
    roadmaps: [
      resource("Cyber Security Roadmap", "Clear path through networking, Linux, web security, blue-team basics, and career specialization.", "Roadmap", "Beginner", "https://roadmap.sh/cyber-security", "roadmap.sh"),
      resource("NICE Cybersecurity Framework", "Role and competency framework used to understand cybersecurity work categories.", "Roadmap", "Intermediate", "https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center", "NIST"),
      resource("TryHackMe Learning Paths", "Guided hands-on paths for pre-security, SOC, penetration testing, and web fundamentals.", "Learning Path", "Beginner", "https://tryhackme.com/paths", "TryHackMe"),
    ],
    interview: [
      resource("OWASP Top 10", "Essential web security risks every cybersecurity interview candidate should know.", "Interview Prep", "Beginner", "https://owasp.org/www-project-top-ten/", "OWASP"),
      resource("PortSwigger Web Security Academy", "Hands-on labs for web vulnerabilities and practical security reasoning.", "Interview Prep", "Intermediate", "https://portswigger.net/web-security", "PortSwigger"),
      resource("CyberDefenders Labs", "Blue-team investigation labs for SOC and incident-response practice.", "Interview Prep", "Intermediate", "https://cyberdefenders.org/blueteam-ctf-challenges/", "CyberDefenders"),
    ],
    certifications: [
      resource("CompTIA Security+", "Common entry-level cybersecurity credential for security fundamentals.", "Certification", "Beginner", "https://www.comptia.org/certifications/security", "CompTIA"),
      resource("Cisco CCNA", "Networking certification that strengthens security and infrastructure fundamentals.", "Certification", "Intermediate", "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html", "Cisco"),
      resource("ISC2 Certified in Cybersecurity", "Foundational cybersecurity certification from a globally recognized security body.", "Certification", "Beginner", "https://www.isc2.org/certifications/cc", "ISC2"),
    ],
    tools: [
      resource("TryHackMe", "Guided browser labs for cybersecurity foundations and practical skills.", "Practice Platform", "Beginner", "https://tryhackme.com/", "TryHackMe"),
      resource("Hack The Box", "Hands-on labs and machines for offensive and defensive skill building.", "Practice Platform", "Intermediate", "https://www.hackthebox.com/", "Hack The Box"),
      resource("Wireshark", "Packet analysis tool used for networking, SOC, and troubleshooting workflows.", "Tool", "Intermediate", "https://www.wireshark.org/", "Wireshark"),
    ],
  },
  cloud: {
    roadmaps: [
      resource("AWS Skill Builder", "Official learning paths for cloud foundations, architecture, and certification readiness.", "Learning Path", "Beginner", "https://skillbuilder.aws/", "AWS"),
      resource("Microsoft Learn Azure", "Structured Microsoft learning modules for Azure administration, development, and architecture.", "Learning Path", "Beginner", "https://learn.microsoft.com/en-us/training/azure/", "Microsoft"),
      resource("Google Cloud Skills Boost", "Hands-on cloud labs and quests for GCP services and architecture.", "Learning Path", "Intermediate", "https://www.cloudskillsboost.google/", "Google Cloud"),
    ],
    interview: [
      resource("AWS Ramp-Up Guides", "Official guide collections for cloud roles, architecture, DevOps, and data paths.", "Interview Prep", "Beginner", "https://aws.amazon.com/training/ramp-up-guides/", "AWS"),
      resource("Kubernetes Basics", "Official interactive Kubernetes tutorials for container orchestration fundamentals.", "Interview Prep", "Intermediate", "https://kubernetes.io/docs/tutorials/kubernetes-basics/", "Kubernetes"),
      resource("Google Cloud Architecture Center", "Reference architectures and decision guides for cloud design discussions.", "Interview Prep", "Advanced", "https://cloud.google.com/architecture", "Google Cloud"),
    ],
    certifications: [
      resource("AWS Solutions Architect Associate", "Widely recognized credential for cloud architecture and resilient system design.", "Certification", "Intermediate", "https://aws.amazon.com/certification/certified-solutions-architect-associate/", "AWS"),
      resource("Azure Administrator Associate", "Recognized Azure credential for identity, storage, networking, and governance.", "Certification", "Intermediate", "https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/", "Microsoft"),
      resource("Google Associate Cloud Engineer", "GCP certification focused on deploying, operating, and managing cloud solutions.", "Certification", "Intermediate", "https://cloud.google.com/learn/certification/cloud-engineer", "Google Cloud"),
    ],
    tools: [
      resource("AWS Free Tier", "Practice cloud deployment and service basics in a constrained sandbox.", "Tool", "Beginner", "https://aws.amazon.com/free/", "AWS"),
      resource("Docker Play with Docker", "Browser-based Docker environment for containers and quick experiments.", "Practice Platform", "Beginner", "https://labs.play-with-docker.com/", "Docker"),
      resource("Terraform Tutorials", "Official hands-on infrastructure-as-code tutorials for common cloud workflows.", "Tool", "Intermediate", "https://developer.hashicorp.com/terraform/tutorials", "HashiCorp"),
    ],
  },
  aiMl: {
    roadmaps: [
      resource("AI Data Scientist Roadmap", "Role-based progression across Python, statistics, ML, deep learning, and deployment basics.", "Roadmap", "Intermediate", "https://roadmap.sh/ai-data-scientist", "roadmap.sh"),
      resource("Machine Learning Specialization", "Andrew Ng-led ML path covering supervised learning, neural networks, and best practices.", "Learning Path", "Beginner", "https://www.coursera.org/specializations/machine-learning-introduction", "DeepLearning.AI"),
      resource("fast.ai Practical Deep Learning", "Project-first deep learning course focused on practical model building.", "Learning Path", "Intermediate", "https://course.fast.ai/", "fast.ai"),
    ],
    interview: [
      resource("Kaggle Learn", "Applied exercises for pandas, feature engineering, visualization, and ML workflows.", "Interview Prep", "Beginner", "https://www.kaggle.com/learn", "Kaggle"),
      resource("Google Machine Learning Crash Course", "Concise ML foundations with exercises and production-aware concepts.", "Interview Prep", "Beginner", "https://developers.google.com/machine-learning/crash-course", "Google"),
      resource("Papers With Code", "Research tasks, benchmarks, and implementations for advanced AI discussion prep.", "Interview Prep", "Advanced", "https://paperswithcode.com/", "Papers With Code"),
    ],
    certifications: [
      resource("Google Advanced Data Analytics", "Professional certificate focused on statistics, Python, regression, and ML workflows.", "Certification", "Intermediate", "https://www.coursera.org/professional-certificates/google-advanced-data-analytics", "Google"),
      resource("TensorFlow Developer Certificate", "Credential path for TensorFlow model-building competence.", "Certification", "Intermediate", "https://www.tensorflow.org/certificate", "TensorFlow"),
      resource("AWS Machine Learning Specialty", "Advanced certification for ML workloads and AWS production patterns.", "Certification", "Advanced", "https://aws.amazon.com/certification/certified-machine-learning-specialty/", "AWS"),
    ],
    tools: [
      resource("Kaggle", "Datasets, notebooks, competitions, and public portfolio projects.", "Practice Platform", "Intermediate", "https://www.kaggle.com/", "Kaggle"),
      resource("Google Colab", "Hosted notebooks for Python, ML experiments, and GPU-backed practice.", "Tool", "Beginner", "https://colab.research.google.com/", "Google"),
      resource("Hugging Face", "Models, datasets, spaces, and practical tooling for modern AI workflows.", "Tool", "Intermediate", "https://huggingface.co/", "Hugging Face"),
    ],
  },
  healthcare: {
    roadmaps: [
      resource("AAMC Careers in Medicine", "Career exploration and specialty planning resources for medical pathways.", "Roadmap", "Beginner", "https://www.aamc.org/cim", "AAMC"),
      resource("BMJ Learning", "Clinically focused modules for evidence-based practice and professional development.", "Learning Path", "Intermediate", "https://learning.bmj.com/learning/home.html", "BMJ"),
      resource("Osmosis Medicine", "Structured medical learning for anatomy, physiology, pathology, and clinical reasoning.", "Learning Path", "Beginner", "https://www.osmosis.org/", "Osmosis"),
    ],
    interview: [
      resource("Geeky Medics OSCE Stations", "Practical clinical communication, examination, and case-discussion preparation.", "Interview Prep", "Intermediate", "https://geekymedics.com/osce-stations/", "Geeky Medics"),
      resource("TeachMeAnatomy", "Trusted anatomy revision for clinical foundations and interview discussions.", "Interview Prep", "Beginner", "https://teachmeanatomy.info/", "TeachMeAnatomy"),
      resource("BMJ Best Practice", "Evidence-based clinical decision support for case reasoning and guideline review.", "Interview Prep", "Advanced", "https://bestpractice.bmj.com/", "BMJ"),
    ],
    certifications: [
      resource("AHA Basic Life Support", "Recognized life-support certification for many healthcare environments.", "Certification", "Beginner", "https://cpr.heart.org/en/courses/basic-life-support-course-options", "American Heart Association"),
      resource("CITI Program", "Research ethics and compliance training for clinical research pathways.", "Certification", "Intermediate", "https://about.citiprogram.org/", "CITI Program"),
      resource("Clinical Trials Design", "Johns Hopkins course for clinical trial fundamentals and study design.", "Course", "Intermediate", "https://www.coursera.org/learn/clinical-trials", "Johns Hopkins"),
    ],
    tools: [
      resource("Medscape", "Clinical reference, medical news, and continuing education resources.", "Tool", "Intermediate", "https://www.medscape.com/", "Medscape"),
      resource("AMBOSS Knowledge", "Clinical reference for diagnosis, management, and exam-oriented review.", "Tool", "Intermediate", "https://www.amboss.com/us/knowledge", "AMBOSS"),
      resource("Geeky Medics Cases", "Clinical case practice and OSCE-style preparation resources.", "Practice Platform", "Intermediate", "https://geekymedics.com/category/osce/cases/", "Geeky Medics"),
    ],
  },
  manufacturing: {
    roadmaps: [
      resource("NIST MEP Lean Resources", "Operational excellence guidance for lean manufacturing and process improvement.", "Roadmap", "Beginner", "https://www.nist.gov/mep", "NIST MEP"),
      resource("Lean Enterprise Institute", "Lean thinking, value-stream, and continuous improvement learning resources.", "Learning Path", "Intermediate", "https://www.lean.org/", "Lean Enterprise Institute"),
      resource("SME Manufacturing Training", "Professional manufacturing training paths for production, quality, and engineering roles.", "Learning Path", "Intermediate", "https://www.sme.org/training/", "SME"),
    ],
    interview: [
      resource("ASQ Six Sigma Resources", "Quality and Six Sigma concepts for interview case discussion and process questions.", "Interview Prep", "Intermediate", "https://asq.org/quality-resources/six-sigma", "ASQ"),
      resource("OSHA Training Resources", "Safety fundamentals and compliance references for plant and operations roles.", "Interview Prep", "Beginner", "https://www.osha.gov/training", "OSHA"),
      resource("Lean Case Study Library", "Real lean transformations and case material for operations interview discussion.", "Interview Prep", "Intermediate", "https://www.lean.org/the-lean-post/articles/", "Lean Enterprise Institute"),
    ],
    certifications: [
      resource("ASQ Six Sigma Green Belt", "Recognized quality credential for process improvement and variation reduction.", "Certification", "Intermediate", "https://asq.org/cert/six-sigma-green-belt", "ASQ"),
      resource("OSHA 30-Hour Training", "Widely recognized safety training for supervisors and operations environments.", "Certification", "Beginner", "https://www.osha.gov/training/outreach", "OSHA"),
      resource("SME Certified Manufacturing Technologist", "Credential for manufacturing fundamentals, processes, quality, and production systems.", "Certification", "Intermediate", "https://www.sme.org/training/certifications/certified-manufacturing-technologist-cmfgt/", "SME"),
    ],
    tools: [
      resource("NIST MEP", "Manufacturing improvement resources, operational guidance, and regional support.", "Tool", "Beginner", "https://www.nist.gov/mep", "NIST"),
      resource("MIT OpenCourseWare Manufacturing", "Open courses on manufacturing processes, systems, and product development.", "Practice Platform", "Intermediate", "https://ocw.mit.edu/search/?q=manufacturing", "MIT OCW"),
      resource("SafetyCulture Templates", "Inspection checklist examples useful for safety, quality, and operations practice.", "Tool", "Beginner", "https://safetyculture.com/checklists/", "SafetyCulture"),
    ],
  },
  finance: {
    roadmaps: [
      resource("CFA Program", "Gold-standard investment pathway for ethics, portfolio management, valuation, and markets.", "Roadmap", "Advanced", "https://www.cfainstitute.org/programs/cfa", "CFA Institute"),
      resource("CFI Financial Modeling", "Structured learning for accounting, valuation, financial modeling, and Excel-based analysis.", "Learning Path", "Intermediate", "https://corporatefinanceinstitute.com/resources/financial-modeling/", "CFI"),
      resource("Khan Academy Finance", "Clear foundations in accounting, capital markets, valuation, and economics.", "Learning Path", "Beginner", "https://www.khanacademy.org/economics-finance-domain", "Khan Academy"),
    ],
    interview: [
      resource("CFI Interview Guides", "Finance interview questions for accounting, valuation, banking, and analyst roles.", "Interview Prep", "Intermediate", "https://corporatefinanceinstitute.com/resources/career/interviews/", "CFI"),
      resource("Wall Street Prep Guides", "Technical interview prep for investment banking and finance analyst roles.", "Interview Prep", "Advanced", "https://www.wallstreetprep.com/knowledge/", "Wall Street Prep"),
      resource("CFA Ethics Learning", "Ethics and standards preparation for finance roles where judgment matters.", "Interview Prep", "Intermediate", "https://www.cfainstitute.org/ethics-standards", "CFA Institute"),
    ],
    certifications: [
      resource("CFA Charter", "Globally recognized investment management credential.", "Certification", "Advanced", "https://www.cfainstitute.org/programs/cfa", "CFA Institute"),
      resource("FRM Certification", "Recognized credential for financial risk management and quantitative risk roles.", "Certification", "Advanced", "https://www.garp.org/frm", "GARP"),
      resource("FMVA Certification", "Practical financial modeling and valuation credential for analyst roles.", "Certification", "Intermediate", "https://corporatefinanceinstitute.com/certifications/fmva/", "CFI"),
    ],
    tools: [
      resource("Bloomberg Market Concepts", "Market, economics, currencies, fixed income, and equities training from Bloomberg.", "Tool", "Beginner", "https://www.bloomberg.com/professional/product/bloomberg-market-concepts/", "Bloomberg"),
      resource("Investopedia Simulator", "Practice portfolio decisions and market learning in a simulated environment.", "Practice Platform", "Beginner", "https://www.investopedia.com/simulator/", "Investopedia"),
      resource("SEC EDGAR", "Research public company filings for financial statement and valuation practice.", "Tool", "Intermediate", "https://www.sec.gov/edgar/search/", "SEC"),
    ],
  },
  consulting: {
    roadmaps: [
      resource("Case Interview Prep", "Structured case interview learning for profitability, market entry, and growth cases.", "Roadmap", "Beginner", "https://www.caseinterview.com/", "CaseInterview.com"),
      resource("BCG Insights", "Real strategy perspectives to build business judgment and industry fluency.", "Learning Path", "Intermediate", "https://www.bcg.com/insights", "BCG"),
      resource("McKinsey Insights", "Executive-level articles useful for market structure and transformation thinking.", "Learning Path", "Intermediate", "https://www.mckinsey.com/featured-insights", "McKinsey"),
    ],
    interview: [
      resource("Case Interview Examples", "Live case examples and frameworks for consulting interview practice.", "Interview Prep", "Intermediate", "https://www.caseinterview.com/case-interview-examples", "CaseInterview.com"),
      resource("Bain Careers Interview Prep", "Official interview preparation guidance from Bain.", "Interview Prep", "Beginner", "https://www.bain.com/careers/interview-prep/", "Bain"),
      resource("Victor Cheng Case Resources", "Case structuring and candidate-led interview practice material.", "Interview Prep", "Intermediate", "https://www.caseinterview.com/", "Victor Cheng"),
    ],
    certifications: [
      resource("Google Project Management", "Recognized certificate for project planning, stakeholder management, and execution.", "Certification", "Beginner", "https://www.coursera.org/professional-certificates/google-project-management", "Google"),
      resource("PMI CAPM", "Entry-level project management certification for consulting and delivery roles.", "Certification", "Intermediate", "https://www.pmi.org/certifications/certified-associate-capm", "PMI"),
      resource("Wharton Business Foundations", "Business fundamentals across marketing, accounting, operations, and finance.", "Course", "Beginner", "https://www.coursera.org/specializations/wharton-business-foundations", "Wharton"),
    ],
    tools: [
      resource("Miro", "Collaborative whiteboarding for case trees, journey maps, and workshop planning.", "Tool", "Beginner", "https://miro.com/", "Miro"),
      resource("Statista", "Market and industry statistics for sizing, trend analysis, and presentations.", "Tool", "Intermediate", "https://www.statista.com/", "Statista"),
      resource("Google Trends", "Quick demand and interest signals for market research.", "Tool", "Beginner", "https://trends.google.com/trends/", "Google"),
    ],
  },
};

const generalResources = {
  roadmaps: [
    resource("Coursera Career Academy", "Role-based learning paths from recognized universities and companies.", "Roadmap", "Beginner", "https://www.coursera.org/career-academy", "Coursera"),
    resource("edX Professional Certificates", "Career-focused certificate programs from universities and industry partners.", "Learning Path", "Intermediate", "https://www.edx.org/professional-certificate", "edX"),
    resource("LinkedIn Learning", "Structured professional learning for role skills, tools, and workplace capabilities.", "Learning Path", "Beginner", "https://www.linkedin.com/learning/", "LinkedIn"),
  ],
  interview: [
    resource("Big Interview", "Practical interview training for behavioral, competency, and role-specific preparation.", "Interview Prep", "Beginner", "https://biginterview.com/", "Big Interview"),
    resource("Google Interview Warmup", "Practice answering interview questions and reflect on response patterns.", "Interview Prep", "Beginner", "https://grow.google/certificates/interview-warmup/", "Google"),
    resource("The Muse Interview Guide", "Concise preparation for common interview questions and answer structure.", "Interview Prep", "Beginner", "https://www.themuse.com/advice/interview-questions-and-answers", "The Muse"),
  ],
  certifications: [
    resource("Google Career Certificates", "Industry-recognized certificates across IT, data, project management, UX, and more.", "Certification", "Beginner", "https://grow.google/certificates/", "Google"),
    resource("Microsoft Learn Certifications", "Official Microsoft certification paths across business, data, cloud, and productivity tools.", "Certification", "Intermediate", "https://learn.microsoft.com/en-us/credentials/", "Microsoft"),
    resource("Coursera Professional Certificates", "Company-backed certificates from Google, Meta, IBM, Microsoft, and other providers.", "Certification", "Beginner", "https://www.coursera.org/professional-certificates", "Coursera"),
  ],
  tools: [
    resource("Notion", "Organize notes, resources, project plans, and interview preparation.", "Tool", "Beginner", "https://www.notion.so/", "Notion"),
    resource("GitHub", "Build a visible portfolio with projects, documentation, and learning artifacts.", "Tool", "Beginner", "https://github.com/", "GitHub"),
    resource("Google Workspace Learning Center", "Improve Docs, Sheets, Slides, and professional collaboration workflows.", "Tool", "Beginner", "https://support.google.com/a/users", "Google"),
  ],
};

const youtubePlaylistsByTrack = {
  dataAnalytics: [
    youtubePlaylist("SQL for Data Analysts Playlists", "Query practice, interview SQL, joins, windows, and analytics case walkthroughs.", "Alex The Analyst", "Beginner", "https://www.youtube.com/@AlexTheAnalyst/playlists"),
    youtubePlaylist("Power BI Learning Playlists", "Dashboard building, DAX, modeling, and practical Power BI reporting guidance.", "Guy in a Cube", "Intermediate", "https://www.youtube.com/@GuyInACube/playlists"),
    youtubePlaylist("Tableau Interview & Dashboard Playlists", "Visual analytics, dashboard thinking, Tableau projects, and portfolio-ready examples.", "Tableau Tim", "Beginner", "https://www.youtube.com/@TableauTim/playlists"),
  ],
  cybersecurity: [
    youtubePlaylist("Ethical Hacking & Practical Security Playlists", "Hands-on security fundamentals, exploitation labs, Linux basics, and professional workflows.", "TCM Security", "Beginner", "https://www.youtube.com/@TCMSecurityAcademy/playlists"),
    youtubePlaylist("SOC Analyst & Malware Analysis Playlists", "Blue-team investigations, threat analysis, CTF walkthroughs, and security tooling practice.", "John Hammond", "Intermediate", "https://www.youtube.com/@_JohnHammond/playlists"),
    youtubePlaylist("Network Security Playlists", "Networking, Linux security, web security, and penetration-testing foundations.", "HackerSploit", "Intermediate", "https://www.youtube.com/@HackerSploit/playlists"),
  ],
  cloud: [
    youtubePlaylist("AWS Cloud Practitioner Playlists", "Cloud fundamentals, AWS services, architecture basics, and certification-oriented review.", "AWS Training and Certification", "Beginner", "https://www.youtube.com/@AWSTraining/playlists"),
    youtubePlaylist("Azure Fundamentals Playlists", "Azure identity, networking, compute, storage, and administrator-oriented learning paths.", "Microsoft Azure", "Beginner", "https://www.youtube.com/@MicrosoftAzure/playlists"),
    youtubePlaylist("DevOps & Kubernetes Playlists", "Containers, CI/CD, Kubernetes, and platform engineering walkthroughs for cloud roles.", "TechWorld with Nana", "Intermediate", "https://www.youtube.com/@TechWorldwithNana/playlists"),
  ],
  aiMl: [
    youtubePlaylist("Machine Learning Course Playlists", "ML foundations, model training, neural networks, and applied AI project walkthroughs.", "freeCodeCamp.org", "Beginner", "https://www.youtube.com/@freecodecamp/playlists"),
    youtubePlaylist("Deep Learning Playlists", "Neural networks, practical deep learning concepts, and model-building intuition.", "DeepLearningAI", "Intermediate", "https://www.youtube.com/@Deeplearningai/playlists"),
    youtubePlaylist("Python ML Project Playlists", "Applied notebooks, pandas workflows, model experiments, and portfolio-style ML practice.", "Ken Jee", "Intermediate", "https://www.youtube.com/@KenJee1/playlists"),
  ],
  healthcare: [
    youtubePlaylist("Anatomy & Physiology Revision Playlists", "High-quality anatomy, physiology, pathology, and clinical reasoning lessons.", "Ninja Nerd", "Beginner", "https://www.youtube.com/@NinjaNerdOfficial/playlists"),
    youtubePlaylist("Clinical Communication & OSCE Playlists", "Patient communication, examinations, clinical skills, and case-based OSCE preparation.", "Geeky Medics", "Intermediate", "https://www.youtube.com/@GeekyMedics/playlists"),
    youtubePlaylist("Nursing Procedure Walkthroughs", "Clinical procedures, nursing skills, dosage calculation, and bedside-practice refreshers.", "RegisteredNurseRN", "Beginner", "https://www.youtube.com/@RegisteredNurseRN/playlists"),
  ],
  manufacturing: [
    youtubePlaylist("Lean Manufacturing Playlists", "Lean systems, value streams, kaizen, standard work, and operational excellence examples.", "Gemba Academy", "Beginner", "https://www.youtube.com/@GembaAcademy/playlists"),
    youtubePlaylist("Six Sigma & Quality Playlists", "Process capability, variation, root-cause analysis, quality tools, and improvement methods.", "ASQ TV", "Intermediate", "https://www.youtube.com/@ASQTV/playlists"),
    youtubePlaylist("Industrial Automation Playlists", "PLC basics, control systems, sensors, production automation, and factory engineering concepts.", "RealPars", "Intermediate", "https://www.youtube.com/@realpars/playlists"),
  ],
  finance: [
    youtubePlaylist("Financial Modeling Playlists", "Valuation, accounting, Excel modeling, and analyst-ready finance workflows.", "Corporate Finance Institute", "Intermediate", "https://www.youtube.com/@corporatefinanceinstitute/playlists"),
    youtubePlaylist("CFA Learning Playlists", "Ethics, portfolio management, markets, and investment concepts from a recognized finance body.", "CFA Institute", "Advanced", "https://www.youtube.com/@CFAInstitute/playlists"),
    youtubePlaylist("Finance Interview Prep Playlists", "Technical finance concepts, valuation discussions, and banking interview preparation.", "Wall Street Prep", "Advanced", "https://www.youtube.com/@WallStreetPrep/playlists"),
  ],
  consulting: [
    youtubePlaylist("Case Interview Playlists", "Market sizing, profitability cases, structuring drills, and candidate-led case practice.", "CaseInterview.com", "Beginner", "https://www.youtube.com/@caseinterview/playlists"),
    youtubePlaylist("Business Strategy Playlists", "Consulting-style thinking, strategy examples, and executive business analysis.", "Harvard Business Review", "Intermediate", "https://www.youtube.com/@HarvardBusinessReview/playlists"),
    youtubePlaylist("Project Management Playlists", "Stakeholder management, planning, delivery, and practical project leadership lessons.", "Project Management Institute", "Intermediate", "https://www.youtube.com/@PMInstitute/playlists"),
  ],
  general: [
    youtubePlaylist("Career Skills Playlists", "Professional skills, interviews, workplace communication, and role-readiness learning.", "Google Career Certificates", "Beginner", "https://www.youtube.com/@GoogleCareerCertificates/playlists"),
    youtubePlaylist("Professional Learning Playlists", "Business, productivity, communication, and career development topics from trusted instructors.", "LinkedIn Learning", "Beginner", "https://www.youtube.com/@LinkedInLearning/playlists"),
    youtubePlaylist("Course Playlists by Career Path", "Long-form tutorials and practical project courses across popular career domains.", "freeCodeCamp.org", "Beginner", "https://www.youtube.com/@freecodecamp/playlists"),
  ],
};

const softwareYoutubePlaylists = {
  frontend: [
    youtubePlaylist("React Roadmap Playlists", "React fundamentals, hooks, component architecture, and frontend project progression.", "The Net Ninja", "Beginner", "https://www.youtube.com/@NetNinja/playlists"),
    youtubePlaylist("JavaScript Interview Prep Playlists", "Closures, async JavaScript, prototypes, browser APIs, and interview-ready explanations.", "Akshay Saini", "Intermediate", "https://www.youtube.com/@akshaymarch7/playlists"),
    youtubePlaylist("Next.js Full Course Playlists", "Modern React, Next.js routing, server rendering, projects, and production app patterns.", "JavaScript Mastery", "Intermediate", "https://www.youtube.com/@javascriptmastery/playlists"),
  ],
  backend: [
    youtubePlaylist("Node.js Backend Playlists", "Node, Express, APIs, authentication, backend projects, and practical service design.", "Traversy Media", "Beginner", "https://www.youtube.com/@TraversyMedia/playlists"),
    youtubePlaylist("API Design & Backend Architecture Playlists", "Backend architecture, databases, API patterns, and production engineering lessons.", "ByteByteGo", "Intermediate", "https://www.youtube.com/@ByteByteGo/playlists"),
    youtubePlaylist("Database Optimization Playlists", "SQL, indexing, query planning, and database internals for backend interview depth.", "CMU Database Group", "Advanced", "https://www.youtube.com/@CMUDatabaseGroup/playlists"),
  ],
  dsa: [
    youtubePlaylist("NeetCode DSA Playlists", "LeetCode patterns, Blind 75-style walkthroughs, and structured coding interview practice.", "NeetCode", "Intermediate", "https://www.youtube.com/@NeetCode/playlists"),
    youtubePlaylist("Algorithm Explanation Playlists", "Clear algorithms, data structures, recursion, graphs, dynamic programming, and analysis.", "Abdul Bari", "Intermediate", "https://www.youtube.com/@abdul_bari/playlists"),
    youtubePlaylist("Coding Interview Walkthroughs", "Problem-solving explanations and interview-style coding patterns for software roles.", "freeCodeCamp.org", "Beginner", "https://www.youtube.com/@freecodecamp/playlists"),
  ],
  general: [
    youtubePlaylist("Software Engineering Project Playlists", "Full-stack projects, JavaScript depth, and practical engineering workflows.", "freeCodeCamp.org", "Beginner", "https://www.youtube.com/@freecodecamp/playlists"),
    youtubePlaylist("System Design Playlists", "Architecture concepts, tradeoffs, distributed systems, and senior interview preparation.", "ByteByteGo", "Advanced", "https://www.youtube.com/@ByteByteGo/playlists"),
    youtubePlaylist("Modern Web Development Playlists", "Frontend, backend, tooling, projects, and concise modern engineering explanations.", "Fireship", "Intermediate", "https://www.youtube.com/@Fireship/playlists"),
  ],
};

const getYoutubePlaylists = ({ track, targetRole, subdomainName, skillFocus }) => {
  if (track !== "software") {
    return youtubePlaylistsByTrack[track] || youtubePlaylistsByTrack.general;
  }

  const profileText = [targetRole, subdomainName, ...skillFocus].join(" ").toLowerCase();

  if (hasAny(profileText, ["react", "frontend", "front-end", "next", "javascript", "css", "html"])) {
    return softwareYoutubePlaylists.frontend;
  }

  if (hasAny(profileText, ["node", "backend", "back-end", "api", "database", "sql", "java", "spring"])) {
    return softwareYoutubePlaylists.backend;
  }

  if (hasAny(profileText, ["dsa", "algorithm", "data structure", "leetcode", "coding interview"])) {
    return softwareYoutubePlaylists.dsa;
  }

  return softwareYoutubePlaylists.general;
};

export const buildResourceHub = (profile) => {
  const industry = parseIndustry(profile?.industry);
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];
  const track = inferTrack({
    domainId: industry.domainId,
    subdomainName: industry.subdomainName,
    skills,
    bio: profile?.bio,
  });
  const targetRole = inferTargetRole(track, industry.subdomainName, skills);
  const skillFocus = inferSkillFocus(track, skills);
  const resources = resourcesByTrack[track] || generalResources;
  const youtubePlaylists = getYoutubePlaylists({
    track,
    targetRole,
    subdomainName: industry.subdomainName,
    skillFocus,
  });

  return {
    ...industry,
    track,
    targetRole,
    skillFocus,
    experienceLevel:
      Number(profile?.experience || 0) >= 5
        ? "Advanced"
        : Number(profile?.experience || 0) >= 2
          ? "Intermediate"
          : "Beginner",
    resources,
    youtubePlaylists,
  };
};
