"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, Loader2, Pencil, Send } from "lucide-react";
import type { ZodTypeAny } from "zod";
import {
  discoveryStep1,
  discoveryStep2,
  discoveryStep3,
  discoveryStep4,
  discoverySchema,
  fieldErrors,
} from "@/lib/validation/lead";
import {
  BUDGET_RANGES,
  BUSINESS_SIZES,
  CONTACT_PREFERENCES,
  CURRENT_TOOLS,
  PAIN_POINTS,
  SOLUTION_TYPES,
  TIMELINES,
  VOLUME_RANGES,
  YES_NO_UNSURE,
} from "@/lib/validation/options";
import { track } from "@/lib/analytics/track";
import { a11y, ChipGroup, Field, FormError, Honeypot } from "./fields";
import { readAttribution } from "./attribution";
import { newKey, postLead } from "./submit";
import { Turnstile } from "./turnstile";

const DRAFT_KEY = "zy_discovery_draft";

const EMPTY = {
  contact_name: "",
  email: "",
  phone: "",
  company: "",
  website: "",
  industry: "",
  industry_other: "",
  business_size: "",
  country: "",
  solution_types: [] as string[],
  pain_points: [] as string[],
  pain_points_other: "",
  current_process: "",
  desired_outcome: "",
  current_tools: [] as string[],
  current_tools_other: "",
  example_steps: "",
  integrations: "",
  volume_range: "",
  timeline: "",
  budget_range: "",
  api_access: "",
  human_approval: "",
  sensitive_data_flag: "",
  contact_preference: "",
  contact_time: "",
  privacy_consent: false,
  marketing_consent: false,
  preselected_solution: "",
  preselected_industry: "",
};
type Data = typeof EMPTY;

const STEPS: { title: string; short: string; schema: ZodTypeAny; fields: (keyof Data)[] }[] = [
  { title: "About your business", short: "Business", schema: discoveryStep1, fields: ["contact_name", "email", "phone", "company", "website", "industry", "industry_other", "business_size", "country"] },
  { title: "What needs automation?", short: "Needs", schema: discoveryStep2, fields: ["solution_types", "pain_points", "pain_points_other", "current_process", "desired_outcome", "current_tools", "current_tools_other", "example_steps", "integrations"] },
  { title: "Scope and readiness", short: "Scope", schema: discoveryStep3, fields: ["volume_range", "timeline", "budget_range", "api_access", "human_approval", "sensitive_data_flag", "contact_preference", "contact_time"] },
  { title: "Review & submit", short: "Review", schema: discoveryStep4, fields: ["privacy_consent", "marketing_consent"] },
];

interface Props {
  industries: { slug: string; name: string }[];
  prefill: { industry?: string; solutionType?: string; solutionSlug?: string };
}

