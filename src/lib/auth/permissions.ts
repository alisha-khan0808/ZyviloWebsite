import type { Role } from "@/types";

export type Permission =
  | "leads:read"
  | "leads:write"
  | "leads:export"
  | "leads:delete"
  | "analytics:read"
  | "content:write"
  | "settings:write"
  | "team:manage"
  | "audit:read";

// Mirrors the RLS helper functions in supabase/migrations. Change both together.
const MATRIX: Record<Role, Permission[]> = {
  owner: ["leads:read", "leads:write", "leads:export", "leads:delete", "analytics:read", "content:write", "settings:write", "team:manage", "audit:read"],
  admin: ["leads:read", "leads:write", "leads:export", "leads:delete", "analytics:read", "content:write", "settings:write", "team:manage", "audit:read"],
  sales: ["leads:read", "leads:write", "leads:export", "analytics:read"],
  content_editor: ["content:write"],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && MATRIX[role].includes(permission);
}

/** Only owners may grant or revoke the owner role (ownership transfer). */
export function canAssignRole(actor: Role, target: Role): boolean {
  if (!can(actor, "team:manage")) return false;
  return target === "owner" ? actor === "owner" : true;
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  sales: "Sales",
  content_editor: "Content Editor",
};
