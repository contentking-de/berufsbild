"use client";

import { useState } from "react";

type Props = {
  articleId: string;
  initialUrl?: string | null;
  onSave?: (formData: FormData) => void | Promise<void>;
};

export default function BlobImageUpload({ articleId, initialUrl, onSave }: Props) {
  const [url, setUrl] = useState<string>(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("filename", f.name);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload fehlgeschlagen");
      setUrl(json.url as string);
    } catch (err: any) {
      setError(err?.message || "Upload fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={onSave} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={articleId} />
      <input type="hidden" name="coverImageUrl" value={url} />
      <div className="flex items-start gap-3">
        <div className="h-20 w-32 overflow-hidden rounded border bg-zinc-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {url ? <img src={url} alt="Cover" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="flex-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-1 text-sm">
            <input type="file" accept="image/*" className="sr-only" onChange={onFileChange} disabled={busy} />
            {busy ? "Lädt …" : "Datei auswählen"}
          </label>
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
        {onSave ? (
          <div>
            <button
              type="submit"
              disabled={busy || !url}
              className="rounded border px-3 py-1 text-sm disabled:opacity-60"
              title={!url ? "Bitte zuerst ein Bild hochladen" : "Coverbild speichern"}
            >
              Speichern
            </button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
 

