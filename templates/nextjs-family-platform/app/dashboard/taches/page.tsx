"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Chore {
  id: string;
  title: string;
  description: string;
  frequency: string;
  assignments: { id: string; assigneeName: string; dueDate: string | null; done: boolean }[];
}

export default function TachesPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/taches");
    if (res.ok) setChores(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await fetch("/api/taches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, frequency }),
    });
    setTitle(""); setDescription("");
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/taches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const FREQ_LABELS: Record<string, string> = {
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">✅ Tâches</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la tâche *" required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="daily">Quotidien</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuel</option>
          </select>
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors">
            {saving ? "Enregistrement..." : "Ajouter la tâche"}
          </button>
        </form>

        <div className="space-y-3">
          {loading ? (
            <p className="text-slate-500 text-center">Chargement...</p>
          ) : chores.length === 0 ? (
            <p className="text-slate-400 text-center">Aucune tâche pour l&apos;instant.</p>
          ) : chores.map((chore) => (
            <div key={chore.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">{chore.title}</p>
                  <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                    {FREQ_LABELS[chore.frequency] ?? chore.frequency}
                  </span>
                </div>
                {chore.description && <p className="text-sm text-slate-500 mt-1">{chore.description}</p>}
              </div>
              <button onClick={() => handleDelete(chore.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-4">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
