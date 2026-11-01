// Shared domain types. Mirrors supabase/migrations — keep in sync.

export type Role = "owner" | "admin" | "sales" | "content_editor";

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "discovery_scheduled",
  "proposal_sent",
  "won",
  "lost",
  "nurture",
  "spam",
  "archived",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_PRIORITIES = ["low", "medium", "high"] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export type StepKind = "trigger" | "agent" | "system" | "human" | "outcome" | "supervisor";

/** A single step in an illustrative workflow. `branches` makes it a parallel step. */
export interface WorkflowStep {
  label: string;
  kind: StepKind;
  detail?: string;
  branches?: { label: string; detail?: string }[];
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  active: boolean;
  password_hash?: string | null; // local mode only
  created_at: string;
}

export interface Lead {
  id: string;
  reference_code: string;
  idempotency_key: string;
  form_type: "quick" | "discovery";
  contact_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  industry: string | null;
  industry_other: string | null;
  country: string | null;
  message: string | null;
  service_interest: string | null;
  status: LeadStatus;
  owner_id: string | null;
  priority: LeadPriority;
  qualification_score: number | null;
  next_contact_at: string | null;
  first_contacted_at: string | null;
  source: string;
  source_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  privacy_consent_at: string;
  privacy_consent_version: string;
  marketing_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadRequirements {
  lead_id: string;
  solution_types: string[];
  pain_points: string[];
  pain_points_other: string | null;
  current_process: string | null;
  desired_outcome: string | null;
  current_tools: string[];
  current_tools_other: string | null;
  example_steps: string | null;
  integrations: string | null;
  business_size: string | null;
  volume_range: string | null;
  budget_range: string | null;
  timeline: string | null;
  api_access: string | null;
  human_approval: string | null;
  sensitive_data_flag: string | null;
  contact_preference: string | null;
  contact_time: string | null;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  actor_id: string | null;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface LeadTask {
  id: string;
  lead_id: string;
  assignee_id: string | null;
  title: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  body: string;
  example: string;
  icon: string;
  category: "agent" | "team" | "automation" | "capability";
  flagship: boolean;
  problems: string[];
  capabilities: string[];
  scenarios: string[];
  integrations: string[];
  workflow_json: WorkflowStep[];
  seo_json: { title?: string; description?: string };
  sort_order: number;
  published: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface Industry {
  id: string;
  slug: string;
  name: string;
  icon: string;
  summary: string;
  pain_point: string;
  sample_solution: string;
  outcome: string;
  pain_points_json: string[];
  integrations: string[];
  outcomes: string[];
  solution_slugs: string[];
  workflow_json: WorkflowStep[];
  seo_json: { title?: string; description?: string };
  sort_order: number;
  published: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  scope: string; // "home" | "service:<slug>" | "industry:<slug>" | "general"
  sort_order: number;
  published: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface Testimonial {
  id: string;
  quote: string;
  attribution: string;
  company: string | null;
  consent_record: string;
  published: boolean;
  sort_order: number;
  updated_at: string;
  updated_by: string | null;
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  client: string;
  summary: string;
  challenge: string;
  solution: string;
  outcome: string;
  permission_record: string;
  published: boolean;
  sort_order: number;
  updated_at: string;
  updated_by: string | null;
}

export interface PageRow {
  id: string;
  slug: string;
  draft_json: HomeContent;
  published_json: HomeContent;
  seo_json: { title?: string; description?: string };
  published_at: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface SiteSettingRow {
  key: string;
  value_json: unknown;
  is_public: boolean;
  updated_at: string;
  updated_by: string | null;
}

export interface OutboxRow {
  id: string;
  lead_id: string;
  kind: string;
  status: "pending" | "sent" | "failed" | "skipped";
  attempts: number;
  last_error: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface MediaRow {
  id: string;
  path: string;
  url: string;
  mime: string;
  size: number;
  alt: string;
  created_at: string;
  created_by: string | null;
}

// ---------- CMS structured content ----------

export interface Cta {
  label: string;
  href: string;
}

export interface HomeContent {
  hero: { eyebrow: string; headline: string; subheading: string; primaryCta: Cta; secondaryCta: Cta };
  sections: HomeSection[];
}

export type HomeSectionId =
  | "problem"
  | "capabilities"
  | "demo"
  | "workforce"
  | "industries"
  | "process"
  | "why"
  | "testimonials"
  | "faq"
  | "final";

export interface HomeSection {
  id: HomeSectionId;
  visible: boolean;
  eyebrow?: string;
  heading: string;
  intro?: string;
  items?: { title: string; body: string }[];
  cta?: Cta;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  contactEmail: string;
  phone: string;
  address: string;
  bookingUrl: string;
  social: { label: string; href: string }[];
  headerNav: Cta[];
  footerColumns: { title: string; links: Cta[] }[];
  seo: { defaultTitle: string; defaultDescription: string };
}

export interface PrivateSettings {
  notificationRecipients: string[];
}

export interface Session {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
}
