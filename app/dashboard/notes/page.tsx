"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const NOTE_COLORS = [
  { id: "yellow", bg: "bg-yellow-50", border: "border-yellow-200", dot: "bg-yellow-400" },
  { id: "blue", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400" },
  { id: "green", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-400" },
  { id: "pink", bg: "bg-pink-50", border: "border-pink-200", dot: "bg-pink-400" },
  { id: "purple", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-400" },
  { id: "orange", bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-400" },
];

const colorFor = (id: string) => NOTE_COLORS.find((c) => c.id === id) ?? NOTE_COLORS[0];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Partial<Note> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchNotes(); }, []);

  const fetchNotes = async () => {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data);
    setLoading(false);
  };

  const saveNote = async () => {
    if (!editing?.title?.trim() && !editing?.content?.trim()) return;

    if (editing.id) {
      await fetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      setNotes((prev) => prev.map((n) => n.id === editing.id ? { ...n, ...editing, updatedAt: new Date().toISOString() } as Note : n));
    } else {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editing.title || "Sans titre", content: editing.content || "", color: editing.color || "yellow" }),
      });
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
    }
    setEditing(null);
  };

  const deleteNote = async (id: string) => {
    await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  const togglePin = async (note: Note) => {
    await fetch("/api/notes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: note.id, pinned: !note.pinned }),
    });
    setNotes((prev) => prev.map((n) => n.id === note.id ? { ...n, pinned: !n.pinned } : n).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)));
  };

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <h1 className="font-bold text-slate-900">Notes</h1>
          </div>
          <div className="flex-1 max-w-xs ml-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button
            onClick={() => setEditing({ title: "", content: "", color: "yellow" })}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-xl text-sm font-medium transition-colors"
          >
            + Nouvelle note
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-6">
        {/* Grille de notes */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-slate-500 font-medium">Aucune note — créez-en une !</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {filtered.map((note) => {
                const c = colorFor(note.color);
                return (
                  <div
                    key={note.id}
                    className={`break-inside-avoid rounded-2xl border ${c.bg} ${c.border} p-4 cursor-pointer hover:shadow-md transition-shadow group`}
                    onClick={() => setEditing({ ...note })}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-800 text-sm leading-snug flex-1 pr-2">{note.title || "Sans titre"}</h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                          className={`text-lg leading-none ${note.pinned ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
                        >
                          📌
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                          className="text-slate-400 hover:text-red-500 transition-colors text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    {note.pinned && <span className="text-xs text-slate-400 block mb-1">📌 Épinglée</span>}
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <p className="text-xs text-slate-400 mt-3">
                      {new Date(note.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Éditeur */}
        {editing !== null && (
          <div className="w-80 shrink-0">
            <div className={`rounded-2xl border ${colorFor(editing.color || "yellow").bg} ${colorFor(editing.color || "yellow").border} p-5 sticky top-20`}>
              <input
                value={editing.title || ""}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Titre"
                className="w-full bg-transparent font-semibold text-slate-800 placeholder-slate-400 border-none outline-none mb-3 text-base"
              />
              <textarea
                value={editing.content || ""}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                placeholder="Votre note..."
                rows={8}
                className="w-full bg-transparent text-sm text-slate-700 placeholder-slate-400 border-none outline-none resize-none leading-relaxed"
              />

              {/* Couleurs */}
              <div className="flex gap-2 mt-3 mb-4">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setEditing({ ...editing, color: c.id })}
                    className={`w-6 h-6 rounded-full ${c.dot} transition-transform ${editing.color === c.id ? "scale-125 ring-2 ring-offset-1 ring-slate-400" : "hover:scale-110"}`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveNote}
                  className="flex-1 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-white transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
