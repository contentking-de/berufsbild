import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 Minuten Timeout

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
  return html.replace(/\bKategorie\s*\d+\s*:\s*/gi, "");
}

async function generateMetadata(berufsbild: string): Promise<{ title: string; subtitle: string | null; slug: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY fehlt");
  }

  const client = new OpenAI({ apiKey });

  const system = `Du bist ein Redakteur für eine deutschsprachige Website für Berufsorientierung.
Generiere präzise und professionelle Metadaten für Berufsbilder.`;

  const user = `Basierend auf folgendem Berufsbild, generiere die Metadaten:

Berufsbild: "${berufsbild}"

Bitte generiere:
1. **Title**: Der offizielle, präzise Titel des Berufs (z.B. "Medizinische/r Fachangestellte/r")
2. **Subtitle**: Ein kurzer, prägnanter Untertitel, der den Beruf beschreibt (max. 100 Zeichen, optional)
3. **Slug**: Ein URL-freundlicher Slug (kleingeschrieben, Bindestriche statt Leerzeichen, z.B. "medizinische-fachangestellte")

Antworte NUR im folgenden JSON-Format (keine zusätzlichen Erklärungen):
{
  "title": "Titel hier",
  "subtitle": "Untertitel hier oder null",
  "slug": "slug-hier"
}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Keine Metadaten generiert");
  }

  const metadata = JSON.parse(content);
  
  // Validierung
  if (!metadata.title || !metadata.slug) {
    throw new Error("Ungültige Metadaten generiert");
  }

  // Titel im gewünschten Format: "Berufsbild [Berufsbild-Name] - Berufsbeschreibung und Details"
  const formattedTitle = `Berufsbild ${berufsbild} - Berufsbeschreibung und Details`;

  return {
    title: formattedTitle,
    subtitle: metadata.subtitle?.trim() || null,
    slug: metadata.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
  };
}

async function generateContentForProfession(
  client: OpenAI,
  title: string,
  berufsbild: string | null
): Promise<string> {
  const system = `Du bist ein Redakteur für eine deutschsprachige Website für Berufsorientierung.
Schreibe konsequent in DU-Form, verständlich, motivierend und präzise – aber inhaltlich tief.
Liefere reines HTML ohne <html> oder <body>; KEINE Markdown-Codeblöcke (keine \`\`\`), nur pures HTML.
Strukturiere sauber mit <h2>/<h3>, Absätzen und Listen.
Ziel: Hohe Detailtiefe, Praxisnähe, Beispiele und konkrete Informationen.`;

  const berufsbildText = berufsbild ? `Berufsbild: ${berufsbild}` : "";
  const user = `Erstelle eine SEHR AUSFÜHRLICHE, klar gegliederte Berufsbeschreibung (mindestens 2000–2500 Wörter) für:
„${title}"
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
    - Fett gedruckt: <strong>Technologie, Recht, Ethik, Compliance, Management</strong>
    - 4-6 relevante Kategorien (z.B. Branche, Fachbereich, Tätigkeitsfeld)
    - WICHTIG: Nur die Kategorienamen ohne Nummerierung oder "Kategorie"-Präfix verwenden!

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
    throw new Error("Kein Inhalt generiert");
  }

  // Entferne umschließende Markdown-Codefences
  if (html.startsWith("```")) {
    html = html.replace(/^```[a-zA-Z0-9]*\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  // Entferne evtl. wiederholten Titel als erste Überschrift
  html = removeRepeatedTitleAtStart(html, title);

  // Entferne Nummerierungen aus Kategorien
  html = cleanCategoryNumbering(html);

  return html;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { berufsbilder } = body;

    if (!Array.isArray(berufsbilder) || berufsbilder.length === 0) {
      return NextResponse.json({ error: "Keine Berufsbilder angegeben" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY fehlt" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });
    const results: Array<{ berufsbild: string; success: boolean; id?: string; error?: string }> = [];

    for (const berufsbild of berufsbilder) {
      const trimmedBerufsbild = berufsbild.trim();
      if (!trimmedBerufsbild) continue;

      try {
        // 1. Metadaten generieren
        const metadata = await generateMetadata(trimmedBerufsbild);

        // 2. Profession erstellen mit Status PUBLISHED
        const key = trimmedBerufsbild[0]?.toUpperCase();
        const alphabeticalKey = /[A-Z]/.test(key) ? key : "#";

        const profession = await prisma.profession.create({
          data: {
            title: metadata.title,
            subtitle: metadata.subtitle || null,
            slug: metadata.slug,
            berufsbild: trimmedBerufsbild,
            alphabeticalKey,
            status: "PUBLISHED",
          },
        });

        // 3. Content generieren (optional, Fehler werden ignoriert)
        try {
          const content = await generateContentForProfession(client, metadata.title, trimmedBerufsbild);
          
          await prisma.profession.update({
            where: { id: profession.id },
            data: {
              content,
              contentRegeneratedAt: new Date(),
            },
          });
        } catch (contentError: any) {
          console.error(`Content-Generierung fehlgeschlagen für ${trimmedBerufsbild}:`, contentError);
          // Profession wurde erstellt, aber Content-Generierung fehlgeschlagen
          // Das ist ok, Content kann später generiert werden
        }

        results.push({ berufsbild: trimmedBerufsbild, success: true, id: profession.id });
      } catch (error: any) {
        console.error(`Fehler beim Erstellen von ${trimmedBerufsbild}:`, error);
        results.push({
          berufsbild: trimmedBerufsbild,
          success: false,
          error: error?.message || "Unbekannter Fehler",
        });
      }
    }

    revalidatePath("/admin/berufe");
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Fehler bei Bulk-Erstellung:", error);
    return NextResponse.json(
      { error: error?.message || "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}

