import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const OPENAI_TIMEOUT_MS = 120_000; // 2 Minuten max pro OpenAI-Request
const ITEM_TIMEOUT_MS = 150_000; // 2.5 Minuten max pro Beruf inkl. DB-Writes
const HEARTBEAT_INTERVAL_MS = 10_000; // Heartbeat alle 10 Sekunden
const STALE_THRESHOLD_MS = 60_000; // Job gilt als tot wenn >60s kein Heartbeat

async function getJobState() {
  return await retryDbOperation(async () => {
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
    };
  });
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
  await retryDbOperation(async () => {
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
  });
}

async function addErrorLog(professionId: string, title: string, error: any) {
  try {
    const currentState = await getJobState();
    const errorLogs = (currentState.errorLogs as any[]) || [];
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    errorLogs.push({
      professionId,
      title,
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });
    
    await updateJobState({ errorLogs });
  } catch (logError) {
    // Wenn das Loggen fehlschlägt, nur in Console ausgeben
    console.error(`[Batch] Fehler beim Loggen: ${logError}`);
  }
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
  // Entferne Nummerierungen wie "Kategorie1:", "Kategorie2:", etc. aus dem HTML
  // Sucht nach Mustern wie "Kategorie1:", "Kategorie2:", "Kategorie 1:", "Kategorie 2:", etc.
  let cleaned = html.replace(/\bKategorie\s*\d+\s*:\s*/gi, "");
  
  // Entferne die Beispiel-Kategorien, falls sie wörtlich übernommen wurden
  const exampleCategories = /Technologie,\s*Recht,\s*Ethik,\s*Compliance,\s*Management/gi;
  cleaned = cleaned.replace(exampleCategories, "");
  
  return cleaned;
}

