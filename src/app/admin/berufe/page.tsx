import { prisma } from "@/lib/prisma";
import ImportForm from "./ImportForm";
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

export default async function AdminProfessionsPage() {
  const professions = await prisma.profession.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
  });
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
        <h2 className="text-lg font-medium">Letzte Änderungen</h2>
        <div className="mt-4 overflow-hidden rounded-lg border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-zinc-600">
                <th className="px-4 py-2">Titel</th>
                <th className="px-4 py-2">Untertitel</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {professions.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">
                    <form action={updateProfession} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="title"
                        defaultValue={p.title}
                        className="w-full rounded border border-zinc-300 px-2 py-1"
                      />
                  </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateProfession}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="subtitle"
                        defaultValue={p.subtitle ?? ""}
                        className="w-full rounded border border-zinc-300 px-2 py-1"
                      />
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateProfession}>
                      <input type="hidden" name="id" value={p.id} />
                      <select
                        name="status"
                        defaultValue={p.status}
                        className="rounded border border-zinc-300 px-2 py-1"
                      >
                        <option value="DRAFT">Entwurf</option>
                        <option value="PUBLISHED">Veröffentlicht</option>
                      </select>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <form action={updateProfession}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded border px-3 py-1">Speichern</button>
                      </form>
                      <form action={deleteProfession}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="rounded border px-3 py-1 text-red-600">Löschen</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


