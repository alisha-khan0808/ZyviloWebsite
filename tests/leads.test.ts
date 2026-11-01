import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { buildDiscoveryLead, buildQuickLead, deriveSource, referenceCode } from "@/lib/leads/build";
import { discoverySchema, quickEnquirySchema } from "@/lib/validation/lead";
import { computeAnalytics } from "@/lib/admin/analytics";
import { applyFilters, type LeadWithReq } from "@/lib/admin/leads";
import { toCsv } from "@/lib/admin/csv";
import type { Lead, LeadRequirements, OutboxRow, LeadActivity } from "@/types";

let dir: string;
let store: typeof import("@/lib/data/local-store").localStore;

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "zyvilo-test-"));
  process.env.LOCAL_DATA_DIR = dir;
  store = (await import("@/lib/data/local-store")).localStore;
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const discovery = () =>
  discoverySchema.parse({
    contact_name: "Grace Hopper",
    email: "grace@example.com",
    company: "Compilers Inc",
    industry: "IT / SaaS",
    solution_types: ["Multi-Agent", "Supervisor Agent"],
    current_process: "Support engineers triage every ticket manually.",
    desired_outcome: "Route and answer common tickets automatically.",
    timeline: "ASAP",
    privacy_consent: true,
    idempotency_key: randomUUID(),
    attribution: { utm_source: "LinkedIn", utm_campaign: "launch", source_page: "/request-automation" },
  });

describe("lead building", () => {
  it("creates non-guessable reference codes", () => {
    const codes = new Set(Array.from({ length: 500 }, referenceCode));
    expect(codes.size).toBe(500);
    for (const c of codes) expect(c).toMatch(/^ZY-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$/);
  });

  it("derives source from UTM, then referrer host, then direct", () => {
    expect(deriveSource({ utm_source: "Google" })).toBe("google");
    expect(deriveSource({ referrer: "https://www.bing.com/search?q=x" })).toBe("bing.com");
    expect(deriveSource({})).toBe("direct");
  });

  it("maps a discovery brief to lead + requirement records with consent metadata", () => {
    const { lead, requirements } = buildDiscoveryLead(discovery(), "2026-11-01T10:00:00.000Z");
    expect(lead.form_type).toBe("discovery");
    expect(lead.status).toBe("new");
    expect(lead.source).toBe("linkedin");
    expect(lead.utm_campaign).toBe("launch");
    expect(lead.privacy_consent_at).toBe("2026-11-01T10:00:00.000Z");
    expect(requirements.solution_types).toEqual(["Multi-Agent", "Supervisor Agent"]);
    expect(requirements.timeline).toBe("ASAP");
  });
});

describe("lead persistence (local store)", () => {
  it("persists lead, requirements, activity and outbox atomically", async () => {
    const { lead, requirements } = buildDiscoveryLead(discovery());
    const res = await store.submitLead(lead, requirements);
    expect(res.duplicate).toBe(false);
    const id = res.lead.id;
    expect(await store.first<Lead>("leads", { id })).toMatchObject({ company: "Compilers Inc", email: "grace@example.com" });
    expect(await store.first<LeadRequirements>("lead_requirements", { lead_id: id })).toMatchObject({ desired_outcome: expect.stringContaining("Route") });
    expect(await store.list<LeadActivity>("lead_activities", { eq: { lead_id: id } })).toHaveLength(1);
    expect(await store.list<OutboxRow>("notification_outbox", { eq: { lead_id: id, status: "pending" } })).toHaveLength(1);
  });

  it("is idempotent: double submits with the same key create one lead", async () => {
    const parsed = quickEnquirySchema.parse({
      contact_name: "Double Click",
      phone: "+1 555 0100",
      message: "Please call me about a voice assistant.",
      privacy_consent: true,
      idempotency_key: randomUUID(),
    });
    const a = buildQuickLead(parsed);
    const b = buildQuickLead(parsed); // new reference code, same idempotency key
    const [r1, r2] = await Promise.all([store.submitLead(a.lead, null), store.submitLead(b.lead, null)]);
    expect(r1.lead.id).toBe(r2.lead.id);
    expect([r1.duplicate, r2.duplicate].sort()).toEqual([false, true]);
    const rows = await store.list<Lead>("leads", { eq: { idempotency_key: parsed.idempotency_key } });
    expect(rows).toHaveLength(1);
  });
});

describe("analytics", () => {
  const mk = (over: Partial<LeadWithReq>): LeadWithReq =>
    ({
      id: randomUUID(),
      status: "new",
      source: "direct",
      industry: "Education",
      industry_other: null,
      utm_campaign: null,
      service_interest: null,
      created_at: "2026-10-20T10:00:00.000Z",
      first_contacted_at: null,
      requirements: null,
      contact_name: "x",
      company: "x",
      email: null,
      phone: null,
      reference_code: "ZY-TEST",
      owner_id: null,
      priority: "medium",
      ...over,
    }) as LeadWithReq;

  const leads = [
    mk({ status: "won", source: "google", requirements: { solution_types: ["Voice", "AI Chat"] } as LeadRequirements, first_contacted_at: "2026-10-20T12:00:00.000Z" }),
    mk({ status: "qualified", source: "google", requirements: { solution_types: ["Voice"] } as LeadRequirements, first_contacted_at: "2026-10-20T14:00:00.000Z" }),
    mk({ status: "new", source: "direct", service_interest: "Zyvilo Sales — Lead qualification and CRM" }),
    mk({ status: "spam", source: "direct" }),
  ];

  it("excludes spam and uses a defined conversion denominator", () => {
    const a = computeAnalytics(leads, new Date("2026-10-25T00:00:00.000Z"));
    expect(a.kpis.total).toBe(3);
    expect(a.kpis.spamExcluded).toBe(1);
    expect(a.kpis.converted).toBe(1);
    expect(a.kpis.conversionRate).toBeCloseTo(1 / 3);
    expect(a.kpis.qualified).toBe(2);
  });

  it("counts multi-select solutions once per lead", () => {
    const a = computeAnalytics(leads);
    expect(a.bySolution.find((s) => s.key === "Voice")?.count).toBe(2);
    expect(a.bySolution.find((s) => s.key === "AI Chat")?.count).toBe(1);
    expect(a.leadsWithSolution).toBe(3);
  });

  it("computes median time to first contact", () => {
    expect(computeAnalytics(leads).medianHoursToFirstContact).toBe(3);
  });

  it("reconciles with the lead inbox filter (spam hidden by default)", () => {
    expect(applyFilters(leads, {}).length).toBe(computeAnalytics(leads).kpis.total);
    expect(applyFilters(leads, { source: "google" })).toHaveLength(2);
    expect(applyFilters(leads, { service: "voice" })).toHaveLength(2);
  });
});

describe("CSV export", () => {
  it("escapes quotes/commas and neutralises spreadsheet formulas", () => {
    const csv = toCsv([{ name: 'Acme, "Inc"', note: "=HYPERLINK(evil)" }]);
    expect(csv).toContain('"Acme, ""Inc"""');
    expect(csv).toContain("'=HYPERLINK(evil)");
  });
});
