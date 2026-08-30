/**
 * TEMPLATE: Dashboard / Tableau de bord
 *
 * Sections :
 * - Sidebar navigation (collapsible)
 * - Header avec recherche et profil
 * - Cartes stats
 * - Zone de contenu principal
 *
 * Personnalisation :
 * - NAV_ITEMS[] : liens sidebar
 * - STATS[] : cartes résumé
 * - Couleurs : chercher "indigo"
 */

"use client";

import { useState } from "react";
import Link from "next/link";

const APP_NAME = "MonApp";

const NAV_ITEMS = [
  { icon: "🏠", label: "Accueil", href: "/dashboard" },
  { icon: "📊", label: "Statistiques", href: "/dashboard/stats" },
  { icon: "👥", label: "Utilisateurs", href: "/dashboard/users" },
  { icon: "📝", label: "Contenu", href: "/dashboard/content" },
  { icon: "💬", label: "Messages", href: "/dashboard/messages", badge: 3 },
  { icon: "⚙️", label: "Paramètres", href: "/dashboard/settings" },
];

const STATS = [
  { label: "Utilisateurs", value: "1,284", change: "+12%", up: true },
  { label: "Revenus", value: "€ 45,200", change: "+8%", up: true },
  { label: "Commandes", value: "356", change: "-3%", up: false },
  { label: "Taux conversion", value: "3.2%", change: "+0.4%", up: true },
];

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-slate-200 flex flex-col transition-all duration-200 shrink-0`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          {sidebarOpen && <span className="font-bold text-indigo-600 text-lg">{APP_NAME}</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors relative"
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              {item.badge && sidebarOpen && (
                <span className="ml-auto text-xs bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">JD</div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium text-slate-900">Jean Dupont</p>
                <p className="text-xs text-slate-400">Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-slate-900">Tableau de bord</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="search"
                placeholder="Rechercher..."
                className="w-64 px-4 py-2 pl-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              🔔
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">2</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className={`text-sm mt-1 ${stat.up ? "text-green-600" : "text-red-500"}`}>
                  {stat.change} vs mois dernier
                </p>
              </div>
            ))}
          </div>

          {/* Contenu placeholder */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Activité récente</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">👤</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Action utilisateur #{i}</p>
                    <p className="text-xs text-slate-400">Il y a {i * 2} heures</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">Terminé</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
