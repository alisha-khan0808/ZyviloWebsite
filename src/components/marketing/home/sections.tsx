import Link from "next/link";
import { ArrowRight, Clock, Eye, Link2, ShieldCheck, Zap, X, Check, Quote } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { TrackedLink } from "@/components/ui/tracked-link";
import { AgentMini, AutomationMini, TeamMini } from "@/components/workflows/mini-diagrams";
import type { Faq, HomeSection, Service, Testimonial } from "@/types";

export function ProblemSection({ s }: { s: HomeSection }) {
  return (
    <Section id="problem" aria-labelledby="problem-h">
      <SectionHeader id="problem-h" eyebrow={s.eyebrow} heading={s.heading} intro={s.intro} />
      <div className="grid gap-5 md:grid-cols-3">
        {(s.items ?? []).map((item, i) => {
          const [afterTitle, ...afterBody] = item.body.split(" — ");
          return (
            <Reveal key={item.title} delay={i * 0.08} className="card flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 border-b border-line bg-bg px-6 py-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-50 text-rose-500">
                  <X className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Before</p>
                  <p className="font-semibold text-navy/70 line-through decoration-rose-300">{item.title}</p>
                </div>
              </div>
              <div className="flex flex-1 gap-3 px-6 py-5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple to-lilac text-white">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple">After</p>
                  <p className="font-display text-lg font-bold">{afterTitle}</p>
                  {afterBody.length > 0 && <p className="mt-1 text-sm text-muted">{afterBody.join(" — ")}</p>}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

const CAPABILITIES = [
  {
    title: "AI Agents",
    plain: "One digital assistant handles a focused job for you — like answering enquiries or booking appointments.",
    href: "/solutions/zyvilo-connect",
    Mini: AgentMini,
  },
  {
    title: "AI Teams",
    plain: "A team of specialist assistants work together, each handling the part of the job it's best at.",
    href: "/solutions/zyvilo-teams",
    Mini: TeamMini,
  },
  {
    title: "End-to-End Automation",
    plain: "Agents, your apps and human approvals connected into one complete process that runs on its own.",
    href: "/solutions/zyvilo-orchestrate",
    Mini: AutomationMini,
  },
];

export function CapabilitiesSection({ s }: { s: HomeSection }) {
  return (
    <Section id="capabilities" tone="lavender" aria-labelledby="cap-h">
      <SectionHeader id="cap-h" eyebrow={s.eyebrow} heading={s.heading} intro={s.intro} />
      <div className="grid gap-6 md:grid-cols-3">
        {CAPABILITIES.map(({ title, plain, href, Mini }, i) => (
          <Reveal key={title} delay={i * 0.08} className="card group flex flex-col p-6 transition hover:-translate-y-1 hover:border-lilac">
            <div className="mb-6 grid h-40 place-items-center rounded-2xl bg-gradient-to-br from-lavender to-white grid-dots">
              <Mini />
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-2 flex-1 text-muted">{plain}</p>
            <Link href={href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-purple">
              Explore {title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export function WorkforceSection({ s, services }: { s: HomeSection; services: Service[] }) {
  const flagship = services.filter((x) => x.flagship);
  const extra = services.filter((x) => !x.flagship);
  return (
    <Section id="workforce" aria-labelledby="wf-h">
      <SectionHeader id="wf-h" eyebrow={s.eyebrow} heading={s.heading} intro={s.intro} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {flagship.map((svc, i) => (
          <Reveal key={svc.slug} delay={(i % 3) * 0.06}>
            <Link href={`/solutions/${svc.slug}`} className="card group flex h-full flex-col p-6 transition hover:-translate-y-1 hover:border-lilac">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-purple to-lilac text-white shadow-glow">
                <Icon name={svc.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{svc.name}</h3>
              <p className="text-sm font-medium text-purple">{svc.tagline}</p>
              <p className="mt-3 text-sm text-muted">{svc.summary}</p>
              <p className="mt-4 rounded-xl bg-lavender/70 p-3 text-xs leading-relaxed text-navy/80">
                <span className="font-semibold text-navy">Example: </span>
                {svc.example}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-purple">
                Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
      {extra.length > 0 && (
        <p className="mt-8 text-center text-sm text-muted">
          Also available:{" "}
          {extra.map((x, i) => (
            <span key={x.slug}>
              <Link href={`/solutions/${x.slug}`} className="font-semibold text-navy hover:text-purple">
                {x.name}
              </Link>{" "}
              ({x.tagline.toLowerCase()}){i < extra.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      )}
    </Section>
  );
}

export function ProcessSection({ s }: { s: HomeSection }) {
  return (
    <Section id="process" tone="lavender" aria-labelledby="proc-h">
      <SectionHeader id="proc-h" eyebrow={s.eyebrow} heading={s.heading} intro={s.intro} />
      <ol className="relative grid gap-5 md:grid-cols-4">
        <span className="absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-to-r from-purple/10 via-purple/40 to-purple/10 md:block" aria-hidden />
        {(s.items ?? []).map((item, i) => (
          <li key={item.title} className="relative list-none">
            <Reveal delay={i * 0.08}>
              <span className="relative z-10 grid h-14 w-14 place-items-center rounded-2xl border border-lilac bg-white font-display text-lg font-extrabold text-purple shadow-card">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
      <p className="mx-auto mt-12 max-w-2xl text-center text-sm text-muted">
        We don&apos;t promise fully autonomous handling of sensitive decisions. Where judgement matters, a person on your team stays in the loop.
      </p>
    </Section>
  );
}

const WHY_ICONS = [Zap, Clock, Link2, ShieldCheck, Eye];

export function WhySection({ s }: { s: HomeSection }) {
  return (
    <Section id="why" aria-labelledby="why-h">
      <SectionHeader id="why-h" eyebrow={s.eyebrow} heading={s.heading} intro={s.intro} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {(s.items ?? []).map((item, i) => {
          const I = WHY_ICONS[i % WHY_ICONS.length];
          return (
            <Reveal key={item.title} delay={i * 0.05} className="card p-6">
              <I className="h-6 w-6 text-purple" aria-hidden />
              <h3 className="mt-4 font-bold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

export function TestimonialsSection({ s, items }: { s: HomeSection; items: Testimonial[] }) {
  if (!items.length) return null; // never show placeholder or invented reviews
  return (
    <Section id="testimonials" tone="lavender" aria-labelledby="t-h">
      <SectionHeader id="t-h" eyebrow={s.eyebrow} heading={s.heading} intro={s.intro} />
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.id} className="card p-6">
            <Quote className="h-6 w-6 text-lilac" aria-hidden />
            <blockquote className="mt-3 text-navy">{t.quote}</blockquote>
            <figcaption className="mt-4 text-sm text-muted">
              — {t.attribution}
              {t.company ? `, ${t.company}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-line rounded-3xl border border-line bg-white">
      {faqs.map((f) => (
        <details key={f.id} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg font-semibold text-navy">
            <h3 className="text-base">{f.question}</h3>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lavender text-purple transition group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-3 text-muted">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqSection({ s, faqs }: { s: HomeSection; faqs: Faq[] }) {
  if (!faqs.length) return null;
  return (
    <Section id="faq" aria-labelledby="faq-h">
      <SectionHeader id="faq-h" eyebrow={s.eyebrow} heading={s.heading} intro={s.intro} />
      <FaqList faqs={faqs} />
      <FaqJsonLd faqs={faqs} />
    </Section>
  );
}

export function FaqJsonLd({ faqs }: { faqs: Faq[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function FinalCta({ heading, intro, cta }: { heading: string; intro?: string; cta?: { label: string; href: string } }) {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-navy px-6 py-16 text-center md:px-16 md:py-20">
          <div className="pointer-events-none absolute -left-20 -top-32 h-80 w-80 rounded-full bg-purple/40 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-32 -right-10 h-80 w-80 rounded-full bg-lilac/30 blur-3xl" aria-hidden />
          <h2 className="relative text-3xl font-extrabold text-white md:text-5xl">{heading}</h2>
          {intro && <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/75">{intro}</p>}
          {cta && (
            <TrackedLink href={cta.href} event="consultation_cta_click" props={{ location: "final_cta" }} className="btn-primary relative mt-8 !px-8 !py-4 text-base">
              {cta.label} <ArrowRight className="h-4 w-4" aria-hidden />
            </TrackedLink>
          )}
        </Reveal>
      </div>
    </section>
  );
}
