import "server-only";

/**
 * Provider adapter. Resend is implemented via its HTTP API; swap this function to use
 * another transactional provider. Throws on failure so the outbox can retry.
 */
export async function sendEmail(msg: { to: string[]; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("No email provider configured (set RESEND_API_KEY and EMAIL_FROM)");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.text }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Email provider responded ${res.status}`);
}
