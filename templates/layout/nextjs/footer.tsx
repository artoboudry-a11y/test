/**
 * TEMPLATE: Footer responsive
 *
 * Sections :
 * - Logo + description
 * - Colonnes de liens
 * - Copyright
 *
 * Personnalisation :
 * - APP_NAME, FOOTER_COLUMNS[]
 */

import Link from "next/link";

const APP_NAME = "MonApp";

const FOOTER_COLUMNS = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "API", href: "/api-docs" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Mentions légales", href: "/legal" },
      { label: "Confidentialité", href: "/privacy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Marque */}
          <div>
            <span className="text-white font-bold text-xl block mb-3">{APP_NAME}</span>
            <p className="text-sm leading-relaxed">La solution simple pour votre quotidien. Rejoignez des milliers d&apos;utilisateurs satisfaits.</p>
          </div>
          {/* Colonnes */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm hover:text-white transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© 2026 {APP_NAME}. Tous droits réservés.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/legal" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
