"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Lightbulb, TrendingUp, AlertCircle } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { WorkflowDiagram } from "@/components/workflows/workflow-diagram";
import { track } from "@/lib/analytics/track";
import type { Industry } from "@/types";

export function IndustrySelector({ industries }: { industries: Industry[] }) {
  const [slug, setSlug] = useState(industries[0]?.slug);
  const ind = industries.find((i) => i.slug === slug) ?? industries[0];
  if (!ind) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <fieldset>
        <legend className="sr-only">Choose your industry</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {industries.map((i) => (
            <label
              key={i.slug}
              className={clsx(
                "flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-purple",
                i.slug === ind.slug ? "border-purple bg-white text-purple shadow-card" : "border-line bg-white/60 text-navy/80 hover:border-lilac",
              )}
            >
              <input
                type="radio"
                name="industry"
                value={i.slug}
                checked={i.slug === ind.slug}
                onChange={() => {
                  setSlug(i.slug);
                  track("industry_selected", { industry: i.slug });
                }}
                className="sr-only"
              />
              <Icon name={i.icon} className="h-4 w-4 shrink-0" />
              {i.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="card p-5 sm:p-8" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-bold">{ind.name}</h3>
          <Link href={`/industries/${ind.slug}`} className="text-sm font-semibold text-purple hover:underline">
            View {ind.name} page →
          </Link>
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: AlertCircle, t: "Common pain point", d: ind.pain_point },
            { icon: Lightbulb, t: "Sample AI solution", d: ind.sample_solution },
            { icon: TrendingUp, t: "Outcome", d: ind.outcome },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="rounded-2xl bg-lavender/60 p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple">
                <I className="h-4 w-4" aria-hidden /> {t}
              </dt>
              <dd className="mt-2 text-sm text-navy">{d}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8">
          <WorkflowDiagram steps={ind.workflow_json} title={`${ind.name} example workflow`} scenario={`industry-${ind.slug}`} autoplay stepMs={1200} />
        </div>
        <Link
          href={`/request-automation?industry=${encodeURIComponent(ind.slug)}`}
          onClick={() => track("consultation_cta_click", { location: "industry_selector", industry: ind.slug })}
          className="btn-primary mt-8"
        >
          Build This for My Business <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
