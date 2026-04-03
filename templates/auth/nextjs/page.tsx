"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * TEMPLATE: Page de connexion / inscription
 *
 * Fonctionnalités :
 * - Basculer entre connexion et inscription
 * - Validation basique côté client
 * - Support Google OAuth (bouton)
 * - Responsive, design épuré
 *
 * Personnalisation :
 * - Remplacer APP_NAME, APP_DESCRIPTION, APP_ICON
 * - Brancher les handlers onLogin / onRegister
 * - Adapter les couleurs (chercher "indigo" pour changer)
 */

const APP_NAME = "MonApp";
const APP_DESCRIPTION = "Connectez-vous pour continuer";
const APP_ICON = "🔐";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    try {
      // ── À REMPLACER : brancher votre logique d'auth ici ──
      console.log(mode, data);
      // await signIn("credentials", { ...data, redirectTo: "/dashboard" });
    } catch {
      setError(mode === "login" ? "Email ou mot de passe incorrect." : "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* ── En-tête ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">{APP_ICON}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{APP_NAME}</h1>
          <p className="text-slate-500 mt-1">{APP_DESCRIPTION}</p>
        </div>

        {/* ── Carte ── */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          {/* Onglets */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "login" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === "register" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="vous@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {mode === "login" && (
              <div className="text-right">
                <Link href="/auth/forgot" className="text-sm text-indigo-600 hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
            )}

            {error && (
              <p className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase">ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* OAuth */}
          <button className="w-full py-3 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continuer avec Google
          </button>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          © 2026 {APP_NAME} — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
