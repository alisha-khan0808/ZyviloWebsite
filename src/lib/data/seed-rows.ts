import { randomUUID } from "node:crypto";
import { seedFaqs, seedHome, seedIndustries, seedPrivateSettings, seedServices, seedSiteSettings, SEED_TIMESTAMP } from "@/lib/content/seed";
import type { TableName } from "./store";

/** Builds initial CMS rows from seed content. Used by the local store and the Supabase seed script. */
export function buildSeedRows(): Partial<Record<TableName, Record<string, unknown>[]>> {
  const meta = { updated_at: SEED_TIMESTAMP, updated_by: null, published: true };
  return {
    services: seedServices.map((s, i) => ({ id: randomUUID(), ...s, ...meta, sort_order: i + 1 })),
    industries: seedIndustries.map((s, i) => ({ id: randomUUID(), ...s, ...meta, sort_order: i + 1 })),
    faqs: seedFaqs.map((f) => ({ id: randomUUID(), ...f, ...meta })),
    pages: [
      {
        id: randomUUID(),
        slug: "home",
        draft_json: seedHome,
        published_json: seedHome,
        seo_json: {},
        published_at: SEED_TIMESTAMP,
        updated_at: SEED_TIMESTAMP,
        updated_by: null,
      },
    ],
    site_settings: [
      { key: "site", value_json: seedSiteSettings, is_public: true, updated_at: SEED_TIMESTAMP, updated_by: null },
      { key: "notifications", value_json: seedPrivateSettings, is_public: false, updated_at: SEED_TIMESTAMP, updated_by: null },
    ],
  };
}
