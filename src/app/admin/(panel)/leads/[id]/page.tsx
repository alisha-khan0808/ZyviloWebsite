import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Archive, Ban, RotateCcw, Trash2 } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { loadLeadDetail, loadTeam } from "@/lib/admin/leads";
import { STATUS_LABELS } from "@/lib/admin/labels";
import { deleteLeadAction, quickStatusAction, toggleTaskAction } from "@/lib/admin/lead-actions";
import { CopyButton, LeadUpdateForm, NoteForm, TaskForm } from "@/components/admin/lead-forms";
import { PriorityBadge, StatusBadge } from "@/components/admin/status-badge";
import { Panel } from "@/components/admin/charts";

export const metadata = { title: "Lead" };

function Row({ k, v, copy }: { k: string; v?: string | string[] | null | boolean; copy?: boolean }) {
  const text = Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Yes" : "No") : v;
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm text-muted">{k}</dt>
      <dd className="flex items-start gap-2 whitespace-pre-line break-words text-sm text-navy">
        {text || <span className="text-muted">—</span>}
        {copy && text && <CopyButton value={text} label={k} />}
      </dd>
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  lead_submitted: "Lead submitted",
  status_changed: "Status changed",
  owner_changed: "Owner changed",
  priority_changed: "Priority changed",
  score_changed: "Score updated",
  next_contact_set: "Next contact set",
  note_added: "Note added",
  task_added: "Task added",
  task_completed: "Task completed",
};

