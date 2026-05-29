import { Brain, Flame, Target, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StatsCards({ assessments }) {
  const getAverageScore = () => {
    if (!assessments?.length) return 0;
    const total = assessments.reduce(
      (sum, assessment) => sum + assessment.quizScore,
      0
    );
    return (total / assessments.length).toFixed(1);
  };

  const getLatestAssessment = () => {
    if (!assessments?.length) return null;
    return assessments[0];
  };

  const getTotalQuestions = () => {
    if (!assessments?.length) return 0;
    return assessments.reduce(
      (sum, assessment) => sum + assessment.questions.length,
      0
    );
  };

  const getTopicSignals = () => {
    const stats = new Map();
    assessments?.forEach((assessment) => {
      assessment.questions?.forEach((question) => {
        const topic = question.topic || "Core fundamentals";
        const current = stats.get(topic) || { total: 0, correct: 0 };
        current.total += 1;
        if (question.isCorrect) current.correct += 1;
        stats.set(topic, current);
      });
    });

    const rows = [...stats.entries()].map(([topic, stat]) => ({
      topic,
      score: Math.round((stat.correct / stat.total) * 100),
      total: stat.total,
    }));

    return {
      strong: rows
        .filter((row) => row.total >= 1)
        .sort((a, b) => b.score - a.score)[0]?.topic,
      weak: rows
        .filter((row) => row.total >= 1)
        .sort((a, b) => a.score - b.score)[0]?.topic,
    };
  };

  const getStreak = () => {
    if (!assessments?.length) return 0;
    const days = [
      ...new Set(
        assessments.map((assessment) =>
          new Date(assessment.createdAt).toDateString()
        )
      ),
    ].map((day) => new Date(day));
    days.sort((a, b) => b - a);

    let streak = 0;
    const today = new Date();
    for (const day of days) {
      const diff = Math.floor(
        (new Date(today.toDateString()) - day) / (24 * 60 * 60 * 1000)
      );
      if (diff === streak) streak += 1;
      else if (diff > streak) break;
    }
    return streak;
  };

  const topicSignals = getTopicSignals();
  const cards = [
    {
      title: "Average Score",
      value: `${getAverageScore()}%`,
      note: "Across all assessments",
      icon: Trophy,
    },
    {
      title: "Questions Practiced",
      value: getTotalQuestions(),
      note: "Total questions",
      icon: Brain,
    },
    {
      title: "Latest Score",
      value: `${getLatestAssessment()?.quizScore.toFixed(1) || 0}%`,
      note: "Most recent quiz",
      icon: Target,
    },
    {
      title: "Practice Streak",
      value: `${getStreak()} days`,
      note: `Strong: ${topicSignals.strong || "Practice to unlock"}`,
      extra: `Focus: ${topicSignals.weak || "No weak topic yet"}`,
      icon: Flame,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="group border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-50px_rgba(15,23,42,0.95)] transition-colors hover:border-cyan-300/25 hover:bg-white/[0.045]"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {card.title}
              </CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-cyan-200 transition-colors group-hover:border-cyan-300/25">
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight text-slate-50">
                {card.value}
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {card.note}
              </p>
              {card.extra && (
                <p className="text-xs leading-5 text-slate-500">{card.extra}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
