"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Profession = {
  id: string;
  title: string;
  subtitle: string | null;
  status: "DRAFT" | "PUBLISHED";
  berufsbild: string | null;
  contentRegeneratedAt: Date | null;
};

type ProfessionsTableProps = {
  professions: Profession[];
  updateProfession: (formData: FormData) => void;
  deleteProfession: (formData: FormData) => void;
  currentPage: number;
  totalPages: number;
  total: number;
  regeneratedFilter?: string;
  searchQuery?: string;
};

export default function ProfessionsTable({
  professions,
  updateProfession,
  deleteProfession,
  currentPage,
  totalPages,
  total,
  regeneratedFilter,
  searchQuery,
}: ProfessionsTableProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchQuery || "");
  const [generating, setGenerating] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate(id: string, title: string, berufsbild: string | null) {
    setGenerating(id);
    try {
      const fd = new FormData();
      fd.append("id", id);
      fd.append("title", title);
      if (berufsbild) {
        fd.append("berufsbild", berufsbild);
      }
      const res = await fetch("/api/admin/generate-profession", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Generierung fehlgeschlagen");
      router.refresh();
    } catch (e: any) {
      alert(e?.message || "Fehler bei der Generierung");
    } finally {
      setGenerating(null);
    }
  }

  // Filterung erfolgt jetzt serverseitig, daher verwenden wir die professions direkt
  const filtered = professions;

  function buildPageUrl(page: number, query?: string, regenerated?: string) {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (query) {
      params.set("q", query);
    }
    if (regenerated) {
      params.set("regenerated", regenerated);
    }
    return `/admin/berufe?${params.toString()}`;
  }

  function handleRegeneratedFilterChange(value: string) {
    const params = new URLSearchParams();
    params.set("page", "1"); // Zurück zur ersten Seite
    if (query) {
      params.set("q", query);
    }
    if (value) {
      params.set("regenerated", value);
    }
    router.push(`/admin/berufe?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profession-search" className="mb-2 block text-sm font-medium text-zinc-700">
            Berufe durchsuchen
          </label>
          <input
            id="profession-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Navigate to first page when searching
              if (e.target.value.trim()) {
                router.push(buildPageUrl(1, e.target.value.trim(), regeneratedFilter));
              } else {
                router.push(buildPageUrl(1, undefined, regeneratedFilter));
              }
            }}
            placeholder="Titel, Untertitel, Berufsbild oder Status suchen…"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
          {query && (
            <p className="mt-2 text-sm text-zinc-600">
              {filtered.length} von {total} Berufen gefunden (auf dieser Seite)
            </p>
          )}
        </div>
        <div>
          <label htmlFor="regenerated-filter" className="mb-2 block text-sm font-medium text-zinc-700">
            Content-Generierung
          </label>
          <select
            id="regenerated-filter"
            value={regeneratedFilter || "all"}
            onChange={(e) => handleRegeneratedFilterChange(e.target.value === "all" ? "" : e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          >
            <option value="all">Alle Berufe</option>
            <option value="yes">Bereits neu generiert</option>
            <option value="no">Noch nicht generiert</option>
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-zinc-600">
              <th className="px-4 py-2">Titel</th>
              <th className="px-4 py-2">Untertitel</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  Keine Berufe gefunden
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">
                    <form action={updateProfession} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="title"
                        defaultValue={p.title}
                        className="w-full rounded border border-zinc-300 px-2 py-1"
                      />
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateProfession}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="subtitle"
                        defaultValue={p.subtitle ?? ""}
                        className="w-full rounded border border-zinc-300 px-2 py-1"
                      />
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateProfession}>
                      <input type="hidden" name="id" value={p.id} />
                      <select
                        name="status"
                        defaultValue={p.status}
                        className="rounded border border-zinc-300 px-2 py-1"
                      >
                        <option value="DRAFT">Entwurf</option>
                        <option value="PUBLISHED">Veröffentlicht</option>
                      </select>
                    </form>
                    {p.contentRegeneratedAt && (
                      <p className="mt-1 text-xs text-green-600">
                        Generiert: {new Date(p.contentRegeneratedAt).toLocaleDateString("de-DE")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={updateProfession}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded border px-3 py-1">Speichern</button>
                      </form>
                      <button
                        onClick={() => handleGenerate(p.id, p.title, p.berufsbild)}
                        disabled={generating === p.id}
                        className="rounded border px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                      >
                        {generating === p.id ? "Generiert …" : "Neue generieren"}
                      </button>
                      <form action={deleteProfession}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded border px-3 py-1 text-red-600">Löschen</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
          <div className="text-sm text-zinc-600">
            Seite {currentPage} von {totalPages}
          </div>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <Link
                href={buildPageUrl(currentPage - 1, query || undefined, regeneratedFilter)}
                className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
              >
                Zurück
              </Link>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Link
                  key={pageNum}
                  href={buildPageUrl(pageNum, query || undefined, regeneratedFilter)}
                  className={`rounded border px-3 py-1 text-sm ${
                    pageNum === currentPage
                      ? "bg-zinc-900 text-white border-zinc-900"
                      : "border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
            {currentPage < totalPages && (
              <Link
                href={buildPageUrl(currentPage + 1, query || undefined, regeneratedFilter)}
                className="rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50"
              >
                Weiter
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

