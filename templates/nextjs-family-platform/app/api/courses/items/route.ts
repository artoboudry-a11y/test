import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { listId, name, quantity, category } = await req.json();
  if (!listId || !name) return NextResponse.json({ error: "listId et name requis" }, { status: 400 });

  const item = await prisma.shoppingItem.create({
    data: { listId, name, quantity: quantity ?? "", category: category ?? "" },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, checked } = await req.json();
  const item = await prisma.shoppingItem.update({ where: { id }, data: { checked } });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.shoppingItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
