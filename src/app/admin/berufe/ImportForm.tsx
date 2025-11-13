 "use client";
 
 import { useState } from "react";
 
 export default function ImportForm() {
   const [result, setResult] = useState<any>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
     e.preventDefault();
     setError(null);
     setResult(null);
     setLoading(true);
     try {
       const fd = new FormData(e.currentTarget);
       const res = await fetch("/api/admin/import-professions", {
         method: "POST",
         body: fd,
       });
       const json = await res.json();
       if (!res.ok) {
         setError(json?.error || "Import fehlgeschlagen");
       } else {
         setResult(json);
       }
     } catch (err: any) {
       setError(err?.message || "Unerwarteter Fehler");
     } finally {
       setLoading(false);
     }
   }
 
   return (
     <div className="rounded-lg border p-4">
       <form onSubmit={onSubmit} className="flex flex-col gap-3">
         <div>
           <label className="block text-sm text-zinc-700">Excel-Datei (.xlsx)</label>
           <input name="file" type="file" accept=".xlsx,.xls" required className="mt-1" />
         </div>
         <div>
           <label className="block text-sm text-zinc-700">Sheet-Name (optional)</label>
           <input name="sheet" placeholder="leer lassen für erstes Sheet" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" />
         </div>
         <button disabled={loading} className="inline-flex w-fit items-center rounded-lg bg-zinc-900 px-4 py-2 text-white disabled:opacity-60">
           {loading ? "Import läuft …" : "Import starten"}
         </button>
       </form>
 
       {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
       {result ? (
         <div className="mt-3 text-sm">
           <p className="font-medium">Ergebnis</p>
           <pre className="mt-1 overflow-auto rounded bg-zinc-50 p-2">{JSON.stringify(result, null, 2)}</pre>
         </div>
       ) : null}
     </div>
   );
 }
 

