import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { loadLeads } from "@/lib/admin/leads";
import { computeAnalytics, timeSeries } from "@/lib/admin/analytics";
import { PageTitle, EmptyState } from "@/components/admin/shell";
import { BarList, Kpi, Panel } from "@/components/admin/charts";
import { TimeChartLazy } from "@/components/admin/time-chart-lazy";
import { StatusBadge } from "@/components/admin/status-badge";

export const metadata = { title: "Overview" };

export default async function AdminOverview({ searchParams }: { searchParams: { denied?: string } }) {
  const session = await requirePage();
  if (!can(session.role, "analytics:read")) redirect("/admin/content");
  const leads = await loadLeads();
  const a = computeAnalytics(leads);
  const from = new Date(Date.now() - 29 * 86_400_000);
  const series = timeSeries(leads.filter((l) => l.status !== "spam" && new Date(l.created_at) >= from), "day", from);
  const recent = leads.filter((l) => l.status !== "spam").slice(0, 6);
  const pct = (n: number | null) => (n === null ? "—" : `${(n * 100).toFixed(1)}%`);

  return (
    <>
      {searchParams.denied && <p className="mb-6 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">You don&apos;t have access to that page.</p>}
      <PageTitle title={`Welcome, ${session.displayName}`} intro="Live figures from your lead records (spam excluded)." actions={<Link href="/admin/leads" className="btn-primary !py-2">Open lead inbox</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total leads" value={a.kpis.total} />
        <Kpi label="New" value={a.kpis.new} hint="Awaiting first contact" />
        <Kpi label="Qualified+" value={a.kpis.qualified} hint="Qualified or further" />
        <Kpi label="Consultations" value={a.kpis.consultations} hint="Discovery scheduled" />
        <Kpi label="Converted" value={a.kpis.converted} hint="Status: Won" />
        <Kpi label="Conversion rate" value={pct(a.kpis.conversionRate)} hint={`Won ÷ ${a.kpis.total} non-spam leads`} />
        <Kpi label="This week" value={a.kpis.thisWeek} hint="Last 7 days" />
        <Kpi label="This month" value={a.kpis.thisMonth} hint="Last 30 days" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Leads — last 30 days">
            <TimeChartLazy data={series} />
          </Panel>
        </div>
        <Panel title="Sources">
          <BarList data={a.bySource} denominator={a.kpis.total} />
        </Panel>
        <Panel title="Industry interest">
          <BarList data={a.byIndustry} denominator={a.kpis.total} />
        </Panel>
        <Panel title="Popular solutions" note={`Multi-select; % of ${a.leadsWithSolution} leads that chose any`}>
          <BarList data={a.bySolution} denominator={a.leadsWithSolution || undefined} />
        </Panel>
        <Panel title="Recent leads">
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-purple">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{l.company || l.contact_name}</span>
                      <span className="block text-xs text-muted">{new Date(l.created_at).toLocaleString()}</span>
                    </span>
                    <StatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No leads yet" body="Submissions from the website appear here instantly." />
          )}
          <Link href="/admin/analytics" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple">
            Full analytics <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Panel>
      </div>
    </>
  );
}
