"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import type { Cta } from "@/types";

export function Navbar({ links }: { links: Cta[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <div
        className={clsx(
          "transition-all duration-300",
          scrolled ? "border-b border-line/80 bg-bg/85 py-2.5 backdrop-blur-xl" : "bg-transparent py-4 md:py-5",
        )}
      >
        <nav className="container flex items-center justify-between gap-6" aria-label="Main">
          <Logo priority />
          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "rounded-full px-3.5 py-2 text-sm font-medium transition",
                      active ? "bg-lavender text-purple" : "text-navy/80 hover:bg-lavender/70 hover:text-navy",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2">
            <Link href="/request-automation" className="btn-primary hidden !py-2.5 sm:inline-flex">
              Automate My Business <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <button
              type="button"
              className="btn-ghost !p-2.5 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>
      {open && (
        <div id="mobile-menu" className="border-b border-line bg-bg/95 backdrop-blur-xl lg:hidden">
          <ul className="container flex flex-col gap-1 py-4">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-lavender">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link href="/request-automation" className="btn-primary w-full">
                Automate My Business <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
