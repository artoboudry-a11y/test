/**
 * TEMPLATE: Sidebar réutilisable (collapsible)
 *
 * Props :
 * - items: tableau de liens {icon, label, href, badge?}
 * - appName: nom de l'app
 * - user: {name, role, initials}
 *
 * Personnalisation :
 * - Ajouter des sections, changer les couleurs
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  icon: string;
  label: string;
  href: string;
  badge?: number;
}

interface SidebarProps {
  appName?: string;
  items: SidebarItem[];
  user?: { name: string; role: string; initials: string };
}

export default function Sidebar({ appName = "MonApp", items, user }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={`${collapsed ? "w-20" : "w-64"} bg-white border-r border-slate-200 flex flex-col transition-all duration-200 shrink-0 h-screen sticky top-0`}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!collapsed && <span className="font-bold text-indigo-600 text-lg truncate">{appName}</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0">
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}>
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
              {item.badge != null && !collapsed && (
                <span className="ml-auto text-xs bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
              {user.initials}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