// Retry-Logik für Datenbankoperationen
async function retryDbOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        const waitTime = delayMs * attempt;
        console.log(`[Batch] DB-Operation fehlgeschlagen, Versuch ${attempt}/${maxRetries}, warte ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError;
}

// Timeout-Wrapper: bricht ab wenn eine Operation zu lange dauert
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

// Heartbeat: aktualisiert updatedAt regelmäßig damit Stale-Detection funktioniert
async function updateHeartbeat() {
  try {
    await prisma.batchJob.update({
      where: { id: "batch-job" },
      data: { updatedAt: new Date() },
    });
  } catch {
    // Heartbeat-Fehler sind nicht kritisch
  }
}

// Prüft ob ein laufender Job eigentlich tot/stale ist
async function isJobStale(): Promise<boolean> {
  const job = await prisma.batchJob.findUnique({ where: { id: "batch-job" } });
  if (!job || !job.running) return false;
  const age = Date.now() - job.updatedAt.getTime();
  return age > STALE_THRESHOLD_MS;
}

async function generateContentForProfession(
  client: OpenAI,
  profession: { id: string; title: string; slug: string; berufsbild: string | null },
  onProgress: () => Promise<void>,
): Promise<boolean> {
  console.log(`[Batch] Starte Generierung für: ${profession.title} (${profession.id})`);
  try {
    const system = `Du bist ein Redakteur für eine deutschsprachige Website für Berufsorientierung.
Schreibe konsequent in DU-Form, verständlich, motivierend und präzise – aber inhaltlich tief.
Liefere reines HTML ohne <html> oder <body>; KEINE Markdown-Codeblöcke (keine \`\`\`), nur pures HTML.
Strukturiere sauber mit <h2>/<h3>, Absätzen und Listen.
Ziel: Hohe Detailtiefe, Praxisnähe, Beispiele und konkrete Informationen.`;

    const berufsbildText = profession.berufsbild ? `Berufsbild: ${profession.berufsbild}` : "";
    const user = `Erstelle eine SEHR AUSFÜHRLICHE, klar gegliederte Berufsbeschreibung (mindestens 2000–2500 Wörter) für:
„${profession.title}“
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
      return false;
    }

    // Entferne umschließende Markdown-Codefences
    if (html.startsWith("```")) {
      html = html.replace(/^```[a-zA-Z0-9]*\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    // Entferne evtl. wiederholten Titel als erste Überschrift
    html = removeRepeatedTitleAtStart(html, profession.title);

    // Entferne Nummerierungen aus Kategorien
    html = cleanCategoryNumbering(html);

    // Datenbank-Update mit Retry-Logik
    await retryDbOperation(async () => {
      await prisma.profession.update({
        where: { id: profession.id },
        data: {
          content: html,
          contentRegeneratedAt: new Date(),
        },
      });
    });

    console.log(`[Batch] Erfolgreich generiert: ${profession.title} (${profession.id}), Content-Länge: ${html.length} Zeichen`);
    
    // Kurze Pause nach DB-Update, um Verbindungen freizugeben
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Progress wird nach erfolgreichem Update aktualisiert
    await onProgress();
    return true;
  } catch (error) {
    console.error(`[Batch] Fehler bei Beruf ${profession.id} (${profession.title}):`, error);
    if (error instanceof Error) {
      console.error(`[Batch] Fehler-Details: ${error.message}, Stack: ${error.stack}`);
    }
    // Fehler-Details speichern
    await addErrorLog(profession.id, profession.title, error);
    return false;
  }
}

async function runBatchJob() {
  const currentState = await getJobState();
  if (currentState.running) {
    console.log("[Batch] Job läuft bereits, überspringe Start");
    return;
  }

  console.log("[Batch] Starte Batch-Job...");
  
  // Zuerst die Anzahl der Berufe ohne contentRegeneratedAt ermitteln
  const totalCount = await retryDbOperation(async () => {
    return await prisma.profession.count({
      where: {
        contentRegeneratedAt: null, // Nur Berufe ohne Generierungs-Datum
      },
    });
  });
  console.log(`[Batch] Gefunden: ${totalCount} Berufe ohne contentRegeneratedAt`);
  
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[Batch] OPENAI_API_KEY fehlt!");
    await updateJobState({ running: false });
    return;
  }

  const client = new OpenAI({ apiKey, timeout: OPENAI_TIMEOUT_MS });

  try {
    // Nur Berufe laden, die noch kein contentRegeneratedAt haben
    console.log("[Batch] Lade Berufe aus Datenbank (nur ohne contentRegeneratedAt)...");
    const professions = await retryDbOperation(async () => {
      return await prisma.profession.findMany({
        where: {
          contentRegeneratedAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          berufsbild: true,
        },
        orderBy: [{ updatedAt: "desc" }],
      });
    });

    // Total sollte bereits gesetzt sein, aber zur Sicherheit nochmal setzen
    if (professions.length !== totalCount) {
      console.log(`[Batch] Warnung: Count (${totalCount}) != Array-Länge (${professions.length}), aktualisiere total`);
      await updateJobState({ total: professions.length });
    }
    console.log(`[Batch] ${professions.length} Berufe gefunden, die generiert werden müssen`);

    const delayBetweenRequests = 2000;

    console.log(`[Batch] Starte sequenzielle Verarbeitung von ${professions.length} Berufen`);

    // Heartbeat-Interval starten
    const heartbeatInterval = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL_MS);

    try {
      for (let i = 0; i < professions.length; i++) {
        const state = await getJobState();
        if (!state.running) {
          console.log(`[Batch] Job wurde gestoppt bei Index ${i}`);
          break;
        }

        const profession = professions[i];
        console.log(`[Batch] Verarbeite ${i + 1}/${professions.length}: ${profession.title}`);

        await updateHeartbeat();

        let success: boolean;
        try {
          success = await withTimeout(
            generateContentForProfession(client, profession, async () => {
              const currentState = await getJobState();
              const newProcessed = currentState.processed + 1;
              const completedItems = ((currentState.completedItems as any[]) || []).slice(-49);
              completedItems.push({
                title: profession.title,
                slug: profession.slug,
                timestamp: new Date().toISOString(),
              });
              await updateJobState({
                processed: newProcessed,
                current: profession.title,
                completedItems,
              });
              console.log(`[Batch] Fortschritt: ${newProcessed}/${currentState.total} (${Math.round((newProcessed / currentState.total) * 100)}%)`);
            }),
            ITEM_TIMEOUT_MS,
            `Gesamtverarbeitung von "${profession.title}"`,
          );
        } catch (timeoutError) {
          console.error(`[Batch] Timeout bei ${profession.title}:`, timeoutError);
          await addErrorLog(profession.id, profession.title, timeoutError);
          success = false;
        }

        if (!success) {
          const currentState = await getJobState();
          await updateJobState({
            errors: currentState.errors + 1,
          });
          console.log(`[Batch] Fehler bei ${profession.title}, Gesamt-Fehler: ${currentState.errors + 1}`);
        }

        if (i < professions.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
        }
      }
    } finally {
      clearInterval(heartbeatInterval);
    }

    const finalState = await getJobState();
    console.log(`[Batch] Job abgeschlossen! Verarbeitet: ${finalState.processed}, Fehler: ${finalState.errors}, Gesamt: ${finalState.total}`);
  } catch (error) {
    console.error("[Batch] Kritischer Fehler im Batch-Job:", error);
    if (error instanceof Error) {
      console.error(`[Batch] Fehler-Details: ${error.message}, Stack: ${error.stack}`);
    }
    const currentState = await getJobState();
    await updateJobState({ errors: currentState.errors + 1 });
  } finally {
    await updateJobState({
      running: false,
      current: null,
    });
    console.log("[Batch] Job-State zurückgesetzt");
  }
}

export async function POST(req: NextRequest) {
  const currentState = await getJobState();

  if (currentState.running) {
    // Prüfe ob der Job stale/tot ist
    const stale = await isJobStale();
    if (stale) {
      console.log("[Batch] Stale-Job erkannt (kein Heartbeat seit >60s), setze zurück und starte neu");
      await updateJobState({ running: false, current: null });
    } else {
      return NextResponse.json({ ok: false, message: "Batch-Job läuft bereits" }, { status: 400 });
    }
  }

  runBatchJob().catch(async (error) => {
    console.error("Batch-Job Fehler:", error);
    await updateJobState({ running: false, current: null });
  });
  return NextResponse.json({ ok: true, message: "Batch-Job gestartet" });
}

export async function GET(req: NextRequest) {
  const state = await getJobState();
  const stale = state.running ? await isJobStale() : false;

  return NextResponse.json({
    running: state.running,
    stale,
    processed: state.processed,
    total: state.total,
    errors: state.errors,
    current: state.current,
    startedAt: state.startedAt?.toISOString(),
    lastHeartbeat: state.updatedAt?.toISOString(),
    progress: state.total > 0 ? Math.round((state.processed / state.total) * 100) : 0,
    errorLogs: state.errorLogs || [],
    completedItems: state.completedItems || [],
  });
}

export async function DELETE(req: NextRequest) {
  // Stoppe den Job
  await updateJobState({ running: false });
  return NextResponse.json({ ok: true, message: "Batch-Job gestoppt" });
}

