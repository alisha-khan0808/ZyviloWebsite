// Declarative CMS collection definitions shared by the admin editor (client) and server validation.
import { ICON_NAMES } from "@/components/ui/icon";
import { STEP_KINDS } from "@/components/workflows/step-meta";

export type FieldType = "text" | "textarea" | "slug" | "number" | "boolean" | "select" | "list" | "workflow" | "icon";

export interface FieldDef {
  key: string; // supports one level of nesting, e.g. "seo_json.title"
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  hint?: string;
  max?: number;
}

export interface CollectionDef {
  key: "services" | "industries" | "faqs" | "testimonials" | "case_studies";
  slug: string; // URL segment under /admin/content
  label: string;
  singular: string;
  titleField: string;
  publicPath?: (item: Record<string, unknown>) => string | null;
  note?: string;
  fields: FieldDef[];
}

const seo: FieldDef[] = [
  { key: "seo_json.title", label: "SEO title", type: "text", max: 70, hint: "Shown in search results and browser tabs" },
  { key: "seo_json.description", label: "SEO description", type: "textarea", max: 170 },
];

const common: FieldDef[] = [
  { key: "sort_order", label: "Sort order", type: "number" },
  { key: "published", label: "Published", type: "boolean", hint: "Unpublished items are only visible in preview mode" },
];

export const COLLECTIONS: CollectionDef[] = [
  {
    key: "services",
    slug: "services",
    label: "Services",
    singular: "service",
    titleField: "name",
    publicPath: (i) => `/solutions/${i.slug}`,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, max: 80 },
      { key: "slug", label: "Slug", type: "slug", required: true, hint: "URL: /solutions/<slug>" },
      { key: "tagline", label: "Tagline", type: "text", required: true, max: 80 },
      { key: "summary", label: "One-sentence summary", type: "textarea", required: true, max: 300 },
      { key: "body", label: "Description", type: "textarea", max: 2000 },
      { key: "example", label: "Example", type: "textarea", max: 400 },
      { key: "icon", label: "Icon", type: "icon" },
      { key: "category", label: "Category", type: "select", options: ["agent", "team", "automation", "capability"], required: true },
      { key: "flagship", label: "Show on homepage workforce section", type: "boolean" },
      { key: "problems", label: "Problems solved", type: "list" },
      { key: "capabilities", label: "Capabilities", type: "list" },
      { key: "scenarios", label: "Example scenarios", type: "list" },
      { key: "integrations", label: "Typical integrations", type: "list", hint: "Only list integrations that are genuinely possible" },
      { key: "workflow_json", label: "Example workflow", type: "workflow" },
      ...seo,
      ...common,
    ],
  },
  {
    key: "industries",
    slug: "industries",
    label: "Industries",
    singular: "industry",
    titleField: "name",
    publicPath: (i) => `/industries/${i.slug}`,
    fields: [
      { key: "name", label: "Name", type: "text", required: true, max: 80 },
      { key: "slug", label: "Slug", type: "slug", required: true, hint: "URL: /industries/<slug>" },
      { key: "icon", label: "Icon", type: "icon" },
      { key: "summary", label: "Summary", type: "textarea", required: true, max: 300 },
      { key: "pain_point", label: "Headline pain point", type: "textarea", required: true, max: 300 },
      { key: "sample_solution", label: "Sample AI solution", type: "textarea", required: true, max: 400 },
      { key: "outcome", label: "Outcome", type: "textarea", required: true, max: 300 },
      { key: "pain_points_json", label: "Pain points", type: "list" },
      { key: "integrations", label: "Suggested integrations", type: "list" },
      { key: "outcomes", label: "Business outcomes", type: "list" },
      { key: "solution_slugs", label: "Relevant service slugs", type: "list", hint: "e.g. zyvilo-connect (2–4 recommended)" },
      { key: "workflow_json", label: "Example workflow", type: "workflow" },
      ...seo,
      ...common,
    ],
  },
  {
    key: "faqs",
    slug: "faqs",
    label: "FAQs",
    singular: "FAQ",
    titleField: "question",
    fields: [
      { key: "question", label: "Question", type: "text", required: true, max: 200 },
      { key: "answer", label: "Answer", type: "textarea", required: true, max: 2000 },
      { key: "scope", label: "Where it appears", type: "text", required: true, hint: "home · service:<slug> · industry:<slug>", max: 80 },
      ...common,
    ],
  },
  {
    key: "testimonials",
    slug: "testimonials",
    label: "Testimonials",
    singular: "testimonial",
    titleField: "attribution",
    note: "Only publish genuine testimonials with recorded permission. Never add placeholder or invented reviews.",
    fields: [
      { key: "quote", label: "Quote", type: "textarea", required: true, max: 600 },
      { key: "attribution", label: "Name & role", type: "text", required: true, max: 120 },
      { key: "company", label: "Company", type: "text", max: 120 },
      { key: "consent_record", label: "Permission record", type: "text", required: true, hint: "e.g. 'Email from client, 2026-10-03, stored in Drive/Consents'", max: 300 },
      ...common,
    ],
  },
  {
    key: "case_studies",
    slug: "case-studies",
    label: "Case studies",
    singular: "case study",
    titleField: "title",
    note: "Publish only with the client's written permission. Report outcomes you can verify.",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, max: 140 },
      { key: "slug", label: "Slug", type: "slug", required: true },
      { key: "client", label: "Client", type: "text", required: true, max: 120 },
      { key: "summary", label: "Summary", type: "textarea", required: true, max: 400 },
      { key: "challenge", label: "Challenge", type: "textarea", max: 2000 },
      { key: "solution", label: "Solution", type: "textarea", max: 2000 },
      { key: "outcome", label: "Verified outcome", type: "textarea", max: 2000 },
      { key: "permission_record", label: "Permission record", type: "text", required: true, max: 300 },
      ...common,
    ],
  },
];

export const STEP_KIND_OPTIONS = STEP_KINDS;
export const ICON_OPTIONS = ICON_NAMES;

export function getCollection(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug) ?? null;
}

export function getPath(obj: Record<string, unknown>, key: string): unknown {
  const [a, b] = key.split(".");
  const v = obj[a];
  return b ? (v as Record<string, unknown> | undefined)?.[b] : v;
}

export function setPath(obj: Record<string, unknown>, key: string, value: unknown) {
  const [a, b] = key.split(".");
  if (!b) return { ...obj, [a]: value };
  return { ...obj, [a]: { ...((obj[a] as Record<string, unknown>) ?? {}), [b]: value } };
}
