# ZYVILO — Website & Lead Intelligence Platform
## Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Build-ready specification for Claude  
**Brand:** Zyvilo  
**Product:** Marketing website, AI solution discovery, lead capture, admin CMS and lead intelligence dashboard  
**Design inspiration:** Gumloop (visual workflow storytelling) + Linear (premium minimalism)  
**Stack:** Node.js, Next.js (App Router), TypeScript, Tailwind CSS, Supabase; deploy on Vercel or Netlify  

---

## 1. Executive Summary

Build a visually distinctive, high-performance, mobile-first website for Zyvilo, a company providing AI agents, multi-agent systems, supervisor agents with specialized sub-agents, and end-to-end business automation. The site must explain sophisticated services in language a nontechnical business owner understands, demonstrate automation using lightweight graphical animations, and convert visitors into qualified leads.

Provide a secure admin portal to manage website content and collect, inspect, qualify, track and analyze leads, including each client's detailed automation request. This is a marketing and lead-operations platform, **not** a fully functioning agent marketplace or production agent execution platform in V1.

### Positioning
**Brand promise:** Your Business. On Autopilot.  
**Supporting message:** Intelligent AI agents and connected workflows that handle repetitive work, improve customer experiences and help your business scale.  
**Alternative supporting phrase:** One AI assistant or an entire AI workforce—built around how your business operates.

### Core value proposition
- **AI Agents:** One assistant for a focused task, e.g. handling enquiries or booking appointments.
- **Multi-Agent Systems:** Several specialized agents collaborating on a larger job.
- **Supervisor + Sub-Agents:** One orchestrator receives a request and delegates tasks to specialist agents.
- **End-to-End Automation:** Workflows connecting channels, agents, CRMs, databases and human approvals across a full process.

### Success criteria
- Visitors can explain what Zyvilo offers after viewing the hero and one visual demonstration.
- A lead can submit a basic enquiry in under 60 seconds; detailed requirements are optional or progressive.
- Every valid submission is persisted, visible in admin, and attributable to a source where possible.
- Admin can update key website content without redeploying.
- Website meets accessibility, security, SEO and performance targets specified below.

---

## 2. Target Audiences

1. **Small business owners:** Need affordable AI receptionist, WhatsApp enquiry handling, scheduling and follow-up.
2. **Growing SMEs:** Need CRM, lead qualification, sales support, reporting and cross-tool automation.
3. **Operations leaders:** Need multi-step, end-to-end automation across departments.
4. **IT and enterprise teams:** Need custom multi-agent orchestration and API integrations with approvals, observability and security.

**Primary action:** Request an AI automation consultation.  
**Secondary actions:** Explore solutions, view workflow demos, submit a detailed automation brief.

---

## 3. Scope and Priorities

### V1 — Must Have
- Public responsive marketing pages and polished animated visual storytelling.
- Clear explanation of AI agents, multi-agent systems and end-to-end automation.
- Services, use cases and industry solution pages powered by Supabase content.
- Industry selector with animated example workflow diagrams.
- Lead capture: short enquiry form plus detailed automation requirements form.
- Lead persistence, lead status management, assignment, notes and activity timeline.
- Admin authentication and role-based access control.
- Admin CMS for editable homepage text, services, industries, FAQs, testimonials and site settings.
- Admin analytics: funnel, lead sources, service demand, industry demand, statuses and trends.
- Email notification on new leads, with delivery failure logged (no secrets in browser).
- SEO metadata, sitemap, structured data where appropriate, legal pages, cookie handling where needed.

### V1.1 — Should Have
- Case studies and blog/resources CMS.
- Lead export (CSV), filters, saved views and duplicate detection.
- Consultation scheduling via calendar integration.
- Automated lead acknowledgement with consent and appropriate email delivery.
- Simple AI opportunity estimator: informative, non-binding suggestions based on user selections.

### V2 — Later
- Live sandbox demos of agents, subject to safety controls and usage limits.
- Customer portal and subscription plans.
- Self-service agent configuration and provisioning.
- Actual customer automation execution and multi-tenant orchestration.
- Advanced lead scoring, integrations with external CRM, and experiments/A-B testing.

