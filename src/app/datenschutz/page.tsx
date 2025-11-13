import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Informationen zum Datenschutz auf berufsbild.com.",
};

export default function DatenschutzPage() {
  return (
    <article className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Datenschutzerklärung</h1>
      </header>

      <section className="mt-8 space-y-8 text-zinc-800">
        <div>
          <h2 className="text-xl font-semibold mb-2">I. Allgemeines</h2>
          <p>(1) Nachfolgend informieren wir Sie über die Erhebung personenbezogener Daten bei der Nutzung unserer Internetseite.</p>
          <p>(2) „Personenbezogene Daten“ sind alle Daten, die auf Sie persönlich beziehbar sind (Art. 4 Nr. 1 DSGVO), z. B. Name, Adresse, E‑Mail-Adresse, Nutzerverhalten. Zu weiteren Begriffen (u. a. „Verarbeitung“, „Verantwortlicher“, „Auftragsverarbeiter“, „Einwilligung“) verweisen wir auf Art. 4 DSGVO.</p>
          <p>(3) Für Sachverhalte mit Bezug zur Schweiz gilt zusätzlich das Schweizer Bundesgesetz über den Datenschutz (DSG). Begriffe der DSGVO wie „personenbezogene Daten“, „Verarbeitung“, „Auftragsverarbeiter“, „besondere Kategorien von Daten“ und „Datenübertragbarkeit“ umfassen — soweit das DSG anwendbar ist — die entsprechenden Begriffe „Personendaten“, „Bearbeitung“, „Auftragsbearbeiter“, „besonders schützenswerte Personendaten“ und „Datenübertragung“ nach dem DSG.</p>
          <p>(4) Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung einer funktionsfähigen Website und unserer Inhalte/Leistungen erforderlich ist. Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1 lit. a)–f) DSGVO.</p>
          <p>(5) Ihre personenbezogenen Daten werden gelöscht oder gesperrt, sobald der Zweck der Speicherung entfällt oder gesetzliche Aufbewahrungsfristen ablaufen, es sei denn, eine weitere Speicherung ist für Vertragsschluss oder -erfüllung erforderlich.</p>
          <p>(6) Soweit wir Dienstleister einsetzen oder Daten zu Werbezwecken nutzen, informieren wir nachfolgend im Detail.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">II. Verantwortliche Stelle</h2>
          <p><strong>Nicolas Sacotte</strong></p>
          <p>Eisenbahnstrasse 1<br />88677 Markdorf</p>
          <p>Tel.: <a className="underline" href="tel:+4975445067064">+49 7544 5067064</a><br />E‑Mail: <a className="underline" href="mailto:nico@contentking.de">nico@contentking.de</a></p>
          <p>Weitere Einzelheiten zur verantwortlichen Stelle finden Sie im <a className="underline" href="/impressum">Impressum</a>.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">III. Ihre Rechte</h2>
          <p>Sie haben uns gegenüber hinsichtlich Ihrer personenbezogenen Daten insbesondere:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>das Recht auf Auskunft,</li>
            <li>das Recht auf Berichtigung und Löschung,</li>
            <li>das Recht auf Einschränkung der Verarbeitung,</li>
            <li>das Recht auf Widerspruch gegen die Verarbeitung,</li>
            <li>das Recht auf Datenübertragbarkeit.</li>
          </ul>
          <p>Zusätzlich haben Sie das Recht auf Beschwerde bei einer Datenschutz-Aufsichtsbehörde.</p>
          <p>Im Geltungsbereich des DSG haben Sie ferner das Recht auf Datenherausgabe und Datenvernichtung.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">IV. Verarbeitung personenbezogener Daten bei informatorischer Nutzung</h2>
          <p>(1) Bei rein informatorischer Nutzung erheben wir nur die Daten, die Ihr Browser an unseren Server übermittelt: IP‑Adresse, Datum und Uhrzeit der Anfrage, Zeitzonendifferenz zu GMT, aufgerufener Inhalt, HTTP‑Status, übertragene Datenmenge, Referer‑URL, Browser, Betriebssystem, Sprache/Version des Browsers.</p>
          <p>(2) Diese Daten werden auch in Logfiles gespeichert; eine Zusammenführung mit anderen Daten findet nicht statt.</p>
          <p>(3) Die vorübergehende Speicherung der IP‑Adresse ist notwendig, um die Auslieferung der Website zu ermöglichen.</p>
          <p>(4) Die Logfiles dienen der Funktionsfähigkeit, Optimierung sowie Sicherheit unserer Systeme.</p>
          <p>(5) Keine Auswertung zu Marketingzwecken. Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. f) DSGVO. Löschung mit Sitzungsende bzw. nach Wegfall des Zwecks. Die Erhebung ist für den Betrieb zwingend erforderlich.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">V. Cookies</h2>
          <p>(1) Wir verwenden Cookies (kleine Textdateien auf Ihrem Endgerät).</p>
          <p>(2) Typen:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Persistente Cookies</strong>: werden automatisiert nach einer je Cookie definierten Dauer gelöscht; manuelle Löschung im Browser möglich.</li>
          </ul>
          <p>(3) Zweck: nutzerfreundliche und effektivere Bereitstellung, z. T. Erforderlichkeit für Funktionen (z. B. Wiedererkennung zwischen Seitenaufrufen, Login‑Status). Analyse‑Cookies dienen der Qualitätsverbesserung.</p>
          <p>(4) Nicht technisch notwendige Cookies setzen wir nur mit Ihrer Einwilligung (Art. 6 Abs. 1 lit. a) DSGVO).</p>
          <p>(5) Sie können Cookies im Browser einschränken/ablehnen; ggf. eingeschränkte Funktionalität.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">VI. Weitere Funktionen und Angebote</h2>
          <p>Bei der Nutzung zusätzlicher Leistungen können weitere personenbezogene Daten erforderlich sein. Wir setzen zum Teil beauftragte, weisungsgebundene Dienstleister ein. Bei Drittlandübermittlungen informieren wir in den jeweiligen Abschnitten.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">VII. Kontaktaufnahme</h2>
          <p>(1) Bei Kontakt per E‑Mail verarbeiten wir die von Ihnen übermittelten Daten.</p>
          <p>(2) Sofern ein Kontaktformular bereitsteht, verarbeiten wir die dort eingegebenen Daten (z. B. Anrede, Vorname, Name, E‑Mail, Anschrift, Telefon, Thema).</p>
          <p>(3) Nutzung ausschließlich zur Beantwortung; zusätzlich speichern wir IP‑Adresse und Absendezeit.</p>
          <p>(4) Zweck: Bearbeitung Ihrer Anfrage.</p>
          <p>(5) Weitere Datenverarbeitungen (z. B. zur Missbrauchsabwehr) dienen der Sicherheit unserer Systeme.</p>
          <p>(6) Rechtsgrundlagen: Art. 6 Abs. 1 lit. a) DSGVO (Einwilligung), lit. f) DSGVO (berechtigtes Interesse); bei Vertragsanbahnung zusätzlich lit. b) DSGVO.</p>
          <p>(7) Löschung nach Abschluss der Anfrage unter Beachtung gesetzlicher Fristen; Widerspruch/Widerruf per E‑Mail jederzeit möglich.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">VIII. Newsletter</h2>
          <p>(1) Bei Newsletter‑Anmeldung verarbeiten wir die in der Eingabemaske angegebenen Daten (Pflicht: Vorname, Name, E‑Mail‑Adresse).</p>
          <p>(3) Double‑Opt‑In: Bestätigungs‑E‑Mail; ohne Bestätigung Löschung nach 30 Tagen. Speicherung von IP und Zeitpunkten.</p>
          <p>(5) Zweck: personalisierte Ansprache und Versand; Nachweis der Einwilligung und Missbrauchsabwehr.</p>
          <p>Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung), ggf. lit. f) DSGVO.</p>
          <p>(6) Löschung nach Abmeldung; statistische, anonyme Restdaten möglich.</p>
          <p>(7/8) Widerruf jederzeit über Abmeldelink oder Formular.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">IX. Blog</h2>
          <p>Wir betreiben einen Blog und veröffentlichen Beiträge. Gegebene Einwilligungen können jederzeit widerrufen werden.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">X. AddThis</h2>
          <p>Wir setzen den Dienst „AddThis“ ein. Der Dienst speichert und verarbeitet Nutzungsdaten (u. a. mittels Cookies) zur Analyse und Verbesserung unseres Angebots. Datenübermittlung in die USA; der Anbieter ist dem TADPF beigetreten. Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Oracle America, Inc., 500 Oracle Parkway, CA 94065 Redwood Shores, USA – <a className="underline" href="https://www.oracle.com/" target="_blank" rel="noopener noreferrer">https://www.oracle.com/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XI. Bugsnag</h2>
          <p>„Bugsnag“ (Bugsnag Inc., USA) dient der Fehlererkennung. Bei Fehlern werden technische Daten (z. B. Browserdaten, aufgerufene Seite, anonymisierte IP) in die USA übertragen. Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. f) DSGVO (berechtigtes Interesse an Fehleranalyse). Sie können Cookies deaktivieren bzw. JavaScript blockieren.</p>
          <p>Weitere Informationen: <a className="underline" href="https://docs.bugsnag.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">https://docs.bugsnag.com/legal/privacy-policy/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XII. Cookie Consent (Silktide)</h2>
          <p>Wir setzen einen Consent‑Dienst ein, der mittels Cookies Nutzungsverhalten verarbeitet, um Einwilligungen zu verwalten und die Nutzerfreundlichkeit zu verbessern. Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Silktide Ltd., Brunel Parkway, Pride Park, DE24 8HR Derby, Vereinigtes Königreich – <a className="underline" href="https://silktide.com/" target="_blank" rel="noopener noreferrer">https://silktide.com/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XIII. DoubleClick</h2>
          <p>DoubleClick nutzt Cookies zur Aussteuerung/Optimierung von Anzeigen und Conversion‑Messung. Mögliche Zuordnung zu Nutzerkonten; Datenübermittlung in die USA (TADPF). Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Google Ireland Limited, Gordon House, Barrow St, Dublin 4, Irland – <a className="underline" href="https://www.google.de/" target="_blank" rel="noopener noreferrer">https://www.google.de/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XIV. Facebook Connect</h2>
          <p>Erleichtert Registrierung/Anmeldung über Facebook. Datenverarbeitung durch Meta; mögliche Zuordnung zu Nutzerkonten; Datenübermittlung in die USA (TADPF). Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Meta Platforms Ireland Limited, 4 Grand Canal Square, Grand Canal Harbour, Dublin 2, Irland – <a className="underline" href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">https://www.facebook.com/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XV. Facebook Pixel</h2>
          <p>Reichweiten‑/Conversion‑Messung und zielgerichtete Werbung auf Facebook. Cookies und mögliche Zuordnung zu Nutzerkonten; Datenübermittlung in die USA (TADPF). Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Meta Platforms Ireland Limited – <a className="underline" href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">https://www.facebook.com/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XVI. Facebook Social Plugins</h2>
        <p>Nutzung von Social‑Plugins; Cookies und Nutzungsanalyse; Datenübermittlung in die USA (TADPF). Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Meta Platforms Ireland Limited – <a className="underline" href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">https://www.facebook.com/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XVII. Google Analytics</h2>
          <p>Analyse der Websitenutzung; Einsatz von Cookies; Verarbeitung innerhalb der EU, pseudonymisierte Übermittlung in die USA (TADPF). Browser‑Add‑on: <a className="underline" href="https://tools.google.com/dlpage/gaoptout?hl=de" target="_blank" rel="noopener noreferrer">https://tools.google.com/dlpage/gaoptout?hl=de</a>. Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Google Ireland Limited – <a className="underline" href="https://www.google.de/" target="_blank" rel="noopener noreferrer">https://www.google.de/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XVIII. Google Fonts</h2>
          <p>Externe Schriften; Abruf vom Server des Anbieters; IP‑Adresse wird verarbeitet; Datenübermittlung in die USA (TADPF). Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. f) DSGVO.</p>
          <p><strong>Anbieter:</strong> Google Ireland Limited – <a className="underline" href="https://fonts.google.com" target="_blank" rel="noopener noreferrer">https://fonts.google.com</a> / <a className="underline" href="https://www.google.de/" target="_blank" rel="noopener noreferrer">https://www.google.de/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XIX. Google reCAPTCHA</h2>
          <p>Schutz vor Missbrauch (Bots/Spam). Mögliche Datenübermittlung in die USA (TADPF). Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung). Datenschutzhinweise: <a className="underline" href="https://policies.google.com/privacy?hl=de&gl=de" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy?hl=de&amp;gl=de</a></p>
          <p><strong>Anbieter:</strong> Google Ireland Limited – <a className="underline" href="https://www.google.de/" target="_blank" rel="noopener noreferrer">https://www.google.de/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XX. Google Tag Manager</h2>
          <p>Verwaltung von Tags; selbst keine personenbezogenen Daten; ausgelöste Tags können Daten verarbeiten. Rechtsgrundlage: abhängig vom jeweils eingesetzten Tag (regelmäßig Einwilligung oder berechtigtes Interesse). Datenschutz: <a className="underline" href="https://policies.google.com/privacy?hl=de&gl=de" target="_blank" rel="noopener noreferrer">Google‑Privacy</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XXI. Gravatar</h2>
          <p>Avatar‑Dienst (Automattic). Nutzungsdaten via Cookies; Datenübermittlung in die USA (TADPF). Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Aut O’Mattic A8C Ireland Ltd. – <a className="underline" href="https://automattic.com/privacy/" target="_blank" rel="noopener noreferrer">https://automattic.com/privacy/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XXII. LinkedIn Widgets</h2>
          <p>Nutzungsanalyse über Widgets; Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> LinkedIn Ireland Unlimited Company – <a className="underline" href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">https://www.linkedin.com/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XXIII. Pinterest</h2>
          <p>Nutzungsanalyse/Optimierung; Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Pinterest Europe Ltd. – <a className="underline" href="https://pinterest.com/" target="_blank" rel="noopener noreferrer">https://pinterest.com/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XXIV. Twitter Button</h2>
          <p>Nutzungsanalyse/Optimierung; Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung).</p>
          <p><strong>Anbieter:</strong> Twitter International Company – <a className="underline" href="https://twitter.com/" target="_blank" rel="noopener noreferrer">https://twitter.com/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XXV. Yoast</h2>
          <p>„Yoast“ wird genutzt; es werden bei Nutzung keine personenbezogenen Daten verarbeitet.</p>
          <p><strong>Anbieter:</strong> Yoast BV, Don Emanuelstraat 3, 6602 GX Wijchen, Niederlande – <a className="underline" href="https://yoast.com/" target="_blank" rel="noopener noreferrer">https://yoast.com/</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">XXVI. YouTube</h2>
          <p>Einbindung von YouTube‑Inhalten; beim Abruf erfolgt Datenübertragung an Google; Nutzungsprofile möglich; Datenübermittlung in die USA (TADPF). Rechtsgrundlage: Art. 6 Abs. 1 S. 1 lit. a) DSGVO (Einwilligung). Datenschutz: <a className="underline" href="https://policies.google.com/privacy?hl=de&gl=de" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy?hl=de&amp;gl=de</a></p>
          <p><strong>Anbieter:</strong> Google Ireland Limited – <a className="underline" href="https://www.google.de/" target="_blank" rel="noopener noreferrer">https://www.google.de/</a></p>
        </div>
      </section>
    </article>
  );
}


