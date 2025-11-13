import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function alphabeticalKeyFrom(title: string): string {
  const k = title?.[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(k) ? k : "#";
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const sheetOverride = form.get("sheet")?.toString();
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Kein Datei-Upload gefunden (field 'file')." }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    const sheetName = sheetOverride || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      return NextResponse.json({ error: `Sheet nicht gefunden: ${sheetName}` }, { status: 400 });
    }
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null });

    let processed = 0;
    let created = 0;
    let updated = 0;

    for (const r of rows) {
      // Bevorzugte Titelquelle
      const titleFinal = (r["Title FINAL"] ?? r["title final"] ?? r["TITLE FINAL"] ?? null) as string | null;
      const berufsbildRaw = (r["Berufsbild"] ?? r["berufsbild"] ?? null) as string | null;
      const title = (titleFinal || berufsbildRaw)?.toString().trim();
      if (!title) continue;

      const slug = slugify(title);
      if (!slug) continue;

      const data: Record<string, any> = {
        title,
        subtitle: null,
        excerpt: (r["description FINAL"] ?? r["Description FINAL"] ?? r["DESCRIPTION FINAL"] ?? null)?.toString() ?? null,
        content: (r["CONTENT"] ?? r["content"] ?? null)?.toString() ?? null,
        category: null,
        heroImageUrl: null,
        seoTitle: null,
        seoDescription: null,
        status: "DRAFT",
        alphabeticalKey: alphabeticalKeyFrom(berufsbildRaw || title),
        // gemappte Zusatzfelder
        berufsbild: (berufsbildRaw ?? null)?.toString() ?? null,
        berufsbildMaennlich: (r["Berufsbild männlich"] ?? null)?.toString() ?? null,
        berufsbildWeiblich: (r["Berufsbild weiblich"] ?? null)?.toString() ?? null,
        kldb: (r["KldB"] ?? null)?.toString() ?? null,
        descriptionFinal: (r["description FINAL"] ?? null)?.toString() ?? null,
        titleFinal: (r["Title FINAL"] ?? null)?.toString() ?? null,
        kidbFinal: (r["KIDB final"] ?? null)?.toString() ?? null,
      };

      const existing = await prisma.profession.findUnique({ where: { slug } });
      if (existing) {
        await prisma.profession.update({
          where: { slug },
          data,
        });
        updated += 1;
      } else {
        await prisma.profession.create({
          data: {
            slug,
            ...data,
          },
        });
        created += 1;
      }
      processed += 1;
    }

    return NextResponse.json({
      ok: true,
      sheet: sheetName,
      totalRows: rows.length,
      processed,
      created,
      updated,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Unbekannter Fehler" }, { status: 500 });
  }
}


