import Link from "next/link";
import Image from "next/image";
import type { SiteSettings } from "@/types";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-white">
      <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rounded-full bg-lilac/20 blur-3xl" aria-hidden />
      <div className="container grid gap-12 py-16 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <Image src="/brand/zyvilo-logo.png" alt="Zyvilo — AI Automations" width={1205} height={311} className="h-12 w-auto" />
          <p className="mt-5 max-w-xs text-sm text-muted">{settings.tagline} AI agents and connected workflows, built around how your business works.</p>
          {settings.contactEmail && (
            <a href={`mailto:${settings.contactEmail}`} className="mt-4 inline-block text-sm font-medium text-purple hover:underline">
              {settings.contactEmail}
            </a>
          )}
          {settings.phone && <p className="mt-1 text-sm text-muted">{settings.phone}</p>}
        </div>
        {settings.footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-4 text-sm font-semibold">{col.title}</h2>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-sm text-muted transition hover:text-purple">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 text-sm text-muted md:flex-row">
          <p>© {new Date().getFullYear()} {settings.name}. All rights reserved.</p>
          <ul className="flex gap-5">
            {settings.social.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-purple">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
