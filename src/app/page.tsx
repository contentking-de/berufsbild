import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import MagazineGrid from "@/components/magazin/MagazineGrid";

export const metadata: Metadata = {
  title: "Berufsbilder Datenbank – Berufe von A-Z suchen und finden",
};

export default async function Home() {
  const randomProfessions = await prisma.$queryRaw<
    { slug: string; title: string; subtitle: string | null }[]
  >`SELECT "slug","title","subtitle" FROM "Profession" WHERE "status" = 'PUBLISHED' ORDER BY random() LIMIT 9`;
  const recentArticles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }],
    select: { id: true, slug: true, title: true, excerpt: true, coverImageUrl: true, publishedAt: true },
    take: 60,
  });
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_500px_at_50%_-20%,rgba(0,0,0,0.05),transparent)]" />
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              18.000+ Berufsbilder. Modern. Übersichtlich. Relevant.
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600">
              Finde Berufsinspiration, Anforderung, Perspektiven und Artikel im Magazin – alles an einem Ort, alles in unserer Berufsbild Datenbank - sortiert von A-Z.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/details"
                className="inline-flex items-center rounded-full bg-zinc-900 px-6 py-3 text-white hover:bg-zinc-800"
              >
                Berufe A–Z ansehen
              </Link>
              <Link
                href="/magazin"
                className="inline-flex items-center rounded-full border border-zinc-300 px-6 py-3 text-zinc-900 hover:bg-zinc-50"
              >
                Zum Magazin
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-zinc-50">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight">
                Finde den Beruf, der zu Dir passt – Deine Zukunft beginnt hier!
              </h2>
              <p className="mt-4 text-zinc-700 leading-7">
                Du stehst vor der großen Frage: Welcher Beruf ist der richtige für mich? Die Auswahl ist riesig, und
                oft fehlt es an klaren Informationen, um die beste Entscheidung für Ausbildung, Studium oder
                Berufseinstieg zu treffen. Genau hier setzt unsere Webseite an!
              </p>
              <p className="mt-3 text-zinc-700 leading-7">
                Entdecke unsere umfangreiche Datenbank mit detaillierten Beschreibungen spannender Berufsbilder und
                Berufsprofile. Egal, ob Du Dich für kreative Berufe, technische Herausforderungen oder soziale Tätigkeiten
                interessierst – bei uns findest Du alles, was Du wissen musst: Anforderungen, Karrierechancen, notwendige
                Qualifikationen und vieles mehr.
              </p>
            </div>
            <figure className="relative">
              <Image
                src="/berufsbild-finden.png"
                alt="Beruf finden – Illustration"
                width={720}
                height={480}
                className="w-full h-auto rounded-xl shadow-sm"
                priority
              />
              <figcaption className="mt-3 text-sm text-zinc-600 text-center">
                mit den richtigen Informationen zum Berufsbild findest Du den optimalen Job und die besten Karrieremöglichkeiten für Dich
              </figcaption>
            </figure>
          </div>
        </div>
      </section>
      <section>
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">Unsere Mission</h2>
            <p className="mt-4 text-zinc-700 leading-7">
              Unsere Mission ist es, Dir den Weg zu Deinem Traumjob zu erleichtern, indem wir über unsere detaillierten
              Berufsbilder eine informationale zusätzliche Berufsberatung anbieten. Mit leicht verständlichen Informationen,
              praktischen Tipps und einer intuitiven Suchfunktion wird die Berufswahl für Dich zu einer spannenden
              Entdeckungsreise. Lass Dich von unseren Berufsbeschreibungen und -erklärungen inspirieren und finde heraus,
              welcher Beruf wirklich zu Deinen Stärken und Interessen passt.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <figure className="relative">
              <Image
                src="/berufsprofil.png"
                alt="Beispielhafte Darstellung eines Berufsprofils"
                width={720}
                height={480}
                className="w-full h-auto rounded-xl shadow-sm"
              />
            </figure>
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight">Berufsprofile – Aufbau und Struktur</h2>
              <p className="mt-4 text-zinc-700 leading-7">
                Ein Berufsprofil beschreibt umfassend alle Tätigkeiten, die während der Ausbildung und Ausübung eines
                bestimmten Berufs anfallen.
              </p>
              <p className="mt-3 text-zinc-700 leading-7">
                Es enthält häufig auch Informationen zu Weiterbildungs- und Aufstiegsmöglichkeiten, zu Gehältern und
                konkreten Anforderungen an den Bewerber. Durch diese Beschreibung wird der jeweilige Beruf klar von
                anderen abgegrenzt.
              </p>
              <p className="mt-3 text-zinc-700 leading-7">
                Berufsprofile werden übrigens häufig von den entsprechenden Berufsverbänden definiert und teils sogar
                durch gesetzliche Vorgaben festgelegt.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight">Berufsbilder entdecken – Deine Berufsorientierung beginnt hier!</h2>
            <p className="mt-4 text-zinc-700 leading-7">
              Entdecke unsere durchsuchbare Datenbank mit Tausenden von Berufsbildern! Von kreativen bis technischen Berufen – finde detaillierte Informationen zu Anforderungen, Aufgaben und Karrierechancen. Lass Dich inspirieren und finde den Beruf, der perfekt zu Dir passt. Und nicht nur das: Du findest außerdem Bewerbungstipps, Vorlagen und Beispiele, Anleitungen für erfolgreiche Bewerbungsgespräche und jede Menge Hintergrundwissen.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Bewerbungstipps, die überzeugen – So kommst Du ans Ziel!</h3>
              <p className="mt-3 text-zinc-700 leading-7">
                Eine Bewerbung ist mehr als nur ein Lebenslauf! Erfahre, wie Du Deine Stärken richtig präsentierst, typische Fehler vermeidest und einen bleibenden Eindruck hinterlässt. Unsere Tipps helfen Dir, selbstbewusst in die Bewerbungsphase zu starten.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Vorlagen &amp; Beispiele – Professionell und individuell</h3>
              <p className="mt-3 text-zinc-700 leading-7">
                Keine Idee, wie Du anfangen sollst? Kein Problem! Wir bieten Dir professionelle Vorlagen für Lebensläufe, Anschreiben und Deckblätter, die Du individuell anpassen kannst. So bist Du perfekt vorbereitet – und sparst Zeit und Nerven.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Erfolgreich im Bewerbungsgespräch – Sei die beste Version von Dir selbst!</h3>
              <p className="mt-3 text-zinc-700 leading-7">
                Du hast die Einladung? Super! Jetzt kommt es darauf an, zu überzeugen. Unsere Tutorials und Anleitungen zeigen Dir, wie Du selbstbewusst auftrittst, typische Fragen meisterst und mit Deiner Persönlichkeit punktest.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Hintergrundwissen für Deine Zukunft – Sei immer einen Schritt voraus!</h3>
              <p className="mt-3 text-zinc-700 leading-7">
                Was erwarten Arbeitgeber? Welche Trends gibt es in der Berufswelt? Unsere Hintergrundartikel und detaillierten Berufsbilder geben Dir wertvolle Einblicke und bereiten Dich optimal auf Deinen Karriereweg vor.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Interessante Berufsbilder, die gerade häufig gesucht werden</h2>
          {randomProfessions.length === 0 ? (
            <p className="mt-4 text-zinc-600">Aktuell sind noch keine veröffentlichten Berufsprofile vorhanden.</p>
          ) : (
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {randomProfessions.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/details/${p.slug}`}
                    className="block rounded-lg border border-zinc-200 p-4 hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <h3 className="font-medium">{p.title}</h3>
                    {p.subtitle ? <p className="mt-1 text-sm text-zinc-600">{p.subtitle}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight">Aktuelle Artikel aus dem Magazin</h2>
          {recentArticles.length === 0 ? (
            <p className="mt-4 text-zinc-600">Noch keine Artikel veröffentlicht.</p>
          ) : (
            <MagazineGrid
              articles={recentArticles.map((a) => ({
                ...a,
                publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
              }))}
              initialCount={6}
            />
          )}
        </div>
      </section>
    </>
  );
}
