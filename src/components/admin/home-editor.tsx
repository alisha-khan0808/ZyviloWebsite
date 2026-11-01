"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2 } from "lucide-react";
import { discardHomeDraftAction, publishHomeAction, saveHomeDraftAction } from "@/lib/cms/actions";
import type { HomeContent, HomeSection } from "@/types";

const SECTION_NAMES: Record<string, string> = {
  problem: "Problem → Outcome",
  capabilities: "Three core capabilities",
  demo: "See it work (interactive demo)",
  workforce: "Meet your AI workforce",
  industries: "Solutions by industry",
  process: "How Zyvilo works",
  why: "Why Zyvilo",
  testimonials: "Testimonials (only shows if any are published)",
  faq: "FAQ",
  final: "Final call to action",
};
const HAS_ITEMS = new Set(["problem", "process", "why"]);
const NL = String.fromCharCode(10);

export function HomeEditor({ initial }: { initial: HomeContent }) {
  const router = useRouter();
  const [c, setC] = useState<HomeContent>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const hero = (k: keyof HomeContent["hero"], v: unknown) => setC((p) => ({ ...p, hero: { ...p.hero, [k]: v } }));
  const sec = (i: number, patch: Partial<HomeSection>) => setC((p) => ({ ...p, sections: p.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const move = (i: number, d: number) =>
    setC((p) => {
      const s = [...p.sections];
      [s[i], s[i + d]] = [s[i + d], s[i]];
      return { ...p, sections: s };
    });

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: okText } : { ok: false, text: r.error ?? "Failed" });
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-bold">Hero</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Text label="Eyebrow" value={c.hero.eyebrow} onChange={(v) => hero("eyebrow", v)} />
          <Text label="Headline" value={c.hero.headline} onChange={(v) => hero("headline", v)} hint='Text after the first ". " is shown in the brand gradient.' />
          <Text label="Subheading" value={c.hero.subheading} onChange={(v) => hero("subheading", v)} area className="md:col-span-2" />
          <Text label="Primary CTA label" value={c.hero.primaryCta.label} onChange={(v) => hero("primaryCta", { ...c.hero.primaryCta, label: v })} />
          <Text label="Primary CTA link" value={c.hero.primaryCta.href} onChange={(v) => hero("primaryCta", { ...c.hero.primaryCta, href: v })} />
          <Text label="Secondary CTA label" value={c.hero.secondaryCta.label} onChange={(v) => hero("secondaryCta", { ...c.hero.secondaryCta, label: v })} />
          <Text label="Secondary CTA link" value={c.hero.secondaryCta.href} onChange={(v) => hero("secondaryCta", { ...c.hero.secondaryCta, href: v })} />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Sections</h2>
        <p className="mb-4 text-sm text-muted">Reorder, hide or edit the copy of each predefined section.</p>
        <ol className="space-y-3">
          {c.sections.map((s, i) => (
            <li key={s.id} className={clsx("rounded-xl border p-4", s.visible ? "border-line" : "border-dashed border-line bg-bg opacity-80")}>
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="font-semibold">
                    {i + 1}. {SECTION_NAMES[s.id]}
                    {!s.visible && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">Hidden</span>}
                  </span>
                  <span className="flex gap-1" onClick={(e) => e.preventDefault()}>
                    <button type="button" className="btn-ghost !p-2" aria-label={s.visible ? "Hide section" : "Show section"} onClick={() => sec(i, { visible: !s.visible })}>
                      {s.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button type="button" className="btn-ghost !p-2" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" className="btn-ghost !p-2" aria-label="Move down" disabled={i === c.sections.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></button>
                  </span>
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {s.id !== "final" && <Text label="Eyebrow" value={s.eyebrow ?? ""} onChange={(v) => sec(i, { eyebrow: v })} />}
                  <Text label="Heading" value={s.heading} onChange={(v) => sec(i, { heading: v })} />
                  <Text label="Intro" value={s.intro ?? ""} onChange={(v) => sec(i, { intro: v })} area className="md:col-span-2" />
                  {HAS_ITEMS.has(s.id) && (
                    <Items
                      value={s.items ?? []}
                      onChange={(items) => sec(i, { items })}
                      hint={s.id === "problem" ? "Title = the 'before' problem. Body = 'After headline — explanation'." : "Title | Body, one per line"}
                    />
                  )}
                  {s.id === "final" && (
                    <>
                      <Text label="CTA label" value={s.cta?.label ?? ""} onChange={(v) => sec(i, { cta: { href: s.cta?.href ?? "/request-automation", label: v } })} />
                      <Text label="CTA link" value={s.cta?.href ?? ""} onChange={(v) => sec(i, { cta: { label: s.cta?.label ?? "", href: v } })} />
                    </>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white/95 p-4 shadow-card backdrop-blur">
        <button className="btn-secondary !py-2" disabled={pending} onClick={() => act(() => saveHomeDraftAction(c), "Draft saved.")}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save draft
        </button>
        <button
          className="btn-secondary !py-2"
          disabled={pending}
          onClick={() => act(() => saveHomeDraftAction(c), "Draft saved — opening preview.", () => window.open("/api/preview?path=/", "_blank"))}
        >
          <Eye className="h-4 w-4" aria-hidden /> Save & preview
        </button>
        <button className="btn-primary !py-2" disabled={pending} onClick={() => act(() => publishHomeAction(c), "Published — the live homepage is updated.")}>
          Publish
        </button>
        <button
          className="btn-ghost !py-2 text-muted"
          disabled={pending}
          onClick={() => {
            if (confirm("Discard draft changes and revert to the published version?")) act(() => discardHomeDraftAction(), "Draft discarded.", () => window.location.reload());
          }}
        >
          Discard draft
        </button>
        {msg && <p role="status" className={clsx("text-sm", msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p>}
      </div>
    </div>
  );
}

function Text({ label, value, onChange, area, hint, className }: { label: string; value: string; onChange: (v: string) => void; area?: boolean; hint?: string; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      <span className="label">{label}</span>
      {area ? (
        <textarea className="input min-h-[80px]" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Items({ value, onChange, hint }: { value: { title: string; body: string }[]; onChange: (v: { title: string; body: string }[]) => void; hint: string }) {
  const [text, setText] = useState(value.map((i) => `${i.title} | ${i.body}`).join(NL));
  return (
    <label className="block md:col-span-2">
      <span className="label">Items</span>
      <textarea
        className="input min-h-[120px] font-mono text-xs"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(
            e.target.value
              .split(NL)
              .map((l) => l.trim())
              .filter(Boolean)
              .map((l) => {
                const [title, ...rest] = l.split("|");
                return { title: title.trim(), body: rest.join("|").trim() };
              }),
          );
        }}
      />
      <span className="mt-1 block text-xs text-muted">One per line as “Title | Body”. {hint}</span>
    </label>
  );
}
