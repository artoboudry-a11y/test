"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  notes?: string;
}

const RELATIONS = ["Médecin de famille", "Pédiatre", "Dentiste", "Urgences", "Police", "Pompiers", "SAMU", "Parent", "Voisin", "École", "Pharmacie", "Plombier", "Électricien", "Autre"];

const RELATION_ICONS: Record<string, string> = {
  "Médecin de famille": "🩺", "Pédiatre": "👶", "Dentiste": "🦷",
  "Urgences": "🚨", "Police": "👮", "Pompiers": "🚒", "SAMU": "🚑",
  "Parent": "👨‍👩‍👧", "Voisin": "🏠", "École": "🏫",
  "Pharmacie": "💊", "Plombier": "🔧", "Électricien": "⚡", "Autre": "📞",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editing, setEditing] = useState<Partial<Contact> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setContacts(data);
    setLoading(false);
  };

  const saveContact = async () => {
    if (!editing?.name?.trim() || !editing?.phone?.trim()) return;

    if (editing.id) {
      await fetch("/api/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      setContacts(contacts.map((c) => c.id === editing.id ? { ...c, ...editing } as Contact : c));
    } else {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relation: "Autre", ...editing }),
      });
      const contact = await res.json();
      setContacts([...contacts, contact]);
    }
    setEditing(null);
  };

  const deleteContact = async (id: string) => {
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setContacts(contacts.filter((c) => c.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const grouped = contacts.reduce((acc, c) => {
    const group = ["Urgences", "Police", "Pompiers", "SAMU"].includes(c.relation) ? "🆘 Urgences" : "📋 Contacts";
    if (!acc[group]) acc[group] = [];
    acc[group].push(c);
    return acc;
  }, {} as Record<string, Contact[]>);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">📞</span>
            <h1 className="font-bold text-slate-900">Contacts d&apos;urgence</h1>
          </div>
          <button
            onClick={() => setEditing({ name: "", phone: "", relation: "Autre", notes: "" })}
            className="ml-auto px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors"
          >
            + Ajouter
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex gap-6">
        {/* Liste contacts */}
        <div className="flex-1">
          {/* Numéros d'urgence fixes en France */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-3">🆘 Numéros nationaux</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "SAMU", number: "15" },
                { label: "Police", number: "17" },
                { label: "Pompiers", number: "18" },
                { label: "Urgences européen", number: "112" },
              ].map((n) => (
                <a key={n.number} href={`tel:${n.number}`} className="bg-white rounded-xl p-3 text-center border border-red-100 hover:border-red-300 transition-colors">
                  <p className="text-2xl font-bold text-red-600">{n.number}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.label}</p>
                </a>
              ))}
            </div>
          </div>

          {contacts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-3">📞</div>
              <p>Aucun contact — ajoutez vos contacts importants</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-6">
                <h3 className="text-sm font-semibold text-slate-500 mb-3">{group}</h3>
                <div className="space-y-2">
                  {items.map((contact) => (
                    <div
                      key={contact.id}
                      className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 shadow-sm group hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                        {RELATION_ICONS[contact.relation] ?? "📞"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800">{contact.name}</p>
                        <p className="text-xs text-slate-400">{contact.relation}</p>
                        {contact.notes && <p className="text-xs text-slate-400 mt-0.5 truncate">{contact.notes}</p>}
                      </div>
                      <a
                        href={`tel:${contact.phone}`}
                        className="font-semibold text-sky-600 hover:text-sky-800 text-sm"
                      >
                        {contact.phone}
                      </a>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditing({ ...contact })}
                          className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteContact(contact.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulaire */}
        {editing !== null && (
          <div className="w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-20 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">{editing.id ? "Modifier" : "Nouveau contact"}</h3>
              <div className="space-y-3">
                <input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Nom *" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <input value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="Téléphone *" type="tel" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" />
                <select value={editing.relation || "Autre"} onChange={(e) => setEditing({ ...editing, relation: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500">
                  {RELATIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
                <textarea value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="Notes (adresse, horaires...)" rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none" />
                <div className="flex gap-2">
                  <button onClick={saveContact} className="flex-1 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors">Enregistrer</button>
                  <button onClick={() => setEditing(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">Annuler</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
