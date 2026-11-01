"use client";

import Link from "next/link";
import { track, type AnalyticsEvent } from "@/lib/analytics/track";

export function TrackedLink({
  event,
  props,
  ...rest
}: React.ComponentProps<typeof Link> & { event: AnalyticsEvent; props?: Record<string, string> }) {
  return <Link {...rest} onClick={() => track(event, props)} />;
}
