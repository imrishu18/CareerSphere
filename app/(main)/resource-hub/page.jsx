import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  BrainCircuit,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers,
  SearchCheck,
  Sparkles,
  Target,
  Wrench,
  Youtube,
} from "lucide-react";
import { getUserOnboardingStatus } from "@/actions/user";
import { getResourceHubProfile } from "@/actions/resource-hub";
import { buildResourceHub } from "@/data/resource-hub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const sectionMeta = {
  roadmaps: {
    title: "Learning Roadmaps",
    description: "Role-based progression paths selected for your domain and current skill signals.",
    icon: Compass,
  },
  interview: {
    title: "Interview Preparation",
    description: "Focused resources for practical screening, case discussion, and role interviews.",
    icon: SearchCheck,
  },
  certifications: {
    title: "Certifications & Courses",
    description: "Recognized credentials and trusted providers with hiring-market signal.",
    icon: Award,
  },
  tools: {
    title: "Practice Platforms & Tools",
    description: "Hands-on platforms to build evidence, repetitions, and portfolio-ready practice.",
    icon: Wrench,
  },
};

const categoryIcons = {
  Roadmap: Layers,
  "Learning Path": BookOpen,
  "Interview Prep": Target,
  Certification: Award,
  Course: GraduationCap,
  "Practice Platform": BrainCircuit,
  Tool: Wrench,
};

function ResourceCard({ resource }) {
  const Icon = categoryIcons[resource.category] || ExternalLink;

  return (
    <Card className="group relative flex h-full min-h-[232px] flex-col overflow-hidden border-white/10 bg-slate-950/70 shadow-[0_18px_54px_-44px_rgba(2,6,23,0.95)] ring-1 ring-white/[0.025] transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-slate-900/70 hover:shadow-[0_24px_70px_-48px_rgba(8,145,178,0.45)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent opacity-60" />
      <CardHeader className="p-4 pb-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/[0.07] text-cyan-200 shadow-[0_14px_32px_-28px_rgba(34,211,238,0.9)]">
            <Icon className="h-4 w-4" />
          </span>
          <Badge
            variant="outline"
            className="border-white/10 bg-white/[0.035] text-[10px] font-medium text-slate-300"
          >
            {resource.difficulty}
          </Badge>
        </div>
        <CardTitle className="text-base leading-6 text-slate-50">
          {resource.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 text-[13px] leading-5 text-slate-400">
          {resource.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto p-4 pt-0">
        <div className="mb-3 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-3">
          <Badge className="bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200 hover:bg-cyan-400/15">
            {resource.category}
          </Badge>
          <Badge
            variant="outline"
            className="border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400"
          >
            {resource.provider}
          </Badge>
        </div>
        <Button
          asChild
          size="sm"
          className="h-8 w-full border border-white/10 bg-white/[0.045] text-xs font-semibold text-slate-100 shadow-none hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-100"
        >
          <a href={resource.href} target="_blank" rel="noreferrer">
            Open resource
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function ResourceSection({ id, resources }) {
  const meta = sectionMeta[id];
  const Icon = meta.icon;

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_18px_60px_-52px_rgba(15,23,42,0.95)] ring-1 ring-white/[0.018] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-cyan-200">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/18 bg-cyan-400/[0.065] shadow-[0_12px_28px_-25px_rgba(34,211,238,0.85)]">
              <Icon className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-semibold tracking-tight text-slate-50">
              {meta.title}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            {meta.description}
          </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-white/10 bg-white/[0.025] text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400"
        >
          {resources.length} curated picks
        </Badge>
      </div>
      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={`${id}-${resource.title}`} resource={resource} />
        ))}
      </div>
    </section>
  );
}

