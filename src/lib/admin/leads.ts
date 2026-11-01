import "server-only";
import { userStore } from "@/lib/data";
import type { Lead, LeadActivity, LeadNote, LeadRequirements, LeadTask, Profile } from "@/types";

export type LeadWithReq = Lead & { requirements: LeadRequirements | null };

export interface LeadFilters {
  q?: string;
  status?: string;
  industry?: string;
  service?: string;
  source?: string;
  owner?: string;
  priority?: string;
  budget?: string;
  timeline?: string;
  from?: string;
  to?: string;
  sort?: string;
  page?: string;
}

/** Loads leads with requirements. V1 filters in memory (fine for thousands of leads); move to SQL views when volume grows. */
export async function loadLeads(): Promise<LeadWithReq[]> {
  const store = userStore();
  const [leads, reqs] = await Promise.all([
    store.list<Lead>("leads", { order: { column: "created_at", ascending: false } }),
    store.list<LeadRequirements>("lead_requirements"),
  ]);
  const byLead = new Map(reqs.map((r) => [r.lead_id, r]));
  return leads.map((l) => ({ ...l, requirements: byLead.get(l.id) ?? null }));
}

export function leadServices(l: LeadWithReq): string[] {
  return [...(l.requirements?.solution_types ?? []), ...(l.service_interest ? [l.service_interest] : [])];
}

export function applyFilters(leads: LeadWithReq[], f: LeadFilters) {
  const q = f.q?.trim().toLowerCase();
  const from = f.from ? new Date(f.from).getTime() : null;
  const to = f.to ? new Date(f.to).getTime() + 86_400_000 : null;
  let out = leads.filter((l) => {
    if (q && ![l.contact_name, l.company, l.email, l.phone, l.reference_code].some((v) => v?.toLowerCase().includes(q))) return false;
    if (f.status) {
      if (f.status === "open") {
        if (["won", "lost", "spam", "archived"].includes(l.status)) return false;
      } else if (l.status !== f.status) return false;
    } else if (l.status === "spam" || l.status === "archived") return false; // hidden unless requested
    if (f.industry && l.industry !== f.industry) return false;
    if (f.service && !leadServices(l).some((s) => s.toLowerCase().includes(f.service!.toLowerCase()))) return false;
    if (f.source && l.source !== f.source) return false;
    if (f.owner === "unassigned" ? l.owner_id : f.owner && l.owner_id !== f.owner) return false;
    if (f.priority && l.priority !== f.priority) return false;
    if (f.budget && l.requirements?.budget_range !== f.budget) return false;
    if (f.timeline && l.requirements?.timeline !== f.timeline) return false;
    const t = new Date(l.created_at).getTime();
    if (from && t < from) return false;
    if (to && t >= to) return false;
    return true;
  });
  if (f.sort === "oldest") out = [...out].reverse();
  if (f.sort === "company") out = [...out].sort((a, b) => (a.company ?? "").localeCompare(b.company ?? ""));
  if (f.sort === "priority") {
    const rank = { high: 0, medium: 1, low: 2 };
    out = [...out].sort((a, b) => rank[a.priority] - rank[b.priority]);
  }
  return out;
}

export async function loadLeadDetail(id: string) {
  const store = userStore();
  const lead = await store.first<Lead>("leads", { id });
  if (!lead) return null;
  const [requirements, notes, activities, tasks] = await Promise.all([
    store.first<LeadRequirements>("lead_requirements", { lead_id: id }),
    store.list<LeadNote>("lead_notes", { eq: { lead_id: id }, order: { column: "created_at", ascending: false } }),
    store.list<LeadActivity>("lead_activities", { eq: { lead_id: id }, order: { column: "created_at", ascending: false } }),
    store.list<LeadTask>("lead_tasks", { eq: { lead_id: id }, order: { column: "created_at", ascending: true } }),
  ]);
  return { lead, requirements, notes, activities, tasks };
}

export async function loadTeam(): Promise<Profile[]> {
  const rows = await userStore().list<Profile>("profiles", { order: { column: "display_name" } });
  return rows.map(({ password_hash: _omit, ...p }) => p as Profile);
}

export { STATUS_LABELS } from "./labels";
