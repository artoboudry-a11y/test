/**
 * TEMPLATE: Landing page / page d'accueil
 *
 * Sections :
 * - Hero avec CTA
 * - Fonctionnalités (grille 3 colonnes)
 * - Témoignages
 * - CTA final
 * - Footer
 *
 * Personnalisation :
 * - APP_NAME, HERO_TITLE, HERO_SUBTITLE
 * - features[], testimonials[]
 * - Couleurs : chercher "indigo"
 */

import Link from "next/link";

const APP_NAME = "MonApp";
const HERO_TITLE = "La solution simple pour votre quotidien";
const HERO_SUBTITLE = "Gérez tout au même endroit. Simple, rapide, efficace.";

const features = [
  { icon: "⚡", title: "Rapide", description: "Interface réactive et fluide, chargement instantané." },
  { icon: "🔒", title: "Sécurisé", description: "Vos données sont chiffrées et protégées." },
  { icon: "📱", title: "Mobile", description: "Fonctionne parfaitement sur tous vos appareils." },
  { icon: "🎨", title: "Personnalisable", description: "Adaptez l'outil à vos besoins." },
  { icon: "🤝", title: "Collaboratif", description: "Travaillez ensemble en temps réel." },
  { icon: "📊", title: "Statistiques", description: "Suivez votre progression avec des tableaux clairs." },
];

const testimonials = [
  { name: "Marie L.", role: "Entrepreneure", text: "Cet outil a transformé ma façon de travailler. Je recommande à 100%." },
  { name: "Thomas R.", role: "Développeur", text: "Simple, efficace, et le support est excellent. Exactement ce dont j'avais besoin." },
  { name: "Sophie M.", role: "Designer", text: "L'interface est magnifique et intuitive. Un vrai plaisir à utiliser." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="font-bold text-xl text-indigo-600">{APP_NAME}</span>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:block">Fonctionnalités</Link>
            <Link href="#testimonials" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:block">Témoignages</Link>
            <Link href="/auth" className="text-sm px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
              Commencer
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium mb-6">
          ✨ Nouveau — Version 2.0 disponible
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
          {HERO_TITLE}
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          {HERO_SUBTITLE}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-lg transition-colors shadow-lg shadow-indigo-200">
            Commencer gratuitement
          </Link>
          <Link href="#features" className="px-8 py-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-lg transition-colors">
            En savoir plus
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-500 text-lg">Des outils puissants, une interface simple.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Ce qu&apos;en disent nos utilisateurs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="text-slate-700 mb-4 italic">&quot;{t.text}&quot;</p>
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Prêt à commencer ?</h2>
          <p className="text-indigo-200 text-lg mb-8">Rejoignez des milliers d&apos;utilisateurs satisfaits.</p>
          <Link href="/auth" className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl text-lg hover:bg-indigo-50 transition-colors">
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-white">{APP_NAME}</span>
          <div className="flex gap-6 text-sm">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-sm">© 2026 {APP_NAME}</p>
        </div>
      </footer>
    </div>
  );
}
