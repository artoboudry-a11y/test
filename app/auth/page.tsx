"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction } from "./actions";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginError, loginAction_, loginPending] = useActionState(loginAction, null);
  const [registerError, registerAction_, registerPending] = useActionState(registerAction, null);

  const isPending = loginPending || registerPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Ma Plateforme</h1>
          <p className="text-slate-500 mt-1">Votre espace familial personnel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "login" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "register" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Créer un compte
            </button>
          </div>

          {mode === "login" ? (
            <form action={loginAction_} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
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
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                {isPending ? "Chargement..." : "Se connecter"}
              </button>
            </form>
          ) : (
            <form action={registerAction_} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prénom / Nom</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresse email</label>
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
              {registerError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {registerError}
                </div>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                {isPending ? "Chargement..." : "Créer mon compte"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Plateforme privée — accès réservé à la famille
        </p>
      </div>
    </div>
  );
}