**Explicit non-goals for V1:** Build a full workflow engine, execute customer agents on the website, claim guaranteed ROI, implement autonomous financial/medical decisions, or publish fake client logos/testimonials.

---

## 4. Brand & Visual Design System

### Design character
Premium, warm, minimal, futuristic but approachable. The UI should look trustworthy to business decision-makers and visually engaging to curious visitors. Avoid neon-heavy cyberpunk visuals and crowded dashboard-style landing pages.

### Palette
| Token | Hex | Usage |
|---|---|---|
| Background | `#FCFAFF` | Main surface |
| Lavender Surface | `#F3ECFF` | Alternate sections |
| Navy | `#080B2C` | Headlines/body emphasis |
| Purple | `#7300FF` | Primary CTA and accents |
| Lilac | `#B89CFF` | Gradient accents |
| White | `#FFFFFF` | Cards and contrast surfaces |
| Muted Text | `#5E6075` | Secondary copy |
| Border | `#E8DFF5` | Soft borders |

### Typography
- Headings: Plus Jakarta Sans or similarly modern geometric sans.
- Body: Inter or similar highly readable sans.
- Large, concise headings; short paragraphs; generous whitespace.
- Desktop max content width ~1200–1280px; responsive down to 320px.

### UI components
- Rounded 16–24px cards, subtle border and shadow, occasional translucent glass effect.
- Purple gradient CTA with clear hover/focus states.
- Sticky minimal navbar, compact on scroll.
- Soft lavender glows and translucent curved accents matching existing Zyvilo identity.
- Avoid reliance on animations to communicate essential information.

### Motion rules
- Prefer Motion (Framer Motion), CSS transitions, SVG, and React Flow / `@xyflow/react` for workflow diagrams.
- Use Three.js only if a specific hero effect demonstrably adds value; never make it mandatory.
- Flowing animated connection lines, sequential node illumination, restrained scroll reveals, gentle card movement.
- Respect `prefers-reduced-motion`; provide static diagrams and disable decorative motion.
- Lazy-load expensive visualizations; no scroll-jacking, excessive parallax, or heavy autoplay videos.

---

## 5. Information Architecture & Routes

### Public
- `/` — Homepage
- `/solutions` — All AI solutions
- `/solutions/[slug]` — Individual service pages
- `/industries` — Industry overview
- `/industries/[slug]` — Industry landing pages
- `/how-it-works` — Process, architecture illustrations, human oversight
- `/about` — Brand and approach
- `/contact` — Short contact form
- `/request-automation` — Multi-step requirements intake
- `/privacy`, `/terms` — Legal content
- `/thank-you` — Post-submission confirmation; do not expose lead PII
- `/insights` and `/insights/[slug]` — Optional V1.1 blog

### Admin
- `/admin/login`
- `/admin` — KPI overview
- `/admin/leads` — Leads table
- `/admin/leads/[id]` — Full client brief and timeline
- `/admin/analytics` — Lead intelligence
- `/admin/content` — CMS overview
- `/admin/content/pages`, `/services`, `/industries`, `/faqs`, `/testimonials`, `/case-studies`
- `/admin/settings` — Site settings, notifications, team (role-dependent)

---

## 6. Homepage Detailed Requirements

### Section A — Hero (first screen)
**Eyebrow:** AI AGENTS · MULTI-AGENT SYSTEMS · BUSINESS AUTOMATION  
**Headline:** Your Business. On Autopilot.  
**Subheading:** From one smart AI assistant to a connected team of AI agents, Zyvilo automates repetitive work so your people can focus on growth.  
**Primary CTA:** Automate My Business → `/request-automation`  
**Secondary CTA:** See AI in Action → anchor to interactive demo.

**Hero illustration:** A white/lavender floating workflow canvas with 5 simple nodes: `Customer Enquiry → AI Agent → CRM → Booking → Confirmation`. Animate pulses moving along connectors and node completion states. Add small explanatory tooltips. On mobile, switch to a compact vertical diagram or stepper. Include a static fallback.

