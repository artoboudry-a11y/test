"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

export async function loginAction(_prevState: string | null, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) {
      return "Email ou mot de passe incorrect.";
    }
    throw err;
  }
  return null;
}

export async function registerAction(_prevState: string | null, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return "Email et mot de passe requis.";
  if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "Un compte existe déjà avec cet email.";

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name, email, password: hashed } });

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) {
      return "Compte créé, mais connexion échouée. Veuillez vous connecter.";
    }
    throw err;
  }
  return null;
}

export async function signOutAction() {
  await signOut({ redirectTo: "/auth" });
}
