import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse";
import { prisma } from "@/lib/prisma";

type Row = {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  heroImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: "DRAFT" | "PUBLISHED";
};

function alphaKeyFromTitle(title: string): string {
  const key = title?.[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(key) ? key : "#";
}

async function importCsv(filePath: string) {
  const absolute = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolute)) {
    console.error(`Datei nicht gefunden: ${absolute}`);
    process.exit(1);
  }

  const stream = fs.createReadStream(absolute);
  const parser = stream.pipe(
    parse({
      columns: true,
      bom: true,
      trim: true,
      skip_empty_lines: true,
    }),
  );

  let imported = 0;
  for await (const record of parser) {
    const row = record as Row;
    if (!row.slug || !row.title) continue;
    const alphabeticalKey = alphaKeyFromTitle(row.title);
    await prisma.profession.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle || null,
        excerpt: row.excerpt || null,
        content: row.content || null,
        category: row.category || null,
        heroImageUrl: row.heroImageUrl || null,
        seoTitle: row.seoTitle || null,
        seoDescription: row.seoDescription || null,
        status: (row.status as any) ?? "DRAFT",
        alphabeticalKey,
      },
      update: {
        title: row.title,
        subtitle: row.subtitle || null,
        excerpt: row.excerpt || null,
        content: row.content || null,
        category: row.category || null,
        heroImageUrl: row.heroImageUrl || null,
        seoTitle: row.seoTitle || null,
        seoDescription: row.seoDescription || null,
        status: (row.status as any) ?? "DRAFT",
        alphabeticalKey,
      },
    });
    imported += 1;
    if (imported % 500 === 0) {
      console.log(`Importiert: ${imported} …`);
    }
  }
  console.log(`Fertig. Gesamt importiert/aktualisiert: ${imported}`);
}

async function main() {
  const [, , filePath] = process.argv;
  if (!filePath) {
    console.error("Verwendung: npm run import:professions -- <pfad-zur-csv>");
    process.exit(1);
  }
  await importCsv(filePath);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


