"use client";

import React from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Bot,
  BriefcaseIcon,
  FileCheck2,
  FileSearch,
  GraduationCap,
  LineChart,
  PenLine,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const careerTools = [
  {
    href: "/resume",
    title: "AI Resume Builder",
    description: "Build a clean ATS resume and strengthen sections with AI.",
    icon: FileCheck2,
    color: "text-cyan-300",
  },
  {
    href: "/resume-matcher",
    title: "Resume Matcher & Score Analysis",
    description: "Upload a resume and compare it against a target role.",
    icon: FileSearch,
    color: "text-emerald-300",
  },
  {
    href: "/career-navigator",
    title: "CareerNavigator AI",
    description: "Ask for career roadmaps, skill plans, and job guidance.",
    icon: Bot,
    color: "text-violet-300",
  },
  {
    href: "/interview",
    title: "Interview Preparation",
    description: "Practice role-specific questions and track performance.",
    icon: GraduationCap,
    color: "text-amber-300",
  },
  {
    href: "/ai-cover-letter",
    title: "Cover Letter Studio",
    description: "Generate recruiter-ready letters and export polished PDFs.",
    icon: PenLine,
    color: "text-rose-300",
  },
];

const DashboardView = ({ insights, metrics }) => {
  const salaryData = insights.salaryRanges.map((range) => ({
    name: range.role,
    // Divide by 10000 so that default $40k USD values elegantly transform into 4 LPA
    min: range.min / 10000,
    max: range.max / 10000,
    median: range.median / 10000,
  }));

  const getDemandLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-emerald-400";
      case "medium":
        return "bg-amber-400";
      case "low":
        return "bg-rose-400";
      default:
        return "bg-slate-400";
    }
  };

  const getMarketOutlookInfo = (outlook) => {
    switch (outlook.toLowerCase()) {
      case "positive":
        return { icon: TrendingUp, color: "text-emerald-300" };
      case "neutral":
        return { icon: LineChart, color: "text-amber-300" };
      case "negative":
        return { icon: TrendingDown, color: "text-rose-300" };
      default:
        return { icon: LineChart, color: "text-slate-300" };
    }
  };

  const OutlookIcon = getMarketOutlookInfo(insights.marketOutlook).icon;
  const outlookColor = getMarketOutlookInfo(insights.marketOutlook).color;
  const lastUpdatedDate = format(new Date(insights.lastUpdated), "dd MMM yyyy");
  const nextUpdateDistance = formatDistanceToNow(new Date(insights.nextUpdate), {
    addSuffix: true,
  });
  const interviewTrendData = (metrics?.interviewTrend || []).map((item) => ({
    date: format(new Date(item.date), "MMM dd"),
    score: Math.round(item.score),
  }));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 p-6 shadow-[0_22px_70px_-40px_rgba(8,145,178,0.55)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-4 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/20">
              <Sparkles className="mr-2 h-3 w-3" />
              Career readiness command center
            </Badge>
            <h1 className="max-w-4xl text-3xl font-black tracking-tight md:text-5xl">
              Welcome to CareerSphere.
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Build documents, analyze job fit, prepare for interviews, and get
              focused career recommendations from one intelligent dashboard.
            </p>
          </div>
          <Link href="/career-navigator">
            <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
              Ask CareerNavigator AI
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {careerTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link href={tool.href} key={tool.title}>
              <Card className="h-full border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.07]">
                <CardHeader>
                  <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ${tool.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] transition hover:border-cyan-300/25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Market Outlook</CardTitle>
            <OutlookIcon className={`h-4 w-4 ${outlookColor}`} />
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            <div className="text-xl font-bold tracking-tight">{insights.marketOutlook}</div>
            <p className="mt-1 text-[11px] text-muted-foreground">Next update {nextUpdateDistance}</p>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] transition hover:border-cyan-300/25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Industry Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-300" />
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            <div className="text-xl font-bold tracking-tight">{insights.growthRate.toFixed(1)}%</div>
            <Progress value={insights.growthRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] transition hover:border-cyan-300/25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Demand Level</CardTitle>
            <BriefcaseIcon className="h-4 w-4 text-cyan-300" />
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            <div className="text-xl font-bold tracking-tight">{insights.demandLevel}</div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
              <div className={`h-1.5 rounded-full ${getDemandLevelColor(insights.demandLevel)}`} style={{ width: "72%" }} />
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] transition hover:border-cyan-300/25">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Last Updated</CardTitle>
            <Sparkles className="h-4 w-4 text-violet-300" />
          </CardHeader>
          <CardContent className="flex-1 p-4 pt-0">
            <div className="text-base font-medium text-muted-foreground">{lastUpdatedDate}</div>
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              Refresh scheduled {nextUpdateDistance}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          ["Profile Complete", metrics?.profileCompleteness || 0],
          ["Resume Readiness", metrics?.resumeReadiness || 0],
          ["Interview Average", metrics?.averageInterviewScore || 0],
        ].map(([label, value]) => (
          <Card key={label} className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)] transition hover:border-cyan-300/25">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">{label}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 pt-0">
              <div className="mb-2 text-xl font-bold tracking-tight">{value}%</div>
              <Progress value={value} className="h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Salary Ranges by Role</CardTitle>
              <CardDescription className="text-xs">
                Industry data in Lakhs Per Annum (LPA), updated {lastUpdatedDate}
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-cyan-300/30 text-[10px] text-cyan-100">Industry Insights</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="h-[240px] w-full rounded-2xl border border-white/10 bg-white/[0.025] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salaryData}
                barCategoryGap="6%"
                barGap={3}
                margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#94a3b8' }} tickMargin={10} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => `₹${value}L`} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-sm">
                          <p className="mb-1.5 text-sm font-semibold text-white">{label}</p>
                          {payload.map((item) => (
                            <div key={item.name} className="flex items-center gap-2 text-xs text-slate-300">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="font-medium text-slate-100">₹{Number(item.value).toFixed(1)} LPA</span>
                              <span className="text-slate-500">({item.name})</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="min" fill="#22d3ee" name="Minimum" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="median" fill="#10b981" name="Median" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="max" fill="#8b5cf6" name="Maximum" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-semibold">Interview Readiness Trend</CardTitle>
            <CardDescription className="text-xs">
              Based on your completed mock interviews
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-5 pt-0">
            {interviewTrendData.length ? (
              <div className="h-[200px] w-full mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={interviewTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#94a3b8' }} tickMargin={10} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload?.length) {
                          return (
                            <div className="rounded-xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-sm">
                              <p className="mb-1 font-semibold text-white">{label}</p>
                              <p className="font-medium text-cyan-300">
                                Score: {payload[0].value}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#22d3ee"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#22d3ee", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#fff" }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Complete a mock interview to start building your readiness trend.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-semibold">Recommended Certifications</CardTitle>
            <CardDescription className="text-xs">
              Generated from your industry skill gaps
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-5 pt-0">
            {metrics?.recommendedCertifications?.length ? (
              <ul className="space-y-2 mt-3">
                {metrics.recommendedCertifications.map((item) => (
                  <li key={item} className="flex items-center gap-3 rounded-md bg-white/[0.02] p-2 px-3 text-[13px] transition hover:bg-white/[0.04]">
                    <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span className="text-slate-200">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your listed skills already cover current industry recommendations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-semibold">Top Skills</CardTitle>
            <CardDescription className="text-xs">High-signal skills for your profile</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-wrap content-start gap-1.5 p-5 pt-2">
            {insights.topSkills.map((skill) => (
              <Badge key={skill} className="bg-cyan-400/10 font-medium text-cyan-200 hover:bg-cyan-400/20 px-2 py-0.5 text-[12px]">
                {skill}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-semibold">Recommended Skills</CardTitle>
            <CardDescription className="text-xs">Next areas to develop</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-wrap content-start gap-1.5 p-5 pt-2">
            {insights.recommendedSkills.map((skill) => (
              <Badge key={skill} variant="outline" className="border-slate-700 bg-slate-900/50 px-2 py-0.5 text-[12px] font-medium text-slate-300">
                {skill}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-semibold">Key Industry Trends</CardTitle>
            <CardDescription className="text-xs">Signals shaping your career path</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-5 pt-2">
            <ul className="space-y-2">
              {insights.keyTrends.slice(0, 4).map((trend) => (
                <li key={trend} className="flex items-center gap-3 rounded-md bg-white/[0.02] p-2 px-3 text-[13px] transition hover:bg-white/[0.04]">
                  <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                  <span className="text-slate-200">{trend}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardView;
