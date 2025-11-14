"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_COOKIE = "bb_consent";
const CONSENT_VERSION = "v1";

function getConsent(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function setConsent(value: "necessary" | "all") {
  if (typeof document === "undefined") return;
  const oneYear = 365 * 24 * 60 * 60;
  const expires = new Date(Date.now() + oneYear * 1000).toUTCString();
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(`${CONSENT_VERSION}|${value}`)}; Expires=${expires}; Path=/; SameSite=Lax`;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const v = getConsent();
    if (!v) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-lg sm:flex sm:items-center sm:justify-between">
          <div className="sm:mr-6">
            <p className="text-sm text-zinc-800">
              Wir verwenden nur technisch notwendige Cookies. Optionale Cookies (z. B. für Statistik) setzen wir nur mit
              deiner Einwilligung. Mehr Informationen findest du in unserer{" "}
              <Link href="/datenschutz" className="underline">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <button
              onClick={() => {
                setConsent("necessary");
                setVisible(false);
              }}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Nur notwendige
            </button>
            <button
              onClick={() => {
                setConsent("all");
                setVisible(false);
              }}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


