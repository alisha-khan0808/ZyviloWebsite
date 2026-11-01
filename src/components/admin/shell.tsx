import Link from "next/link";
import Image from "next/image";
import { BarChart3, ExternalLink, FileText, Inbox, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { can, ROLE_LABELS, type Permission } from "@/lib/auth/permissions";
import { logoutAction } from "@/lib/auth/actions";
import type { Session } from "@/types";
import { NavLink } from "./nav-link";

const NAV: { href: string; label: string; icon: typeof Inbox; perm?: Permission }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, perm: "analytics:read" },
  { href: "/admin/leads", label: "Leads", icon: Inbox, perm: "leads:read" },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, perm: "analytics:read" },
  { href: "/admin/content", label: "Content", icon: FileText, perm: "content:write" },
  { href: "/admin/settings", label: "Settings", icon: Settings, perm: "settings:write" },
];

export function AdminShell({ session, localMode, children }: { session: Session; localMode: boolean; children: React.ReactNode }) {
  const items = NAV.filter((n) => !n.perm || can(session.role, n.perm));
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/brand/zyvilo-wordmark.png" alt="Zyvilo" width={824} height={251} className="h-6 w-auto" />
            <span className="rounded-md bg-lavender px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple">Admin</span>
          </Link>
        </div>
        <nav aria-label="Admin" className="overflow-x-auto px-3 pb-3 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {items.map((n) => (
              <li key={n.href}>
                <NavLink href={n.href}>
                  <n.icon className="h-4 w-4" aria-hidden /> {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden border-t border-line p-4 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:block">
          <p className="truncate text-sm font-semibold">{session.displayName}</p>
          <p className="truncate text-xs text-muted">
            {session.email} · {ROLE_LABELS[session.role]}
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/" target="_blank" className="btn-secondary !px-3 !py-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Site
            </Link>
            <form action={logoutAction}>
              <button className="btn-secondary !px-3 !py-1.5 text-xs">
                <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        {localMode && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-800">
            Local development mode: data is stored in <code>.data/db.json</code>. Configure Supabase for production (see README).
          </div>
        )}
        <div className="flex items-center justify-end gap-2 border-b border-line bg-white px-4 py-2 lg:hidden">
          <span className="mr-auto truncate text-xs text-muted">{session.email} · {ROLE_LABELS[session.role]}</span>
          <form action={logoutAction}>
            <button className="btn-secondary !px-3 !py-1.5 text-xs">Sign out</button>
          </form>
        </div>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, intro, actions }: { title: string; intro?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {intro && <p className="mt-1 text-sm text-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 text-sm text-muted">{body}</p>}
    </div>
  );
}
