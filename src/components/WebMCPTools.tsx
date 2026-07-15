"use client";

import { useEffect } from "react";

declare global {
  interface Document {
    modelContext?: {
      registerTool(
        tool: {
          name: string;
          title?: string;
          description: string;
          inputSchema: Record<string, unknown>;
          execute: (params: Record<string, unknown>) => Promise<unknown>;
        },
        options?: { signal?: AbortSignal }
      ): Promise<void>;
    };
  }
}

export default function WebMCPTools() {
  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) return;

    const controller = new AbortController();
    const signal = controller.signal;

    modelContext.registerTool(
      {
        name: "search_professions",
        title: "Search Professions",
        description:
          "Durchsucht die berufsbild.com Datenbank mit über 18.000 Berufsbildern. " +
          "Sucht in Berufsbezeichnung, Untertitel und Inhalt. " +
          "Gibt eine Liste passender Berufe mit Titel, Untertitel, Slug und Link zurück. " +
          "Unterstützt auch Filterung nach Anfangsbuchstabe und Paginierung.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Suchbegriff für Berufsbezeichnung, Tätigkeitsfeld oder Branche (z.B. 'Pflege', 'Softwareentwickler', 'Tischler')",
            },
            letter: {
              type: "string",
              description:
                "Anfangsbuchstabe zum Filtern (A-Z). Optional, kann mit query kombiniert werden.",
              pattern: "^[A-Za-z]$",
            },
            page: {
              type: "integer",
              description: "Seitennummer für Paginierung (Standard: 1)",
              minimum: 1,
              default: 1,
            },
            pageSize: {
              type: "integer",
              description: "Anzahl Ergebnisse pro Seite (Standard: 20, Maximum: 50)",
              minimum: 1,
              maximum: 50,
              default: 20,
            },
          },
          required: ["query"],
        },
        async execute(params) {
          const searchParams = new URLSearchParams();
          if (params.query) searchParams.set("q", String(params.query));
          if (params.letter) searchParams.set("letter", String(params.letter));
          searchParams.set("page", String(params.page ?? 1));
          searchParams.set("pageSize", String(Math.min(Number(params.pageSize) || 20, 50)));

          const res = await fetch(`/api/professions?${searchParams}`);
          if (!res.ok) return { error: "Suche fehlgeschlagen", status: res.status };

          const data = await res.json();
          return {
            total: data.total,
            page: data.page,
            pageSize: data.pageSize,
            results: data.items.map((item: { title: string; subtitle: string | null; slug: string }) => ({
              title: item.title,
              subtitle: item.subtitle,
              url: `https://berufsbild.com/details/${item.slug}`,
            })),
          };
        },
      },
      { signal }
    );

    modelContext.registerTool(
      {
        name: "get_profession_detail",
        title: "Get Profession Detail",
        description:
          "Ruft die Detailseite eines bestimmten Berufsbildes auf berufsbild.com auf. " +
          "Navigiert zur Profilseite mit vollständigen Informationen zu Aufgaben, " +
          "Anforderungen, Gehalt und Karrierechancen.",
        inputSchema: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description:
                "Der URL-Slug des Berufsbildes (z.B. 'softwareentwickler' oder 'krankenpfleger'). " +
                "Kann aus den Suchergebnissen von search_professions entnommen werden.",
            },
          },
          required: ["slug"],
        },
        async execute(params) {
          const slug = String(params.slug).toLowerCase().trim();
          window.location.href = `/details/${encodeURIComponent(slug)}`;
          return { navigated: true, url: `/details/${slug}` };
        },
      },
      { signal }
    );

    modelContext.registerTool(
      {
        name: "navigate_berufsfelder",
        title: "Navigate Berufsfelder",
        description:
          "Zeigt eine Übersicht der 15 offiziellen Berufsfelder in Deutschland an. " +
          "Berufsfelder gruppieren Berufe thematisch (z.B. Gesundheit, IT, Handwerk). " +
          "Navigiert zur Berufsfelder-Übersichtsseite.",
        inputSchema: {
          type: "object",
          properties: {},
        },
        async execute() {
          window.location.href = "/berufsfelder";
          return { navigated: true, url: "/berufsfelder" };
        },
      },
      { signal }
    );

    return () => controller.abort();
  }, []);

  return null;
}
