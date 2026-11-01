import type { Lead, LeadRequirements } from "@/types";

export type TableName =
  | "profiles"
  | "leads"
  | "lead_requirements"
  | "lead_notes"
  | "lead_activities"
  | "lead_tasks"
  | "services"
  | "industries"
  | "pages"
  | "faqs"
  | "testimonials"
  | "case_studies"
  | "site_settings"
  | "notification_outbox"
  | "audit_logs"
  | "media";

export interface Query {
  /** Column list (Supabase). The local store always returns full rows. */
  select?: string;
  eq?: Record<string, string | number | boolean | null>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

export type NewLead = Omit<Lead, "id" | "created_at" | "updated_at">;
export type NewRequirements = Omit<LeadRequirements, "lead_id">;

/**
 * Minimal table gateway implemented by both the Supabase and the local JSON backend.
 * Domain logic lives in repositories on top of this so both backends behave identically.
 */
export interface Store {
  kind: "local" | "supabase";
  list<T>(table: TableName, q?: Query): Promise<T[]>;
  first<T>(table: TableName, eq: Query["eq"], select?: string): Promise<T | null>;
  insert<T>(table: TableName, row: Record<string, unknown>): Promise<T>;
  update<T>(table: TableName, eq: NonNullable<Query["eq"]>, patch: Record<string, unknown>): Promise<T[]>;
  upsert<T>(table: TableName, row: Record<string, unknown>, onConflict: string): Promise<T>;
  remove(table: TableName, eq: NonNullable<Query["eq"]>): Promise<void>;
  /** Atomically persists lead + requirements + activity + notification outbox. Idempotent on idempotency_key. */
  submitLead(lead: NewLead, requirements: NewRequirements | null): Promise<{ lead: Lead; duplicate: boolean }>;
}
