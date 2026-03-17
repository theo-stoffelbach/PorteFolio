"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Erreur de connexion");
        setLoading(false);
        return;
      }

      // Redirection vers le panel admin
      router.push("/admin");
    } catch (err) {
      setError("Une erreur est survenue");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-github-gray-light dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-github-gray-dark dark:text-white mb-2 text-center">
            Accès Admin
          </h1>
          <p className="text-github-gray dark:text-gray-400 text-center mb-8">
            Connectez-vous pour accéder au panel d'administration
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue dark:focus:ring-blue-500"
                placeholder="votre@email.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue dark:focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-github-blue text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm text-github-gray dark:text-gray-400 mt-8">
            Demande d'accès ? Contactez l'administrateur
          </p>
        </div>
      </div>
    </div>
  );
}
