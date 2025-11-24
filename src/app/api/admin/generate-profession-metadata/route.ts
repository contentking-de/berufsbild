import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const berufsbild = form.get("berufsbild")?.toString()?.trim();

    if (!berufsbild) {
      return NextResponse.json({ error: "berufsbild erforderlich" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY fehlt" }, { status: 500 });
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
      return NextResponse.json({ error: "Keine Metadaten generiert" }, { status: 500 });
    }

    const metadata = JSON.parse(content);
    
    // Validierung
    if (!metadata.title || !metadata.slug) {
      return NextResponse.json({ error: "Ungültige Metadaten generiert" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      title: metadata.title.trim(),
      subtitle: metadata.subtitle?.trim() || null,
      slug: metadata.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
    });
  } catch (e: any) {
    console.error("Fehler bei Metadaten-Generierung:", e);
    return NextResponse.json({ error: e?.message ?? "Fehler bei der Generierung" }, { status: 500 });
  }
}

