"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  note: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/contacts");
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, relation, note }),
    });
    setName(""); setPhone(""); setRelation(""); setNote("");
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">📞 Contacts d&apos;urgence</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom *" required
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Téléphone *" required
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Relation (médecin, école...)"
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note"
              className="px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors">
            {saving ? "Enregistrement..." : "Ajouter le contact"}
          </button>
        </form>

        <div className="space-y-3">
          {loading ? (
            <p className="text-slate-500 text-center">Chargement...</p>
          ) : contacts.length === 0 ? (
            <p className="text-slate-400 text-center">Aucun contact enregistré.</p>
          ) : contacts.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start justify-between">
              <div className="flex gap-4 items-start">
                <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {c.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <a href={`tel:${c.phone}`} className="text-indigo-600 hover:underline text-sm">{c.phone}</a>
                  {c.relation && <p className="text-slate-400 text-xs mt-0.5">{c.relation}</p>}
                  {c.note && <p className="text-slate-500 text-sm mt-1">{c.note}</p>}
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
