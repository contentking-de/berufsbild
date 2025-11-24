"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";

type Profession = {
  id: string;
  title: string;
  subtitle: string | null;
  status: "DRAFT" | "PUBLISHED";
  berufsbild: string | null;
  content: string | null;
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
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ id: string; message: string; type: "success" | "error" } | null>(null);
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
              <th className="px-4 py-2">Berufsbild</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Content</th>
              <th className="px-4 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Keine Berufe gefunden
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">
                    <form action={updateProfession} id={`form-title-${p.id}`}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="title"
                        defaultValue={p.title || ""}
                        placeholder="Titel"
                        className="w-full rounded border border-zinc-300 px-2 py-1"
                        onBlur={(e) => {
                          const form = e.currentTarget.closest("form");
                          if (form) {
                            const formData = new FormData(form);
                            updateProfession(formData);
                            router.refresh();
                          }
                        }}
                      />
                    </form>
                    {p.subtitle && (
                      <div className="mt-1 text-xs text-zinc-500">Untertitel: {p.subtitle}</div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateProfession} id={`form-berufsbild-${p.id}`}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="berufsbild"
                        defaultValue={p.berufsbild || ""}
                        placeholder="Berufsbild"
                        className="w-full rounded border border-zinc-300 px-2 py-1"
                      />
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form 
                      action={updateProfession} 
                      id={`form-status-${p.id}`}
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const formData = new FormData(form);
                        await updateProfession(formData);
                        router.refresh();
                      }}
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <select
                        name="status"
                        defaultValue={p.status}
                        onChange={(e) => {
                          const form = e.currentTarget.closest("form");
                          if (form) form.requestSubmit();
                        }}
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
                    <button
                      type="button"
                      onClick={() => setEditingContent(p.id)}
                      className="rounded border px-3 py-1 text-sm hover:bg-zinc-50"
                    >
                      {p.content ? "Bearbeiten" : "Hinzufügen"}
                    </button>
                    {p.content && (
                      <div className="mt-1 text-xs text-zinc-500">
                        {(() => {
                          // HTML-Tags entfernen für Vorschau
                          const textContent = p.content.replace(/<[^>]*>/g, "").trim();
                          const preview = textContent.length > 50 ? `${textContent.substring(0, 50)}...` : textContent;
                          return preview || "(leer)";
                        })()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {saveMessage?.id === p.id && (
                        <span className={`text-xs ${saveMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                          {saveMessage.message}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          setSaving(p.id);
                          setSaveMessage(null);
                          
                          try {
                            // Sammle Daten aus allen Formularen
                            const formData = new FormData();
                            formData.append("id", p.id);
                            
                            // Titel-Formular
                            const titleForm = document.getElementById(`form-title-${p.id}`) as HTMLFormElement;
                            if (titleForm) {
                              const titleInput = titleForm.querySelector('input[name="title"]') as HTMLInputElement;
                              if (titleInput) {
                                formData.append("title", titleInput.value);
                              }
                            }
                            
                            // Berufsbild-Formular
                            const berufsbildForm = document.getElementById(`form-berufsbild-${p.id}`) as HTMLFormElement;
                            if (berufsbildForm) {
                              const berufsbildInput = berufsbildForm.querySelector('input[name="berufsbild"]') as HTMLInputElement;
                              if (berufsbildInput) {
                                formData.append("berufsbild", berufsbildInput.value);
                              }
                            }
                            
                            await updateProfession(formData);
                            setSaveMessage({ id: p.id, message: "Gespeichert!", type: "success" });
                            
                            // Nach 2 Sekunden die Nachricht entfernen und Seite aktualisieren
                            setTimeout(() => {
                              setSaveMessage(null);
                              router.refresh();
                            }, 1000);
                          } catch (error: any) {
                            setSaveMessage({ 
                              id: p.id, 
                              message: error?.message || "Fehler beim Speichern", 
                              type: "error" 
                            });
                          } finally {
                            setSaving(null);
                          }
                        }}
                        disabled={saving === p.id}
                        className="rounded border px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving === p.id ? "Speichert..." : "Speichern"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenerate(p.id, p.title, p.berufsbild)}
                        disabled={generating === p.id}
                        className="rounded border px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                      >
                        {generating === p.id ? "Generiert …" : "Neue generieren"}
                      </button>
                      <form action={deleteProfession}>
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="rounded border px-3 py-1 text-red-600">Löschen</button>
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
      
      {/* Content Bearbeitungs-Modal */}
      {editingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl m-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Content bearbeiten</h2>
              <button
                type="button"
                onClick={() => setEditingContent(null)}
                className="text-zinc-500 hover:text-zinc-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <form
                action={updateProfession}
                id={`form-content-${editingContent}`}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  await updateProfession(formData);
                  setEditingContent(null);
                  router.refresh();
                }}
              >
                <input type="hidden" name="id" value={editingContent} />
                <RichTextEditor
                  name="content"
                  value={professions.find((p) => p.id === editingContent)?.content || ""}
                  placeholder="Content hier eingeben..."
                  height={400}
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingContent(null)}
                    className="rounded border px-4 py-2 hover:bg-zinc-50"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

