import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const letter = (searchParams.get("letter") ?? "").toUpperCase();
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "50"), 200);
  const skip = (page - 1) * pageSize;

  const where =
    q.length > 1
      ? {
          status: "PUBLISHED" as const,
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { subtitle: { contains: q, mode: "insensitive" as const } },
            { content: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : letter
      ? { status: "PUBLISHED" as const, alphabeticalKey: letter }
      : { status: "PUBLISHED" as const };

  const [items, total] = await Promise.all([
    prisma.profession.findMany({
      where,
      select: { id: true, slug: true, title: true, subtitle: true },
      orderBy: [{ alphabeticalKey: "asc" }, { title: "asc" }],
      skip,
      take: pageSize,
    }),
    prisma.profession.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const data = await req.json();
  // compute alphabeticalKey if missing
  const key = (data.title?.[0] ?? "#").toUpperCase();
  const alphabeticalKey = /[A-Z]/.test(key) ? key : "#";
  const created = await prisma.profession.create({
    data: {
      ...data,
      alphabeticalKey,
    },
  });
  return NextResponse.json(created, { status: 201 });
}


