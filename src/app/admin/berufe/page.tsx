import { prisma } from "@/lib/prisma";
import ImportForm from "./ImportForm";
import ProfessionsTable from "./ProfessionsTable";
import BatchGenerateButton from "./BatchGenerateButton";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createProfession(formData: FormData) {
  "use server";
  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  if (!title || !slug) return;
  const key = title[0]?.toUpperCase();
  const alphabeticalKey = /[A-Z]/.test(key) ? key : "#";
  await prisma.profession.create({
    data: { title, slug, alphabeticalKey, status: "DRAFT" },
  });
  revalidatePath("/admin/berufe");
}

async function updateProfession(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const subtitle = (formData.get("subtitle") as string)?.trim();
  const status = formData.get("status") as "DRAFT" | "PUBLISHED";
  if (!id) return;
  const key = title?.[0]?.toUpperCase();
  const alphabeticalKey = title ? (/[A-Z]/.test(key) ? key : "#") : undefined;
  await prisma.profession.update({
    where: { id },
    data: { title, subtitle, status, alphabeticalKey },
  });
  revalidatePath("/admin/berufe");
}

async function deleteProfession(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.profession.delete({ where: { id } });
  revalidatePath("/admin/berufe");
}

type Props = {
  searchParams: Promise<{ page?: string; q?: string }>;
};

export default async function AdminProfessionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const [professions, total] = await Promise.all([
    prisma.profession.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        subtitle: true,
        status: true,
        berufsbild: true,
      },
      skip,
      take: pageSize,
    }),
    prisma.profession.count(),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-medium">Excel-Import (Berufe)</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Lade die Datei <span className="font-mono">.xlsx</span> hoch. Standardmäßig wird das erste Sheet importiert.
        </p>
        <div className="mt-4">
          <ImportForm />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-medium">Beruf hinzufügen</h2>
        <form action={createProfession} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            name="title"
            placeholder="Titel"
            className="rounded-lg border border-zinc-300 px-3 py-2"
            required
          />
          <input
            name="slug"
            placeholder="slug (z. B. medizinische-fachangestellte)"
            className="rounded-lg border border-zinc-300 px-3 py-2"
            required
          />
          <button className="rounded-lg bg-zinc-900 px-4 py-2 text-white">Anlegen</button>
        </form>
      </section>

      <section>
        <BatchGenerateButton />
      </section>

      <section>
        <h2 className="text-lg font-medium">Letzte Änderungen</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Zeige {skip + 1}–{Math.min(skip + pageSize, total)} von {total} Berufen
        </p>
        <div className="mt-4">
          <ProfessionsTable
            professions={professions}
            updateProfession={updateProfession}
            deleteProfession={deleteProfession}
            currentPage={page}
            totalPages={totalPages}
            total={total}
          />
        </div>
      </section>
    </div>
  );
}


