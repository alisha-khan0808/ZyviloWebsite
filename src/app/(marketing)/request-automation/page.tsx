import type { Metadata } from "next";
import { Clock, Lock, MessageSquare } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { DiscoveryWizard } from "@/components/forms/discovery-wizard";
import { listIndustries } from "@/lib/content/repo";

export const metadata: Metadata = {
  title: "Request an Automation Plan",
  description: "Tell us about your business and what you'd like to automate. We'll map the right AI solution for you.",
  alternates: { canonical: "/request-automation" },
};

// Maps solution pages to the closest "desired solution" option in the form.
const SOLUTION_TYPE: Record<string, string> = {
  "zyvilo-connect": "AI Chat",
  "zyvilo-sales": "Sales/CRM",
  "zyvilo-voice": "Voice",
  "zyvilo-support": "Customer Support",
  "zyvilo-teams": "Multi-Agent",
  "zyvilo-orchestrate": "Supervisor Agent",
  "zyvilo-flow": "Workflow",
  "zyvilo-insights": "Workflow",
};

export default async function RequestAutomationPage({ searchParams }: { searchParams: { industry?: string; solution?: string } }) {
  const industries = await listIndustries();
  const industry = industries.find((i) => i.slug === searchParams.industry)?.name;
  const solutionSlug = typeof searchParams.solution === "string" && SOLUTION_TYPE[searchParams.solution] ? searchParams.solution : undefined;
  return (
    <>
      <PageHero
        eyebrow="Automation brief"
        title="What would you automate first?"
        intro="Answer a few plain-English questions. Only the essentials are required — add as much or as little detail as you like."
        crumbs={[{ label: "Request automation", href: "/request-automation" }]}
      >
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple" aria-hidden /> About 4 minutes
          </li>
          <li className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-purple" aria-hidden /> No technical knowledge needed
          </li>
          <li className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-purple" aria-hidden /> Please don&apos;t include sensitive records
          </li>
        </ul>
      </PageHero>
      <section className="pb-24">
        <div className="container max-w-4xl">
          <DiscoveryWizard
            industries={industries.map((i) => ({ slug: i.slug, name: i.name }))}
            prefill={{ industry, solutionType: solutionSlug ? SOLUTION_TYPE[solutionSlug] : undefined, solutionSlug }}
          />
        </div>
      </section>
    </>
  );
}
