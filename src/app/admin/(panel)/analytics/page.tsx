import Link from "next/link";
import { Download } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { applyFilters, loadLeads, loadTeam } from "@/lib/admin/leads";
import { STATUS_LABELS } from "@/lib/admin/labels";
import { computeAnalytics, timeSeries, type Bucket, type Conversion } from "@/lib/admin/analytics";
import { PageTitle } from "@/components/admin/shell";
import { BarList, Kpi, Panel } from "@/components/admin/charts";
import { TimeChartLazy } from "@/components/admin/time-chart-lazy";

export const metadata = { title: "Analytics" };

type Search = { from?: string; to?: string; bucket?: string; source?: string; service?: string; industry?: string; owner?: string };

export default async function AnalyticsPage({ searchParams }: { searchParams: Search }) {
  const session = await requirePage("analytics:read");
  const [all, team] = await Promise.all([loadLeads(), loadTeam()]);
  const defaultFrom = new Date(Date.now() - 89 * 86_400_000).toISOString().slice(0, 10);
  const from = searchParams.from || defaultFrom;
  const to = searchParams.to || new Date().toISOString().slice(0, 10);
  const bucket = (["day", "week", "month"].includes(searchParams.bucket ?? "") ? searchParams.bucket : "week") as Bucket;
  // Same filter function as the lead inbox, so totals reconcile; include spam/archived for the status breakdown.
  const filters = { from, to, source: searchParams.source, service: searchParams.service, industry: searchParams.industry, owner: searchParams.owner };
  const leads = [...applyFilters(all, filters), ...applyFilters(all, { ...filters, status: "spam" }), ...applyFilters(all, { ...filters, status: "archived" })];
  const a = computeAnalytics(leads);
  const series = timeSeries(leads.filter((l) => l.status !== "spam"), bucket, new Date(from), new Date(to));
  const sources = [...new Set(all.map((l) => l.source))].sort();
  const industries = [...new Set(all.map((l) => l.industry).filter(Boolean))].sort() as string[];
  const inboxQs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageTitle
        title="Lead intelligence"
        intro="Operational metrics derived from your lead records. Spam is excluded from totals."
        actions={
          <>
            <Link href={`/admin/leads?${inboxQs}`} className="btn-secondary !py-2">View matching leads</Link>
            {can(session.role, "leads:export") && (
              <a href={`/api/admin/leads/export?${inboxQs}`} className="btn-secondary !py-2">
                <Download className="h-4 w-4" aria-hidden /> CSV
              </a>
            )}
          </>
        }
      />
      <form className="mb-6 grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-3 lg:grid-cols-8">
        <label className="lg:col-span-1"><span className="sr-only">From</span><input type="date" name="from" defaultValue={from} className="input" /></label>
        <label className="lg:col-span-1"><span className="sr-only">To</span><input type="date" name="to" defaultValue={to} className="input" /></label>
        <select name="bucket" defaultValue={bucket} aria-label="Group by" className="input">
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
        </select>
        <select name="source" defaultValue={searchParams.source ?? ""} aria-label="Source" className="input">
          <option value="">Source: any</option>
          {sources.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select name="industry" defaultValue={searchParams.industry ?? ""} aria-label="Industry" className="input">
          <option value="">Industry: any</option>
          {industries.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input name="service" defaultValue={searchParams.service} placeholder="Service" aria-label="Service" className="input" />
        <select name="owner" defaultValue={searchParams.owner ?? ""} aria-label="Owner" className="input">
          <option value="">Owner: any</option>
          <option value="unassigned">Unassigned</option>
          {team.map((t) => <option key={t.id} value={t.id}>{t.display_name}</option>)}
        </select>
        <button className="btn-primary !py-2">Apply</button>
      </form>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Leads" value={a.kpis.total} hint={`${a.kpis.spamExcluded} spam excluded`} />
        <Kpi label="Won" value={a.kpis.converted} hint={a.kpis.conversionRate === null ? "—" : `${(a.kpis.conversionRate * 100).toFixed(1)}% of ${a.kpis.total}`} />
        <Kpi
          label="Median time to first contact"
          value={a.medianHoursToFirstContact === null ? "—" : a.medianHoursToFirstContact < 48 ? `${a.medianHoursToFirstContact.toFixed(1)} h` : `${(a.medianHoursToFirstContact / 24).toFixed(1)} d`}
          hint={`Based on ${a.contactedCount} contacted lead${a.contactedCount === 1 ? "" : "s"}`}
        />
        <Kpi label="Avg. open lead age" value={a.avgOpenLeadAgeDays === null ? "—" : `${a.avgOpenLeadAgeDays.toFixed(1)} d`} hint={`${a.openCount} open leads`} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Panel title={`Leads over time (${bucket})`}>
            <TimeChartLazy data={series} />
          </Panel>
        </div>
        <Panel title="Leads by current status" note="Snapshot of where every lead in this range is now">
          <BarList data={a.byStatus.filter((s) => s.count > 0)} label={(k) => STATUS_LABELS[k] ?? k} limit={10} />
        </Panel>
        <Panel title="Leads by source">
          <BarList data={a.bySource} denominator={a.kpis.total} />
        </Panel>
        <Panel title="UTM campaigns">
          <BarList data={a.byCampaign} />
        </Panel>
        <Panel title="Leads by industry">
          <BarList data={a.byIndustry} denominator={a.kpis.total} />
        </Panel>
        <Panel title="Requested solutions" note={`Multi-select: each choice counted once per lead · % of ${a.leadsWithSolution} leads with any selection`}>
          <BarList data={a.bySolution} denominator={a.leadsWithSolution || undefined} limit={12} />
        </Panel>
        <Panel title="Conversion by source" note="Won ÷ leads. Rates on small samples (<10) are shown but flagged.">
          <ConversionTable rows={a.conversionBySource} />
        </Panel>
        <Panel title="Conversion by industry" note="Won ÷ leads. Rates on small samples (<10) are shown but flagged.">
          <ConversionTable rows={a.conversionByIndustry} />
        </Panel>
      </div>
    </>
  );
}

function ConversionTable({ rows }: { rows: Conversion[] }) {
  if (!rows.length) return <p className="text-sm text-muted">No data yet.</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase tracking-wider text-muted">
        <tr>
          <th scope="col" className="pb-2">Segment</th>
          <th scope="col" className="pb-2 text-right">Won / Leads</th>
          <th scope="col" className="pb-2 text-right">Rate</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.slice(0, 10).map((r) => (
          <tr key={r.key}>
            <td className="py-2">{r.key}</td>
            <td className="py-2 text-right tabular-nums">{r.won} / {r.total}</td>
            <td className="py-2 text-right tabular-nums">
              {((r.won / r.total) * 100).toFixed(0)}%{r.total < 10 && <span className="ml-1 text-xs text-amber-600" title="Small sample">*</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
