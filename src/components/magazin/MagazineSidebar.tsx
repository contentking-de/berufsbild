"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

type SidebarArticle = {
  slug: string;
  title: string;
  publishedAt?: string | null;
  coverImageUrl?: string | null;
};

type TocItem = { id: string; text: string; level: 2 | 3 };

export default function MagazineSidebar({
  toc,
  articles,
}: {
  toc?: TocItem[];
  articles: SidebarArticle[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => a.title.toLowerCase().includes(q));
  }, [articles, query]);

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="rounded-lg border border-zinc-200 p-3">
        <label htmlFor="magazine-search" className="mb-2 block text-sm font-medium text-zinc-700">
          Artikel suchen
        </label>
        <input
          id="magazine-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titel eingeben…"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      {toc && toc.length > 0 && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50">
          <div className="border-b border-zinc-200 p-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">Inhalt</h2>
          </div>
          <nav className="toc-nav max-h-[70vh] overflow-auto p-3 text-sm">
            <ul className="space-y-1">
              {toc.map((t) => (
                <li key={t.id} className={t.level === 3 ? "ml-3" : ""}>
                  <a href={`#${t.id}`} className="text-blue-600 hover:underline hover:text-blue-700">
                    {t.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
      <div className="mt-4 rounded-lg border border-zinc-200">
        <div className="border-b border-zinc-200 p-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-600">Weitere Artikel</h2>
        </div>
        <ul className="divide-y divide-zinc-200">
          {filtered.length === 0 ? (
            <li className="p-3 text-sm text-zinc-500">Keine Ergebnisse</li>
          ) : (
            filtered.map((a) => (
              <li key={a.slug} className="p-3">
                <Link href={`/magazin/${a.slug}`} className="group flex gap-3">
                  {a.coverImageUrl ? (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-zinc-200">
                      <Image
                        src={a.coverImageUrl}
                        alt={a.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="64px"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium group-hover:underline">{a.title}</p>
                    {a.publishedAt ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        {new Date(a.publishedAt).toLocaleDateString("de-DE")}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}


