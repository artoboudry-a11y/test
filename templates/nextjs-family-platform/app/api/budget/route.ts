import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const entries = await prisma.budgetEntry.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { label, amount, type, category } = await req.json();
  if (!label || amount == null) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const entry = await prisma.budgetEntry.create({
    data: { label, amount, type: type ?? "expense", category: category ?? "", userId: session.user!.id! },
  });
  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.budgetEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
