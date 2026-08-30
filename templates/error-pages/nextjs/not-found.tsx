/**
 * TEMPLATE: Page 404 (not found)
 *
 * Utilisation Next.js : nommer le fichier `not-found.tsx` dans app/
 */

import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-bold text-indigo-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Page introuvable</h1>
        <p className="text-slate-500 mb-8">
          Désolé, la page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
            Retour à l&apos;accueil
          </Link>
          <Link href="/contact"
            className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors">
            Contacter le support
          </Link>
        </div>
      </div>
    </div>
  );
}
