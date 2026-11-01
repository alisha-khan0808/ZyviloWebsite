import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lead } from "@/types";
import type { NewLead, NewRequirements, Query, Store, TableName } from "./store";

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function supabaseStore(client: SupabaseClient): Store {
  return {
    kind: "supabase",
    async list<T>(table: TableName, q?: Query) {
      let query = client.from(table).select(q?.select ?? "*");
      for (const [k, v] of Object.entries(q?.eq ?? {})) query = v === null ? query.is(k, null) : query.eq(k, v);
      if (q?.order) query = query.order(q.order.column, { ascending: q.order.ascending ?? true });
      if (q?.limit) query = query.limit(q.limit);
      else query = query.limit(10000);
      return check(await query) as T[];
    },
    async first<T>(table: TableName, eq: Query["eq"], select = "*") {
      let query = client.from(table).select(select);
      for (const [k, v] of Object.entries(eq ?? {})) query = v === null ? query.is(k, null) : query.eq(k, v);
      return check(await query.limit(1).maybeSingle()) as T | null;
    },
    async insert<T>(table: TableName, row: Record<string, unknown>) {
      return check(await client.from(table).insert(row).select("*").single()) as T;
    },
    async update<T>(table: TableName, eq: NonNullable<Query["eq"]>, patch: Record<string, unknown>) {
      let query = client.from(table).update(patch);
      for (const [k, v] of Object.entries(eq)) query = v === null ? query.is(k, null) : query.eq(k, v);
      return check(await query.select("*")) as T[];
    },
    async upsert<T>(table: TableName, row: Record<string, unknown>, onConflict: string) {
      return check(await client.from(table).upsert(row, { onConflict }).select("*").single()) as T;
    },
    async remove(table: TableName, eq: NonNullable<Query["eq"]>) {
      let query = client.from(table).delete();
      for (const [k, v] of Object.entries(eq)) query = v === null ? query.is(k, null) : query.eq(k, v);
      check(await query);
    },
    async submitLead(lead: NewLead, requirements: NewRequirements | null) {
      // Single Postgres function = one transaction (see supabase/migrations).
      const data = check(await client.rpc("submit_lead", { p_lead: lead, p_requirements: requirements })) as {
        lead: Lead;
        duplicate: boolean;
      };
      return data;
    },
  };
}
