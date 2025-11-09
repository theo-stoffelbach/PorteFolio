import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-github-gray-light dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-bold text-github-gray-dark dark:text-white mb-4">
          404
        </h1>
        <p className="text-2xl font-semibold text-github-gray dark:text-gray-300 mb-4">
          Expérience non trouvée
        </p>
        <p className="text-github-gray dark:text-gray-400 mb-8 text-lg">
          Désolé, l'expérience que vous recherchez n'existe pas.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/experiences"
            className="px-6 py-3 bg-github-blue text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Voir toutes les expériences
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-github-blue text-github-blue dark:text-blue-400 dark:border-blue-400 rounded-lg font-semibold hover:bg-github-blue hover:bg-opacity-10 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
