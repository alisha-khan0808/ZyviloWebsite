import type { Metadata } from "next";
import { Compass, Handshake, Lightbulb, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeader } from "@/components/ui/section";
import { FinalCta } from "@/components/marketing/home/sections";

export const metadata: Metadata = {
  title: "About Zyvilo",
  description: "Zyvilo designs practical AI agents and automations for businesses of every size — explained in plain language, with people in control.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  { icon: Lightbulb, title: "Plain language first", body: "If we can't explain it simply, we haven't designed it well enough. No jargon, no hype." },
  { icon: Compass, title: "Start with the work", body: "We automate the tasks that actually slow your team down — not technology for its own sake." },
  { icon: ShieldCheck, title: "People stay in control", body: "Approvals, limits and logs are part of every design. Sensitive decisions remain with people." },
  { icon: Handshake, title: "Honest about outcomes", body: "We don't promise guaranteed savings. We measure what changes and improve from there." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Making AI useful for everyday business"
        intro="Zyvilo builds AI agents, multi-agent systems and end-to-end automations. Our job is to take repetitive work off your team's plate — safely, transparently and in a way you understand."
        crumbs={[{ label: "About", href: "/about" }]}
      />
      <Section className="!pt-6">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Why we exist</h2>
            <p className="mt-4 text-muted">
              Most businesses lose hours every week to the same tasks: answering repeat questions, copying details between tools, chasing follow-ups.
              AI can now handle much of this work — but only when it is designed around how a business really operates.
            </p>
            <p className="mt-4 text-muted">
              We work with small businesses that want an always-on receptionist, growing teams that need their CRM and sales follow-up to run smoothly,
              and operations leaders who want complete processes automated with the right approvals.
            </p>
          </div>
          <div className="card grid-dots p-8">
            <p className="font-display text-2xl font-bold leading-snug">
              “One AI assistant or an entire AI workforce — built around how your business operates.”
            </p>
            <p className="mt-4 text-sm text-muted">Our approach in one sentence.</p>
          </div>
        </div>
      </Section>
      <Section tone="lavender">
        <SectionHeader eyebrow="Principles" heading="How we work" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(({ icon: I, title, body }) => (
            <div key={title} className="card p-6">
              <I className="h-6 w-6 text-purple" aria-hidden />
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>
      <FinalCta heading="Let's talk about your business" intro="Tell us what takes up your team's time. We'll show you what could run on its own." cta={{ label: "Tell Us What You Need", href: "/request-automation" }} />
    </>
  );
}
