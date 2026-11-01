import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

/** Enables draft preview for content editors, then redirects to the requested public path. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !can(session.role, "content:write")) return NextResponse.json({ ok: false }, { status: 401 });
  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "/";
  const safe = path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/admin") ? path : "/";
  draftMode().enable();
  return NextResponse.redirect(new URL(safe, url.origin));
}
