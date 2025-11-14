import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MagazinIndexPage() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImageUrl: true,
      publishedAt: true,
    },
    take: 24,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Magazin</h1>
        <p className="mt-2 text-zinc-600">
          Für Schüler:innen, Studierende, Auszubildende, Eltern und Lehrkräfte: praxisnahe Orientierung zur
          Berufswahl, hilfreiche Tipps für Bewerbungsunterlagen, Strategien fürs Vorstellungsgespräch sowie Trends
          und verständliche Einblicke in die Berufswelt.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="text-zinc-600">Noch keine Artikel veröffentlicht.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <li key={a.id} className="overflow-hidden rounded-lg border">
              <Link href={`/magazin/${a.slug}`} className="block">
                {a.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.coverImageUrl}
                    alt={a.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="h-44 w-full bg-zinc-100" />
                )}
                <div className="p-4">
                  <h3 className="font-medium">{a.title}</h3>
                  {a.excerpt ? (
                    <p className="mt-1 line-clamp-3 text-sm text-zinc-600">{a.excerpt}</p>
                  ) : null}
                  {a.publishedAt ? (
                    <p className="mt-3 text-xs text-zinc-500">
                      {new Date(a.publishedAt).toLocaleDateString("de-DE")}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


