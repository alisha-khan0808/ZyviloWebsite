import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AuthError, requireAction } from "@/lib/auth/session";
import { userStore } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/server";
import { audit } from "@/lib/admin/audit";
import { sameOrigin } from "@/lib/security/rate-limit";

const MAX_BYTES = 2 * 1024 * 1024;
// SVG is intentionally excluded (can carry scripts).
const TYPES: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/webp": { ext: "webp", magic: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  "image/gif": { ext: "gif", magic: (b) => b.subarray(0, 3).toString() === "GIF" },
};

export async function POST(req: Request) {
  if (!sameOrigin(req.headers)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  let session;
  try {
    session = await requireAction("content:write");
  } catch (e) {
    return NextResponse.json({ error: (e as AuthError).message }, { status: 403 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is larger than 2 MB" }, { status: 400 });
  const type = TYPES[file.type];
  const buf = Buffer.from(await file.arrayBuffer());
  if (!type || !type.magic(buf)) return NextResponse.json({ error: "Only PNG, JPEG, WebP or GIF images are allowed" }, { status: 400 });

  const name = `${randomUUID()}.${type.ext}`;
  let url: string;
  if (isSupabaseConfigured()) {
    const storage = createServiceClient().storage.from("media");
    const { error } = await storage.upload(name, buf, { contentType: file.type, upsert: false });
    if (error) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    url = storage.getPublicUrl(name).data.publicUrl;
  } else {
    const dir = path.join(process.env.LOCAL_DATA_DIR || path.join(process.cwd(), ".data"), "uploads");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), buf);
    url = `/api/media/${name}`;
  }
  const alt = String(form.get("alt") ?? "").slice(0, 200);
  const row = await userStore().insert("media", { path: name, url, mime: file.type, size: file.size, alt, created_by: session.userId });
  await audit(session.userId, "media.upload", "media", (row as { id: string }).id, { size: file.size, mime: file.type });
  return NextResponse.json({ ok: true, url });
}