**Hook requirement:** A visitor should understand the benefit without reading technical terms. Avoid vague claims such as “revolutionize your business.”

### Section B — Problem → Outcome
Heading: **Still doing everything manually?**  
Three compact comparisons: missed enquiries → always-on responses; scattered data → connected systems; repetitive follow-ups → automated next steps. Show a before/after slider or side-by-side cards, accessible without dragging.

### Section C — Three Core Capabilities
Three cards, each with a tiny animated diagram:
1. **AI Agents:** One agent handles a job.
2. **AI Teams:** Specialist agents collaborate.
3. **End-to-End Automation:** Agents, apps and approvals work together.
Each card has a one-sentence explanation and CTA to relevant solution detail.

### Section D — See It Work (interactive graphical demonstration)
Tabbed demo scenarios:
- **Lead to Booking:** `Form → Qualification Agent → CRM → Calendar → Confirmation`
- **Customer Support:** `Message → Support Agent → Knowledge Base → Answer / Human Escalation`
- **Multi-Agent Operations:** `Request → Supervisor → Research / CRM / Scheduling Agents → Review → Completion`

Requirements: clickable Play / Pause / Restart; step descriptions; clear visual difference between sequential steps and parallel sub-agents; no real customer data or external calls in V1. Diagrams must be legible on mobile and accessible by keyboard. Provide explanatory text alternative.

### Section E — Meet Your AI Workforce
Display six flagship offerings with icon, concise benefit, example, and learn-more link:
- **Zyvilo Connect:** AI receptionist and chat.
- **Zyvilo Sales:** Lead qualification and CRM.
- **Zyvilo Voice:** Voice receptionist and call workflows.
- **Zyvilo Support:** Customer support and escalation.
- **Zyvilo Teams:** Multiple specialized AI agents working together.
- **Zyvilo Orchestrate:** Supervisor-led end-to-end automation.

Additional service capabilities (not necessarily separate products): Zyvilo Flow (workflow integrations) and Zyvilo Insights (reporting). All names editable in CMS; avoid implying registered product trademarks.

### Section F — Solutions by Industry
Industry selector with cards: Real Estate, Education, Salons & Spas, Healthcare Administration, E-commerce, Travel, Restaurants, Recruitment, Professional Services, IT/SaaS, and Other.
On selection, show: common pain point, sample AI solution, 4–6 step visual workflow, outcome, CTA `Build This for My Business`. The CTA preselects the industry/use case in the lead form.

**Example real estate:** `New Enquiry → Lead Agent → Property Match → CRM Update → Site Visit → Follow-up`.  
**Example education:** `Student Enquiry → Course FAQ Agent → Counselling Booking → Application Collection → Staff Review → Enrollment`.  
**Example salon:** `WhatsApp Enquiry → Services FAQ → Availability → Booking → Reminder`.

### Section G — How Zyvilo Works
Four steps: `Discover → Design → Build & Integrate → Launch & Optimize`. Explain that integrations, security, approvals, and monitoring are tailored to each client. No promises of fully autonomous handling of sensitive decisions.

### Section H — Why Zyvilo
Benefit cards: save repetitive effort, respond faster, connect existing tools, scale with human oversight, visibility into workflows. Do not display unverified ROI percentages or fabricated customer statistics.

### Section I — FAQ
Examples: What is an AI agent? Do I need technical knowledge? Can you connect my CRM? What is a multi-agent system? How long does implementation take? Can a human review actions? How is data protected? How is pricing determined?

### Section J — Final Conversion
Headline: **What would you automate first?**  
Copy: Tell us about your business. We'll help map the right AI solution.  
CTA: **Get My Automation Plan** → `/request-automation`.

### Footer
Solutions, Industries, About, Contact, Privacy, Terms, social links, copyright. All links configurable.

---

## 7. Solutions and Industry Detail Pages

### Solution detail template
- Hero with outcome-focused headline.
- One-sentence plain-English description.
- Animated workflow illustrating how it works.
- Problems solved and capabilities.
- Example business scenarios.
- Typical integrations (only those genuinely supported or described as possible).
- FAQ and CTA prefilled with solution slug.

