import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/ui/section";
import { Icon } from "@/components/ui/icon";
import { IndustrySelector } from "@/components/marketing/home/industry-selector";
import { FinalCta } from "@/components/marketing/home/sections";
import { listIndustries } from "@/lib/content/repo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Automation by Industry",
  description: "See example AI agent workflows for real estate, education, salons, healthcare administration, e-commerce, travel, restaurants, recruitment and more.",
  alternates: { canonical: "/industries" },
};

export default async function IndustriesPage() {
  const industries = await listIndustries();
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="Automation that fits how your industry works"
        intro="Every industry has its own enquiries, bookings and follow-ups. Pick yours to see an example of what an AI assistant could handle."
        crumbs={[{ label: "Industries", href: "/industries" }]}
      />
      <Section className="!pt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((i) => (
            <Link key={i.slug} href={`/industries/${i.slug}`} className="card group flex gap-4 p-5 transition hover:-translate-y-1 hover:border-lilac">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lavender text-purple">
                <Icon name={i.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-bold">{i.name}</span>
                <span className="mt-1 block text-sm text-muted">{i.summary}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-purple">
                  Explore <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <Section tone="lavender">
        <h2 className="mb-8 text-3xl font-bold">Try the interactive example</h2>
        <IndustrySelector industries={industries} />
      </Section>
      <FinalCta heading="What would you automate first?" intro="Tell us about your business. We'll help map the right AI solution." cta={{ label: "Get My Automation Plan", href: "/request-automation" }} />
    </>
  );
}
