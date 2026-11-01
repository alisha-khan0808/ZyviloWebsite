import { requirePage } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/shell";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePage();
  return (
    <AdminShell session={session} localMode={!isSupabaseConfigured()}>
      {children}
    </AdminShell>
  );
}
