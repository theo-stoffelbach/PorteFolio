import { Experience } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getExperience(id: string): Promise<Experience | null> {
  try {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/experiences`,
      {
        cache: "no-store",
      }
    );
    const experiences: Experience[] = await res.json();
    return experiences.find((exp) => exp.id === id) || null;
  } catch (error) {
    console.error("Error fetching experience:", error);
    return null;
  }
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const experience = await getExperience(params.id);

  if (!experience) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-github-gray-light dark:bg-gray-900">
      {/* En-tête avec retour */}
      <div className="border-b border-github-border dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/experiences"
            className="inline-flex items-center gap-2 text-github-blue dark:text-blue-400 hover:underline mb-4"
          >
            ← Retour aux expériences
          </Link>
          <h1 className="text-4xl font-bold text-github-gray-dark dark:text-white">
            {experience.position}
          </h1>
          <p className="text-xl text-github-gray dark:text-gray-300 mt-2">
            {experience.company}
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Colonne latérale avec infos clés */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-6 space-y-6 sticky top-24">
              {/* Période */}
              <div>
                <h3 className="text-sm font-semibold text-github-gray-dark dark:text-gray-400 uppercase tracking-wide mb-2">
                  Période
                </h3>
                <p className="text-lg font-semibold text-github-gray-dark dark:text-white">
                  {experience.duration}
                </p>
              </div>

              {/* Localisation */}
              {experience.location && (
                <div>
                  <h3 className="text-sm font-semibold text-github-gray-dark dark:text-gray-400 uppercase tracking-wide mb-2">
                    Localisation
                  </h3>
                  <p className="text-github-gray-dark dark:text-gray-300">
                    {experience.location}
                  </p>
                </div>
              )}

              {/* Technologies */}
              <div>
                <h3 className="text-sm font-semibold text-github-gray-dark dark:text-gray-400 uppercase tracking-wide mb-3">
                  Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {experience.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-sm bg-github-blue bg-opacity-10 dark:bg-blue-900 dark:bg-opacity-30 text-github-blue dark:text-blue-300 rounded-md font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="md:col-span-2 space-y-8">
            {/* Description générale */}
            <section className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-github-gray-dark dark:text-white mb-4">
                À propos de ce rôle
              </h2>
              <p className="text-github-gray-dark dark:text-gray-300 leading-relaxed text-lg">
                {experience.fullDescription || experience.description}
              </p>
            </section>

            {/* Responsabilités */}
            {experience.responsibilities && experience.responsibilities.length > 0 && (
              <section className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-github-gray-dark dark:text-white mb-6">
                  Responsabilités
                </h2>
                <ul className="space-y-3">
                  {experience.responsibilities.map((responsibility, index) => (
                    <li key={index} className="flex gap-3 text-github-gray-dark dark:text-gray-300">
                      <span className="text-github-blue dark:text-blue-400 font-bold mt-1">✓</span>
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Accomplissements */}
            {experience.achievements && experience.achievements.length > 0 && (
              <section className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-github-gray-dark dark:text-white mb-6">
                  Accomplissements
                </h2>
                <ul className="space-y-3">
                  {experience.achievements.map((achievement, index) => (
                    <li key={index} className="flex gap-3 text-github-gray-dark dark:text-gray-300">
                      <span className="text-yellow-500 font-bold mt-1">★</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Appel à l'action */}
            <div className="flex gap-4">
              <Link
                href="/experiences"
                className="flex-1 px-6 py-3 bg-github-blue text-white rounded-lg font-semibold text-center hover:bg-blue-600 transition-colors"
              >
                Voir toutes les expériences
              </Link>
              <Link
                href="/"
                className="flex-1 px-6 py-3 border border-github-blue text-github-blue dark:text-blue-400 dark:border-blue-400 rounded-lg font-semibold text-center hover:bg-github-blue hover:bg-opacity-10 transition-colors"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
