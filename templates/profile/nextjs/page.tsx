/**
 * TEMPLATE: Page profil utilisateur
 *
 * Sections :
 * - Photo + infos de base
 * - Formulaire de modification
 * - Changer mot de passe
 * - Zone danger (supprimer compte)
 *
 * Personnalisation :
 * - Brancher les handlers onSave / onDelete
 * - Adapter les champs au modèle utilisateur
 */

"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [name, setName] = useState("Jean Dupont");
  const [email, setEmail] = useState("jean@email.com");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // ── À REMPLACER : sauvegarder le profil ──
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">Mon profil</h1>
        </div>

        {/* ── Photo + Résumé ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
            <p className="text-slate-500 text-sm">{email}</p>
            <button className="mt-2 text-sm text-indigo-600 hover:underline">Changer la photo</button>
          </div>
        </div>

        {/* ── Formulaire profil ── */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-slate-900 text-lg mb-2">Informations personnelles</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Parlez-nous de vous..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors">
              {saving ? "Enregistrement..." : "Sauvegarder"}
            </button>
            {saved && <span className="text-green-600 text-sm font-medium">Profil mis à jour !</span>}
          </div>
        </form>

        {/* ── Changer mot de passe ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-slate-900 text-lg mb-2">Mot de passe</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
            <input type="password" placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
            <input type="password" placeholder="••••••••" minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors">
            Modifier le mot de passe
          </button>
        </div>

        {/* ── Zone danger ── */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
          <h2 className="font-semibold text-red-700 text-lg mb-2">Zone dangereuse</h2>
          <p className="text-slate-500 text-sm mb-4">La suppression de votre compte est irréversible.</p>
          <button className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors">
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
