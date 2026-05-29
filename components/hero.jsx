"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, FileSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const imageRef = useRef(null);

  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      imageElement.classList.toggle("scrolled", scrollPosition > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative w-full overflow-hidden pt-32 md:pt-40">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            CAREERSPHERE - AI-POWERED CAREER READINESS PLATFORM
          </div>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Become career-ready with one intelligent AI workspace.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground md:text-xl">
            Build recruiter-ready resumes, match them to real job descriptions,
            generate polished cover letters, practice interviews, and get
            career guidance from CareerNavigator AI.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard">
              <Button size="lg" className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 sm:w-auto">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/resume-matcher">
              <Button size="lg" variant="outline" className="w-full border-white/15 bg-white/5 sm:w-auto">
                <FileSearch className="h-4 w-4" />
                Try Resume Matcher
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div ref={imageRef} className="hero-image rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-cyan-950/30 backdrop-blur">
            <Image
              src="/banner.jpeg"
              width={1280}
              height={720}
              alt="CareerSphere dashboard preview"
              className="rounded-xl object-cover"
              priority
            />
          </div>
          <div className="grid gap-4">
            {[
              ["92%", "ATS readiness score", "Resume analysis and targeted keyword gaps"],
              ["7", "Career tools", "Resume, matcher, navigator, letters, insights, interviews"],
              ["24/7", "AI guidance", "Actionable support for every stage of job preparation"],
            ].map(([metric, label, text]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/30">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                    <Bot className="h-5 w-5 text-cyan-300" />
                  </span>
                  <div>
                    <p className="text-3xl font-black text-foreground">{metric}</p>
                    <p className="text-sm font-medium text-cyan-100">{label}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
