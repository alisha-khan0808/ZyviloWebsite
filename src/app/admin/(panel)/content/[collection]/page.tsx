import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { userStore } from "@/lib/data";
import { getCollection } from "@/lib/cms/collections";
import { PageTitle } from "@/components/admin/shell";
import { CollectionManager } from "@/components/admin/collection-manager";

export function generateMetadata({ params }: { params: { collection: string } }) {
  return { title: getCollection(params.collection)?.label ?? "Content" };
}

export default async function CollectionPage({ params }: { params: { collection: string } }) {
  await requirePage("content:write");
  const def = getCollection(params.collection);
  if (!def) notFound();
  const items = await userStore().list<Record<string, unknown>>(def.key, { order: { column: "sort_order" } });
  const previewPaths = Object.fromEntries(items.map((i) => [i.id as string, def.publicPath?.(i) ?? null]));
  return (
    <>
      <Link href="/admin/content" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-purple">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Content
      </Link>
      <PageTitle title={def.label} intro={def.note} />
      <CollectionManager collectionSlug={def.slug} items={items} previewPaths={previewPaths} />
    </>
  );
}
