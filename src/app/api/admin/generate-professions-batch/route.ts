import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 Sekunden (Maximum für Vercel Pro Plan)

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
    },
    update: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

async function addErrorLog(professionId: string, title: string, error: any) {
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

async function generateContentForProfession(
  client: OpenAI,
  profession: { id: string; title: string; berufsbild: string | null },
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
   - 6-10 Fragen als <details><summary>Frage</summary>Antwort</details>
   - Direkt darunter ein JSON-LD Block (Schema.org FAQPage) mit denselben Q&As

10. <h3>Mögliche Synonyme</h3>
    - Liste mit <ul><li>Synonym 1</li><li>Synonym 2</li>...</ul>
    - 3-5 verwandte Berufsbezeichnungen

11. <h3>Kategorisierung</h3>
    - Fett gedruckt: <strong>Kategorie1, Kategorie2, Kategorie3, ...</strong>
    - 4-6 relevante Kategorien (z.B. Branche, Fachbereich, Tätigkeitsfeld)

Rahmenbedingungen:
- Zielgruppe: Schüler:innen & Student:innen, Ansprache: DU
- Verwende KEINEN <h1>
- Nutze normale Absätze <p> für Text
- Reines HTML ohne <html>/<body> und OHNE Markdown-Codefences (\`\`\`)

Liefere ausschließlich das HTML mit dieser exakten Struktur.`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

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

    await prisma.profession.update({
      where: { id: profession.id },
      data: {
        content: html,
        contentRegeneratedAt: new Date(),
      },
    });

    console.log(`[Batch] Erfolgreich generiert: ${profession.title} (${profession.id}), Content-Länge: ${html.length} Zeichen`);
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
  
  // Zuerst die Anzahl der Berufe ermitteln, damit total sofort verfügbar ist
  const totalCount = await prisma.profession.count();
  console.log(`[Batch] Gefunden: ${totalCount} Berufe insgesamt`);
  
  await updateJobState({
    running: true,
    processed: 0,
    total: totalCount,
    errors: 0,
    startedAt: new Date(),
    current: null,
    errorLogs: [],
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[Batch] OPENAI_API_KEY fehlt!");
    await updateJobState({ running: false });
    return;
  }

  const client = new OpenAI({ apiKey });

  try {
    // Alle Berufe laden (auch die mit vorhandenem Content)
    console.log("[Batch] Lade Berufe aus Datenbank...");
    const professions = await prisma.profession.findMany({
      select: {
        id: true,
        title: true,
        berufsbild: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    // Total sollte bereits gesetzt sein, aber zur Sicherheit nochmal setzen
    if (professions.length !== totalCount) {
      console.log(`[Batch] Warnung: Count (${totalCount}) != Array-Länge (${professions.length}), aktualisiere total`);
      await updateJobState({ total: professions.length });
    }
    console.log(`[Batch] ${professions.length} Berufe gefunden, die generiert werden müssen`);

    // Batch-Verarbeitung mit Rate-Limiting (2 Requests pro Sekunde)
    const batchSize = 2;
    const delayBetweenBatches = 1000; // 1 Sekunde

    console.log(`[Batch] Starte Verarbeitung von ${professions.length} Berufen in Batches von ${batchSize}`);

    for (let i = 0; i < professions.length; i += batchSize) {
      const state = await getJobState();
      if (!state.running) {
        console.log(`[Batch] Job wurde gestoppt bei Index ${i}`);
        break; // Möglichkeit zum Stoppen
      }

      const batch = professions.slice(i, i + batchSize);
      console.log(`[Batch] Verarbeite Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(professions.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, professions.length)} von ${professions.length})`);

      const promises = batch.map((profession) => {
        return generateContentForProfession(client, profession, async () => {
          const currentState = await getJobState();
          const newProcessed = currentState.processed + 1;
          await updateJobState({
            processed: newProcessed,
            current: profession.title,
          });
          console.log(`[Batch] Fortschritt: ${newProcessed}/${currentState.total} (${Math.round((newProcessed / currentState.total) * 100)}%)`);
        }).then(async (success) => {
          if (!success) {
            const currentState = await getJobState();
            await updateJobState({
              errors: currentState.errors + 1,
            });
            console.log(`[Batch] Fehler bei ${profession.title}, Gesamt-Fehler: ${currentState.errors + 1}`);
          }
        });
      });

      await Promise.all(promises);

      // Rate-Limiting: Warte zwischen Batches
      if (i + batchSize < professions.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
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
  // Starte den Job im Hintergrund (nicht await!)
  const currentState = await getJobState();
  if (!currentState.running) {
    runBatchJob().catch(async (error) => {
      console.error("Batch-Job Fehler:", error);
      await updateJobState({ running: false });
    });
    return NextResponse.json({ ok: true, message: "Batch-Job gestartet" });
  } else {
    return NextResponse.json({ ok: false, message: "Batch-Job läuft bereits" }, { status: 400 });
  }
}

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
  });
}

export async function DELETE(req: NextRequest) {
  // Stoppe den Job
  await updateJobState({ running: false });
  return NextResponse.json({ ok: true, message: "Batch-Job gestoppt" });
}

