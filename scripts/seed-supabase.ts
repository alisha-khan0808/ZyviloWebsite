/**
 * Seeds starter CMS content into Supabase (services, industries, FAQs, homepage, settings).
 * Safe to re-run: tables that already contain rows are skipped. Never seeds leads or testimonials.
 *
 *   npx tsx --env-file=.env.local scripts/seed-supabase.ts
 *   (Node 18: export the variables in your shell first, then run `npm run seed:supabase`)
 *
 * Optionally bootstraps the first owner profile for an existing Supabase Auth user:
 *   SEED_OWNER_EMAIL=you@company.com npm run seed:supabase
 */
import { createClient } from "@supabase/supabase-js";
import { buildSeedRows } from "../src/lib/data/seed-rows";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  const db = createClient(url, key, { auth: { persistSession: false } });

  const rows = buildSeedRows();
  for (const [table, data] of Object.entries(rows)) {
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
    if (error) throw new Error(`${table}: ${error.message}`);
    if (count && count > 0) {
      console.log(`- ${table}: has ${count} rows, skipped`);
      continue;
    }
    const clean = data!.map(({ updated_by: _u, ...r }) => r);
    const { error: insErr } = await db.from(table).insert(clean);
    if (insErr) throw new Error(`${table}: ${insErr.message}`);
    console.log(`✓ ${table}: inserted ${clean.length}`);
  }

  const ownerEmail = process.env.SEED_OWNER_EMAIL?.toLowerCase();
  if (ownerEmail) {
    const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === ownerEmail);
    if (!user) throw new Error(`No auth user with email ${ownerEmail}. Invite or create the user in Supabase Auth first.`);
    const { error: pErr } = await db.from("profiles").upsert({ id: user.id, email: ownerEmail, display_name: "Owner", role: "owner", active: true });
    if (pErr) throw pErr;
    console.log(`✓ owner profile ready for ${ownerEmail}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
