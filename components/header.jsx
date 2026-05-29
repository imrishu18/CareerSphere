import React from "react";
import Link from "next/link";
import {
  Bot,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  FileSearch,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  PenBox,
  Sparkles,
} from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tools = [
  { href: "/resume", label: "AI Resume Builder", icon: FileText },
  { href: "/resume-matcher", label: "Resume Matcher", icon: FileSearch },
  { href: "/career-navigator", label: "CareerNavigator AI", icon: Bot },
  { href: "/ai-cover-letter", label: "Cover Letter", icon: PenBox },
  { href: "/interview", label: "Interview Prep", icon: MessageSquareText },
  { href: "/resource-hub", label: "Resource Hub", icon: BookOpen },
];

export default async function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10">
            <Sparkles className="h-5 w-5 text-cyan-300" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-black tracking-[0.24em] text-foreground">
              CAREERSPHERE
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              AI Career Readiness Platform
            </span>
          </span>
        </Link>

        <div className="flex items-center space-x-2 md:space-x-4">
          <SignedIn>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="hidden border-white/15 bg-white/5 md:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="ghost" className="h-10 w-10 p-0 md:hidden">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                  <BriefcaseBusiness className="h-4 w-4" />
                  <span className="hidden md:block">Career Tools</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <DropdownMenuItem asChild key={tool.href}>
                      <Link href={tool.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {tool.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button variant="outline" className="border-white/15 bg-white/5">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
