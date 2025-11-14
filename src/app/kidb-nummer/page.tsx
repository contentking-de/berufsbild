import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KIDB-Nummer – Klassifikation der Berufe 2010 (KldB)",
  description:
    "Überblick zur KIDB/KldB 2010: Zweck, Aufbau der fünfstelligen Berufskennziffer, Anforderungsniveaus, Beispielcodes, Anwendungsbereiche und Vorteile.",
};

export default function KidbPage() {
  return (
    <article className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">KIDB 2010 – Die Klassifikation der Berufe 2010</h1>
        <p className="mt-2 text-zinc-600">Ein umfassender Überblick über Systematik, Aufbau, Zweck und Anwendung</p>
      </header>

      <section className="content-body mt-8">
        <p>
          Die KIDB 2010 – korrekt: <strong>KldB 2010 (Klassifikation der Berufe 2010)</strong> – ist das zentrale
          berufliche Klassifikationssystem in Deutschland. Sie wird vor allem von der Bundesagentur für Arbeit, der
          amtlichen Statistik, Bildungsinstitutionen und wissenschaftlichen Einrichtungen verwendet.
        </p>
        <p>Sie dient dazu, die große Vielfalt der Berufe einheitlich, eindeutig und vergleichbar zu ordnen.</p>

        <h2>Ziel und Bedeutung der KIDB/KldB 2010</h2>
        <p>Die KIDB 2010 wurde eingeführt, um:</p>
        <ul>
          <li>Berufe systematisch und nachvollziehbar zu ordnen</li>
          <li>die Vergleichbarkeit von Arbeitsmarkt- und Berufsstatistiken sicherzustellen</li>
          <li>präzise und modernisierte Berufsbilder abzubilden</li>
          <li>
            eine gemeinsame Grundlage für Beschäftigungsstatistiken, Tätigkeits- und Berufsmeldungen, Ausbildungs- und
            Weiterbildungszuordnungen sowie Qualifikationsanalysen zu schaffen
          </li>
        </ul>
        <p>
          Die KIDB 2010 ersetzt ältere Systeme (z. B. die KldB 1988) und ist in Teilen an internationale
          Klassifikationen wie <strong>ISCO‑08</strong> angelehnt.
        </p>

        <h2>Aufbau der KIDB 2010 – die fünfstellige Berufskennziffer</h2>
        <p>Jeder Beruf wird durch einen fünfstelligen Zahlencode eindeutig beschrieben. Dieser Code ist hierarchisch:</p>
        <h3>1. Ziffer – Berufsbereich (10 Bereiche)</h3>
        <p>Große, übergeordnete Felder des Arbeitsmarkts, z. B.:</p>
        <ul>
          <li>1 – Landwirtschaft, Natur, Umwelt</li>
          <li>2 – Produktion, Fertigung</li>
          <li>3 – Bau, Architektur, Vermessung</li>
          <li>4 – Rohstoffgewinnung, Produktionstechnik, Maschinenbau</li>
          <li>… bis</li>
          <li>9 – Gesundheit, Soziales, Lehre &amp; Erziehung</li>
        </ul>
        <h3>2. Ziffer – Berufshauptgruppe</h3>
        <p>Feingliederung innerhalb des Berufsfeldes (z. B. Gesundheitsberufe, technische Fertigungsberufe)</p>
        <h3>3. Ziffer – Berufsgruppe</h3>
        <p>Noch konkretere Unterscheidung innerhalb der Hauptgruppe (z. B. Metallbauberufe, Pflegeberufe)</p>
        <h3>4. Ziffer – Berufsuntergruppe</h3>
        <p>Weitere Spezifizierung (z. B. Maschinenbau, Feinwerkmechanik)</p>
        <h3>5. Ziffer – Berufsgattung</h3>
        <p>Konkreter Beruf bzw. Tätigkeit (z. B. Zerspanungsmechaniker/in, Gesundheits- und Krankenpfleger/in)</p>

        <h2>Das Anforderungsniveau (Kompetenzlevel)</h2>
        <p>Innerhalb der Berufsgattung wird außerdem festgehalten, wie anspruchsvoll eine Tätigkeit ist:</p>
        <ul>
          <li>1 – Helfer/Anlerntätigkeiten</li>
          <li>2 – Fachkraftniveau (abgeschlossene Berufsausbildung)</li>
          <li>3 – Spezialistenniveau (Meister, Techniker, Spezialkenntnisse)</li>
          <li>4 – Expertenniveau (Hochschulabschluss, komplexe Tätigkeiten)</li>
        </ul>
        <p>Dieses Niveau ist entscheidend für Lohndaten, Qualifikationsstatistiken oder Arbeitsmarktanalysen.</p>

        <h2>Beispiel für eine vollständige KIDB/KldB‑Nummer</h2>
        <p>Beispiel: <strong>82102</strong></p>
        <ul>
          <li>8 – Gesundheits‑, Sozial‑ und Bildungsberufe</li>
          <li>82 – Gesundheitsberufe</li>
          <li>821 – Pflegeberufe</li>
          <li>8210 – Gesundheits‑ und Krankenpflege</li>
          <li>82102 – Gesundheits‑ und Krankenpfleger/in (Fachkraftniveau)</li>
        </ul>
        <p>Damit ist die Tätigkeit eindeutig eingeordnet.</p>

        <h2>Was bedeutet KIDB/KldB „210“?</h2>
        <p>Die Zahl 210 ist ein Ausschnitt aus der Klassifikation und steht für:</p>
        <ul>
          <li>Berufsbereich 2 – Produktion, Fertigung</li>
          <li>Hauptgruppe 21 – Herstellung von Waren, Werkstoffen, Grundstoffen</li>
          <li>Systematikposition 210 – übergeordnete Gruppe vor weiterer Feingliederung</li>
        </ul>
        <p>Darunter liegen u. a. folgende Berufsuntergruppen:</p>
        <ul>
          <li>Chemieberufe</li>
          <li>Kunststoffverarbeitung</li>
          <li>Lebens‑ &amp; Genussmittelherstellung</li>
          <li>Glas‑, Keramik‑ &amp; Baustoffproduktion</li>
          <li>Textil‑ und Bekleidungsherstellung</li>
          <li>Druck‑ und Produktionsberufe</li>
        </ul>

        <h2>Anwendungsbereiche der KIDB 2010</h2>
        <ul>
          <li>
            <strong>Arbeitgebermeldungen (Sozialversicherung):</strong> Tätigkeitsschlüssel enthält Teile der
            KIDB‑Struktur.
          </li>
          <li>
            <strong>Arbeitsmarktstatistik / Jobcenter / BA:</strong> Alle Berufe werden statistisch erfasst und
            verglichen.
          </li>
          <li>
            <strong>Berufsberatung &amp; Bildungsplanung:</strong> Umschulungen, Perspektiven, Anforderungen vergleichen.
          </li>
          <li>
            <strong>Forschung &amp; Gesellschaft:</strong> z. B. Studien zu Fachkräftemangel, Branchenentwicklungen.
          </li>
        </ul>

        <h2>Vorteile des Systems</h2>
        <ul>
          <li>Sehr präzise Unterscheidung von Tätigkeiten</li>
          <li>Moderne Abbildung heutiger Berufsbilder</li>
          <li>Hohe transparente Nachvollziehbarkeit</li>
          <li>Gute internationale Vergleichbarkeit</li>
          <li>Lückenlose Erfassung statistischer Daten</li>
        </ul>

        <h2>KIDB 2010 und Berufsbezeichnungen</h2>
        <p>Die Klassifikation ordnet u. a. klassische Ausbildungsberufe, spezialisierte Tätigkeiten und akademische Berufe.</p>
        <table>
          <thead>
            <tr>
              <th>Berufsbezeichnung</th>
              <th>KIDB/KldB 2010‑Code</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Industriemechaniker/in</td>
              <td>24112</td>
            </tr>
            <tr>
              <td>Chemielaborant/in</td>
              <td>22102</td>
            </tr>
            <tr>
              <td>Bäcker/in</td>
              <td>21222</td>
            </tr>
            <tr>
              <td>Elektroniker/in Betriebstechnik</td>
              <td>27213</td>
            </tr>
            <tr>
              <td>Erzieher/in</td>
              <td>83142</td>
            </tr>
            <tr>
              <td>Arzt/Ärztin</td>
              <td>84204</td>
            </tr>
          </tbody>
        </table>

        <h2>Überarbeitete Fassung 2020</h2>
        <p>
          Zur KIDB 2010 gibt es eine aktualisierte Version (2020). Die Grundstruktur blieb gleich, aber einzelne
          Zuordnungen wurden modernisiert (z. B. in den Bereichen Pflege, Digitalisierung, technologische Berufe).
        </p>
      </section>
    </article>
  );
}


