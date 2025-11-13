"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  articleId: string;
  defaultTitle: string;
};

export default function GenerateWithAIButton({ articleId, defaultTitle }: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("id", articleId);
      fd.append("title", title);
      const res = await fetch("/api/admin/generate-article", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Generierung fehlgeschlagen");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Fehler bei der Generierung");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <label className="text-sm font-medium text-zinc-700">Artikel mit ChatGPT generieren</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        placeholder="Titel/Thema für die Generierung"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={onClick}
          disabled={busy || !title.trim()}
          className="rounded border px-3 py-1 text-sm disabled:opacity-60"
        >
          {busy ? "Generiert …" : "Artikel erzeugen"}
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
      <p className="text-xs text-zinc-500">
        Hinweis: Der Inhalt wird automatisch gespeichert und der Teaser aus dem Text erzeugt.
      </p>
    </div>
  );
}


