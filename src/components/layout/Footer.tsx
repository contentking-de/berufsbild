import { Container } from "./Container";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <Container>
        <div className="flex flex-col items-center justify-between gap-4 py-8 text-sm text-zinc-600 md:flex-row">
          <p>© {new Date().getFullYear()} berufsbild.com – Hilfe bei der Berufsorientierung</p>
          <div className="flex items-center gap-6">
            <Link href="/impressum" className="hover:text-zinc-900">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-zinc-900">
              Datenschutz
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}


