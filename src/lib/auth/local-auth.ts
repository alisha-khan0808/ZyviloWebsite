// Local-mode authentication: scrypt password hashes + HMAC-signed session cookie.
// Supabase Auth replaces this entirely when Supabase is configured.
import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { localStore } from "@/lib/data/local-store";
import type { Profile } from "@/types";

export const LOCAL_SESSION_COOKIE = "zy_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET (32+ chars) is required");
    return "dev-only-insecure-secret-change-me-please-0000";
  }
  return s;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function signSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof uid === "string" && exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

/** Creates the first owner from LOCAL_ADMIN_EMAIL / LOCAL_ADMIN_PASSWORD if none exists yet. */
export async function ensureBootstrapOwner() {
  const email = process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.LOCAL_ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await localStore.first<Profile>("profiles", { email });
  if (existing) return;
  await localStore.insert<Profile>("profiles", {
    email,
    display_name: "Owner",
    role: "owner",
    active: true,
    password_hash: hashPassword(password),
  });
}