export function DiscoveryWizard({ industries, prefill }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Data>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hp, setHp] = useState("");
  const [captcha, setCaptcha] = useState<string>();
  const [restored, setRestored] = useState(false);
  const key = useRef<string>("");
  const startedAt = useRef(Date.now());
  const started = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onToken = useCallback((t: string) => setCaptcha(t), []);

  // Restore session draft (session-only; never sent to analytics), then apply URL prefill.
  useEffect(() => {
    let draft: Partial<Data> & { _key?: string; _step?: number } = {};
    try {
      draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}");
    } catch {
      /* ignore */
    }
    key.current = draft._key || newKey();
    const next: Data = { ...EMPTY, ...draft };
    if (prefill.industry && !next.industry) {
      next.industry = prefill.industry;
      next.preselected_industry = prefill.industry;
    }
    if (prefill.solutionType && !next.solution_types.includes(prefill.solutionType)) {
      next.solution_types = [...next.solution_types, prefill.solutionType];
    }
    if (prefill.solutionSlug) next.preselected_solution = prefill.solutionSlug;
    setD(next);
    setStep(Math.min(draft._step ?? 0, 3));
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, _key: key.current, _step: step }));
    } catch {
      /* ignore */
    }
  }, [d, step, restored]);

  const set = <K extends keyof Data>(k: K, val: Data[K]) => {
    if (!started.current) {
      started.current = true;
      track("lead_form_started", { form: "discovery" });
    }
    setD((p) => ({ ...p, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const go = (n: number) => {
    setStep(n);
    setErrors({});
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const validateStep = (i: number) => {
    const s = STEPS[i];
    const res = s.schema.safeParse(d);
    let fe: Record<string, string> = res.success ? {} : fieldErrors(res.error);
    if (i === 0 && d.industry === "Other" && !d.industry_other.trim()) fe = { ...fe, industry_other: "Tell us your industry" };
    setErrors(fe);
    const first = Object.keys(fe)[0];
    if (first) requestAnimationFrame(() => (document.getElementById(first) ?? document.getElementsByName(first)[0])?.focus());
    return !first;
  };

  const next = () => {
    if (!validateStep(step)) return;
    track("lead_form_step_completed", { form: "discovery", step: step + 1 });
    go(step + 1);
  };

  async function submit() {
    if (submitting || !validateStep(3)) return;
    setFormError(null);
    const payload = { ...d, attribution: readAttribution(), idempotency_key: key.current, hp, started_at: startedAt.current, captcha_token: captcha };
    const parsed = discoverySchema.safeParse(payload);
    if (!parsed.success) {
      const fe = fieldErrors(parsed.error);
      setErrors(fe);
      const target = STEPS.findIndex((s) => s.fields.some((f) => fe[f]));
      if (target >= 0 && target !== step) setStep(target);
      setFormError("Some answers need attention.");
      return;
    }
    setSubmitting(true);
    const res = await postLead("/api/leads/discovery", payload);
    if (res.ok) {
      track("lead_form_submitted", { form: "discovery" });
      sessionStorage.removeItem(DRAFT_KEY);
      router.push(`/thank-you?ref=${encodeURIComponent(res.reference)}`);
      return;
    }
    setSubmitting(false);
    setFormError(res.error);
    if (res.fields) {
      setErrors(res.fields);
      const target = STEPS.findIndex((s) => s.fields.some((f) => res.fields![f]));
      if (target >= 0) setStep(target);
    }
  }

  const industryOptions = [...industries.map((i) => i.name).filter((n) => n !== "Other"), "Other"];

  return (
    <div className="card relative overflow-hidden">
      {/* Progress */}
      <div className="border-b border-line bg-bg/60 px-5 py-5 sm:px-8">
        <ol className="flex items-center gap-2" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s.short} className="flex flex-1 items-center gap-2">
              <span
                aria-current={i === step ? "step" : undefined}
                className={clsx(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition",
                  i < step ? "bg-purple text-white" : i === step ? "bg-white text-purple ring-2 ring-purple" : "bg-lavender text-muted",
                )}
              >
                {i < step ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                <span className="sr-only">
                  {s.title} — {i < step ? "complete" : i === step ? "current step" : "not started"}
                </span>
              </span>
              <span className={clsx("hidden text-sm font-medium sm:inline", i === step ? "text-navy" : "text-muted")}>{s.short}</span>
              {i < STEPS.length - 1 && <span className={clsx("h-0.5 flex-1 rounded", i < step ? "bg-purple" : "bg-line")} aria-hidden />}
            </li>
          ))}
        </ol>
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 3) next();
          else submit();
        }}
        className="relative space-y-6 p-5 sm:p-8"
      >
        <Honeypot value={hp} onChange={setHp} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple">Step {step + 1} of 4</p>
          <h2 ref={headingRef} tabIndex={-1} className="mt-1 scroll-mt-28 text-2xl font-bold outline-none">
            {STEPS[step].title}
          </h2>
        </div>

        {step === 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="contact_name" label="Contact name" required error={errors.contact_name}>
              <input className="input" autoComplete="name" value={d.contact_name} onChange={(e) => set("contact_name", e.target.value)} {...a11y("contact_name", errors.contact_name, undefined, true)} />
            </Field>
            <Field id="email" label="Work email" required error={errors.email}>
              <input className="input" type="email" autoComplete="email" value={d.email} onChange={(e) => set("email", e.target.value)} {...a11y("email", errors.email, undefined, true)} />
            </Field>
            <Field id="phone" label="Phone / WhatsApp" error={errors.phone}>
              <input className="input" type="tel" autoComplete="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} {...a11y("phone", errors.phone)} />
            </Field>
            <Field id="company" label="Company / business name" required error={errors.company}>
              <input className="input" autoComplete="organization" value={d.company} onChange={(e) => set("company", e.target.value)} {...a11y("company", errors.company, undefined, true)} />
            </Field>
            <Field id="website" label="Website" error={errors.website}>
              <input className="input" inputMode="url" autoComplete="url" placeholder="example.com" value={d.website} onChange={(e) => set("website", e.target.value)} {...a11y("website", errors.website)} />
            </Field>
            <Field id="industry" label="Industry" required error={errors.industry}>
              <select className="input" value={d.industry} onChange={(e) => set("industry", e.target.value)} {...a11y("industry", errors.industry, undefined, true)}>
                <option value="">Select…</option>
                {industryOptions.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </Field>
            {d.industry === "Other" && (
              <Field id="industry_other" label="Your industry" required error={errors.industry_other}>
                <input className="input" value={d.industry_other} onChange={(e) => set("industry_other", e.target.value)} {...a11y("industry_other", errors.industry_other, undefined, true)} />
              </Field>
            )}
            <Field id="business_size" label="Business size" error={errors.business_size}>
              <select className="input" value={d.business_size} onChange={(e) => set("business_size", e.target.value)} {...a11y("business_size", errors.business_size)}>
                <option value="">Select…</option>
                {BUSINESS_SIZES.map((i) => (
                  <option key={i} value={i}>{i} people</option>
                ))}
              </select>
            </Field>
            <Field id="country" label="Country / region" error={errors.country}>
              <input className="input" autoComplete="country-name" value={d.country} onChange={(e) => set("country", e.target.value)} {...a11y("country", errors.country)} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <ChipGroup name="solution_types" legend="What kind of help are you looking for?" hint="Choose any that apply." options={SOLUTION_TYPES} value={d.solution_types} onChange={(v) => set("solution_types", v as string[])} multiple required error={errors.solution_types} />
            <ChipGroup name="pain_points" legend="Current pain points" options={PAIN_POINTS} value={d.pain_points} onChange={(v) => set("pain_points", v as string[])} multiple error={errors.pain_points} />
            {d.pain_points.includes("Other") && (
              <Field id="pain_points_other" label="Other pain point" error={errors.pain_points_other}>
                <input className="input" value={d.pain_points_other} onChange={(e) => set("pain_points_other", e.target.value)} {...a11y("pain_points_other", errors.pain_points_other)} />
              </Field>
            )}
            <Field id="current_process" label="How does this work today?" required error={errors.current_process} hint="Describe the steps in your own words — no technical detail needed.">
              <textarea className="input min-h-[120px]" value={d.current_process} onChange={(e) => set("current_process", e.target.value)} placeholder="e.g. Customers message us on WhatsApp, a receptionist replies when free, then enters the booking in our calendar by hand." {...a11y("current_process", errors.current_process, "Describe the steps in your own words — no technical detail needed.", true)} />
            </Field>
            <Field id="desired_outcome" label="What would you like to happen instead?" required error={errors.desired_outcome}>
              <textarea className="input min-h-[100px]" value={d.desired_outcome} onChange={(e) => set("desired_outcome", e.target.value)} placeholder="e.g. Every message gets an instant reply and bookings go straight into the calendar." {...a11y("desired_outcome", errors.desired_outcome, undefined, true)} />
            </Field>
            <ChipGroup name="current_tools" legend="Tools you use today" options={CURRENT_TOOLS} value={d.current_tools} onChange={(v) => set("current_tools", v as string[])} multiple />
            {(d.current_tools.includes("Other") || d.current_tools.length > 0) && (
              <Field id="current_tools_other" label="Tool names" hint="e.g. HubSpot, Google Calendar, Shopify" error={errors.current_tools_other}>
                <input className="input" value={d.current_tools_other} onChange={(e) => set("current_tools_other", e.target.value)} {...a11y("current_tools_other", errors.current_tools_other, "e.g. HubSpot, Google Calendar, Shopify")} />
              </Field>
            )}
            <details className="rounded-2xl border border-line p-4">
              <summary className="cursor-pointer text-sm font-semibold text-navy">Add example steps or integrations (optional)</summary>
              <div className="mt-4 space-y-5">
                <Field id="example_steps" label="Example process steps" error={errors.example_steps}>
                  <textarea className="input min-h-[90px]" value={d.example_steps} onChange={(e) => set("example_steps", e.target.value)} placeholder="1. Enquiry arrives  2. Check availability  3. Book  4. Send reminder" {...a11y("example_steps", errors.example_steps)} />
                </Field>
                <Field id="integrations" label="Integrations you'd need" error={errors.integrations}>
                  <input className="input" value={d.integrations} onChange={(e) => set("integrations", e.target.value)} {...a11y("integrations", errors.integrations)} />
                </Field>
              </div>
            </details>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <ChipGroup name="timeline" legend="When would you like to start?" options={TIMELINES} value={d.timeline} onChange={(v) => set("timeline", v as string)} required error={errors.timeline} />
            <ChipGroup name="volume_range" legend="Roughly how many requests, calls or messages?" options={VOLUME_RANGES} value={d.volume_range} onChange={(v) => set("volume_range", v as string)} />
            <ChipGroup name="budget_range" legend="Budget range" options={BUDGET_RANGES} value={d.budget_range} onChange={(v) => set("budget_range", v as string)} />
            <div className="grid gap-6 md:grid-cols-3">
              <ChipGroup name="api_access" legend="Do your systems have API access?" options={YES_NO_UNSURE} value={d.api_access} onChange={(v) => set("api_access", v as string)} />
              <ChipGroup name="human_approval" legend="Need human approval steps?" options={YES_NO_UNSURE} value={d.human_approval} onChange={(v) => set("human_approval", v as string)} />
              <ChipGroup name="sensitive_data_flag" legend="Sensitive customer data involved?" hint="Just yes/no — please don't share any actual records." options={YES_NO_UNSURE} value={d.sensitive_data_flag} onChange={(v) => set("sensitive_data_flag", v as string)} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <ChipGroup name="contact_preference" legend="Preferred contact method" options={CONTACT_PREFERENCES} value={d.contact_preference} onChange={(v) => set("contact_preference", v as string)} />
              <Field id="contact_time" label="Best time to reach you" error={errors.contact_time}>
                <input className="input" placeholder="e.g. Weekdays after 2pm GMT" value={d.contact_time} onChange={(e) => set("contact_time", e.target.value)} {...a11y("contact_time", errors.contact_time)} />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Review d={d} onEdit={go} />
            <div className="space-y-3 rounded-2xl bg-lavender/50 p-4">
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-purple" checked={d.privacy_consent} onChange={(e) => set("privacy_consent", e.target.checked)} {...a11y("privacy_consent", errors.privacy_consent, undefined, true)} />
                <span>
                  I agree that Zyvilo may use these details to respond to my request, as described in the{" "}
                  <Link href="/privacy" target="_blank" className="text-purple underline">privacy notice</Link>. <span className="text-purple">*</span>
                </span>
              </label>
              {errors.privacy_consent && <p id="privacy_consent-error" role="alert" className="text-xs font-medium text-red-600">{errors.privacy_consent}</p>}
              <label className="flex items-start gap-3 text-sm text-muted">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-purple" checked={d.marketing_consent} onChange={(e) => set("marketing_consent", e.target.checked)} />
                <span>Send me occasional updates about Zyvilo (optional — unsubscribe any time).</span>
              </label>
            </div>
            <Turnstile onToken={onToken} />
          </div>
        )}

        <FormError message={formError} />

        <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
          {step > 0 ? (
            <button type="button" className="btn-secondary" onClick={() => go(step - 1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </button>
          ) : (
            <span className="hidden text-xs text-muted sm:block sm:self-center">Your answers are saved in this browser tab until you submit.</span>
          )}
          {step < 3 ? (
            <button type="submit" className="btn-primary">
              Continue <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
              {submitting ? "Submitting…" : "Submit my automation brief"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Review({ d, onEdit }: { d: Data; onEdit: (step: number) => void }) {
  const rows: { step: number; title: string; items: [string, string | string[]][] }[] = [
    {
      step: 0,
      title: "About your business",
      items: [
        ["Name", d.contact_name],
        ["Email", d.email],
        ["Phone", d.phone],
        ["Company", d.company],
        ["Website", d.website],
        ["Industry", d.industry === "Other" ? `Other — ${d.industry_other}` : d.industry],
        ["Size", d.business_size],
        ["Country", d.country],
      ],
    },
    {
      step: 1,
      title: "What needs automation",
      items: [
        ["Solutions", d.solution_types],
        ["Pain points", [...d.pain_points.filter((p) => p !== "Other"), ...(d.pain_points_other ? [d.pain_points_other] : [])]],
        ["Today", d.current_process],
        ["Desired outcome", d.desired_outcome],
        ["Tools", [...d.current_tools, ...(d.current_tools_other ? [d.current_tools_other] : [])]],
        ["Example steps", d.example_steps],
        ["Integrations", d.integrations],
      ],
    },
    {
      step: 2,
      title: "Scope and readiness",
      items: [
        ["Timeline", d.timeline],
        ["Volume", d.volume_range],
        ["Budget", d.budget_range],
        ["API access", d.api_access],
        ["Human approval", d.human_approval],
        ["Sensitive data", d.sensitive_data_flag],
        ["Contact via", d.contact_preference],
        ["Best time", d.contact_time],
      ],
    },
  ];
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <section key={r.title} className="rounded-2xl border border-line p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">{r.title}</h3>
            <button type="button" onClick={() => onEdit(r.step)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-purple hover:bg-lavender">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit <span className="sr-only">{r.title}</span>
            </button>
          </div>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[140px_1fr]">
            {r.items
              .filter(([, v]) => (Array.isArray(v) ? v.length : v))
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="whitespace-pre-line break-words text-navy">{Array.isArray(v) ? v.join(", ") : v}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
