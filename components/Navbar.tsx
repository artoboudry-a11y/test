"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() ?? "U";

  return (
    <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-lg">🏠</span>
          </div>
          <span className="font-bold text-slate-900 text-lg hidden sm:block">
            Ma Plateforme
          </span>
        </div>

        {/* Avatar + menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt="Avatar"
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {initials}
              </div>
            )}
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {user.name ?? user.email}
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">
                  {user.name ?? "Utilisateur"}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth" })}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
