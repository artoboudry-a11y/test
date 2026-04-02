import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const chores = await prisma.chore.findMany({
    include: { assignments: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(chores);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, description, frequency } = await req.json();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const chore = await prisma.chore.create({
    data: { title, description: description ?? "", frequency: frequency ?? "weekly", userId: session.user!.id! },
    include: { assignments: true },
  });
  return NextResponse.json(chore, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.chore.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
