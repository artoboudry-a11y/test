import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const notes = await prisma.note.findMany({
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, content, color } = await req.json();
  const note = await prisma.note.create({
    data: { title, content, color: color || "yellow", userId: session.user.id },
  });

  return NextResponse.json(note, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, title, content, color, pinned } = await req.json();
  const note = await prisma.note.updateMany({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(color !== undefined && { color }),
      ...(pinned !== undefined && { pinned }),
    },
  });

  return NextResponse.json(note);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.note.deleteMany({ where: { id } });

  return NextResponse.json({ ok: true });
}
