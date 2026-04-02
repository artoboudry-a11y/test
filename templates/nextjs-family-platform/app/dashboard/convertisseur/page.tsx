"use client";

import { useState } from "react";
import Link from "next/link";

type Category = "length" | "weight" | "volume" | "temperature";

const conversions: Record<Category, { label: string; units: { key: string; label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[] }> = {
  length: {
    label: "Longueur",
    units: [
      { key: "mm", label: "Millimètres (mm)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { key: "cm", label: "Centimètres (cm)", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { key: "m", label: "Mètres (m)", toBase: (v) => v, fromBase: (v) => v },
      { key: "km", label: "Kilomètres (km)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { key: "in", label: "Pouces (in)", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { key: "ft", label: "Pieds (ft)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { key: "mi", label: "Miles (mi)", toBase: (v) => v * 1609.34, fromBase: (v) => v / 1609.34 },
    ],
  },
  weight: {
    label: "Poids",
    units: [
      { key: "mg", label: "Milligrammes (mg)", toBase: (v) => v / 1_000_000, fromBase: (v) => v * 1_000_000 },
      { key: "g", label: "Grammes (g)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { key: "kg", label: "Kilogrammes (kg)", toBase: (v) => v, fromBase: (v) => v },
      { key: "t", label: "Tonnes (t)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { key: "oz", label: "Onces (oz)", toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
      { key: "lb", label: "Livres (lb)", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    ],
  },
  volume: {
    label: "Volume",
    units: [
      { key: "ml", label: "Millilitres (ml)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { key: "cl", label: "Centilitres (cl)", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { key: "l", label: "Litres (L)", toBase: (v) => v, fromBase: (v) => v },
      { key: "m3", label: "Mètres cubes (m³)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { key: "tsp", label: "Cuillère à café (tsp)", toBase: (v) => v * 0.00492892, fromBase: (v) => v / 0.00492892 },
      { key: "tbsp", label: "Cuillère à soupe (tbsp)", toBase: (v) => v * 0.0147868, fromBase: (v) => v / 0.0147868 },
      { key: "cup", label: "Tasse (cup)", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
    ],
  },
  temperature: {
    label: "Température",
    units: [
      { key: "c", label: "Celsius (°C)", toBase: (v) => v, fromBase: (v) => v },
      { key: "f", label: "Fahrenheit (°F)", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { key: "k", label: "Kelvin (K)", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
};

export default function ConvertisseurPage() {
  const [category, setCategory] = useState<Category>("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("km");
  const [input, setInput] = useState("");

  const cat = conversions[category];
  const fromDef = cat.units.find((u) => u.key === fromUnit) ?? cat.units[0];
  const toDef = cat.units.find((u) => u.key === toUnit) ?? cat.units[1];
  const result = input !== "" ? toDef.fromBase(fromDef.toBase(parseFloat(input))) : null;

  function handleCategoryChange(c: Category) {
    setCategory(c);
    setFromUnit(conversions[c].units[0].key);
    setToUnit(conversions[c].units[1].key);
    setInput("");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">🔄 Convertisseur</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(conversions) as Category[]).map((c) => (
              <button key={c} onClick={() => handleCategoryChange(c)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category === c ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {conversions[c].label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valeur</label>
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">De</label>
              <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {cat.units.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vers</label>
              <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {cat.units.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
              </select>
            </div>
          </div>

          {result !== null && !isNaN(result) && (
            <div className="bg-indigo-50 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold text-indigo-700">
                {parseFloat(result.toPrecision(8)).toString()}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                {input} {fromDef.label} = {parseFloat(result.toPrecision(8))} {toDef.label}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
