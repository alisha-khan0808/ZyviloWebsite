"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { userStore, serviceStore } from "@/lib/data";
import { AuthError, requireAction } from "@/lib/auth/session";
import { canAssignRole } from "@/lib/auth/permissions";
import { audit } from "@/lib/admin/audit";
import { isSupabaseConfigured, SITE_URL } from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/local-auth";
import { requeue } from "@/lib/notifications/outbox";
import type { HomeContent, PageRow, Profile, Role } from "@/types";
import { getCollection } from "./collections";
import { safeHref, validateItem } from "./validate";

export type CmsResult = { ok: boolean; id?: string; error?: string; errors?: Record<string, string> };

async function run(fn: () => Promise<CmsResult>): Promise<CmsResult> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: err.message };
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Invalid input" };
    console.error("[cms]", (err as Error).message);
    return { ok: false, error: "Could not save. Please try again." };
  }
}

/** Public pages are ISR-cached; refresh everything after a content change so edits go live without a deploy. */
function refreshSite() {
  revalidatePath("/", "layout");
}

// ---------- Collections ----------

export async function saveItemAction(collectionSlug: string, id: string | null, input: Record<string, unknown>): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("content:write");
    const def = getCollection(collectionSlug);
    if (!def) return { ok: false, error: "Unknown collection" };
    const { row, errors, ok } = validateItem(def, input);
    if (!ok) return { ok: false, errors, error: "Please fix the highlighted fields." };
    const store = userStore();
    if ("slug" in row) {
      const clash = await store.first<{ id: string }>(def.key, { slug: row.slug as string });
      if (clash && clash.id !== id) return { ok: false, errors: { slug: "This slug is already used" } };
    }
    const meta = { updated_by: session.userId, updated_at: new Date().toISOString() };
    let savedId = id;
    if (id) await store.update(def.key, { id }, { ...row, ...meta });
    else savedId = (await store.insert<{ id: string }>(def.key, { ...row, ...meta })).id;
    await audit(session.userId, id ? "content.update" : "content.create", def.key, savedId, { published: row.published });
    refreshSite();
    return { ok: true, id: savedId! };
  });
}

export async function deleteItemAction(collectionSlug: string, id: string): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("content:write");
    const def = getCollection(collectionSlug);
    if (!def) return { ok: false, error: "Unknown collection" };
    await userStore().remove(def.key, { id });
    await audit(session.userId, "content.delete", def.key, id);
    refreshSite();
    return { ok: true };
  });
}

// ---------- Homepage ----------

const cta = z.object({ label: z.string().trim().min(1).max(60), href: safeHref });
const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.string().trim().max(120),
    headline: z.string().trim().min(1).max(120),
    subheading: z.string().trim().min(1).max(400),
    primaryCta: cta,
    secondaryCta: cta,
  }),
  sections: z
    .array(
      z.object({
        id: z.enum(["problem", "capabilities", "demo", "workforce", "industries", "process", "why", "testimonials", "faq", "final"]),
        visible: z.boolean(),
        eyebrow: z.string().trim().max(80).optional(),
        heading: z.string().trim().min(1).max(160),
        intro: z.string().trim().max(500).optional(),
        items: z.array(z.object({ title: z.string().trim().min(1).max(100), body: z.string().trim().max(400) })).max(8).optional(),
        cta: cta.optional(),
      }),
    )
    .max(12),
});

export async function saveHomeDraftAction(content: HomeContent): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("content:write");
    const parsed = homeSchema.parse(content);
    await userStore().update("pages", { slug: "home" }, { draft_json: parsed, updated_by: session.userId });
    await audit(session.userId, "content.draft", "pages", "home");
    return { ok: true };
  });
}

export async function publishHomeAction(content: HomeContent): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("content:write");
    const parsed = homeSchema.parse(content);
    await userStore().update("pages", { slug: "home" }, { draft_json: parsed, published_json: parsed, published_at: new Date().toISOString(), updated_by: session.userId });
    await audit(session.userId, "content.publish", "pages", "home");
    refreshSite();
    return { ok: true };
  });
}

export async function discardHomeDraftAction(): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("content:write");
    const store = userStore();
    const page = await store.first<PageRow>("pages", { slug: "home" });
    if (page) await store.update("pages", { slug: "home" }, { draft_json: page.published_json, updated_by: session.userId });
    return { ok: true };
  });
}

// ---------- Site settings ----------

const link = z.object({ label: z.string().trim().min(1).max(60), href: safeHref });
const settingsSchema = z.object({
  name: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(120),
  contactEmail: z.union([z.string().trim().email(), z.literal("")]),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(300),
  bookingUrl: z.union([z.string().trim().url().startsWith("https://"), z.literal("")]),
  social: z.array(link).max(10),
  headerNav: z.array(link).max(8),
  footerColumns: z.array(z.object({ title: z.string().trim().min(1).max(40), links: z.array(link).max(12) })).max(5),
  seo: z.object({ defaultTitle: z.string().trim().min(1).max(80), defaultDescription: z.string().trim().min(1).max(200) }),
});

