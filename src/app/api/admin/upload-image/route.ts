import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 100 * 1024; // 100 KB
const MAX_WIDTH = 1200;

async function optimizeImage(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const needsResize = (meta.width ?? 0) > MAX_WIDTH;

  let quality = 80;
  let output: Buffer;

  while (true) {
    let pipeline = sharp(input);
    if (needsResize) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }
    output = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    if (output.length <= MAX_BYTES || quality <= 20) break;
    quality -= 10;
  }

  return output;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Kein Datei-Upload gefunden (field 'file')." }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN fehlt" }, { status: 500 });
    }

    const rawBuf = Buffer.from(await file.arrayBuffer());

    let uploadBuf: Buffer;
    let contentType: string;
    let ext: string;

    if (rawBuf.length > MAX_BYTES) {
      uploadBuf = await optimizeImage(rawBuf);
      contentType = "image/jpeg";
      ext = "jpg";
    } else {
      uploadBuf = rawBuf;
      contentType = file.type || "image/jpeg";
      const filename = form.get("filename")?.toString() || "upload";
      ext = filename.split(".").pop() || "jpg";
    }

    const objectName = `articles/${Date.now()}_optimized.${ext}`;

    const blob = await put(objectName, uploadBuf, {
      access: "public",
      token,
      contentType,
    });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Upload fehlgeschlagen" }, { status: 500 });
  }
}