### Multi-agent solution illustration
```text
Business Request
      |
      v
Supervisor Agent
  |       |        |
  v       v        v
Lead     CRM    Scheduling
Agent   Agent     Agent
  |       |        |
  +-------+--------+
          |
          v
     Human Review
          |
          v
     Final Outcome
```
Use this conceptual diagram to inform a polished React Flow illustration, with clear labels and responsive layout.

### Industry page template
- Industry-specific pain points.
- 2–4 relevant AI solutions.
- One example process diagram.
- Suggested integrations and business outcomes.
- Relevant FAQs and enquiry CTA.

---

## 8. Lead Capture & Discovery Experience

### Form A — Quick Enquiry (`/contact`)
Required: name, business email or phone (at least one), message, consent acknowledgement where appropriate. Optional: company, industry, service interest.

### Form B — Automation Discovery (`/request-automation`)
A 4-step wizard with progress indicator, autosave to session/local state only (do not store PII in analytics), back navigation, inline validation and review step.

**Step 1: About the business**
- Contact name (required)
- Work email (required)
- Phone / WhatsApp (optional)
- Company / business name (required)
- Website (optional)
- Industry (required; `Other` with free text)
- Business size (optional range)
- Country / region (optional)

**Step 2: What needs automation?**
- Desired solution types (multi-select): AI Chat, Voice, Sales/CRM, Customer Support, Workflow, Multi-Agent, Supervisor Agent, End-to-End, Not Sure.
- Current pain points (multi-select + Other)
- Detailed description of current process (free text, required)
- Desired outcome (free text, required)
- Current tools (CRM, WhatsApp, email, calendar, ERP, spreadsheets, custom software; multi-select + free text)
- Optional example process steps and integrations

**Step 3: Scope and readiness**
- Estimated request volume (optional range)
- Timeline (ASAP / 1–3 months / 3+ months / Exploring)
- Budget range (optional, include `Prefer to discuss`)
- Existing system/API access (Yes / No / Unsure)
- Need human approval? (Yes / No / Unsure)
- Sensitive customer data involved? (Yes / No / Unsure; do not request actual sensitive records)
- Preferred contact method and suitable time

**Step 4: Review & Submit**
- Summary of selections and entered details.
- Required privacy acknowledgement and optional separate marketing consent (unchecked by default).
- CAPTCHA / bot mitigation; rate limiting.
- Submit button with loading, success and failure states.

**Success state:** Thank-you page with lead reference code (non-guessable), next-step explanation, optional consultation booking link if configured. Do not promise a response time unless operationally supported.

### Lead attribution
Capture UTM parameters, referrer (when available), source page, selected solution/industry, submission timestamp, and campaign parameters. Avoid exposing raw PII in URLs or third-party analytics.

### Server-side behavior
- Validate and normalize inputs using Zod or equivalent.
- Persist lead and full structured requirement record transactionally.
- Create lead activity event and notification outbox entry.
- Send admin notification asynchronously or via reliable retry mechanism.
- Prevent duplicate submissions from double-clicks using idempotency token.
- Return user-friendly confirmation; never expose Supabase service role credentials.

---

## 9. Admin Portal Requirements

### Authentication and roles
- Supabase Auth; admin users must be provisioned/approved, no public admin signup.
- Roles: **Owner**, **Admin**, **Sales**, **Content Editor**.
- Owner: all access and role management.
- Admin: leads, analytics and content, except ownership transfer.
- Sales: assigned/all permitted leads, notes, status, exports as configured.
- Content Editor: content management only; no access to lead PII.
- Enforce authorization on server and database with Row Level Security; hiding UI elements is insufficient.

### Admin Overview (`/admin`)
KPI cards: total leads, new leads, qualified leads, consultations scheduled, converted leads, conversion rate (with defined denominator), leads this week/month. Include trends, source breakdown, industry interest and popular solutions. Display empty states rather than invented data.

