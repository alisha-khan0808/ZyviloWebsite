import { randomBytes } from "node:crypto";
import type { z } from "zod";
import { PRIVACY_CONSENT_VERSION } from "@/lib/config";
import type { NewLead, NewRequirements } from "@/lib/data/store";
import type { discoverySchema, quickEnquirySchema } from "@/lib/validation/lead";

type Quick = z.output<typeof quickEnquirySchema>;
type Discovery = z.output<typeof discoverySchema>;
type Attribution = Quick["attribution"];

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** Non-guessable, human-friendly reference: ZY-XXXX-XXXX-XX (~50 bits). */
export function referenceCode() {
  const bytes = randomBytes(10);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `ZY-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 10)}`;
}

export function deriveSource(a: Attribution): string {
  if (a.utm_source) return a.utm_source.toLowerCase();
  if (a.referrer) {
    try {
      const host = new URL(a.referrer).hostname.replace(/^www\./, "");
      return host || "referral";
    } catch {
      return "referral";
    }
  }
  return "direct";
}

function base(a: Attribution, now: string) {
  return {
    reference_code: referenceCode(),
    status: "new" as const,
    owner_id: null,
    priority: "medium" as const,
    qualification_score: null,
    next_contact_at: null,
    first_contacted_at: null,
    source: deriveSource(a),
    source_page: a.source_page ?? null,
    referrer: a.referrer ?? null,
    utm_source: a.utm_source ?? null,
    utm_medium: a.utm_medium ?? null,
    utm_campaign: a.utm_campaign ?? null,
    utm_term: a.utm_term ?? null,
    utm_content: a.utm_content ?? null,
    privacy_consent_at: now,
    privacy_consent_version: PRIVACY_CONSENT_VERSION,
  };
}

export function buildQuickLead(d: Quick, now = new Date().toISOString()): { lead: NewLead; requirements: null } {
  return {
    lead: {
      ...base(d.attribution, now),
      idempotency_key: d.idempotency_key,
      form_type: "quick",
      contact_name: d.contact_name,
      email: d.email || null,
      phone: d.phone || null,
      company: d.company,
      website: null,
      industry: d.industry,
      industry_other: null,
      country: null,
      message: d.message,
      service_interest: d.service_interest,
      marketing_consent: d.marketing_consent,
    },
    requirements: null,
  };
}

export function buildDiscoveryLead(d: Discovery, now = new Date().toISOString()): { lead: NewLead; requirements: NewRequirements } {
  return {
    lead: {
      ...base(d.attribution, now),
      idempotency_key: d.idempotency_key,
      form_type: "discovery",
      contact_name: d.contact_name,
      email: d.email,
      phone: d.phone || null,
      company: d.company,
      website: d.website,
      industry: d.industry,
      industry_other: d.industry === "Other" ? d.industry_other : null,
      country: d.country,
      message: null,
      service_interest: d.preselected_solution,
      marketing_consent: d.marketing_consent,
    },
    requirements: {
      solution_types: d.solution_types,
      pain_points: d.pain_points,
      pain_points_other: d.pain_points_other,
      current_process: d.current_process,
      desired_outcome: d.desired_outcome,
      current_tools: d.current_tools,
      current_tools_other: d.current_tools_other,
      example_steps: d.example_steps,
      integrations: d.integrations,
      business_size: d.business_size,
      volume_range: d.volume_range,
      budget_range: d.budget_range,
      timeline: d.timeline,
      api_access: d.api_access,
      human_approval: d.human_approval,
      sensitive_data_flag: d.sensitive_data_flag,
      contact_preference: d.contact_preference,
      contact_time: d.contact_time,
    },
  };
}