function PlaylistCard({ playlist }) {
  return (
    <Card className="group relative flex h-full min-h-[292px] flex-col overflow-hidden border-white/10 bg-slate-950/70 shadow-[0_18px_54px_-44px_rgba(2,6,23,0.95)] ring-1 ring-white/[0.025] transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-slate-900/70 hover:shadow-[0_24px_70px_-48px_rgba(8,145,178,0.45)]">
      <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.88))] p-3.5">
        <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/50 text-cyan-100 shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_78%_72%,rgba(16,185,129,0.08),transparent_30%)]" />
          <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-slate-950/65 px-2 py-1 text-[10px] font-medium text-slate-300 backdrop-blur-sm">
            {playlist.creator}
          </div>
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.08] shadow-[0_18px_38px_-26px_rgba(34,211,238,0.8)]">
            <Youtube className="h-7 w-7" />
          </span>
        </div>
      </div>
      <CardHeader className="p-4 pb-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          <Badge className="bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200 hover:bg-cyan-400/15">
            YouTube Playlist
          </Badge>
          <Badge
            variant="outline"
            className="border-white/10 bg-white/[0.025] text-[10px] font-medium text-slate-300"
          >
            {playlist.difficulty}
          </Badge>
        </div>
        <CardTitle className="text-base leading-6 text-slate-50">
          {playlist.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 text-[13px] leading-5 text-slate-400">
          {playlist.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto p-4 pt-0">
        <div className="mb-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          <span className="text-xs font-medium text-slate-300">
            {playlist.creator}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
        </div>
        <Button
          asChild
          size="sm"
          className="h-8 w-full border border-white/10 bg-white/[0.045] text-xs font-semibold text-slate-100 shadow-none hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-100"
        >
          <a href={playlist.href} target="_blank" rel="noreferrer">
            <Youtube className="h-3.5 w-3.5" />
            Open playlist
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

function YoutubePlaylistsSection({ playlists }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_18px_60px_-52px_rgba(15,23,42,0.95)] ring-1 ring-white/[0.018] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
        <div className="mb-2 flex items-center gap-2 text-cyan-200">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/18 bg-cyan-400/[0.065] shadow-[0_12px_28px_-25px_rgba(34,211,238,0.85)]">
            <Youtube className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-slate-50">
            Curated YouTube Playlists
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          Focused video learning matched to your domain, target role, and skill
          specialization.
        </p>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-white/10 bg-white/[0.025] text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400"
        >
          {playlists.length} video paths
        </Badge>
      </div>
      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {playlists.map((playlist) => (
          <PlaylistCard key={playlist.title} playlist={playlist} />
        ))}
      </div>
    </section>
  );
}

export default async function ResourceHubPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const profile = await getResourceHubProfile();
  const hub = buildResourceHub(profile);

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65 shadow-[0_24px_80px_-44px_rgba(8,145,178,0.6)] ring-1 ring-white/[0.025]">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_48%)] px-5 py-6 sm:px-7 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100 shadow-[0_14px_30px_-28px_rgba(34,211,238,0.85)]">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                AI-curated resource hub
              </div>
              <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl md:text-[44px]">
                {hub.targetRole} Resource Hub
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">
                Learning paths, interview preparation, certifications, and
                practice tools tailored to your profile data and career focus.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/20">
                  {hub.domainName}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-cyan-300/25 bg-slate-950/45 text-cyan-100"
                >
                  {hub.subdomainName}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-white/10 bg-white/[0.025] text-slate-300"
                >
                  {hub.experienceLevel} track
                </Badge>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_18px_56px_-48px_rgba(2,6,23,0.95)] ring-1 ring-white/[0.025] lg:w-[330px]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Target className="h-4 w-4 text-cyan-300" />
                  Skill focus
                </div>
                <span className="rounded-full border border-cyan-300/15 bg-cyan-400/[0.055] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-100">
                  Profile
                </span>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-white/[0.07] pt-3">
                {hub.skillFocus.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="border-white/10 bg-slate-950/45 text-xs font-medium text-slate-300"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3.5 md:grid-cols-3">
        <Card className="overflow-hidden border-white/10 bg-slate-950/60 shadow-[0_18px_54px_-46px_rgba(2,6,23,0.95)] ring-1 ring-white/[0.018]">
          <div className="h-px bg-gradient-to-r from-cyan-300/30 via-white/10 to-transparent" />
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-slate-300">
              Domain signal
            </CardTitle>
            <CardDescription className="text-xl font-semibold text-slate-50">
              {hub.domainName}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="overflow-hidden border-white/10 bg-slate-950/60 shadow-[0_18px_54px_-46px_rgba(2,6,23,0.95)] ring-1 ring-white/[0.018]">
          <div className="h-px bg-gradient-to-r from-cyan-300/30 via-white/10 to-transparent" />
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-slate-300">
              Role inference
            </CardTitle>
            <CardDescription className="text-xl font-semibold text-slate-50">
              {hub.targetRole}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="overflow-hidden border-white/10 bg-slate-950/60 shadow-[0_18px_54px_-46px_rgba(2,6,23,0.95)] ring-1 ring-white/[0.018]">
          <div className="h-px bg-gradient-to-r from-cyan-300/30 via-white/10 to-transparent" />
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-slate-300">
              Resource quality
            </CardTitle>
            <CardDescription className="text-xl font-semibold text-slate-50">
              Trusted providers
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-6">
        <ResourceSection id="roadmaps" resources={hub.resources.roadmaps} />
        <ResourceSection id="interview" resources={hub.resources.interview} />
        <YoutubePlaylistsSection playlists={hub.youtubePlaylists} />
        <ResourceSection id="certifications" resources={hub.resources.certifications} />
        <ResourceSection id="tools" resources={hub.resources.tools} />
      </div>

      <Card className="border-white/10 bg-slate-950/55 shadow-[0_18px_60px_-48px_rgba(15,23,42,0.95)]">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Need a learning plan from these resources?
            </p>
            <p className="text-xs leading-5 text-slate-400">
              CareerNavigator can turn this resource set into a weekly roadmap.
            </p>
          </div>
          <Button asChild className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
            <Link href="/career-navigator">
              Ask CareerNavigator
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
