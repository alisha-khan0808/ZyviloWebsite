import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHero({
  eyebrow,
  title,
  intro,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  crumbs?: { label: string; href: string }[];
  children?: React.ReactNode;
}) {
  return (
    <section className="relative -mt-[76px] overflow-hidden bg-aurora pb-16 pt-32 md:pb-20 md:pt-40">
      <div className="container relative">
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
              <li>
                <Link href="/" className="hover:text-purple">Home</Link>
              </li>
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  {i === crumbs.length - 1 ? (
                    <span aria-current="page" className="text-navy">{c.label}</span>
                  ) : (
                    <Link href={c.href} className="hover:text-purple">{c.label}</Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="max-w-3xl">
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">{title}</h1>
          {intro && <p className="mt-5 text-lg text-muted md:text-xl">{intro}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
