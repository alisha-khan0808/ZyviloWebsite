import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CalendarDays } from "lucide-react";
import { getSettings } from "@/lib/content/repo";

export const metadata: Metadata = { title: "Thank you", robots: { index: false, follow: false } };

export default async function ThankYouPage({ searchParams }: { searchParams: { ref?: string } }) {
  const settings = await getSettings();
  // Only the opaque reference code is shown — never lead details.
  const ref = typeof searchParams.ref === "string" && /^ZY-[A-Z0-9-]{8,20}$/.test(searchParams.ref) ? searchParams.ref : null;
  return (
    <section className="-mt-[76px] bg-aurora pb-24 pt-36">
      <div className="container max-w-2xl text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-purple to-lilac text-white shadow-glow">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Thank you — we&apos;ve got it</h1>
        <p className="mt-4 text-lg text-muted">
          Your request has been received. Someone from our team will review it and get in touch using your preferred contact details.
        </p>
        {ref && (
          <p className="mx-auto mt-8 inline-flex flex-col rounded-2xl border border-line bg-white px-6 py-4 shadow-card">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Your reference</span>
            <span className="font-display text-2xl font-bold tracking-wide text-purple">{ref}</span>
          </p>
        )}
        <div className="mt-10 rounded-3xl border border-line bg-white p-6 text-left">
          <h2 className="font-bold">What happens next</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>We review your request and any details you shared.</li>
            <li>We reach out to arrange a short discovery conversation.</li>
            <li>We suggest a practical starting point and a clear proposal.</li>
          </ol>
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {settings.bookingUrl && (
            <a href={settings.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <CalendarDays className="h-4 w-4" aria-hidden /> Book a consultation now
            </a>
          )}
          <Link href="/solutions" className="btn-secondary">
            Explore solutions
          </Link>
        </div>
      </div>
    </section>
  );
}
