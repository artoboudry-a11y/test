/**
 * TEMPLATE: Page d'erreur globale (500, etc.)
 *
 * Utilisation Next.js : nommer le fichier `error.tsx` dans app/
 * Doit être un Client Component
 */

"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Oups, une erreur est survenue</h1>
        <p className="text-slate-500 mb-8">
          Nous rencontrons un problème technique. Veuillez réessayer.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={reset}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
            Réessayer
          </button>
          <a href="/"
            className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors">
            Retour à l&apos;accueil
          </a>
        </div>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-8 text-left bg-slate-100 p-4 rounded-xl text-xs text-red-600 overflow-auto max-h-40">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
