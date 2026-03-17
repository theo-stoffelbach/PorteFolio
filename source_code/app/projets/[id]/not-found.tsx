import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-github-gray-light dark:bg-gray-900 flex items-center justify-center py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="text-6xl font-bold text-github-blue dark:text-blue-400 mb-4">
          404
        </div>
        <h1 className="text-3xl font-bold text-github-gray-dark dark:text-white mb-4">
          Projet introuvable
        </h1>
        <p className="text-github-gray dark:text-gray-300 mb-8">
          Le projet que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/projets"
            className="px-6 py-3 bg-github-blue dark:bg-blue-600 text-white rounded-md hover:bg-opacity-90 transition-colors font-medium"
          >
            Voir tous les projets
          </Link>
          <Link
            href="/"
            className="px-6 py-3 bg-white dark:bg-gray-800 text-github-gray-dark dark:text-white border border-github-border dark:border-gray-700 rounded-md hover:bg-github-gray-light dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
