"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowDown, ArrowUp, Eye, Loader2, Plus, Trash2, X } from "lucide-react";
import { getCollection, getPath, setPath, ICON_OPTIONS, STEP_KIND_OPTIONS, type FieldDef } from "@/lib/cms/collections";
import { deleteItemAction, saveItemAction } from "@/lib/cms/actions";
import type { WorkflowStep } from "@/types";

type Item = Record<string, unknown>;

export function CollectionManager({ collectionSlug, items, previewPaths }: { collectionSlug: string; items: Item[]; previewPaths: Record<string, string | null> }) {
  const def = getCollection(collectionSlug)!;
  const router = useRouter();
  const [editing, setEditing] = useState<Item | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const blank = (): Item => {
    let it: Item = { published: false, sort_order: items.length + 1 };
    for (const f of def.fields) if (getPath(it, f.key) === undefined) it = setPath(it, f.key, f.type === "list" || f.type === "workflow" ? [] : f.type === "boolean" ? false : f.type === "select" ? f.options?.[0] : "");
    if (def.key === "faqs") it.scope = "home";
    if (def.fields.some((f) => f.key === "icon")) it.icon = "Sparkles";
    return it;
  };

  const save = () =>
    start(async () => {
      setMessage(null);
      const res = await saveItemAction(collectionSlug, (editing?.id as string) ?? null, editing!);
      setErrors(res.errors ?? {});
      if (res.ok) {
        setMessage({ ok: true, text: "Saved." });
        setEditing((e) => ({ ...e!, id: res.id }));
        router.refresh();
      } else setMessage({ ok: false, text: res.error ?? "Could not save." });
    });

  const remove = (id: string) =>
    start(async () => {
      if (!confirm(`Delete this ${def.singular}? This cannot be undone.`)) return;
      const res = await deleteItemAction(collectionSlug, id);
      if (res.ok) {
        setEditing(null);
        router.refresh();
      } else setMessage({ ok: false, text: res.error ?? "Could not delete." });
    });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_1fr]">
      <div>
        <button
          className="btn-primary mb-4 w-full !py-2"
          onClick={() => {
            setEditing(blank());
            setErrors({});
            setMessage(null);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden /> New {def.singular}
        </button>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {items.map((it) => (
            <li key={it.id as string}>
              <button
                onClick={() => {
                  setEditing(it);
                  setErrors({});
                  setMessage(null);
                }}
                className={clsx("flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-lavender/40", editing?.id === it.id && "bg-lavender/60")}
              >
                <span className="truncate font-medium">{String(getPath(it, def.titleField) || "(untitled)")}</span>
                <span className={clsx("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", it.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
                  {it.published ? "Published" : "Draft"}
                </span>
              </button>
            </li>
          ))}
          {!items.length && <li className="px-4 py-6 text-center text-sm text-muted">Nothing here yet.</li>}
        </ul>
      </div>

      {editing ? (
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{editing.id ? `Edit ${def.singular}` : `New ${def.singular}`}</h2>
            <button onClick={() => setEditing(null)} className="btn-ghost !p-2" aria-label="Close editor">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-5" key={(editing.id as string) ?? "new"}>
            {def.fields.map((f) => (
              <FieldEditor key={f.key} field={f} value={getPath(editing, f.key)} error={errors[f.key]} onChange={(v) => setEditing((e) => setPath(e!, f.key, v))} />
            ))}
          </div>
          <div className="sticky bottom-0 -mx-5 mt-6 flex flex-wrap items-center gap-2 border-t border-line bg-white px-5 pt-4 sm:-mx-6 sm:px-6">
            <button className="btn-primary !py-2" onClick={save} disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save
            </button>
            {!!editing.id && !!previewPaths[editing.id as string] && (
              <a className="btn-secondary !py-2" target="_blank" href={`/api/preview?path=${encodeURIComponent(previewPaths[editing.id as string]!)}`}>
                <Eye className="h-4 w-4" aria-hidden /> Preview
              </a>
            )}
            {!!editing.id && (
              <button className="btn-ghost !py-2 text-red-600" onClick={() => remove(editing.id as string)} disabled={pending}>
                <Trash2 className="h-4 w-4" aria-hidden /> Delete
              </button>
            )}
            {message && (
              <p role="status" className={clsx("text-sm", message.ok ? "text-emerald-700" : "text-red-600")}>
                {message.text}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-white p-10 text-sm text-muted">Select an item to edit, or create a new one.</div>
      )}
    </div>
  );
}

function FieldEditor({ field: f, value, error, onChange }: { field: FieldDef; value: unknown; error?: string; onChange: (v: unknown) => void }) {
  const id = `f-${f.key.replace(".", "-")}`;
  const label = (
    <label htmlFor={id} className="label">
      {f.label} {f.required && <span className="text-purple">*</span>}
    </label>
  );
  const help = (
    <>
      {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600" role="alert">{error}</p>}
    </>
  );
  const invalid = error ? true : undefined;

  switch (f.type) {
    case "boolean":
      return (
        <div>
          <label className="flex items-center gap-3 text-sm font-medium">
            <input id={id} type="checkbox" className="h-4 w-4 accent-purple" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
            {f.label}
          </label>
          {help}
        </div>
      );
    case "textarea":
      return (
        <div>
          {label}
          <textarea id={id} aria-invalid={invalid} className="input min-h-[90px]" maxLength={f.max} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
          {help}
        </div>
      );
    case "number":
      return (
        <div>
          {label}
          <input id={id} type="number" className="input max-w-[140px]" value={(value as number) ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
          {help}
        </div>
      );
    case "select":
    case "icon":
      return (
        <div>
          {label}
          <select id={id} className="input" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
            {(f.type === "icon" ? ICON_OPTIONS : f.options ?? []).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          {help}
        </div>
      );
    case "list":
      return (
        <div>
          {label}
          <ListInput id={id} invalid={invalid} value={(value as string[]) ?? []} onChange={onChange} />
          <p className="mt-1 text-xs text-muted">One item per line.{f.hint ? ` ${f.hint}` : ""}</p>
          {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
      );
    case "workflow":
      return (
        <div>
          <p className="label">{f.label}</p>
          <WorkflowEditor steps={(value as WorkflowStep[]) ?? []} onChange={onChange} />
          {help}
        </div>
      );
    default:
      return (
        <div>
          {label}
          <input id={id} aria-invalid={invalid} className="input" maxLength={f.max} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
          {help}
        </div>
      );
  }
}

function WorkflowEditor({ steps, onChange }: { steps: WorkflowStep[]; onChange: (v: WorkflowStep[]) => void }) {
  const update = (i: number, patch: Partial<WorkflowStep>) => onChange(steps.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const move = (i: number, d: number) => {
    const next = [...steps];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg p-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
            <input aria-label={`Step ${i + 1} label`} className="input" placeholder="Step label" value={s.label} onChange={(e) => update(i, { label: e.target.value })} />
            <select aria-label={`Step ${i + 1} type`} className="input" value={s.kind} onChange={(e) => update(i, { kind: e.target.value as WorkflowStep["kind"] })}>
              {STEP_KIND_OPTIONS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <div className="flex gap-1">
              <button type="button" className="btn-ghost !p-2" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" className="btn-ghost !p-2" disabled={i === steps.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" className="btn-ghost !p-2 text-red-600" onClick={() => onChange(steps.filter((_, j) => j !== i))} aria-label="Remove step"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
          <input aria-label={`Step ${i + 1} description`} className="input mt-2" placeholder="Plain-English description" value={s.detail ?? ""} onChange={(e) => update(i, { detail: e.target.value })} />
          <BranchInput step={s} index={i} onChange={(branches) => update(i, { branches })} />
        </div>
      ))}
      <button type="button" className="btn-secondary !py-2" disabled={steps.length >= 8} onClick={() => onChange([...steps, { label: "", kind: "system", detail: "" }])}>
        <Plus className="h-4 w-4" aria-hidden /> Add step
      </button>
    </div>
  );
}

function BranchInput({ step, index, onChange }: { step: WorkflowStep; index: number; onChange: (b: WorkflowStep["branches"]) => void }) {
  const [text, setText] = useState((step.branches ?? []).map((b) => b.label).join(", "));
  return (
    <input
      aria-label={`Step ${index + 1} parallel branches`}
      className="input mt-2"
      placeholder="Parallel branches (optional): Agent A, Agent B, Agent C"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const branches = text
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean)
          .map((label) => ({ label, detail: step.branches?.find((b) => b.label === label)?.detail ?? "" }));
        onChange(branches.length ? branches : undefined);
      }}
    />
  );
}

const NL = String.fromCharCode(10);

function ListInput({ id, invalid, value, onChange }: { id: string; invalid?: boolean; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(NL));
  return (
    <textarea
      id={id}
      aria-invalid={invalid}
      className="input min-h-[90px] font-mono text-xs"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value.split(NL).map((x) => x.trim()).filter(Boolean));
      }}
    />
  );
}
