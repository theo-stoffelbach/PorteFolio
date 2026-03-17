"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function AdminNavbar() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setLoading(false);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-github-border dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Title et Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-github-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <h1 className="text-xl font-bold text-github-gray-dark dark:text-white">
                Admin Panel
              </h1>
            </Link>

            {/* Menu items */}
            <div className="flex gap-6">
              <Link
                href="/admin"
                className="text-github-gray dark:text-gray-400 hover:text-github-gray-dark dark:hover:text-white font-semibold transition-colors"
              >
                Accueil
              </Link>
              <Link
                href="/admin/experiences"
                className="text-github-gray dark:text-gray-400 hover:text-github-gray-dark dark:hover:text-white font-semibold transition-colors"
              >
                Expériences
              </Link>
              <Link
                href="/admin/projects"
                className="text-github-gray dark:text-gray-400 hover:text-github-gray-dark dark:hover:text-white font-semibold transition-colors"
              >
                Projets
              </Link>
            </div>
          </div>

          {/* Right side - Logout button */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>
      </div>
    </nav>
  );
}
