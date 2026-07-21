/**
 * Script: Autolinks einmalig für alle veröffentlichten Berufsbilder berechnen
 * und im Feld `contentLinked` speichern.
 *
 * Ausführung: npx tsx scripts/generate-autolinks.ts
 * Optional:  npx tsx scripts/generate-autolinks.ts --force  (überschreibt bestehende)
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH_SIZE = 50;
const MAX_AUTOLINKS = 50;
const forceOverwrite = process.argv.includes("--force");

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeRegexForTerm(term: string): RegExp {
  const tokens = term
    .trim()
    .split(/[\s\-]+/)
    .filter(Boolean)
    .map((t) => escapeRegex(t));
  if (tokens.length === 0) return /$a/u;
  const joined = tokens.join("[\\s\\u00A0\\-]+");
  return new RegExp(`(?<![\\p{L}\\p{N}])(${joined})(?![\\p{L}\\p{N}])`, "iu");
}

function autolinkProfessions(
  html: string,
  ownSlug: string,
  terms: Array<{ text: string; slug: string; quickCheck: string }>
): string {
  if (!html || terms.length === 0) return html;

  const htmlLower = html.toLowerCase();
  const candidates = terms.filter(
    (p) => p.slug !== ownSlug && htmlLower.includes(p.quickCheck)
  );

  const linkedOnce = new Set<string>();
  const parts = html.split(/(<[^>]+>)/g);
  let insideAnchor = false;

  for (let i = 0; i < parts.length; i++) {
    if (linkedOnce.size >= MAX_AUTOLINKS) break;
    const part = parts[i];
    if (part.startsWith("<")) {
      if (/^<a(\s|>)/i.test(part)) insideAnchor = true;
      if (/^<\/a\s*>/i.test(part)) insideAnchor = false;
      continue;
    }
    if (insideAnchor) continue;
    let text = part;
    const textLower = text.toLowerCase();
    for (const p of candidates) {
      if (linkedOnce.size >= MAX_AUTOLINKS) break;
      if (linkedOnce.has(p.slug)) continue;
      if (!textLower.includes(p.quickCheck)) continue;
      const re = makeRegexForTerm(p.text);
      if (!re.test(text)) continue;
      text = text.replace(re, (_m, g1) => {
        if (linkedOnce.has(p.slug)) return _m;
        linkedOnce.add(p.slug);
        return `<a href="/details/${p.slug}">${g1}</a>`;
      });
    }
    parts[i] = text;
  }

  return parts.join("");
}

async function main() {
  console.log("Lade alle veröffentlichten Berufe für Autolink-Terms...");

  const allProfessions = await prisma.profession.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      berufsbild: true,
      berufsbildMaennlich: true,
      berufsbildWeiblich: true,
    },
  });

  console.log(`${allProfessions.length} Berufe gefunden.`);

  // Alle Autolink-Terms vorab aufbauen (einmal für alle)
  const allTerms: Array<{ text: string; slug: string; quickCheck: string }> = [];
  for (const p of allProfessions) {
    const names = [p.berufsbild, p.berufsbildMaennlich, p.berufsbildWeiblich, p.title];
    const seen = new Set<string>();
    for (const name of names) {
      if (!name || name.length < 4) continue;
      const key = name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const tokens = name.trim().split(/[\s\-\/]+/).filter(Boolean);
      const longest = tokens.reduce((a, b) => (a.length >= b.length ? a : b), "");
      allTerms.push({
        text: name.trim(),
        slug: p.slug,
        quickCheck: longest.toLowerCase(),
      });
    }
  }

  // Sortiere nach Länge absteigend (längere Matches zuerst)
  allTerms.sort((a, b) => b.text.length - a.text.length);
  console.log(`${allTerms.length} Autolink-Terms aufgebaut.`);

  // Berufe mit Content laden und in Batches verarbeiten
  const toProcess = await prisma.profession.findMany({
    where: {
      status: "PUBLISHED",
      content: { not: null },
      ...(forceOverwrite ? {} : { contentLinked: null }),
    },
    select: { id: true, slug: true, content: true },
  });

  console.log(
    `${toProcess.length} Berufe zu verarbeiten${forceOverwrite ? " (--force)" : " (nur ohne contentLinked)"}.`
  );

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const updates = batch.map((p) => {
      try {
        const linked = autolinkProfessions(p.content!, p.slug, allTerms);
        return prisma.$executeRaw`
          UPDATE "Profession"
          SET "content_linked" = ${linked}
          WHERE "id" = ${p.id}
        `;
      } catch (e) {
        errors++;
        console.error(`  Fehler bei ${p.slug}:`, e);
        return null;
      }
    });

    await Promise.all(updates.filter(Boolean));
    processed += batch.length;

    if (processed % 200 === 0 || processed === toProcess.length) {
      console.log(`  ${processed}/${toProcess.length} verarbeitet...`);
    }
  }

  console.log(`\nFertig! ${processed} verarbeitet, ${errors} Fehler.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
