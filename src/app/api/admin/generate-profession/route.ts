import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const id = form.get("id")?.toString();
    const title = form.get("title")?.toString()?.trim();
    const berufsbild = form.get("berufsbild")?.toString()?.trim();

    if (!id || !title) {
      return NextResponse.json({ error: "id und title erforderlich" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY fehlt" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });

    const system = `Du bist ein Redakteur für eine deutschsprachige Website für Berufsorientierung.
Schreibe konsequent in DU-Form, verständlich, motivierend und präzise – aber inhaltlich tief.
Liefere reines HTML ohne <html> oder <body>; KEINE Markdown-Codeblöcke (keine \`\`\`), nur pures HTML.
Strukturiere sauber mit <h2>/<h3>, Absätzen und Listen.
Ziel: Hohe Detailtiefe, Praxisnähe, Beispiele und konkrete Informationen.`;

    const berufsbildText = berufsbild ? `Berufsbild: ${berufsbild}` : "";
    const user = `Erstelle eine SEHR AUSFÜHRLICHE, klar gegliederte Berufsbeschreibung (mindestens 2000–2500 Wörter) für:
„${title}“
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
      return NextResponse.json({ error: "Kein Inhalt generiert" }, { status: 500 });
    }
    // Entferne umschließende Markdown-Codefences (```html ... ```) falls vorhanden
    if (html.startsWith("```")) {
      html = html.replace(/^```[a-zA-Z0-9]*\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    // Entferne evtl. wiederholten Titel als erste Überschrift
    html = removeRepeatedTitleAtStart(html, title);

    // Entferne Nummerierungen aus Kategorien
    html = cleanCategoryNumbering(html);

    await prisma.profession.update({
      where: { id },
      data: {
        content: html,
        contentRegeneratedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, length: html.length });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Fehler bei der Generierung" }, { status: 500 });
  }
}

