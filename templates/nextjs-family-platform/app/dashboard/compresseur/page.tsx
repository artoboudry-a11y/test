"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function CompresseurPage() {
  const [original, setOriginal] = useState<{ file: File; url: string; size: number } | null>(null);
  const [compressed, setCompressed] = useState<{ url: string; size: number } | null>(null);
  const [quality, setQuality] = useState(80);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginal({ file, url: URL.createObjectURL(file), size: file.size });
    setCompressed(null);
  }

  async function compress() {
    if (!original) return;
    setProcessing(true);
    const img = new Image();
    img.src = original.url;
    await new Promise((resolve) => (img.onload = resolve));
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCompressed({ url: URL.createObjectURL(blob), size: blob.size });
        }
        setProcessing(false);
      },
      "image/jpeg",
      quality / 100
    );
  }

  function download() {
    if (!compressed || !original) return;
    const a = document.createElement("a");
    a.href = compressed.url;
    a.download = `compressed_${original.file.name.replace(/\.[^/.]+$/, "")}.jpg`;
    a.click();
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  }

  const savings = original && compressed
    ? Math.round((1 - compressed.size / original.size) * 100)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600">←</Link>
          <h1 className="text-2xl font-bold text-slate-900">🗜️ Compresseur d&apos;images</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
          >
            <p className="text-4xl mb-2">🖼️</p>
            <p className="text-slate-600 font-medium">Cliquez pour sélectionner une image</p>
            <p className="text-slate-400 text-sm mt-1">JPEG, PNG, WebP — max 20 Mo</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {original && (
            <>
              <div className="flex items-center gap-4">
                <img src={original.url} alt="original" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                <div>
                  <p className="font-medium text-slate-900">{original.file.name}</p>
                  <p className="text-sm text-slate-500">Taille originale : {formatSize(original.size)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Qualité : {quality}%
                </label>
                <input
                  type="range" min={10} max={100} value={quality}
                  onChange={(e) => { setQuality(parseInt(e.target.value)); setCompressed(null); }}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Petite taille</span>
                  <span>Haute qualité</span>
                </div>
              </div>

              <button onClick={compress} disabled={processing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition-colors">
                {processing ? "Compression en cours..." : "Compresser"}
              </button>
            </>
          )}

          {compressed && original && (
            <div className="bg-green-50 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-4">
                <img src={compressed.url} alt="compressed" className="w-20 h-20 rounded-lg object-cover border border-green-200" />
                <div>
                  <p className="font-medium text-slate-900">Image compressée</p>
                  <p className="text-sm text-slate-600">
                    {formatSize(original.size)} → <strong>{formatSize(compressed.size)}</strong>
                  </p>
                  {savings !== null && (
                    <p className="text-green-600 font-semibold text-sm">−{savings}% de taille</p>
                  )}
                </div>
              </div>
              <button onClick={download}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
                Télécharger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
