"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_KEY } from "@/lib/analytics/track";

/** Only shown when optional analytics are enabled. Declining is as easy as accepting. */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return;
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setShow(true);
    } catch {
      /* storage unavailable */
    }
  }, []);
  if (!show) return null;
  const decide = (v: "granted" | "denied") => {
    localStorage.setItem(CONSENT_KEY, v);
    setShow(false);
  };
  return (
    <div role="dialog" aria-label="Cookie preferences" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl glass p-5 shadow-card">
      <p className="text-sm text-navy">
        We&apos;d like to use privacy-friendly analytics to understand which pages are useful. No personal details are shared.{" "}
        <Link href="/privacy" className="text-purple underline">Privacy notice</Link>
      </p>
      <div className="mt-4 flex gap-2">
        <button className="btn-secondary !py-2" onClick={() => decide("denied")}>Decline</button>
        <button className="btn-primary !py-2" onClick={() => decide("granted")}>Accept analytics</button>
      </div>
    </div>
  );
}
