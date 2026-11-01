# Zyvilo — Website & Lead Intelligence Platform

Marketing website, animated AI-workflow demos, lead capture, admin CRM, lead analytics and CMS for **Zyvilo** — built from `Zyvilo_Website_PRD.md`.

**Stack:** Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · Framer Motion · Supabase (Postgres, Auth, Storage, RLS) · Zod · Recharts · Vitest

---

## Quick start (local mode — no accounts needed)

```bash
npm install
cp .env.example .env.local      # then set AUTH_SECRET and LOCAL_ADMIN_PASSWORD
npm run dev                     # http://localhost:3000
```

Without Supabase variables the app runs in **local mode**: content and leads are stored in `.data/db.json` (seeded automatically on first run), and the admin uses the bootstrap owner from `LOCAL_ADMIN_EMAIL` / `LOCAL_ADMIN_PASSWORD`. Sign in at `/admin/login`.

Delete `.data/` at any time to reset to the seed content. Local mode is for development and demos only.

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm test` | Unit tests: validation, lead persistence & idempotency, permissions (incl. RLS parity), analytics, CSV |
| `npm run seed:supabase` | Seed starter CMS content into Supabase |

---

## Production setup (Supabase + Vercel)

### 1. Supabase
1. Create a Supabase project.
2. Apply the migration in `supabase/migrations/` — either paste it into the SQL editor, or with the CLI: `supabase link --project-ref <ref>` then `supabase db push`.
   This creates all tables, indexes, Row Level Security policies, the transactional `submit_lead()` function and the `media` storage bucket.
3. **Auth → Providers:** keep Email enabled and **disable public sign-ups** (admins are invite-only).
4. Create the first owner: in **Authentication → Users** invite/create your user, then run
   ```bash
   # Node 18: export the variables in your shell first
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SEED_OWNER_EMAIL=you@company.com npm run seed:supabase
   ```
   This seeds services, industries, FAQs, homepage and settings (skipping tables that already have rows) and creates your owner profile. Further team members are invited from **Admin → Settings → Team**.

### 2. Environment variables
See `.env.example`. Required in production:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL, e.g. `https://zyvilo.com` (used for canonicals, sitemap, OG, email links) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public; RLS restricts what they can read |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Used for lead intake, notifications and invitations. Never prefix with `NEXT_PUBLIC_` |
| `RESEND_API_KEY`, `EMAIL_FROM` | New-lead admin emails (swap provider in `src/lib/notifications/email.ts`) |
| `NOTIFY_EMAIL` | Fallback recipients if none are set in Admin → Settings |
| `CRON_SECRET` | Protects `/api/cron/notifications` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Optional Cloudflare Turnstile bot protection on both forms |
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | `true` shows the consent banner; events go to `window.dataLayer` only after consent |

### 3. Vercel
1. Import the repo, set the variables above for Production and Preview (use a separate Supabase project for staging).
2. `vercel.json` schedules `/api/cron/notifications` every 10 minutes; Vercel sends `Authorization: Bearer $CRON_SECRET`.
3. Use Node.js 20 or 22 on the host (supabase-js is deprecating Node 18).

Netlify works too: set the same variables and schedule the cron route with a Netlify Scheduled Function.

---

## What's built

### Public site
- `/` hero with animated workflow canvas (static/mobile fallbacks), before→after, three capability cards with mini diagrams, **tabbed interactive demo** (Play/Pause/Restart, parallel vs sequential steps, text alternative), AI workforce, **industry selector** (deep-links + prefilled lead form), process, why, FAQ (+ FAQPage schema), final CTA.
- `/solutions`, `/solutions/[slug]`, `/industries`, `/industries/[slug]`, `/how-it-works`, `/about`, `/contact`, `/request-automation`, `/thank-you`, `/privacy`, `/terms`, 404.
- SEO: per-page metadata + canonicals, `sitemap.xml`, `robots.txt`, dynamic OG image, Organization/Service/Breadcrumb/FAQ JSON-LD. Admin, API and thank-you are `noindex`.
- Accessibility: semantic landmarks, skip link, labelled inputs with inline errors, keyboard-operable tabs/diagrams/chips, `prefers-reduced-motion` support, live regions for diagram steps.

