import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.berufsbild.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Statische Seiten
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/details`, lastModified: new Date() },
    { url: `${BASE_URL}/magazin`, lastModified: new Date() },
    { url: `${BASE_URL}/impressum`, lastModified: new Date() },
    { url: `${BASE_URL}/datenschutz`, lastModified: new Date() },
    { url: `${BASE_URL}/kidb-nummer`, lastModified: new Date() },
  ];

  // Berufsprofile (veröffentlicht)
  const professions = await prisma.profession.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const professionEntries: MetadataRoute.Sitemap = professions.map((p) => ({
    url: `${BASE_URL}/details/${p.slug}`,
    lastModified: p.updatedAt,
  }));

  // Magazin-Artikel (veröffentlicht)
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/magazin/${a.slug}`,
    lastModified: a.updatedAt ?? a.publishedAt ?? new Date(),
  }));

  return [...staticEntries, ...professionEntries, ...articleEntries];
}


