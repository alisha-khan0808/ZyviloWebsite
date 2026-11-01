import "server-only";
import { userStore } from "@/lib/data";

/** Records a security-sensitive admin action. Never include full client briefs or credentials in metadata. */
export async function audit(actorId: string | null, action: string, resourceType: string, resourceId: string | null, metadata: Record<string, unknown> = {}) {
  try {
    await userStore().insert("audit_logs", { actor_id: actorId, action, resource_type: resourceType, resource_id: resourceId, metadata });
  } catch (err) {
    console.error("[audit] failed to record", action, (err as Error).message);
  }
}
