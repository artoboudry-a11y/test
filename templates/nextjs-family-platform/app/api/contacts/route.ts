import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const contacts = await prisma.emergencyContact.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, phone, relation, note } = await req.json();
  if (!name || !phone) return NextResponse.json({ error: "Nom et téléphone requis" }, { status: 400 });

  const contact = await prisma.emergencyContact.create({
    data: { name, phone, relation: relation ?? "", note: note ?? "", userId: session.user!.id! },
  });
  return NextResponse.json(contact, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.emergencyContact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
