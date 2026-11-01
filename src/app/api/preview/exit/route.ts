import { draftMode } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  draftMode().disable();
  return NextResponse.redirect(new URL("/", req.url));
}
