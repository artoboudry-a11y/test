"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { Session } from "next-auth";

interface NavbarProps {
  session: Session;
}

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-indigo-600 text-lg"
          >
            🏠 Famille
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">
              {session.user?.name ?? session.user?.email}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
