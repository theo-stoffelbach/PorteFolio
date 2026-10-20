"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <main className="min-h-screen flex items-center justify-center bg-desk px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-block mb-6 font-extrabold text-cream underline-offset-4 hover:text-start hover:underline"
        >
          Retour au site
        </Link>
        <div className="bg-paper text-cobalt-deep rounded p-8 shadow-[10px_10px_0_var(--desk-ink)] [--focus-ring:var(--framboise-ink)]">
          <h1 className="font-display text-3xl text-cobalt mb-2">
            Accès admin
          </h1>
          <p className="mb-8">
            Connectez-vous pour accéder au panel d'administration.
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block font-pixel text-sm text-framboise-ink mb-2">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-cobalt rounded-md bg-white text-cobalt-deep placeholder:text-cobalt-light focus:outline-none focus:ring-4 focus:ring-framboise-ink"
                placeholder="votre@email.com"
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block font-pixel text-sm text-framboise-ink mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-cobalt rounded-md bg-white text-cobalt-deep placeholder:text-cobalt-light focus:outline-none focus:ring-4 focus:ring-framboise-ink"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Error message */}
            {error && (
              <div role="alert" className="p-4 border-2 border-framboise-ink rounded-md bg-white">
                <p className="text-framboise-ink font-extrabold text-sm">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-12 px-4 py-3 rounded-[14px] bg-cobalt text-paper font-display shadow-[inset_0_3px_0_var(--cobalt-light),inset_0_-4px_0_var(--cobalt-deep)] hover:bg-cobalt-mid active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
