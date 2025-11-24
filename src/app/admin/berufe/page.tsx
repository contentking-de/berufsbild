import { prisma } from "@/lib/prisma";
import ProfessionsTable from "./ProfessionsTable";
import BatchGenerateButton from "./BatchGenerateButton";
import BulkCreateForm from "./BulkCreateForm";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

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

async function createProfession(formData: FormData) {
  "use server";
  const berufsbild = (formData.get("berufsbild") as string)?.trim();
  if (!berufsbild) return;

  try {
    // Generiere Metadaten via KI
    const metadata = await generateMetadata(berufsbild);

    // alphabeticalKey basiert auf dem ersten Buchstaben des Berufsbilds
    const key = berufsbild.trim()[0]?.toUpperCase();
    const alphabeticalKey = /[A-Z]/.test(key) ? key : "#";

    await prisma.profession.create({
      data: {
        title: metadata.title,
        subtitle: metadata.subtitle || null,
        slug: metadata.slug,
        berufsbild,
        alphabeticalKey,
        status: "DRAFT",
      },
    });
    revalidatePath("/admin/berufe");
  } catch (error) {
    console.error("Fehler beim Erstellen des Berufs:", error);
    throw error;
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
    throw new Error("Kein Inhalt generiert");
  }

  // Entferne umschließende Markdown-Codefences
  if (html.startsWith("```")) {
    html = html.replace(/^```[a-zA-Z0-9]*\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  // Entferne evtl. wiederholten Titel als erste Überschrift
  html = removeRepeatedTitleAtStart(html, title);

  return html;
}

async function createMultipleProfessions(berufsbilder: string[]) {
  "use server";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY fehlt");
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

      // 3. Content generieren
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
  return results;
}

async function updateProfession(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) {
    throw new Error("Keine ID angegeben");
  }
  
  // Nur Felder aktualisieren, die tatsächlich vorhanden sind
  const updateData: {
    title?: string;
    subtitle?: string | null;
    status?: "DRAFT" | "PUBLISHED";
    alphabeticalKey?: string;
    berufsbild?: string | null;
    content?: string | null;
  } = {};
  
  const title = formData.get("title");
  if (title !== null && title !== undefined && typeof title === "string") {
    const trimmedTitle = title.trim();
    if (trimmedTitle) {
      updateData.title = trimmedTitle;
      const key = trimmedTitle[0]?.toUpperCase();
      updateData.alphabeticalKey = /[A-Z]/.test(key) ? key : "#";
    }
  }
  
  const subtitle = formData.get("subtitle");
  if (subtitle !== null && subtitle !== undefined && typeof subtitle === "string") {
    updateData.subtitle = subtitle.trim() || null;
  }
  
  const status = formData.get("status");
  if (status !== null && status !== undefined && typeof status === "string") {
    const statusValue = status.trim();
    if (statusValue === "DRAFT" || statusValue === "PUBLISHED") {
      updateData.status = statusValue as "DRAFT" | "PUBLISHED";
    }
  }
  
  const berufsbild = formData.get("berufsbild");
  if (berufsbild !== null && berufsbild !== undefined && typeof berufsbild === "string") {
    updateData.berufsbild = berufsbild.trim() || null;
  }
  
  const content = formData.get("content");
  if (content !== null && content !== undefined && typeof content === "string") {
    updateData.content = content.trim() || null;
  }
  
  // Nur aktualisieren, wenn es Daten gibt
  if (Object.keys(updateData).length > 0) {
    try {
      await prisma.profession.update({
        where: { id },
        data: updateData,
      });
      revalidatePath("/admin/berufe");
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Berufs:", error);
      throw new Error(`Fehler beim Speichern: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
    }
  } else {
    throw new Error("Keine Daten zum Speichern vorhanden");
  }
}

async function deleteProfession(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.profession.delete({ where: { id } });
  revalidatePath("/admin/berufe");
}

type Props = {
  searchParams: Promise<{ page?: string; q?: string; regenerated?: string }>;
};

export default async function AdminProfessionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 50;
  const skip = (page - 1) * pageSize;
  const regeneratedFilter = params.regenerated;
  const searchQuery = params.q?.trim();

  // Filter für contentRegeneratedAt
  const regeneratedWhere =
    regeneratedFilter === "yes"
      ? { contentRegeneratedAt: { not: null } }
      : regeneratedFilter === "no"
        ? { contentRegeneratedAt: null }
        : {};

  // Suchfilter: Suche über alle Felder
  // Für status (Enum) prüfen wir, ob der Suchbegriff einem Enum-Wert entspricht
  const searchWhere = searchQuery
    ? {
        OR: [
          { title: { contains: searchQuery, mode: "insensitive" as const } },
          { subtitle: { contains: searchQuery, mode: "insensitive" as const } },
          { berufsbild: { contains: searchQuery, mode: "insensitive" as const } },
          // Status-Suche: Prüfe, ob der Suchbegriff einem Enum-Wert entspricht
          ...(searchQuery.toUpperCase() === "DRAFT" || searchQuery.toUpperCase() === "PUBLISHED"
            ? [{ status: searchQuery.toUpperCase() as "DRAFT" | "PUBLISHED" }]
            : []),
        ],
      }
    : {};

  // Kombiniere beide Filter
  const where = {
    ...regeneratedWhere,
    ...searchWhere,
  };

  const [professions, total] = await Promise.all([
    prisma.profession.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        subtitle: true,
        status: true,
        berufsbild: true,
        content: true,
        contentRegeneratedAt: true,
      },
      skip,
      take: pageSize,
    }),
    prisma.profession.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-medium">Beruf hinzufügen</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Gib nur das Berufsbild ein. Title, Untertitel und Slug werden automatisch via KI generiert.
        </p>
        <form action={createProfession} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            name="berufsbild"
            placeholder="Berufsbild (z. B. Medizinische Fachangestellte)"
            className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-3"
            required
          />
          <button className="rounded-lg bg-zinc-900 px-4 py-2 text-white">Anlegen</button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">Mehrere Berufsbilder auf einmal anlegen</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Geben Sie mehrere Berufsbilder ein (eines pro Zeile). Alle werden automatisch erstellt, mit KI-Content generiert und veröffentlicht.
        </p>
        <div className="mt-4">
          <BulkCreateForm createMultipleProfessions={createMultipleProfessions} />
        </div>
      </section>

      <section>
        <BatchGenerateButton />
      </section>

      <section>
        <h2 className="text-lg font-medium">Letzte Änderungen</h2>
        <p className="mt-1 text-sm text-zinc-600">
          {searchQuery
            ? `Zeige ${skip + 1}–${Math.min(skip + pageSize, total)} von ${total} Berufen (Suche: "${searchQuery}")`
            : `Zeige ${skip + 1}–${Math.min(skip + pageSize, total)} von ${total} Berufen`}
        </p>
        <div className="mt-4">
          <ProfessionsTable
            professions={professions}
            updateProfession={updateProfession}
            deleteProfession={deleteProfession}
            currentPage={page}
            totalPages={totalPages}
            total={total}
            regeneratedFilter={regeneratedFilter}
            searchQuery={searchQuery}
          />
        </div>
      </section>
    </div>
  );
}