### Lead Inbox (`/admin/leads`)
Search and filter by name, company, email, industry, service, status, source, owner, date, urgency and budget range. Sort and paginate. Lead cards/table show company, contact, requested solution, source, submitted date, status and owner.

**Lead lifecycle:** `New → Contacted → Qualified → Discovery Scheduled → Proposal Sent → Won / Lost / Nurture`. Allow explicit `Spam` and `Archived`; record status changes in audit trail.

### Lead Detail (`/admin/leads/[id]`)
Show:
- Full contact and company profile.
- Original complete request, including free-text requirements and selected options.
- Requested AI agents / multi-agent architecture / integrations.
- Pain points, expected outcomes, timeline, budget and volume.
- Source attribution and submission metadata.
- Status, owner, priority and qualification score (manual in V1).
- Internal notes, follow-up tasks, next-contact date, activity timeline.
- Actions: update status, assign, add note, copy contact, export permitted data, mark spam, archive, delete according to retention policy.
- No public exposure or accidental indexing of admin records.

### Lead Analytics (`/admin/analytics`)
- Leads over time (day/week/month).
- Funnel by status.
- Leads by source/UTM campaign.
- Leads by industry.
- Leads by requested solution (multi-select counted appropriately).
- Time to first contact and lead age.
- Conversion by source/industry (only with adequate data; show denominators).
- Filter by date range, source, service, industry, owner.
- CSV export restricted by role and logged.

**Important:** This is operational lead analytics, not AI inference about personal attributes. Avoid opaque automated rejection/scoring based on sensitive characteristics.

### CMS (`/admin/content`)
Manage:
- Hero headline, subheadline, CTA labels and URLs.
- Section order/visibility (within predefined section templates).
- Services and their slugs, descriptions, icons, diagrams, benefits, FAQs.
- Industries, use cases, example workflows and visuals.
- Testimonials and case studies (publish only with permission).
- Navigation, footer, social links, contact details, SEO metadata.
- Site settings, notification recipients, published/draft state.
- Media uploads to Supabase Storage with size/type validation.

**CMS behavior:** Preview draft before publishing; timestamps, editor identity and audit trail; safe rich text (sanitized) or structured content blocks; no arbitrary HTML/script injection; reversible content versions desirable in V1.1.

---

## 10. Suggested Data Model (Supabase/Postgres)

Use UUID primary keys, `created_at`, `updated_at` where relevant; migrations checked into repository. Exact schema may be refined during implementation.

| Table | Core fields | Notes |
|---|---|---|
| `profiles` | `id` (auth user), `display_name`, `role`, `active` | Admin identity/authorization |
| `leads` | `id`, `reference_code`, `contact_name`, `email`, `phone`, `company`, `website`, `industry`, `status`, `owner_id`, `priority`, `source`, `utm_*`, `created_at` | Main lead record |
| `lead_requirements` | `lead_id`, `solution_types[]`, `pain_points[]`, `current_process`, `desired_outcome`, `current_tools[]`, `integrations`, `business_size`, `volume_range`, `budget_range`, `timeline`, `human_approval`, `sensitive_data_flag`, `contact_preference` | Full request, 1:1 with lead |
| `lead_notes` | `id`, `lead_id`, `author_id`, `body`, `created_at` | Internal-only |
| `lead_activities` | `id`, `lead_id`, `actor_id`, `event_type`, `metadata`, `created_at` | Audit-friendly timeline |
| `lead_tasks` | `id`, `lead_id`, `assignee_id`, `title`, `due_at`, `completed_at` | Follow-up tasks |
| `services` | `id`, `slug`, `name`, `summary`, `body`, `icon`, `workflow_json`, `seo_json`, `sort_order`, `published` | CMS |
| `industries` | `id`, `slug`, `name`, `pain_points_json`, `workflow_json`, `seo_json`, `published` | CMS |
| `pages` | `id`, `slug`, `sections_json`, `seo_json`, `published` | Structured CMS pages |
| `faqs` | `id`, `question`, `answer`, `service_id?`, `industry_id?`, `sort_order`, `published` | CMS |
| `testimonials` | `id`, `quote`, `attribution`, `consent_record`, `published` | Optional; never seed fake reviews |
| `site_settings` | `key`, `value_json`, `updated_by` | Safe public settings only |
| `notification_outbox` | `id`, `lead_id`, `kind`, `status`, `attempts`, `last_error`, `next_retry_at` | Reliable delivery |
| `audit_logs` | `id`, `actor_id`, `action`, `resource_type`, `resource_id`, `metadata`, `created_at` | Security-sensitive admin actions |

