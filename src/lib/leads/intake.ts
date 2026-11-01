import "server-only";
import { NextResponse } from "next/server";
import type { ZodTypeAny } from "zod";
import { serviceStore } from "@/lib/data";
import type { NewLead, NewRequirements } from "@/lib/data/store";
import { processOutbox } from "@/lib/notifications/outbox";
import { clientIp, rateLimit, sameOrigin, verifyCaptcha } from "@/lib/security/rate-limit";
import { fieldErrors } from "@/lib/validation/lead";

const MIN_FILL_MS = 2500;

/**
 * Shared POST handler for both lead forms: origin check → rate limit → validation → bot checks
 * → transactional persistence → best-effort notification (retried by cron on failure).
 */
export async function handleLeadSubmission<S extends ZodTypeAny>(
  req: Request,
  schema: S,
  build: (data: S["_output"]) => { lead: NewLead; requirements: NewRequirements | null },
) {
  if (!sameOrigin(req.headers)) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });

  const ip = clientIp(req.headers);
  const limit = rateLimit(`lead:${ip}`, 8, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) }, { status: 422 });
  }
  const data = parsed.data as { started_at?: number; captcha_token?: string };

  // Bot heuristics: honeypot is validated by the schema; reject impossibly fast submissions.
  if (data.started_at && Date.now() - data.started_at < MIN_FILL_MS) {
    return NextResponse.json({ ok: false, error: "Please take a moment and try again." }, { status: 400 });
  }
  if (!(await verifyCaptcha(data.captcha_token, ip))) {
    return NextResponse.json({ ok: false, error: "Verification failed. Please try again." }, { status: 400 });
  }

  const { lead, requirements } = build(parsed.data);
  try {
    const result = await serviceStore().submitLead(lead, requirements);
    if (!result.duplicate) {
      // Await so serverless runtimes don't drop the work; failures are recorded on the outbox row.
      await processOutbox({ leadId: result.lead.id, limit: 1 }).catch((e) => console.error("[outbox]", (e as Error).message));
    }
    return NextResponse.json({ ok: true, reference: result.lead.reference_code });
  } catch (err) {
    console.error("[lead] persist failed:", (err as Error).message); // no PII logged
    return NextResponse.json(
      { ok: false, error: "We couldn't save your request just now. Your answers are still here — please try again." },
      { status: 500 },
    );
  }
}
