"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseJsonResponse } from "@/lib/ai-utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const DIFFICULTIES = {
  beginner: {
    label: "Beginner",
    instruction:
      "easy, fundamentals-focused questions suitable for entry-level candidates",
    next: "intermediate",
  },
  intermediate: {
    label: "Intermediate",
    instruction:
      "medium-difficulty scenario questions for candidates with working knowledge",
    next: "advanced",
  },
  advanced: {
    label: "Advanced",
    instruction:
      "difficult, judgment-heavy questions for experienced candidates",
    next: "advanced",
  },
};

const DEFAULT_ADVANCED_TOPICS = [
  "strategy",
  "risk management",
  "stakeholder communication",
  "resource allocation",
  "process improvement",
  "compliance",
  "performance optimization",
  "leadership",
  "decision making",
  "technical troubleshooting",
];

function getAdvancedTopicCategories(domain) {
  if (domain.label === "Software and Technology") {
    return [
      "system design",
      "debugging",
      "scalability",
      "security",
      "database design",
      "API integration",
      "incident response",
      "technical tradeoffs",
      "cross-functional leadership",
      "risk management",
    ];
  }

  if (domain.label === "Finance") {
    return [
      "financial analysis",
      "risk controls",
      "compliance",
      "portfolio judgment",
      "valuation tradeoffs",
      "stakeholder communication",
      "market volatility",
      "audit readiness",
      "decision making",
      "ethics",
    ];
  }

  if (domain.label === "Medical and Healthcare") {
    return [
      "patient safety",
      "clinical prioritization",
      "ethics",
      "diagnostic reasoning",
      "care coordination",
      "compliance",
      "risk escalation",
      "resource allocation",
      "communication",
      "quality improvement",
    ];
  }

  return domain.advancedTopics || DEFAULT_ADVANCED_TOPICS;
}

function getBeginnerIntermediateTopics(domain) {
  if (domain.label === "Software and Technology") {
    return [
      "programming fundamentals",
      "debugging",
      "APIs",
      "databases",
      "security basics",
      "testing",
      "version control",
      "performance",
      "communication",
      "problem solving",
    ];
  }

  return domain.practiceTopics || [
    "role fundamentals",
    "communication basics",
    "workflow understanding",
    "quality basics",
    "team coordination",
    "prioritization",
    "customer impact",
    "risk awareness",
    "process improvement",
    "workplace judgment",
  ];
}

function getInterviewContexts(domain) {
  const contextMap = {
    "Data Analytics and Data Science": [
      "SQL reviews",
      "dashboard decisions",
      "KPI analysis",
      "data quality issues",
      "model evaluation",
      "stakeholder insight reviews",
      "business intelligence requests",
      "experimentation tradeoffs",
    ],
    Cybersecurity: [
      "vulnerability triage",
      "OWASP findings",
      "SIEM investigations",
      "incident response",
      "authentication failures",
      "cloud misconfigurations",
      "malware alerts",
      "access-control reviews",
    ],
    "Mechanical Engineering": [
      "CAD design reviews",
      "tolerance analysis",
      "materials selection",
      "thermal calculations",
      "fluid-flow issues",
      "maintenance diagnostics",
      "manufacturing defects",
      "reliability reviews",
    ],
    "Software and Technology": [
      "debugging sessions",
      "API design",
      "database tradeoffs",
      "system design reviews",
      "incident response",
      "cloud deployments",
      "security reviews",
      "cross-functional product decisions",
    ],
    "Medical and Healthcare": [
      "patient care handoffs",
      "clinical prioritization",
      "hospital workflow",
      "treatment coordination",
      "medical ethics",
      "emergency response",
      "healthcare compliance",
      "patient-safety escalation",
    ],
    Finance: [
      "budget reviews",
      "financial forecasting",
      "risk controls",
      "audit readiness",
      "investment decisions",
      "compliance reviews",
      "variance analysis",
      "stakeholder reporting",
    ],
    Marketing: [
      "campaign planning",
      "SEO decisions",
      "brand positioning",
      "conversion optimization",
      "customer acquisition",
      "channel attribution",
      "creative testing",
      "growth experiments",
    ],
    "Human Resources": [
      "hiring decisions",
      "employee conflict",
      "onboarding design",
      "retention planning",
      "performance feedback",
      "HR policy questions",
      "workforce planning",
      "candidate screening",
    ],
    "Manufacturing and Industrial": [
      "production planning",
      "safety audits",
      "quality defects",
      "supplier delays",
      "downtime reduction",
      "lean manufacturing",
      "root cause analysis",
      "shift coordination",
    ],
    "Retail and E-commerce": [
      "customer escalations",
      "inventory planning",
      "merchandising decisions",
      "order fulfillment",
      "conversion funnels",
      "pricing tradeoffs",
      "marketplace operations",
      "retention programs",
    ],
    "Media and Entertainment": [
      "content calendars",
      "audience growth",
      "brand safety",
      "streaming metrics",
      "creator partnerships",
      "campaign attribution",
      "publishing deadlines",
      "event execution",
    ],
    Education: [
      "lesson planning",
      "learner engagement",
      "assessment design",
      "curriculum decisions",
      "student support",
      "accessibility needs",
      "learning analytics",
      "training delivery",
    ],
    "Energy and Utilities": [
      "grid reliability",
      "renewable integration",
      "asset maintenance",
      "safety compliance",
      "environmental impact",
      "utility outages",
      "demand forecasting",
      "capital planning",
    ],
    "Professional Services": [
      "client discovery",
      "problem structuring",
      "executive communication",
      "project risk",
      "implementation planning",
      "business advisory",
      "change management",
      "recommendation reviews",
    ],
    Telecommunications: [
      "network outages",
      "5G rollout",
      "fiber expansion",
      "service-level decisions",
      "vendor coordination",
      "capacity planning",
      "network security",
      "customer impact",
    ],
    "Transportation and Logistics": [
      "route optimization",
      "fleet utilization",
      "warehouse throughput",
      "carrier delays",
      "last-mile delivery",
      "freight cost control",
      "safety compliance",
      "customer escalation",
    ],
    "Agriculture and Food": [
      "crop planning",
      "food safety",
      "yield monitoring",
      "weather risk",
      "equipment downtime",
      "supply chain resilience",
      "quality checks",
      "sustainability tradeoffs",
    ],
    "Construction and Real Estate": [
      "site safety",
      "project scheduling",
      "contractor coordination",
      "materials shortages",
      "quality inspections",
      "permit delays",
      "cost overruns",
      "facility planning",
    ],
    "Hospitality and Tourism": [
      "guest service",
      "booking issues",
      "service recovery",
      "staff scheduling",
      "food safety",
      "revenue management",
      "event planning",
      "brand reputation",
    ],
    "Non-Profit and Social Services": [
      "program delivery",
      "community needs",
      "grant compliance",
      "fundraising priorities",
      "volunteer coordination",
      "impact measurement",
      "advocacy decisions",
      "stakeholder trust",
    ],
  };

  return (
    contextMap[domain.label] || [
      "stakeholder discussions",
      "workflow decisions",
      "risk reviews",
      "service quality",
      "communication challenges",
      "resource constraints",
      "process improvements",
      "professional judgment",
    ]
  );
}

function getQuestionQualityGuide(domain, difficultyKey) {
  const guideMap = {
    "Software and Technology":
      "Ask real technical interview questions: coding logic, DSA, debugging, DBMS, REST APIs, React/frontend, backend services, OS/networking basics, authentication, caching, concurrency, cloud, and system design. At least 8 of 10 questions must test concrete software knowledge. Avoid vague business-management questions unless tied to architecture, production incidents, scalability, or debugging.",
    Cybersecurity:
      "Ask real cybersecurity interview questions: OWASP vulnerabilities, authentication, authorization, encryption, SIEM alerts, incident response, malware triage, network security, cloud misconfiguration, penetration testing, access control, and threat modeling. Avoid generic risk language unless the scenario includes concrete security evidence.",
    "Data Analytics and Data Science":
      "Ask real analytics interview questions: SQL, joins, aggregations, dashboards, Power BI/Tableau, Excel, Python/R, statistics, A/B testing, KPI design, data cleaning, ML evaluation, and business insight communication. Require data-specific reasoning, not generic project management.",
    "Medical and Healthcare":
      "Ask realistic healthcare interview questions: patient symptoms, triage, diagnosis reasoning, treatment prioritization, emergency response, medical ethics, medication safety, infection control, handoffs, documentation, and compliance. Avoid business-style prompts that do not include patient-care context.",
    "Mechanical Engineering":
      "Ask real mechanical engineering questions: thermodynamics, CAD, tolerances, materials, manufacturing processes, maintenance, fluid mechanics, quality inspection, root cause analysis, reliability, and safety factors. Require engineering calculations or troubleshooting logic where appropriate.",
    Finance:
      "Ask real finance interview questions: financial statements, valuation, ratios, forecasting, accounting principles, budgeting, investment logic, risk management, audit readiness, compliance, and business communication with numbers.",
    Marketing:
      "Ask real marketing interview questions: campaigns, SEO, brand positioning, conversion optimization, social media, customer acquisition, content, marketing analytics, A/B testing, CAC/LTV, attribution, and market research.",
  };
  const difficultyGuide = {
    beginner:
      "Beginner questions should be direct fundamentals with one clear concept and entry-level wording.",
    intermediate:
      "Intermediate questions should apply concepts to practical work situations with moderate ambiguity.",
    advanced:
      "Advanced questions should be difficult, production-grade, case-like, and require edge-case reasoning, architecture, diagnostics, or senior judgment.",
  };

  return `${guideMap[domain.label] || "Ask realistic, role-specific interview questions using concrete terminology from the selected industry and specialization."} ${difficultyGuide[difficultyKey]}`;
}

const QUESTION_BLUEPRINTS = [
  {
    topic: "Safety",
    beginner:
      "A team member is about to clean a machine before confirming isolation. What should you do first?",
    intermediate:
      "A shift lead says a lockout step is slowing production during a rush order. What is the best response?",
    advanced:
      "A safety audit finds repeated lockout-tagout shortcuts across two shifts while production targets are already behind. What action best balances safety, accountability, and output recovery?",
    correct:
      "Stop the unsafe work, verify the procedure, involve the supervisor, and restart only after controls are followed.",
    distractors: [
      "Allow the work to continue if the operator has done it safely before.",
      "Ask the team to be faster next time but avoid interrupting production.",
      "Document the concern at the end of the shift without changing the current task.",
    ],
    explanation:
      "Safety-critical work must be stopped immediately because production pressure never overrides verified controls and supervisor alignment.",
  },
  {
    topic: "Production Planning",
    beginner:
      "A production schedule shows more work than the line can complete today. What basic planning step helps first?",
    intermediate:
      "A priority customer order arrives while two lower-margin orders are already scheduled. How should the planner respond?",
    advanced:
      "A new high-margin product must launch next week, but the current line is constrained by labor, changeover time, and existing customer commitments. What is the strongest planning approach?",
    correct:
      "Review capacity, rank orders by business impact and due date, then adjust the schedule with clear stakeholder communication.",
    distractors: [
      "Run orders in the sequence they arrived to avoid difficult prioritization.",
      "Move all workers to the new product without checking downstream constraints.",
      "Delay every existing order until the new product is fully complete.",
    ],
    explanation:
      "Good planning weighs capacity, deadlines, margin, and communication instead of reacting to the newest request alone.",
  },
  {
    topic: "Quality Control",
    beginner:
      "An operator notices multiple parts failing the same inspection check. What should happen next?",
    intermediate:
      "Customer complaints increase after a tooling change, but the final inspection pass rate still looks normal. What is the best next step?",
    advanced:
      "A defect appears intermittently across batches, customer returns are rising, and no single operator or shift explains the pattern. What response best supports quality recovery?",
    correct:
      "Contain suspect output, analyze process data, run root cause analysis, and verify corrective action before full release.",
    distractors: [
      "Increase final inspection only and keep the process unchanged.",
      "Blame the most recent operator because the issue appeared on their shift.",
      "Ship current inventory because the defect is not present in every batch.",
    ],
    explanation:
      "Quality issues need containment and evidence-based root cause analysis so the team fixes the process, not only the symptom.",
  },
  {
    topic: "Supply Chain",
    beginner:
      "A supplier warns that a routine material delivery will be late. What is the most practical first response?",
    intermediate:
      "A key supplier delay threatens this week's production target. Which action is most appropriate?",
    advanced:
      "A single-source supplier misses two deliveries, spot-buy prices are rising, and customer penalties start next week. What is the best supply chain decision?",
    correct:
      "Check inventory coverage, communicate risk early, qualify alternatives, and adjust the plan based on customer impact.",
    distractors: [
      "Wait for the supplier because changing plans may create extra work.",
      "Buy from the cheapest unknown supplier immediately without qualification.",
      "Keep the original production plan and inform customers only after missing delivery.",
    ],
    explanation:
      "Supply risk is managed through visibility, qualified alternatives, and timely communication tied to customer impact.",
  },
  {
    topic: "Lean Manufacturing",
    beginner:
      "Which action best supports reducing waste on a production line?",
    intermediate:
      "Operators spend too much time walking between tools during changeover. What improvement should be tested first?",
    advanced:
      "Changeovers are limiting throughput, but the plant also has excess WIP and uneven station utilization. What improvement strategy is strongest?",
    correct:
      "Map the process, separate internal and external work, reduce movement, and test changes with measured results.",
    distractors: [
      "Add more WIP before each station so every operator always looks busy.",
      "Ask operators to work faster without changing the process design.",
      "Ignore changeover time and focus only on monthly output totals.",
    ],
    explanation:
      "Lean improvement starts by seeing the workflow, removing waste, and measuring whether the change improves flow.",
  },
  {
    topic: "Process Optimization",
    beginner:
      "A line misses its hourly target several times a week. Which metric helps understand the issue?",
    intermediate:
      "A machine has short, repeated stoppages that operators reset without reporting. What should you do?",
    advanced:
      "OEE has declined for three weeks, downtime logs are incomplete, and maintenance wants to replace equipment while operations suspects setup variation. What is the best next move?",
    correct:
      "Collect reliable downtime data, segment losses, identify the largest causes, and validate fixes before major spending.",
    distractors: [
      "Replace the machine immediately because downtime always means asset failure.",
      "Ignore short stops because they are too small to affect business results.",
      "Average all losses together and assign one generic corrective action.",
    ],
    explanation:
      "Optimization depends on trustworthy loss data and targeted fixes before expensive or broad interventions.",
  },
  {
    topic: "Leadership",
    beginner:
      "Two team members disagree about who should complete a handoff task. What is the best supervisor response?",
    intermediate:
      "A senior operator resists a new standard work process and influences others to ignore it. What should the lead do?",
    advanced:
      "A cross-functional team disagrees on whether to prioritize output, quality containment, or maintenance downtime during a critical week. How should you lead the decision?",
    correct:
      "Clarify the goal, listen to concerns, align roles, explain the decision logic, and follow up on execution.",
    distractors: [
      "Avoid the disagreement and let the loudest stakeholder decide.",
      "Escalate every disagreement immediately without attempting alignment.",
      "Force compliance without explaining the reason or checking obstacles.",
    ],
    explanation:
      "Leadership in operations requires clarity, listening, decision transparency, and follow-through across stakeholders.",
  },
  {
    topic: "Risk Management",
    beginner:
      "A process change is planned for tomorrow. What basic step reduces implementation risk?",
    intermediate:
      "A change could improve speed but may increase rework if operators are not trained. What is the best approach?",
    advanced:
      "A proposed process change improves throughput by 12%, but it may increase warranty risk and requires supplier coordination. What decision process is strongest?",
    correct:
      "Assess severity and likelihood, pilot the change, define controls, and review results before full rollout.",
    distractors: [
      "Roll out immediately because throughput improvement is always the top priority.",
      "Reject the change because any risk means the process should stay the same.",
      "Let each shift decide independently whether to use the new process.",
    ],
    explanation:
      "Risk management compares impact and likelihood, then uses controlled pilots and safeguards to make better decisions.",
  },
  {
    topic: "Technical Troubleshooting",
    beginner:
      "A machine stops twice after the same alarm appears. What should the operator do first?",
    intermediate:
      "A sensor fault appears only during humid morning shifts. What troubleshooting step is most useful?",
    advanced:
      "A packaging line fails unpredictably after maintenance, but only under certain product sizes and speeds. What troubleshooting approach is best?",
    correct:
      "Reproduce conditions, check recent changes, review data, and isolate variables before selecting a corrective action.",
    distractors: [
      "Replace multiple parts at once so the team can move faster.",
      "Disable the alarm temporarily if production is behind schedule.",
      "Assume the last technician caused the issue and skip data review.",
    ],
    explanation:
      "Troubleshooting improves when the team isolates variables and verifies causes rather than guessing or changing many things at once.",
  },
  {
    topic: "Decision Making",
    beginner:
      "A supervisor asks you to choose between two routine tasks. What should guide your decision?",
    intermediate:
      "You must choose between completing a small urgent job and preparing a larger job due tomorrow. What is the best decision method?",
    advanced:
      "Two customers need expedited orders, one line is short-staffed, and quality checks cannot be skipped. What is the best decision-making approach?",
    correct:
      "Compare urgency, customer impact, resource limits, and quality requirements, then communicate the chosen priority clearly.",
    distractors: [
      "Choose the easiest job first so the team can show quick progress.",
      "Skip quality checks for the smaller order to satisfy both customers.",
      "Avoid deciding until both customers complain directly.",
    ],
    explanation:
      "Strong decisions balance urgency, customer value, constraints, and non-negotiable quality requirements.",
  },
];

