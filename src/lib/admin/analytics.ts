// Pure lead-analytics computations (unit-tested). Operational metrics only — no inference about people.
import { LEAD_STATUSES } from "@/types";
import type { LeadWithReq } from "./leads";

export type Bucket = "day" | "week" | "month";
export interface Count {
  key: string;
  count: number;
}

const EXCLUDED = new Set(["spam"]);

function tally(values: (string | null | undefined)[]): Count[] {
  const m = new Map<string, number>();
  for (const v of values) {
    const k = v || "Unknown";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
}

function bucketKey(d: Date, b: Bucket) {
  if (b === "month") return d.toISOString().slice(0, 7);
  if (b === "week") {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); // Monday
    return x.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

export function timeSeries(leads: LeadWithReq[], bucket: Bucket, from?: Date, to?: Date): Count[] {
  const counts = new Map<string, number>();
  for (const l of leads) {
    const k = bucketKey(new Date(l.created_at), bucket);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  // Fill gaps so charts show zero days honestly.
  const start = from ?? (leads.length ? new Date(Math.min(...leads.map((l) => +new Date(l.created_at)))) : null);
  const end = to ?? new Date();
  if (!start) return [];
  const out: Count[] = [];
  const cur = new Date(bucketKey(start, bucket === "month" ? "month" : bucket) + (bucket === "month" ? "-01" : ""));
  let guard = 0;
  while (cur <= end && guard++ < 1000) {
    const k = bucketKey(cur, bucket);
    out.push({ key: k, count: counts.get(k) ?? 0 });
    if (bucket === "day") cur.setUTCDate(cur.getUTCDate() + 1);
    else if (bucket === "week") cur.setUTCDate(cur.getUTCDate() + 7);
    else cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export interface Conversion {
  key: string;
  won: number;
  total: number;
}

function conversionBy(leads: LeadWithReq[], keyOf: (l: LeadWithReq) => string | null) {
  const m = new Map<string, Conversion>();
  for (const l of leads) {
    const k = keyOf(l) || "Unknown";
    const c = m.get(k) ?? { key: k, won: 0, total: 0 };
    c.total += 1;
    if (l.status === "won") c.won += 1;
    m.set(k, c);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

export function computeAnalytics(all: LeadWithReq[], now = new Date()) {
  const leads = all.filter((l) => !EXCLUDED.has(l.status));
  const dayMs = 86_400_000;
  const weekAgo = now.getTime() - 7 * dayMs;
  const monthAgo = now.getTime() - 30 * dayMs;
  const won = leads.filter((l) => l.status === "won").length;
  const qualifiedOrLater = new Set(["qualified", "discovery_scheduled", "proposal_sent", "won"]);

  const firstContactHours = leads
    .filter((l) => l.first_contacted_at)
    .map((l) => (+new Date(l.first_contacted_at!) - +new Date(l.created_at)) / 3_600_000)
    .filter((h) => h >= 0);
  const open = leads.filter((l) => !["won", "lost", "archived"].includes(l.status));
  const ages = open.map((l) => (now.getTime() - +new Date(l.created_at)) / dayMs);

  return {
    kpis: {
      total: leads.length,
      new: leads.filter((l) => l.status === "new").length,
      qualified: leads.filter((l) => qualifiedOrLater.has(l.status)).length,
      consultations: leads.filter((l) => l.status === "discovery_scheduled").length,
      converted: won,
      /** Won ÷ all non-spam leads in the selected range. */
      conversionRate: leads.length ? won / leads.length : null,
      thisWeek: leads.filter((l) => +new Date(l.created_at) >= weekAgo).length,
      thisMonth: leads.filter((l) => +new Date(l.created_at) >= monthAgo).length,
      spamExcluded: all.length - leads.length,
    },
    byStatus: LEAD_STATUSES.map((s) => ({ key: s, count: all.filter((l) => l.status === s).length })),
    bySource: tally(leads.map((l) => l.source)),
    byCampaign: tally(leads.filter((l) => l.utm_campaign).map((l) => l.utm_campaign)),
    byIndustry: tally(leads.map((l) => (l.industry === "Other" && l.industry_other ? `Other: ${l.industry_other}` : l.industry))),
    /** Multi-select: each selected solution counts once per lead; percentages use leadsWithSolution as denominator. */
    bySolution: tally(leads.flatMap((l) => [...new Set([...(l.requirements?.solution_types ?? []), ...(l.service_interest ? [l.service_interest] : [])])])),
    leadsWithSolution: leads.filter((l) => (l.requirements?.solution_types.length ?? 0) > 0 || l.service_interest).length,
    medianHoursToFirstContact: median(firstContactHours),
    contactedCount: firstContactHours.length,
    avgOpenLeadAgeDays: ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null,
    openCount: open.length,
    conversionBySource: conversionBy(leads, (l) => l.source),
    conversionByIndustry: conversionBy(leads, (l) => l.industry),
  };
}

export type AnalyticsResult = ReturnType<typeof computeAnalytics>;
