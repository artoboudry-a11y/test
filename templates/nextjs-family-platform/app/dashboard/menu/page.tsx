"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MealPlan {
  id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner";
  content: string;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MEALS: { key: "breakfast" | "lunch" | "dinner"; label: string; icon: string }[] = [
  { key: "breakfast", label: "Matin", icon: "☀️" },
  { key: "lunch", label: "Midi", icon: "🍽️" },
  { key: "dinner", label: "Soir", icon: "🌙" },
];

function getWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export default function MenuPage() {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ date: string; mealType: string } | null>(null);
  const [value, setValue] = useState("");
  const weekDates = getWeekDates();

  async function load() {
    const res = await fetch("/api/menu");
    if (res.ok) setPlans(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getMeal(date: string, mealType: string) {
    return plans.find((p) => p.date.startsWith(date) && p.mealType === mealType);
  }

  async function saveMeal(date: string, mealType: string) {
    await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, mealType, content: value }),
    });
    setEditing(null);
    setValue("");
    load();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">📅 Menu de la semaine</h1>
        </div>

        {loading ? (
          <p className="text-slate-500 text-center">Chargement...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-3 px-4 text-left text-sm font-medium text-slate-500 w-20">Repas</th>
                  {DAYS.map((day, i) => (
                    <th key={day} className="py-3 px-4 text-center text-sm font-medium text-slate-700">
                      <div>{day}</div>
                      <div className="text-xs text-slate-400 font-normal">{weekDates[i].slice(5)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MEALS.map((meal) => (
                  <tr key={meal.key}>
                    <td className="py-3 px-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {meal.icon} {meal.label}
                    </td>
                    {weekDates.map((date) => {
                      const plan = getMeal(date, meal.key);
                      const isEditing = editing?.date === date && editing?.mealType === meal.key;
                      return (
                        <td key={date} className="py-2 px-2 text-center align-top">
                          {isEditing ? (
                            <div className="flex flex-col gap-1">
                              <input
                                autoFocus
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveMeal(date, meal.key); if (e.key === "Escape") setEditing(null); }}
                                className="w-full px-2 py-1 text-sm border border-indigo-400 rounded-lg outline-none"
                                placeholder="..."
                              />
                              <div className="flex gap-1">
                                <button onClick={() => saveMeal(date, meal.key)} className="flex-1 text-xs py-1 bg-indigo-600 text-white rounded-md">OK</button>
                                <button onClick={() => setEditing(null)} className="flex-1 text-xs py-1 bg-slate-100 text-slate-600 rounded-md">✕</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditing({ date, mealType: meal.key }); setValue(plan?.content ?? ""); }}
                              className="w-full min-h-[2.5rem] text-sm text-slate-700 hover:bg-indigo-50 rounded-lg px-2 py-1 transition-colors text-left"
                            >
                              {plan?.content || <span className="text-slate-300 text-xs">+</span>}
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
