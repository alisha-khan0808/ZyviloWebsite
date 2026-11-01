import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, AlertCircle, Plug, TrendingUp } from "lucide-react";
import { BreadcrumbJsonLd, PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeader } from "@/components/ui/section";
import { Icon } from "@/components/ui/icon";
import { FaqJsonLd, FaqList, FinalCta } from "@/components/marketing/home/sections";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram";
import { getIndustry, listFaqs, listIndustries, listServices } from "@/lib/content/repo";
import { SITE_URL } from "@/lib/config";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await listIndustries()).map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const i = await getIndustry(params.slug);
  if (!i) return {};
  return {
    title: i.seo_json.title || `AI Automation for ${i.name}`,
    description: i.seo_json.description || i.summary,
    alternates: { canonical: `/industries/${i.slug}` },
  };
}

export default async function IndustryPage({ params }: { params: { slug: string } }) {
  const ind = await getIndustry(params.slug);
  if (!ind) notFound();
  const [services, faqs] = await Promise.all([listServices(), listFaqs(`industry:${ind.slug}`)]);
  const solutions = ind.solution_slugs.map((s) => services.find((x) => x.slug === s)).filter(Boolean).slice(0, 4);

  return (
    <>
      <PageHero eyebrow={`Industries · ${ind.name}`} title={ind.seo_json.title || `AI automation for ${ind.name}`} intro={ind.summary} crumbs={[{ label: "Industries", href: "/industries" }, { label: ind.name, href: `/industries/${ind.slug}` }]}>
        <Link href={`/request-automation?industry=${ind.slug}`} className="btn-primary mt-8">
          Build This for My Business <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </PageHero>

      <Section className="!pt-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="card p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <AlertCircle className="h-5 w-5 text-purple" aria-hidden /> Common challenges
            </h2>
            <p className="mt-3 text-navy">{ind.pain_point}</p>
            <ul className="mt-4 space-y-2.5">
              {ind.pain_points_json.map((p) => (
                <li key={p} className="flex gap-3 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lilac" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-7">
            <h2 className="text-xl font-bold">A solution that could help</h2>
            <p className="mt-3 text-muted">{ind.sample_solution}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-lavender/60 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple">
                  <TrendingUp className="h-4 w-4" aria-hidden /> Business outcomes
                </p>
                <ul className="mt-2 space-y-1 text-sm text-navy">
                  {ind.outcomes.map((o) => (
                    <li key={o}>• {o}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-lavender/60 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple">
                  <Plug className="h-4 w-4" aria-hidden /> Suggested integrations
                </p>
                <ul className="mt-2 space-y-1 text-sm text-navy">
                  {ind.integrations.map((o) => (
                    <li key={o}>• {o}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="lavender">
        <SectionHeader eyebrow="Example process" heading={`How it could work for ${ind.name.toLowerCase()}`} align="left" />
        <div className="card p-5 sm:p-8">
          <WorkflowDiagram steps={ind.workflow_json} title={`${ind.name} example workflow`} scenario={`industry-page-${ind.slug}`} autoplay />
          <p className="mt-4 text-xs text-muted">Illustrative example — not a live system. We tailor every workflow to your tools and approvals.</p>
        </div>
      </Section>

      {solutions.length > 0 && (
        <Section>
          <SectionHeader eyebrow="Relevant solutions" heading="Where to start" align="left" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {solutions.map((s) => (
              <Link key={s!.slug} href={`/solutions/${s!.slug}`} className="card group p-6 transition hover:-translate-y-1 hover:border-lilac">
                <Icon name={s!.icon} className="h-6 w-6 text-purple" />
                <h3 className="mt-4 font-bold">{s!.name}</h3>
                <p className="mt-1 text-sm text-muted">{s!.summary}</p>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {faqs.length > 0 && (
        <Section className="!pt-0">
          <SectionHeader eyebrow="FAQ" heading={`${ind.name} questions`} />
          <FaqList faqs={faqs} />
          <FaqJsonLd faqs={faqs} />
        </Section>
      )}

      <FinalCta heading={`Let's map your ${ind.name.toLowerCase()} workflow`} intro="Share how things work today. We'll suggest what to automate first." cta={{ label: "Build This for My Business", href: `/request-automation?industry=${ind.slug}` }} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Industries", url: `${SITE_URL}/industries` },
          { name: ind.name, url: `${SITE_URL}/industries/${ind.slug}` },
        ]}
      />
    </>
  );
}
