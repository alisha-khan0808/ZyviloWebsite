import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, AlertCircle, Plug, Briefcase } from "lucide-react";
import { BreadcrumbJsonLd, PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeader } from "@/components/ui/section";
import { FaqList, FaqJsonLd, FinalCta } from "@/components/marketing/home/sections";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram";
import { ViewTracker } from "@/components/marketing/view-tracker";
import { getService, listFaqs, listIndustries, listServices } from "@/lib/content/repo";
import { SITE_URL } from "@/lib/config";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listServices()).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getService(params.slug);
  if (!s) return {};
  return {
    title: s.seo_json.title || s.name,
    description: s.seo_json.description || s.summary,
    alternates: { canonical: `/solutions/${s.slug}` },
  };
}

export default async function SolutionPage({ params }: { params: { slug: string } }) {
  const s = await getService(params.slug);
  if (!s) notFound();
  const [faqs, industries] = await Promise.all([listFaqs(`service:${s.slug}`), listIndustries()]);
  const relevant = industries.filter((i) => i.solution_slugs.includes(s.slug)).slice(0, 6);

  return (
    <>
      <ViewTracker event="solution_viewed" props={{ solution: s.slug }} />
      <PageHero eyebrow={`${s.name} · ${s.tagline}`} title={s.seo_json.title || s.name} intro={s.summary} crumbs={[{ label: "Solutions", href: "/solutions" }, { label: s.name, href: `/solutions/${s.slug}` }]}>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={`/request-automation?solution=${s.slug}`} className="btn-primary">
            Build This for My Business <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <a href="#how-it-works" className="btn-secondary">See how it works</a>
        </div>
      </PageHero>

      <Section id="how-it-works" className="!pt-6">
        <SectionHeader eyebrow="How it works" heading="An example workflow" intro={s.body} align="left" />
        <div className="card p-5 sm:p-8">
          <WorkflowDiagram steps={s.workflow_json} title={`${s.name} example workflow`} scenario={`solution-${s.slug}`} autoplay />
          <p className="mt-4 text-xs text-muted">Illustrative example — each workflow is tailored to your tools and process.</p>
        </div>
      </Section>

      <Section tone="lavender">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <AlertCircle className="h-5 w-5 text-purple" aria-hidden /> Problems it solves
            </h2>
            <ul className="mt-4 space-y-3">
              {s.problems.map((p) => (
                <li key={p} className="flex gap-3 text-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lilac" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <CheckCircle2 className="h-5 w-5 text-purple" aria-hidden /> What it can do
            </h2>
            <ul className="mt-4 space-y-3">
              {s.capabilities.map((c) => (
                <li key={c} className="flex gap-3 text-navy">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-purple" aria-hidden /> {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Briefcase className="h-5 w-5 text-purple" aria-hidden /> Example scenarios
            </h2>
            <ul className="mt-4 space-y-3 text-muted">
              {s.scenarios.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
            <p className="mt-5 rounded-xl bg-lavender/70 p-4 text-sm text-navy">
              <strong>For example: </strong>
              {s.example}
            </p>
          </div>
          <div className="card p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Plug className="h-5 w-5 text-purple" aria-hidden /> Typical integrations
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {s.integrations.map((x) => (
                <li key={x} className="rounded-full border border-line bg-bg px-3 py-1.5 text-sm text-navy">{x}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              Integrations depend on the tools you use and their available APIs. We confirm what&apos;s possible during discovery.
            </p>
          </div>
        </div>
      </Section>

      {relevant.length > 0 && (
        <Section className="!py-16">
          <h2 className="text-2xl font-bold">Popular in</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {relevant.map((i) => (
              <li key={i.slug}>
                <Link href={`/industries/${i.slug}`} className="inline-block rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-purple hover:text-purple">
                  {i.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {faqs.length > 0 && (
        <Section className="!pt-0">
          <SectionHeader eyebrow="FAQ" heading={`${s.name} questions`} />
          <FaqList faqs={faqs} />
          <FaqJsonLd faqs={faqs} />
        </Section>
      )}

      <FinalCta heading={`Ready to explore ${s.name}?`} intro="Tell us about your business and we'll map how this could work for you." cta={{ label: "Build This for My Business", href: `/request-automation?solution=${s.slug}` }} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Solutions", url: `${SITE_URL}/solutions` },
          { name: s.name, url: `${SITE_URL}/solutions/${s.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.name,
            description: s.summary,
            provider: { "@type": "Organization", name: "Zyvilo", url: SITE_URL },
            serviceType: s.tagline,
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
