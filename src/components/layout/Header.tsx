import Link from "next/link";
import { Logo } from "./Logo";
import { Container } from "./Container";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-6 text-sm text-zinc-700">
            <Link href="/details" className="hover:text-zinc-900">
              Berufe A–Z
            </Link>
            <Link href="/magazin" className="hover:text-zinc-900">
              Magazin
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
}