const DOMAIN_MAP = [
  {
    keys: ["cybersecurity", "cyber", "network-security", "security"],
    label: "Cybersecurity",
    focus:
      "vulnerabilities, OWASP, penetration testing, authentication, encryption, SIEM, malware analysis, incident response, access control, cloud security, network security, and security operations",
    fallbackTopic: "Security fundamentals",
    practiceTopics: [
      "OWASP basics",
      "authentication",
      "encryption basics",
      "network security",
      "vulnerability scanning",
      "SIEM alerts",
      "malware basics",
      "incident response",
      "access control",
      "security logging",
    ],
    advancedTopics: [
      "web application exploitation",
      "zero-trust access",
      "incident containment",
      "SIEM correlation",
      "cloud misconfiguration",
      "malware triage",
      "privilege escalation",
      "encryption design",
      "threat modeling",
      "forensic investigation",
    ],
  },
  {
    keys: ["mechanical", "machinery", "equipment", "cad", "automotive", "aerospace", "metal-fabrication"],
    label: "Mechanical Engineering",
    focus:
      "thermodynamics, CAD, tolerances, materials, manufacturing systems, maintenance, fluid mechanics, machine design, reliability, quality, and mechanical troubleshooting",
    fallbackTopic: "Mechanical systems",
    practiceTopics: [
      "thermodynamics basics",
      "CAD fundamentals",
      "tolerances",
      "materials selection",
      "maintenance basics",
      "fluid mechanics",
      "manufacturing processes",
      "machine components",
      "quality checks",
      "safety basics",
    ],
    advancedTopics: [
      "thermal system optimization",
      "tolerance stack-up",
      "failure mode analysis",
      "material fatigue",
      "fluid flow troubleshooting",
      "preventive maintenance",
      "DFM tradeoffs",
      "CAD design validation",
      "root cause analysis",
      "reliability engineering",
    ],
  },
  {
    keys: ["data-science", "analytics", "business-intelligence", "data-analytics"],
    label: "Data Analytics and Data Science",
    focus:
      "SQL, dashboards, statistics, machine learning, visualization, KPI analysis, business intelligence, Python or R, predictive analytics, data quality, experimentation, and insight communication",
    fallbackTopic: "Data analysis",
    practiceTopics: [
      "SQL basics",
      "dashboard interpretation",
      "statistics basics",
      "data cleaning",
      "KPI analysis",
      "visualization",
      "Python or R basics",
      "business intelligence",
      "data storytelling",
      "model evaluation",
    ],
    advancedTopics: [
      "SQL optimization",
      "dashboard strategy",
      "statistical inference",
      "machine learning evaluation",
      "KPI design",
      "predictive analytics",
      "data quality",
      "experimentation",
      "stakeholder insight communication",
      "business impact analysis",
    ],
  },
  {
    keys: ["healthcare", "medical", "pharma", "clinical", "biotech"],
    label: "Medical and Healthcare",
    focus:
      "patient care, clinical reasoning, healthcare operations, ethics, safety, medical terminology, diagnostics, public health, and healthcare technology",
    fallbackTopic: "Clinical fundamentals",
    practiceTopics: [
      "patient care basics",
      "medical ethics",
      "clinical workflow",
      "diagnostic reasoning",
      "emergency response",
      "healthcare compliance",
      "treatment prioritization",
      "patient communication",
      "hospital operations",
      "care coordination",
    ],
    advancedTopics: [
      "patient safety",
      "clinical prioritization",
      "ethics",
      "diagnostic reasoning",
      "care coordination",
      "compliance",
      "risk escalation",
      "resource allocation",
      "communication",
      "quality improvement",
    ],
  },
  {
    keys: ["finance", "banking", "investment", "insurance", "wealth", "risk"],
    label: "Finance",
    focus:
      "financial analysis, risk, accounting concepts, markets, banking, compliance, valuation, portfolio basics, and business decision-making",
    fallbackTopic: "Financial analysis",
    practiceTopics: [
      "budgeting basics",
      "accounting principles",
      "financial statements",
      "forecasting",
      "investment logic",
      "risk basics",
      "compliance",
      "credit analysis",
      "market awareness",
      "financial communication",
    ],
    advancedTopics: [
      "financial analysis",
      "risk controls",
      "compliance",
      "portfolio judgment",
      "valuation tradeoffs",
      "stakeholder communication",
      "market volatility",
      "audit readiness",
      "decision making",
      "ethics",
    ],
  },
  {
    keys: ["marketing", "advertising", "brand", "digital-marketing", "social-media"],
    label: "Marketing",
    focus:
      "customer segmentation, campaign strategy, analytics, branding, content, funnels, positioning, SEO, paid media, and growth metrics",
    fallbackTopic: "Marketing strategy",
    practiceTopics: [
      "campaign basics",
      "branding",
      "SEO",
      "customer acquisition",
      "marketing analytics",
      "social media strategy",
      "conversion optimization",
      "content planning",
      "segmentation",
      "budget prioritization",
    ],
    advancedTopics: [
      "campaign strategy",
      "brand positioning",
      "SEO tradeoffs",
      "customer acquisition cost",
      "conversion optimization",
      "marketing analytics",
      "channel attribution",
      "growth experimentation",
      "creative testing",
      "stakeholder alignment",
    ],
  },
  {
    keys: ["human-resources", "hr", "recruiting", "talent"],
    label: "Human Resources",
    focus:
      "recruiting, employee relations, HR policy, performance management, compensation, compliance, engagement, and workplace communication",
    fallbackTopic: "People operations",
    practiceTopics: [
      "hiring basics",
      "employee communication",
      "onboarding",
      "HR policies",
      "conflict handling",
      "retention basics",
      "performance feedback",
      "candidate screening",
      "compliance basics",
      "people analytics",
    ],
    advancedTopics: [
      "hiring strategy",
      "employee conflict",
      "onboarding design",
      "policy compliance",
      "retention strategy",
      "performance management",
      "compensation tradeoffs",
      "workforce planning",
      "employee relations",
      "leadership communication",
    ],
  },
  {
    keys: ["tech", "software", "cloud", "cyber", "ai", "machine", "web-services", "internet", "robotics", "blockchain", "iot", "semiconductor", "electronics"],
    label: "Software and Technology",
    focus:
      "software engineering, data structures, systems, databases, cloud, security, debugging, architecture, APIs, and product-minded engineering",
    fallbackTopic: "Software fundamentals",
    practiceTopics: [
      "coding logic",
      "debugging",
      "APIs",
      "databases",
      "frontend/backend basics",
      "cloud fundamentals",
      "security basics",
      "algorithms",
      "testing",
      "software architecture",
    ],
    advancedTopics: [
      "system design",
      "debugging",
      "scalability",
      "security",
      "database design",
      "API integration",
      "incident response",
      "technical tradeoffs",
      "cross-functional leadership",
      "risk management",
    ],
  },
  {
    keys: ["education", "edtech", "training"],
    label: "Education",
    focus:
      "pedagogy, learning design, assessment, classroom management, learner engagement, curriculum, and education technology",
    fallbackTopic: "Learning design",
    practiceTopics: [
      "lesson planning",
      "assessment basics",
      "learner engagement",
      "classroom management",
      "curriculum design",
      "education technology",
      "feedback methods",
      "learning outcomes",
      "student support",
      "training delivery",
    ],
    advancedTopics: [
      "curriculum strategy",
      "assessment design",
      "learning analytics",
      "instructional design",
      "student intervention",
      "stakeholder communication",
      "technology adoption",
      "program evaluation",
      "accessibility",
      "change management",
    ],
  },
  {
    keys: ["retail", "e-commerce", "consumer"],
    label: "Retail and E-commerce",
    focus:
      "customer experience, merchandising, operations, inventory, conversion, retention, pricing, and omnichannel commerce",
    fallbackTopic: "Retail operations",
    practiceTopics: [
      "customer experience",
      "inventory basics",
      "merchandising",
      "pricing basics",
      "conversion metrics",
      "order fulfillment",
      "retention basics",
      "store operations",
      "e-commerce funnels",
      "customer support",
    ],
    advancedTopics: [
      "omnichannel strategy",
      "inventory optimization",
      "conversion optimization",
      "customer retention",
      "pricing tradeoffs",
      "merchandising analytics",
      "fulfillment risk",
      "marketplace operations",
      "customer escalation",
      "growth strategy",
    ],
  },
  {
    keys: ["media", "entertainment", "gaming", "streaming", "publishing", "journalism", "animation", "event"],
    label: "Media and Entertainment",
    focus:
      "content strategy, audience growth, digital media, streaming, gaming, advertising, publishing, journalism, creator operations, campaign analytics, and event execution",
    fallbackTopic: "Media strategy",
    practiceTopics: [
      "content planning",
      "audience analysis",
      "campaign basics",
      "publishing workflow",
      "social media",
      "brand safety",
      "engagement metrics",
      "event coordination",
      "creator relations",
      "distribution channels",
    ],
    advancedTopics: [
      "audience growth strategy",
      "content monetization",
      "campaign attribution",
      "brand safety",
      "platform risk",
      "editorial judgment",
      "creator partnerships",
      "streaming metrics",
      "event crisis management",
      "stakeholder alignment",
    ],
  },
  {
    keys: ["energy", "utilities", "renewable", "clean-technology", "oil", "gas", "nuclear", "smart-grid", "mining", "environmental", "water", "waste"],
    label: "Energy and Utilities",
    focus:
      "renewable energy, utilities, grid reliability, energy management, oil and gas operations, safety, environmental compliance, storage, smart grids, mining, water, and waste management",
    fallbackTopic: "Energy operations",
    practiceTopics: [
      "energy basics",
      "utility operations",
      "safety compliance",
      "grid reliability",
      "renewable energy",
      "environmental standards",
      "maintenance planning",
      "risk awareness",
      "customer service",
      "resource management",
    ],
    advancedTopics: [
      "grid reliability",
      "renewable integration",
      "regulatory compliance",
      "asset maintenance",
      "safety risk",
      "environmental impact",
      "energy storage",
      "demand forecasting",
      "incident response",
      "capital planning",
    ],
  },
  {
    keys: ["consulting", "professional-services", "management-consulting", "strategy-consulting", "business-advisory", "legal", "accounting", "tax", "bpo", "engineering-services", "architecture", "digital-transformation"],
    label: "Professional Services",
    focus:
      "consulting, business advisory, client management, problem structuring, legal and accounting operations, digital transformation, process improvement, research, and professional communication",
    fallbackTopic: "Client advisory",
    practiceTopics: [
      "client communication",
      "problem structuring",
      "business analysis",
      "research basics",
      "project planning",
      "stakeholder management",
      "process improvement",
      "presentation skills",
      "risk awareness",
      "recommendation writing",
    ],
    advancedTopics: [
      "client strategy",
      "executive communication",
      "problem decomposition",
      "change management",
      "financial tradeoffs",
      "project risk",
      "stakeholder conflict",
      "implementation planning",
      "business transformation",
      "advisory ethics",
    ],
  },
  {
    keys: ["telecom", "telecommunications", "wireless", "network", "5g", "fiber", "satellite", "voip", "data-centers"],
    label: "Telecommunications",
    focus:
      "network infrastructure, wireless communications, 5G, telecom services, fiber optics, data centers, network security, satellite communications, service reliability, and customer operations",
    fallbackTopic: "Network operations",
    practiceTopics: [
      "network basics",
      "service reliability",
      "wireless concepts",
      "5G basics",
      "fiber operations",
      "network security",
      "customer escalation",
      "outage handling",
      "capacity planning",
      "telecom equipment",
    ],
    advancedTopics: [
      "network reliability",
      "5G rollout strategy",
      "capacity planning",
      "outage response",
      "network security",
      "vendor coordination",
      "fiber expansion",
      "service-level tradeoffs",
      "customer impact",
      "infrastructure risk",
    ],
  },
  {
    keys: ["transportation", "logistics", "supply-chain", "aviation", "railways", "maritime", "fleet", "last-mile", "warehousing", "freight", "cargo", "urban-mobility"],
    label: "Transportation and Logistics",
    focus:
      "logistics, supply chain, fleet management, warehousing, aviation, freight, last-mile delivery, route optimization, customer delivery performance, and operational safety",
    fallbackTopic: "Logistics operations",
    practiceTopics: [
      "route planning",
      "warehouse basics",
      "fleet operations",
      "delivery performance",
      "freight coordination",
      "safety basics",
      "inventory handoff",
      "customer communication",
      "capacity planning",
      "delay handling",
    ],
    advancedTopics: [
      "route optimization",
      "fleet utilization",
      "warehouse throughput",
      "last-mile tradeoffs",
      "carrier risk",
      "aviation disruption",
      "freight cost control",
      "customer escalation",
      "capacity planning",
      "safety compliance",
    ],
  },
  {
    keys: ["agriculture", "agtech", "farming", "food-production", "precision-agriculture", "aquaculture", "vertical-farming", "organic", "plant-based"],
    label: "Agriculture and Food",
    focus:
      "farming, AgTech, food production, sustainable agriculture, precision agriculture, aquaculture, food processing, equipment, supply chain, crop planning, and quality control",
    fallbackTopic: "Agricultural operations",
    practiceTopics: [
      "crop planning",
      "food safety",
      "equipment basics",
      "sustainable agriculture",
      "supply chain",
      "quality checks",
      "yield monitoring",
      "weather risk",
      "resource usage",
      "farm operations",
    ],
    advancedTopics: [
      "yield optimization",
      "precision agriculture",
      "food safety compliance",
      "weather risk",
      "equipment downtime",
      "supply chain resilience",
      "sustainability tradeoffs",
      "quality control",
      "resource allocation",
      "market volatility",
    ],
  },
  {
    keys: ["construction", "real-estate", "property", "building", "infrastructure", "smart-buildings", "facilities", "urban-planning"],
    label: "Construction and Real Estate",
    focus:
      "construction management, real estate development, property management, site safety, project scheduling, building materials, infrastructure, smart buildings, facilities, and urban planning",
    fallbackTopic: "Project delivery",
    practiceTopics: [
      "site safety",
      "project scheduling",
      "budget basics",
      "contractor coordination",
      "materials planning",
      "quality inspections",
      "client communication",
      "property operations",
      "permits",
      "risk awareness",
    ],
    advancedTopics: [
      "project delay management",
      "cost overrun control",
      "site safety risk",
      "contractor conflict",
      "materials shortage",
      "quality compliance",
      "stakeholder coordination",
      "regulatory approvals",
      "facility lifecycle planning",
      "real estate investment tradeoffs",
    ],
  },
  {
    keys: ["hospitality", "tourism", "hotels", "restaurants", "food-service", "travel", "events", "catering", "theme-parks"],
    label: "Hospitality and Tourism",
    focus:
      "guest experience, hotel and restaurant operations, tourism, event planning, food service, revenue management, service recovery, staffing, booking platforms, and hospitality management",
    fallbackTopic: "Guest experience",
    practiceTopics: [
      "guest service",
      "booking basics",
      "restaurant operations",
      "event coordination",
      "service recovery",
      "staff scheduling",
      "food safety",
      "revenue basics",
      "travel operations",
      "customer complaints",
    ],
    advancedTopics: [
      "service recovery",
      "revenue management",
      "staffing tradeoffs",
      "guest escalation",
      "event crisis handling",
      "food safety compliance",
      "booking platform strategy",
      "occupancy forecasting",
      "brand reputation",
      "operations leadership",
    ],
  },
  {
    keys: ["nonprofit", "non-profit", "social-services", "charitable", "humanitarian", "community", "advocacy", "social-enterprise", "environmental-conservation"],
    label: "Non-Profit and Social Services",
    focus:
      "program delivery, community development, social services, fundraising, grant management, advocacy, volunteer coordination, impact measurement, humanitarian aid, and stakeholder trust",
    fallbackTopic: "Program impact",
    practiceTopics: [
      "community needs",
      "program delivery",
      "volunteer coordination",
      "fundraising basics",
      "grant basics",
      "impact measurement",
      "stakeholder communication",
      "case management",
      "advocacy",
      "ethical decision making",
    ],
    advancedTopics: [
      "impact measurement",
      "funding strategy",
      "grant compliance",
      "program prioritization",
      "community trust",
      "volunteer risk",
      "advocacy strategy",
      "resource allocation",
      "stakeholder conflict",
      "ethical escalation",
    ],
  },
  {
    keys: ["manufacturing", "industrial", "automotive", "aerospace"],
    label: "Manufacturing and Industrial",
    focus:
      "operations, quality, lean manufacturing, safety, supply chain, process improvement, materials, and production planning",
    fallbackTopic: "Operations quality",
    practiceTopics: [
      "safety basics",
      "production basics",
      "quality basics",
      "communication basics",
      "process improvement",
      "team coordination",
      "supplier delays",
      "defect analysis",
      "prioritization",
      "workplace judgment",
    ],
    advancedTopics: DEFAULT_ADVANCED_TOPICS,
  },
];

