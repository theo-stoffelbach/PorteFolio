export default function AdminPage() {
  return (
    <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Placeholder cards */}
          <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-6">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-6">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-6">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-6">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-github-gray-dark dark:text-white mb-6">
            Bienvenue dans le panel d'administration
          </h2>
          <p className="text-github-gray dark:text-gray-400 text-lg">
            Le panel d'administration est en cours de construction.
            <br />
            Les fonctionnalités seront ajoutées bientôt.
          </p>
        </div>
    </main>
  );
}
