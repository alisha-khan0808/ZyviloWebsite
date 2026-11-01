import { handleLeadSubmission } from "@/lib/leads/intake";
import { buildQuickLead } from "@/lib/leads/build";
import { quickEnquirySchema } from "@/lib/validation/lead";

export async function POST(req: Request) {
  return handleLeadSubmission(req, quickEnquirySchema, buildQuickLead);
}
