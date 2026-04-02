import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const notes = await prisma.note.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, content, color } = await req.json();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const note = await prisma.note.create({
    data: { title, content: content ?? "", color: color ?? "#fef9c3", userId: session.user!.id! },
  });
  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
