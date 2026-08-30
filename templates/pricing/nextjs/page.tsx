/**
 * TEMPLATE: Page tarifs / pricing
 *
 * Sections :
 * - 3 plans (Gratuit, Pro, Entreprise)
 * - Toggle mensuel/annuel
 * - FAQ
 *
 * Personnalisation :
 * - PLANS[] : modifier les offres
 * - FAQ_ITEMS[] : questions/réponses
 */

"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    name: "Gratuit",
    price: { monthly: 0, yearly: 0 },
    description: "Pour découvrir",
    features: ["1 utilisateur", "100 Mo stockage", "Support communauté", "Fonctions de base"],
    cta: "Commencer",
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: 12, yearly: 9 },
    description: "Pour les professionnels",
    features: ["5 utilisateurs", "10 Go stockage", "Support prioritaire", "Toutes les fonctions", "API access", "Export PDF"],
    cta: "Essai gratuit 14 jours",
    popular: true,
  },
  {
    name: "Entreprise",
    price: { monthly: 49, yearly: 39 },
    description: "Pour les grandes équipes",
    features: ["Utilisateurs illimités", "100 Go stockage", "Support dédié 24/7", "Toutes les fonctions", "SSO / SAML", "SLA garanti"],
    cta: "Contacter les ventes",
    popular: false,
  },
];

const FAQ_ITEMS = [
  { q: "Puis-je changer de plan à tout moment ?", a: "Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Le changement prend effet immédiatement." },
  { q: "Y a-t-il un engagement ?", a: "Non, aucun engagement. Vous pouvez annuler votre abonnement quand vous le souhaitez." },
  { q: "Comment fonctionne l'essai gratuit ?", a: "L'essai Pro de 14 jours est sans carte bancaire. Vous passez automatiquement en Gratuit à la fin." },
  { q: "Quels moyens de paiement acceptez-vous ?", a: "Carte bancaire (Visa, Mastercard, Amex) et prélèvement SEPA pour les plans annuels." },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Tarifs simples et transparents</h1>
          <p className="text-lg text-slate-500">Pas de frais cachés. Changez de plan quand vous voulez.</p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!yearly ? "text-slate-900" : "text-slate-400"}`}>Mensuel</span>
            <button onClick={() => setYearly(!yearly)}
              className={`relative w-14 h-8 rounded-full transition-colors ${yearly ? "bg-indigo-600" : "bg-slate-300"}`}>
              <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${yearly ? "translate-x-6" : ""}`} />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-slate-900" : "text-slate-400"}`}>
              Annuel <span className="text-green-600">-25%</span>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className={`rounded-2xl border p-8 ${plan.popular ? "border-indigo-300 bg-indigo-50 shadow-lg relative" : "border-slate-200 bg-white shadow-sm"}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                  Le plus populaire
                </span>
              )}
              <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
              <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  {yearly ? plan.price.yearly : plan.price.monthly}€
                </span>
                {plan.price.monthly > 0 && <span className="text-slate-500 text-sm"> / mois</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                plan.popular
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between text-slate-900 font-medium">
                  {item.q}
                  <span className="text-slate-400 text-lg">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <p className="px-5 pb-4 text-slate-600 text-sm">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
