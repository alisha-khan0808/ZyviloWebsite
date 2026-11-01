import Link from "next/link";
import { Download, Search } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { applyFilters, leadServices, loadLeads, loadTeam, STATUS_LABELS, type LeadFilters } from "@/lib/admin/leads";
import { BUDGET_RANGES, TIMELINES } from "@/lib/validation/options";
import { LEAD_PRIORITIES, LEAD_STATUSES } from "@/types";
import { PageTitle, EmptyState } from "@/components/admin/shell";
import { PriorityBadge, StatusBadge } from "@/components/admin/status-badge";

export const metadata = { title: "Leads" };
const PAGE_SIZE = 25;

export default async function LeadsPage({ searchParams }: { searchParams: LeadFilters & { deleted?: string } }) {
  const session = await requirePage("leads:read");
  const [all, team] = await Promise.all([loadLeads(), loadTeam()]);
  const filtered = applyFilters(all, searchParams);
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const names = new Map(team.map((t) => [t.id, t.display_name]));
  const industries = [...new Set(all.map((l) => l.industry).filter(Boolean))].sort() as string[];
  const sources = [...new Set(all.map((l) => l.source))].sort();
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...searchParams, ...patch })) if (v && k !== "deleted") p.set(k, String(v));
    return p.toString();
  };
  const activeFilters = Object.entries(searchParams).filter(([k, v]) => v && !["page", "sort", "deleted"].includes(k)).length;

  return (
    <>
      <PageTitle
        title="Lead inbox"
        intro={`${filtered.length} lead${filtered.length === 1 ? "" : "s"}${activeFilters ? " match your filters" : ""} · spam & archived hidden unless selected`}
        actions={
          can(session.role, "leads:export") && (
            <a href={`/api/admin/leads/export?${qs({ page: undefined })}`} className="btn-secondary !py-2">
              <Download className="h-4 w-4" aria-hidden /> Export CSV
            </a>
          )
        }
      />
      {searchParams.deleted && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">Lead deleted.</p>}

      <form className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-6" role="search">
        <div className="relative sm:col-span-2">
          <label htmlFor="q" className="sr-only">Search</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input id="q" name="q" defaultValue={searchParams.q} placeholder="Name, company, email, reference" className="input pl-9" />
        </div>
        <Select name="status" label="Status" value={searchParams.status} options={[["open", "All open"], ...LEAD_STATUSES.map((s) => [s, STATUS_LABELS[s]] as [string, string])]} />
        <Select name="industry" label="Industry" value={searchParams.industry} options={industries.map((i) => [i, i])} />
        <Select name="source" label="Source" value={searchParams.source} options={sources.map((s) => [s, s])} />
        <Select name="owner" label="Owner" value={searchParams.owner} options={[["unassigned", "Unassigned"], ...team.map((t) => [t.id, t.display_name] as [string, string])]} />
        <input name="service" defaultValue={searchParams.service} placeholder="Service (e.g. Voice)" aria-label="Service" className="input" />
        <Select name="priority" label="Urgency" value={searchParams.priority} options={LEAD_PRIORITIES.map((p) => [p, p])} />
        <Select name="timeline" label="Timeline" value={searchParams.timeline} options={TIMELINES.map((p) => [p, p])} />
        <Select name="budget" label="Budget" value={searchParams.budget} options={BUDGET_RANGES.map((p) => [p, p])} />
        <input type="date" name="from" defaultValue={searchParams.from} aria-label="From date" className="input" />
        <input type="date" name="to" defaultValue={searchParams.to} aria-label="To date" className="input" />
        <Select name="sort" label="Sort" value={searchParams.sort} placeholder="Newest first" options={[["oldest", "Oldest first"], ["company", "Company A–Z"], ["priority", "Urgency"]]} />
        <div className="flex gap-2 lg:col-span-2">
          <button className="btn-primary flex-1 !py-2">Apply</button>
          <Link href="/admin/leads" className="btn-secondary !py-2">Reset</Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title={all.length ? "No leads match these filters" : "No leads yet"} body={all.length ? "Try widening the date range or clearing filters." : "Website submissions appear here as soon as they arrive."} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line bg-bg text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Company / contact</th>
                <th scope="col" className="px-4 py-3">Requested</th>
                <th scope="col" className="px-4 py-3">Source</th>
                <th scope="col" className="px-4 py-3">Submitted</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Urgency</th>
                <th scope="col" className="px-4 py-3">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-lavender/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${l.id}`} className="font-semibold text-navy hover:text-purple">
                      {l.company || l.contact_name}
                    </Link>
                    <span className="block text-xs text-muted">
                      {l.contact_name} · {l.industry ?? "—"} · {l.form_type === "discovery" ? "Brief" : "Quick"}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-muted">{leadServices(l).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-muted">{l.source}{l.utm_campaign ? ` · ${l.utm_campaign}` : ""}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{new Date(l.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={l.priority} /></td>
                  <td className="px-4 py-3 text-muted">{l.owner_id ? names.get(l.owner_id) ?? "—" : "Unassigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          <span className="text-muted">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link className="btn-secondary !py-2" href={`/admin/leads?${qs({ page: String(page - 1) })}`}>Previous</Link>}
            {page < pages && <Link className="btn-secondary !py-2" href={`/admin/leads?${qs({ page: String(page + 1) })}`}>Next</Link>}
          </div>
        </nav>
      )}
    </>
  );
}

function Select({ name, label, value, options, placeholder }: { name: string; label: string; value?: string; options: [string, string][]; placeholder?: string }) {
  return (
    <select name={name} defaultValue={value ?? ""} aria-label={label} className="input capitalize-first">
      <option value="">{placeholder ?? `${label}: any`}</option>
      {options.map(([v, l]) => (
        <option key={v} value={v}>{l}</option>
      ))}
    </select>
  );
}
