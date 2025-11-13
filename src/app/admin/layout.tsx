import { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  // Only allow signed-in users; role check could be more strict per page if desired
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/admin/berufe" className="hover:underline">
            Berufe
          </Link>
          <Link href="/admin/artikel" className="hover:underline">
            Artikel
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}


