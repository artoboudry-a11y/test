import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const now = new Date();
  const startDate = new Date(parseInt(year ?? String(now.getFullYear())), parseInt(month ?? String(now.getMonth())), 1);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);

  const entries = await prisma.budgetEntry.findMany({
    where: { date: { gte: startDate, lte: endDate } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { type, label, amount, category, date } = await req.json();

  const entry = await prisma.budgetEntry.create({
    data: {
      type,
      label,
      amount: parseFloat(amount),
      category,
      date: date ? new Date(date) : new Date(),
      userId: session.user.id,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.budgetEntry.deleteMany({ where: { id } });

  return NextResponse.json({ ok: true });
}
