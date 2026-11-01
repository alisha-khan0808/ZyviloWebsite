import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { can, canAssignRole, type Permission } from "@/lib/auth/permissions";
import type { Role } from "@/types";

const ALL: Permission[] = ["leads:read", "leads:write", "leads:export", "leads:delete", "analytics:read", "content:write", "settings:write", "team:manage", "audit:read"];

describe("role permissions", () => {
  it("owner and admin have full operational access", () => {
    for (const p of ALL) {
      expect(can("owner", p)).toBe(true);
      expect(can("admin", p)).toBe(true);
    }
  });

  it("sales can work leads but not content, settings, team or deletion", () => {
    expect(can("sales", "leads:read")).toBe(true);
    expect(can("sales", "leads:write")).toBe(true);
    expect(can("sales", "leads:export")).toBe(true);
    for (const p of ["leads:delete", "content:write", "settings:write", "team:manage", "audit:read"] as Permission[]) expect(can("sales", p)).toBe(false);
  });

  it("content editors never see lead PII", () => {
    expect(can("content_editor", "content:write")).toBe(true);
    for (const p of ALL.filter((p) => p !== "content:write")) expect(can("content_editor", p)).toBe(false);
  });

  it("anonymous users have no permissions", () => {
    for (const p of ALL) expect(can(null, p)).toBe(false);
  });

  it("only owners can grant the owner role", () => {
    expect(canAssignRole("owner", "owner")).toBe(true);
    expect(canAssignRole("admin", "owner")).toBe(false);
    expect(canAssignRole("admin", "sales")).toBe(true);
    expect(canAssignRole("sales", "sales")).toBe(false);
  });

  it("app permission matrix matches the RLS has_perm() function", () => {
    const sql = readFileSync(path.join(__dirname, "../supabase/migrations/20261101000000_initial_schema.sql"), "utf8");
    const roleLine = (role: Role) => sql.match(new RegExp(`when '${role}' then (.+)`))?.[1] ?? "";
    for (const role of ["sales", "content_editor"] as Role[]) {
      const line = roleLine(role);
      for (const p of ALL) expect(line.includes(`'${p}'`), `${role} ${p}`).toBe(can(role, p));
    }
    expect(roleLine("owner").trim()).toBe("true");
    expect(roleLine("admin").trim()).toBe("true");
  });
});
