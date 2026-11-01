import { requirePage } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { userStore } from "@/lib/data";
import { loadTeam } from "@/lib/admin/leads";
import { isSupabaseConfigured } from "@/lib/config";
import { PageTitle } from "@/components/admin/shell";
import { Panel } from "@/components/admin/charts";
import { NotificationSettings, OutboxRetry, TeamManager } from "@/components/admin/settings-forms";
import type { AuditLog, Lead, OutboxRow, PrivateSettings, SiteSettingRow } from "@/types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requirePage("settings:write");
  const store = userStore();
  const [notif, outbox, team, logs, leads] = await Promise.all([
    store.first<SiteSettingRow>("site_settings", { key: "notifications" }),
    store.list<OutboxRow>("notification_outbox", { order: { column: "created_at", ascending: false }, limit: 20 }),
    loadTeam(),
    can(session.role, "audit:read") ? store.list<AuditLog>("audit_logs", { order: { column: "created_at", ascending: false }, limit: 50 }) : Promise.resolve([]),
    store.list<Lead>("leads"),
  ]);
  const refs = new Map(leads.map((l) => [l.id, l.reference_code]));
  const names = new Map(team.map((t) => [t.id, t.display_name]));
  const recipients = (notif?.value_json as PrivateSettings | undefined)?.notificationRecipients ?? [];
  const providerConfigured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

  return (
    <>
      <PageTitle title="Settings" intro="Notifications, team access and the audit trail." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="New-lead notifications" note={providerConfigured ? "Email provider configured." : "No email provider configured — set RESEND_API_KEY and EMAIL_FROM. Leads are still saved."}>
          <NotificationSettings initial={recipients} />
        </Panel>
        <Panel title="Notification delivery" note="Failures retry automatically with backoff (cron) — leads are never lost.">
          {outbox.length === 0 ? (
            <p className="text-sm text-muted">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {outbox.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="font-mono text-xs">{refs.get(o.lead_id) ?? "deleted lead"}</span>
                    <span className="ml-2 font-semibold capitalize">{o.status}</span>
                    <span className="ml-2 text-xs text-muted">{o.attempts} attempt{o.attempts === 1 ? "" : "s"}</span>
                    {o.last_error && <span className="block truncate text-xs text-red-600">{o.last_error}</span>}
                  </span>
                  {o.status !== "sent" && <OutboxRetry id={o.id} />}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="lg:col-span-2">
          <Panel title="Team" note={isSupabaseConfigured() ? "Invitations are emailed by Supabase Auth. There is no public sign-up." : "Local mode: set a temporary password for each member."}>
            <TeamManager team={team} me={session} canManage={can(session.role, "team:manage")} supabase={isSupabaseConfigured()} />
          </Panel>
        </div>
        {can(session.role, "audit:read") && (
          <div className="lg:col-span-2">
            <Panel title="Audit log" note="Security-sensitive admin actions (latest 50)">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted">
                    <tr>
                      <th scope="col" className="pb-2">When</th>
                      <th scope="col" className="pb-2">Who</th>
                      <th scope="col" className="pb-2">Action</th>
                      <th scope="col" className="pb-2">Resource</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {logs.map((l) => (
                      <tr key={l.id}>
                        <td className="whitespace-nowrap py-2 text-muted">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="py-2">{l.actor_id ? names.get(l.actor_id) ?? "—" : "System"}</td>
                        <td className="py-2 font-mono text-xs">{l.action}</td>
                        <td className="py-2 text-muted">
                          {l.resource_type}
                          {l.resource_type === "lead" && l.resource_id ? ` ${refs.get(l.resource_id) ?? ""}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}
