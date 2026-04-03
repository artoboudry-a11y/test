/**
 * TEMPLATE: Page paramètres
 *
 * Sections :
 * - Général (thème, langue)
 * - Notifications (toggles)
 * - Confidentialité
 *
 * Personnalisation :
 * - Ajouter/retirer des sections
 * - Brancher la persistance des réglages
 */

"use client";

import { useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [theme, setTheme] = useState("light");
  const [lang, setLang] = useState("fr");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true);

  function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors ${value ? "bg-indigo-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : ""}`} />
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        </div>

        {/* ── Général ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-900 text-lg mb-5">Général</h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Thème</p>
                <p className="text-sm text-slate-500">Apparence de l&apos;application</p>
              </div>
              <select value={theme} onChange={(e) => setTheme(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="system">Système</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Langue</p>
                <p className="text-sm text-slate-500">Langue de l&apos;interface</p>
              </div>
              <select value={lang} onChange={(e) => setLang(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Notifications ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-900 text-lg mb-5">Notifications</h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Notifications email</p>
                <p className="text-sm text-slate-500">Recevoir les alertes par email</p>
              </div>
              <Toggle value={emailNotif} onChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Notifications push</p>
                <p className="text-sm text-slate-500">Alertes dans le navigateur</p>
              </div>
              <Toggle value={pushNotif} onChange={setPushNotif} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Résumé hebdomadaire</p>
                <p className="text-sm text-slate-500">Recevoir un résumé chaque lundi</p>
              </div>
              <Toggle value={weeklyDigest} onChange={setWeeklyDigest} />
            </div>
          </div>
        </div>

        {/* ── Confidentialité ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 text-lg mb-5">Confidentialité</h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Profil public</p>
                <p className="text-sm text-slate-500">Votre profil est visible par les autres</p>
              </div>
              <Toggle value={profilePublic} onChange={setProfilePublic} />
            </div>
            <div>
              <button className="text-sm text-indigo-600 hover:underline">Télécharger mes données</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
