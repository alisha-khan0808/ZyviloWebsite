import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { userStore } from "@/lib/data";
import { PageTitle } from "@/components/admin/shell";
import { MediaLibrary } from "@/components/admin/media-library";
import type { MediaRow } from "@/types";

export const metadata = { title: "Media" };

export default async function MediaPage() {
  await requirePage("content:write");
  const items = await userStore().list<MediaRow>("media", { order: { column: "created_at", ascending: false } });
  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-purple">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Content
      </Link>
      <PageTitle title="Media library" intro="PNG, JPEG, WebP or GIF up to 2 MB. Copy an image URL to use it in content." />
      <MediaLibrary items={items} />
    </>
  );
}
