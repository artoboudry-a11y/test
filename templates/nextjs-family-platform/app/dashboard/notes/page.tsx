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
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#fef9c3");
  const [saving, setSaving] = useState(false);

  const COLORS = ["#fef9c3", "#dcfce7", "#dbeafe", "#fce7f3", "#f3e8ff", "#ffedd5"];

  async function load() {
    const res = await fetch("/api/notes");
    if (res.ok) setNotes(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, color }),
    });
    setTitle("");
    setContent("");
    setColor("#fef9c3");
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">📝 Notes</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de la note"
            className="w-full text-lg font-medium border-none outline-none mb-3 placeholder:text-slate-400"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contenu..."
            rows={3}
            className="w-full border-none outline-none resize-none text-slate-700 placeholder:text-slate-400"
          />
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? "border-slate-600 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? "..." : "Ajouter"}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-slate-500 text-center">Chargement...</p>
        ) : notes.length === 0 ? (
          <p className="text-slate-400 text-center">Aucune note pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl p-5 shadow-sm relative group"
                style={{ backgroundColor: note.color }}
              >
                <h3 className="font-semibold text-slate-900 mb-2">{note.title}</h3>
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{note.content}</p>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
