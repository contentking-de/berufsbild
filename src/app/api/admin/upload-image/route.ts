import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Kein Datei-Upload gefunden (field 'file')." }, { status: 400 });
    }
    const filename = (form.get("filename")?.toString() || (file as any).name || "upload") as string;
    const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const objectName = `articles/${Date.now()}_${safeName}`;

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN fehlt" }, { status: 500 });
    }

    const blob = await put(objectName, file as any, {
      access: "public",
      token,
    });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Upload fehlgeschlagen" }, { status: 500 });
  }
}


