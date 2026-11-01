import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-aurora px-6">
      <div className="text-center">
        <Logo className="mb-10" />
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">This page took the day off</h1>
        <p className="mt-4 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-primary">Go home</Link>
          <Link href="/solutions" className="btn-secondary">Explore solutions</Link>
        </div>
      </div>
    </main>
  );
}
