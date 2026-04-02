import Link from "next/link";

interface ModuleCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  color?: string;
}

export default function ModuleCard({
  href,
  icon,
  title,
  description,
  color = "bg-indigo-50 hover:bg-indigo-100",
}: ModuleCardProps) {
  return (
    <Link
      href={href}
      className={`${color} rounded-2xl p-6 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 border border-transparent hover:border-indigo-100`}
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <h2 className="font-semibold text-slate-900 text-lg">{title}</h2>
        <p className="text-slate-500 text-sm mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
