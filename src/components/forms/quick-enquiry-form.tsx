"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { quickEnquirySchema, fieldErrors } from "@/lib/validation/lead";
import { track } from "@/lib/analytics/track";
import { a11y, Field, FormError, Honeypot } from "./fields";
import { readAttribution } from "./attribution";
import { newKey, postLead } from "./submit";
import { Turnstile } from "./turnstile";

interface Props {
  industries: string[];
  services: string[];
}

export function QuickEnquiryForm({ industries, services }: Props) {
  const router = useRouter();
  const [v, setV] = useState({
    contact_name: "",
    email: "",
    phone: "",
    company: "",
    industry: "",
    service_interest: "",
    message: "",
    privacy_consent: false,
    marketing_consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hp, setHp] = useState("");
  const [captcha, setCaptcha] = useState<string>();
  const key = useRef(newKey());
  const startedAt = useRef(Date.now());
  const started = useRef(false);
  const onToken = useCallback((t: string) => setCaptcha(t), []);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => {
    if (!started.current) {
      started.current = true;
      track("lead_form_started", { form: "quick" });
    }
    setV((p) => ({ ...p, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    const payload = {
      ...v,
      attribution: readAttribution(),
      idempotency_key: key.current,
      hp,
      started_at: startedAt.current,
      captcha_token: captcha,
    };
    const parsed = quickEnquirySchema.safeParse(payload);
    if (!parsed.success) {
      const fe = fieldErrors(parsed.error);
      setErrors(fe);
      document.getElementById(Object.keys(fe)[0])?.focus();
      return;
    }
    setSubmitting(true);
    const res = await postLead("/api/leads/quick", payload);
    if (res.ok) {
      track("lead_form_submitted", { form: "quick" });
      router.push(`/thank-you?ref=${encodeURIComponent(res.reference)}`);
      return;
    }
    setSubmitting(false);
    setFormError(res.error);
    if (res.fields) setErrors(res.fields);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-5">
      <Honeypot value={hp} onChange={setHp} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact_name" label="Your name" required error={errors.contact_name}>
          <input className="input" autoComplete="name" value={v.contact_name} onChange={(e) => set("contact_name", e.target.value)} {...a11y("contact_name", errors.contact_name, undefined, true)} />
        </Field>
        <Field id="company" label="Company" error={errors.company}>
          <input className="input" autoComplete="organization" value={v.company} onChange={(e) => set("company", e.target.value)} {...a11y("company", errors.company)} />
        </Field>
        <Field id="email" label="Business email" error={errors.email} hint="Email or phone — at least one is required.">
          <input className="input" type="email" autoComplete="email" value={v.email} onChange={(e) => set("email", e.target.value)} {...a11y("email", errors.email, "Email or phone — at least one is required.")} />
        </Field>
        <Field id="phone" label="Phone / WhatsApp" error={errors.phone}>
          <input className="input" type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set("phone", e.target.value)} {...a11y("phone", errors.phone)} />
        </Field>
        <Field id="industry" label="Industry" error={errors.industry}>
          <select className="input" value={v.industry} onChange={(e) => set("industry", e.target.value)} {...a11y("industry", errors.industry)}>
            <option value="">Select…</option>
            {industries.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Field>
        <Field id="service_interest" label="Interested in" error={errors.service_interest}>
          <select className="input" value={v.service_interest} onChange={(e) => set("service_interest", e.target.value)} {...a11y("service_interest", errors.service_interest)}>
            <option value="">Not sure yet</option>
            {services.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field id="message" label="How can we help?" required error={errors.message}>
        <textarea className="input min-h-[140px]" value={v.message} onChange={(e) => set("message", e.target.value)} placeholder="e.g. We miss WhatsApp enquiries after 7pm and want them answered and booked automatically." {...a11y("message", errors.message, undefined, true)} />
      </Field>
      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-purple" checked={v.privacy_consent} onChange={(e) => set("privacy_consent", e.target.checked)} {...a11y("privacy_consent", errors.privacy_consent, undefined, true)} />
          <span>
            I agree that Zyvilo may use these details to respond to my enquiry, as described in the{" "}
            <Link href="/privacy" className="text-purple underline" target="_blank">privacy notice</Link>. <span className="text-purple">*</span>
          </span>
        </label>
        {errors.privacy_consent && <p id="privacy_consent-error" role="alert" className="text-xs font-medium text-red-600">{errors.privacy_consent}</p>}
        <label className="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-purple" checked={v.marketing_consent} onChange={(e) => set("marketing_consent", e.target.checked)} />
          <span>Send me occasional updates about Zyvilo (optional — unsubscribe any time).</span>
        </label>
      </div>
      <Turnstile onToken={onToken} />
      <FormError message={formError} />
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        {submitting ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
