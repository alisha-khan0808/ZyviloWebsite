"use client";

export type SubmitResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; fields?: Record<string, string> };

export async function postLead(url: string, payload: unknown): Promise<SubmitResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as SubmitResult | null;
    if (!data) return { ok: false, error: "Something went wrong. Your answers are still here — please try again." };
    return data;
  } catch {
    return { ok: false, error: "Network error. Check your connection — your answers are still here." };
  }
}

export function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
      );
}
