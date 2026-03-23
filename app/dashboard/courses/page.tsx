"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  category: string;
  checked: boolean;
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
}

const CATEGORIES = ["Fruits & Légumes", "Viandes & Poissons", "Produits laitiers", "Épicerie", "Boissons", "Surgelés", "Hygiène", "Autre"];

export default function CoursesPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newItem, setNewItem] = useState({ name: "", quantity: "", category: "Autre" });
  const [loading, setLoading] = useState(true);
  const [showNewList, setShowNewList] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    const res = await fetch("/api/courses");
    const data = await res.json();
    setLists(data);
    if (data.length > 0 && !activeList) setActiveList(data[0]);
    setLoading(false);
  };

  const createList = async () => {
    if (!newListName.trim()) return;
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName }),
    });
    const list = await res.json();
    setLists([list, ...lists]);
    setActiveList(list);
    setNewListName("");
    setShowNewList(false);
  };

  const deleteList = async (id: string) => {
    await fetch("/api/courses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const updated = lists.filter((l) => l.id !== id);
    setLists(updated);
    setActiveList(updated[0] ?? null);
  };

  const addItem = async () => {
    if (!newItem.name.trim() || !activeList) return;
    const res = await fetch("/api/courses/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: activeList.id, ...newItem }),
    });
    const item = await res.json();
    const updated = lists.map((l) =>
      l.id === activeList.id ? { ...l, items: [...l.items, item] } : l
    );
    setLists(updated);
    setActiveList({ ...activeList, items: [...activeList.items, item] });
    setNewItem({ name: "", quantity: "", category: "Autre" });
  };

  const toggleItem = async (item: ShoppingItem) => {
    await fetch("/api/courses/items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, checked: !item.checked }),
    });
    const updateItems = (items: ShoppingItem[]) =>
      items.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i));
    const updated = lists.map((l) =>
      l.id === activeList?.id ? { ...l, items: updateItems(l.items) } : l
    );
    setLists(updated);
    if (activeList) setActiveList({ ...activeList, items: updateItems(activeList.items) });
  };

  const deleteItem = async (itemId: string) => {
    await fetch("/api/courses/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId }),
    });
    const filterItems = (items: ShoppingItem[]) => items.filter((i) => i.id !== itemId);
    const updated = lists.map((l) =>
      l.id === activeList?.id ? { ...l, items: filterItems(l.items) } : l
    );
    setLists(updated);
    if (activeList) setActiveList({ ...activeList, items: filterItems(activeList.items) });
  };

  const groupedItems = activeList
    ? activeList.items.reduce(
        (acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        },
        {} as Record<string, ShoppingItem[]>
      )
    : {};

  const checkedCount = activeList?.items.filter((i) => i.checked).length ?? 0;
  const totalCount = activeList?.items.length ?? 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h1 className="font-bold text-slate-900">Liste de courses</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar listes */}
        <div className="w-56 shrink-0">
          <button
            onClick={() => setShowNewList(true)}
            className="w-full mb-3 py-2 px-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 justify-center"
          >
            <span>+</span> Nouvelle liste
          </button>

          {showNewList && (
            <div className="mb-3 flex gap-2">
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createList()}
                placeholder="Nom de la liste"
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button onClick={createList} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm">✓</button>
            </div>
          )}

          <div className="space-y-1">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => setActiveList(list)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between group ${
                  activeList?.id === list.id
                    ? "bg-emerald-50 text-emerald-700 font-medium"
                    : "hover:bg-slate-100 text-slate-600"
                }`}
              >
                <span className="truncate">{list.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">{list.items.length}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 ml-1 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              </button>
            ))}
          </div>

          {lists.length === 0 && (
            <p className="text-sm text-slate-400 text-center mt-4">Aucune liste</p>
          )}
        </div>

        {/* Contenu liste */}
        <div className="flex-1">
          {activeList ? (
            <>
              {/* Barre de progression */}
              <div className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-slate-900">{activeList.name}</h2>
                  <span className="text-sm text-slate-500">{checkedCount}/{totalCount} articles</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : "0%" }}
                  ></div>
                </div>
              </div>

              {/* Ajouter un article */}
              <div className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 shadow-sm">
                <div className="flex gap-2">
                  <input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    placeholder="Ajouter un article..."
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="Qté"
                    className="w-20 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <button
                    onClick={addItem}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>
              </div>

              {/* Articles par catégorie */}
              {Object.keys(groupedItems).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3">🛒</div>
                  <p>Liste vide — ajoutez vos articles !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{category}</span>
                      </div>
                      {items.map((item) => (
                        <div key={item.id} className={`flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 ${item.checked ? "bg-slate-50" : ""}`}>
                          <button
                            onClick={() => toggleItem(item)}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              item.checked ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"
                            }`}
                          >
                            {item.checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                          </button>
                          <span className={`flex-1 text-sm ${item.checked ? "line-through text-slate-400" : "text-slate-700"}`}>
                            {item.name}
                          </span>
                          {item.quantity && (
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{item.quantity}</span>
                          )}
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-4">🛒</div>
              <p className="font-medium">Créez votre première liste de courses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
