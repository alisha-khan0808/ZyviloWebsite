import "server-only";
import { isSupabaseConfigured } from "@/lib/config";
import { createAnonClient, createServiceClient, createUserClient } from "@/lib/supabase/server";
import { localStore } from "./local-store";
import { supabaseStore } from "./supabase-store";
import type { Store } from "./store";

/** Public, RLS-restricted reads (published content only). */
export function publicStore(): Store {
  return isSupabaseConfigured() ? supabaseStore(createAnonClient()) : localStore;
}

/** Acts as the signed-in admin; database RLS enforces their role in Supabase mode. */
export function userStore(): Store {
  return isSupabaseConfigured() ? supabaseStore(createUserClient()) : localStore;
}

/** Privileged server-side access (lead intake, notification worker). Never expose to the browser. */
export function serviceStore(): Store {
  return isSupabaseConfigured() ? supabaseStore(createServiceClient()) : localStore;
}

export type { Store } from "./store";
