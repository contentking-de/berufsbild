"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SidebarArticle = {
  slug: string;
  title: string;
  publishedAt?: string | null;
};

export default function MagazineSidebar({ articles }: { articles: SidebarArticle[] }) {
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
                <Link href={`/magazin/${a.slug}`} className="group block">
                  <p className="text-sm font-medium group-hover:underline">{a.title}</p>
                  {a.publishedAt ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(a.publishedAt).toLocaleDateString("de-DE")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}


