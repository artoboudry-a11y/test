import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { listId, name, quantity, category } = await req.json();

  const list = await prisma.shoppingList.findFirst({ where: { id: listId, userId: session.user.id } });
  if (!list) return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });

  const item = await prisma.shoppingItem.create({
    data: { listId, name, quantity, category: category || "Autre" },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, checked, name, quantity } = await req.json();

  const item = await prisma.shoppingItem.update({
    where: { id },
    data: { ...(checked !== undefined && { checked }), ...(name && { name }), ...(quantity !== undefined && { quantity }) },
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.shoppingItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
