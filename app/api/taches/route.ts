import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const chores = await prisma.chore.findMany({
    include: {
      assignments: {
        orderBy: { dueDate: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(chores);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, description, frequency } = await req.json();

  const chore = await prisma.chore.create({
    data: { title, description, frequency: frequency || "weekly" },
  });

  // Créer une première assignation pour l'utilisateur courant
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (frequency === "daily" ? 1 : frequency === "monthly" ? 30 : 7));

  await prisma.choreAssignment.create({
    data: { choreId: chore.id, userId: session.user.id, dueDate },
  });

  const result = await prisma.chore.findUnique({
    where: { id: chore.id },
    include: { assignments: { include: { user: { select: { name: true } } } } },
  });

  return NextResponse.json(result, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { assignmentId, completed } = await req.json();

  const assignment = await prisma.choreAssignment.update({
    where: { id: assignmentId },
    data: { completedAt: completed ? new Date() : null },
  });

  return NextResponse.json(assignment);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.chore.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
