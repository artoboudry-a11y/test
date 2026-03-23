interface ModuleCardProps {
  icon: string;
  title: string;
  description: string;
  href?: string;
  available?: boolean;
  color?: string;
}

export default function ModuleCard({
  icon,
  title,
  description,
  href,
  available = false,
  color = "indigo",
}: ModuleCardProps) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
    sky: "bg-sky-100 text-sky-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    teal: "bg-teal-100 text-teal-600",
  };

  const iconColor = colorMap[color] ?? colorMap["indigo"];

  const card = (
    <div
      className={`group relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm transition-all duration-200 ${
        available
          ? "hover:shadow-md hover:-translate-y-1 cursor-pointer"
          : "opacity-70 cursor-default"
      }`}
    >
      <div className={`inline-flex p-3 rounded-xl ${iconColor} mb-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      {!available && (
        <span className="absolute top-4 right-4 text-xs bg-slate-100 text-slate-400 px-2 py-1 rounded-full">
          Bientôt
        </span>
      )}
    </div>
  );

  if (available && href) {
    return <a href={href}>{card}</a>;
  }

  return card;
}
