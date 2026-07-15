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

function makeRegexForTerm(term: string): RegExp {
  // Erzeuge flexibles Muster: erlaubt Leerzeichen/Non‑Breaking Space/Bindestrich zwischen Wörtern
  const tokens = term
    .trim()
    .split(/[\s\-]+/)
    .filter(Boolean)
    .map((t) => escapeRegex(t));
  if (tokens.length === 0) return /$a/u; // no-op
  const joined = tokens.join("[\\s\\u00A0\\-]+");
  // Wortähnliche Grenzen über Unicode: nicht von Buchstaben/Ziffern umschlossen
  return new RegExp(`(?<![\\p{L}\\p{N}])(${joined})(?![\\p{L}\\p{N}])`, "iu");
}

function autolinkProfessions(html: string, terms: Array<{ text: string; slug: string }>): string {
  if (!html || terms.length === 0) return html;
  const patterns = terms
    .filter((t) => t.text && t.slug)
    .sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0))
    .map((t) => {
      const tokens = t.text.trim().split(/[\s\-\/]+/).filter(Boolean);
      const longest = tokens.reduce((a, b) => (a.length >= b.length ? a : b), "");
      return {
        slug: t.slug,
        text: t.text,
        re: makeRegexForTerm(t.text),
        quickCheck: longest.toLowerCase(),
      };
    });

  const linkedOnce = new Set<string>();
  const parts = html.split(/(<[^>]+>)/g);
  let insideAnchor = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("<")) {
      const isOpenA = /^<a(\s|>)/i.test(part);
      const isCloseA = /^<\/a\s*>/i.test(part);
      if (isOpenA) insideAnchor = true;
      if (isCloseA) insideAnchor = false;
      continue;
    }
    if (insideAnchor) continue;
    let text = part;
    const textLower = text.toLowerCase();
    for (const p of patterns) {
      if (linkedOnce.has(p.slug)) continue;
      if (!textLower.includes(p.quickCheck)) continue;
      if (!p.re.test(text)) continue;
      text = text.replace(p.re, (_m, g1) => {
        if (linkedOnce.has(p.slug)) return _m;
        linkedOnce.add(p.slug);
        return `<a href="/details/${p.slug}">${g1}</a>`;
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

function prefixHeadings(html: string, professionName: string, headings: string[]): string {
  if (!html || !professionName) return html;
  const targets = new Set(headings.map((h) => h.toLowerCase()));
  return html.replace(/<(h2)([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
    const text = stripInlineTags(inner).trim().toLowerCase();
    if (targets.has(text)) {
      return `<${tag}${attrs}>${professionName} ${inner}</${tag}>`;
    }
    return match;
  });
}

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
  const title = (profession.titleFinal ?? profession.title ?? "").trim();
  return {
    title: title || undefined,
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
              { berufsbild: { contains: query, mode: "insensitive" as const } },
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
          <form
            className="w-full max-w-md md:w-auto"
            toolname="search_professions_index"
            tooldescription="Suche nach Berufsbildern in der berufsbild.com Datenbank mit über 18.000 Berufen. Gibt passende Berufsprofile mit Titel, Untertitel und Link zurück."
            toolautosubmit
          >
            <input
              name="q"
              defaultValue={query}
              placeholder="Beruf suchen …"
              required
              toolparamdescription="Suchbegriff für Berufsbezeichnung, Tätigkeitsfeld oder Branche (z.B. 'Pflege', 'Informatik', 'Tischler')"
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
    
    // Kombiniere Letter-Filter mit Suchfilter (AND-Logik)
    const where = query.length > 1
      ? {
          status: "PUBLISHED" as const,
          alphabeticalKey: upper,
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { subtitle: { contains: query, mode: "insensitive" as const } },
            { berufsbild: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : { status: "PUBLISHED" as const, alphabeticalKey: upper };
    
    const professions = await prisma.profession.findMany({
      where,
      select: { id: true, slug: true, title: true, subtitle: true, alphabeticalKey: true },
      orderBy: [{ title: "asc" }],
    });
    return (
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Berufe A–Z <span className="ml-2 text-base font-normal text-zinc-500">({formattedCount})</span>
          </h1>
          <form
            className="w-full max-w-md md:w-auto"
            toolname="search_professions_by_letter"
            tooldescription={`Suche nach Berufsbildern mit Anfangsbuchstabe ${upper} in der berufsbild.com Datenbank. Gibt passende Berufsprofile zurück.`}
            toolautosubmit
          >
            <input
              name="q"
              defaultValue={query}
              placeholder="Beruf suchen …"
              required
              toolparamdescription="Suchbegriff zur Filterung innerhalb des gewählten Buchstabens (z.B. 'Arzt', 'Ingenieur')"
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
            const baseHref = l === "#" ? "/details" : `/details/${l.toLowerCase()}`;
            const href = query ? `${baseHref}?q=${encodeURIComponent(query)}` : baseHref;
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
    select: {
      berufsbild: true,
      berufsbildMaennlich: true,
      berufsbildWeiblich: true,
      title: true,
      slug: true,
    },
  });
  // Zufällige weitere Berufe für Sidebar
  const randomOthers = await prisma.$queryRaw<
    { slug: string; berufsbild: string }[]
  >`SELECT "slug","Berufsbild" AS "berufsbild" FROM "Profession" WHERE "status" = 'PUBLISHED' AND "id" <> ${profession.id} ORDER BY random() LIMIT 5`;
  
  // Zufällige Magazin-Beiträge für Sidebar
  const randomArticles = await prisma.$queryRaw<
    { slug: string; title: string }[]
  >`SELECT "slug","title" FROM "Article" WHERE "status" = 'PUBLISHED' ORDER BY random() LIMIT 5`;
  const autolinkTerms: Array<{ text: string; slug: string }> = [];
  for (const t of linkTargets) {
    const names = [
      t.berufsbild,
      t.berufsbildMaennlich,
      t.berufsbildWeiblich,
      t.title,
    ];
    const seen = new Set<string>();
    for (const name of names) {
      if (!name) continue;
      const key = name.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      autolinkTerms.push({ text: name.trim(), slug: t.slug });
    }
  }
  const linkedHtml = profession.content
    ? autolinkProfessions(profession.content, autolinkTerms)
    : "";
  const prefixedHtml = prefixHeadings(
    linkedHtml,
    profession.berufsbild ?? profession.title ?? "",
    ["Gehalt", "Gehaltsperspektiven", "Karrierechancen"],
  );
  const { htmlWithIds, toc } = addAnchorsAndCollectToc(prefixedHtml);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: profession.title,
    description: profession.descriptionFinal ?? profession.excerpt ?? undefined,
    datePublished: profession.createdAt.toISOString(),
    dateModified: profession.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: "Maya Sacotte",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{profession.title}</h1>
        {profession.subtitle ? <p className="mt-2 text-zinc-600">{profession.subtitle}</p> : null}
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
          <time dateTime={profession.updatedAt.toISOString()}>
            {profession.updatedAt.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
          </time>
          <span aria-hidden="true">·</span>
          <span>Maya Sacotte</span>
        </p>
      </header>
      {profession.excerpt ? (
        <section className="mt-8">
          <p className="text-lg leading-7 text-zinc-700 font-bold">{profession.excerpt}</p>
        </section>
      ) : null}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <article className="content-body order-2 lg:order-1 lg:col-span-2">
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
          <section className="mt-8 rounded-lg border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">Mehr zur KIDB‑Nummer</h2>
            <p className="mt-1 text-zinc-700">
              Ausführliche Infos zur Klassifikation der Berufe (KIDB/KldB), Aufbau und Beispielen findest du hier:{" "}
              <Link href="/kidb-nummer" className="text-blue-600 hover:text-blue-700 hover:underline">
                KIDB‑Nummer erklären
              </Link>
              .
            </p>
          </section>
          {/* Mobile: Oft angesehene Berufsbilder unter dem Content */}
          <div className="mt-6 rounded-lg border border-zinc-200 lg:hidden">
            <div className="border-b border-zinc-200 p-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">Oft angesehene Berufsbilder</h2>
            </div>
            <ul className="divide-y divide-zinc-200 text-sm">
              {(randomOthers ?? []).map((p) => (
                <li key={p.slug} className="p-3">
                  <Link href={`/details/${p.slug}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                    {p.berufsbild}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Mobile: Magazin-Beiträge unter dem Content */}
          {randomArticles.length > 0 && (
            <div className="mt-6 rounded-lg border border-zinc-200 lg:hidden">
              <div className="border-b border-zinc-200 p-3">
                <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">Aus dem Magazin</h2>
              </div>
              <ul className="divide-y divide-zinc-200 text-sm">
                {randomArticles.map((a) => (
                  <li key={a.slug} className="p-3">
                    <Link href={`/magazin/${a.slug}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
        <aside className="order-1 lg:order-2 lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50">
              <div className="border-b border-zinc-200 p-3">
                <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">Inhalt</h2>
              </div>
              <nav className="toc-nav max-h-[70vh] overflow-auto p-3 text-sm">
                {toc.length === 0 ? (
                  <p className="text-zinc-500">Keine Überschriften gefunden.</p>
                ) : (
                  <ul className="space-y-1">
                    {toc.map((t) => (
                      <li key={t.id} className={t.level === 3 ? "ml-3" : ""}>
                        <a href={`#${t.id}`} className="text-blue-600 hover:underline hover:text-blue-700">
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </nav>
            </div>
            {/* Desktop: Oft angesehene Berufsbilder in Sidebar */}
            <div className="mt-6 hidden rounded-lg border border-zinc-200 lg:block">
              <div className="border-b border-zinc-200 p-3">
                <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">Oft angesehene Berufsbilder</h2>
              </div>
              <ul className="divide-y divide-zinc-200 text-sm">
                {(randomOthers ?? []).map((p) => (
                  <li key={p.slug} className="p-3">
                    <Link href={`/details/${p.slug}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                      {p.berufsbild}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Desktop: Magazin-Beiträge in Sidebar */}
            {randomArticles.length > 0 && (
              <div className="mt-6 hidden rounded-lg border border-zinc-200 lg:block">
                <div className="border-b border-zinc-200 p-3">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">Aus dem Magazin</h2>
                </div>
                <ul className="divide-y divide-zinc-200 text-sm">
                  {randomArticles.map((a) => (
                    <li key={a.slug} className="p-3">
                      <Link href={`/magazin/${a.slug}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}


