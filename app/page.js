import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import HeroSection from "@/components/hero";
import { features } from "@/data/features";
import { testimonial } from "@/data/testimonial";
import { faqs } from "@/data/faqs";
import { howItWorks } from "@/data/howItWorks";

const stats = [
  { value: "7", label: "Career readiness tools" },
  { value: "100+", label: "AI-generated practice paths" },
  { value: "ATS", label: "Resume-first optimization" },
  { value: "24/7", label: "CareerNavigator AI support" },
];

export default function LandingPage() {
  return (
    <>
      <div className="grid-background" />
      <HeroSection />

      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Career Readiness Suite
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
              Everything students and professionals need before applying.
            </h2>
            <p className="mt-4 text-muted-foreground">
              CareerSphere combines document creation, AI analysis, practice,
              and market intelligence in one polished workflow.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border-white/10 bg-white/[0.06] shadow-none backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.09]"
              >
                <CardContent className="p-6">
                  {feature.icon}
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-y border-white/10 bg-white/[0.04] py-12">
        <div className="container mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-background/40 p-5">
              <h3 className="text-3xl font-black text-cyan-200 md:text-4xl">{stat.value}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="text-3xl font-black md:text-4xl">How CareerSphere Works</h2>
            <p className="mt-3 text-muted-foreground">
              A guided path from profile setup to job-ready confidence.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, index) => (
              <div key={item.title} className="relative rounded-2xl border border-white/10 bg-white/[0.05] p-6">
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                  {item.icon}
                </span>
                <p className="text-xs font-bold text-cyan-300">STEP {index + 1}</p>
                <h3 className="mt-2 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-white/[0.03] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-black md:text-4xl">
            Built for capstone-quality career preparation
          </h2>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
            {testimonial.map((item) => (
              <Card key={item.author} className="border-white/10 bg-background/70">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center gap-4">
                    <Image
                      width={48}
                      height={48}
                      src={item.image}
                      alt={item.author}
                      className="rounded-full border border-cyan-300/20 object-cover"
                    />
                    <div>
                      <p className="font-semibold">{item.author}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                      <p className="text-xs text-cyan-300">{item.company}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    &quot;{item.quote}&quot;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="text-3xl font-black md:text-4xl">Frequently Asked Questions</h2>
            <p className="mt-3 text-muted-foreground">
              Clear answers about CareerSphere&apos;s AI career readiness workflow.
            </p>
          </div>

          <Accordion type="single" collapsible className="mx-auto max-w-3xl">
            {faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="w-full px-4 pb-20">
        <div className="container mx-auto overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-emerald-500/10 p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 flex justify-center gap-3 text-cyan-200">
              <Trophy className="h-6 w-6" />
              <Target className="h-6 w-6" />
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black md:text-5xl">
              Get career-ready with CareerSphere.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Create stronger documents, understand job fit, practice smarter,
              and walk into opportunities with a clear preparation plan.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="mt-8 bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                Start Your Career Readiness Journey
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
