import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

type PageParams = { segment?: string[] };
type PageProps = {
  params: Promise<PageParams>;
  searchParams: Promise<{ q?: string }>;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function autolinkProfessions(html: string, terms: Array<{ title: string; slug: string }>): string {
  if (!html || terms.length === 0) return html;
  // Sortiere nach Länge absteigend, um lange Titel vor kürzeren zu verlinken
  const patterns = terms
    .filter((t) => t.title && t.slug)
    .sort((a, b) => (b.title?.length ?? 0) - (a.title?.length ?? 0))
    .map((t) => ({
      slug: t.slug,
      title: t.title,
      // Unicode Wortgrenzen an den Rändern, case-insensitive
      re: new RegExp(`\\b${escapeRegex(t.title)}\\b`, "iu"),
    }));

  const linkedOnce = new Set<string>(); // slug → bereits verlinkt
  const parts = html.split(/(<[^>]+>)/g); // Tags als eigene Parts erhalten
  let insideAnchor = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("<")) {
      // Tag: Tracke <a> … </a>, damit wir innerhalb von Links nichts ersetzen
      const isOpenA = /^<a(\s|>)/i.test(part);
      const isCloseA = /^<\/a\s*>/i.test(part);
      if (isOpenA) insideAnchor = true;
      if (isCloseA) insideAnchor = false;
      continue;
    }
    if (insideAnchor) continue;
    // Text-Part: führe Replacements aus (nur erste Vorkommen pro slug)
    let text = part;
    for (const p of patterns) {
      if (linkedOnce.has(p.slug)) continue;
      if (!p.re.test(text)) continue;
      text = text.replace(p.re, (m) => {
        if (linkedOnce.has(p.slug)) return m;
        linkedOnce.add(p.slug);
        return `<a href="/details/${p.slug}">${m}</a>`;
      });
    }
    parts[i] = text;
  }

  return parts.join("");
}

function stripInlineTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function slugifyHeading(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type TocItem = { id: string; text: string; level: 2 | 3 };

function addAnchorsAndCollectToc(html: string): { htmlWithIds: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  let out = html;
  // Ersetze h2/h3 ohne id durch h2/h3 mit id und sammle die Texte
  out = out.replace(/<(h2|h3)([^>]*)>([\s\S]*?)<\/\1>/gi, (m, tag, attrs, inner) => {
    const level = tag.toLowerCase() === "h2" ? 2 : 3;
    const text = stripInlineTags(inner);
    if (!text) return m;
    // id vorhanden?
    const hasId = /\sid\s*=/.test(attrs);
    let id = hasId ? (attrs.match(/\sid\s*=\s*["']([^"']+)["']/i)?.[1] ?? "") : "";
    if (!id) {
      id = slugifyHeading(text);
      // Kollisionen vermeiden: falls id bereits im toc, hänge Zähler an
      let suffix = 2;
      const base = id;
      while (toc.some((t) => t.id === id)) {
        id = `${base}-${suffix++}`;
      }
      // id-Attribut einspritzen
      const newAttrs = `${attrs} id="${id}"`;
      toc.push({ id, text, level: level as 2 | 3 });
      return `<${tag}${newAttrs}>${inner}</${tag}>`;
    } else {
      toc.push({ id, text, level: level as 2 | 3 });
      return m;
    }
  });
  return { htmlWithIds: out, toc };
}

function alphabeticalBuckets() {
  const letters = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
  return ["#", ...letters];
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { segment = [] } = await params;
  if (segment.length !== 1) return {};
  const candidate = segment[0] ?? "";
  // Wenn es ein Buchstabe ist, keine Detail-Meta setzen
  if (/^[a-z]$/i.test(candidate)) return {};
  const slug = candidate;
  const profession = await prisma.profession.findUnique({
    where: { slug },
    select: {
      title: true,
      titleFinal: true,
      descriptionFinal: true,
      status: true,
    },
  });
  if (!profession || profession.status !== "PUBLISHED") return {};
  return {
    title: profession.titleFinal ?? profession.title ?? undefined,
    description: profession.descriptionFinal ?? undefined,
  };
}

export default async function DetailsRouterPage({ params, searchParams }: PageProps) {
  const { segment = [] } = await params;
  const sp = await searchParams;
  const query = (sp?.q ?? "").trim();

  // Routing-Entscheidung
  if (segment.length === 0) {
    // Index-Seite
    const totalCount = await prisma.profession.count({ where: { status: "PUBLISHED" } });
    const formattedCount = new Intl.NumberFormat("de-DE").format(totalCount);
    const letters = alphabeticalBuckets();
    const where =
      query.length > 1
        ? {
            status: "PUBLISHED" as const,
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { subtitle: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : { status: "PUBLISHED" as const };
    const professions = await prisma.profession.findMany({
      where,
      select: { id: true, slug: true, title: true, subtitle: true, alphabeticalKey: true },
      orderBy: [{ alphabeticalKey: "asc" }, { title: "asc" }],
      take: 200,
    });
    return (
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Berufe A–Z <span className="ml-2 text-base font-normal text-zinc-500">({formattedCount})</span>
          </h1>
          <form className="w-full max-w-md md:w-auto">
            <input
              name="q"
              defaultValue={query}
              placeholder="Beruf suchen …"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 outline-none focus:border-zinc-600"
            />
          </form>
        </div>
        <section className="mb-10 text-zinc-700">
          <p className="max-w-3xl">
            Auf berufsbild.com findest du kompakte und verständliche Informationen zu tausenden Berufsbildern –
            von Aufgaben und Anforderungen über Ausbildung und Perspektiven bis hin zu weiterführenden Inhalten.
            Unsere Übersicht hilft dir, schnell zum passenden Berufsprofil zu gelangen und Details zu entdecken.
          </p>
          <p className="mt-3 max-w-3xl">
            Dieses Angebot ist nicht kommerziell. Es soll Schüler:innen und Absolvent:innen bei der Berufsorientierung
            und Berufswahl unterstützen. Lehrkräfte erhalten zudem eine praxisnahe Hilfestellung, um die Berufsberatung
            im Unterricht und darüber hinaus zu begleiten.
          </p>
        </section>
        <div className="mb-8 flex flex-wrap gap-2">
          {letters.map((l) => {
            const href = l === "#" ? "/details" : `/details/${l.toLowerCase()}`;
            return (
              <Link
                key={l}
                href={href}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm border-zinc-300 hover:bg-zinc-50"
              >
                {l}
              </Link>
            );
          })}
        </div>
        {professions.length === 0 ? (
          <p className="text-zinc-600">Keine Treffer.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professions.map((p) => (
              <li key={p.id} className="rounded-lg border border-zinc-200 p-4 hover:border-zinc-300">
                <Link href={`/details/${p.slug}`} className="block">
                  <h3 className="font-medium">{p.title}</h3>
                  {p.subtitle ? <p className="mt-1 text-sm text-zinc-600">{p.subtitle}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const first = segment[0] ?? "";
  if (/^[a-z]$/i.test(first) && first.length === 1) {
    // Letter-Seite
    const upper = first.toUpperCase();
    const totalCount = await prisma.profession.count({ where: { status: "PUBLISHED" } });
    const formattedCount = new Intl.NumberFormat("de-DE").format(totalCount);
    const letters = alphabeticalBuckets();
    const professions = await prisma.profession.findMany({
      where: { status: "PUBLISHED", alphabeticalKey: upper },
      select: { id: true, slug: true, title: true, subtitle: true, alphabeticalKey: true },
      orderBy: [{ title: "asc" }],
      take: 200,
    });
    return (
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Berufe A–Z <span className="ml-2 text-base font-normal text-zinc-500">({formattedCount})</span>
          </h1>
          <form className="w-full max-w-md md:w-auto">
            <input
              name="q"
              placeholder="Beruf suchen …"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 outline-none focus:border-zinc-600"
            />
          </form>
        </div>
        <section className="mb-10 text-zinc-700">
          <p className="max-w-3xl">
            Auf berufsbild.com findest du kompakte und verständliche Informationen zu tausenden Berufsbildern –
            von Aufgaben und Anforderungen über Ausbildung und Perspektiven bis hin zu weiterführenden Inhalten.
            Unsere Übersicht hilft dir, schnell zum passenden Berufsprofil zu gelangen und Details zu entdecken.
          </p>
          <p className="mt-3 max-w-3xl">
            Dieses Angebot ist nicht kommerziell. Es soll Schüler:innen und Absolvent:innen bei der Berufsorientierung
            und Berufswahl unterstützen. Lehrkräfte erhalten zudem eine praxisnahe Hilfestellung, um die Berufsberatung
            im Unterricht und darüber hinaus zu begleiten.
          </p>
        </section>
        <div className="mb-8 flex flex-wrap gap-2">
          {letters.map((l) => {
            const href = l === "#" ? "/details" : `/details/${l.toLowerCase()}`;
            return (
              <Link
                key={l}
                href={href}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm ${
                  upper === l ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {l}
              </Link>
            );
          })}
        </div>
        {professions.length === 0 ? (
          <p className="text-zinc-600">Keine Treffer.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professions.map((p) => (
              <li key={p.id} className="rounded-lg border border-zinc-200 p-4 hover:border-zinc-300">
                <Link href={`/details/${p.slug}`} className="block">
                  <h3 className="font-medium">{p.title}</h3>
                  {p.subtitle ? <p className="mt-1 text-sm text-zinc-600">{p.subtitle}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Detail-Seite
  const slug = first;
  const profession = await prisma.profession.findUnique({
    where: { slug },
  });
  if (!profession || profession.status !== "PUBLISHED") {
    notFound();
  }
  // Alle anderen veröffentlichten Berufe laden, um Auto-Verlinkungen zu setzen
  const linkTargets = await prisma.profession.findMany({
    where: { status: "PUBLISHED", NOT: { id: profession.id } },
    select: { title: true, slug: true },
    take: 500,
  });
  const linkedHtml = profession.content
    ? autolinkProfessions(profession.content, linkTargets.filter((t) => t.title && t.slug) as Array<{ title: string; slug: string }>)
    : "";
  const { htmlWithIds, toc } = addAnchorsAndCollectToc(linkedHtml);
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{profession.title}</h1>
        {profession.subtitle ? <p className="mt-2 text-zinc-600">{profession.subtitle}</p> : null}
      </header>
      {profession.excerpt ? (
        <section className="mt-8">
          <p className="text-lg leading-7 text-zinc-700 font-bold">{profession.excerpt}</p>
        </section>
      ) : null}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <article className="content-body lg:col-span-2">
          {profession.content ? (
            <div dangerouslySetInnerHTML={{ __html: htmlWithIds }} />
          ) : (
            <p className="text-zinc-600">Für dieses Berufsbild liegt noch kein Inhalt vor.</p>
          )}
          {profession.kidbFinal ? (
            <section className="mt-10 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">KIDB</h2>
              <p className="mt-1 text-zinc-800">{profession.kidbFinal}</p>
            </section>
          ) : null}
        </article>
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <div className="rounded-lg border border-zinc-200">
              <div className="border-b border-zinc-200 p-3">
                <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">Inhalt</h2>
              </div>
              <nav className="max-h-[70vh] overflow-auto p-3 text-sm">
                {toc.length === 0 ? (
                  <p className="text-zinc-500">Keine Überschriften gefunden.</p>
                ) : (
                  <ul className="space-y-1">
                    {toc.map((t) => (
                      <li key={t.id} className={t.level === 3 ? "ml-3" : ""}>
                        <a href={`#${t.id}`} className="text-zinc-700 hover:underline">
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}


