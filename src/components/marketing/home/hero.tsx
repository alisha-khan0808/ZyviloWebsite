import { ArrowRight, PlayCircle } from "lucide-react";
import { TrackedLink } from "@/components/ui/tracked-link";
import { HeroCanvas } from "@/components/workflows/hero-canvas";
import type { HomeContent } from "@/types";

export function Hero({ hero }: { hero: HomeContent["hero"] }) {
  const [first, ...rest] = hero.headline.split(". ");
  return (
    <section className="relative -mt-[76px] overflow-hidden bg-aurora pb-20 pt-32 md:pb-28 md:pt-40">
      <Curves />
      <div className="container relative grid items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="eyebrow mb-5">{hero.eyebrow}</p>
          <h1 className="text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
            {rest.length ? (
              <>
                {first}.<br />
                <span className="text-gradient">{rest.join(". ")}</span>
              </>
            ) : (
              hero.headline
            )}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted md:text-xl">{hero.subheading}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <TrackedLink href={hero.primaryCta.href} event="hero_primary_cta_click" className="btn-primary !px-7 !py-3.5 text-base">
              {hero.primaryCta.label} <ArrowRight className="h-4 w-4" aria-hidden />
            </TrackedLink>
            <TrackedLink href={hero.secondaryCta.href} event="hero_secondary_cta_click" className="btn-secondary !px-7 !py-3.5 text-base">
              <PlayCircle className="h-4 w-4 text-purple" aria-hidden /> {hero.secondaryCta.label}
            </TrackedLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {["Works with your existing tools", "People approve what matters", "Plain-English setup"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroCanvas />
      </div>
    </section>
  );
}

function Curves() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden>
      <path d="M-100 160 C 300 40, 600 260, 1540 60" fill="none" stroke="#B89CFF" strokeOpacity="0.25" strokeWidth="80" />
      <path d="M-100 820 C 400 700, 900 940, 1540 720" fill="none" stroke="#7300FF" strokeOpacity="0.06" strokeWidth="120" />
    </svg>
  );
}