export default async function LeadDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { deleteError?: string } }) {
  const session = await requirePage("leads:read");
  const [detail, team] = await Promise.all([loadLeadDetail(params.id), loadTeam()]);
  if (!detail) notFound();
  const { lead, requirements: r, notes, activities, tasks } = detail;
  const names = new Map(team.map((t) => [t.id, t.display_name]));
  const who = (id: string | null) => (id ? names.get(id) ?? "Team member" : "System");
  const write = can(session.role, "leads:write");

  const describe = (e: (typeof activities)[number]) => {
    const m = e.metadata as Record<string, string | null>;
    if (e.event_type === "status_changed") return `${STATUS_LABELS[m.from ?? ""] ?? m.from} → ${STATUS_LABELS[m.to ?? ""] ?? m.to}`;
    if (e.event_type === "owner_changed") return `→ ${m.to ? who(m.to) : "Unassigned"}`;
    if (e.event_type === "priority_changed") return `${m.from} → ${m.to}`;
    if (e.event_type === "lead_submitted") return `${m.form_type === "discovery" ? "Automation brief" : "Quick enquiry"} via ${m.source}`;
    if (e.event_type === "task_added") return String(m.title ?? "");
    if (e.event_type === "score_changed") return `→ ${m.to ?? "cleared"}`;
    return "";
  };

  return (
    <>
      <Link href="/admin/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-purple">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All leads
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted">{lead.reference_code}</p>
          <h1 className="text-2xl font-bold md:text-3xl">{lead.company || lead.contact_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <StatusBadge status={lead.status} />
            <PriorityBadge priority={lead.priority} />
            <span>· {lead.form_type === "discovery" ? "Automation brief" : "Quick enquiry"}</span>
            <span>· {new Date(lead.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title="Contact & company">
            <dl className="divide-y divide-line">
              <Row k="Contact name" v={lead.contact_name} copy />
              <Row k="Email" v={lead.email} copy />
              <Row k="Phone / WhatsApp" v={lead.phone} copy />
              <Row k="Company" v={lead.company} />
              <Row k="Website" v={lead.website} />
              <Row k="Industry" v={lead.industry === "Other" ? `Other — ${lead.industry_other ?? ""}` : lead.industry} />
              <Row k="Business size" v={r?.business_size} />
              <Row k="Country / region" v={lead.country} />
              <Row k="Preferred contact" v={[r?.contact_preference, r?.contact_time].filter(Boolean).join(" · ")} />
            </dl>
          </Panel>

          <Panel title="Original request">
            <dl className="divide-y divide-line">
              {lead.message && <Row k="Message" v={lead.message} />}
              <Row k="Interested in" v={lead.service_interest} />
              {r && (
                <>
                  <Row k="Requested solutions" v={r.solution_types} />
                  <Row k="Pain points" v={[...r.pain_points.filter((p) => p !== "Other"), ...(r.pain_points_other ? [`Other: ${r.pain_points_other}`] : [])]} />
                  <Row k="Current process" v={r.current_process} />
                  <Row k="Desired outcome" v={r.desired_outcome} />
                  <Row k="Current tools" v={[...r.current_tools, ...(r.current_tools_other ? [r.current_tools_other] : [])]} />
                  <Row k="Example steps" v={r.example_steps} />
                  <Row k="Integrations" v={r.integrations} />
                </>
              )}
            </dl>
          </Panel>

          {r && (
            <Panel title="Scope & readiness">
              <dl className="divide-y divide-line">
                <Row k="Timeline" v={r.timeline} />
                <Row k="Budget range" v={r.budget_range} />
                <Row k="Request volume" v={r.volume_range} />
                <Row k="API access" v={r.api_access} />
                <Row k="Human approval needed" v={r.human_approval} />
                <Row k="Sensitive data involved" v={r.sensitive_data_flag} />
              </dl>
            </Panel>
          )}

          <Panel title="Source & submission">
            <dl className="divide-y divide-line">
              <Row k="Source" v={lead.source} />
              <Row k="Source page" v={lead.source_page} />
              <Row k="Referrer" v={lead.referrer} />
              <Row k="UTM" v={[lead.utm_source, lead.utm_medium, lead.utm_campaign, lead.utm_term, lead.utm_content].filter(Boolean).join(" / ")} />
              <Row k="Preselected" v={[lead.service_interest].filter(Boolean).join(", ")} />
              <Row k="Privacy consent" v={`${new Date(lead.privacy_consent_at).toLocaleString()} (v${lead.privacy_consent_version})`} />
              <Row k="Marketing consent" v={lead.marketing_consent} />
            </dl>
          </Panel>

          <Panel title="Internal notes">
            {write && <NoteForm leadId={lead.id} />}
            <ul className="mt-4 space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="rounded-xl bg-bg p-3">
                  <p className="whitespace-pre-line text-sm">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">{who(n.author_id)} · {new Date(n.created_at).toLocaleString()}</p>
                </li>
              ))}
              {!notes.length && <li className="text-sm text-muted">No notes yet.</li>}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          {write && (
            <Panel title="Manage">
              <LeadUpdateForm lead={lead} team={team} />
            </Panel>
          )}

          <Panel title="Follow-up tasks">
            <ul className="mb-4 space-y-2">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <form action={toggleTaskAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="lead_id" value={lead.id} />
                    <input type="hidden" name="done" value={t.completed_at ? "0" : "1"} />
                    <button
                      disabled={!write}
                      aria-label={t.completed_at ? `Mark "${t.title}" not done` : `Mark "${t.title}" done`}
                      className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md border ${t.completed_at ? "border-purple bg-purple text-white" : "border-line bg-white"}`}
                    >
                      {t.completed_at ? "✓" : ""}
                    </button>
                  </form>
                  <span className="text-sm">
                    <span className={t.completed_at ? "text-muted line-through" : ""}>{t.title}</span>
                    <span className="block text-xs text-muted">
                      {who(t.assignee_id)}
                      {t.due_at ? ` · due ${new Date(t.due_at).toLocaleDateString()}` : ""}
                    </span>
                  </span>
                </li>
              ))}
              {!tasks.length && <li className="text-sm text-muted">No tasks.</li>}
            </ul>
            {write && <TaskForm leadId={lead.id} team={team} />}
          </Panel>

          <Panel title="Activity timeline">
            <ol className="relative space-y-4 border-l border-line pl-4">
              {activities.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-purple" aria-hidden />
                  <p className="text-sm font-medium">{EVENT_LABELS[e.event_type] ?? e.event_type}</p>
                  {describe(e) && <p className="text-xs text-navy/80">{describe(e)}</p>}
                  <p className="text-xs text-muted">{who(e.actor_id)} · {new Date(e.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ol>
          </Panel>

          {write && (
            <Panel title="Housekeeping">
              <div className="flex flex-wrap gap-2">
                {lead.status !== "spam" && (
                  <form action={quickStatusAction}>
                    <input type="hidden" name="id" value={lead.id} />
                    <input type="hidden" name="status" value="spam" />
                    <button className="btn-secondary !py-2 text-xs"><Ban className="h-3.5 w-3.5" aria-hidden /> Mark spam</button>
                  </form>
                )}
                {lead.status !== "archived" && (
                  <form action={quickStatusAction}>
                    <input type="hidden" name="id" value={lead.id} />
                    <input type="hidden" name="status" value="archived" />
                    <button className="btn-secondary !py-2 text-xs"><Archive className="h-3.5 w-3.5" aria-hidden /> Archive</button>
                  </form>
                )}
                {(lead.status === "spam" || lead.status === "archived") && (
                  <form action={quickStatusAction}>
                    <input type="hidden" name="id" value={lead.id} />
                    <input type="hidden" name="status" value="new" />
                    <button className="btn-secondary !py-2 text-xs"><RotateCcw className="h-3.5 w-3.5" aria-hidden /> Restore</button>
                  </form>
                )}
              </div>
              {can(session.role, "leads:delete") && (
                <details className="mt-4 rounded-xl border border-red-200 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-red-700">Delete permanently</summary>
                  <form action={deleteLeadAction} className="mt-3 space-y-2">
                    <input type="hidden" name="id" value={lead.id} />
                    <p className="text-xs text-muted">Use for deletion requests under the retention policy. Type the reference code to confirm.</p>
                    <input name="confirm" placeholder={lead.reference_code} aria-label="Reference code" className="input" />
                    {searchParams.deleteError && <p className="text-xs text-red-600">Reference code did not match.</p>}
                    <button className="btn !bg-red-600 !py-2 text-xs text-white hover:!bg-red-700"><Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete lead</button>
                  </form>
                </details>
              )}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
