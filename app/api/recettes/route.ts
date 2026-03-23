import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const recipes = await prisma.recipe.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, description, ingredients, steps, prepTime, cookTime, servings, category } = await req.json();

  const recipe = await prisma.recipe.create({
    data: {
      title,
      description,
      ingredients: JSON.stringify(ingredients),
      steps: JSON.stringify(steps),
      prepTime: prepTime ? parseInt(prepTime) : null,
      cookTime: cookTime ? parseInt(cookTime) : null,
      servings: servings ? parseInt(servings) : null,
      category: category || "Plat principal",
      userId: session.user.id,
    },
  });

  return NextResponse.json(recipe, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await req.json();
  await prisma.recipe.deleteMany({ where: { id } });

  return NextResponse.json({ ok: true });
}
