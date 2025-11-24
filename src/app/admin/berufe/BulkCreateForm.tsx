"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BulkCreateForm() {
  const [berufsbilder, setBerufsbilder] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<
    Array<{ berufsbild: string; success: boolean; id?: string; error?: string }>
  >([]);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = berufsbilder
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      alert("Bitte geben Sie mindestens ein Berufsbild ein.");
      return;
    }

    setIsProcessing(true);
    setResults([]);

    try {
      const response = await fetch("/api/admin/create-professions-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ berufsbilder: lines }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Erstellen der Berufsbilder");
      }

      const data = await response.json();
      const results: Array<{ berufsbild: string; success: boolean; id?: string; error?: string }> = data.results || [];
      setResults(results);
      
      const successCount = results.filter((r: { berufsbild: string; success: boolean; id?: string; error?: string }) => r.success).length;
      const errorCount = results.filter((r: { berufsbild: string; success: boolean; id?: string; error?: string }) => !r.success).length;
      
      if (successCount > 0) {
        router.refresh();
      }
      
      // Zeige Zusammenfassung
      alert(
        `Fertig!\n\nErfolgreich: ${successCount}\nFehler: ${errorCount}`
      );
    } catch (error: any) {
      console.error("Fehler:", error);
      alert(`Fehler: ${error?.message || "Unbekannter Fehler"}`);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="bulk-berufsbilder" className="mb-2 block text-sm font-medium text-zinc-700">
            Berufsbilder (ein Berufsbild pro Zeile)
          </label>
          <textarea
            id="bulk-berufsbilder"
            value={berufsbilder}
            onChange={(e) => setBerufsbilder(e.target.value)}
            placeholder="AI Engineer&#10;Data Scientist&#10;UX Designer&#10;..."
            rows={10}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
            disabled={isProcessing}
          />
          <p className="mt-1 text-xs text-zinc-500">
            {berufsbilder.split("\n").filter((l) => l.trim().length > 0).length} Berufsbilder erkannt
          </p>
        </div>
        <button
          type="submit"
          disabled={isProcessing || berufsbilder.trim().length === 0}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Erstelle Berufsbilder..." : "Alle anlegen"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-medium text-zinc-700">Ergebnisse:</h3>
          <div className="max-h-60 space-y-1 overflow-y-auto rounded border border-zinc-200 p-3 text-sm">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between rounded px-2 py-1 ${
                  result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                <span className="font-medium">{result.berufsbild}</span>
                <span className="text-xs">
                  {result.success ? "✓ Erfolgreich" : `✗ ${result.error || "Fehler"}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

