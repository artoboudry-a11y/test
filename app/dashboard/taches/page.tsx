"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Assignment {
  id: string;
  dueDate: string;
  completedAt?: string | null;
}

interface Chore {
  id: string;
  title: string;
  description?: string;
  frequency: string;
  assignments: Assignment[];
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
};

const FREQUENCY_COLORS: Record<string, string> = {
  daily: "bg-red-100 text-red-700",
  weekly: "bg-blue-100 text-blue-700",
  monthly: "bg-purple-100 text-purple-700",
};

const CHORE_SUGGESTIONS = [
  { title: "Faire la vaisselle", frequency: "daily" },
  { title: "Passer l'aspirateur", frequency: "weekly" },
  { title: "Laver le linge", frequency: "weekly" },
  { title: "Nettoyer les sanitaires", frequency: "weekly" },
  { title: "Faire les poubelles", frequency: "weekly" },
  { title: "Nettoyer le réfrigérateur", frequency: "monthly" },
  { title: "Changer les draps", frequency: "weekly" },
  { title: "Nettoyer le four", frequency: "monthly" },
];

export default function TachesPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", frequency: "weekly" });

  useEffect(() => { fetchChores(); }, []);

  const fetchChores = async () => {
    const res = await fetch("/api/taches");
    const data = await res.json();
    setChores(data);
    setLoading(false);
  };

  const addChore = async (title?: string, frequency?: string) => {
    const payload = title ? { title, frequency: frequency || "weekly", description: "" } : form;
    if (!payload.title.trim()) return;
    const res = await fetch("/api/taches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const chore = await res.json();
    setChores([...chores, chore]);
    setForm({ title: "", description: "", frequency: "weekly" });
    setShowForm(false);
  };

  const toggleComplete = async (chore: Chore) => {
    const assignment = chore.assignments[0];
    if (!assignment) return;
    const completed = !assignment.completedAt;
    await fetch("/api/taches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: assignment.id, completed }),
    });
    setChores(chores.map((c) =>
      c.id === chore.id
        ? { ...c, assignments: c.assignments.map((a) => a.id === assignment.id ? { ...a, completedAt: completed ? new Date().toISOString() : null } : a) }
        : c
    ));
  };

  const deleteChore = async (id: string) => {
    await fetch("/api/taches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setChores(chores.filter((c) => c.id !== id));
  };

  const doneCount = chores.filter((c) => c.assignments[0]?.completedAt).length;
  const pendingChores = chores.filter((c) => !c.assignments[0]?.completedAt);
  const doneChores = chores.filter((c) => c.assignments[0]?.completedAt);

  const isOverdue = (chore: Chore) => {
    const a = chore.assignments[0];
    if (!a || a.completedAt) return false;
    return new Date(a.dueDate) < new Date();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧹</span>
            <h1 className="font-bold text-slate-900">Tâches ménagères</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="ml-auto px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            + Ajouter
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progression */}
        {chores.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Progression du jour</span>
              <span className="text-sm text-slate-500">{doneCount}/{chores.length} tâches</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-teal-500 h-3 rounded-full transition-all duration-500"
                style={{ width: chores.length > 0 ? `${(doneCount / chores.length) * 100}%` : "0%" }}
              ></div>
            </div>
            {doneCount === chores.length && chores.length > 0 && (
              <p className="text-sm text-teal-600 font-medium mt-2 text-center">🎉 Toutes les tâches sont faites !</p>
            )}
          </div>
        )}

        {/* Formulaire */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6">
            <div className="flex gap-2">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && addChore()}
                placeholder="Nom de la tâche"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description (optionnel)"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
              </select>
              <button onClick={() => addChore()} className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors">
                Ajouter
              </button>
            </div>
          </div>
        )}

        {/* Suggestions si aucune tâche */}
        {chores.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-6">
            <h3 className="font-semibold text-slate-700 mb-3">💡 Suggestions rapides</h3>
            <div className="flex flex-wrap gap-2">
              {CHORE_SUGGESTIONS.map((s) => (
                <button
                  key={s.title}
                  onClick={() => addChore(s.title, s.frequency)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded-xl text-sm text-slate-600 transition-colors"
                >
                  + {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tâches à faire */}
        {pendingChores.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-500 mb-3">À faire ({pendingChores.length})</h3>
            <div className="space-y-2">
              {pendingChores.map((chore) => (
                <div key={chore.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-4 shadow-sm group transition-all ${isOverdue(chore) ? "border-red-200" : "border-slate-100"}`}>
                  <button
                    onClick={() => toggleComplete(chore)}
                    className="w-6 h-6 rounded-full border-2 border-slate-300 hover:border-teal-500 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800 text-sm">{chore.title}</p>
                      {isOverdue(chore) && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">En retard</span>}
                    </div>
                    {chore.description && <p className="text-xs text-slate-400 mt-0.5">{chore.description}</p>}
                    {chore.assignments[0] && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Avant le {new Date(chore.assignments[0].dueDate).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${FREQUENCY_COLORS[chore.frequency]}`}>
                    {FREQUENCY_LABELS[chore.frequency]}
                  </span>
                  <button
                    onClick={() => deleteChore(chore.id)}
                    className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tâches faites */}
        {doneChores.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Faites ({doneChores.length})</h3>
            <div className="space-y-2">
              {doneChores.map((chore) => (
                <div key={chore.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center gap-4 group">
                  <button
                    onClick={() => toggleComplete(chore)}
                    className="w-6 h-6 rounded-full bg-teal-500 border-2 border-teal-500 flex items-center justify-center shrink-0"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>
                  <p className="flex-1 text-sm text-slate-400 line-through">{chore.title}</p>
                  <button onClick={() => deleteChore(chore.id)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {chores.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-400">
            <div className="text-5xl mb-4">🧹</div>
            <p className="font-medium">Aucune tâche — ajoutez vos corvées ménagères</p>
          </div>
        )}
      </div>
    </div>
  );
}
