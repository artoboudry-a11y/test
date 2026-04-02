"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked: boolean;
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
}

export default function CoursesPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadLists() {
    const res = await fetch("/api/courses");
    if (res.ok) {
      const data = await res.json();
      setLists(data);
      if (data.length > 0 && !activeList) setActiveList(data[0]);
    }
    setLoading(false);
  }

  useEffect(() => { loadLists(); }, []);

  async function createList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName }),
    });
    if (res.ok) {
      const list = await res.json();
      setNewListName("");
      setActiveList(list);
      loadLists();
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim() || !activeList) return;
    setSaving(true);
    await fetch("/api/courses/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: activeList.id, name: newItem, quantity: newQty }),
    });
    setNewItem(""); setNewQty("");
    setSaving(false);
    loadLists();
  }

  async function toggleItem(itemId: string, checked: boolean) {
    await fetch("/api/courses/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, checked: !checked }),
    });
    loadLists();
  }

  async function deleteItem(itemId: string) {
    await fetch("/api/courses/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    });
    loadLists();
  }

  const current = lists.find((l) => l.id === activeList?.id) ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">🛒 Courses</h1>
        </div>

        <form onSubmit={createList} className="flex gap-2 mb-6">
          <input value={newListName} onChange={(e) => setNewListName(e.target.value)}
            placeholder="Nouvelle liste..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
            Créer
          </button>
        </form>

        {lists.length > 1 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {lists.map((l) => (
              <button key={l.id} onClick={() => setActiveList(l)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeList?.id === l.id ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {l.name}
              </button>
            ))}
          </div>
        )}

        {current && (
          <>
            <form onSubmit={addItem} className="flex gap-2 mb-4">
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
                placeholder="Ajouter un article..."
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input value={newQty} onChange={(e) => setNewQty(e.target.value)}
                placeholder="Qté"
                className="w-20 px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="submit" disabled={saving}
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-medium transition-colors">
                +
              </button>
            </form>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {current.items.length === 0 ? (
                <p className="text-slate-400 text-center p-8">Liste vide.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {current.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                      <input type="checkbox" checked={item.checked}
                        onChange={() => toggleItem(item.id, item.checked)}
                        className="w-5 h-5 accent-indigo-600 cursor-pointer" />
                      <span className={`flex-1 ${item.checked ? "line-through text-slate-400" : "text-slate-900"}`}>
                        {item.name}
                      </span>
                      {item.quantity && <span className="text-slate-400 text-sm">{item.quantity}</span>}
                      <button onClick={() => deleteItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {loading && <p className="text-slate-500 text-center">Chargement...</p>}
      </div>
    </div>
  );
}