### Lead intake
- **Quick enquiry** (`/contact`) and **4-step discovery wizard** (`/request-automation`) with progress, back/forward, inline Zod validation, review step, session-only autosave, separate optional marketing consent.
- Server: same-origin check → rate limit → Zod validation/normalisation → honeypot + minimum fill time (+ Turnstile if configured) → **single-transaction, idempotent** persistence (lead + requirements + activity + notification outbox) → best-effort email with **retry via cron**. Non-guessable reference code (`ZY-XXXX-XXXX-XX`).
- Attribution: UTM parameters, external referrer, landing + submission page, preselected solution/industry.

### Admin (`/admin`)
- Supabase Auth (invite-only) with roles **Owner / Admin / Sales / Content Editor** enforced in server code **and** RLS.
- Overview KPIs, **lead inbox** (search, filters, sort, pagination, CSV export — role-restricted and audit-logged), **lead detail** (full brief, attribution, consent record, status/owner/priority/score/next-contact, notes, tasks, activity timeline, spam/archive/delete-by-retention).
- **Analytics:** leads over time (day/week/month), current-status breakdown, sources, campaigns, industries, solutions (multi-select counted once per lead with stated denominators), median time to first contact, open-lead age, conversion by source/industry with small-sample flags. Uses the same filter function as the inbox so totals reconcile.
- **CMS:** homepage (draft → preview → publish, section order/visibility), services, industries (incl. workflow step editor), FAQs, testimonials and case studies (permission record required), site settings (nav, footer, social, contact, default SEO), media library (type/size/magic-byte validated, no SVG). Changes revalidate the public site immediately — no redeploy.
- **Settings:** notification recipients, delivery log with retry, team management, audit log.

## Architecture notes

```
src/
  app/(marketing)/     public pages (server components; ISR, revalidated on CMS save)
  app/admin/           (auth)/login + (panel)/… protected by middleware + per-page role checks
  app/api/             lead intake, cron, preview, export, media
  components/          ui · marketing · workflows (diagrams) · forms · admin
  lib/data/            Store interface → supabase-store | local-store
  lib/auth/            sessions, permission matrix, login actions
  lib/admin/ lib/cms/  lead queries & actions, analytics, CMS definitions & actions
  lib/validation/      Zod schemas + option lists shared by client and server
supabase/migrations/   schema, RLS, submit_lead(), storage bucket
tests/                 vitest
```

- **Three Supabase clients:** anon (public published content), user/cookie-bound (admin — RLS applies), service-role (lead intake, notifications, invites; server-only).
- **Workflow diagrams** are custom accessible components (CSS container queries + SVG) rather than React Flow: lighter bundle, no layout shift, and full keyboard/text-alternative support. Content is CMS-editable as structured steps.
- All workflow examples are labelled illustrative. No testimonials, logos or statistics are seeded.

## Known limitations / next steps
- Rate limiting is in-memory per server instance — back it with Upstash/Redis for multi-instance hosting (same interface in `src/lib/security/rate-limit.ts`).
- Lead lists and analytics filter in memory (fine into the thousands of leads); move to SQL views/RPCs as volume grows.
- Not yet built (PRD V1.1+): Insights blog, public case-study pages, calendar integration (a booking link setting is provided), automated lead acknowledgement emails, opportunity estimator, saved views, duplicate detection.
- `/privacy` and `/terms` are templates and **must be reviewed by a lawyer** for your markets.
- The brand logo PNGs in `public/brand/` were extracted from the supplied banner (`scripts/extract-logo.py`); replace with original vector files when available.
