"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/config";
import { createUserClient } from "@/lib/supabase/server";
import { localStore } from "@/lib/data/local-store";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/admin/audit";
import type { Profile } from "@/types";
import { ensureBootstrapOwner, LOCAL_SESSION_COOKIE, signSession, verifyPassword } from "./local-auth";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });

export async function loginAction(_: unknown, form: FormData): Promise<{ error?: string }> {
  const ip = clientIp(headers());
  if (!rateLimit(`login:${ip}`, 10, 15 * 60_000).ok) return { error: "Too many attempts. Try again in a few minutes." };
  const parsed = schema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter your email and password." };
  const { email, password } = parsed.data;
  const generic = "Email or password is incorrect, or the account is not active.";

  if (isSupabaseConfigured()) {
    const supabase = createUserClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: generic };
    const { data: profile } = await supabase.from("profiles").select("active").eq("id", data.user.id).maybeSingle();
    if (!profile?.active) {
      await supabase.auth.signOut();
      return { error: generic };
    }
    await audit(data.user.id, "auth.login", "profile", data.user.id);
  } else {
    await ensureBootstrapOwner();
    const profile = await localStore.first<Profile>("profiles", { email });
    if (!profile?.active || !profile.password_hash || !verifyPassword(password, profile.password_hash)) return { error: generic };
    cookies().set(LOCAL_SESSION_COOKIE, signSession(profile.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    await audit(profile.id, "auth.login", "profile", profile.id);
  }
  redirect("/admin");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) await createUserClient().auth.signOut();
  cookies().delete(LOCAL_SESSION_COOKIE);
  redirect("/admin/login");
}
