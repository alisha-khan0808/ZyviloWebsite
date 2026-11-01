"use client";

import { useEffect } from "react";

const KEY = "zy_attr";
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

type Attribution = Partial<Record<(typeof UTM)[number] | "referrer" | "landing_page", string>>;

/** Records first-touch campaign parameters and external referrer for this browser session. */
export function AttributionCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const existing: Attribution = JSON.parse(sessionStorage.getItem(KEY) || "{}");
      const hasUtm = UTM.some((k) => params.get(k));
      if (Object.keys(existing).length && !hasUtm) return;
      const next: Attribution = {};
      for (const k of UTM) {
        const v = params.get(k);
        if (v) next[k] = v.slice(0, 150);
      }
      const ref = document.referrer;
      if (ref && new URL(ref).host !== window.location.host) next.referrer = ref.slice(0, 500);
      next.landing_page = window.location.pathname;
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — attribution is best effort */
    }
  }, []);
  return null;
}

export function readAttribution() {
  let a: Attribution = {};
  try {
    a = JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    /* ignore */
  }
  return {
    source_page: window.location.pathname + (a.landing_page && a.landing_page !== window.location.pathname ? ` (landed on ${a.landing_page})` : ""),
    referrer: a.referrer,
    utm_source: a.utm_source,
    utm_medium: a.utm_medium,
    utm_campaign: a.utm_campaign,
    utm_term: a.utm_term,
    utm_content: a.utm_content,
  };
}