const TOP_LEVEL_DOMAIN_LABELS = {
  tech: "Software and Technology",
  finance: "Finance",
  healthcare: "Medical and Healthcare",
  manufacturing: "Manufacturing and Industrial",
  retail: "Retail and E-commerce",
  media: "Media and Entertainment",
  education: "Education",
  energy: "Energy and Utilities",
  consulting: "Professional Services",
  telecom: "Telecommunications",
  transportation: "Transportation and Logistics",
  agriculture: "Agriculture and Food",
  construction: "Construction and Real Estate",
  hospitality: "Hospitality and Tourism",
  nonprofit: "Non-Profit and Social Services",
};

const SPECIALIZED_DOMAIN_OVERRIDES = [
  {
    prefixes: [
      "tech-data-science",
      "tech-business-intelligence",
      "healthcare-healthcare-analytics",
    ],
    label: "Data Analytics and Data Science",
  },
  {
    prefixes: ["tech-cybersecurity", "telecom-network-security"],
    label: "Cybersecurity",
  },
  {
    prefixes: [
      "manufacturing-automotive",
      "manufacturing-aerospace",
      "manufacturing-machinery",
      "manufacturing-metal-fabrication",
      "manufacturing-3d-printing",
    ],
    label: "Mechanical Engineering",
  },
  {
    prefixes: ["media-digital-marketing", "media-advertising", "consulting-marketing-services"],
    label: "Marketing",
  },
  {
    prefixes: ["consulting-human-resources"],
    label: "Human Resources",
  },
];

function domainByLabel(label) {
  return DOMAIN_MAP.find((domain) => domain.label === label);
}

function normalizeDifficulty(value) {
  return DIFFICULTIES[value] ? value : "beginner";
}

