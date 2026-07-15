import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const OPENAI_TIMEOUT_MS = 90_000;

async function getJobState() {
  const job = await prisma.batchJob.findUnique({
    where: { id: "batch-job" },
  });
  return job || {
    id: "batch-job",
    running: false,
    processed: 0,
    total: 0,
    errors: 0,
    current: null,
    startedAt: null,
    updatedAt: new Date(),
    errorLogs: [],
    completedItems: [],
  };
}

async function updateJobState(data: {
  running?: boolean;
  processed?: number;
  total?: number;
  errors?: number;
  current?: string | null;
  startedAt?: Date | null;
  errorLogs?: any;
  completedItems?: any;
}) {
  await prisma.batchJob.upsert({
    where: { id: "batch-job" },
    create: {
      id: "batch-job",
      running: data.running ?? false,
      processed: data.processed ?? 0,
      total: data.total ?? 0,
      errors: data.errors ?? 0,
      current: data.current ?? null,
      startedAt: data.startedAt ?? null,
      errorLogs: data.errorLogs ?? [],
      completedItems: data.completedItems ?? [],
    },
    update: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout nach ${ms}ms: ${label}`));
    }, ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function removeRepeatedTitleAtStart(html: string, title: string): string {
  const re = /^\s*<(h1|h2)[^>]*>([\s\S]{0,200}?)<\/\1>/i;
  const m = html.match(re);
  if (!m) return html;
  const headingText = normalizeText(stripHtml(m[2] || ""));
  const titleNorm = normalizeText(title);
  if (headingText === titleNorm || headingText.startsWith(titleNorm)) {
    return html.replace(re, "").trimStart();
  }
  return html;
}

function cleanCategoryNumbering(html: string): string {
  let cleaned = html.replace(/\bKategorie\s*\d+\s*:\s*/gi, "");
  const exampleCategories = /Technologie,\s*Recht,\s*Ethik,\s*Compliance,\s*Management/gi;
  cleaned = cleaned.replace(exampleCategories, "");
  return cleaned;
}

/**
 * Verarbeitet genau EINEN Beruf und gibt das Ergebnis zurück.
 * Wird vom Client wiederholt aufgerufen (Client-driven chaining).
 */
async function processNextProfession(): Promise<{
  success: boolean;
  done: boolean;
  title?: string;
  slug?: string;
  error?: string;
}> {
  const profession = await prisma.profession.findFirst({
    where: { contentRegeneratedAt: null },
    select: { id: true, title: true, slug: true, berufsbild: true },
    orderBy: [{ updatedAt: "desc" }],
  });

  if (!profession) {
    return { success: true, done: true };
  }

  await updateJobState({ current: profession.title });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, done: false, title: profession.title, error: "OPENAI_API_KEY fehlt" };
  }

  const client = new OpenAI({ apiKey, timeout: OPENAI_TIMEOUT_MS });

  const system = `Du bist ein Redakteur für eine deutschsprachige Website für Berufsorientierung.
Schreibe konsequent in DU-Form, verständlich, motivierend und präzise – aber inhaltlich tief.
Liefere reines HTML ohne <html> oder <body>; KEINE Markdown-Codeblöcke (keine \`\`\`), nur pures HTML.
Strukturiere sauber mit <h2>/<h3>, Absätzen und Listen.
Ziel: Hohe Detailtiefe, Praxisnähe, Beispiele und konkrete Informationen.`;

  const berufsbildText = profession.berufsbild ? `Berufsbild: ${profession.berufsbild}` : "";
  const user = `Erstelle eine SEHR AUSFÜHRLICHE, klar gegliederte Berufsbeschreibung (mindestens 2000–2500 Wörter) für:
„${profession.title}"
${berufsbildText ? berufsbildText + "\n" : ""}

WICHTIG: Verwende EXAKT folgende Struktur mit diesen Überschriften (als <h2>):

1. <h2>Überblick über das Berufsbild: [Berufsname]</h2>
   - Einleitender Absatz, der das Berufsbild vorstellt und seine Bedeutung erklärt
   - 2-3 Absätze mit Hintergrundinformationen, Rolle und Relevanz des Berufs

2. <h2>Voraussetzungen: Ausbildung und Studium</h2>
   - Welche Ausbildungen/Studiengänge führen zu diesem Beruf?
   - Dauer, Zugangsvoraussetzungen, Alternativen
   - Spezialisierungen und Weiterbildungen

3. <h2>Typische Aufgaben eines [Berufsname im Genitiv]</h2>
   - Detaillierte Auflistung der Hauptaufgaben
   - Tägliche Arbeitsabläufe, Projekte, Verantwortlichkeiten
   - Unterschiedliche Arbeitsbereiche/Branchen

4. <h2>Gehaltserwartungen</h2>
   - Einstiegsgehalt, Durchschnittsgehalt, Spitzengehälter
   - Regionale Unterschiede
   - Faktoren, die das Gehalt beeinflussen

5. <h2>Karrierechancen</h2>
   - Aufstiegsmöglichkeiten, Führungspositionen
   - Spezialisierungsmöglichkeiten
   - Branchenwechsel, Selbständigkeit

6. <h2>Anforderungen an die Stelle</h2>
   - Fachliche Kompetenzen
   - Soft Skills
   - Persönliche Eigenschaften
   - Formale Qualifikationen

7. <h2>Zukunftsaussichten</h2>
   - Marktentwicklung, Nachfrage
   - Technologische Einflüsse
   - Trends und Entwicklungen

8. <h2>Fazit</h2>
   - Zusammenfassung, für wen der Beruf geeignet ist
   - Ausblick

9. <h3>Häufig gestellte Fragen zum Beruf [Berufsname]</h3>
   - 6-10 Fragen als <details><summary>Frage</summary><p>Antwort</p></details>
   - Direkt darunter ein JSON-LD Block (Schema.org FAQPage) mit denselben Q&As

10. <h3>Mögliche Synonyme</h3>
    - Liste mit <ul><li>Synonym 1</li><li>Synonym 2</li>...</ul>
    - 3-5 verwandte Berufsbezeichnungen

11. <h3>Kategorisierung</h3>
    - Fett gedruckt: <strong>Kategorie1, Kategorie2, Kategorie3, ...</strong>
    - 4-6 relevante Kategorien, die ZUM SPEZIFISCHEN BERUFSBILD passen (z.B. Branche, Fachbereich, Tätigkeitsfeld)
    - WICHTIG: Generiere passende Kategorien für DIESEN spezifischen Beruf, NICHT die Beispiel-Kategorien verwenden!
    - Nur die Kategorienamen ohne Nummerierung oder "Kategorie"-Präfix verwenden!

Rahmenbedingungen:
- Zielgruppe: Schüler:innen & Student:innen, Ansprache: DU
- Verwende KEINEN <h1>
- Nutze normale Absätze <p> für Text
- Reines HTML ohne <html>/<body> und OHNE Markdown-Codefences (\`\`\`)

Liefere ausschließlich das HTML mit dieser exakten Struktur.`;

  try {
    const completion = await withTimeout(
      client.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      OPENAI_TIMEOUT_MS,
      `OpenAI-Request für "${profession.title}"`,
    );

    let html = completion.choices[0]?.message?.content?.trim() || "";
    if (!html) {
      return { success: false, done: false, title: profession.title, slug: profession.slug, error: "Leere Antwort von OpenAI" };
    }

    if (html.startsWith("```")) {
      html = html.replace(/^```[a-zA-Z0-9]*\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    html = removeRepeatedTitleAtStart(html, profession.title);
    html = cleanCategoryNumbering(html);

    await prisma.profession.update({
      where: { id: profession.id },
      data: {
        content: html,
        contentRegeneratedAt: new Date(),
      },
    });

    return { success: true, done: false, title: profession.title, slug: profession.slug };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Batch] Fehler bei ${profession.title}:`, msg);
    return { success: false, done: false, title: profession.title, slug: profession.slug, error: msg };
  }
}

// POST: Job starten (setzt nur den Status, verarbeitet nichts)
export async function POST(req: NextRequest) {
  const totalCount = await prisma.profession.count({
    where: { contentRegeneratedAt: null },
  });

  await updateJobState({
    running: true,
    processed: 0,
    total: totalCount,
    errors: 0,
    startedAt: new Date(),
    current: null,
    errorLogs: [],
    completedItems: [],
  });

  return NextResponse.json({ ok: true, message: "Batch-Job gestartet", total: totalCount });
}

// PUT: Verarbeitet genau EINEN Beruf (wird vom Client getriggert)
export async function PUT(req: NextRequest) {
  const state = await getJobState();
  if (!state.running) {
    return NextResponse.json({ ok: false, message: "Kein laufender Job" }, { status: 400 });
  }

  const result = await processNextProfession();

  if (result.done) {
    await updateJobState({ running: false, current: null });
    return NextResponse.json({ ok: true, done: true, processed: state.processed, total: state.total });
  }

  if (result.success) {
    const completedItems = ((state.completedItems as any[]) || []).slice(-99);
    completedItems.push({
      title: result.title,
      slug: result.slug,
      timestamp: new Date().toISOString(),
    });
    await updateJobState({
      processed: state.processed + 1,
      current: null,
      completedItems,
    });
    return NextResponse.json({ ok: true, done: false, success: true, title: result.title, slug: result.slug });
  } else {
    const errorLogs = ((state.errorLogs as any[]) || []);
    errorLogs.push({
      professionId: "",
      title: result.title || "Unbekannt",
      error: result.error || "Unbekannter Fehler",
      timestamp: new Date().toISOString(),
    });
    await updateJobState({
      errors: state.errors + 1,
      current: null,
      errorLogs,
    });
    return NextResponse.json({ ok: true, done: false, success: false, title: result.title, error: result.error });
  }
}

// GET: Status abfragen
export async function GET(req: NextRequest) {
  const state = await getJobState();

  return NextResponse.json({
    running: state.running,
    processed: state.processed,
    total: state.total,
    errors: state.errors,
    current: state.current,
    startedAt: state.startedAt?.toISOString(),
    progress: state.total > 0 ? Math.round((state.processed / state.total) * 100) : 0,
    errorLogs: state.errorLogs || [],
    completedItems: state.completedItems || [],
  });
}

// DELETE: Job stoppen
export async function DELETE(req: NextRequest) {
  await updateJobState({ running: false, current: null });
  return NextResponse.json({ ok: true, message: "Batch-Job gestoppt" });
}
