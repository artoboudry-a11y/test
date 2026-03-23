import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ModuleCard from "@/components/ModuleCard";

const modules = [
  {
    icon: "🛒",
    title: "Liste de courses",
    description: "Gérez vos courses en famille, partagez et cochez en temps réel.",
    href: "/dashboard/courses",
    available: false,
    color: "emerald",
  },
  {
    icon: "🔄",
    title: "Convertisseur",
    description: "Convertissez des unités, des devises, des températures et plus encore.",
    href: "/dashboard/convertisseur",
    available: false,
    color: "indigo",
  },
  {
    icon: "🗜️",
    title: "Compresseur",
    description: "Compressez vos images et fichiers PDF facilement.",
    href: "/dashboard/compresseur",
    available: false,
    color: "amber",
  },
  {
    icon: "📅",
    title: "Agenda familial",
    description: "Organisez les événements et rendez-vous de toute la famille.",
    href: "/dashboard/agenda",
    available: false,
    color: "rose",
  },
  {
    icon: "📝",
    title: "Notes",
    description: "Gardez vos idées, recettes et mémos accessibles partout.",
    href: "/dashboard/notes",
    available: false,
    color: "sky",
  },
  {
    icon: "💰",
    title: "Budget",
    description: "Suivez vos dépenses et gérez votre budget mensuel.",
    href: "/dashboard/budget",
    available: false,
    color: "purple",
  },
  {
    icon: "🍽️",
    title: "Menu de la semaine",
    description: "Planifiez vos repas et générez automatiquement votre liste de courses.",
    href: "/dashboard/menu",
    available: false,
    color: "orange",
  },
  {
    icon: "⚙️",
    title: "Paramètres",
    description: "Gérez les membres de la famille, les accès et les préférences.",
    href: "/dashboard/settings",
    available: false,
    color: "teal",
  },
];

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth");
  }

  const firstName = session.user?.name?.split(" ")[0] ?? "vous";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={session.user ?? {}} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* En-tête */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-slate-900">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-slate-500 mt-2">
            Bienvenue sur votre plateforme familiale. Que voulez-vous faire aujourd&apos;hui ?
          </p>
        </div>

        {/* Bannière de bienvenue */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-10 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚀</div>
            <div>
              <h3 className="font-bold text-lg">La plateforme se construit progressivement !</h3>
              <p className="text-indigo-100 text-sm mt-1">
                De nouveaux modules seront ajoutés au fur et à mesure. Pour l&apos;instant,
                découvrez ce qui est prévu et dites-nous ce que vous voulez en priorité.
              </p>
            </div>
          </div>
        </div>

        {/* Grille de modules */}
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-4">
            Modules disponibles
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modules.map((mod) => (
              <ModuleCard key={mod.title} {...mod} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-400 text-sm">
          <p>Plateforme familiale — privée et sécurisée</p>
        </div>
      </main>
    </div>
  );
}
