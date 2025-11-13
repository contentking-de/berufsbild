import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? "24"), 100);
  const skip = (page - 1) * pageSize;
  const tag = searchParams.get("tag");

  const where = {
    status: "PUBLISHED" as const,
    ...(tag ? { tags: { has: tag } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    prisma.article.count({ where }),
  ]);
  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const data = await req.json();
  const created = await prisma.article.create({ data });
  return NextResponse.json(created, { status: 201 });
}


