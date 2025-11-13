import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const profession = await prisma.profession.findUnique({
    where: { id: params.id },
  });
  if (!profession) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(profession);
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const data = await req.json();
  const title = data.title as string | undefined;
  const alphabeticalKey =
    data.alphabeticalKey ??
    (title ? (/[A-Z]/.test(title[0]?.toUpperCase()) ? title[0].toUpperCase() : "#") : undefined);
  const updated = await prisma.profession.update({
    where: { id: params.id },
    data: { ...data, alphabeticalKey },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  await prisma.profession.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}


