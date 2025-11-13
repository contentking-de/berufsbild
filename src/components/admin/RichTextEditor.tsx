"use client";

import { useEffect, useRef } from "react";

type Props = {
  name: string;
  value?: string | null;
  placeholder?: string;
  className?: string;
  height?: number;
};

// Sehr einfacher WYSIWYG-Editor auf Basis contenteditable + execCommand.
// Zweck: Admin-Eingabe; HTML wird als String im Hidden-Field abgelegt.
export default function RichTextEditor({ name, value, placeholder, className, height = 260 }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const hiddenRef = useRef<HTMLInputElement | null>(null);

  // Initialen/externen Inhalt einmalig oder bei Prop-Änderung einsetzen,
  // ohne bei jedem Input neu zu rendern (sonst springt der Cursor).
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value ?? "";
    }
    if (hiddenRef.current) {
      hiddenRef.current.value = value ?? "";
    }
    // Standard-Absatz als <p> erzwingen, damit Überschriften wieder zu Normaltext konvertiert werden können.
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // optional, nicht überall unterstützt
    }
  }, [value]);

  function exec(cmd: string, arg?: string) {
    try {
      document.execCommand(cmd, false, arg);
      // Hidden-Feld aktualisieren (uncontrolled editor)
      if (hiddenRef.current && editorRef.current) {
        hiddenRef.current.value = editorRef.current.innerHTML;
      }
    } catch {
      // no-op
    }
  }

  function onInput() {
    if (hiddenRef.current && editorRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    // Einfache Sanitization: nur Text einfügen (verhindert Word/Google-Styles)
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    if (hiddenRef.current && editorRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("bold")}>
          Fett
        </button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("italic")}>
          Kursiv
        </button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("underline")}>
          Unterstreichen
        </button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("insertUnorderedList")}>
          • Liste
        </button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("insertOrderedList")}>
          1. Liste
        </button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("formatBlock", "P")}>
          Normal
        </button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("formatBlock", "H2")}>
          H2
        </button>
        <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => exec("formatBlock", "H3")}>
          H3
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => {
            const url = prompt("Link-Adresse (https://…):") || "";
            if (url) exec("createLink", url);
          }}
        >
          Link
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => exec("removeFormat")}
          title="Formatierung entfernen"
        >
          Format löschen
        </button>
      </div>
      <div
        ref={editorRef}
        onInput={onInput}
        onPaste={onPaste}
        contentEditable
        suppressContentEditableWarning
        className="rte w-full rounded border border-zinc-300 bg-white p-3 outline-none focus:border-zinc-600"
        dir="ltr"
        style={{ minHeight: height, direction: "ltr", textAlign: "left" as const }}
        data-placeholder={placeholder}
      />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={value ?? ""} />
    </div>
  );
}


