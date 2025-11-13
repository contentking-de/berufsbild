import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createArticle(formData: FormData) {
  "use server";
  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const content = (formData.get("content") as string)?.trim();
  if (!title || !slug) return;
  await prisma.article.create({
    data: { title, slug, content: content || null, status: "DRAFT" },
  });
  revalidatePath("/admin/artikel");
}

async function updateArticle(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string)?.trim();
  const excerpt = (formData.get("excerpt") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const rawStatus = formData.get("status");
  const status =
    rawStatus === "DRAFT" || rawStatus === "PUBLISHED"
      ? (rawStatus as "DRAFT" | "PUBLISHED")
      : undefined;
  if (!id) return;
  const data: {
    title?: string;
    excerpt?: string | null;
    content?: string | null;
    status?: "DRAFT" | "PUBLISHED";
  } = {};
  if (title !== undefined) data.title = title;
  if (excerpt !== undefined) data.excerpt = excerpt ?? null;
  if (content !== undefined) data.content = content ?? null;
  if (status !== undefined) data.status = status;
  if (Object.keys(data).length === 0) return; // nichts zu aktualisieren
  await prisma.article.update({ where: { id }, data });
  revalidatePath("/admin/artikel");
}

async function deleteArticle(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin/artikel");
}

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
  });
  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-medium">Artikel hinzufügen</h2>
        <form action={createArticle} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            name="title"
            placeholder="Titel"
            className="rounded-lg border border-zinc-300 px-3 py-2"
            required
          />
          <input
            name="slug"
            placeholder="slug (z. B. news-aus-der-branche)"
            className="rounded-lg border border-zinc-300 px-3 py-2"
            required
          />
          <button className="rounded-lg bg-zinc-900 px-4 py-2 text-white">Anlegen</button>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-sm text-zinc-700">Inhalt (HTML möglich)</label>
            <textarea
              name="content"
              placeholder="Inhalt des Artikels …"
              rows={8}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
            />
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">Letzte Änderungen</h2>
        <div className="mt-4 overflow-hidden rounded-lg border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-zinc-600">
                <th className="px-4 py-2">Titel</th>
                <th className="px-4 py-2">Teaser</th>
                <th className="px-4 py-2">Inhalt</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-2">
                    <form action={updateArticle} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <input
                        name="title"
                        defaultValue={a.title}
                        className="w-full rounded border border-zinc-300 px-2 py-1"
                      />
                      <button className="rounded border px-2 py-1 text-xs">Speichern</button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateArticle} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <input
                        name="excerpt"
                        defaultValue={a.excerpt ?? ""}
                        className="w-full rounded border border-zinc-300 px-2 py-1"
                      />
                      <button className="rounded border px-2 py-1 text-xs">Speichern</button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateArticle} className="flex flex-col gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <textarea
                        name="content"
                        defaultValue={a.content ?? ""}
                        rows={5}
                        className="w-full rounded border border-zinc-300 px-2 py-1 font-mono text-xs"
                      />
                      <div>
                        <button className="rounded border px-2 py-1 text-xs">Speichern</button>
                      </div>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <form action={updateArticle} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <select
                        name="status"
                        defaultValue={a.status}
                        className="rounded border border-zinc-300 px-2 py-1"
                      >
                        <option value="DRAFT">Entwurf</option>
                        <option value="PUBLISHED">Veröffentlicht</option>
                      </select>
                      <button className="rounded border px-2 py-1 text-xs">Speichern</button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <form action={deleteArticle}>
                        <input type="hidden" name="id" value={a.id} />
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


