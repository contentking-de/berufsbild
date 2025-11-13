import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const session = await auth();
  const [professionsCount, articlesCount] = await Promise.all([
    prisma.profession.count(),
    prisma.article.count(),
  ]);
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="rounded-lg border p-6">
        <p className="text-sm text-zinc-600">Angemeldet als</p>
        <p className="mt-1 font-medium">{session?.user?.email}</p>
      </div>
      <div className="rounded-lg border p-6">
        <p className="text-sm text-zinc-600">Berufe gesamt</p>
        <p className="mt-1 text-2xl font-semibold">{professionsCount}</p>
      </div>
      <div className="rounded-lg border p-6">
        <p className="text-sm text-zinc-600">Artikel gesamt</p>
        <p className="mt-1 text-2xl font-semibold">{articlesCount}</p>
      </div>
    </div>
  );
}


