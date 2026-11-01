import type { Metadata } from "next";
import { Eye, KeyRound, ShieldCheck, UserCheck } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeader } from "@/components/ui/section";
import { FinalCta, ProcessSection } from "@/components/marketing/home/sections";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram";
import { getHome, getService } from "@/lib/content/repo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How It Works — Process, Architecture & Human Oversight",
  description: "How Zyvilo discovers, designs, builds and launches AI agents and automations — with human approvals, security and monitoring built in.",
  alternates: { canonical: "/how-it-works" },
};

const TERMS = [
  { term: "AI Agent", plain: "A digital assistant that handles a task for your business." },
  { term: "Multi-Agent System", plain: "A team of AI assistants that work together." },
  { term: "Supervisor Agent", plain: "One AI coordinator that assigns work to specialist assistants." },
  { term: "End-to-End Automation", plain: "A complete process that runs across your tools, with people involved when needed." },
];

const OVERSIGHT = [
  { icon: UserCheck, title: "Human approvals", body: "You decide which actions need a person to approve — quotes, refunds, record changes or anything sensitive." },
  { icon: KeyRound, title: "Least-privilege access", body: "Agents only get access to the systems and data they need for their task." },
  { icon: Eye, title: "Monitoring & logs", body: "Every action is recorded so you can see what happened, when and why." },
  { icon: ShieldCheck, title: "Security by design", body: "Encryption in transit, access controls and data-handling rules agreed with you up front." },
];

export default async function HowItWorksPage() {
  const [home, orchestrate] = await Promise.all([getHome(), getService("zyvilo-orchestrate")]);
  const process = home.sections.find((s) => s.id === "process");
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="Clear steps, plain language, people in control"
        intro="We start with how your business runs today and design automation around it — not the other way round."
        crumbs={[{ label: "How it works", href: "/how-it-works" }]}
      />
      {process && <ProcessSection s={process} />}
      <Section>
        <SectionHeader eyebrow="Jargon-free" heading="The terms, explained simply" />
        <dl className="grid gap-5 md:grid-cols-2">
          {TERMS.map((t) => (
            <div key={t.term} className="card p-6">
              <dt className="font-display text-lg font-bold">{t.term}</dt>
              <dd className="mt-1 text-muted">{t.plain}</dd>
            </div>
          ))}
        </dl>
      </Section>
      {orchestrate && (
        <Section tone="lavender">
          <SectionHeader eyebrow="Architecture" heading="How a supervisor and specialist agents work together" intro="Sequential steps connect in a line; specialists that work at the same time are grouped as parallel." />
          <div className="card p-5 sm:p-8">
            <WorkflowDiagram steps={orchestrate.workflow_json} title="Supervisor agent architecture" scenario="how-it-works-architecture" autoplay />
          </div>
        </Section>
      )}
      <Section>
        <SectionHeader eyebrow="Human oversight" heading="Automation you can trust" intro="Integrations, security, approvals and monitoring are tailored to each client." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OVERSIGHT.map(({ icon: I, title, body }) => (
            <div key={title} className="card p-6">
              <I className="h-6 w-6 text-purple" aria-hidden />
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>
      <FinalCta heading="Ready for step one?" intro="A short discovery conversation is all it takes to get started." cta={{ label: "Book a Consultation", href: "/request-automation" }} />
    </>
  );
}
