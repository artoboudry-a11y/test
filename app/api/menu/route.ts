import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekParam = searchParams.get("week");
  const weekStart = weekParam ? new Date(weekParam) : getMonday(new Date());

  const meals = await prisma.mealPlan.findMany({
    where: { userId: session.user.id, weekStart },
  });

  return NextResponse.json({ weekStart, meals });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { weekStart, day, mealType, meal } = await req.json();

  const record = await prisma.mealPlan.upsert({
    where: { weekStart_day_mealType_userId: { weekStart: new Date(weekStart), day, mealType, userId: session.user.id } },
    update: { meal },
    create: { weekStart: new Date(weekStart), day, mealType, meal, userId: session.user.id },
  });

  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.mealPlan.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
