"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { userStore } from "@/lib/data";
import { AuthError, requireAction } from "@/lib/auth/session";
import { LEAD_PRIORITIES, LEAD_STATUSES, type Lead } from "@/types";
import { audit } from "./audit";

export type ActionState = { ok?: boolean; error?: string };

async function guard<T>(fn: () => Promise<T>): Promise<T | ActionState> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) return { error: err.message };
    console.error("[admin action]", (err as Error).message);
    return { error: "Something went wrong. Please try again." };
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(LEAD_STATUSES).optional(),
  owner_id: z.string().optional(),
  priority: z.enum(LEAD_PRIORITIES).optional(),
  qualification_score: z.string().optional(),
  next_contact_at: z.string().optional(),
});

export async function updateLeadAction(_: unknown, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const session = await requireAction("leads:write");
    const d = updateSchema.parse(Object.fromEntries(form));
    const store = userStore();
    const lead = await store.first<Lead>("leads", { id: d.id });
    if (!lead) return { error: "Lead not found" };

    const patch: Record<string, unknown> = {};
    const events: { type: string; meta: Record<string, unknown> }[] = [];
    if (d.status && d.status !== lead.status) {
      patch.status = d.status;
      if (!lead.first_contacted_at && d.status !== "new" && d.status !== "spam") patch.first_contacted_at = new Date().toISOString();
      events.push({ type: "status_changed", meta: { from: lead.status, to: d.status } });
    }
    if (d.owner_id !== undefined) {
      const owner = d.owner_id || null;
      if (owner !== lead.owner_id) {
        patch.owner_id = owner;
        events.push({ type: "owner_changed", meta: { from: lead.owner_id, to: owner } });
      }
    }
    if (d.priority && d.priority !== lead.priority) {
      patch.priority = d.priority;
      events.push({ type: "priority_changed", meta: { from: lead.priority, to: d.priority } });
    }
    if (d.qualification_score !== undefined) {
      const score = d.qualification_score === "" ? null : Math.max(0, Math.min(100, Math.round(Number(d.qualification_score))));
      if (score !== lead.qualification_score && (score === null || !Number.isNaN(score))) {
        patch.qualification_score = score;
        events.push({ type: "score_changed", meta: { to: score } });
      }
    }
    if (d.next_contact_at !== undefined) {
      const next = d.next_contact_at ? new Date(d.next_contact_at).toISOString() : null;
      if (next !== lead.next_contact_at) {
        patch.next_contact_at = next;
        events.push({ type: "next_contact_set", meta: { to: next } });
      }
    }
    if (!events.length) return { ok: true };
    await store.update("leads", { id: d.id }, patch);
    for (const e of events) {
      await store.insert("lead_activities", { lead_id: d.id, actor_id: session.userId, event_type: e.type, metadata: e.meta });
    }
    await audit(session.userId, "lead.update", "lead", d.id, { fields: Object.keys(patch) });
    revalidatePath(`/admin/leads/${d.id}`);
    return { ok: true };
  });
}

export async function addNoteAction(_: unknown, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const session = await requireAction("leads:write");
    const { id, body } = z.object({ id: z.string().uuid(), body: z.string().trim().min(1, "Write a note first").max(5000) }).parse(Object.fromEntries(form));
    const store = userStore();
    await store.insert("lead_notes", { lead_id: id, author_id: session.userId, body });
    await store.insert("lead_activities", { lead_id: id, actor_id: session.userId, event_type: "note_added", metadata: {} });
    revalidatePath(`/admin/leads/${id}`);
    return { ok: true };
  });
}

export async function addTaskAction(_: unknown, form: FormData): Promise<ActionState> {
  return guard(async () => {
    const session = await requireAction("leads:write");
    const d = z
      .object({ id: z.string().uuid(), title: z.string().trim().min(1, "Add a task title").max(300), due_at: z.string().optional(), assignee_id: z.string().optional() })
      .parse(Object.fromEntries(form));
    const store = userStore();
    await store.insert("lead_tasks", {
      lead_id: d.id,
      title: d.title,
      due_at: d.due_at ? new Date(d.due_at).toISOString() : null,
      assignee_id: d.assignee_id || session.userId,
      completed_at: null,
    });
    await store.insert("lead_activities", { lead_id: d.id, actor_id: session.userId, event_type: "task_added", metadata: { title: d.title } });
    revalidatePath(`/admin/leads/${d.id}`);
    return { ok: true };
  });
}

export async function toggleTaskAction(form: FormData) {
  const session = await requireAction("leads:write");
  const { id, lead_id, done } = z.object({ id: z.string().uuid(), lead_id: z.string().uuid(), done: z.enum(["0", "1"]) }).parse(Object.fromEntries(form));
  const store = userStore();
  await store.update("lead_tasks", { id }, { completed_at: done === "1" ? new Date().toISOString() : null });
  if (done === "1") await store.insert("lead_activities", { lead_id, actor_id: session.userId, event_type: "task_completed", metadata: {} });
  revalidatePath(`/admin/leads/${lead_id}`);
}

export async function quickStatusAction(form: FormData) {
  const session = await requireAction("leads:write");
  const { id, status } = z.object({ id: z.string().uuid(), status: z.enum(["spam", "archived", "new"]) }).parse(Object.fromEntries(form));
  const store = userStore();
  const lead = await store.first<Lead>("leads", { id });
  if (!lead) return;
  await store.update("leads", { id }, { status });
  await store.insert("lead_activities", { lead_id: id, actor_id: session.userId, event_type: "status_changed", metadata: { from: lead.status, to: status } });
  await audit(session.userId, `lead.${status === "new" ? "restore" : status}`, "lead", id);
  revalidatePath(`/admin/leads/${id}`);
}

export async function deleteLeadAction(form: FormData) {
  const session = await requireAction("leads:delete");
  const { id, confirm } = z.object({ id: z.string().uuid(), confirm: z.string() }).parse(Object.fromEntries(form));
  const store = userStore();
  const lead = await store.first<Lead>("leads", { id });
  if (!lead || confirm !== lead.reference_code) redirect(`/admin/leads/${id}?deleteError=1`);
  // Child rows cascade in Postgres; the local store removes them explicitly.
  if (store.kind === "local") {
    for (const t of ["lead_requirements", "lead_notes", "lead_activities", "lead_tasks", "notification_outbox"] as const) {
      await store.remove(t, { lead_id: id });
    }
  }
  await store.remove("leads", { id });
  await audit(session.userId, "lead.delete", "lead", id, { reference: lead!.reference_code });
  redirect("/admin/leads?deleted=1");
}
