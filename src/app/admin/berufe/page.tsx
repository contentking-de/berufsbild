import { prisma } from "@/lib/prisma";
import ProfessionsTable from "./ProfessionsTable";
import BatchGenerateButton from "./BatchGenerateButton";
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


