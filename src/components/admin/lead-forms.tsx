"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Check, Copy, Loader2 } from "lucide-react";
import { addNoteAction, addTaskAction, updateLeadAction, type ActionState } from "@/lib/admin/lead-actions";
import { STATUS_LABELS } from "@/lib/admin/labels";
import { LEAD_PRIORITIES, LEAD_STATUSES, type Lead, type Profile } from "@/types";

function SubmitButton({ children, className = "btn-primary !py-2" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" className="text-sm text-red-600">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm text-emerald-700">Saved.</p>;
  return null;
}

// datetime-local inputs expect local wall-clock time, not UTC.
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export function LeadUpdateForm({ lead, team }: { lead: Lead; team: Profile[] }) {
  const [state, action] = useFormState(updateLeadAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={lead.id} />
      <label className="block">
        <span className="label">Status</span>
        <select name="status" defaultValue={lead.status} className="input">
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Owner</span>
        <select name="owner_id" defaultValue={lead.owner_id ?? ""} className="input">
          <option value="">Unassigned</option>
          {team.filter((t) => t.active && t.role !== "content_editor").map((t) => (
            <option key={t.id} value={t.id}>{t.display_name}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Priority</span>
          <select name="priority" defaultValue={lead.priority} className="input capitalize">
            {LEAD_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Score (0–100)</span>
          <input name="qualification_score" type="number" min={0} max={100} defaultValue={lead.qualification_score ?? ""} className="input" />
        </label>
      </div>
      <label className="block">
        <span className="label">Next contact</span>
        <input name="next_contact_at" type="datetime-local" defaultValue={toLocalInput(lead.next_contact_at)} className="input" />
      </label>
      <div className="flex items-center gap-3">
        <SubmitButton>Save changes</SubmitButton>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action] = useFormState(addNoteAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="id" value={leadId} />
      <label htmlFor="note-body" className="sr-only">New internal note</label>
      <textarea id="note-body" name="body" required maxLength={5000} placeholder="Add an internal note (not visible to the client)…" className="input min-h-[90px]" />
      <div className="flex items-center gap-3">
        <SubmitButton className="btn-secondary !py-2">Add note</SubmitButton>
        {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}

export function TaskForm({ leadId, team }: { leadId: string; team: Profile[] }) {
  const [state, action] = useFormState(addTaskAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <input type="hidden" name="id" value={leadId} />
      <input name="title" required placeholder="Follow-up task, e.g. Send proposal draft" aria-label="Task title" className="input sm:col-span-2" />
      <input name="due_at" type="date" aria-label="Due date" className="input" />
      <select name="assignee_id" aria-label="Assignee" className="input" defaultValue="">
        <option value="">Assign to me</option>
        {team.filter((t) => t.active && t.role !== "content_editor").map((t) => (
          <option key={t.id} value={t.id}>{t.display_name}</option>
        ))}
      </select>
      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton className="btn-secondary !py-2">Add task</SubmitButton>
        {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs text-muted hover:bg-lavender hover:text-purple"
      aria-label={`Copy ${label}`}
    >
      {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}