### Database policies
- Enable RLS on every relevant table; public users never receive direct SELECT on leads or requirements.
- Public form submission should go through a validated server endpoint with service credentials on the server, not browser-exposed privileged keys.
- Public CMS reads return only published content, with sensitive draft metadata excluded.
- Admin authorization verified in server actions/API handlers and RLS.
- Index leads on `created_at`, `status`, `owner_id`, `industry`; indexes on relevant foreign keys.
- Restrict storage bucket permissions and file types; use signed URLs for private assets.
- Define data retention and deletion procedure; do not store unneeded sensitive information.

---

## 11. Technical Architecture

```text
Visitor (Desktop / Mobile)
          |
          v
Next.js App Router (Vercel or Netlify)
   |                 |
   v                 v
Public Pages     Protected Admin
   |                 |
   +--------+--------+
            |
            v
Server Actions / Route Handlers
(validation, auth, rate limiting)
            |
            v
Supabase (Postgres + Auth + Storage + RLS)
            |
            v
Notification Outbox / Email Provider
```

### Framework
- Next.js App Router + TypeScript strict mode.
- Node.js LTS runtime compatible with chosen Next.js release and hosting platform.
- Tailwind CSS + accessible component primitives (e.g. shadcn/ui where appropriate).
- Motion for transitions; `@xyflow/react` for visual workflow diagrams; chart library for admin analytics.
- Supabase client separation: browser anon/publishable client vs server privileged client.
- Use server components for public SEO pages; client components only where interaction is needed.
- Zod validation for all input boundaries.

### Hosting
- Prefer **Vercel** for straightforward Next.js support; **Netlify** is acceptable if deployment/runtime features are verified.
- Supabase hosted project for DB/Auth/Storage.
- Configure environment variables, staging and production environments, migrations, and preview deployments.
- Use scheduled/background-capable service or supported queue for notification retries; do not assume fire-and-forget work completes after serverless response.
- Keep credentials in host environment variables, never committed to Git.

### Suggested repository layout
```text
src/
  app/
    (marketing)/
    admin/
    api/
  components/
    ui/
    marketing/
    workflows/
    forms/
    admin/
  lib/
    supabase/
    validation/
    auth/
    analytics/
  types/
supabase/
  migrations/
public/
```

---

## 12. Functional User Stories & Acceptance Criteria

### US-01 — Understand the offer
**As a visitor**, I want to see a simple explanation of Zyvilo's services.  
**Accept when:** Hero states outcome and audience; three capability cards differentiate single agents, teams and end-to-end workflows; primary CTA visible above fold on common screen sizes.

### US-02 — Understand visually
**As a visitor**, I want to watch an example workflow.  
**Accept when:** At least three scenario diagrams have readable labels, Play/Pause/Restart, static fallback, keyboard access, and reduced-motion support.

### US-03 — Find my industry
**As a visitor**, I want to choose my industry and see relevant examples.  
**Accept when:** Selecting an industry updates example workflow and CTA context; deep links open corresponding industry page.

### US-04 — Submit a request
**As a prospective client**, I want to explain my automation need without technical jargon.  
**Accept when:** Both forms validate; wizard supports back/forward; server persists complete request and source metadata; confirmation shown; errors do not silently lose entered data.

### US-05 — Manage leads
**As an admin**, I want to see all incoming requests.  
**Accept when:** Authenticated authorized users can search/filter leads, open complete details, update status/owner, add notes, and see audit events.

### US-06 — Analyze demand
**As an owner**, I want to see which industries and services attract enquiries.  
**Accept when:** Dashboard uses actual DB records; date filters work; charts show appropriate empty states; figures reconcile with filtered lead list.

