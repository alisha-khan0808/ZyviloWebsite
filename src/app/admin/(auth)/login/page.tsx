import { redirect } from "next/navigation";
import Image from "next/image";
import { getSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/config";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center bg-aurora px-4">
      <div className="w-full max-w-sm">
        <Image src="/brand/zyvilo-logo.png" alt="Zyvilo" width={1205} height={311} className="mx-auto h-12 w-auto" priority />
        <div className="card mt-8 p-7">
          <h1 className="text-xl font-bold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">Access is by invitation only.</p>
          <LoginForm />
        </div>
        {!isSupabaseConfigured() && (
          <p className="mt-4 text-center text-xs text-muted">Local mode — credentials come from LOCAL_ADMIN_EMAIL / LOCAL_ADMIN_PASSWORD in .env.local.</p>
        )}
      </div>
    </main>
  );
}
