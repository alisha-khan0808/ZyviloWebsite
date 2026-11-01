// Privacy-conscious client event tracking. Sends ONLY event names and non-sensitive context
// (never names, emails, phone numbers or request text), and only after analytics consent.

export type AnalyticsEvent =
  | "hero_primary_cta_click"
  | "hero_secondary_cta_click"
  | "workflow_demo_started"
  | "workflow_demo_completed"
  | "industry_selected"
  | "solution_viewed"
  | "lead_form_started"
  | "lead_form_step_completed"
  | "lead_form_submitted"
  | "consultation_cta_click";

type Props = Record<string, string | number | boolean | undefined>;
export const CONSENT_KEY = "zy_analytics_consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function hasAnalyticsConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...props });
}
