import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
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
  return (
    <article className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
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

      {article.coverImageUrl ? (
        <div className="mt-8 overflow-hidden rounded-xl border">
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
  );
}


