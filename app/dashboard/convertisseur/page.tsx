"use client";

import { useState } from "react";
import Link from "next/link";

type Category = "longueur" | "poids" | "temperature" | "surface" | "volume" | "vitesse" | "monnaie";

const conversions: Record<Category, { label: string; icon: string; units: { id: string; label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[] }> = {
  longueur: {
    label: "Longueur",
    icon: "📏",
    units: [
      { id: "mm", label: "Millimètres (mm)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: "cm", label: "Centimètres (cm)", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: "m", label: "Mètres (m)", toBase: (v) => v, fromBase: (v) => v },
      { id: "km", label: "Kilomètres (km)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "in", label: "Pouces (in)", toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: "ft", label: "Pieds (ft)", toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: "yd", label: "Yards (yd)", toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: "mi", label: "Miles (mi)", toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
  },
  poids: {
    label: "Poids",
    icon: "⚖️",
    units: [
      { id: "mg", label: "Milligrammes (mg)", toBase: (v) => v / 1_000_000, fromBase: (v) => v * 1_000_000 },
      { id: "g", label: "Grammes (g)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: "kg", label: "Kilogrammes (kg)", toBase: (v) => v, fromBase: (v) => v },
      { id: "t", label: "Tonnes (t)", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "oz", label: "Onces (oz)", toBase: (v) => v * 0.028349, fromBase: (v) => v / 0.028349 },
      { id: "lb", label: "Livres (lb)", toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    ],
  },
  temperature: {
    label: "Température",
    icon: "🌡️",
    units: [
      { id: "C", label: "Celsius (°C)", toBase: (v) => v, fromBase: (v) => v },
      { id: "F", label: "Fahrenheit (°F)", toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { id: "K", label: "Kelvin (K)", toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  surface: {
    label: "Surface",
    icon: "🔲",
    units: [
      { id: "cm2", label: "cm²", toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
      { id: "m2", label: "m²", toBase: (v) => v, fromBase: (v) => v },
      { id: "km2", label: "km²", toBase: (v) => v * 1_000_000, fromBase: (v) => v / 1_000_000 },
      { id: "ha", label: "Hectares (ha)", toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      { id: "ft2", label: "Pieds² (ft²)", toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: "ac", label: "Acres (ac)", toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
    ],
  },
  volume: {
    label: "Volume",
    icon: "🧪",
    units: [
      { id: "ml", label: "Millilitres (ml)", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: "cl", label: "Centilitres (cl)", toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: "l", label: "Litres (l)", toBase: (v) => v, fromBase: (v) => v },
      { id: "m3", label: "m³", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: "tsp", label: "Cuillères à café", toBase: (v) => v * 0.00492892, fromBase: (v) => v / 0.00492892 },
      { id: "tbsp", label: "Cuillères à soupe", toBase: (v) => v * 0.0147868, fromBase: (v) => v / 0.0147868 },
      { id: "cup", label: "Tasses (cup US)", toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
      { id: "gal", label: "Gallons US", toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    ],
  },
  vitesse: {
    label: "Vitesse",
    icon: "🚀",
    units: [
      { id: "ms", label: "m/s", toBase: (v) => v, fromBase: (v) => v },
      { id: "kmh", label: "km/h", toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: "mph", label: "Miles/h (mph)", toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: "kn", label: "Nœuds (kn)", toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
  },
  monnaie: {
    label: "Monnaie",
    icon: "💶",
    units: [
      { id: "EUR", label: "Euro (€)", toBase: (v) => v, fromBase: (v) => v },
      { id: "USD", label: "Dollar US ($)", toBase: (v) => v / 1.08, fromBase: (v) => v * 1.08 },
      { id: "GBP", label: "Livre sterling (£)", toBase: (v) => v / 0.86, fromBase: (v) => v * 0.86 },
      { id: "CHF", label: "Franc suisse (CHF)", toBase: (v) => v / 0.98, fromBase: (v) => v * 0.98 },
      { id: "CAD", label: "Dollar canadien (CAD)", toBase: (v) => v / 1.47, fromBase: (v) => v * 1.47 },
      { id: "MAD", label: "Dirham marocain (MAD)", toBase: (v) => v / 10.8, fromBase: (v) => v * 10.8 },
      { id: "JPY", label: "Yen japonais (¥)", toBase: (v) => v / 160, fromBase: (v) => v * 160 },
    ],
  },
};

export default function ConvertisseurPage() {
  const [category, setCategory] = useState<Category>("longueur");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("km");
  const [inputValue, setInputValue] = useState("1");

  const cat = conversions[category];
  const from = cat.units.find((u) => u.id === fromUnit) ?? cat.units[0];
  const to = cat.units.find((u) => u.id === toUnit) ?? cat.units[1];

  const numVal = parseFloat(inputValue) || 0;
  const result = to.fromBase(from.toBase(numVal));

  const formatResult = (n: number) => {
    if (Math.abs(n) >= 1e9 || (Math.abs(n) < 0.0001 && n !== 0)) return n.toExponential(4);
    return parseFloat(n.toPrecision(8)).toString();
  };

  const handleCategoryChange = (c: Category) => {
    setCategory(c);
    setFromUnit(conversions[c].units[0].id);
    setToUnit(conversions[c].units[1].id);
    setInputValue("1");
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            <h1 className="font-bold text-slate-900">Convertisseur</h1>
          </div>
          {category === "monnaie" && (
            <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Taux approximatifs</span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Catégories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(Object.keys(conversions) as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => handleCategoryChange(c)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                category === c
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              <span>{conversions[c].icon}</span>
              {conversions[c].label}
            </button>
          ))}
        </div>

        {/* Convertisseur principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* De */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">De</label>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
              >
                {cat.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            {/* Swap */}
            <button
              onClick={swap}
              className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center transition-colors text-indigo-600 shrink-0 mt-4 sm:mt-5"
            >
              ⇄
            </button>

            {/* Vers */}
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Vers</label>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
              >
                {cat.units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
              <div className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <span className="text-2xl font-bold text-indigo-700">{formatResult(result)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau de toutes les conversions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-slate-600">{numVal} {from.label} =</span>
          </div>
          <div className="divide-y divide-slate-50">
            {cat.units.filter((u) => u.id !== fromUnit).map((u) => {
              const val = u.fromBase(from.toBase(numVal));
              return (
                <div key={u.id} className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                  <span className="text-sm text-slate-600">{u.label}</span>
                  <span className="font-semibold text-slate-900">{formatResult(val)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
