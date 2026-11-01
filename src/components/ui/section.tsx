import clsx from "clsx";
import { Reveal } from "./reveal";

export function Section({
  id,
  tone = "plain",
  className,
  children,
  ...rest
}: {
  id?: string;
  tone?: "plain" | "lavender";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      id={id}
      className={clsx("relative scroll-mt-24 py-20 md:py-28", tone === "lavender" && "bg-lavender/60", className)}
      {...rest}
    >
      <div className="container">{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  heading,
  intro,
  align = "center",
  as: As = "h2",
  id,
}: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
  id?: string;
}) {
  return (
    <Reveal className={clsx("mb-12 max-w-2xl md:mb-16", align === "center" && "mx-auto text-center")}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <As id={id} className={clsx("font-bold", As === "h1" ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl")}>
        {heading}
      </As>
      {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
    </Reveal>
  );
}
