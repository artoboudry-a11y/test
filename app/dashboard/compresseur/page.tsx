"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

interface ImageResult {
  name: string;
  originalSize: number;
  compressedSize: number;
  originalUrl: string;
  compressedUrl: string;
  width: number;
  height: number;
}

export default function CompresseurPage() {
  const [results, setResults] = useState<ImageResult[]>([]);
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
  };

  const compressImage = (file: File): Promise<ImageResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;

          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);

          const compressedUrl = canvas.toDataURL("image/jpeg", quality / 100);
          const byteString = atob(compressedUrl.split(",")[1]);
          const compressedSize = byteString.length;

          resolve({
            name: file.name,
            originalSize: file.size,
            compressedSize,
            originalUrl: e.target!.result as string,
            compressedUrl,
            width: w,
            height: h,
          });
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    setProcessing(true);
    const newResults = await Promise.all(imageFiles.map(compressImage));
    setResults((prev) => [...newResults, ...prev]);
    setProcessing(false);
  }, [quality, maxWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const downloadAll = () => {
    results.forEach((r) => {
      const a = document.createElement("a");
      a.href = r.compressedUrl;
      a.download = `compressed_${r.name.replace(/\.[^.]+$/, "")}.jpg`;
      a.click();
    });
  };

  const totalSaved = results.reduce((acc, r) => acc + (r.originalSize - r.compressedSize), 0);
  const avgRatio = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + (1 - r.compressedSize / r.originalSize) * 100, 0) / results.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">🗜️</span>
            <h1 className="font-bold text-slate-900">Compresseur d&apos;images</h1>
          </div>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">100% local, rien n&apos;est envoyé</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Paramètres */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">Paramètres de compression</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Qualité</label>
                <span className="text-sm font-bold text-indigo-600">{quality}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Petit fichier</span>
                <span>Haute qualité</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Largeur max</label>
                <span className="text-sm font-bold text-indigo-600">{maxWidth}px</span>
              </div>
              <input
                type="range"
                min={400}
                max={3840}
                step={40}
                value={maxWidth}
                onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>400px</span>
                <span>3840px (4K)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone de drop */}
        <div
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all mb-6 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && processFiles(e.target.files)}
          />
          {processing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500">Compression en cours...</p>
            </div>
          ) : (
            <>
              <div className="text-5xl mb-3">🖼️</div>
              <p className="font-semibold text-slate-700">Glissez vos images ici</p>
              <p className="text-sm text-slate-400 mt-1">ou cliquez pour sélectionner — JPG, PNG, WebP acceptés</p>
            </>
          )}
        </div>

        {/* Stats globales */}
        {results.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{avgRatio}%</p>
                <p className="text-xs text-slate-500 mt-1">Réduction moyenne</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{formatSize(totalSaved)}</p>
                <p className="text-xs text-slate-500 mt-1">Espace économisé</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{results.length}</p>
                <p className="text-xs text-slate-500 mt-1">Images traitées</p>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">Résultats</h3>
              <div className="flex gap-2">
                <button
                  onClick={downloadAll}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Tout télécharger
                </button>
                <button
                  onClick={() => setResults([])}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                >
                  Effacer
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {results.map((r, i) => {
                const saved = Math.round((1 - r.compressedSize / r.originalSize) * 100);
                return (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.compressedUrl} alt={r.name} className="w-16 h-16 object-cover rounded-xl" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate text-sm">{r.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.width} × {r.height}px</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500">{formatSize(r.originalSize)}</span>
                        <span className="text-xs text-slate-300">→</span>
                        <span className="text-xs font-medium text-emerald-600">{formatSize(r.compressedSize)}</span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">-{saved}%</span>
                      </div>
                    </div>
                    <a
                      href={r.compressedUrl}
                      download={`compressed_${r.name.replace(/\.[^.]+$/, "")}.jpg`}
                      className="px-4 py-2 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 rounded-xl text-sm font-medium transition-colors"
                    >
                      ↓ Télécharger
                    </a>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
