import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: true },
  });
  if (!article) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const data = await req.json();
  if (data.status === "PUBLISHED" && !data.publishedAt) {
    const existing = await prisma.article.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!existing?.publishedAt) {
      data.publishedAt = new Date();
    }
  } else if (data.status === "DRAFT") {
    data.publishedAt = null;
  }
  const updated = await prisma.article.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  await prisma.article.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}


