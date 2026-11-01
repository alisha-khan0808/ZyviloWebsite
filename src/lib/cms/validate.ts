import { z } from "zod";
import type { CollectionDef, FieldDef } from "./collections";
import { setPath, getPath } from "./collections";

/** Allows only site-relative paths, in-page anchors, https, and mailto/tel links (blocks javascript: etc.). */
export const safeHref = z
  .string()
  .trim()
  .max(500)
  .refine((v) => /^(\/(?!\/)|#|https:\/\/|mailto:|tel:)/i.test(v), "Use /path, #anchor, https://, mailto: or tel:");

const stepSchema = z.object({
  label: z.string().trim().min(1).max(60),
  kind: z.enum(["trigger", "agent", "system", "human", "outcome", "supervisor"]),
  detail: z.string().trim().max(300).optional().default(""),
  branches: z
    .array(z.object({ label: z.string().trim().min(1).max(60), detail: z.string().trim().max(200).optional().default("") }))
    .max(5)
    .optional(),
});

function fieldSchema(f: FieldDef): z.ZodTypeAny {
  switch (f.type) {
    case "number":
      return z.coerce.number().int().min(0).max(100000).default(0);
    case "boolean":
      return z.boolean().default(false);
    case "slug":
      return z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only").max(80);
    case "list":
      return z.array(z.string().trim().min(1).max(300)).max(30).default([]);
    case "workflow":
      return z.array(stepSchema).min(2, "Add at least two steps").max(8);
    case "select":
      return z.enum(f.options as [string, ...string[]]);
    default: {
      let s = z.string().trim().max(f.max ?? 5000);
      if (f.required) s = s.min(1, `${f.label} is required`);
      return f.required ? s : s.optional().default("");
    }
  }
}

/** Validates an editor payload against the collection definition; returns a clean row. */
export function validateItem(def: CollectionDef, input: Record<string, unknown>) {
  const errors: Record<string, string> = {};
  let row: Record<string, unknown> = {};
  for (const f of def.fields) {
    const res = fieldSchema(f).safeParse(getPath(input, f.key));
    if (res.success) row = setPath(row, f.key, res.data);
    else errors[f.key] = res.error.issues[0]?.message ?? "Invalid value";
  }
  return { row, errors, ok: Object.keys(errors).length === 0 };
}
