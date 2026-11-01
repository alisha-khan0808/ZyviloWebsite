"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Loader2, RotateCw, UserPlus } from "lucide-react";
import { inviteMemberAction, retryNotificationAction, saveNotificationSettingsAction, updateMemberAction } from "@/lib/cms/actions";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { Profile, Role, Session } from "@/types";

const NL = String.fromCharCode(10);

function Msg({ m }: { m: { ok: boolean; text: string } | null }) {
  if (!m) return null;
  return <p role="status" className={clsx("text-sm", m.ok ? "text-emerald-700" : "text-red-600")}>{m.text}</p>;
}

export function NotificationSettings({ initial }: { initial: string[] }) {
  const [text, setText] = useState(initial.join(NL));
  const [m, setM] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="label">Recipients (one email per line)</span>
        <textarea className="input min-h-[90px]" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <div className="flex items-center gap-3">
        <button
          className="btn-primary !py-2"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await saveNotificationSettingsAction(text.split(NL).map((s) => s.trim()).filter(Boolean));
              setM(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error ?? "Failed" });
            })
          }
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save
        </button>
        <Msg m={m} />
      </div>
    </div>
  );
}

export function OutboxRetry({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      className="btn-secondary !px-3 !py-1.5 text-xs"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await retryNotificationAction(id);
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <RotateCw className="h-3.5 w-3.5" aria-hidden />} Retry
    </button>
  );
}

export function TeamManager({ team, me, canManage, supabase }: { team: Profile[]; me: Session; canManage: boolean; supabase: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", display_name: "", role: "sales" as Role, password: "" });
  const [m, setM] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const roles = (Object.keys(ROLE_LABELS) as Role[]).filter((r) => r !== "owner" || me.role === "owner");

  const update = (id: string, patch: { role?: Role; active?: boolean }) =>
    start(async () => {
      const r = await updateMemberAction(id, patch);
      setM(r.ok ? { ok: true, text: "Updated." } : { ok: false, text: r.error ?? "Failed" });
      router.refresh();
    });

  return (
    <div className="space-y-5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="pb-2">Member</th>
              <th scope="col" className="pb-2">Role</th>
              <th scope="col" className="pb-2">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {team.map((t) => {
              const locked = !canManage || t.id === me.userId || (t.role === "owner" && me.role !== "owner");
              return (
                <tr key={t.id}>
                  <td className="py-2.5">
                    <span className="font-semibold">{t.display_name}</span>
                    <span className="block text-xs text-muted">{t.email}</span>
                  </td>
                  <td className="py-2.5">
                    <select className="input !w-auto !py-1.5" aria-label={`Role for ${t.display_name}`} value={t.role} disabled={locked || pending} onChange={(e) => update(t.id, { role: e.target.value as Role })}>
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                        <option key={r} value={r} disabled={r === "owner" && me.role !== "owner"}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5">
                    <button className={clsx("btn-secondary !px-3 !py-1.5 text-xs", !t.active && "!text-red-600")} disabled={locked || pending} onClick={() => update(t.id, { active: !t.active })}>
                      {t.active ? "Active — deactivate" : "Inactive — reactivate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        Owner: everything incl. ownership · Admin: leads, analytics, content, settings · Sales: leads, notes, status, exports, analytics · Content Editor: website content only (no lead data).
      </p>
      {canManage && (
        <form
          className="grid gap-3 rounded-xl bg-bg p-4 md:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await inviteMemberAction(form);
              setM(r.ok ? { ok: true, text: supabase ? "Invitation sent." : "Member added." } : { ok: false, text: r.error ?? "Failed" });
              if (r.ok) {
                setForm({ email: "", display_name: "", role: "sales", password: "" });
                router.refresh();
              }
            });
          }}
        >
          <input required type="email" placeholder="Email" aria-label="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Display name" aria-label="Display name" className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          <select aria-label="Role" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {roles.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          {!supabase && (
            <input required type="password" minLength={10} autoComplete="new-password" placeholder="Temporary password" aria-label="Temporary password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
          <button className="btn-primary !py-2" disabled={pending}>
            <UserPlus className="h-4 w-4" aria-hidden /> {supabase ? "Invite" : "Add member"}
          </button>
        </form>
      )}
      <Msg m={m} />
    </div>
  );
}
