import { NextResponse } from "next/server";
import { AuthError, requireAction } from "@/lib/auth/session";
import { applyFilters, loadLeads, type LeadFilters } from "@/lib/admin/leads";
import { audit } from "@/lib/admin/audit";
import { toCsv } from "@/lib/admin/csv";

export const dynamic = "force-dynamic";

/** CSV export of the filtered lead list. Role-restricted and audit-logged. */
export async function GET(req: Request) {
  let session;
  try {
    session = await requireAction("leads:export");
  } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 403 });
  }
  const filters = Object.fromEntries(new URL(req.url).searchParams) as LeadFilters;
  const rows = applyFilters(await loadLeads(), filters);
  const csv = toCsv(
    rows.map((l) => ({
      reference: l.reference_code,
      submitted: l.created_at,
      status: l.status,
      priority: l.priority,
      form: l.form_type,
      contact_name: l.contact_name,
      email: l.email,
      phone: l.phone,
      company: l.company,
      website: l.website,
      industry: l.industry === "Other" ? `Other: ${l.industry_other ?? ""}` : l.industry,
      country: l.country,
      solutions: (l.requirements?.solution_types ?? []).join("; ") || l.service_interest,
      timeline: l.requirements?.timeline,
      budget: l.requirements?.budget_range,
      volume: l.requirements?.volume_range,
      source: l.source,
      utm_campaign: l.utm_campaign,
      marketing_consent: l.marketing_consent ? "yes" : "no",
    })),
  );
  await audit(session.userId, "lead.export", "lead", null, { count: rows.length, filters });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="zyvilo-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
