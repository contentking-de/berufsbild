"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type MagazineGridArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
};

export default function MagazineGrid({ articles, initialCount = 6 }: { articles: MagazineGridArticle[]; initialCount?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = useMemo(() => (expanded ? articles : articles.slice(0, initialCount)), [expanded, articles, initialCount]);

  return (
    <div>
      <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => (
          <li key={a.id} className="overflow-hidden rounded-lg border">
            <Link href={`/magazin/${a.slug}`} className="block">
              {a.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.coverImageUrl} alt={a.title} className="h-44 w-full object-cover" />
              ) : (
                <div className="h-44 w-full bg-zinc-100" />
              )}
              <div className="p-4">
                <h3 className="font-medium">{a.title}</h3>
                {a.excerpt ? <p className="mt-1 line-clamp-3 text-sm text-zinc-600">{a.excerpt}</p> : null}
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
      {articles.length > initialCount ? (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50"
          >
            {expanded ? "Weniger anzeigen" : "Alle Artikel anzeigen"}
          </button>
        </div>
      ) : null}
    </div>
  );
}


