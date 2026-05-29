# CareerSphere - AI-Powered Career Readiness Platform

CareerSphere is a full-stack AI career readiness platform for students and professionals. It helps users build ATS-friendly resumes, compare resumes against job descriptions, generate recruiter-ready cover letters, prepare for interviews, explore industry insights, and receive AI-powered career guidance.

## Core Features

- AI Resume Builder with ATS-focused structure, academic performance fields, PDF export, and stronger AI wording suggestions.
- Resume Matcher & Score Analysis with PDF upload, job description matching, match score, ATS score, matched keywords, missing skills, and recommendations.
- CareerNavigator AI for conversational career guidance, resume advice, skill recommendations, interview preparation, and job-readiness roadmaps.
- Cover Letter Studio with tailored AI generation and polished PDF download.
- Interview Preparation with role-specific quizzes, performance tracking, and improvement tips.
- Industry Insights dashboard with salary ranges, market outlook, demand level, trends, and recommended skills.
- Clerk authentication, Prisma/PostgreSQL persistence, and Gemini-powered AI workflows.

## Tech Stack

- Frontend: Next.js 15 App Router, React 19, Tailwind CSS, shadcn-style UI components.
- Backend: Next.js Server Actions and Route Handlers.
- Database: Prisma ORM with PostgreSQL.
- Authentication: Clerk.
- AI: Google Gemini API (`gemini-2.5-flash`).
- Charts and PDF: Recharts and `html2pdf.js`.
- Background jobs: Inngest.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```ini
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
GEMINI_API_KEY="your_gemini_api_key"
```

3. Generate Prisma client:

```bash
npx prisma generate
```

4. Start the development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Project Notes

CareerSphere keeps the original full-stack architecture stable while adding native Next.js AI endpoints for Resume Matcher and CareerNavigator AI. Resume matcher uploads are analyzed per request and are not persisted in the database. Chat history is session-only in the browser.
