"use client";

import { usePathname } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berufsbild.com";

export function CanonicalLink() {
  const pathname = usePathname() || "/";
  const base = BASE_URL.replace(/\/+$/, "");
  const href = `${base}${pathname}`;
  return <link rel="canonical" href={href} />;
}


