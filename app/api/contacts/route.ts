import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const contacts = await prisma.emergencyContact.findMany({
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, phone, relation, notes } = await req.json();
  const contact = await prisma.emergencyContact.create({
    data: { name, phone, relation, notes, userId: session.user.id },
  });

  return NextResponse.json(contact, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, name, phone, relation, notes } = await req.json();
  await prisma.emergencyContact.updateMany({
    where: { id },
    data: { name, phone, relation, notes },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.emergencyContact.deleteMany({ where: { id } });

  return NextResponse.json({ ok: true });
}
