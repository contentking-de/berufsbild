"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type ErrorLog = {
  professionId: string;
  title: string;
  error: string;
  stack?: string;
  timestamp: string;
};

type CompletedItem = {
  title: string;
  slug: string;
  timestamp: string;
};

type JobStatus = {
  running: boolean;
  processed: number;
  total: number;
  errors: number;
  current?: string;
  startedAt?: string;
  progress: number;
  errorLogs?: ErrorLog[];
  completedItems?: CompletedItem[];
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function estimateRemaining(processed: number, total: number, startedAt: string): string {
  if (processed === 0) return "wird berechnet...";
  const elapsed = Date.now() - new Date(startedAt).getTime();
  const perItem = elapsed / processed;
  const remaining = perItem * (total - processed);
  return `~${formatDuration(remaining)}`;
}

export default function BatchGenerateButton() {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  // Status laden
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/generate-professions-batch");
      const data = await res.json();
      setStatus(data);
      return data as JobStatus;
    } catch (error) {
      console.error("Fehler beim Abrufen des Status:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [status?.completedItems?.length]);

  // Verarbeitungs-Loop: triggert jeweils den nächsten Beruf
  const runProcessingLoop = useCallback(async () => {
    if (processing) return;
    setProcessing(true);
    abortRef.current = false;

    try {
      while (!abortRef.current) {
        const res = await fetch("/api/admin/generate-professions-batch", { method: "PUT" });
        const data = await res.json();

        if (!res.ok || data.done) {
          await fetchStatus();
          break;
        }

        // Status lokal sofort aktualisieren
        await fetchStatus();

        // Kleine Pause zwischen Requests
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (error) {
      console.error("Processing-Loop Fehler:", error);
    } finally {
      setProcessing(false);
    }
  }, [processing, fetchStatus]);

  async function handleStart() {
    if (!confirm("Möchtest du wirklich neuen Content für ALLE Berufe generieren? Das überschreibt vorhandenen Content und kann sehr lange dauern.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/generate-professions-batch", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Fehler beim Starten des Batch-Jobs");
        return;
      }
      await fetchStatus();
      // Starte den Processing-Loop
      runProcessingLoop();
    } catch (error: any) {
      alert(error?.message || "Fehler beim Starten des Batch-Jobs");
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    abortRef.current = true;
    try {
      await fetch("/api/admin/generate-professions-batch", { method: "DELETE" });
      await fetchStatus();
    } catch (error) {
      console.error("Fehler beim Stoppen:", error);
    }
  }

  // Auto-Resume: wenn Status "running" ist aber kein Processing-Loop aktiv
  useEffect(() => {
    if (status?.running && !processing && !loading) {
      runProcessingLoop();
    }
  }, [status?.running, processing, loading, runProcessingLoop]);

  const isRunning = status?.running || false;
  const completedItems = status?.completedItems || [];

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <h3 className="text-sm font-medium text-zinc-900">Batch-Content-Generierung</h3>
      <p className="mt-1 text-xs text-zinc-600">
        Generiere neuen Content für alle Berufe (überschreibt vorhandenen Content). Verarbeitung läuft über deinen Browser.
      </p>

      {status && (
        <div className="mt-4 space-y-3">
          {isRunning ? (
            <>
              {/* Status-Header */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  {processing ? "Verarbeitet..." : "Wartet..."}
                </span>
                {status.startedAt && (
                  <span className="text-xs text-zinc-500">
                    seit {formatDuration(Date.now() - new Date(status.startedAt).getTime())}
                  </span>
                )}
              </div>

              {/* Progressbar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <span>{status.processed} / {status.total} Berufe</span>
                  <span>{status.progress}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${Math.max(status.progress, 0.5)}%` }}
                  >
                    {status.progress > 5 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                        {status.progress}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  {status.errors > 0 && (
                    <span className="text-red-600">{status.errors} Fehler</span>
                  )}
                  {status.startedAt && status.processed > 0 && (
                    <span className="ml-auto">
                      Verbleibend: {estimateRemaining(status.processed, status.total, status.startedAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Aktuell verarbeitet */}
              {status.current && (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <svg className="h-3 w-3 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="truncate">{status.current}</span>
                </div>
              )}

              {/* Liste der verarbeiteten URLs */}
              {completedItems.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-700">
                    Zuletzt verarbeitet ({completedItems.length}):
                  </p>
                  <div
                    ref={listRef}
                    className="max-h-56 overflow-y-auto rounded border border-zinc-200 bg-white"
                  >
                    <ul className="divide-y divide-zinc-100">
                      {completedItems.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between px-3 py-1.5 text-xs">
                          <a
                            href={`/details/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {item.title}
                          </a>
                          <span className="ml-2 shrink-0 text-zinc-400">
                            {new Date(item.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Fehler-Details */}
              {status.errorLogs && status.errorLogs.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-red-700 hover:text-red-900">
                    {status.errorLogs.length} Fehler anzeigen
                  </summary>
                  <div className="mt-1 max-h-40 overflow-y-auto rounded border border-red-200 bg-red-50 p-2">
                    <div className="space-y-1">
                      {status.errorLogs.map((log, idx) => (
                        <details key={idx} className="text-xs">
                          <summary className="cursor-pointer text-red-700 hover:text-red-900">
                            {log.title} – {new Date(log.timestamp).toLocaleTimeString("de-DE")}
                          </summary>
                          <div className="mt-1 rounded bg-white p-2 font-mono text-xs text-red-900">
                            <div className="font-semibold">{log.error}</div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                </details>
              )}

              <button
                onClick={handleStop}
                className="mt-2 w-full rounded border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Job stoppen
              </button>

              <p className="text-[10px] text-zinc-400">
                Hinweis: Die Verarbeitung läuft über deinen Browser-Tab. Tab nicht schließen!
              </p>
            </>
          ) : status.total > 0 ? (
            <>
              {/* Abgeschlossen-State */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Abgeschlossen
                </span>
                <span className="text-xs text-zinc-500">
                  {status.processed} / {status.total} Berufe
                </span>
              </div>

              {status.errors > 0 && (
                <p className="text-xs text-red-600">{status.errors} Fehler aufgetreten</p>
              )}

              {completedItems.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-zinc-700 hover:text-zinc-900">
                    Verarbeitete Berufe anzeigen ({completedItems.length})
                  </summary>
                  <div className="mt-1 max-h-56 overflow-y-auto rounded border border-zinc-200 bg-white">
                    <ul className="divide-y divide-zinc-100">
                      {completedItems.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between px-3 py-1.5 text-xs">
                          <a
                            href={`/details/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {item.title}
                          </a>
                          <span className="ml-2 shrink-0 text-zinc-400">
                            {new Date(item.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>
              )}

              {status.errorLogs && status.errorLogs.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-red-700 hover:text-red-900">
                    {status.errorLogs.length} Fehler anzeigen
                  </summary>
                  <div className="mt-1 max-h-40 overflow-y-auto rounded border border-red-200 bg-red-50 p-2">
                    <div className="space-y-1">
                      {status.errorLogs.map((log, idx) => (
                        <details key={idx} className="text-xs">
                          <summary className="cursor-pointer text-red-700 hover:text-red-900">
                            {log.title} – {new Date(log.timestamp).toLocaleTimeString("de-DE")}
                          </summary>
                          <div className="mt-1 rounded bg-white p-2 font-mono text-xs text-red-900">
                            <div className="font-semibold">{log.error}</div>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                </details>
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
