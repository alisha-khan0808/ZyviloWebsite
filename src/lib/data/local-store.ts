// Local JSON-file backend for development and demos when Supabase is not configured.
// Not intended for production: single-process, file-based, no RLS (authorization is enforced in server code).
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Lead } from "@/types";
import { buildSeedRows } from "./seed-rows";
import type { NewLead, NewRequirements, Query, Store, TableName } from "./store";

type Row = Record<string, unknown>;
type Db = Partial<Record<TableName, Row[]>>;

const PK: Partial<Record<TableName, string>> = { site_settings: "key", lead_requirements: "lead_id" };

function dataDir() {
  return process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".data");
}

let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.catch(() => undefined);
  return run;
}

async function load(): Promise<Db> {
  const file = path.join(dataDir(), "db.json");
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as Db;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    seeding ??= (async () => {
      const db = buildSeedRows() as Db;
      await save(db);
      return db;
    })();
    return clone(await seeding);
  }
}
let seeding: Promise<Db> | null = null;

async function save(db: Db) {
  const dir = dataDir();
  await fs.mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `db.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, path.join(dir, "db.json"));
}

const matches = (row: Row, eq?: Query["eq"]) => !eq || Object.entries(eq).every(([k, v]) => row[k] === v);

function applyQuery(rows: Row[], q?: Query) {
  let out = rows.filter((r) => matches(r, q?.eq));
  if (q?.order) {
    const { column, ascending = true } = q.order;
    out = [...out].sort((a, b) => {
      const av = a[column] as string | number;
      const bv = b[column] as string | number;
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (av > bv ? 1 : -1) * (ascending ? 1 : -1);
    });
  }
  return q?.limit ? out.slice(0, q.limit) : out;
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

function withDefaults(table: TableName, row: Row): Row {
  const ts = new Date().toISOString();
  const base: Row = PK[table] ? {} : { id: randomUUID() };
  if (table !== "site_settings" && table !== "lead_requirements") base.created_at = ts;
  return { ...base, ...row, ...(table === "audit_logs" || table === "lead_activities" ? {} : { updated_at: ts }) };
}

export const localStore: Store = {
  kind: "local",
  async list<T>(table: TableName, q?: Query) {
    const db = await load();
    return clone(applyQuery(db[table] ?? [], q)) as T[];
  },
  async first<T>(table: TableName, eq: Query["eq"]) {
    const db = await load();
    const row = (db[table] ?? []).find((r) => matches(r, eq));
    return row ? (clone(row) as T) : null;
  },
  insert<T>(table: TableName, row: Row) {
    return withLock(async () => {
      const db = await load();
      const full = withDefaults(table, row);
      db[table] = [...(db[table] ?? []), full];
      await save(db);
      return clone(full) as T;
    });
  },
  update<T>(table: TableName, eq: NonNullable<Query["eq"]>, patch: Row) {
    return withLock(async () => {
      const db = await load();
      const updated: Row[] = [];
      db[table] = (db[table] ?? []).map((r) => {
        if (!matches(r, eq)) return r;
        const next = { ...r, ...patch, updated_at: new Date().toISOString() };
        updated.push(next);
        return next;
      });
      await save(db);
      return clone(updated) as T[];
    });
  },
  upsert<T>(table: TableName, row: Row, onConflict: string) {
    return withLock(async () => {
      const db = await load();
      const rows = db[table] ?? [];
      const idx = rows.findIndex((r) => r[onConflict] === row[onConflict]);
      const next = idx >= 0 ? { ...rows[idx], ...row, updated_at: new Date().toISOString() } : withDefaults(table, row);
      if (idx >= 0) rows[idx] = next;
      else rows.push(next);
      db[table] = rows;
      await save(db);
      return clone(next) as T;
    });
  },
  remove(table: TableName, eq: NonNullable<Query["eq"]>) {
    return withLock(async () => {
      const db = await load();
      db[table] = (db[table] ?? []).filter((r) => !matches(r, eq));
      await save(db);
    });
  },
  submitLead(lead: NewLead, requirements: NewRequirements | null) {
    return withLock(async () => {
      const db = await load();
      const existing = (db.leads ?? []).find((l) => l.idempotency_key === lead.idempotency_key);
      if (existing) return { lead: clone(existing) as unknown as Lead, duplicate: true };
      // Build everything first, then commit in a single write (all-or-nothing).
      const row = withDefaults("leads", lead as unknown as Row);
      const id = row.id as string;
      const ts = row.created_at as string;
      db.leads = [...(db.leads ?? []), row];
      if (requirements) db.lead_requirements = [...(db.lead_requirements ?? []), { lead_id: id, ...requirements }];
      db.lead_activities = [
        ...(db.lead_activities ?? []),
        { id: randomUUID(), lead_id: id, actor_id: null, event_type: "lead_submitted", metadata: { form_type: lead.form_type, source: lead.source }, created_at: ts },
      ];
      db.notification_outbox = [
        ...(db.notification_outbox ?? []),
        { id: randomUUID(), lead_id: id, kind: "new_lead_admin", status: "pending", attempts: 0, last_error: null, next_retry_at: ts, created_at: ts, updated_at: ts },
      ];
      await save(db);
      return { lead: clone(row) as unknown as Lead, duplicate: false };
    });
  },
};
