// Option lists shared by the public forms, server validation and admin filters.

export const SOLUTION_TYPES = [
  "AI Chat",
  "Voice",
  "Sales/CRM",
  "Customer Support",
  "Workflow",
  "Multi-Agent",
  "Supervisor Agent",
  "End-to-End",
  "Not Sure",
] as const;

export const PAIN_POINTS = [
  "Missed or slow enquiry responses",
  "Repetitive questions",
  "Manual data entry",
  "Scheduling back-and-forth",
  "Follow-ups slip through",
  "Disconnected tools",
  "No visibility into work",
  "Other",
] as const;

export const CURRENT_TOOLS = ["CRM", "WhatsApp", "Email", "Calendar", "ERP", "Spreadsheets", "Custom software", "Other"] as const;

export const BUSINESS_SIZES = ["Just me", "2–10", "11–50", "51–200", "201–1000", "1000+"] as const;
export const VOLUME_RANGES = ["Under 100 / month", "100–1,000 / month", "1,000–10,000 / month", "10,000+ / month", "Not sure"] as const;
export const TIMELINES = ["ASAP", "1–3 months", "3+ months", "Exploring"] as const;
export const BUDGET_RANGES = ["Under $2,000", "$2,000–$10,000", "$10,000–$50,000", "$50,000+", "Prefer to discuss"] as const;
export const YES_NO_UNSURE = ["Yes", "No", "Unsure"] as const;
export const CONTACT_PREFERENCES = ["Email", "Phone", "WhatsApp", "Video call"] as const;

export const INDUSTRY_NAMES = [
  "Real Estate",
  "Education",
  "Salons & Spas",
  "Healthcare Administration",
  "E-commerce",
  "Travel",
  "Restaurants",
  "Recruitment",
  "Professional Services",
  "IT / SaaS",
  "Other",
] as const;
