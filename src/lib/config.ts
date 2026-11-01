// Runtime configuration. Server-only values are read lazily so they never reach client bundles.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** Supabase is used when all three variables are present; otherwise a local JSON store powers development. */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export const PRIVACY_CONSENT_VERSION = "2026-11-01";
