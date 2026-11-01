"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { saveSiteSettingsAction } from "@/lib/cms/actions";
import type { Cta, SiteSettings } from "@/types";

const NL = String.fromCharCode(10);
const linksToText = (l: Cta[]) => l.map((x) => `${x.label} | ${x.href}`).join(NL);
const textToLinks = (t: string): Cta[] =>
  t
    .split(NL)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, href = ""] = l.split("|").map((s) => s.trim());
      return { label, href };
    });

const footerToText = (cols: SiteSettings["footerColumns"]) => cols.map((c) => `## ${c.title}${NL}${linksToText(c.links)}`).join(NL + NL);
function textToFooter(t: string): SiteSettings["footerColumns"] {
  const cols: SiteSettings["footerColumns"] = [];
  for (const line of t.split(NL)) {
    const l = line.trim();
    if (!l) continue;
    if (l.startsWith("## ")) cols.push({ title: l.slice(3).trim(), links: [] });
    else if (cols.length) cols[cols.length - 1].links.push(...textToLinks(l));
  }
  return cols;
}

export function SiteSettingsForm({ initial }: { initial: SiteSettings }) {
  const [s, setS] = useState(initial);
  const [nav, setNav] = useState(linksToText(initial.headerNav));
  const [social, setSocial] = useState(linksToText(initial.social));
  const [footer, setFooter] = useState(footerToText(initial.footerColumns));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof SiteSettings, v: unknown) => setS((p) => ({ ...p, [k]: v }));

  const save = () =>
    start(async () => {
      const r = await saveSiteSettingsAction({ ...s, headerNav: textToLinks(nav), social: textToLinks(social), footerColumns: textToFooter(footer) });
      setMsg(r.ok ? { ok: true, text: "Saved and published." } : { ok: false, text: r.error ?? "Failed" });
    });

  const input = (label: string, k: "name" | "tagline" | "contactEmail" | "phone" | "address" | "bookingUrl", hint?: string) => (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" value={s[k]} onChange={(e) => set(k, e.target.value)} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6 md:grid-cols-2">
        <h2 className="text-lg font-bold md:col-span-2">Brand & contact</h2>
        {input("Site name", "name")}
        {input("Tagline", "tagline")}
        {input("Public contact email", "contactEmail")}
        {input("Phone", "phone")}
        {input("Address", "address")}
        {input("Consultation booking link", "bookingUrl", "Optional https:// link (e.g. Calendly). Shown on contact and thank-you pages.")}
      </section>
      <section className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6 md:grid-cols-2">
        <h2 className="text-lg font-bold md:col-span-2">Navigation & footer</h2>
        <label className="block">
          <span className="label">Header navigation</span>
          <textarea className="input min-h-[140px] font-mono text-xs" value={nav} onChange={(e) => setNav(e.target.value)} />
          <span className="mt-1 block text-xs text-muted">“Label | /path” per line</span>
        </label>
        <label className="block">
          <span className="label">Social links</span>
          <textarea className="input min-h-[140px] font-mono text-xs" value={social} onChange={(e) => setSocial(e.target.value)} />
          <span className="mt-1 block text-xs text-muted">“Label | https://…” per line</span>
        </label>
        <label className="block md:col-span-2">
          <span className="label">Footer columns</span>
          <textarea className="input min-h-[260px] font-mono text-xs" value={footer} onChange={(e) => setFooter(e.target.value)} />
          <span className="mt-1 block text-xs text-muted">Start each column with “## Title”, then “Label | /path” lines.</span>
        </label>
      </section>
      <section className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="text-lg font-bold">Default SEO</h2>
        <label className="block">
          <span className="label">Homepage title</span>
          <input className="input" value={s.seo.defaultTitle} onChange={(e) => set("seo", { ...s.seo, defaultTitle: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Homepage description</span>
          <textarea className="input" value={s.seo.defaultDescription} onChange={(e) => set("seo", { ...s.seo, defaultDescription: e.target.value })} />
        </label>
      </section>
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save & publish
        </button>
        {msg && <p role="status" className={clsx("text-sm", msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p>}
      </div>
    </div>
  );
}
