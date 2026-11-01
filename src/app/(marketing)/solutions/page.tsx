import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeader } from "@/components/ui/section";
import { Icon } from "@/components/ui/icon";
import { FinalCta } from "@/components/marketing/home/sections";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram";
import { listServices } from "@/lib/content/repo";
import type { Service } from "@/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Solutions — Agents, Teams & End-to-End Automation",
  description: "Explore Zyvilo's AI receptionist, sales, voice and support agents, multi-agent teams and supervisor-led end-to-end automation.",
  alternates: { canonical: "/solutions" },
};

const GROUPS: { key: Service["category"][]; title: string; plain: string }[] = [
  { key: ["agent"], title: "AI Agents", plain: "A digital assistant that handles a task for your business." },
  { key: ["team", "automation"], title: "AI Teams & End-to-End Automation", plain: "A team of AI assistants — or one coordinator assigning work to specialists — running a complete process across your tools." },
  { key: ["capability"], title: "Supporting capabilities", plain: "The connections and reporting that make agents useful in your business." },
];

export default async function SolutionsPage() {
  const services = await listServices();
  const orchestrate = services.find((s) => s.slug === "zyvilo-orchestrate");
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="One AI assistant or an entire AI workforce"
        intro="Built around how your business operates. Start with a single focused assistant, or connect several into a complete automated process with people in control."
        crumbs={[{ label: "Solutions", href: "/solutions" }]}
      />
      {GROUPS.map((g, gi) => {
        const items = services.filter((s) => g.key.includes(s.category));
        if (!items.length) return null;
        return (
          <Section key={g.title} tone={gi % 2 ? "lavender" : "plain"} className="!py-16">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-3xl font-bold">{g.title}</h2>
              <p className="mt-2 text-muted">{g.plain}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <Link key={s.slug} href={`/solutions/${s.slug}`} className="card group flex flex-col p-6 transition hover:-translate-y-1 hover:border-lilac">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-purple to-lilac text-white">
                    <Icon name={s.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{s.name}</h3>
                  <p className="text-sm font-medium text-purple">{s.tagline}</p>
                  <p className="mt-3 flex-1 text-sm text-muted">{s.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-purple">
                    Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </Section>
        );
      })}
      {orchestrate && (
        <Section>
          <SectionHeader
            eyebrow="How a supervisor agent works"
            heading="One coordinator, many specialists"
            intro="A supervisor agent receives a request and assigns parts of it to specialist agents that work in parallel. A person reviews before the final outcome."
          />
          <div className="card p-5 sm:p-8">
            <WorkflowDiagram steps={orchestrate.workflow_json} title="Supervisor and sub-agents example" scenario="solutions-supervisor" autoplay />
          </div>
        </Section>
      )}
      <FinalCta heading="Not sure which solution fits?" intro="Tell us what you'd like to automate and we'll recommend the simplest approach that works." cta={{ label: "Tell Us What You Need", href: "/request-automation" }} />
    </>
  );
}