### US-07 — Edit site without code
**As a content editor**, I want to update content safely.  
**Accept when:** Can edit and publish supported content types, preview drafts, and see updates on public site without deployment; unauthorized roles are blocked.

### US-08 — Secure the platform
**As the business owner**, I need client requests protected.  
**Accept when:** Public users cannot read lead data; role checks enforced on server and RLS; admin routes require login; sensitive operations logged; form abuse controls active.

---

## 13. Non-Functional Requirements

### Performance
- Target Lighthouse scores on representative pages: Performance ≥90 mobile where feasible, Accessibility ≥95, Best Practices ≥95, SEO ≥95.
- Core Web Vitals targets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at 75th percentile under realistic conditions.
- Optimize fonts, image sizes and animations; lazy-load workflow canvas and charts; ensure no large layout shifts.

### Accessibility
- Aim for WCAG 2.2 AA.
- Semantic HTML, proper heading hierarchy, accessible form labels/errors, visible focus states, sufficient color contrast.
- All interactive diagrams usable by keyboard with a text alternative.
- Reduced-motion support; avoid flashing effects.

### SEO
- Unique title, description and canonical for each public page.
- Dynamic Open Graph images, sitemap, robots.txt, schema markup appropriate to actual content.
- Server-rendered/indexable solution and industry content; admin and thank-you pages excluded from indexing.
- Useful copy that answers real customer questions; no keyword stuffing.

### Privacy, security and reliability
- HTTPS, secure headers, CSRF-appropriate protections, input sanitization and validation, rate limits, bot protection.
- Privacy notice explaining what information is collected, why, retention, processors, and contact/deletion process; legal review for target markets.
- Separate optional marketing consent from necessary enquiry processing; log consent version/timestamp.
- Avoid collecting actual medical, financial or other sensitive records through the public discovery form.
- Never log credentials or full client briefs to analytics/monitoring services.
- Error monitoring with PII redaction; uptime checks; DB backups and tested restoration process.
- Graceful handling of notification failures and network errors.

---

## 14. Content & Copy Guidelines

**Voice:** Confident, clear, approachable, practical.  
**Avoid:** Heavy technical jargon, exaggerated “100% automation” promises, unverified savings statistics, fake client endorsements.

**Preferred explanations:**
- “AI Agent” → “A digital assistant that handles a task for your business.”
- “Multi-Agent System” → “A team of AI assistants that work together.”
- “Supervisor Agent” → “One AI coordinator that assigns work to specialist assistants.”
- “End-to-End Automation” → “A complete process that runs across your tools, with people involved when needed.”

**CTA library:** Automate My Business; See AI in Action; Explore Solutions; Build This for My Business; Tell Us What You Need; Book a Consultation.

**Content disclaimer:** Illustrative diagrams show possible workflows, not proof that a given integration is already deployed or available out of the box.

---

## 15. Analytics & Events

Track privacy-conscious, consent-compliant events:
- `hero_primary_cta_click`
- `hero_secondary_cta_click`
- `workflow_demo_started`
- `workflow_demo_completed`
- `industry_selected`
- `solution_viewed`
- `lead_form_started`
- `lead_form_step_completed`
- `lead_form_submitted`
- `consultation_cta_click`

Track event names and non-sensitive context only. Do not send names, emails, phone numbers or detailed client requests to third-party analytics. Admin reporting should primarily derive from Supabase lead records.

---

## 16. Build Plan for Claude

### Phase 0 — Foundation
- Initialize Next.js TypeScript project; configure Tailwind, linting, formatting, environment example, Supabase clients and migrations.
- Establish design tokens and shared UI components.
- Create representative content seed data; label sample demos as illustrative.

### Phase 1 — Marketing Website
- Build responsive layout, navigation, hero, three core offerings, solutions, industry selector, FAQ, footer.
- Implement lightweight workflow animations with accessibility fallbacks.
- Add solution and industry dynamic pages.

### Phase 2 — Lead Intake
- Implement quick enquiry and four-step discovery wizard.
- Create validated server endpoints, persistence, attribution, idempotency, rate limiting and confirmation pages.
- Add admin notification with reliable retry handling.

