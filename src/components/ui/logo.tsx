import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

/** Zyvilo wordmark from the supplied brand asset (transparent PNG). */
export function Logo({ className, href = "/", priority }: { className?: string; href?: string; priority?: boolean }) {
  return (
    <Link href={href} className={clsx("inline-flex items-center rounded-lg", className)} aria-label="Zyvilo home">
      <Image src="/brand/zyvilo-wordmark.png" alt="Zyvilo" width={824} height={251} priority={priority} className="h-7 w-auto" />
    </Link>
  );
}
