import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createUserClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/local-store";
import type { Profile, Session } from "@/types";
import { can, type Permission } from "./permissions";
import { LOCAL_SESSION_COOKIE, verifySession } from "./local-auth";

export const getSession = cache(async (): Promise<Session | null> => {
  if (isSupabaseConfigured()) {
    const supabase = createUserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle<Profile>();
    if (!profile?.active) return null;
    return { userId: profile.id, email: profile.email, displayName: profile.display_name, role: profile.role };
  }
  const uid = verifySession(cookies().get(LOCAL_SESSION_COOKIE)?.value);
  if (!uid) return null;
  const profile = await localStore.first<Profile>("profiles", { id: uid });
  if (!profile?.active) return null;
  return { userId: profile.id, email: profile.email, displayName: profile.display_name, role: profile.role };
});

/** For pages: redirects to login, or to the dashboard home if the role lacks the permission. */
export async function requirePage(permission?: Permission): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (permission && !can(session.role, permission)) redirect(`${adminHome(session)}?denied=1`);
  return session;
}

/** Landing page for a role (content editors have no access to lead data or the KPI overview). */
export function adminHome(session: Session) {
  return can(session.role, "analytics:read") ? "/admin" : "/admin/content";
}

export class AuthError extends Error {}

/** For server actions / route handlers: throws instead of redirecting. */
export async function requireAction(permission: Permission): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthError("Not signed in");
  if (!can(session.role, permission)) throw new AuthError("You don't have permission to do that");
  return session;
}
