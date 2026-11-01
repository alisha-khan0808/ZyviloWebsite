import { PageHero } from "./page-hero";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero title={title} intro={`Last updated ${updated}`} />
      <section className="pb-24">
        <div className="container max-w-3xl">
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Template text — must be reviewed by a qualified legal professional for your target markets before launch.
          </div>
          <article className="space-y-6 text-muted [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-navy">
            {children}
          </article>
        </div>
      </section>
    </>
  );
}
