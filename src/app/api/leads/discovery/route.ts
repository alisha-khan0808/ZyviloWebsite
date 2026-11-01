import { handleLeadSubmission } from "@/lib/leads/intake";
import { buildDiscoveryLead } from "@/lib/leads/build";
import { discoverySchema } from "@/lib/validation/lead";

export async function POST(req: Request) {
  return handleLeadSubmission(req, discoverySchema, buildDiscoveryLead);
}