function resolveDomain(industry = "") {
  const normalized = industry.toLowerCase();
  const override = SPECIALIZED_DOMAIN_OVERRIDES.find((domain) =>
    domain.prefixes.some((prefix) => normalized.startsWith(prefix))
  );
  if (override) {
    return domainByLabel(override.label);
  }

  const topLevel = Object.entries(TOP_LEVEL_DOMAIN_LABELS).find(
    ([key]) => normalized === key || normalized.startsWith(`${key}-`)
  );
  if (topLevel) {
    return domainByLabel(topLevel[1]);
  }

  return (
    DOMAIN_MAP.find((domain) =>
      domain.keys.some((key) => normalized.includes(key))
    ) || {
      label: "General Professional",
      focus:
        "communication, business judgment, problem-solving, role readiness, stakeholder management, and professional fundamentals",
      fallbackTopic: "Professional judgment",
    }
  );
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatProfileContext(user) {
  const specialization = getSpecialization(user.industry);
  const skills = user.skills?.length ? user.skills.join(", ") : "not provided";
  const topIndustrySkills = user.industryInsight?.topSkills?.length
    ? user.industryInsight.topSkills.join(", ")
    : "not provided";
  const recommendedSkills = user.industryInsight?.recommendedSkills?.length
    ? user.industryInsight.recommendedSkills.join(", ")
    : "not provided";
  const keyTrends = user.industryInsight?.keyTrends?.length
    ? user.industryInsight.keyTrends.join(", ")
    : "not provided";

  return `Profile context:
- Industry: ${user.industry || "not provided"}
- Specialization: ${specialization || "not provided"}
- Years of experience: ${user.experience ?? "not provided"}
- Skills/tools: ${skills}
- Professional background/bio: ${user.bio || "not provided"}
- Current industry top skills: ${topIndustrySkills}
- Recommended skills for growth: ${recommendedSkills}
- Relevant industry trends: ${keyTrends}`;
}

function getSpecialization(industry = "") {
  return industry
    ?.split("-")
    .slice(1)
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function uniqueTopics(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function buildSevenDayRoadmap(weakTopics = [], domain) {
  const focusTopics = uniqueTopics([
    ...weakTopics,
    ...getAdvancedTopicCategories(domain),
    ...getBeginnerIntermediateTopics(domain),
  ]).slice(0, 6);
  const defaultTopic = domain.fallbackTopic || "core interview readiness";
  const topics = Array.from({ length: 6 }, (_, index) => focusTopics[index] || defaultTopic);

  return [
    `Day 1 → ${topics[0]}: Review fundamentals; study missed-question explanations; practice two direct scenarios.`,
    `Day 2 → ${topics[1]}: Learn key frameworks; compare strong versus weak decisions; write three sample answers.`,
    `Day 3 → ${topics[2]}: Practice case-style questions; identify root causes; explain tradeoffs out loud.`,
    `Day 4 → ${topics[3]}: Review risk and escalation decisions; map stakeholders; practice prioritization under constraints.`,
    `Day 5 → ${topics[4]}: Study metrics and evidence-based decision making; solve timed scenarios; review errors.`,
    `Day 6 → ${topics[5]}: Practice leadership-style responses; improve communication clarity; refine answer structure.`,
    `Day 7 → Mock Assessment & Revision: Retake the quiz; compare weak topics; revise notes before increasing difficulty.`,
  ];
}

function buildRecommendedResources(domain, weakTopics = []) {
  const resourceMap = {
    "Data Analytics and Data Science": [
      "SQL case practice covering joins, aggregations, query debugging, and KPI extraction.",
      "Statistics refreshers for hypothesis testing, confidence intervals, sampling bias, and experimental design.",
      "Dashboard critique exercises using BI tools, visualization principles, and stakeholder storytelling.",
      "Python or R practice for data cleaning, model evaluation, and reproducible analysis workflows.",
      "Machine learning evaluation guides focused on precision, recall, validation leakage, and business impact.",
    ],
    "Medical and Healthcare": [
      "Clinical reasoning cases covering triage, diagnosis prioritization, and patient-safety escalation.",
      "Healthcare ethics and compliance resources, including HIPAA-style privacy and informed-consent scenarios.",
      "Emergency response practice cases focused on prioritization, handoffs, and team communication.",
      "Hospital workflow and care-coordination examples for discharge planning, documentation, and continuity.",
      "Quality improvement resources covering incident reporting, root cause analysis, and patient outcomes.",
    ],
    Finance: [
      "Financial statement analysis practice covering income statements, balance sheets, and cash-flow interpretation.",
      "Forecasting and budgeting case studies with variance analysis, assumptions, and scenario planning.",
      "Risk management resources covering credit, market, operational, and compliance risk controls.",
      "Valuation and investment decision cases focused on tradeoffs, assumptions, and stakeholder communication.",
      "Accounting and audit-readiness refreshers for controls, reconciliation, and documentation quality.",
    ],
    Marketing: [
      "Campaign strategy case studies covering segmentation, positioning, channel mix, and creative testing.",
      "SEO and content optimization resources focused on search intent, technical basics, and conversion paths.",
      "Marketing analytics practice covering CAC, ROAS, funnel conversion, retention, and attribution.",
      "Brand and social media examples for audience growth, messaging consistency, and reputation management.",
      "A/B testing and growth experimentation guides for hypothesis design and result interpretation.",
    ],
    "Human Resources": [
      "Structured interviewing and hiring-scorecard examples for fair, consistent candidate evaluation.",
      "Employee relations scenarios covering conflict resolution, documentation, and policy-aligned escalation.",
      "Onboarding and retention case studies focused on engagement, role clarity, and manager communication.",
      "HR compliance refreshers covering workplace policy, performance management, and sensitive conversations.",
      "People analytics examples for turnover, hiring funnel quality, and workforce-planning decisions.",
    ],
    "Retail and E-commerce": [
      "Retail operations cases covering inventory accuracy, fulfillment, merchandising, and customer experience.",
      "E-commerce funnel exercises focused on conversion, cart abandonment, retention, and pricing decisions.",
      "Customer escalation scenarios for service recovery, refunds, delivery issues, and brand trust.",
      "Omnichannel strategy examples covering store, marketplace, mobile, and direct-to-consumer coordination.",
      "Merchandising analytics resources for demand signals, sell-through, margins, and stockout prevention.",
    ],
    "Media and Entertainment": [
      "Audience growth case studies covering distribution channels, content calendars, and engagement metrics.",
      "Brand safety and editorial judgment scenarios for publishing, social media, and campaign decisions.",
      "Streaming, gaming, or creator analytics examples focused on retention, monetization, and platform risk.",
      "Advertising and campaign attribution resources for creative testing and performance measurement.",
      "Event and production planning cases covering timelines, stakeholder coordination, and crisis handling.",
    ],
    Education: [
      "Instructional design resources covering learning objectives, assessment design, and feedback loops.",
      "Classroom or learner-support cases focused on engagement, accessibility, and intervention planning.",
      "Curriculum planning examples for sequencing, outcomes, evidence of learning, and program evaluation.",
      "Education technology adoption cases covering implementation risk, teacher training, and learner impact.",
      "Assessment and learning analytics practice for interpreting progress data and improving outcomes.",
    ],
    "Energy and Utilities": [
      "Grid reliability and utility operations cases covering outages, demand forecasting, and service continuity.",
      "Renewable integration resources focused on storage, intermittency, regulatory constraints, and safety.",
      "Environmental compliance examples for permitting, waste, water, emissions, and incident response.",
      "Asset maintenance and capital-planning cases for risk, lifecycle cost, and operational reliability.",
      "Energy management scenarios covering customer impact, efficiency, and resource allocation.",
    ],
    "Professional Services": [
      "Consulting case practice for problem structuring, issue trees, hypothesis testing, and recommendation writing.",
      "Client communication examples covering executive updates, scope changes, and stakeholder conflict.",
      "Digital transformation cases focused on process redesign, adoption risk, and measurable business outcomes.",
      "Professional ethics and compliance resources for advisory, legal, accounting, or client-service decisions.",
      "Implementation planning exercises covering milestones, risks, dependencies, and change management.",
    ],
    Telecommunications: [
      "Network reliability cases covering outages, capacity planning, fiber rollout, and customer impact.",
      "5G and wireless infrastructure resources focused on deployment tradeoffs and service-level decisions.",
      "Network security scenarios covering incident response, vendor coordination, and operational risk.",
      "Telecom customer escalation examples for downtime, SLA communication, and restoration prioritization.",
      "Data center and cloud communications practice cases covering resilience, redundancy, and monitoring.",
    ],
    "Transportation and Logistics": [
      "Route optimization and fleet-management cases covering cost, service levels, and delivery constraints.",
      "Warehouse throughput scenarios focused on labor, inventory handoffs, picking accuracy, and bottlenecks.",
      "Supply chain disruption practice for carrier risk, supplier delays, customer escalation, and contingency plans.",
      "Aviation, freight, or last-mile examples covering safety, scheduling, and operational tradeoffs.",
      "Logistics KPI resources for on-time delivery, utilization, cost per shipment, and exception handling.",
    ],
    "Agriculture and Food": [
      "Crop planning and precision-agriculture cases covering yield, resource usage, and weather risk.",
      "Food safety and quality resources focused on traceability, compliance, contamination risk, and corrective action.",
      "Agricultural supply chain scenarios covering perishability, logistics, demand swings, and market volatility.",
      "Equipment downtime and farm operations examples for maintenance planning and resource allocation.",
      "Sustainable agriculture resources covering soil health, water usage, input optimization, and certification tradeoffs.",
    ],
    "Construction and Real Estate": [
      "Project scheduling cases covering contractor coordination, critical path, delays, and stakeholder updates.",
      "Site safety resources focused on hazard controls, incident escalation, and compliance documentation.",
      "Cost overrun and materials-shortage scenarios for procurement, scope control, and client communication.",
      "Quality inspection examples covering punch lists, code compliance, handoffs, and corrective actions.",
      "Property and facilities-management cases focused on lifecycle planning, tenant impact, and maintenance prioritization.",
    ],
    "Hospitality and Tourism": [
      "Guest experience and service-recovery cases covering complaints, reputation, and operational follow-through.",
      "Revenue management examples focused on occupancy, pricing, seasonality, and channel mix.",
      "Restaurant or hotel operations scenarios for staffing, food safety, booking issues, and service quality.",
      "Event crisis-management cases covering vendor problems, guest safety, timelines, and communication.",
      "Travel and tourism resources for customer expectations, cultural awareness, and itinerary disruption handling.",
    ],
    "Non-Profit and Social Services": [
      "Program-impact measurement resources covering outcomes, community needs, and grant reporting.",
      "Fundraising and grant-management cases focused on compliance, donor trust, and funding prioritization.",
      "Volunteer coordination scenarios covering risk, training, scheduling, and mission alignment.",
      "Advocacy and community-development examples for stakeholder trust, ethical escalation, and communication.",
      "Social services case-management resources focused on prioritization, documentation, and referral quality.",
    ],
  };

  if (resourceMap[domain.label]) {
    return resourceMap[domain.label];
  }

  if (domain.label === "Manufacturing and Industrial") {
    return [
      "APICS CPIM materials for production planning, inventory, and supply chain decisions.",
      "Lean manufacturing case studies covering Kaizen, takt time, SMED, and waste reduction.",
      "OSHA safety standards and lockout-tagout guidance for industrial safety scenarios.",
      "Six Sigma and RCA resources, especially 5 Whys, Ishikawa diagrams, Pareto analysis, and SPC.",
      "OEE and downtime-analysis practice cases for process optimization and maintenance decisions.",
    ];
  }

  if (domain.label === "Software and Technology") {
    return [
      "System design primers for scalability, API tradeoffs, caching, and reliability decisions.",
      "Debugging and incident-review case studies focused on root cause analysis.",
      "OWASP guidance for security fundamentals and risk-based engineering decisions.",
      "Database indexing, query optimization, and data-modeling practice problems.",
      "Behavioral engineering interview examples for stakeholder communication and prioritization.",
    ];
  }

  const focus = weakTopics.length ? weakTopics.join(", ") : domain.fallbackTopic;
  return [
    `${domain.label} interview case studies focused on ${focus}.`,
    "Official industry guides and standards relevant to the weak topics above.",
    "Scenario-based practice questions with written explanations after each attempt.",
    "Role-specific articles from reputable professional associations and training providers.",
    "Timed mock interviews to improve structured thinking and answer clarity.",
  ];
}

function fallbackQuestionFromBlueprint(blueprint, domain, difficulty) {
  const question = blueprint[difficulty.label.toLowerCase()];
  return {
    question,
    options: shuffle([blueprint.correct, ...blueprint.distractors]),
    correctAnswer: blueprint.correct,
    explanation: blueprint.explanation,
    topic: blueprint.topic,
    difficulty: difficulty.label,
    domain: domain.label,
  };
}

const DOMAIN_QUESTION_BLUEPRINTS = {
  "Software and Technology": [
    {
      topic: "JavaScript fundamentals",
      beginner: "In JavaScript, what is the main difference between let and const?",
      intermediate: "A React component accidentally reassigns a value that should never change during render. Which declaration is safest?",
      advanced: "A Node.js service has subtle bugs because shared configuration values are reassigned during async startup. What coding practice prevents this class of issue?",
      correct: "Use const for bindings that should not be reassigned and let only when reassignment is required.",
      distractors: [
        "Use var for all variables because it works across every JavaScript version.",
        "Use let for every value because const makes objects immutable.",
        "Avoid declarations and attach values to the global object.",
      ],
      explanation: "const prevents rebinding, which reduces accidental state changes; objects can still mutate, so the interviewer expects precision here.",
    },
    {
      topic: "Time complexity",
      beginner: "What is the time complexity of checking every pair in an array with two nested loops?",
      intermediate: "A duplicate-detection function compares every item with every other item and slows down at 50,000 records. What is the likely complexity issue?",
      advanced: "A fraud-check API times out because it performs pairwise comparisons for each request. Which optimization direction is strongest?",
      correct: "It is O(n^2); use hashing, indexing, or sorting to avoid unnecessary pairwise comparisons.",
      distractors: [
        "It is O(log n) because the array gets smaller after each comparison.",
        "It is O(1) because each comparison is constant time.",
        "Add more servers before changing the algorithm.",
      ],
      explanation: "Nested pairwise scans grow quadratically; strong SDE answers identify the algorithmic bottleneck before scaling infrastructure.",
    },
    {
      topic: "REST APIs",
      beginner: "Which HTTP method is normally used to fetch a resource without changing it?",
      intermediate: "A client retries a failed API call and accidentally creates duplicate orders. Which API design principle helps prevent this?",
      advanced: "A payment API receives duplicate retry requests during network failures. What design best protects correctness?",
      correct: "Use GET for safe reads and design mutating operations with idempotency keys when retries are possible.",
      distractors: [
        "Use POST for every endpoint so clients do not need to choose methods.",
        "Disable retries completely even for transient network failures.",
        "Store duplicate orders and clean them manually later.",
      ],
      explanation: "REST basics cover safe methods, while production APIs need idempotency to keep retries from corrupting data.",
    },
    {
      topic: "SQL joins",
      beginner: "Which SQL JOIN returns only rows that match in both tables?",
      intermediate: "A report must show users and their orders only when an order exists. Which JOIN is appropriate?",
      advanced: "A dashboard query becomes slow after joining users, orders, and events. What should you inspect first?",
      correct: "Use INNER JOIN for matching rows, then inspect indexes, join keys, filters, and query plans for performance.",
      distractors: [
        "Use CROSS JOIN because it always includes all combinations.",
        "Remove all WHERE clauses so the optimizer has more freedom.",
        "Denormalize every table before reading the query plan.",
      ],
      explanation: "The fundamental concept is INNER JOIN; advanced SQL interviews expect query-plan and indexing reasoning.",
    },
    {
      topic: "React rendering",
      beginner: "In React, what is the difference between props and state?",
      intermediate: "A React list rerenders excessively after every keystroke. What should you check first?",
      advanced: "A React dashboard freezes when filtering thousands of rows. Which optimization strategy is most appropriate?",
      correct: "Props are passed from parents, state is local/changeable, and rendering issues should be profiled before memoization, virtualization, or state restructuring.",
      distractors: [
        "Move every variable into global state so React renders less often.",
        "Add setTimeout around every state update to delay rendering.",
        "Rewrite the app without measuring which components are slow.",
      ],
      explanation: "Good frontend answers combine React fundamentals with profiling and targeted optimizations like memoization or virtualization.",
    },
    {
      topic: "Debugging",
      beginner: "What is the first useful step when a function returns an unexpected value?",
      intermediate: "A backend endpoint fails only for some payloads. What debugging approach is strongest?",
      advanced: "A production service has intermittent 500 errors with no obvious pattern. How should you investigate?",
      correct: "Reproduce the issue, inspect inputs/logs, isolate the failing path, and verify the fix with targeted tests.",
      distractors: [
        "Change multiple modules at once until the symptom disappears.",
        "Restart production servers repeatedly without collecting evidence.",
        "Assume the most recent developer caused the issue.",
      ],
      explanation: "Real debugging is evidence-driven: reproduce, observe, isolate, fix, and verify.",
    },
    {
      topic: "Authentication security",
      beginner: "Why should passwords be hashed instead of stored as plain text?",
      intermediate: "A login system stores JWTs in localStorage and is vulnerable to XSS. What should be considered?",
      advanced: "An authentication flow leaks tokens through client-side scripts. Which mitigation plan is strongest?",
      correct: "Protect credentials with hashing, secure token storage, short lifetimes, refresh rotation, and XSS defenses.",
      distractors: [
        "Encrypt passwords and store the decryption key beside the database.",
        "Use longer JWTs so attackers cannot read them.",
        "Disable authentication for trusted internal users.",
      ],
      explanation: "Security interviewers look for layered controls: hashing, token handling, expiry, rotation, and XSS mitigation.",
    },
    {
      topic: "Concurrency",
      beginner: "What problem can occur when two processes update the same record at the same time?",
      intermediate: "Two users book the last available seat simultaneously. What protects the data?",
      advanced: "A distributed inventory service occasionally oversells during traffic spikes. Which design is strongest?",
      correct: "Use transactions, locking or optimistic concurrency, and idempotent operations around the critical update.",
      distractors: [
        "Trust the frontend to hide the button after one user clicks it.",
        "Run a nightly script to fix oversold inventory.",
        "Cache the inventory count longer to reduce database load.",
      ],
      explanation: "Concurrency bugs require correctness controls at the data/write boundary, not only UI checks.",
    },
    {
      topic: "Caching",
      beginner: "Why is caching used in web applications?",
      intermediate: "Users see stale profile data after an update. What caching issue is likely?",
      advanced: "A distributed cache sometimes returns stale permissions after role changes. What strategy is safest?",
      correct: "Use caching to reduce latency, but define invalidation, TTLs, and consistency rules for sensitive data.",
      distractors: [
        "Cache every response forever to maximize speed.",
        "Disable all database reads and rely only on cache values.",
        "Store user permissions in the browser without expiration.",
      ],
      explanation: "Caching improves performance, but production systems must handle invalidation and consistency, especially for sensitive data.",
    },
    {
      topic: "System design",
      beginner: "What is the purpose of a load balancer?",
      intermediate: "A notification service must send email and SMS without blocking user signup. What design helps?",
      advanced: "Design a notification service for millions of users with retries, rate limits, and provider failures. What architecture is strongest?",
      correct: "Use load balancing and asynchronous queues with workers, retries, dead-letter handling, rate limiting, and observability.",
      distractors: [
        "Send every notification synchronously in the signup request.",
        "Use one server and manually rerun failed notifications.",
        "Ignore provider limits because queues will make requests faster.",
      ],
      explanation: "Strong system design answers separate user-facing latency from background work and include failure handling.",
    },
  ],
  Cybersecurity: [
    {
      topic: "OWASP vulnerabilities",
      beginner: "Which vulnerability occurs when untrusted input is executed as part of a SQL query?",
      intermediate: "A login form concatenates user input directly into a database query. What is the correct fix?",
      advanced: "A pentest finds exploitable SQL injection in a legacy endpoint used by partners. What remediation plan is strongest?",
      correct: "Use parameterized queries, validate input, patch affected endpoints, and verify with tests and retesting.",
      distractors: [
        "Block long passwords because attackers often use long strings.",
        "Hide database errors while keeping the query construction unchanged.",
        "Move the endpoint to a new URL without changing the code.",
      ],
      explanation: "SQL injection is prevented by parameterized queries and verified remediation, not cosmetic error handling.",
    },
    {
      topic: "Authentication",
      beginner: "What does multi-factor authentication add to a password-based login?",
      intermediate: "Several accounts are compromised after password reuse. What control reduces account takeover risk?",
      advanced: "An attacker bypasses weak MFA through push fatigue. Which response improves authentication resilience?",
      correct: "Use phishing-resistant MFA, risk-based checks, rate limits, monitoring, and user education.",
      distractors: [
        "Require shorter passwords so users remember them.",
        "Send MFA codes through public chat channels.",
        "Disable account lockouts to reduce support tickets.",
      ],
      explanation: "Modern authentication requires layered controls beyond passwords, especially against phishing and repeated prompts.",
    },
    {
      topic: "Incident response",
      beginner: "What is the first priority when a security incident is confirmed?",
      intermediate: "A SIEM alert shows unusual outbound traffic from one server. What should the analyst do first?",
      advanced: "A suspected breach affects production and forensic evidence may be lost. Which incident response sequence is strongest?",
      correct: "Contain the threat, preserve evidence, scope impact, eradicate the cause, recover safely, and document lessons.",
      distractors: [
        "Immediately wipe every server before collecting evidence.",
        "Ignore containment until the final report is written.",
        "Post publicly before verifying the incident scope.",
      ],
      explanation: "Incident response balances containment with evidence preservation and controlled recovery.",
    },
    {
      topic: "SIEM analysis",
      beginner: "What is the purpose of a SIEM tool?",
      intermediate: "A SIEM triggers many failed-login alerts from one region. What should you correlate next?",
      advanced: "Multiple low-severity SIEM alerts together suggest lateral movement. What analysis is strongest?",
      correct: "Correlate logs across identity, endpoint, network, and timeline to confirm behavior and scope.",
      distractors: [
        "Close low-severity alerts because they cannot indicate compromise.",
        "Investigate only the first log source and ignore identity events.",
        "Turn off noisy rules without reviewing their signal.",
      ],
      explanation: "SIEM value comes from correlation across sources, not treating each alert in isolation.",
    },
    {
      topic: "Encryption",
      beginner: "What is the difference between hashing and encryption?",
      intermediate: "A system stores API keys in plain text configuration files. What is the safer approach?",
      advanced: "A cloud service must protect secrets across CI/CD, runtime, and audit requirements. What design is strongest?",
      correct: "Use one-way hashing for verification, encryption for reversible protection, and managed secret storage with rotation.",
      distractors: [
        "Base64-encode secrets because it hides the original text.",
        "Commit secrets to a private repository because access is limited.",
        "Use the same static key forever to avoid rotation complexity.",
      ],
      explanation: "Security candidates should distinguish hashing from encryption and use managed secrets with rotation.",
    },
    {
      topic: "Malware triage",
      beginner: "What is malware?",
      intermediate: "An endpoint flags a suspicious executable downloaded by a user. What should happen next?",
      advanced: "A possible malware infection appears on a privileged workstation. Which triage action is strongest?",
      correct: "Isolate the host, collect indicators, preserve evidence, assess spread, and remove the threat safely.",
      distractors: [
        "Ask the user to delete the file and continue working.",
        "Run the file again to see what it does in production.",
        "Ignore it if antivirus already showed an alert.",
      ],
      explanation: "Malware triage requires containment, evidence, indicator collection, and scope assessment.",
    },
    {
      topic: "Cloud security",
      beginner: "Why should cloud storage buckets not be public by default?",
      intermediate: "A cloud bucket containing logs is accidentally exposed publicly. What should be fixed first?",
      advanced: "A cloud audit finds over-permissive IAM roles and public storage across environments. What remediation is strongest?",
      correct: "Remove public exposure, apply least privilege, rotate exposed secrets, review access logs, and add guardrails.",
      distractors: [
        "Rename the bucket so it is harder to guess.",
        "Keep broad IAM roles because they reduce deployment friction.",
        "Delete all logs before checking whether data was accessed.",
      ],
      explanation: "Cloud security focuses on least privilege, exposure reduction, evidence review, and preventive controls.",
    },
    {
      topic: "Network security",
      beginner: "What does a firewall help control?",
      intermediate: "A service exposes an admin port to the internet. What should be changed?",
      advanced: "An internal service needs restricted access across environments. Which network design is strongest?",
      correct: "Restrict traffic by source, port, and identity using segmentation, private access, and monitored rules.",
      distractors: [
        "Expose the port but choose an unusual number.",
        "Allow all traffic and rely on users not knowing the URL.",
        "Disable logs so attackers cannot see network details.",
      ],
      explanation: "Network controls should reduce reachable attack surface and provide monitored, intentional access.",
    },
    {
      topic: "Threat modeling",
      beginner: "What is the purpose of threat modeling?",
      intermediate: "A new payment feature is being designed. When should security review happen?",
      advanced: "A product team ships sensitive data flows across third parties. What threat-modeling approach is strongest?",
      correct: "Identify assets, entry points, threats, mitigations, and residual risk before release.",
      distractors: [
        "Wait for production incidents before reviewing threats.",
        "Review only UI colors because users interact with the frontend.",
        "Assume third-party services handle every security concern.",
      ],
      explanation: "Threat modeling is proactive design review that maps assets, attackers, risks, and mitigations.",
    },
    {
      topic: "Access control",
      beginner: "What does least privilege mean?",
      intermediate: "A user can access admin-only reports after changing a URL. What is the likely flaw?",
      advanced: "A multi-tenant SaaS app leaks records across customers. Which fix is most important?",
      correct: "Enforce authorization on the server for every request using least privilege and tenant-aware checks.",
      distractors: [
        "Hide admin links in the frontend menu.",
        "Ask users not to change URLs manually.",
        "Cache authorization results forever to improve speed.",
      ],
      explanation: "Access control must be enforced server-side; UI hiding is not authorization.",
    },
  ],
  "Data Analytics and Data Science": [
    {
      topic: "SQL aggregation",
      beginner: "Which SQL clause groups rows before applying COUNT or SUM?",
      intermediate: "A sales dashboard needs revenue by region and month. Which SQL pattern is appropriate?",
      advanced: "A KPI query double-counts revenue after joining orders and order_items. What should you inspect?",
      correct: "Use GROUP BY carefully and validate join grain before aggregating metrics.",
      distractors: [
        "Use ORDER BY because it groups similar rows together.",
        "Remove primary keys so duplicates disappear.",
        "Average every numeric column without checking grain.",
      ],
      explanation: "Analytics interviews expect understanding of aggregation grain, joins, and metric correctness.",
    },
    {
      topic: "Data cleaning",
      beginner: "What should you do when a dataset contains missing values?",
      intermediate: "A customer dataset has inconsistent date formats and duplicate emails. What is the best first step?",
      advanced: "A churn model performs well offline but fails in production due to inconsistent upstream data. What should be implemented?",
      correct: "Profile data quality, standardize fields, handle missing values intentionally, and monitor pipelines.",
      distractors: [
        "Delete every row with any missing value without checking impact.",
        "Manually edit the final dashboard each week.",
        "Ignore duplicates if the total row count looks reasonable.",
      ],
      explanation: "Reliable analysis depends on systematic cleaning, validation, and monitoring rather than ad hoc fixes.",
    },
    {
      topic: "Statistics",
      beginner: "What does a p-value help evaluate in hypothesis testing?",
      intermediate: "An A/B test shows a small conversion lift. What should you check before recommending rollout?",
      advanced: "An experiment has novelty effects, uneven samples, and multiple metrics. What analysis is strongest?",
      correct: "Check statistical significance, sample size, confidence intervals, guardrail metrics, and experiment validity.",
      distractors: [
        "Roll out immediately if the test variant has any positive lift.",
        "Ignore sample size because percentages are enough.",
        "Choose only the metric that makes the variant look best.",
      ],
      explanation: "Good analysts assess validity, uncertainty, and business risk before acting on experiment results.",
    },
    {
      topic: "Dashboards",
      beginner: "What makes a dashboard useful for business users?",
      intermediate: "A manager says a dashboard has too many charts and no clear action. What should you improve?",
      advanced: "Executives disagree because two dashboards report different active-user counts. What should you do?",
      correct: "Clarify metric definitions, reduce noise, align the dashboard to decisions, and document data sources.",
      distractors: [
        "Add more charts so every possible view is visible.",
        "Use only bright colors to make the dashboard feel active.",
        "Hide metric definitions so non-technical users are not distracted.",
      ],
      explanation: "Dashboard quality is about decision clarity, trusted definitions, and useful hierarchy.",
    },
    {
      topic: "Python analysis",
      beginner: "Which Python library is commonly used for tabular data analysis?",
      intermediate: "A pandas workflow is slow when applying row-by-row loops to large data. What should you try?",
      advanced: "A production analytics job runs out of memory on a large dataset. Which approach is strongest?",
      correct: "Use pandas for tabular work, prefer vectorized operations, chunking, efficient types, or distributed processing when needed.",
      distractors: [
        "Copy the dataset into Excel and run formulas manually.",
        "Add more print statements inside every row loop.",
        "Convert every column to strings to simplify processing.",
      ],
      explanation: "Python analytics interviews test tool fluency and performance-aware data processing.",
    },
    {
      topic: "Machine learning evaluation",
      beginner: "Why do data scientists split data into training and test sets?",
      intermediate: "A classifier has high accuracy but misses most fraud cases. Which metric matters more?",
      advanced: "A model performs well in validation but poorly after launch. What should you investigate?",
      correct: "Evaluate generalization with train/test splits and use metrics like recall, precision, drift, and leakage checks.",
      distractors: [
        "Use accuracy only because it is always the clearest metric.",
        "Train and test on the same data to maximize confidence.",
        "Ignore drift because models learn everything during training.",
      ],
      explanation: "Model evaluation must match the business problem and detect leakage, class imbalance, and production drift.",
    },
    {
      topic: "Business insights",
      beginner: "What should an analyst include when presenting a finding?",
      intermediate: "Sales dropped last week, but traffic stayed constant. What should you analyze next?",
      advanced: "A KPI improved while revenue fell, and leaders want a recommendation. What is the best response?",
      correct: "Connect the finding to business context, segment drivers, quantify impact, and recommend a decision.",
      distractors: [
        "Present raw tables without interpretation.",
        "Choose the first explanation that matches the trend.",
        "Avoid recommendations because analysts only report numbers.",
      ],
      explanation: "Strong analytics answers turn data into decision-ready insight, not just descriptive reporting.",
    },
    {
      topic: "Excel and BI",
      beginner: "Which Excel feature helps summarize large tables by categories?",
      intermediate: "A Power BI report refresh fails because a source column changed. What should you do?",
      advanced: "A BI semantic model has inconsistent measures across reports. What governance step is strongest?",
      correct: "Use pivots or BI models with governed measures, refresh checks, and documented source dependencies.",
      distractors: [
        "Duplicate every report so each team can define metrics differently.",
        "Manually paste refreshed values into dashboards.",
        "Ignore schema changes unless users complain.",
      ],
      explanation: "BI work requires both tool skill and governed metric definitions that survive source changes.",
    },
    {
      topic: "KPI design",
      beginner: "What is a KPI?",
      intermediate: "A team tracks page views, but the goal is paid subscriptions. What should change?",
      advanced: "A product team optimizes one KPI and harms retention. How should KPI design improve?",
      correct: "Choose KPIs tied to business outcomes and pair them with guardrail metrics.",
      distractors: [
        "Track the easiest metric to increase even if it does not affect outcomes.",
        "Use only one KPI for every team and product area.",
        "Avoid guardrails because they complicate dashboards.",
      ],
      explanation: "Good KPI design prevents local optimization from harming broader business outcomes.",
    },
    {
      topic: "Data storytelling",
      beginner: "Why is context important when sharing a chart?",
      intermediate: "A stakeholder misunderstands a trend line in your report. What should you improve?",
      advanced: "A board presentation needs a concise recommendation from complex analysis. What structure works best?",
      correct: "Lead with the decision, explain the evidence, show uncertainty, and make the recommendation clear.",
      distractors: [
        "Start with every query and transformation step.",
        "Avoid uncertainty so the story sounds stronger.",
        "Use the most complex visualization available.",
      ],
      explanation: "Data storytelling is not decoration; it organizes evidence around the decision the audience must make.",
    },
  ],
  "Medical and Healthcare": [
    {
      topic: "Patient prioritization",
      beginner: "Which patient should be assessed first in a busy clinic?",
      intermediate: "A patient reports chest pain while routine appointments are waiting. What should happen?",
      advanced: "Multiple patients arrive with limited staff, including one with chest pain and shortness of breath. What triage decision is strongest?",
      correct: "Prioritize the patient with potentially life-threatening symptoms and escalate according to clinical protocol.",
      distractors: [
        "See patients only in arrival order regardless of symptoms.",
        "Ask the patient to wait because routine appointments were scheduled first.",
        "Give reassurance without assessing vital signs.",
      ],
      explanation: "Healthcare interviews expect safety-first triage based on acuity, symptoms, and protocol.",
    },
    {
      topic: "Clinical ethics",
      beginner: "What does patient confidentiality mean?",
      intermediate: "A family member asks for patient details without consent. What should you do?",
      advanced: "A patient refuses a recommended treatment while family pressures the team to proceed. What is the best response?",
      correct: "Respect privacy and autonomy, confirm capacity, explain risks, document, and follow legal/clinical policy.",
      distractors: [
        "Share details if the family member sounds concerned.",
        "Proceed with treatment because clinicians know best.",
        "Avoid documenting the disagreement to reduce conflict.",
      ],
      explanation: "Ethical care balances autonomy, consent, privacy, capacity, and documentation.",
    },
    {
      topic: "Diagnosis reasoning",
      beginner: "Why is taking a patient history important before diagnosis?",
      intermediate: "A patient has fever, cough, and low oxygen saturation. What should guide next steps?",
      advanced: "Two diagnoses fit the symptoms, but one has higher immediate risk. How should the clinician reason?",
      correct: "Use history, exam, vitals, red flags, and differential diagnosis to prioritize safe next actions.",
      distractors: [
        "Choose the most common diagnosis without checking red flags.",
        "Wait for every possible test before stabilizing the patient.",
        "Ignore patient history if symptoms seem familiar.",
      ],
      explanation: "Clinical reasoning is structured around differentials, severity, and safe prioritization.",
    },
    {
      topic: "Emergency response",
      beginner: "What should staff do when a patient suddenly collapses?",
      intermediate: "A patient becomes unresponsive during observation. What is the immediate response?",
      advanced: "A ward emergency occurs during shift change with incomplete handoff. What action is strongest?",
      correct: "Call for help, assess airway/breathing/circulation, start emergency protocol, and communicate clearly.",
      distractors: [
        "Finish documentation before responding.",
        "Move the patient without assessing safety or protocol.",
        "Wait for the next shift to take responsibility.",
      ],
      explanation: "Emergency response requires immediate assessment, escalation, protocol use, and team communication.",
    },
    {
      topic: "Medication safety",
      beginner: "Why should medication allergies be checked before giving medicine?",
      intermediate: "A medication dose looks higher than usual. What should you do?",
      advanced: "A near-miss medication error is caught before administration. What is the best system response?",
      correct: "Verify patient, drug, dose, route, timing, allergies, and report near misses for process improvement.",
      distractors: [
        "Administer it if the chart is busy and the patient is waiting.",
        "Ignore the near miss because no harm occurred.",
        "Ask the patient to decide whether the dose seems right.",
      ],
      explanation: "Medication safety depends on verification and learning from near misses, not blame or shortcuts.",
    },
    {
      topic: "Infection control",
      beginner: "What is the purpose of hand hygiene in healthcare?",
      intermediate: "A patient with suspected contagious infection arrives. What precautions matter?",
      advanced: "An infection cluster appears on a ward despite routine cleaning. What investigation is strongest?",
      correct: "Apply appropriate precautions, isolate when required, audit practices, trace exposures, and correct gaps.",
      distractors: [
        "Use precautions only after lab confirmation.",
        "Focus only on cleaning visible surfaces.",
        "Avoid reporting the cluster to prevent concern.",
      ],
      explanation: "Infection control requires early precautions, surveillance, exposure tracing, and process correction.",
    },
    {
      topic: "Care coordination",
      beginner: "Why are handoffs important between healthcare staff?",
      intermediate: "A discharge plan is unclear and the patient has follow-up needs. What should be done?",
      advanced: "A complex patient needs coordination across specialists, pharmacy, and home care. What plan is strongest?",
      correct: "Use structured handoff, confirm responsibilities, document follow-up, and verify patient understanding.",
      distractors: [
        "Assume the next team will find everything in the chart.",
        "Give the patient verbal instructions only.",
        "Delay discharge indefinitely even when coordination can solve the gap.",
      ],
      explanation: "Care coordination prevents missed follow-up, medication errors, and fragmented patient experience.",
    },
    {
      topic: "Healthcare compliance",
      beginner: "Why is accurate clinical documentation important?",
      intermediate: "A colleague asks you to backdate a clinical note. What is the correct response?",
      advanced: "An audit identifies inconsistent documentation across patient records. What improvement is strongest?",
      correct: "Document accurately, refuse falsification, follow compliance policy, and improve training/audit controls.",
      distractors: [
        "Backdate the note if the care was actually given.",
        "Use vague notes so errors are harder to identify.",
        "Ignore audit findings unless a regulator asks.",
      ],
      explanation: "Compliance relies on accurate records, ethical behavior, and corrective systems.",
    },
    {
      topic: "Patient communication",
      beginner: "How should medical information be explained to a patient?",
      intermediate: "A patient is confused about discharge instructions. What should you do?",
      advanced: "A patient with low health literacy must choose between treatment options. What communication approach is strongest?",
      correct: "Use clear language, confirm understanding with teach-back, and involve support according to consent.",
      distractors: [
        "Use technical terminology so the explanation sounds complete.",
        "Give written instructions only and leave immediately.",
        "Let family decide without checking patient consent.",
      ],
      explanation: "Patient-centered communication checks understanding and respects consent.",
    },
    {
      topic: "Quality improvement",
      beginner: "What is the goal of healthcare quality improvement?",
      intermediate: "Patient wait times increase after a scheduling change. What should the team analyze?",
      advanced: "Readmission rates rise despite no single obvious cause. Which quality-improvement method is strongest?",
      correct: "Measure the process, identify root causes, test changes, and monitor patient outcomes.",
      distractors: [
        "Blame the busiest staff members first.",
        "Change every workflow at once without measurement.",
        "Ignore the trend until patients complain formally.",
      ],
      explanation: "Healthcare quality improvement uses evidence, root cause analysis, tests of change, and outcome tracking.",
    },
  ],
  Finance: [
    {
      topic: "Financial statements",
      beginner: "Which financial statement shows assets, liabilities, and equity at a point in time?",
      intermediate: "Revenue is growing but cash is declining. Which statements should you compare?",
      advanced: "A company shows strong profit but weak operating cash flow. What analysis is most important?",
      correct: "Use the balance sheet, income statement, and cash-flow statement together to assess quality of earnings.",
      distractors: [
        "Use only revenue growth because it captures business health.",
        "Ignore cash flow if net income is positive.",
        "Analyze only the stock price movement.",
      ],
      explanation: "Finance interviews expect integrated statement analysis, not single-metric conclusions.",
    },
    {
      topic: "Valuation",
      beginner: "What does valuation try to estimate?",
      intermediate: "A peer company trades at a higher EV/EBITDA multiple. What should you check before applying it?",
      advanced: "A DCF valuation is highly sensitive to terminal growth. What should you do?",
      correct: "Estimate intrinsic or relative value using justified assumptions, comparables, sensitivity analysis, and business context.",
      distractors: [
        "Use the highest peer multiple to make the valuation attractive.",
        "Ignore sensitivity because one valuation output is enough.",
        "Set terminal growth above GDP forever.",
      ],
      explanation: "Strong valuation answers defend assumptions and test sensitivity rather than forcing a target number.",
    },
    {
      topic: "Financial ratios",
      beginner: "What does a current ratio help measure?",
      intermediate: "Debt-to-equity rises sharply after a new loan. What risk should be assessed?",
      advanced: "Margins improve while working capital worsens. Which interpretation is strongest?",
      correct: "Use liquidity, leverage, profitability, and efficiency ratios together to understand financial health.",
      distractors: [
        "Use one ratio in isolation for the entire decision.",
        "Assume more debt is always good because it funds growth.",
        "Ignore working capital if margins improved.",
      ],
      explanation: "Ratio analysis is useful only when interpreted together with business drivers and trends.",
    },
    {
      topic: "Forecasting",
      beginner: "Why do finance teams build forecasts?",
      intermediate: "Actual expenses are 15% above budget for two months. What should you do?",
      advanced: "A forecast misses because demand, pricing, and input costs changed together. What approach is strongest?",
      correct: "Analyze variance drivers, update assumptions, build scenarios, and communicate financial impact.",
      distractors: [
        "Keep the original forecast unchanged to avoid confusion.",
        "Reduce every expense line by the same percentage.",
        "Blame one department without checking drivers.",
      ],
      explanation: "Forecasting requires assumptions, variance analysis, and scenario thinking.",
    },
    {
      topic: "Investment logic",
      beginner: "What does risk-return tradeoff mean?",
      intermediate: "Two investments have similar returns but different volatility. What should you compare?",
      advanced: "A portfolio is concentrated in one sector before a downturn. What risk control matters?",
      correct: "Compare expected return, volatility, correlation, concentration, liquidity, and time horizon.",
      distractors: [
        "Choose the investment with the highest recent return only.",
        "Ignore diversification if the sector performed well last year.",
        "Treat all volatility as irrelevant for long-term investors.",
      ],
      explanation: "Investment decisions require risk-adjusted thinking, not return chasing.",
    },
    {
      topic: "Accounting principles",
      beginner: "What is the matching principle in accounting?",
      intermediate: "A company receives cash before delivering the service. How should revenue be treated?",
      advanced: "Aggressive revenue recognition boosts quarterly results. What concern should finance raise?",
      correct: "Recognize revenue and expenses according to accounting rules, delivery obligations, and audit evidence.",
      distractors: [
        "Recognize all cash receipts immediately as revenue.",
        "Move expenses to later periods whenever profit is low.",
        "Ignore audit evidence if management approves.",
      ],
      explanation: "Accounting interviews test timing, recognition, evidence, and ethical reporting.",
    },
    {
      topic: "Risk management",
      beginner: "What is financial risk management?",
      intermediate: "A client portfolio is exposed to currency swings. What mitigation could be considered?",
      advanced: "A bank product creates credit, market, and compliance exposure. What review is strongest?",
      correct: "Identify exposures, quantify likelihood and impact, use controls or hedges, and monitor residual risk.",
      distractors: [
        "Ignore low-probability risks regardless of impact.",
        "Use hedging without understanding the underlying exposure.",
        "Document risks only after losses occur.",
      ],
      explanation: "Finance risk management is structured identification, measurement, mitigation, and monitoring.",
    },
    {
      topic: "Budgeting",
      beginner: "What is the purpose of a budget?",
      intermediate: "A department asks for extra budget without clear ROI. What should finance request?",
      advanced: "Leadership must cut costs without damaging growth initiatives. What budgeting approach is strongest?",
      correct: "Tie spending to priorities, ROI, constraints, and measurable outcomes.",
      distractors: [
        "Approve the request if the department spent the same amount last year.",
        "Cut every department equally without checking strategic impact.",
        "Avoid measuring ROI because budgeting is administrative.",
      ],
      explanation: "Good budgeting connects resources to business priorities and measurable value.",
    },
    {
      topic: "Compliance",
      beginner: "Why do financial institutions follow compliance rules?",
      intermediate: "A transaction appears unusual compared with customer history. What should happen?",
      advanced: "A new financial product has unclear regulatory exposure. What is the best next step?",
      correct: "Escalate according to policy, document evidence, assess regulatory requirements, and control risk.",
      distractors: [
        "Ignore unusual activity if the customer is profitable.",
        "Launch first and ask compliance to review later.",
        "Avoid documentation to reduce audit questions.",
      ],
      explanation: "Finance compliance protects customers, firms, and markets through escalation, evidence, and controls.",
    },
    {
      topic: "Business communication",
      beginner: "What makes a finance recommendation useful to non-finance leaders?",
      intermediate: "A forecast variance must be explained to sales leadership. What should you include?",
      advanced: "CFO leadership asks whether to delay a major investment. What response is strongest?",
      correct: "Explain the numbers, key drivers, assumptions, risks, and recommended decision in business language.",
      distractors: [
        "Share only spreadsheet tabs and let leaders interpret them.",
        "Use technical jargon to show financial expertise.",
        "Avoid a recommendation because finance should only report data.",
      ],
      explanation: "Finance roles require decision support: numbers must connect to business action.",
    },
  ],
  Marketing: [
    {
      topic: "SEO",
      beginner: "What is the goal of SEO?",
      intermediate: "Organic traffic drops after a site migration. What should you check first?",
      advanced: "A high-traffic page ranks well but converts poorly. What SEO and conversion plan is strongest?",
      correct: "Improve search visibility while checking technical health, intent match, content quality, and conversion path.",
      distractors: [
        "Add unrelated keywords to every page.",
        "Buy fake backlinks to recover rankings quickly.",
        "Ignore conversion because SEO only measures traffic.",
      ],
      explanation: "Marketing interviews expect SEO to connect rankings, intent, technical quality, and business outcomes.",
    },
    {
      topic: "Campaign strategy",
      beginner: "What should a campaign objective define?",
      intermediate: "A campaign has high impressions but low leads. What should you analyze?",
      advanced: "A launch campaign must balance brand awareness, CAC, and conversion quality. What approach is strongest?",
      correct: "Define audience, message, channels, KPIs, budget, and test plan tied to the campaign objective.",
      distractors: [
        "Increase spend without checking audience or funnel quality.",
        "Use the same message for every segment.",
        "Measure only impressions because they are easy to grow.",
      ],
      explanation: "Good campaign strategy aligns objective, targeting, channel, creative, and measurement.",
    },
    {
      topic: "Brand positioning",
      beginner: "What does brand positioning explain?",
      intermediate: "Two competitors use similar messaging. How should a brand respond?",
      advanced: "A premium product is gaining low-price competitors. What positioning decision is strongest?",
      correct: "Clarify the target customer, differentiated value, proof points, and consistent messaging.",
      distractors: [
        "Copy the competitor message because it already works.",
        "Change the brand promise every week to test reactions.",
        "Compete only on discounts without checking brand impact.",
      ],
      explanation: "Positioning is about differentiated value for a specific audience, not generic promotion.",
    },
    {
      topic: "Conversion optimization",
      beginner: "What is conversion rate?",
      intermediate: "A landing page gets traffic but few signups. What should you test?",
      advanced: "A funnel loses qualified users between pricing and checkout. What optimization plan is strongest?",
      correct: "Analyze funnel drop-offs, user intent, friction, copy, trust signals, and run controlled A/B tests.",
      distractors: [
        "Change every element at once and compare total sales later.",
        "Remove pricing so users cannot leave the page.",
        "Optimize only button color without checking user intent.",
      ],
      explanation: "Conversion work should be evidence-driven and tested against funnel behavior.",
    },
    {
      topic: "Marketing analytics",
      beginner: "What does CAC measure?",
      intermediate: "Paid ads generate leads, but few become customers. What metric should you inspect?",
      advanced: "Two channels have different CAC, LTV, and payback periods. How should budget be allocated?",
      correct: "Compare CAC, conversion quality, LTV, payback, attribution, and scalability before shifting budget.",
      distractors: [
        "Move all budget to the channel with cheapest clicks.",
        "Ignore lead quality if form fills are high.",
        "Use last-click attribution as the only truth.",
      ],
      explanation: "Marketing analytics must connect acquisition cost to revenue quality and channel scalability.",
    },
    {
      topic: "Social media",
      beginner: "Why do brands use social media calendars?",
      intermediate: "Engagement drops after frequent promotional posts. What should change?",
      advanced: "A social campaign causes backlash during a sensitive news cycle. What response is strongest?",
      correct: "Use audience insight, content balance, brand voice, monitoring, and timely response guidelines.",
      distractors: [
        "Keep posting scheduled promotions without reviewing context.",
        "Delete all comments and ignore sentiment.",
        "Use viral trends even when they conflict with brand values.",
      ],
      explanation: "Social strategy combines planning, audience relevance, brand safety, and responsive monitoring.",
    },
    {
      topic: "Customer acquisition",
      beginner: "What is a customer acquisition channel?",
      intermediate: "A startup needs qualified trials, not just website visits. What should marketing prioritize?",
      advanced: "Growth slows because acquisition volume rises but retention falls. What diagnosis is strongest?",
      correct: "Prioritize channels that bring qualified users and measure activation, retention, CAC, and LTV.",
      distractors: [
        "Maximize traffic even if users are not the target audience.",
        "Ignore retention because acquisition owns only signups.",
        "Choose channels based only on competitor activity.",
      ],
      explanation: "Acquisition quality matters; strong marketers connect growth to downstream retention and value.",
    },
    {
      topic: "Content marketing",
      beginner: "What makes content useful for a target audience?",
      intermediate: "A blog gets views but no pipeline. What should you improve?",
      advanced: "A B2B content program must support awareness, evaluation, and sales enablement. What plan is strongest?",
      correct: "Map content to audience pain points, funnel stage, search intent, distribution, and conversion paths.",
      distractors: [
        "Publish more generic posts without audience research.",
        "Gate every article before readers see value.",
        "Write only about product features for every stage.",
      ],
      explanation: "Content marketing works when it serves audience intent and business conversion paths.",
    },
    {
      topic: "A/B testing",
      beginner: "What is an A/B test?",
      intermediate: "An email subject-line test has too few recipients. What is the problem?",
      advanced: "An experiment shows lift in clicks but lower purchase quality. What should you conclude?",
      correct: "Use valid sample sizes, clear hypotheses, primary metrics, and guardrails before declaring a winner.",
      distractors: [
        "Stop the test as soon as one variant is ahead.",
        "Judge success only by clicks regardless of revenue quality.",
        "Change the hypothesis after seeing the result.",
      ],
      explanation: "Marketing experimentation needs statistical discipline and business-relevant guardrails.",
    },
    {
      topic: "Market research",
      beginner: "Why is customer research useful before a campaign?",
      intermediate: "Survey responses conflict with actual purchase behavior. What should you do?",
      advanced: "A new market segment looks attractive but has unclear willingness to pay. What research plan is strongest?",
      correct: "Combine qualitative insight, behavioral data, segmentation, and willingness-to-pay validation.",
      distractors: [
        "Trust only opinions from the loudest customers.",
        "Launch the full campaign without segment validation.",
        "Ignore behavioral data if survey answers are positive.",
      ],
      explanation: "Market research is strongest when it blends stated needs with observed behavior and segment economics.",
    },
  ],
  "Mechanical Engineering": [
    {
      topic: "Thermodynamics",
      beginner: "What does the first law of thermodynamics describe?",
      intermediate: "A heat exchanger underperforms despite correct flow rate. What should be checked?",
      advanced: "A thermal system overheats under peak load. What engineering analysis is strongest?",
      correct: "Apply energy balance, check heat transfer assumptions, boundary conditions, losses, and operating constraints.",
      distractors: [
        "Increase motor speed without checking heat rejection.",
        "Assume the CAD model proves thermal performance.",
        "Ignore insulation and ambient conditions.",
      ],
      explanation: "Mechanical interviews expect energy-balance reasoning and validation of real operating conditions.",
    },
    {
      topic: "CAD design",
      beginner: "Why are constraints used in CAD sketches?",
      intermediate: "A CAD assembly fails when one part dimension changes. What is likely wrong?",
      advanced: "A complex assembly needs design changes without breaking downstream drawings. What practice is strongest?",
      correct: "Use proper constraints, design intent, parametric relationships, and revision control.",
      distractors: [
        "Fully define nothing so parts can move freely.",
        "Export screenshots instead of maintaining drawings.",
        "Use random dimensions until the model looks correct.",
      ],
      explanation: "CAD quality depends on constraints and design intent, not just visual geometry.",
    },
    {
      topic: "Tolerances",
      beginner: "Why are tolerances specified on mechanical drawings?",
      intermediate: "Two mating parts fit inconsistently after machining. What should be reviewed?",
      advanced: "An assembly fails at scale due to accumulated dimensional variation. What analysis is strongest?",
      correct: "Review tolerance stack-up, datum scheme, manufacturing capability, and inspection method.",
      distractors: [
        "Tighten every tolerance without checking cost or process capability.",
        "Remove tolerances so machinists can decide.",
        "Inspect only the final assembly and skip part-level checks.",
      ],
      explanation: "Tolerance questions test manufacturability, inspection, cost, and stack-up reasoning.",
    },
    {
      topic: "Materials",
      beginner: "Why does material selection matter in mechanical design?",
      intermediate: "A bracket deforms under load in a warm environment. What properties should be checked?",
      advanced: "A component fails after cyclic loading despite passing static stress checks. What is likely important?",
      correct: "Evaluate strength, stiffness, temperature behavior, fatigue, corrosion, manufacturability, and cost.",
      distractors: [
        "Choose the cheapest material if it passes one static test.",
        "Ignore fatigue because the first load case passed.",
        "Select material only by density.",
      ],
      explanation: "Mechanical design requires material properties matched to load, environment, lifecycle, and manufacturing.",
    },
    {
      topic: "Fluid mechanics",
      beginner: "What does pressure drop indicate in a pipe system?",
      intermediate: "A pump meets speed requirements but flow is lower than expected. What should you inspect?",
      advanced: "A piping system cavitates during high-demand operation. Which response is strongest?",
      correct: "Check flow rate, pressure losses, NPSH, restrictions, pump curve, and operating conditions.",
      distractors: [
        "Assume a larger pump always fixes the issue.",
        "Ignore pipe diameter because only pump speed matters.",
        "Close more valves to increase available flow.",
      ],
      explanation: "Fluid troubleshooting requires system-curve and pump-curve reasoning, not one-component guessing.",
    },
    {
      topic: "Maintenance",
      beginner: "What is preventive maintenance?",
      intermediate: "A machine repeatedly fails after bearing replacement. What should be checked?",
      advanced: "A plant must reduce downtime without replacing every asset. What maintenance strategy is strongest?",
      correct: "Use failure history, condition monitoring, root cause analysis, and preventive or predictive maintenance.",
      distractors: [
        "Replace parts only after catastrophic failure.",
        "Change every part on every machine at the same interval.",
        "Ignore installation alignment and lubrication records.",
      ],
      explanation: "Maintenance interviews expect reliability thinking based on causes, condition, and downtime impact.",
    },
    {
      topic: "Manufacturing processes",
      beginner: "What is the purpose of a manufacturing process plan?",
      intermediate: "A machined part has burrs and inconsistent surface finish. What should be reviewed?",
      advanced: "A design is functional but expensive and slow to manufacture. What DFM approach is strongest?",
      correct: "Review process capability, tooling, fixtures, tolerances, material, cycle time, and design simplification.",
      distractors: [
        "Keep the design unchanged because CAD validation passed.",
        "Tighten tolerances to make manufacturing easier.",
        "Move directly to mass production without pilot runs.",
      ],
      explanation: "DFM connects design choices to process capability, cost, quality, and cycle time.",
    },
    {
      topic: "Quality inspection",
      beginner: "Why are gauges used in mechanical inspection?",
      intermediate: "Inspection results differ between operators. What should be checked?",
      advanced: "A critical dimension passes inspection but assemblies still fail. What should be investigated?",
      correct: "Check measurement system variation, datum use, gauge calibration, sampling, and functional requirements.",
      distractors: [
        "Accept the first passing measurement and stop inspection.",
        "Blame operators without checking gauge repeatability.",
        "Ignore functional testing because dimensions passed.",
      ],
      explanation: "Mechanical quality requires reliable measurement systems and alignment with functional performance.",
    },
    {
      topic: "Root cause analysis",
      beginner: "What is root cause analysis used for?",
      intermediate: "A component cracks intermittently during testing. What should the engineer do?",
      advanced: "A field failure appears only under rare vibration and temperature conditions. Which RCA plan is strongest?",
      correct: "Reproduce conditions, collect evidence, isolate variables, test hypotheses, and verify corrective action.",
      distractors: [
        "Change several dimensions at once and hope failures stop.",
        "Assume the last supplier caused the issue without evidence.",
        "Ship unchanged parts because the failure is rare.",
      ],
      explanation: "RCA in mechanical systems is evidence-based and validates fixes under real conditions.",
    },
    {
      topic: "Safety factors",
      beginner: "Why do engineers use a factor of safety?",
      intermediate: "A lifting bracket has uncertain loading conditions. What should influence the safety factor?",
      advanced: "A lightweight design reduces cost but lowers margin under shock loading. What decision is strongest?",
      correct: "Consider load uncertainty, failure severity, material variability, standards, testing, and lifecycle conditions.",
      distractors: [
        "Use the smallest factor possible to reduce material cost.",
        "Use the same factor for every component regardless of risk.",
        "Ignore standards if simulation results look acceptable.",
      ],
      explanation: "Safety factors reflect uncertainty, consequence, standards, and validation, not arbitrary padding.",
    },
  ],
};

const GENERIC_FALLBACK_PATTERNS = [
  {
    beginner:
      "which action best shows basic understanding of {topic}?",
    intermediate:
      "notices recurring {topic} issues affecting daily work. What is the best next step?",
    advanced:
      "must resolve a {topic} problem while balancing quality, time, risk, and stakeholder impact. What approach is strongest?",
    correct:
      "Clarify the goal, review evidence related to {topic}, choose a practical action, and communicate the reasoning.",
    distractors: [
      "Act immediately on the first opinion about {topic} without checking supporting information.",
      "Delay the decision until every possible detail is perfect, even if the work is blocked.",
      "Ignore the {topic} concern and focus only on finishing the easiest task.",
    ],
    explanation:
      "{topic} decisions need evidence, practical judgment, and clear communication rather than guesswork or avoidance.",
  },
  {
    beginner:
      "what is the safest first step when a basic {topic} task is unclear?",
    intermediate:
      "receives mixed results related to {topic}. What should you investigate first?",
    advanced:
      "sees {topic} signals conflict with stakeholder expectations and business goals. Which decision process is most effective?",
    correct:
      "Define the success metric, compare the available signals, identify the root cause, and recommend a focused next step.",
    distractors: [
      "Report only the most positive {topic} signal and avoid discussing uncertainty.",
      "Change multiple parts of the workflow at once so the result looks more active.",
      "Escalate the issue without any analysis or recommendation.",
    ],
    explanation:
      "{topic} problems are handled best when the answer connects metrics, causes, and a clear recommendation.",
  },
  {
    beginner:
      "which habit improves day-to-day {topic} performance?",
    intermediate:
      "has limited time to improve {topic} before the next review. What is the most useful action?",
    advanced:
      "needs measurable improvement in {topic}, but teams disagree on priorities. What should you recommend?",
    correct:
      "Prioritize the highest-impact gap, define measurable outcomes, test a focused improvement, and review results.",
    distractors: [
      "Ask everyone to work harder on {topic} without changing the process.",
      "Choose the easiest visible fix even if it has little business impact.",
      "Postpone measurement until after the team feels the issue is solved.",
    ],
    explanation:
      "Measurable improvement comes from focusing {topic} work on impact, experiments, and results rather than vague effort.",
  },
  {
    beginner:
      "what should you do first when a colleague asks for help with a {topic} decision?",
    intermediate:
      "has two teams disagreeing about how to handle {topic}. What is the best response?",
    advanced:
      "has cross-functional leaders disagreeing on tradeoffs behind a {topic} decision. How should you lead alignment?",
    correct:
      "Listen to each concern, define shared criteria, compare tradeoffs, and document the agreed decision.",
    distractors: [
      "Let the loudest team decide because that will reduce debate around {topic}.",
      "Avoid the disagreement and continue with the old approach.",
      "Pick one side privately without explaining the decision criteria.",
    ],
    explanation:
      "Collaboration improves when {topic} decisions use shared criteria and transparent tradeoffs instead of informal pressure.",
  },
  {
    beginner:
      "which question helps you understand whether {topic} work is successful?",
    intermediate:
      "shows mixed {topic} results in a dashboard or status report. What should be checked first?",
    advanced:
      "has one metric improving while another important {topic} indicator worsens. What is the strongest interpretation?",
    correct:
      "Check metric definitions, segment the data, look for tradeoffs, and connect the result to stakeholder outcomes.",
    distractors: [
      "Accept the improved metric as full success without checking {topic} side effects.",
      "Discard the data because mixed results are too difficult to explain.",
      "Change the metric definition so the report looks consistent.",
    ],
    explanation:
      "Mixed metrics require careful {topic} interpretation because one improvement can hide tradeoffs or unintended effects.",
  },
  {
    beginner:
      "what is a professional way to communicate a simple {topic} update?",
    intermediate:
      "may miss a deadline because {topic} work is running behind. What should you communicate?",
    advanced:
      "has a critical deadline at risk because {topic} dependencies changed late. Which communication plan is strongest?",
    correct:
      "Share the status, explain the risk and impact, present options, and recommend the next action.",
    distractors: [
      "Wait until the deadline passes before mentioning the {topic} risk.",
      "Send a vague update that avoids the impact and decision needed.",
      "Promise the original timeline without checking dependencies.",
    ],
    explanation:
      "Clear {topic} communication should surface impact early and give stakeholders usable options.",
  },
  {
    beginner:
      "which action supports better consistency in {topic} work?",
    intermediate:
      "has different people handling {topic} differently across the team. What is the best improvement?",
    advanced:
      "has inconsistent {topic} execution creating quality and trust issues across teams. What should be done?",
    correct:
      "Standardize the core process, train the team, monitor adherence, and adjust based on feedback.",
    distractors: [
      "Let every person keep their own {topic} method to preserve flexibility.",
      "Add more approvals without explaining the expected standard.",
      "Correct only the most recent mistake and ignore the broader pattern.",
    ],
    explanation:
      "Quality improves when {topic} work has clear standards, training, and feedback rather than isolated corrections.",
  },
  {
    beginner:
      "how should you handle feedback about your {topic} approach?",
    intermediate:
      "has a reviewer challenging your {topic} recommendation. What is the best response?",
    advanced:
      "has an executive questioning whether your {topic} recommendation is worth the tradeoff. How should you answer?",
    correct:
      "Restate the concern, support the recommendation with evidence, acknowledge tradeoffs, and adjust if new facts justify it.",
    distractors: [
      "Defend the {topic} recommendation without listening to the concern.",
      "Abandon the recommendation immediately to avoid disagreement.",
      "Respond with more technical detail but no business reasoning.",
    ],
    explanation:
      "Strong candidates handle {topic} challenges by combining evidence, humility, and business-aware reasoning.",
  },
  {
    beginner:
      "what basic behavior helps prevent repeated {topic} mistakes?",
    intermediate:
      "sees the same {topic} issue appear twice in the workflow. What should happen next?",
    advanced:
      "has a repeated {topic} failure affecting outcomes across teams, but the cause is disputed. What approach is strongest?",
    correct:
      "Review the pattern, separate symptoms from causes, assign owners, and verify the corrective action after implementation.",
    distractors: [
      "Treat each {topic} failure as isolated so the team can move on faster.",
      "Choose the most convenient explanation and close the issue quickly.",
      "Ask for a permanent fix but avoid assigning follow-up ownership.",
    ],
    explanation:
      "Repeated {topic} failures need pattern analysis, ownership, and verification so the fix lasts beyond one incident.",
  },
  {
    beginner:
      "which response best supports ethical judgment around {topic}?",
    intermediate:
      "faces pressure to skip a normal {topic} review to move faster. What should you do?",
    advanced:
      "faces competing pressure from speed, cost, compliance, and trust in a {topic} decision. Which response is strongest?",
    correct:
      "Protect the non-negotiable standard, explain the risk, offer a realistic alternative, and document the decision.",
    distractors: [
      "Skip the {topic} review once because the pressure is temporary.",
      "Make the fastest decision and fix documentation later.",
      "Keep the concern private so the team avoids conflict.",
    ],
    explanation:
      "Ethical {topic} judgment means protecting standards while still helping the team find a workable path forward.",
  },
];

function fillPattern(template, topic) {
  return template.replaceAll("{topic}", topic);
}

function buildGenericFallbackQuestions(domain, difficulty) {
  const topics =
    difficulty.label === "Advanced"
      ? getAdvancedTopicCategories(domain)
      : getBeginnerIntermediateTopics(domain);
  const difficultyKey = difficulty.label.toLowerCase();

  return GENERIC_FALLBACK_PATTERNS.map((pattern, index) => {
    const topic = topics[index] || domain.fallbackTopic || "professional judgment";
    const correctAnswer = fillPattern(pattern.correct, topic);
    const scenario =
      difficulty.label === "Beginner"
        ? `In a ${domain.label} role, ${fillPattern(pattern[difficultyKey], topic)}`
        : `A ${domain.label} team ${fillPattern(pattern[difficultyKey], topic)}`;

    return {
      question: scenario,
      options: shuffle([
        correctAnswer,
        ...pattern.distractors.map((option) => fillPattern(option, topic)),
      ]),
      correctAnswer,
      explanation: `${domain.label}: ${fillPattern(pattern.explanation, topic)}`,
      topic,
      difficulty: difficulty.label,
      domain: domain.label,
    };
  });
}

function buildFallbackQuestions(domain, difficultyKey) {
  const difficulty = DIFFICULTIES[difficultyKey];
  const domainBlueprints = DOMAIN_QUESTION_BLUEPRINTS[domain.label];

  if (domainBlueprints) {
    return domainBlueprints.map((blueprint) =>
      fallbackQuestionFromBlueprint(blueprint, domain, difficulty)
    );
  }

  if (domain.label !== "Manufacturing and Industrial") {
    return buildGenericFallbackQuestions(domain, difficulty);
  }

  return QUESTION_BLUEPRINTS.map((blueprint) =>
    fallbackQuestionFromBlueprint(blueprint, domain, difficulty)
  );
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/^\s*[a-d0-9]+[\).]\s*/i, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\b(the|a|an|and|or|to|of|in|for|with|you|your|best)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function questionSignature(question = "") {
  return normalizeText(question).split(" ").slice(0, 12).join(" ");
}

function sanitizeQuestions(rawQuestions, domain, difficultyKey) {
  const seen = new Set();
  const seenAdvancedTopics = new Set();
  const seenCorrectAnswers = new Set();
  const seenExplanations = new Set();
  const difficulty = DIFFICULTIES[difficultyKey];
  const valid = [];

  for (const item of Array.isArray(rawQuestions) ? rawQuestions : []) {
    const question = String(item.question || "").trim();
    const options = Array.isArray(item.options)
      ? item.options
          .map((option) => String(option).replace(/^\s*[A-D0-9]+[\).]\s*/i, "").trim())
          .filter(Boolean)
      : [];
    const rawCorrectAnswer = String(item.correctAnswer || "").trim();
    const correctAnswer =
      options.find(
        (option) => normalizeText(option) === normalizeText(rawCorrectAnswer)
      ) || rawCorrectAnswer.replace(/^\s*[A-D0-9]+[\).]\s*/i, "").trim();
    const explanation = String(item.explanation || "").trim();
    const topic = String(item.topic || domain.fallbackTopic).trim();
    const key = questionSignature(question);
    const normalizedCorrect = normalizeText(correctAnswer);
    const normalizedExplanation = normalizeText(explanation).slice(0, 140);

    if (
      question.length < 20 ||
      options.length !== 4 ||
      !correctAnswer ||
      !options.includes(correctAnswer) ||
      !explanation ||
      seen.has(key) ||
      seenCorrectAnswers.has(normalizedCorrect) ||
      seenExplanations.has(normalizedExplanation)
    ) {
      continue;
    }

    seen.add(key);
    seenCorrectAnswers.add(normalizedCorrect);
    seenExplanations.add(normalizedExplanation);
    const normalizedTopic = topic.toLowerCase();
    const normalizedQuestion = {
      question,
      options: shuffle(options),
      correctAnswer,
      explanation,
      topic,
      difficulty: difficulty.label,
      domain: domain.label,
    };

    if (difficultyKey === "advanced" && seenAdvancedTopics.has(normalizedTopic)) {
      continue;
    }

    seenAdvancedTopics.add(normalizedTopic);
    valid.push(normalizedQuestion);
  }

  return valid;
}

function completeQuestionSet(questions, domain, difficultyKey) {
  const fallbackQuestions = buildFallbackQuestions(domain, difficultyKey);
  const existingQuestions = new Set(questions.map((item) => questionSignature(item.question)));
  const existingTopics = new Set(questions.map((item) => normalizeText(item.topic)));
  const existingCorrect = new Set(questions.map((item) => normalizeText(item.correctAnswer)));
  const merged = [...questions];

  for (const fallback of fallbackQuestions) {
    if (merged.length >= 10) break;
    const questionKey = questionSignature(fallback.question);
    const topicKey = normalizeText(fallback.topic);
    const correctKey = normalizeText(fallback.correctAnswer);
    if (
      existingQuestions.has(questionKey) ||
      existingTopics.has(topicKey) ||
      existingCorrect.has(correctKey)
    ) {
      continue;
    }
    existingQuestions.add(questionKey);
    existingTopics.add(topicKey);
    existingCorrect.add(correctKey);
    merged.push(fallback);
  }

  for (const fallback of fallbackQuestions) {
    if (merged.length >= 10) break;
    const questionKey = questionSignature(fallback.question);
    if (existingQuestions.has(questionKey)) continue;
    existingQuestions.add(questionKey);
    merged.push(fallback);
  }

  return merged.slice(0, 10);
}

function topicStats(questionResults) {
  const stats = new Map();
  questionResults.forEach((question) => {
    const topic = question.topic || "Core fundamentals";
    const current = stats.get(topic) || { total: 0, correct: 0 };
    current.total += 1;
    if (question.isCorrect) current.correct += 1;
    stats.set(topic, current);
  });

  return [...stats.entries()].map(([topic, stat]) => ({
    topic,
    total: stat.total,
    correct: stat.correct,
    score: Math.round((stat.correct / stat.total) * 100),
  }));
}

export async function generateQuiz(difficultyInput = "beginner") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized user");

  const difficultyKey = normalizeDifficulty(difficultyInput);
  const difficulty = DIFFICULTIES[difficultyKey];

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
      bio: true,
      experience: true,
      industryInsight: {
        select: {
          topSkills: true,
          recommendedSkills: true,
          keyTrends: true,
        },
      },
      assessments: {
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { questions: true },
      },
    },
  });

  if (!user) throw new Error("User not found");
  if (!user.industry) throw new Error("User industry not set");

  const domain = resolveDomain(user.industry);
  const recentQuestions = user.assessments
    .flatMap((assessment) => assessment.questions || [])
    .map((question) => question.question)
    .filter(Boolean)
    .slice(0, 24);
  const profileContext = formatProfileContext(user);
  const advancedCategories = getAdvancedTopicCategories(domain);
  const beginnerIntermediateTopics = getBeginnerIntermediateTopics(domain);
  const interviewContexts = getInterviewContexts(domain);
  const questionQualityGuide = getQuestionQualityGuide(domain, difficultyKey);
  const difficultyGuidance = {
    beginner:
      "Beginner: test fundamentals with direct workplace situations, simple vocabulary, one clear concept per question, and straightforward answer choices.",
    intermediate:
      "Intermediate: test applied domain problem-solving with moderate ambiguity, realistic constraints, and practical workplace scenarios.",
    advanced:
      "Advanced: test senior-level domain expertise with difficult edge cases, production or real-world constraints, diagnostics, architecture or strategy where relevant, and non-obvious answer choices. Do not use a repeated template opening.",
  }[difficultyKey];

  const prompt = `
Generate 10 ${difficulty.instruction} for a ${domain.label} interview.
Personalize the questions using this profile creation data:
${profileContext}

Domain focus:
${domain.focus}

Question quality guide:
${questionQualityGuide}

Difficulty behavior:
${difficultyGuidance}

Avoid these recently used question stems:
${recentQuestions.map((question) => `- ${question}`).join("\n") || "- none"}

Question quality and diversity requirements:
- Generate exactly 10 questions.
- Every question must have a different topic, scenario, wording pattern, correct-answer reasoning, and explanation.
- Do not reuse the same opening phrase across questions.
- Do not reuse the same correct answer structure across questions.
- Do not reuse the same explanation structure across questions.
- Make answer choices realistic and nuanced; avoid obvious throwaway options.
- Personalize scenarios around the user's industry, specialization, experience level, skills/tools, and bio when available.
- Treat the selected specialization as the target role/context and use the user's listed skills/tools naturally in questions when relevant.
- Use varied scenario contexts specific to ${domain.label}: ${interviewContexts.join(", ")}.
- Prefer concrete domain terms, technical concepts, calculations, code/debugging/data/clinical/finance/security/mechanical details where relevant.
- Avoid generic phrases such as "stakeholder impact" or "balance tradeoffs" unless the question includes a specific domain problem.
${difficultyKey === "advanced"
  ? `- Cover these 10 distinct advanced categories exactly once each: ${advancedCategories.join(", ")}.
