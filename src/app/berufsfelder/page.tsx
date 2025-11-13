import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Berufsfelder – Liste und Übersicht",
  description:
    "Was sind Berufsfelder? Warum gibt es sie, wie sind sie aufgebaut und welche Felder gibt es? Übersicht der 15 offiziellen Berufsfelder mit Beispielen.",
};

export default function BerufsfelderPage() {
  const fields: { title: string; desc: string; examples?: string }[] = [
    { title: "Bau, Architektur und Vermessung", desc: "Planen, Bauen, Vermessen und Instandhalten von Bauwerken und Infrastruktur.", examples: "z. B. Architekt:in, Bauingenieur:in, Dachdecker:in, Vermessungstechniker:in" },
    { title: "Gesundheit und Pflege", desc: "Diagnose, Behandlung, Pflege und Betreuung von Patient:innen sowie Labor‑ und Therapieberufe.", examples: "z. B. Ärztin/Arzt, Pflegefachkraft, Physiotherapeut:in, Medizinische:r Laborant:in" },
    { title: "Informatik, Telekommunikation und Technik", desc: "Entwicklung, Betrieb und Wartung von IT‑Systemen, Software, Netzen und technischen Anlagen.", examples: "z. B. Softwareentwickler:in, IT‑Admin, Mechatroniker:in" },
    { title: "Wirtschaft und Verwaltung", desc: "Kaufmännische Prozesse, Controlling, Personal, Recht, Organisation und Management.", examples: "z. B. Industriekaufmann/-frau, Steuerberater:in, Office‑Manager:in" },
    { title: "Naturwissenschaften und Mathematik", desc: "Forschung, Analyse und Anwendung naturwissenschaftlicher und mathematischer Erkenntnisse.", examples: "z. B. Chemiker:in, Biolog:in, Statistiker:in" },
    { title: "Kunst, Kultur und Design", desc: "Gestaltung, künstlerischer Ausdruck, Kultur‑ und Kreativwirtschaft.", examples: "z. B. Grafikdesigner:in, Musiker:in, Modedesigner:in" },
    { title: "Erziehung und Bildung", desc: "Lernen begleiten, Wissen vermitteln, pädagogisch fördern – von Kita bis Erwachsenenbildung.", examples: "z. B. Erzieher:in, Lehrer:in, Bildungsberater:in" },
    { title: "Landwirtschaft, Forstwirtschaft und Gartenbau", desc: "Produktion von Lebensmitteln und Rohstoffen, Bewirtschaftung von Wald und Grünflächen.", examples: "z. B. Landwirt:in, Förster:in, Gärtner:in" },
    { title: "Transport, Logistik und Verkehr", desc: "Planung, Steuerung und Durchführung von Waren‑ und Personenverkehr, Supply‑Chain‑Management.", examples: "z. b. Spediteur:in, Lkw‑Fahrer:in, Fluglotse/Fluglotsin" },
    { title: "Handwerk", desc: "Herstellen, Warten und Reparieren – praxisorientierte Berufe mit hoher Fachkompetenz.", examples: "z. B. Schreiner:in, Elektriker:in, Goldschmied:in" },
    { title: "Tourismus, Gastronomie und Freizeit", desc: "Gäste betreuen, Reisen organisieren, kulinarische Angebote und Erlebnisse gestalten.", examples: "z. B. Koch/Köchin, Hotelmanager:in, Reiseleiter:in" },
    { title: "Recht und öffentliche Sicherheit", desc: "Gesetze anwenden, Recht sprechen, Sicherheit gewährleisten und verwalten.", examples: "z. B. Jurist:in, Polizist:in, Sicherheitsfachkraft" },
    { title: "Umwelt und Nachhaltigkeit", desc: "Ressourcenschutz, Kreislaufwirtschaft, Energie‑ und Klimaschutz, ökologische Innovation.", examples: "z. B. Umwelttechniker:in, Klimaforscher:in, Abfallwirtschaftsexpert:in" },
    { title: "Medien, Kommunikation und Werbung", desc: "Inhalte produzieren, Kampagnen entwickeln, Marken führen, Öffentlichkeitsarbeit.", examples: "z. B. Journalist:in, Werbetexter:in, Social‑Media‑Manager:in" },
    { title: "Soziale Arbeit und Sozialwesen", desc: "Beraten, begleiten und unterstützen – Teilhabe fördern und soziale Herausforderungen meistern.", examples: "z. B. Sozialarbeiter:in, Streetworker:in, Integrationsberater:in" },
  ];

  return (
    <article className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Berufsfelder – Liste und Übersicht</h1>
        <p className="mt-2 max-w-3xl text-zinc-600">
          Ein <strong>Berufsfeld</strong> bündelt Berufe mit ähnlichen Aufgaben, Anforderungen oder Arbeitsumfeldern und hilft bei der
          Orientierung in der Breite der Arbeitswelt. Diese Seite führt in das Konzept ein und bietet eine kompakte Übersicht über die
          15 in Deutschland gängigen Berufsfelder – inklusive kurzer Beschreibungen und Beispielen.
        </p>
      </header>

      <section className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Was sind Berufsfelder?</h2>
            <p className="text-zinc-700 leading-7">
              Berufsfelder gruppieren Berufe, die thematisch, fachlich oder methodisch zusammengehören. So lassen sich Berufsprofile
              besser vergleichen und Wege innerhalb eines Themengebiets erkennen – etwa vom Einstieg über Weiterbildung bis zu
              Spezialisierungen.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Warum gibt es sie?</h2>
            <p className="text-zinc-700 leading-7">
              Die Berufswelt verändert sich kontinuierlich. Berufsfelder schaffen Struktur, erleichtern die Recherche und unterstützen
              Schüler:innen, Studierende sowie Berufseinsteiger:innen dabei, Interessen mit passenden Tätigkeiten zu verbinden.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Wie ist ein Berufsfeld aufgebaut?</h2>
            <p className="text-zinc-700 leading-7">
              Ein Berufsfeld vereint unterschiedliche Berufe, die gemeinsame Merkmale teilen – z. B. ähnliche Aufgaben, Kompetenzen oder
              Branchenkontexte. Innerhalb eines Feldes gibt es häufig Spezialisierungen, die vertiefte Profile beschreiben.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 p-6 bg-zinc-50">
            <h3 className="text-lg font-semibold">Beispiel: Bau, Architektur und Vermessung</h3>
            <p className="mt-3 text-zinc-700 leading-7">
              Von der Planung über die Datenerhebung bis zur Umsetzung – Berufe wie Architekt:in, Bauingenieur:in, Dachdecker:in oder
              Vermessungstechniker:in arbeiten am Bauwesen, oft eng verzahnt zwischen Büro, Werkstatt und Baustelle.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Tipps zur Berufsorientierung</h2>
            <p className="text-zinc-700 leading-7">
              Nutze die Berufsfelder als Einstieg: Wähle ein Themengebiet, das dich interessiert, und vergleiche darin die Profile.
              So findest du leichter Berufe, die zu deinen Stärken und Zielen passen. Für konkrete Profile und Inhalte wechsle in unsere{" "}
              <Link className="underline" href="/details">
                Übersicht der Berufsbilder (A–Z)
              </Link>
              .
            </p>
          </div>
          
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-2">Häufige Fragen (FAQ)</h2>
            <div className="mt-6 space-y-4">
              <details className="group rounded-xl border border-zinc-200 bg-white p-5">
                <summary className="cursor-pointer select-none text-lg font-medium text-zinc-900">
                  1. Was versteht man unter einem Berufsfeld?
                </summary>
                <div className="mt-3 text-zinc-700 leading-7">
                  Ein Berufsfeld ist eine Gruppe von Berufen, die ähnliche Tätigkeiten, Anforderungen oder Arbeitsbereiche haben.
                  Beispiele sind Gesundheitswesen, IT, Technik, Pädagogik oder kaufmännische Berufe.
                </div>
              </details>
              <details className="group rounded-xl border border-zinc-200 bg-white p-5">
                <summary className="cursor-pointer select-none text-lg font-medium text-zinc-900">
                  2. Wie finde ich heraus, welches Berufsfeld zu mir passt?
                </summary>
                <div className="mt-3 text-zinc-700 leading-7">
                  Überlege, welche Tätigkeiten dir Spaß machen, welche Stärken du hast und in welchen Umgebungen du gerne arbeitest.
                  Berufsfeldtests, Berufsberatung sowie Praktika können zusätzlich helfen, passende Felder einzugrenzen.
                </div>
              </details>
              <details className="group rounded-xl border border-zinc-200 bg-white p-5">
                <summary className="cursor-pointer select-none text-lg font-medium text-zinc-900">
                  3. Muss ich mich schon früh für ein Berufsfeld entscheiden?
                </summary>
                <div className="mt-3 text-zinc-700 leading-7">
                  Nicht unbedingt. Viele Jugendliche wechseln während der Ausbildungs- oder Studienorientierung ihren Fokus.
                  Berufsfelder sind breit, und viele Fähigkeiten lassen sich in mehreren Bereichen einsetzen.
                </div>
              </details>
              <details className="group rounded-xl border border-zinc-200 bg-white p-5">
                <summary className="cursor-pointer select-none text-lg font-medium text-zinc-900">
                  4. Welche Berufsfelder bieten aktuell gute Zukunftsperspektiven?
                </summary>
                <div className="mt-3 text-zinc-700 leading-7">
                  Besonders gefragt sind Berufe in den Feldern IT &amp; Digitalisierung, Gesundheits- und Pflegeberufe,
                  Technik &amp; Ingenieurwesen, Erziehung &amp; Soziales sowie Umwelt- und Energietechnik.
                  Diese Bereiche verzeichnen starken Fachkräftebedarf.
                </div>
              </details>
              <details className="group rounded-xl border border-zinc-200 bg-white p-5">
                <summary className="cursor-pointer select-none text-lg font-medium text-zinc-900">
                  5. Ist es möglich, später das Berufsfeld zu wechseln?
                </summary>
                <div className="mt-3 text-zinc-700 leading-7">
                  Ja. Durch Weiterbildungen, Zusatzqualifikationen oder Umschulungen ist ein Wechsel oft machbar.
                  Viele Kompetenzen wie Kommunikation, Organisation oder Problemlösung sind berufsfeldübergreifend einsetzbar.
                </div>
              </details>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-2">Warum ist das für dich wichtig?</h2>
            <p className="text-zinc-700 leading-7">
              Für Schüler und Studenten ist die Kategorisierung in Berufsfelder besonders hilfreich, wenn man sich überlegt,
              welchen Beruf man später ausüben möchte. Wenn du ein Berufsfeld betrachtest, siehst du nicht nur einen
              einzelnen Beruf, sondern eine ganze Reihe von möglichen Tätigkeiten, die dich interessieren könnten.
            </p>
            <p className="mt-3 text-zinc-700 leading-7">
              Nehmen wir als weiteres Beispiel das Berufsfeld „Gesundheit und Pflege“. Hier findest du Berufe wie:
            </p>
            <ul className="mt-3 list-disc pl-6 text-zinc-700 space-y-1">
              <li>Arzt/Ärztin</li>
              <li>Pflegekraft</li>
              <li>Physiotherapeut/in</li>
              <li>Medizinischer Laborant/in</li>
            </ul>
            <p className="mt-3 text-zinc-700 leading-7">
              Obwohl diese Berufe sehr unterschiedlich sind – der Arzt arbeitet in der Regel in einer Klinik oder Arztpraxis,
              während die Pflegekraft direkt mit den Patienten arbeitet – haben sie doch gemeinsame Merkmale. Alle arbeiten sie
              im Gesundheitsbereich und kümmern sich um das Wohlergehen von Menschen.
            </p>
            <p className="mt-3 text-zinc-700 leading-7">
              Indem du ein ganzes Berufsfeld betrachtest, kannst du gezielt schauen, welche Berufe darin für dich besonders
              spannend sind. Vielleicht interessierst du dich für die Arbeit im medizinischen Bereich, aber dir ist der direkte
              Kontakt mit Patienten zu intensiv? Dann könnte ein Beruf wie ein medizinischer Laborant/in oder ein technischer
              Assistent/in für dich interessant sein.
            </p>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-zinc-200 p-6">
            <h3 className="text-lg font-semibold">Die 15 Berufsfelder</h3>
            <ul className="mt-4 space-y-4 text-zinc-800">
              {fields.map((f) => (
                <li key={f.title}>
                  <p className="font-medium text-blue-700">{f.title}</p>
                  <p className="text-sm text-zinc-700">{f.desc}</p>
                  {f.examples ? <p className="mt-1 text-sm text-zinc-500">{f.examples}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="mt-12 rounded-xl border border-zinc-200 p-6 bg-white">
        <h2 className="text-xl font-semibold mb-2">Weiterführende Inhalte</h2>
        <p className="text-zinc-700 leading-7">
          Vertiefe dein Wissen mit aktuellen Ratgeber‑Artikeln, Trends und Hintergrundwissen rund um Ausbildung, Studium und Karriere.
          Stöbere außerdem in unseren Berufsprofilen von A–Z, um konkrete Anforderungen, Aufgaben und Perspektiven zu entdecken.
        </p>
      </section>

    </article>
  );
}


