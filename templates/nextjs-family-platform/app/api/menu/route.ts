import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const plans = await prisma.mealPlan.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { date, mealType, content } = await req.json();
  if (!date || !mealType) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  // Upsert: replace existing plan for same date+mealType
  const existing = await prisma.mealPlan.findFirst({
    where: { date: new Date(date), mealType, userId: session.user!.id! },
  });

  let plan;
  if (existing) {
    plan = await prisma.mealPlan.update({
      where: { id: existing.id },
      data: { content },
    });
  } else {
    plan = await prisma.mealPlan.create({
      data: { date: new Date(date), mealType, content, userId: session.user!.id! },
    });
  }
  return NextResponse.json(plan);
}
