import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ModuleCard from "@/components/ModuleCard";

const modules = [
  {
    icon: "🛒",
    title: "Liste de courses",
    description: "Gérez vos courses en famille, créez plusieurs listes et cochez les articles.",
    href: "/dashboard/courses",
    available: true,
    color: "emerald",
  },
  {
    icon: "🔄",
    title: "Convertisseur",
    description: "Convertissez des unités, devises, températures, volumes et bien plus.",
    href: "/dashboard/convertisseur",
    available: true,
    color: "indigo",
  },
  {
    icon: "🗜️",
    title: "Compresseur d'images",
    description: "Compressez vos photos en glisser-déposer. 100% local, rien n'est envoyé.",
    href: "/dashboard/compresseur",
    available: true,
    color: "amber",
  },
  {
    icon: "📝",
    title: "Notes",
    description: "Mémos colorés pour toute la famille — recettes, idées, listes de choses à faire.",
    href: "/dashboard/notes",
    available: true,
    color: "sky",
  },
  {
    icon: "🍽️",
    title: "Menu de la semaine",
    description: "Planifiez les repas du lundi au dimanche, semaine par semaine.",
    href: "/dashboard/menu",
    available: true,
    color: "orange",
  },
  {
    icon: "💰",
    title: "Budget",
    description: "Suivez vos revenus et dépenses par mois et par catégorie.",
    href: "/dashboard/budget",
    available: true,
    color: "purple",
  },
  {
    icon: "👨‍🍳",
    title: "Recettes",
    description: "Votre livre de recettes familiales avec ingrédients et étapes de préparation.",
    href: "/dashboard/recettes",
    available: true,
    color: "rose",
  },
  {
    icon: "📞",
    title: "Contacts d'urgence",
    description: "Numéros importants toujours accessibles : médecin, urgences, école...",
    href: "/dashboard/contacts",
    available: true,
    color: "sky",
  },
  {
    icon: "🧹",
    title: "Tâches ménagères",
    description: "Organisez et suivez les corvées quotidiennes, hebdomadaires et mensuelles.",
    href: "/dashboard/taches",
    available: true,
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

  const availableCount = modules.filter((m) => m.available).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={session.user ?? {}} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* En-tête */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-slate-500 mt-2">
            Votre plateforme familiale — {availableCount} outils disponibles
          </p>
        </div>

        {/* Grille de modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <ModuleCard key={mod.title} {...mod} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-400 text-sm">
          <p>Plateforme familiale — privée et sécurisée</p>
        </div>
      </main>
    </div>
  );
}
