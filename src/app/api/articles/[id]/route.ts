import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: { author: true },
  });
  if (!article) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const data = await req.json();
  const updated = await prisma.article.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  await prisma.article.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}


