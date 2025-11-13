"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  label?: string;
  className?: string;
  successText?: string;
};

export default function SubmitWithFeedback({
  label = "Speichern",
  className,
  successText = "Gespeichert",
}: Props) {
  const { pending } = useFormStatus();
  const prevPending = useRef(pending);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    // Wenn der Request gerade fertig wurde (pending von true -> false), kurz Success anzeigen
    if (prevPending.current && !pending) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2000);
      return () => clearTimeout(t);
    }
    prevPending.current = pending;
  }, [pending]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className={className ?? "rounded border px-3 py-1 text-sm disabled:opacity-60 inline-flex items-center gap-2"}
      >
        {pending ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
            Wird gespeichert …
          </>
        ) : (
          label
        )}
      </button>
      {justSaved ? <span className="text-xs text-green-600">{successText}</span> : null}
    </div>
  );
}


