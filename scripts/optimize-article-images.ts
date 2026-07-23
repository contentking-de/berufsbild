import { PrismaClient } from "@prisma/client";
import { put, del } from "@vercel/blob";
import sharp from "sharp";
import "dotenv/config";

const TARGET_SIZE = 100 * 1024; // 100 KB
const MAX_WIDTH = 1200;

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({
    where: { coverImageUrl: { not: null } },
    select: { id: true, title: true, coverImageUrl: true },
  });

  console.log(`\n${articles.length} Artikel mit Cover-Bild gefunden.\n`);

  let optimized = 0;
  let skipped = 0;
  let failed = 0;

  for (const article of articles) {
    const url = article.coverImageUrl!;
    const shortTitle = article.title.slice(0, 50);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`  SKIP  ${shortTitle} — Bild nicht erreichbar (${res.status})`);
        skipped++;
        continue;
      }

      const originalBuf = Buffer.from(await res.arrayBuffer());
      const originalKB = (originalBuf.length / 1024).toFixed(1);

      if (originalBuf.length <= TARGET_SIZE) {
        console.log(`  OK    ${shortTitle} — ${originalKB} KB`);
        skipped++;
        continue;
      }

      console.log(`  BIG   ${shortTitle} — ${originalKB} KB → komprimiere …`);

      let quality = 80;
      let outputBuf: Buffer;

      const meta = await sharp(originalBuf).metadata();
      const needsResize = (meta.width ?? 0) > MAX_WIDTH;

      // Iterative Qualitätsreduktion bis unter 100 KB
      while (true) {
        let pipeline = sharp(originalBuf);
        if (needsResize) {
          pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
        }
        outputBuf = await pipeline
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();

        if (outputBuf.length <= TARGET_SIZE || quality <= 20) break;
        quality -= 10;
      }

      const newKB = (outputBuf!.length / 1024).toFixed(1);

      // Auf Vercel Blob hochladen
      const blobName = `articles/${Date.now()}_optimized.jpg`;
      const blob = await put(blobName, outputBuf!, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN!,
        contentType: "image/jpeg",
      });

      // DB aktualisieren
      await prisma.article.update({
        where: { id: article.id },
        data: { coverImageUrl: blob.url },
      });

      // Altes Blob löschen
      try {
        await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN! });
      } catch {
        // Altes Blob konnte nicht gelöscht werden — unkritisch
      }

      console.log(`  DONE  ${shortTitle} — ${originalKB} KB → ${newKB} KB (q=${quality})`);
      optimized++;
    } catch (err: any) {
      console.error(`  FAIL  ${shortTitle} — ${err?.message}`);
      failed++;
    }
  }

  console.log(`\nFertig: ${optimized} optimiert, ${skipped} übersprungen, ${failed} fehlgeschlagen.\n`);
  await prisma.$disconnect();
}

main();
