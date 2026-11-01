import { z } from "zod";
import {
  BUDGET_RANGES,
  BUSINESS_SIZES,
  CONTACT_PREFERENCES,
  CURRENT_TOOLS,
  PAIN_POINTS,
  SOLUTION_TYPES,
  TIMELINES,
  VOLUME_RANGES,
  YES_NO_UNSURE,
} from "./options";

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  trimmed(max)
    .optional()
    .transform((v) => (v ? v : null));
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .union([z.enum(values), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null));

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);
const phone = z
  .string()
  .trim()
  .max(32)
  .regex(/^[+()\d\s.-]*$/, "Use digits, spaces and + ( ) - only");
const website = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : null))
  .refine((v) => v === null || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(v), "Enter a valid website");

/** Attribution captured client-side; never contains PII. */
export const attributionSchema = z
  .object({
    source_page: optionalText(300),
    referrer: optionalText(500),
    utm_source: optionalText(100),
    utm_medium: optionalText(100),
    utm_campaign: optionalText(150),
    utm_term: optionalText(150),
    utm_content: optionalText(150),
  })
  .partial()
  .default({});

const antiBot = {
  idempotency_key: z.string().uuid(),
  hp: z.string().max(0, "Bot detected").optional(), // honeypot must stay empty
  started_at: z.number().int().optional(),
  captcha_token: z.string().max(4096).optional(),
};

export const quickEnquirySchema = z
  .object({
    contact_name: trimmed(120).min(2, "Please enter your name"),
    email: z.union([email, z.literal("")]).optional(),
    phone: z.union([phone, z.literal("")]).optional(),
    company: optionalText(160),
    industry: optionalText(80),
    service_interest: optionalText(80),
    message: trimmed(3000).min(10, "Tell us a little more (at least 10 characters)"),
    privacy_consent: z.literal(true, { errorMap: () => ({ message: "Please accept the privacy notice" }) }),
    marketing_consent: z.boolean().default(false),
    attribution: attributionSchema,
    ...antiBot,
  })
  .refine((d) => !!d.email || !!d.phone, { message: "Provide an email or a phone number", path: ["email"] });

export const discoveryStep1 = z.object({
  contact_name: trimmed(120).min(2, "Please enter your name"),
  email,
  phone: z.union([phone, z.literal("")]).optional(),
  company: trimmed(160).min(1, "Please enter your company or business name"),
  website,
  industry: trimmed(80).min(1, "Please choose an industry"),
  industry_other: optionalText(120),
  business_size: optionalEnum(BUSINESS_SIZES as unknown as [string, ...string[]]),
  country: optionalText(80),
});

export const discoveryStep2 = z.object({
  solution_types: z.array(z.enum(SOLUTION_TYPES)).min(1, "Choose at least one option (or 'Not Sure')"),
  pain_points: z.array(z.enum(PAIN_POINTS)).default([]),
  pain_points_other: optionalText(300),
  current_process: trimmed(5000).min(10, "Describe how this works today (at least 10 characters)"),
  desired_outcome: trimmed(3000).min(5, "Describe what you'd like to happen"),
  current_tools: z.array(z.enum(CURRENT_TOOLS)).default([]),
  current_tools_other: optionalText(300),
  example_steps: optionalText(3000),
  integrations: optionalText(1000),
});

export const discoveryStep3 = z.object({
  volume_range: optionalEnum(VOLUME_RANGES as unknown as [string, ...string[]]),
  timeline: z.enum(TIMELINES, { errorMap: () => ({ message: "Choose a timeline" }) }),
  budget_range: optionalEnum(BUDGET_RANGES as unknown as [string, ...string[]]),
  api_access: optionalEnum(YES_NO_UNSURE as unknown as [string, ...string[]]),
  human_approval: optionalEnum(YES_NO_UNSURE as unknown as [string, ...string[]]),
  sensitive_data_flag: optionalEnum(YES_NO_UNSURE as unknown as [string, ...string[]]),
  contact_preference: optionalEnum(CONTACT_PREFERENCES as unknown as [string, ...string[]]),
  contact_time: optionalText(120),
});

export const discoveryStep4 = z.object({
  privacy_consent: z.literal(true, { errorMap: () => ({ message: "Please accept the privacy notice" }) }),
  marketing_consent: z.boolean().default(false),
});

export const discoverySchema = discoveryStep1
  .merge(discoveryStep2)
  .merge(discoveryStep3)
  .merge(discoveryStep4)
  .extend({
    preselected_solution: optionalText(80),
    preselected_industry: optionalText(80),
    attribution: attributionSchema,
    ...antiBot,
  })
  .refine((d) => d.industry !== "Other" || !!d.industry_other, {
    message: "Tell us your industry",
    path: ["industry_other"],
  });

export type QuickEnquiryInput = z.input<typeof quickEnquirySchema>;
export type DiscoveryInput = z.input<typeof discoverySchema>;

/** Flattens Zod issues into { field: message } for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
