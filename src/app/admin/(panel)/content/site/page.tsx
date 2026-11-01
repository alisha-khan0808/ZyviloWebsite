import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { getSettings } from "@/lib/content/repo";
import { PageTitle } from "@/components/admin/shell";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export const metadata = { title: "Site settings" };

export default async function SiteSettingsPage() {
  await requirePage("content:write");
  const settings = await getSettings();
  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-purple">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Content
      </Link>
      <PageTitle title="Site settings" intro="Public settings: navigation, footer, social links, contact details and default SEO." />
      <SiteSettingsForm initial={settings} />
    </>
  );
}
