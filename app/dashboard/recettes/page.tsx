"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string;
  steps: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  category: string;
}

const CATEGORIES = ["Entrée", "Plat principal", "Dessert", "Petit-déjeuner", "Soupe", "Snack", "Boisson", "Autre"];

const CATEGORY_ICONS: Record<string, string> = {
  "Entrée": "🥗", "Plat principal": "🍽️", "Dessert": "🍰",
  "Petit-déjeuner": "☕", "Soupe": "🍜", "Snack": "🍪", "Boisson": "🥤", "Autre": "🍴",
};

export default function RecettesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "", description: "", ingredients: [""], steps: [""],
    prepTime: "", cookTime: "", servings: "", category: "Plat principal",
  });

  useEffect(() => { fetchRecipes(); }, []);

  const fetchRecipes = async () => {
    const res = await fetch("/api/recettes");
    const data = await res.json();
    setRecipes(data);
    setLoading(false);
  };

  const addIngredient = () => setForm({ ...form, ingredients: [...form.ingredients, ""] });
  const addStep = () => setForm({ ...form, steps: [...form.steps, ""] });

  const updateIngredient = (i: number, val: string) => {
    const updated = [...form.ingredients];
    updated[i] = val;
    setForm({ ...form, ingredients: updated });
  };

  const updateStep = (i: number, val: string) => {
    const updated = [...form.steps];
    updated[i] = val;
    setForm({ ...form, steps: updated });
  };

  const removeIngredient = (i: number) => setForm({ ...form, ingredients: form.ingredients.filter((_, idx) => idx !== i) });
  const removeStep = (i: number) => setForm({ ...form, steps: form.steps.filter((_, idx) => idx !== i) });

  const saveRecipe = async () => {
    if (!form.title.trim()) return;
    const res = await fetch("/api/recettes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        ingredients: form.ingredients.filter((i) => i.trim()),
        steps: form.steps.filter((s) => s.trim()),
      }),
    });
    const recipe = await res.json();
    setRecipes([recipe, ...recipes]);
    setForm({ title: "", description: "", ingredients: [""], steps: [""], prepTime: "", cookTime: "", servings: "", category: "Plat principal" });
    setShowForm(false);
    setSelected(recipe);
  };

  const deleteRecipe = async (id: string) => {
    await fetch("/api/recettes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setRecipes(recipes.filter((r) => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = recipes.filter((r) => {
    const matchCat = filter === "Tous" || r.category === filter;
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍🍳</span>
            <h1 className="font-bold text-slate-900">Recettes</h1>
          </div>
          <div className="flex-1 max-w-xs ml-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>
          <button
            onClick={() => { setShowForm(true); setSelected(null); }}
            className="ml-auto px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            + Ajouter
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          {/* Filtres catégories */}
          <div className="mb-4 space-y-1">
            {["Tous", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${
                  filter === cat ? "bg-rose-50 text-rose-700 font-medium" : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <span>{cat === "Tous" ? "📚" : CATEGORY_ICONS[cat]}</span>
                {cat}
                <span className="ml-auto text-xs text-slate-400">
                  {cat === "Tous" ? recipes.length : recipes.filter((r) => r.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1">
          {showForm ? (
            // Formulaire ajout recette
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">Nouvelle recette</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">×</button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titre de la recette *" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  </div>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input value={form.servings} onChange={(e) => setForm({ ...form, servings: e.target.value })} type="number" placeholder="Portions" className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  <input value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: e.target.value })} type="number" placeholder="Préparation (min)" className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  <input value={form.cookTime} onChange={(e) => setForm({ ...form, cookTime: e.target.value })} type="number" placeholder="Cuisson (min)" className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  <div className="col-span-2">
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description courte" rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
                  </div>
                </div>

                {/* Ingrédients */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Ingrédients</label>
                    <button onClick={addIngredient} className="text-xs text-rose-500 hover:text-rose-700">+ Ajouter</button>
                  </div>
                  <div className="space-y-2">
                    {form.ingredients.map((ing, i) => (
                      <div key={i} className="flex gap-2">
                        <input value={ing} onChange={(e) => updateIngredient(i, e.target.value)} placeholder={`Ingrédient ${i + 1}`} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400" />
                        {form.ingredients.length > 1 && <button onClick={() => removeIngredient(i)} className="text-slate-400 hover:text-red-400">×</button>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Étapes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">Étapes</label>
                    <button onClick={addStep} className="text-xs text-rose-500 hover:text-rose-700">+ Ajouter</button>
                  </div>
                  <div className="space-y-2">
                    {form.steps.map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-2">{i + 1}</span>
                        <textarea value={step} onChange={(e) => updateStep(i, e.target.value)} placeholder={`Étape ${i + 1}...`} rows={2} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
                        {form.steps.length > 1 && <button onClick={() => removeStep(i)} className="text-slate-400 hover:text-red-400 self-start mt-2">×</button>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={saveRecipe} className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors">Enregistrer la recette</button>
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">Annuler</button>
                </div>
              </div>
            </div>
          ) : selected ? (
            // Détail recette
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-medium text-rose-500 bg-rose-50 px-2 py-1 rounded-full">{CATEGORY_ICONS[selected.category]} {selected.category}</span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">{selected.title}</h2>
                  {selected.description && <p className="text-slate-500 mt-1 text-sm">{selected.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => deleteRecipe(selected.id)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50">Supprimer</button>
                  <button onClick={() => setSelected(null)} className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-xl text-sm hover:bg-slate-50">×</button>
                </div>
              </div>

              {/* Infos */}
              <div className="flex gap-4 mb-6">
                {selected.prepTime && <div className="text-center"><p className="text-xl font-bold text-slate-800">{selected.prepTime}</p><p className="text-xs text-slate-400">min prép.</p></div>}
                {selected.cookTime && <div className="text-center"><p className="text-xl font-bold text-slate-800">{selected.cookTime}</p><p className="text-xs text-slate-400">min cuisson</p></div>}
                {selected.servings && <div className="text-center"><p className="text-xl font-bold text-slate-800">{selected.servings}</p><p className="text-xs text-slate-400">portions</p></div>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">🧂 Ingrédients</h3>
                  <ul className="space-y-1.5">
                    {(JSON.parse(selected.ingredients) as string[]).map((ing, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-2 shrink-0"></span>
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">👨‍🍳 Préparation</h3>
                  <ol className="space-y-3">
                    {(JSON.parse(selected.steps) as string[]).map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-700">
                        <span className="w-5 h-5 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            // Grille de recettes
            filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">👨‍🍳</div>
                <p className="text-slate-500 font-medium">Aucune recette — ajoutez la première !</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => setSelected(recipe)}
                    className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{CATEGORY_ICONS[recipe.category] ?? "🍴"}</span>
                      <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">{recipe.category}</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-1">{recipe.title}</h3>
                    {recipe.description && <p className="text-xs text-slate-400 line-clamp-2">{recipe.description}</p>}
                    <div className="flex gap-3 mt-3">
                      {recipe.prepTime && <span className="text-xs text-slate-400">⏱ {recipe.prepTime}min</span>}
                      {recipe.servings && <span className="text-xs text-slate-400">👥 {recipe.servings} pers.</span>}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