export async function saveSiteSettingsAction(input: unknown): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("content:write");
    const value = settingsSchema.parse(input);
    await userStore().upsert("site_settings", { key: "site", value_json: value, is_public: true, updated_by: session.userId }, "key");
    await audit(session.userId, "settings.update", "site_settings", "site");
    refreshSite();
    return { ok: true };
  });
}

export async function saveNotificationSettingsAction(recipients: string[]): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("settings:write");
    const list = z.array(z.string().trim().toLowerCase().email()).max(10).parse(recipients.filter(Boolean));
    await userStore().upsert("site_settings", { key: "notifications", value_json: { notificationRecipients: list }, is_public: false, updated_by: session.userId }, "key");
    await audit(session.userId, "settings.notifications", "site_settings", "notifications", { count: list.length });
    return { ok: true };
  });
}

export async function retryNotificationAction(id: string): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("settings:write");
    await requeue(z.string().uuid().parse(id));
    await audit(session.userId, "notification.retry", "notification_outbox", id);
    revalidatePath("/admin/settings");
    return { ok: true };
  });
}

// ---------- Team ----------

const roleEnum = z.enum(["owner", "admin", "sales", "content_editor"]);

export async function inviteMemberAction(input: { email: string; display_name: string; role: Role; password?: string }): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("team:manage");
    const d = z
      .object({ email: z.string().trim().toLowerCase().email(), display_name: z.string().trim().min(1).max(80), role: roleEnum, password: z.string().optional() })
      .parse(input);
    if (!canAssignRole(session.role, d.role)) return { ok: false, error: "Only an owner can grant the owner role." };
    const existing = await userStore().first<Profile>("profiles", { email: d.email });
    if (existing) return { ok: false, error: "A team member with this email already exists." };

    if (isSupabaseConfigured()) {
      // Invite-only: Supabase emails a sign-up link; the profile row grants the role.
      const admin = createServiceClient();
      const { data, error } = await admin.auth.admin.inviteUserByEmail(d.email, { redirectTo: `${SITE_URL}/admin/login` });
      if (error || !data.user) return { ok: false, error: error?.message ?? "Invite failed" };
      await serviceStore().insert("profiles", { id: data.user.id, email: d.email, display_name: d.display_name, role: d.role, active: true });
    } else {
      if (!d.password || d.password.length < 10) return { ok: false, error: "Set a temporary password of at least 10 characters (local mode)." };
      await userStore().insert("profiles", { email: d.email, display_name: d.display_name, role: d.role, active: true, password_hash: hashPassword(d.password) });
    }
    await audit(session.userId, "team.invite", "profile", null, { role: d.role });
    revalidatePath("/admin/settings");
    return { ok: true };
  });
}

export async function updateMemberAction(id: string, patch: { role?: Role; active?: boolean }): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("team:manage");
    const store = userStore();
    const member = await store.first<Profile>("profiles", { id });
    if (!member) return { ok: false, error: "Member not found" };
    if (id === session.userId) return { ok: false, error: "You can't change your own role or access." };
    if (member.role === "owner" && session.role !== "owner") return { ok: false, error: "Only an owner can change another owner." };
    const role = patch.role ? roleEnum.parse(patch.role) : undefined;
    if (role && !canAssignRole(session.role, role)) return { ok: false, error: "Only an owner can grant the owner role." };
    await store.update("profiles", { id }, { ...(role ? { role } : {}), ...(patch.active !== undefined ? { active: patch.active } : {}) });
    await audit(session.userId, "team.update", "profile", id, { role, active: patch.active });
    revalidatePath("/admin/settings");
    return { ok: true };
  });
}

// ---------- Media ----------

export async function updateMediaAltAction(id: string, alt: string): Promise<CmsResult> {
  return run(async () => {
    await requireAction("content:write");
    await userStore().update("media", { id }, { alt: z.string().trim().max(200).parse(alt) });
    revalidatePath("/admin/content/media");
    return { ok: true };
  });
}

export async function deleteMediaAction(id: string): Promise<CmsResult> {
  return run(async () => {
    const session = await requireAction("content:write");
    const store = userStore();
    const row = await store.first<{ path: string }>("media", { id });
    if (!row) return { ok: true };
    if (isSupabaseConfigured()) await createServiceClient().storage.from("media").remove([row.path]);
    else {
      const { promises: fs } = await import("node:fs");
      const path = await import("node:path");
      await fs.rm(path.join(process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".data"), "uploads", path.basename(row.path)), { force: true });
    }
    await store.remove("media", { id });
    await audit(session.userId, "media.delete", "media", id);
    revalidatePath("/admin/content/media");
    return { ok: true };
  });
}
