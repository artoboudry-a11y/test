import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const lists = await prisma.shoppingList.findMany({
    where: { userId: session.user.id },
    include: { items: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name } = await req.json();
  const list = await prisma.shoppingList.create({
    data: { name, userId: session.user.id },
    include: { items: true },
  });

  return NextResponse.json(list, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.shoppingList.deleteMany({ where: { id, userId: session.user.id } });

  return NextResponse.json({ ok: true });
}
