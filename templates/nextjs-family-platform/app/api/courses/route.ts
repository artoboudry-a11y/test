import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const lists = await prisma.shoppingList.findMany({
    include: { items: { orderBy: { id: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(lists);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const list = await prisma.shoppingList.create({
    data: { name, userId: session.user!.id! },
    include: { items: true },
  });
  return NextResponse.json(list, { status: 201 });
}