- Use varied scenario openings grounded in these domain contexts: ${interviewContexts.join(", ")}.
- Each advanced question must require strategic tradeoff reasoning, not just "diagnose and compare tradeoffs."
- No two advanced questions may ask the same type of decision.`
  : `- Keep questions varied across these topics where relevant: ${beginnerIntermediateTopics.join(", ")}.`}

Return ONLY valid JSON with this shape:
{
  "questions": [
    {
      "question": "domain-specific interview question",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": "one exact option from options",
      "explanation": "why the answer is correct",
      "topic": "short topic label"
    }
  ]
}

Rules:
- Questions must be specific to ${domain.label}; do not ask software questions unless the domain is software/technology.
- Match the requested difficulty: ${difficulty.label}.
- Use realistic interview scenarios and professional terminology.
- Do not repeat question wording, scenario concepts, answer structures, or options.
- Use concise option text without prefixes like "A)", "B)", "1.", or "2.".
- Explanations must mention the specific scenario and why the other choices are weaker.
`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = parseJsonResponse(result.response.text(), { questions: [] });
    const questions = sanitizeQuestions(parsed.questions, domain, difficultyKey);
    const completedQuestions = completeQuestionSet(questions, domain, difficultyKey);

    if (completedQuestions.length === 10) {
      return shuffle(completedQuestions);
    }

    return buildFallbackQuestions(domain, difficultyKey);
  } catch (err) {
    console.error("Error generating quiz:", err);
    return buildFallbackQuestions(domain, difficultyKey);
  }
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized user");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  const domain = resolveDomain(user.industry);
  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
    topic: q.topic || domain.fallbackTopic,
    difficulty: q.difficulty || "Beginner",
    domain: q.domain || domain.label,
  }));
  const stats = topicStats(questionResults);
  const weakTopics = stats
    .filter((topic) => topic.score < 70)
    .map((topic) => topic.topic);
  const strongTopics = stats
    .filter((topic) => topic.score >= 70)
    .map((topic) => topic.topic);
  const difficultyLabel = questionResults[0]?.difficulty || "Beginner";
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);
  const specialization = getSpecialization(user.industry);
  const roadmapFallback = buildSevenDayRoadmap(weakTopics, domain);
  const resourceFallback = buildRecommendedResources(domain, weakTopics);

  const feedbackPrompt = `
You are CareerSphere's interview coach.
Create an intelligent, personalized markdown feedback report for this quiz.

Candidate profile:
- Industry: ${user.industry || domain.label}
- Specialization: ${specialization || "not provided"}
- Skills: ${(user.skills || []).join(", ") || "not provided"}
- Experience: ${user.experience ?? "not provided"} years
- Professional background/bio: ${user.bio || "not provided"}
- Current industry top skills: ${user.industryInsight?.topSkills?.join(", ") || "not provided"}
- Recommended growth skills: ${user.industryInsight?.recommendedSkills?.join(", ") || "not provided"}

Quiz:
- Domain: ${domain.label}
- Difficulty: ${difficultyLabel}
- Score: ${Math.round(score)}%
- Strong topics: ${strongTopics.join(", ") || "none yet"}
- Weak topics: ${weakTopics.join(", ") || "none"}
- Wrong answers:
${wrongAnswers
  .map(
    (q) =>
      `Question: ${q.question}\nCorrect: ${q.answer}\nUser: ${q.userAnswer || "not answered"}\nTopic: ${q.topic}`
  )
  .join("\n\n")}

Return markdown with these headings:
### Performance Summary
### Strengths
### Weak Areas
### 7-Day Practice Roadmap
### Recommended Resources
### Confidence And Next Difficulty

Section requirements:
- Performance Summary: write 2-3 meaningful sentences. Mention the user's role/domain, ${user.experience ?? "their"} years of experience, specialization when available, difficulty level, score, and the balance between strengths and weak areas. Do not make this one line.
- Strengths: use 3-5 bullet points. Base them on strong topics and profile skills only.
- Weak Areas: use bullet points in "Topic: explanation" format. Explain what the missed answers reveal.
- 7-Day Practice Roadmap: include exactly 7 numbered days. Format each line like "1. Day 1 → Topic: action; action; action." Focus mostly on weak topics: ${weakTopics.join(", ") || domain.fallbackTopic}.
- Recommended Resources: use 4-6 bullet points with specific domain resources, frameworks, standards, or practice types matched to the weak topics.
- Confidence And Next Difficulty: write 2-3 personalized sentences about confidence, readiness, and whether to repeat or advance difficulty.

Quality rules:
- Be analytical, practical, and recruiter-grade.
- Be specific to ${domain.label}, the profile data, and actual quiz results.
- Do not invent credentials, employers, certifications, or achievements.
- Avoid generic advice like "use textbooks and documentation" unless paired with specific domain concepts.
- Keep the tone professional, encouraging, and premium SaaS quality.
`;

  let improvementTip = "";
  try {
    const tipResult = await model.generateContent(feedbackPrompt);
    improvementTip = tipResult.response.text().trim();
  } catch (err) {
    console.error("Error generating improvement feedback:", err);
    improvementTip = `### Performance Summary
Your ${Math.round(score)}% score in the ${difficultyLabel} ${domain.label} assessment shows your current readiness across ${domain.fallbackTopic.toLowerCase()} and related interview scenarios, with ${user.experience ?? "your"} years of experience providing useful context for the result.

${strongTopics.length ? `You showed stronger performance in ${strongTopics.join(", ")}, which indicates a useful foundation to build from.` : "You completed the assessment and established a clear baseline for focused practice."} ${weakTopics.length ? `The main improvement areas are ${weakTopics.join(", ")}, where more structured practice will improve confidence and interview accuracy.` : "No major weak topic was detected, so the next step is consistency through timed practice."}

### Strengths
${(strongTopics.length ? strongTopics : ["Assessment completion", "Baseline interview readiness", domain.fallbackTopic])
  .map((topic) => `- ${topic}`)
  .join("\n")}

### Weak Areas
${(weakTopics.length ? weakTopics : ["No major weak topic"])
  .map((topic) => `- ${topic}: Review missed explanations and practice similar scenarios until the decision logic feels clear.`)
  .join("\n")}

### 7-Day Practice Roadmap
${roadmapFallback.map((item, index) => `${index + 1}. ${item}`).join("\n")}

### Recommended Resources
${resourceFallback.map((item) => `- ${item}`).join("\n")}

### Confidence And Next Difficulty
${score >= 80
  ? `Your score suggests you are ready to try the next challenge, but keep reinforcing ${weakTopics.join(", ") || domain.fallbackTopic} so the improvement is consistent.`
  : `Before moving beyond ${difficultyLabel}, focus on the roadmap above and retake this level to confirm stronger performance in ${weakTopics.join(", ") || domain.fallbackTopic}.`}`;
  }

  try {
    return await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: `${domain.label} - ${difficultyLabel}`,
        improvementTip,
      },
    });
  } catch (err) {
    console.error("Error saving quiz result:", err);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized user");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    return await db.assessment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error("Error fetching assessments:", err);
    throw new Error("Failed to fetch assessments");
  }
}
