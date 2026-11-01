import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { userStore } from "@/lib/data";
import { seedHome } from "@/lib/content/seed";
import { PageTitle } from "@/components/admin/shell";
import { HomeEditor } from "@/components/admin/home-editor";
import type { PageRow } from "@/types";

export const metadata = { title: "Homepage" };

export default async function HomePageEditor() {
  await requirePage("content:write");
  const page = await userStore().first<PageRow>("pages", { slug: "home" });
  const draft = page?.draft_json ?? seedHome;
  const dirty = JSON.stringify(page?.draft_json) !== JSON.stringify(page?.published_json);
  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-purple">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Content
      </Link>
      <PageTitle
        title="Homepage"
        intro={`${dirty ? "Unpublished draft changes exist. " : ""}Last published ${page?.published_at ? new Date(page.published_at).toLocaleString() : "never"}.`}
      />
      <HomeEditor initial={draft} />
    </>
  );
}
