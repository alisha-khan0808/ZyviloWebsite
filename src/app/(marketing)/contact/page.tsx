import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, Phone, CalendarDays } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { QuickEnquiryForm } from "@/components/forms/quick-enquiry-form";
import { getSettings, listIndustries, listServices } from "@/lib/content/repo";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact",
  description: "Send Zyvilo a quick enquiry about AI agents, automation or a consultation.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [settings, industries, services] = await Promise.all([getSettings(), listIndustries(), listServices()]);
  return (
    <>
      <PageHero eyebrow="Contact" title="Tell us what you need" intro="A quick message is all it takes. We'll reply with next steps." crumbs={[{ label: "Contact", href: "/contact" }]} />
      <section className="pb-24">
        <div className="container grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="card p-6 sm:p-8">
            <QuickEnquiryForm industries={industries.map((i) => i.name)} services={services.map((s) => `${s.name} — ${s.tagline}`)} />
          </div>
          <aside className="space-y-5">
            <div className="card p-6">
              <h2 className="text-lg font-bold">Want to share more detail?</h2>
              <p className="mt-2 text-sm text-muted">Our automation brief takes a few minutes and helps us prepare a more useful first conversation.</p>
              <Link href="/request-automation" className="btn-primary mt-4">
                Start the automation brief <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="card space-y-3 p-6 text-sm">
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-3 hover:text-purple">
                  <Mail className="h-4 w-4 text-purple" aria-hidden /> {settings.contactEmail}
                </a>
              )}
              {settings.phone && (
                <p className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-purple" aria-hidden /> {settings.phone}
                </p>
              )}
              {settings.bookingUrl && (
                <a href={settings.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-purple">
                  <CalendarDays className="h-4 w-4 text-purple" aria-hidden /> Book a consultation
                </a>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
