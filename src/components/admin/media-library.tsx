"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Upload } from "lucide-react";
import { deleteMediaAction, updateMediaAltAction } from "@/lib/cms/actions";
import type { MediaRow } from "@/types";
import { CopyButton } from "./lead-forms";

export function MediaLibrary({ items }: { items: MediaRow[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Choose an image first.");
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("alt", alt);
    const res = await fetch("/api/admin/media", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Upload failed");
    setAlt("");
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={upload} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 md:flex-row md:items-end">
        <label className="block flex-1">
          <span className="label">Image</span>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="input file:mr-3 file:rounded-full file:border-0 file:bg-lavender file:px-3 file:py-1 file:text-purple" />
        </label>
        <label className="block flex-1">
          <span className="label">Alt text (describe the image)</span>
          <input value={alt} onChange={(e) => setAlt(e.target.value)} className="input" />
        </label>
        <button className="btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />} Upload
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-sm text-muted">No images uploaded yet.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt} className="aspect-video w-full bg-lavender object-cover" />
              <div className="space-y-2 p-3">
                <input
                  defaultValue={m.alt}
                  aria-label="Alt text"
                  placeholder="Alt text"
                  className="input !py-1.5 text-xs"
                  onBlur={(e) => e.target.value !== m.alt && start(async () => void (await updateMediaAltAction(m.id, e.target.value)))}
                />
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{(m.size / 1024).toFixed(0)} KB</span>
                  <span className="flex gap-1">
                    <CopyButton value={m.url} label="image URL" />
                    <button
                      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-red-600 hover:bg-red-50"
                      disabled={pending}
                      onClick={() => confirm("Delete this image?") && start(async () => { await deleteMediaAction(m.id); router.refresh(); })}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                    </button>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
