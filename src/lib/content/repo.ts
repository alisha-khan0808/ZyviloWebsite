import "server-only";
import { cache } from "react";
import { draftMode } from "next/headers";
import { publicStore, userStore } from "@/lib/data";
import type { Store } from "@/lib/data";
import type { CaseStudy, Faq, HomeContent, Industry, PageRow, Service, SiteSettings, SiteSettingRow, Testimonial } from "@/types";
import { buildSeedRows } from "@/lib/data/seed-rows";
import { seedHome, seedSiteSettings } from "./seed";

/** Draft mode is enabled only through /api/preview after an admin permission check. */
function isPreview() {
  try {
    return draftMode().isEnabled;
  } catch {
    return false;
  }
}

function store(): Store {
  return isPreview() ? userStore() : publicStore();
}

async function safe<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[content] read failed, using seed fallback:", (err as Error).message);
    return fallback();
  }
}

const seedFallback = <T>(table: "services" | "industries" | "faqs") => () =>
  (buildSeedRows()[table] ?? []) as unknown as T[];

export const getHome = cache(async (): Promise<HomeContent> => {
  const preview = isPreview();
  // Anonymous readers may only select published columns (see migration column grants).
  const cols = preview ? "*" : "id,slug,published_json,seo_json,published_at,updated_at";
  const page = await safe(() => store().first<PageRow>("pages", { slug: "home" }, cols), () => null);
  const content = page ? (preview ? page.draft_json : page.published_json) : seedHome;
  // Merge so newly introduced sections still render if older content lacks them.
  const ids = new Set(content.sections.map((s) => s.id));
  return { ...content, sections: [...content.sections, ...seedHome.sections.filter((s) => !ids.has(s.id))] };
});

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const row = await safe(() => publicStore().first<SiteSettingRow>("site_settings", { key: "site" }), () => null);
  return { ...seedSiteSettings, ...((row?.value_json as Partial<SiteSettings>) ?? {}) };
});

function published<T extends { published: boolean }>(rows: T[]) {
  return isPreview() ? rows : rows.filter((r) => r.published);
}

export const listServices = cache(async (): Promise<Service[]> =>
  published(
    await safe(
      () => store().list<Service>("services", { order: { column: "sort_order" } }),
      seedFallback<Service>("services"),
    ),
  ),
);

export const getService = cache(async (slug: string) => (await listServices()).find((s) => s.slug === slug) ?? null);

export const listIndustries = cache(async (): Promise<Industry[]> =>
  published(
    await safe(
      () => store().list<Industry>("industries", { order: { column: "sort_order" } }),
      seedFallback<Industry>("industries"),
    ),
  ),
);

export const getIndustry = cache(async (slug: string) => (await listIndustries()).find((s) => s.slug === slug) ?? null);

export const listFaqs = cache(async (scope: string): Promise<Faq[]> =>
  published(
    await safe(
      () => store().list<Faq>("faqs", { eq: { scope }, order: { column: "sort_order" } }),
      () => seedFallback<Faq>("faqs")().filter((f) => f.scope === scope),
    ),
  ),
);

export const listTestimonials = cache(async (): Promise<Testimonial[]> =>
  published(await safe(() => store().list<Testimonial>("testimonials", { order: { column: "sort_order" } }), () => [])),
);

export const listCaseStudies = cache(async (): Promise<CaseStudy[]> =>
  published(await safe(() => store().list<CaseStudy>("case_studies", { order: { column: "sort_order" } }), () => [])),
);
