"use client";

import {
  Trophy,
  CheckCircle2,
  XCircle,
  Target,
  Sparkles,
  AlertCircle,
  BookOpen,
  Route,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const feedbackSections = [
  "Performance Summary",
  "Strengths",
  "Weak Areas",
  "7-Day Practice Roadmap",
  "Recommended Resources",
  "Confidence And Next Difficulty",
];

function normalizeHeading(value = "") {
  return value
    .replace(/&/g, " and ")
    .replace(/[#*_`]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanFeedbackLine(value = "") {
  return value
    .replace(/^[\s>*-]+/, "")
    .replace(/^\d+[\).]\s*/, "")
    .replace(/[*_`]/g, "")
    .trim();
}

function parseFeedback(markdown = "") {
  const sections = feedbackSections.reduce((acc, section) => {
    acc[section] = [];
    return acc;
  }, {});
  let current = "Performance Summary";
  const headingMap = new Map(
    feedbackSections.map((section) => [normalizeHeading(section), section])
  );

  markdown.split("\n").forEach((line) => {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    const possibleHeading = headingMatch ? headingMatch[1] : line;
    const matched = headingMap.get(normalizeHeading(possibleHeading));
    if (matched) {
      current = matched;
      return;
    }

    const cleaned = cleanFeedbackLine(line);
    if (cleaned) sections[current].push(cleaned);
  });

  if (!sections["Performance Summary"].length && markdown.trim()) {
    sections["Performance Summary"] = [cleanFeedbackLine(markdown)];
  }

  return sections;
}

function splitLabelDetail(item = "") {
  const match = item.match(/^([^:]{2,80}):\s+(.+)$/);
  if (!match) return { label: "", detail: item };
  return { label: match[1], detail: match[2] };
}

function getWeakAreaTopics(items = []) {
  return [
    ...new Set(
      items
        .map((item) => splitLabelDetail(item).label || item)
        .map((item) => item.replace(/\s+[—-]\s+.+$/, "").trim())
        .filter(Boolean)
    ),
  ];
}

function FeedbackList({ items, tone = "cyan", detailed = false }) {
  const dotClass = tone === "amber" ? "bg-amber-300" : "bg-cyan-300";

  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const { label, detail } = splitLabelDetail(item);

        return (
          <li
            key={item}
            className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm leading-6 text-slate-300"
          >
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
            <span>
              {detailed && label ? (
                <>
                  <span className="font-semibold text-slate-100">{label}:</span>{" "}
                  {detail}
                </>
              ) : (
                item
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function RoadmapList({ items }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, index) => {
        const { label, detail } = splitLabelDetail(item);

        return (
          <li
            key={item}
            className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm leading-6 text-slate-300"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/10 text-xs font-semibold text-cyan-200">
              {index + 1}
            </span>
            <span>
              {label ? (
                <>
                  <span className="font-semibold text-slate-100">{label}:</span>{" "}
                  {detail}
                </>
              ) : (
                item
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function getTopicRows(questions = []) {
  const stats = new Map();
  questions.forEach((question) => {
    const topic = question.topic || "Core fundamentals";
    const current = stats.get(topic) || { total: 0, correct: 0 };
    current.total += 1;
    if (question.isCorrect) current.correct += 1;
    stats.set(topic, current);
  });

  return [...stats.entries()].map(([topic, stat]) => ({
    topic,
    score: Math.round((stat.correct / stat.total) * 100),
    total: stat.total,
  }));
}

export default function QuizResult({
  result,
  hideStartNew = false,
  onStartNew,
}) {
  if (!result) return null;
  const topicRows = getTopicRows(result.questions);
  const feedback = parseFeedback(result.improvementTip || "");
  const weakAreaTopics = getWeakAreaTopics(feedback["Weak Areas"]);

  return (
    <div className="mx-auto rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_22px_70px_-44px_rgba(8,145,178,0.5)]">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-50">
          <Trophy className="h-6 w-6 text-cyan-300" />
          Quiz Results
        </h1>
      </div>

      <CardContent className="space-y-6">
        {/* Score Overview */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-center">
          <p className="text-sm font-medium text-slate-400">Overall Score</p>
          <h3 className="text-3xl font-semibold tracking-tight text-slate-50">
            {result.quizScore.toFixed(1)}%
          </h3>
          <Progress value={result.quizScore} className="w-full" />
        </div>

        {result.improvementTip && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] sm:p-5">
            <p className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-50">
              <Target className="h-4 w-4 text-cyan-300" />
              AI Interview Coach Feedback
            </p>

            <div className="space-y-4">
              {feedback["Performance Summary"].length > 0 && (
                <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    Performance Summary 📊
                  </h3>
                  <p className="text-sm leading-7 text-slate-400">
                    {feedback["Performance Summary"].join(" ")}
                  </p>
                </section>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                {feedback.Strengths.length > 0 && (
                  <section>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                      Strengths 💪
                    </h3>
                    <FeedbackList items={feedback.Strengths} />
                  </section>
                )}

                {weakAreaTopics.length > 0 && (
                  <section>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <AlertCircle className="h-4 w-4 text-amber-300" />
                      Weak Areas 🚧
                    </h3>
                    <FeedbackList
                      items={weakAreaTopics}
                      tone="amber"
                    />
                  </section>
                )}
              </div>

              {feedback["7-Day Practice Roadmap"].length > 0 && (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <Route className="h-4 w-4 text-cyan-300" />
                    7-Day Practice Roadmap 🗺️
                  </h3>
                  <RoadmapList items={feedback["7-Day Practice Roadmap"]} />
                </section>
              )}

              {feedback["Recommended Resources"].length > 0 && (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <BookOpen className="h-4 w-4 text-cyan-300" />
                    Recommended Resources 📚
                  </h3>
                  <FeedbackList
                    items={feedback["Recommended Resources"]}
                    detailed
                  />
                </section>
              )}

              {feedback["Confidence And Next Difficulty"].length > 0 && (
                <section className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-cyan-100">
                    Confidence And Next Difficulty 🚀
                  </h3>
                  <p className="text-sm leading-7 text-slate-300">
                    {feedback["Confidence And Next Difficulty"].join(" ")}
                  </p>
                </section>
              )}
            </div>
          </div>
        )}

        {topicRows.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {topicRows.map((row) => (
              <div
                key={row.topic}
                className="rounded-xl border border-white/10 bg-white/[0.035] p-3"
              >
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="text-slate-300">{row.topic}</span>
                  <span className="font-semibold text-cyan-200">{row.score}%</span>
                </div>
                <Progress value={row.score} />
              </div>
            ))}
          </div>
        )}

        {/* Questions Review */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-50">Question Review</h3>
          {result.questions.map((q, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-white/10 bg-white/[0.035] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
                  {index + 1}
                </span>
                <div className="flex flex-1 items-start justify-between gap-2">
                  <p className="font-medium leading-6 text-slate-100">
                    {q.question}
                  </p>
                  {q.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-cyan-300" />
                  ) : (
                    <XCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-400">
                <p>
                  Topic: {q.topic || "Core fundamentals"} | Difficulty:{" "}
                  {q.difficulty || "Beginner"}
                </p>
                <p>Your answer: {q.userAnswer}</p>
                {!q.isCorrect && <p>Correct answer: {q.answer}</p>}
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/45 p-3 text-sm">
                <p className="font-medium text-slate-100">Explanation:</p>
                <p className="mt-1 leading-6 text-slate-400">{q.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {!hideStartNew && (
        <CardFooter>
          <Button onClick={onStartNew} className="w-full">
            Start New Quiz
          </Button>
        </CardFooter>
      )}
    </div>
  );
}
