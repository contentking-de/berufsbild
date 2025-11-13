import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Rechtliche Angaben und Kontaktinformationen zu berufsbild.com.",
};

export default function ImpressumPage() {
  return (
    <article className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <header className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Impressum</h1>
      </header>

      <section className="mt-8 space-y-6 text-zinc-800">
        <div>
          <h2 className="text-xl font-semibold mb-2">Anbieter</h2>
          <p><strong>berufsbild.com – Nico Sacotte</strong></p>
          <p>Eisenbahnstrasse 1</p>
          <p>88677 Markdorf</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
          <p>Tel.: <a className="underline" href="tel:+4975445067065">+49 7544 5067065</a></p>
          <p>E‑Mail: <a className="underline" href="mailto:nico@berufsbild.com">nico@berufsbild.com</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Redaktion</h2>
          <p>Maya Sacotte</p>
          <p>E‑Mail: <a className="underline" href="mailto:maya.sacotte@berufsbild.com">maya.sacotte@berufsbild.com</a></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Umsatzsteuer-ID</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: <strong>DE227809660</strong></p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Inhaltlich verantwortlich</h2>
          <p>i.S.v. § 18 Abs. 2 MStV: <strong>Nicolas Sacotte</strong>, Eisenbahnstrasse 1, 88677 Markdorf</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Online-Streitbeilegung (OS-Plattform)</h2>
          <p>
            Die EU-Kommission hat eine Internetplattform zur Online-Beilegung von Streitigkeiten (OS-Plattform)
            zwischen Unternehmern und Verbrauchern eingerichtet. Die OS-Plattform ist erreichbar unter{" "}
            <a className="underline" href="https://ec.europa.eu/consumers/odr" rel="noopener noreferrer" target="_blank">
              https://ec.europa.eu/consumers/odr
            </a>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Hinweis nach VSBG</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an einem Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>
      </section>
    </article>
  );
}


