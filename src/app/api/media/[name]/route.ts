import { promises as fs } from "node:fs";
import path from "node:path";

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

/** Serves local-mode uploads. In Supabase mode media is served from Storage instead. */
export async function GET(_: Request, { params }: { params: { name: string } }) {
  const name = path.basename(params.name);
  const ext = name.split(".").pop() ?? "";
  if (!/^[0-9a-f-]{36}\.(png|jpg|webp|gif)$/.test(name)) return new Response("Not found", { status: 404 });
  try {
    const file = await fs.readFile(path.join(process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".data"), "uploads", name));
    return new Response(file, {
      headers: { "Content-Type": MIME[ext], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
