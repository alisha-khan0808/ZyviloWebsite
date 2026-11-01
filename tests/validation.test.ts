import { describe, expect, it } from "vitest";
import { discoverySchema, discoveryStep1, quickEnquirySchema, fieldErrors } from "@/lib/validation/lead";
import { safeHref } from "@/lib/cms/validate";

const key = "3f1c2b8e-1d4a-4c5e-9a7b-2c3d4e5f6a7b";

const validQuick = {
  contact_name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "",
  message: "We want WhatsApp enquiries answered after hours.",
  privacy_consent: true,
  idempotency_key: key,
};

const validDiscovery = {
  contact_name: "Ada Lovelace",
  email: "Ada@Example.com",
  company: "Analytical Engines Ltd",
  website: "example.com",
  industry: "Education",
  solution_types: ["AI Chat", "Sales/CRM"],
  pain_points: ["Repetitive questions"],
  current_process: "Admissions staff answer every email by hand.",
  desired_outcome: "Instant answers and booked counselling calls.",
  current_tools: ["CRM", "Email"],
  timeline: "1–3 months",
  budget_range: "Prefer to discuss",
  privacy_consent: true,
  marketing_consent: false,
  idempotency_key: key,
};

describe("quick enquiry validation", () => {
  it("accepts a minimal valid enquiry", () => {
    expect(quickEnquirySchema.safeParse(validQuick).success).toBe(true);
  });

  it("requires an email or a phone number", () => {
    const res = quickEnquirySchema.safeParse({ ...validQuick, email: "", phone: "" });
    expect(res.success).toBe(false);
    if (!res.success) expect(fieldErrors(res.error).email).toMatch(/email or a phone/i);
  });

  it("accepts phone-only enquiries", () => {
    expect(quickEnquirySchema.safeParse({ ...validQuick, email: "", phone: "+44 20 7946 0000" }).success).toBe(true);
  });

  it("requires privacy consent", () => {
    expect(quickEnquirySchema.safeParse({ ...validQuick, privacy_consent: false }).success).toBe(false);
  });

  it("rejects a filled honeypot", () => {
    expect(quickEnquirySchema.safeParse({ ...validQuick, hp: "spam" }).success).toBe(false);
  });

  it("requires an idempotency key", () => {
    expect(quickEnquirySchema.safeParse({ ...validQuick, idempotency_key: "nope" }).success).toBe(false);
  });
});

describe("discovery wizard validation", () => {
  it("accepts a complete brief and normalises email + website", () => {
    const res = discoverySchema.safeParse(validDiscovery);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.email).toBe("ada@example.com");
      expect(res.data.website).toBe("https://example.com");
      expect(res.data.phone).toBe(undefined);
    }
  });

  it("requires free text when industry is Other", () => {
    const res = discoverySchema.safeParse({ ...validDiscovery, industry: "Other", industry_other: "" });
    expect(res.success).toBe(false);
    if (!res.success) expect(fieldErrors(res.error).industry_other).toBeTruthy();
  });

  it("requires at least one solution type", () => {
    expect(discoverySchema.safeParse({ ...validDiscovery, solution_types: [] }).success).toBe(false);
  });

  it("rejects unknown option values", () => {
    expect(discoverySchema.safeParse({ ...validDiscovery, timeline: "Yesterday" }).success).toBe(false);
  });

  it("validates step 1 independently with inline field errors", () => {
    const res = discoveryStep1.safeParse({ contact_name: "", email: "bad", company: "", industry: "" });
    expect(res.success).toBe(false);
    if (!res.success) {
      const e = fieldErrors(res.error);
      expect(Object.keys(e)).toEqual(expect.arrayContaining(["contact_name", "email", "company", "industry"]));
    }
  });
});

describe("CMS link safety", () => {
  it.each(["/solutions", "#see-it-work", "https://example.com", "mailto:hi@zyvilo.com"])("allows %s", (href) => {
    expect(safeHref.safeParse(href).success).toBe(true);
  });
  it.each(["javascript:alert(1)", "//evil.com", "data:text/html,hi", "http://insecure.com"])("blocks %s", (href) => {
    expect(safeHref.safeParse(href).success).toBe(false);
  });
});
