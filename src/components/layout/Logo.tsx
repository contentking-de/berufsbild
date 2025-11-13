import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" aria-label="berufsbild.com" className="inline-flex items-center">
      <Image
        src="/logo.png"
        alt="berufsbild.com"
        width={160}
        height={40}
        priority
        className="h-8 w-auto"
      />
    </Link>
  );
}


