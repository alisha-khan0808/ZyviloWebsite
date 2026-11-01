"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics/track";

export function ViewTracker({ event, props }: { event: AnalyticsEvent; props?: Record<string, string> }) {
  const key = JSON.stringify(props);
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key]);
  return null;
}
