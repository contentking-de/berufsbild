import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeText(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
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

function removeExistingMeta(html: string): string {
  // Entfernt bereits vorhandene, vom Modell erzeugte Meta-Zeilen
  return html.replace(/<p\s+class=["']article-meta["'][\s\S]*?<\/p>\s*/gi, "");
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const id = form.get("id")?.toString();
    const title = form.get("title")?.toString()?.trim();
    if (!id || !title) {
      return NextResponse.json({ error: "id und title erforderlich" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY fehlt" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });
    // Veröffentlichungsdatum für Meta-Zeile vorbereiten
    const now = new Date();
    const dateDe = new Intl.DateTimeFormat("de-DE").format(now); // DD.MM.YYYY
    const dateISO = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const metaHtml = `<p class="article-meta">Veröffentlicht am <time datetime="${dateISO}">${dateDe}</time> — Maya Sacotte - Redaktion berufsbild.com</p>`;
    const system = `Du bist ein Redakteur für eine deutschsprachige Website für Schüler:innen und Student:innen.
Schreibe konsequent in DU-Form, verständlich, motivierend und präzise – aber inhaltlich tief.
Liefere reines HTML ohne <html> oder <body>; KEINE Markdown-Codeblöcke (keine \`\`\`), nur pures HTML.
Strukturiere sauber mit <h2>/<h3>, Absätzen, Listen und – wo sinnvoll – Tabellen.
Ziel: Hohe Detailtiefe, Praxisnähe, Beispiele, Schritte, Tipps und Fehler vermeiden.`;

    const user = `Erstelle einen SEHR AUSFÜHRLICHEN, klar gegliederten Artikel (mindestens 1200–1800 Wörter) zum Thema:
„${title}“.
Rahmenbedingungen:
- Zielgruppe: Schüler:innen & Student:innen, Ansprache: DU
- Einstieg ohne Floskeln – direkt ins Thema
- GANZ AM ANFANG füge GENAU folgende Meta-Zeile ein: ${metaHtml}
- Direkt DANACH folgt genau EIN Intro-Absatz im Format <p><strong>…</strong></p> (3–5 Sätze, sehr informativ, zusammenfassend, motivierend).
- Strikte Gliederung mit <h2> und passenden <h3>
- Verwende KEINEN <h1> und wiederhole NICHT den vorgegebenen Titel als <h2>.
- Die erste Überschrift (<h2>) soll einen inhaltlichen Abschnittstitel tragen, der sich vom Artikel-Titel unterscheidet.
- Nutze Bulletpoints (ul/ol) für Aufzählungen und Checklisten
- Baue, wo sinnvoll, mindestens EINE Tabelle ein (z. B. Vergleich, Übersicht, Schritte, Pro/Contra)
- Inhaltliche Tiefe: Kontext/Einordnung, typische Aufgaben, Voraussetzungen/Skills (fachlich/soft), Ausbildung/Studium/Alternativen, Praxisbeispiele, Tools, Karrierewege, grobe Gehaltsspannen (mit Hinweis auf Abhängigkeiten), Tipps & häufige Fehler
- Best Practices und Schritt-für-Schritt-Empfehlungen einbauen
- Reines HTML ohne <html>/<body> und OHNE Markdown-Codefences (\`\`\`)

Am Ende:
- Abschnitt „Häufige Fragen (FAQ)“: 6–10 Fragen als ausklappbare <details>/<summary>
- Direkt darunter ein JSON-LD Block (Schema.org FAQPage) mit denselben Q&As

Liefere ausschließlich das HTML.`;

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
    // Stelle sicher, dass die Meta-Zeile direkt zu Beginn steht (und nur einmal vorkommt)
    html = removeExistingMeta(html);
    html = `${metaHtml}${html}`;

    const plain = stripHtml(html);
    const excerpt = plain.slice(0, 240) + (plain.length > 240 ? "…" : "");

    await prisma.article.update({
      where: { id },
      data: { content: html, excerpt },
    });

    return NextResponse.json({ ok: true, excerpt, length: html.length });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? "Fehler bei der Generierung" }, { status: 500 });
  }
}


