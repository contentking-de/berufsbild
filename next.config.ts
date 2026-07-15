import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "tools=(self)",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Berufsfelder-Liste → Details
      {
        source: "/berufsfelder-liste-und-uebersicht",
        destination: "/details",
        permanent: true,
      },
      {
        source: "/berufsfelder-liste-und-uebersicht/",
        destination: "/details",
        permanent: true,
      },
      // Wissen/Good-to-Know Artikel → Magazin
      {
        source: "/wissen-good-to-know/:slug*",
        destination: "/magazin/:slug*",
        permanent: true,
      },
      // Bewerbungen Artikel → Magazin
      {
        source: "/bewerbungen/:slug*",
        destination: "/magazin/:slug*",
        permanent: true,
      },
      // Studien-Daten Artikel → Magazin
      {
        source: "/studien-daten/:slug*",
        destination: "/magazin/:slug*",
        permanent: true,
      },
      // Worklife Artikel → Magazin
      {
        source: "/worklife/:slug*",
        destination: "/magazin/:slug*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
