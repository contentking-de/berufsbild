"use client";

import { useState, useEffect } from "react";

type JobStatus = {
  running: boolean;
  processed: number;
  total: number;
  errors: number;
  current?: string;
  startedAt?: string;
  progress: number;
};

export default function BatchGenerateButton() {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Polling für Job-Status alle 2 Sekunden
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/generate-professions-batch");
        const data = await res.json();
        setStatus(data);
      } catch (error) {
        console.error("Fehler beim Abrufen des Status:", error);
      }
    }, 2000);

    // Initialer Status-Check
    fetch("/api/admin/generate-professions-batch")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(console.error);

    return () => clearInterval(interval);
  }, []);

  async function handleStart() {
    if (!confirm("Möchtest du wirklich Content für alle Berufe ohne Content generieren? Das kann sehr lange dauern.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/generate-professions-batch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Fehler beim Starten des Batch-Jobs");
      }
    } catch (error: any) {
      alert(error?.message || "Fehler beim Starten des Batch-Jobs");
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    try {
      await fetch("/api/admin/generate-professions-batch", { method: "DELETE" });
    } catch (error) {
      console.error("Fehler beim Stoppen:", error);
    }
  }

  const isRunning = status?.running || false;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <h3 className="text-sm font-medium text-zinc-900">Batch-Content-Generierung</h3>
      <p className="mt-1 text-xs text-zinc-600">
        Generiere neuen Content für alle Berufe (überschreibt vorhandenen Content). Der Job läuft serverseitig im Hintergrund.
      </p>

      {status && (
        <div className="mt-4 space-y-2">
          {isRunning ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">Status:</span>
                <span className="font-medium text-blue-600">Läuft...</span>
              </div>
              {status.current && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700">Aktuell:</span>
                  <span className="font-medium text-zinc-900">{status.current}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">Fortschritt:</span>
                <span className="font-medium text-zinc-900">
                  {status.processed} / {status.total} ({status.progress}%)
                </span>
              </div>
              {status.errors > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700">Fehler:</span>
                  <span className="font-medium text-red-600">{status.errors}</span>
                </div>
              )}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${status.progress}%` }}
                />
              </div>
              {status.startedAt && (
                <p className="text-xs text-zinc-500">
                  Gestartet: {new Date(status.startedAt).toLocaleString("de-DE")}
                </p>
              )}
              <button
                onClick={handleStop}
                className="mt-3 w-full rounded border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Job stoppen
              </button>
            </>
          ) : status.total > 0 ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">Abgeschlossen:</span>
                <span className="font-medium text-green-600">
                  {status.processed} / {status.total} Berufe
                </span>
              </div>
              {status.errors > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700">Fehler:</span>
                  <span className="font-medium text-red-600">{status.errors}</span>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {!isRunning && (
        <button
          onClick={handleStart}
          disabled={loading || isRunning}
          className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Startet..." : "Batch-Job starten"}
        </button>
      )}
    </div>
  );
}

