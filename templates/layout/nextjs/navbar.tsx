/**
 * TEMPLATE: Navbar responsive
 *
 * Fonctionnalités :
 * - Logo + liens
 * - Menu hamburger sur mobile
 * - Bouton CTA
 * - Fond glassmorphism sticky
 *
 * Personnalisation :
 * - APP_NAME, NAV_LINKS[], CTA_HREF
 */

"use client";

import { useState } from "react";
import Link from "next/link";

const APP_NAME = "MonApp";
const NAV_LINKS = [
  { label: "Accueil", href: "/" },
  { label: "Fonctionnalités", href: "#features" },
  { label: "Tarifs", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];
const CTA_HREF = "/auth";
const CTA_LABEL = "Commencer";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-indigo-600">{APP_NAME}</Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href={CTA_HREF} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              {CTA_LABEL}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
            <span className="text-xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href={CTA_HREF} onClick={() => setOpen(false)}
              className="block px-3 py-2 bg-indigo-600 text-white rounded-lg text-center font-medium">
              {CTA_LABEL}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
