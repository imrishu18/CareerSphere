import { getAssessments } from "@/actions/interview";
import StatsCards from "./_components/stats-cards";
import PerformanceChart from "./_components/performace-chart";
import QuizList from "./_components/quiz-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function buildInterviewInsights(assessments = []) {
  const stats = new Map();
  assessments.forEach((assessment) => {
    assessment.questions?.forEach((question) => {
      const topic = question.topic || "Core fundamentals";
      const current = stats.get(topic) || { total: 0, correct: 0 };
      current.total += 1;
      if (question.isCorrect) current.correct += 1;
      stats.set(topic, current);
    });
  });

  const topics = [...stats.entries()].map(([topic, stat]) => ({
    topic,
    score: Math.round((stat.correct / stat.total) * 100),
  }));
  const weak = topics.sort((a, b) => a.score - b.score).slice(0, 3);
  const strong = [...topics].sort((a, b) => b.score - a.score).slice(0, 3);
  const latest = assessments[0];

  return {
    weak,
    strong,
    roadmap: weak.length
      ? weak.map(
          (topic) =>
            `Prioritize ${topic.topic} with targeted practice before moving to harder mocks.`
        )
      : [
          latest?.improvementTip
            ?.replace(/#+\s*/g, "")
            .split("\n")
            .filter(Boolean)[0] ||
            "Complete a quiz to unlock personalized AI feedback.",
        ],
    latestSummary:
      latest?.improvementTip
        ?.replace(/#+\s*/g, "")
        .split("\n")
        .filter(Boolean)[0] ||
      "Complete a quiz to unlock personalized AI feedback.",
  };
}

export default async function InterviewPrepPage() {
  const assessments = await getAssessments();
  const insights = buildInterviewInsights(assessments);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_22px_70px_-40px_rgba(8,145,178,0.55)]">
        <div className="px-5 py-6 sm:px-7 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
              AI interview workspace
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl md:text-[44px]">
              Interview Preparation
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">
              Practice role-specific questions and track your readiness over time.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <StatsCards assessments={assessments} />
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-50">
                Weak Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.weak.length ? (
                <ul className="space-y-2.5">
                  {insights.weak.map((topic) => (
                    <li
                      key={topic.topic}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-slate-300"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                        <span className="truncate">{topic.topic}</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-amber-200">
                        {topic.score}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-6 text-slate-400">
                  No weak topic detected yet.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-50">
                Strong Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights.strong.length ? (
                <ul className="space-y-2.5">
                  {insights.strong.map((topic) => (
                    <li
                      key={topic.topic}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm text-slate-300"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                        <span className="truncate">{topic.topic}</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-cyan-200">
                        {topic.score}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-6 text-slate-400">
                  Practice quizzes to identify strengths.
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-50">
                Improvement Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {insights.roadmap.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm leading-6 text-slate-300"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <PerformanceChart assessments={assessments} />
        <QuizList assessments={assessments} />
      </div>
    </div>
  );
}
