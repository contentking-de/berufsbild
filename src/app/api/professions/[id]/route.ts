import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const profession = await prisma.profession.findUnique({
    where: { id },
  });
  if (!profession) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(profession);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const data = await req.json();
  const title = data.title as string | undefined;
  const alphabeticalKey =
    data.alphabeticalKey ??
    (title ? (/[A-Z]/.test(title[0]?.toUpperCase()) ? title[0].toUpperCase() : "#") : undefined);
  const updated = await prisma.profession.update({
    where: { id },
    data: { ...data, alphabeticalKey },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  await prisma.profession.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}


