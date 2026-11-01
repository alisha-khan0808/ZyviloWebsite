import { NextResponse } from "next/server";
import { processOutbox } from "@/lib/notifications/outbox";

export const dynamic = "force-dynamic";

/** Scheduled retry worker (see vercel.json). Protected by CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await processOutbox({ limit: 50 });
  return NextResponse.json({ ok: true, ...result });
}
