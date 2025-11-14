import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import MagazineSidebar from "@/components/magazin/MagazineSidebar";

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

function buildDescriptionFromExcerpt(excerpt?: string | null): string | undefined {
  if (!excerpt) return undefined;
  // Whitespace komprimieren
  let text = excerpt.toString().replace(/\s+/g, " ").trim();
  // Meta-Zeile (Datum/Autor) entfernen, falls am Anfang enthalten
  text = text.replace(
    /^veröffentlicht am[^—–-]*[—–-]\s*maya sacotte\s*-\s*redaktion berufsbild\.com\s*/i,
    "",
  );
  // Satz-Erkennung: vollständige Sätze bis ., !, ?, … oder "..."
  const sentenceRegex = /.+?(?:\.{3}|[.!?…])(?=\s|$)/g;
  const match = text.match(sentenceRegex);
  const sentences: string[] = Array.isArray(match) ? (match as string[]) : [];
  if (sentences.length >= 2) {
    const first = sentences[0] ?? "";
    const second = sentences[1] ?? "";
    return `${first.trim()} ${second.trim()}`.trim();
  }
  if (sentences.length === 1) {
    const firstOnly = sentences[0] ?? "";
    const firstLen = firstOnly.length;
    const rest = text.slice(firstLen).trim();
    const second = rest.match(sentenceRegex)?.[0]?.trim();
    if (second && second.length > 0) return `${firstOnly.trim()} ${second}`;
    return firstOnly.trim();
  }
  // Fallback: nutze gesamten Text
  return text.length ? text : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return {};
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, status: true },
  });
  if (!article || article.status !== "PUBLISHED") return {};
  const description = buildDescriptionFromExcerpt(article.excerpt);
  return {
    title: `${article.title} – Magazin`,
    description,
  };
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    notFound();
  }
  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: true },
  });
  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }
  const others = await prisma.article.findMany({
    where: { status: "PUBLISHED", NOT: { slug } },
    orderBy: [{ publishedAt: "desc" }],
    select: { slug: true, title: true, publishedAt: true },
    take: 100,
  });
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <header>
        <p className="text-sm text-zinc-500">Magazin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{article.title}</h1>
        <div className="mt-2 text-sm text-zinc-600">
          {article.author?.name ? <span>Von {article.author.name} · </span> : null}
          {article.publishedAt ? (
            <time dateTime={article.publishedAt.toISOString()}>
              {new Date(article.publishedAt).toLocaleDateString("de-DE")}
            </time>
          ) : null}
        </div>
      </header>
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          {article.coverImageUrl ? (
            <div className="overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.coverImageUrl}
                alt={article.title}
                className="h-64 w-full object-cover"
              />
            </div>
          ) : null}
          <section className="content-body mt-8">
            {article.content ? (
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : (
              <p className="text-zinc-600">Für diesen Artikel liegt noch kein Inhalt vor.</p>
            )}
          </section>
        </article>
        <div className="lg:col-span-1">
          <MagazineSidebar
            articles={others.map((o) => ({
              slug: o.slug,
              title: o.title,
              publishedAt: o.publishedAt ? o.publishedAt.toISOString() : null,
            }))}
          />
        </div>
      </div>
    </div>
  );
}


