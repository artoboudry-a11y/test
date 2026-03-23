"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MEAL_TYPES = [
  { id: "breakfast", label: "Petit-déj.", icon: "☀️" },
  { id: "lunch", label: "Déjeuner", icon: "🌤️" },
  { id: "dinner", label: "Dîner", icon: "🌙" },
];

interface MealPlan {
  id: string;
  day: string;
  mealType: string;
  meal: string;
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeek(monday: Date) {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${sunday.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
}

export default function MenuPage() {
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()));
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [editing, setEditing] = useState<{ day: string; mealType: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/menu?week=${weekStart.toISOString()}`);
    const data = await res.json();
    setMeals(data.meals || []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  const getMeal = (day: string, mealType: string) =>
    meals.find((m) => m.day === day && m.mealType === mealType);

  const startEditing = (day: string, mealType: string) => {
    const meal = getMeal(day, mealType);
    setEditValue(meal?.meal || "");
    setEditing({ day, mealType });
  };

  const saveMeal = async () => {
    if (!editing) return;
    const { day, mealType } = editing;

    if (!editValue.trim()) {
      const existing = getMeal(day, mealType);
      if (existing) {
        await fetch("/api/menu", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id }),
        });
        setMeals((prev) => prev.filter((m) => m.id !== existing.id));
      }
    } else {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekStart.toISOString(), day, mealType, meal: editValue.trim() }),
      });
      const record = await res.json();
      setMeals((prev) => {
        const filtered = prev.filter((m) => !(m.day === day && m.mealType === mealType));
        return [...filtered, record];
      });
    }
    setEditing(null);
    setEditValue("");
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const generateShoppingList = () => {
    const items = meals.filter((m) => m.meal.trim()).map((m) => `${m.meal} (${m.day} - ${m.mealType === "lunch" ? "Déj." : m.mealType === "dinner" ? "Dîner" : "Petit-déj."})`);
    const text = items.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `menu-semaine.txt`;
    a.click();
  };

  const filledCount = meals.filter((m) => m.meal.trim()).length;
  const totalSlots = DAYS.length * MEAL_TYPES.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <h1 className="font-bold text-slate-900">Menu de la semaine</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={generateShoppingList} className="px-3 py-1.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600">
              📥 Exporter
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Navigation semaine */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <p className="font-semibold text-slate-900">Semaine du {formatWeek(weekStart)}</p>
            <p className="text-sm text-slate-500">{filledCount}/{totalSlots} repas planifiés</p>
          </div>
          <button onClick={nextWeek} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-28 p-2"></th>
                  {DAYS.map((day, i) => {
                    const date = new Date(weekStart);
                    date.setDate(weekStart.getDate() + i);
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <th key={day} className="p-2 text-center">
                        <div className={`inline-flex flex-col items-center px-3 py-1.5 rounded-xl ${isToday ? "bg-orange-100" : ""}`}>
                          <span className={`text-xs font-medium ${isToday ? "text-orange-600" : "text-slate-500"}`}>{day}</span>
                          <span className={`text-sm font-bold ${isToday ? "text-orange-700" : "text-slate-700"}`}>
                            {date.getDate()}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {MEAL_TYPES.map((mt) => (
                  <tr key={mt.id}>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        <span>{mt.icon}</span>
                        <span className="text-xs font-medium text-slate-500">{mt.label}</span>
                      </div>
                    </td>
                    {DAYS.map((day) => {
                      const meal = getMeal(day, mt.id);
                      const isEditing = editing?.day === day && editing?.mealType === mt.id;
                      return (
                        <td key={day} className="p-1">
                          {isEditing ? (
                            <div className="bg-white rounded-xl border-2 border-orange-400 p-1">
                              <input
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveMeal(); if (e.key === "Escape") setEditing(null); }}
                                onBlur={saveMeal}
                                className="w-full text-xs outline-none px-1 py-0.5"
                                placeholder="Quel repas ?"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditing(day, mt.id)}
                              className={`w-full min-h-12 rounded-xl text-xs text-left px-2 py-2 transition-all ${
                                meal
                                  ? "bg-white border border-slate-100 hover:border-orange-300 text-slate-700 font-medium shadow-sm"
                                  : "border-2 border-dashed border-slate-200 hover:border-orange-300 text-slate-400 hover:text-orange-400"
                              }`}
                            >
                              {meal ? meal.meal : "+ Ajouter"}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
