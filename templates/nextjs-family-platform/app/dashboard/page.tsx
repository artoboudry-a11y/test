import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import ModuleCard from "@/components/ModuleCard";

const modules = [
  {
    href: "/dashboard/taches",
    icon: "✅",
    title: "Tâches",
    description: "Gérer les corvées et tâches familiales",
    color: "bg-blue-50 hover:bg-blue-100",
  },
  {
    href: "/dashboard/courses",
    icon: "🛒",
    title: "Courses",
    description: "Listes de courses partagées",
    color: "bg-green-50 hover:bg-green-100",
  },
  {
    href: "/dashboard/recettes",
    icon: "🍽️",
    title: "Recettes",
    description: "Recettes de cuisine en famille",
    color: "bg-orange-50 hover:bg-orange-100",
  },
  {
    href: "/dashboard/menu",
    icon: "📅",
    title: "Menu",
    description: "Planification des repas de la semaine",
    color: "bg-yellow-50 hover:bg-yellow-100",
  },
  {
    href: "/dashboard/budget",
    icon: "💰",
    title: "Budget",
    description: "Suivi des dépenses et revenus",
    color: "bg-emerald-50 hover:bg-emerald-100",
  },
  {
    href: "/dashboard/notes",
    icon: "📝",
    title: "Notes",
    description: "Notes et mémos partagés",
    color: "bg-purple-50 hover:bg-purple-100",
  },
  {
    href: "/dashboard/contacts",
    icon: "📞",
    title: "Contacts",
    description: "Contacts d'urgence importants",
    color: "bg-red-50 hover:bg-red-100",
  },
  {
    href: "/dashboard/convertisseur",
    icon: "🔄",
    title: "Convertisseur",
    description: "Convertir unités de mesure",
    color: "bg-sky-50 hover:bg-sky-100",
  },
  {
    href: "/dashboard/compresseur",
    icon: "🗜️",
    title: "Compresseur",
    description: "Compresser des images",
    color: "bg-slate-50 hover:bg-slate-100",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar session={session} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Bonjour, {session.user?.name?.split(" ")[0] ?? "vous"} 👋
          </h1>
          <p className="text-slate-500 mt-1">Que souhaitez-vous faire aujourd&apos;hui ?</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <ModuleCard key={mod.href} {...mod} />
          ))}
        </div>
      </main>
    </div>
  );
}
