import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const recipes = await prisma.recipe.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, description, ingredients, steps, prepTime, cookTime, servings } = await req.json();
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const recipe = await prisma.recipe.create({
    data: {
      title,
      description: description ?? "",
      ingredients: ingredients ?? "[]",
      steps: steps ?? "[]",
      prepTime: prepTime ?? null,
      cookTime: cookTime ?? null,
      servings: servings ?? null,
      userId: session.user!.id!,
    },
  });
  return NextResponse.json(recipe, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