### Phase 3 — Admin CRM & Analytics
- Configure Supabase Auth, roles, RLS.
- Implement dashboard, lead list, lead detail, notes, statuses, tasks and source analytics.
- Add activity/audit logging.

### Phase 4 — CMS
- Editable site copy, services, industries, FAQs, testimonials and site settings.
- Draft/preview/publish; image management; safe public reads.

### Phase 5 — QA & Launch
- Test desktop/tablet/mobile, reduced motion, keyboard navigation, form abuse, auth/RLS, admin role restrictions, SEO and performance.
- Deploy staging, verify migrations and notification delivery, then production.
- Document admin onboarding, backups, environment configuration and content editing.

---

## 17. Quality Assurance Checklist

- [ ] Hero explains offering immediately; primary CTA works.
- [ ] Mobile navbar, forms and workflow diagrams are usable at 320px width.
- [ ] Motion does not obscure information; reduced-motion fallback works.
- [ ] All public routes have metadata and working internal links.
- [ ] Industry selector changes correct content and prefilled enquiry context.
- [ ] Quick form and detailed wizard persist all required fields accurately.
- [ ] Double-submit and bot/rate-limit cases handled.
- [ ] Lead is visible in admin with complete requirements and attribution.
- [ ] Notifications can fail without losing leads; retries are observable.
- [ ] Anonymous users cannot access lead records or draft CMS data.
- [ ] Sales and Content Editor roles cannot exceed permissions.
- [ ] Admin analytics totals reconcile with database filters.
- [ ] CMS edits publish safely and reflect on public pages.
- [ ] No fake testimonials, metrics or unverified integrations.
- [ ] No exposed service-role keys or secrets in client bundles.
- [ ] Legal/privacy pages and retention controls are ready before launch.
- [ ] Build, typecheck, lint, unit tests and critical E2E tests pass.

---

## 18. Open Decisions / Defaults

| Decision | Proposed Default |
|---|---|
| Hosting | Vercel |
| Admin authentication | Supabase Auth, invite-only |
| Consultation scheduling | External booking link initially; integration V1.1 |
| Email provider | Configurable transactional provider; implement server-side adapter |
| Pricing on public site | “Custom quote” initially; avoid hardcoded prices |
| Demo behavior | Animated mock workflows, not live production agents |
| CMS content structure | Structured Supabase tables + section JSON |
| Languages | English V1; internationalization-ready architecture |
| Lead scoring | Manual V1; explainable rules later |
| Brand logo | Existing Zyvilo wordmark; use user-supplied assets |

---

## 19. Instructions for Claude (Build Contract)

**Use this PRD as the source of truth.** Build a production-oriented Next.js application in incremental, reviewable phases. Do not generate only a static mockup; implement real Supabase persistence, authentication, RLS, CRUD, and analytics. Prioritize a polished, responsive, high-converting public site and reliable lead intake before optional extras.

**Implementation expectations:**
1. First inspect repository state, then propose architecture, routes, migrations, component tree and implementation plan.
2. Implement Phase 0 and Phase 1, then validate with lint/typecheck/build before moving on.
3. Implement database migrations, RLS and role authorization before exposing admin lead data.
4. Use realistic but explicitly labeled sample workflows; never invent client logos, results or testimonials.
5. Include `.env.example`, README, setup commands, Supabase migration instructions and deployment guide.
6. Use accessible motion, responsive SVG/React Flow diagrams, and premium white/lavender design.
7. Ensure all lead submissions are saved, admin views are functional, and analytics derive from real records.
8. Keep content editable through the CMS wherever specified.
9. Write tests for form validation, lead persistence, permissions and critical admin actions.
10. Ask for missing credentials, final logo asset, domain and notification address only when needed; never embed credentials in source.

**Definition of Done:** A visitor can understand Zyvilo, explore graphical demonstrations, submit a complete automation brief, and receive confirmation; an authorized admin can securely view and manage that lead, analyze enquiries and update public website content—all in a responsive deployed application.
