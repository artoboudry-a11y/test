"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface BudgetEntry {
  id: string;
  type: "income" | "expense";
  label: string;
  amount: number;
  category: string;
  date: string;
}

const EXPENSE_CATEGORIES = ["Alimentation", "Transport", "Logement", "Santé", "Loisirs", "Vêtements", "Éducation", "Téléphone/Internet", "Énergie", "Autre"];
const INCOME_CATEGORIES = ["Salaire", "Freelance", "Allocations", "Loyer perçu", "Autre"];

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function BudgetPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense" as "income" | "expense", label: "", amount: "", category: "Alimentation", date: new Date().toISOString().split("T")[0] });

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/budget?month=${month}&year=${year}`);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const addEntry = async () => {
    if (!form.label.trim() || !form.amount) return;
    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const entry = await res.json();
    setEntries([entry, ...entries]);
    setForm({ type: "expense", label: "", amount: "", category: "Alimentation", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
  };

  const deleteEntry = async (id: string) => {
    await fetch("/api/budget", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEntries(entries.filter((e) => e.id !== id));
  };

  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const categoryExpenses = entries
    .filter((e) => e.type === "expense")
    .reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>);

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">💰</span>
            <h1 className="font-bold text-slate-900">Budget</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="text-sm border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none">
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="text-sm border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none">
              {[year - 1, year, year + 1].map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Résumé */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Revenus</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">Dépenses</p>
            <p className="text-xl font-bold text-red-500">{fmt(totalExpense)}</p>
          </div>
          <div className={`rounded-2xl border p-4 shadow-sm ${balance >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <p className="text-xs text-slate-500 mb-1">Balance</p>
            <p className={`text-xl font-bold ${balance >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmt(balance)}</p>
          </div>
        </div>

        {/* Barre de progression des dépenses par catégorie */}
        {Object.keys(categoryExpenses).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Dépenses par catégorie</h3>
            <div className="space-y-2">
              {Object.entries(categoryExpenses)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{cat}</span>
                      <span className="font-medium text-slate-800">{fmt(amount)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-red-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min((amount / totalExpense) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Formulaire d'ajout */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Ajouter une transaction</h3>
            <button onClick={() => setShowForm(!showForm)} className="text-sm text-indigo-600 font-medium">
              {showForm ? "Annuler" : "+ Ajouter"}
            </button>
          </div>

          {showForm && (
            <div className="space-y-3">
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setForm({ ...form, type: "expense", category: "Alimentation" })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${form.type === "expense" ? "bg-white shadow text-red-600" : "text-slate-500"}`}
                >
                  Dépense
                </button>
                <button
                  onClick={() => setForm({ ...form, type: "income", category: "Salaire" })}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${form.type === "income" ? "bg-white shadow text-emerald-600" : "text-slate-500"}`}
                >
                  Revenu
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Description"
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Montant (€)"
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {(form.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={addEntry}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {/* Liste des transactions */}
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-3">💰</div>
            <p>Aucune transaction ce mois-ci</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-sm font-semibold text-slate-600">{entries.length} transactions</span>
            </div>
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${entry.type === "income" ? "bg-emerald-100" : "bg-red-100"}`}>
                  {entry.type === "income" ? "↑" : "↓"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{entry.label}</p>
                  <p className="text-xs text-slate-400">{entry.category} · {new Date(entry.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={`font-semibold text-sm ${entry.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
                  {entry.type === "income" ? "+" : "-"}{fmt(entry.amount)}
                </span>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
