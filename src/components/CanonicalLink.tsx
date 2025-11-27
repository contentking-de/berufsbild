"use client";

import { usePathname } from "next/navigation";

// Entferne www. aus der URL, falls vorhanden
function normalizeBaseUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)/i, "https://");
}

const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL || "https://berufsbild.com");

export function CanonicalLink() {
  const pathname = usePathname() || "/";
  const base = BASE_URL.replace(/\/+$/, "");
  const href = `${base}${pathname}`;
  return <link rel="canonical" href={href} />;
}


