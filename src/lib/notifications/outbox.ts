import "server-only";
import { serviceStore } from "@/lib/data";
import { SITE_URL } from "@/lib/config";
import type { Lead, OutboxRow, PrivateSettings, SiteSettingRow } from "@/types";
import { sendEmail } from "./email";

const MAX_ATTEMPTS = 5;
const backoffMs = (attempt: number) => Math.min(60, 2 ** attempt) * 60_000; // 2, 4, 8 … 60 min

async function recipients(): Promise<string[]> {
  const row = await serviceStore().first<SiteSettingRow>("site_settings", { key: "notifications" });
  const fromSettings = ((row?.value_json as PrivateSettings | undefined)?.notificationRecipients ?? []).filter(Boolean);
  const fromEnv = (process.env.NOTIFY_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);
  return fromSettings.length ? fromSettings : fromEnv;
}

function render(lead: Lead) {
  const url = `${SITE_URL}/admin/leads/${lead.id}`;
  const lines = [
    `New ${lead.form_type === "discovery" ? "automation brief" : "enquiry"}: ${lead.reference_code}`,
    `Company: ${lead.company ?? "—"}`,
    `Contact: ${lead.contact_name}`,
    `Industry: ${lead.industry ?? "—"}`,
    `Source: ${lead.source}`,
    "",
    `Open in admin: ${url}`,
  ];
  return {
    subject: `New Zyvilo lead ${lead.reference_code} — ${lead.company || lead.contact_name}`,
    text: lines.join("\n"),
  };
}

async function deliver(row: OutboxRow) {
  const store = serviceStore();
  const lead = await store.first<Lead>("leads", { id: row.lead_id });
  const now = new Date();
  if (!lead) {
    await store.update("notification_outbox", { id: row.id }, { status: "failed", last_error: "Lead not found", next_retry_at: null });
    return;
  }
  const to = await recipients();
  if (!to.length) {
    await store.update("notification_outbox", { id: row.id }, { status: "skipped", last_error: "No notification recipients configured", next_retry_at: null });
    return;
  }
  try {
    await sendEmail({ to, ...render(lead) });
    await store.update("notification_outbox", { id: row.id }, { status: "sent", attempts: row.attempts + 1, last_error: null, next_retry_at: null });
  } catch (err) {
    const attempts = row.attempts + 1;
    const failed = attempts >= MAX_ATTEMPTS;
    await store.update("notification_outbox", { id: row.id }, {
      status: failed ? "failed" : "pending",
      attempts,
      last_error: (err as Error).message.slice(0, 500),
      next_retry_at: failed ? null : new Date(now.getTime() + backoffMs(attempts)).toISOString(),
    });
  }
}

/** Processes due outbox rows. Called right after submission and by the scheduled cron route. */
export async function processOutbox(opts: { leadId?: string; limit?: number } = {}) {
  const store = serviceStore();
  const rows = await store.list<OutboxRow>("notification_outbox", {
    eq: opts.leadId ? { status: "pending", lead_id: opts.leadId } : { status: "pending" },
    order: { column: "created_at" },
    limit: opts.limit ?? 25,
  });
  const due = rows.filter((r) => !r.next_retry_at || new Date(r.next_retry_at) <= new Date());
  for (const row of due) await deliver(row);
  return { processed: due.length };
}

/** Admin "retry now": re-queue a failed/skipped notification. */
export async function requeue(id: string) {
  await serviceStore().update("notification_outbox", { id }, { status: "pending", next_retry_at: new Date().toISOString() });
  const row = await serviceStore().first<OutboxRow>("notification_outbox", { id });
  if (row) await deliver(row);
}
