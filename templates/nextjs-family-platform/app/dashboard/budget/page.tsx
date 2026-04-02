"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BudgetEntry {
  id: string;
  label: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

export default function BudgetPage() {
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/budget");
    if (res.ok) setEntries(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const total = entries.reduce((sum, e) => e.type === "income" ? sum + e.amount : sum - e.amount, 0);
  const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const expense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !amount) return;
    setSaving(true);
    await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, amount: parseFloat(amount), type, category }),
    });
    setLabel("");
    setAmount("");
    setCategory("");
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/budget", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">💰 Budget</h1>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
            <p className="text-sm text-slate-500 mb-1">Revenus</p>
            <p className="text-xl font-bold text-green-600">+{income.toFixed(2)} €</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
            <p className="text-sm text-slate-500 mb-1">Dépenses</p>
            <p className="text-xl font-bold text-red-500">-{expense.toFixed(2)} €</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
            <p className="text-sm text-slate-500 mb-1">Solde</p>
            <p className={`text-xl font-bold ${total >= 0 ? "text-slate-900" : "text-red-600"}`}>
              {total >= 0 ? "+" : ""}{total.toFixed(2)} €
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Nouvelle entrée</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Libellé"
              required
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant (€)"
              type="number"
              step="0.01"
              min="0"
              required
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Catégorie (optionnel)"
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${type === "expense" ? "bg-red-500 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                Dépense
              </button>
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${type === "income" ? "bg-green-500 text-white" : "text-slate-600 hover:bg-slate-50"}`}
              >
                Revenu
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors"
          >
            {saving ? "Enregistrement..." : "Ajouter"}
          </button>
        </form>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <p className="text-slate-500 text-center p-8">Chargement...</p>
          ) : entries.length === 0 ? (
            <p className="text-slate-400 text-center p-8">Aucune entrée.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{entry.label}</p>
                    {entry.category && <p className="text-sm text-slate-400">{entry.category}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-semibold ${entry.type === "income" ? "text-green-600" : "text-red-500"}`}>
                      {entry.type === "income" ? "+" : "-"}{entry.amount.toFixed(2)} €
                    </span>
                    <button onClick={() => handleDelete(entry.id)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
