import Link from "next/link";
import { FileText, Home, Image as ImageIcon, Settings2 } from "lucide-react";
import { requirePage } from "@/lib/auth/session";
import { userStore } from "@/lib/data";
import { COLLECTIONS } from "@/lib/cms/collections";
import { PageTitle } from "@/components/admin/shell";

export const metadata = { title: "Content" };

export default async function ContentHome({ searchParams }: { searchParams: { denied?: string } }) {
  await requirePage("content:write");
  const store = userStore();
  const counts = await Promise.all(
    COLLECTIONS.map(async (c) => {
      const rows = await store.list<{ published: boolean }>(c.key);
      return { ...c, total: rows.length, published: rows.filter((r) => r.published).length };
    }),
  );
  return (
    <>
      {searchParams.denied && <p className="mb-6 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">You don&apos;t have access to that page.</p>}
      <PageTitle title="Website content" intro="Edit public content without a redeploy. Changes go live when published; use Preview to check drafts first." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card href="/admin/content/pages" icon={<Home className="h-5 w-5" />} title="Homepage" body="Hero, section headings, order and visibility (draft → publish)." />
        {counts.map((c) => (
          <Card key={c.key} href={`/admin/content/${c.slug}`} icon={<FileText className="h-5 w-5" />} title={c.label} body={`${c.published} published · ${c.total - c.published} draft`} />
        ))}
        <Card href="/admin/content/media" icon={<ImageIcon className="h-5 w-5" />} title="Media library" body="Upload images (PNG, JPEG, WebP, GIF · max 2 MB)." />
        <Card href="/admin/content/site" icon={<Settings2 className="h-5 w-5" />} title="Site settings" body="Navigation, footer, social links, contact details and default SEO." />
      </div>
    </>
  );
}

function Card({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-line bg-white p-5 transition hover:border-lilac hover:shadow-card">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-lavender text-purple">{icon}</span>
      <h2 className="mt-4 font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </Link>
  );
}
