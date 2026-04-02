"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  steps: string;
  prepTime: number;
  cookTime: number;
  servings: number;
}

export default function RecettesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [steps, setSteps] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/recettes");
    if (res.ok) setRecipes(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await fetch("/api/recettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, description,
        ingredients: JSON.stringify(ingredients.split("\n").filter(Boolean)),
        steps: JSON.stringify(steps.split("\n").filter(Boolean)),
        prepTime: prepTime ? parseInt(prepTime) : null,
        cookTime: cookTime ? parseInt(cookTime) : null,
        servings: servings ? parseInt(servings) : null,
      }),
    });
    setTitle(""); setDescription(""); setIngredients(""); setSteps("");
    setPrepTime(""); setCookTime(""); setServings("");
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/recettes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSelected(null);
    load();
  }

  if (selected) {
    const ingr: string[] = JSON.parse(selected.ingredients || "[]");
    const stps: string[] = JSON.parse(selected.steps || "[]");
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-2">← Retour</button>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-slate-900">{selected.title}</h1>
              <button onClick={() => handleDelete(selected.id)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
            </div>
            {selected.description && <p className="text-slate-600 mb-4">{selected.description}</p>}
            <div className="flex gap-4 text-sm text-slate-500 mb-6">
              {selected.prepTime && <span>⏱ Prép : {selected.prepTime} min</span>}
              {selected.cookTime && <span>🔥 Cuisson : {selected.cookTime} min</span>}
              {selected.servings && <span>👥 {selected.servings} pers.</span>}
            </div>
            {ingr.length > 0 && (
              <div className="mb-6">
                <h2 className="font-semibold text-slate-900 mb-3">Ingrédients</h2>
                <ul className="space-y-1">
                  {ingr.map((i, idx) => <li key={idx} className="text-slate-600 flex gap-2"><span className="text-indigo-400">•</span>{i}</li>)}
                </ul>
              </div>
            )}
            {stps.length > 0 && (
              <div>
                <h2 className="font-semibold text-slate-900 mb-3">Préparation</h2>
                <ol className="space-y-3">
                  {stps.map((s, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      <p className="text-slate-600">{s}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
            <h1 className="text-2xl font-bold text-slate-900">🍽️ Recettes</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
            {showForm ? "Annuler" : "+ Nouvelle recette"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 space-y-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre *" required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description courte"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <div className="grid grid-cols-3 gap-4">
              <input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="Prép (min)" type="number"
                className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={cookTime} onChange={(e) => setCookTime(e.target.value)} placeholder="Cuisson (min)" type="number"
                className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={servings} onChange={(e) => setServings(e.target.value)} placeholder="Personnes" type="number"
                className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <textarea value={ingredients} onChange={(e) => setIngredients(e.target.value)}
              placeholder="Ingrédients (une ligne par ingrédient)" rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <textarea value={steps} onChange={(e) => setSteps(e.target.value)}
              placeholder="Étapes (une ligne par étape)" rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors">
              {saving ? "Enregistrement..." : "Sauvegarder la recette"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-slate-500 text-center">Chargement...</p>
        ) : recipes.length === 0 ? (
          <p className="text-slate-400 text-center">Aucune recette. Commencez par en ajouter une !</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((r) => (
              <button key={r.id} onClick={() => setSelected(r)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
                <h3 className="font-semibold text-slate-900 mb-1">{r.title}</h3>
                {r.description && <p className="text-slate-500 text-sm line-clamp-2">{r.description}</p>}
                <div className="flex gap-3 text-xs text-slate-400 mt-3">
                  {r.prepTime && <span>⏱ {r.prepTime}min</span>}
                  {r.servings && <span>👥 {r.servings}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
