import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 Sekunden (Maximum für Vercel Pro Plan)

// In-Memory Job State (für Production sollte man Redis oder eine DB verwenden)
let jobState: {
  running: boolean;
  processed: number;
  total: number;
  errors: number;
  current?: string;
  startedAt?: Date;
} = {
  running: false,
  processed: 0,
  total: 0,
  errors: 0,
};

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

    const updateResult = await prisma.profession.update({
      where: { id: profession.id },
      data: {
        content: html,
        contentRegeneratedAt: new Date(),
      },
    });

    console.log(`[Batch] Erfolgreich generiert: ${profession.title} (${profession.id}), Content-Länge: ${html.length} Zeichen`);
    return true;
  } catch (error) {
    console.error(`[Batch] Fehler bei Beruf ${profession.id} (${profession.title}):`, error);
    if (error instanceof Error) {
      console.error(`[Batch] Fehler-Details: ${error.message}, Stack: ${error.stack}`);
    }
    return false;
  }
}

async function runBatchJob() {
  if (jobState.running) {
    console.log("[Batch] Job läuft bereits, überspringe Start");
    return;
  }

  console.log("[Batch] Starte Batch-Job...");
  jobState.running = true;
  jobState.processed = 0;
  jobState.errors = 0;
  jobState.startedAt = new Date();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("[Batch] OPENAI_API_KEY fehlt!");
    jobState.running = false;
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

    jobState.total = professions.length;
    console.log(`[Batch] ${professions.length} Berufe gefunden, die generiert werden müssen`);

    // Batch-Verarbeitung mit Rate-Limiting (2 Requests pro Sekunde)
    const batchSize = 2;
    const delayBetweenBatches = 1000; // 1 Sekunde

    console.log(`[Batch] Starte Verarbeitung von ${professions.length} Berufen in Batches von ${batchSize}`);

    for (let i = 0; i < professions.length; i += batchSize) {
      if (!jobState.running) {
        console.log(`[Batch] Job wurde gestoppt bei Index ${i}`);
        break; // Möglichkeit zum Stoppen
      }

      const batch = professions.slice(i, i + batchSize);
      console.log(`[Batch] Verarbeite Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(professions.length / batchSize)} (${i + 1}-${Math.min(i + batchSize, professions.length)} von ${professions.length})`);

      const promises = batch.map((profession) => {
        jobState.current = profession.title;
        return generateContentForProfession(client, profession).then((success) => {
          if (success) {
            jobState.processed++;
            console.log(`[Batch] Fortschritt: ${jobState.processed}/${jobState.total} (${Math.round((jobState.processed / jobState.total) * 100)}%)`);
          } else {
            jobState.errors++;
            console.log(`[Batch] Fehler bei ${profession.title}, Gesamt-Fehler: ${jobState.errors}`);
          }
        });
      });

      await Promise.all(promises);

      // Rate-Limiting: Warte zwischen Batches
      if (i + batchSize < professions.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log(`[Batch] Job abgeschlossen! Verarbeitet: ${jobState.processed}, Fehler: ${jobState.errors}, Gesamt: ${jobState.total}`);
  } catch (error) {
    console.error("[Batch] Kritischer Fehler im Batch-Job:", error);
    if (error instanceof Error) {
      console.error(`[Batch] Fehler-Details: ${error.message}, Stack: ${error.stack}`);
    }
    jobState.errors++;
  } finally {
    jobState.running = false;
    jobState.current = undefined;
    console.log("[Batch] Job-State zurückgesetzt");
  }
}

export async function POST(req: NextRequest) {
  // Starte den Job im Hintergrund (nicht await!)
  if (!jobState.running) {
    runBatchJob().catch((error) => {
      console.error("Batch-Job Fehler:", error);
      jobState.running = false;
    });
    return NextResponse.json({ ok: true, message: "Batch-Job gestartet" });
  } else {
    return NextResponse.json({ ok: false, message: "Batch-Job läuft bereits" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    running: jobState.running,
    processed: jobState.processed,
    total: jobState.total,
    errors: jobState.errors,
    current: jobState.current,
    startedAt: jobState.startedAt?.toISOString(),
    progress: jobState.total > 0 ? Math.round((jobState.processed / jobState.total) * 100) : 0,
  });
}

export async function DELETE(req: NextRequest) {
  // Stoppe den Job
  jobState.running = false;
  return NextResponse.json({ ok: true, message: "Batch-Job gestoppt" });
}

