import { Project } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

async function getProject(id: string): Promise<Project | null> {
  try {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/projects/${id}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching project:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return {
      title: "Projet non trouvé",
    };
  }

  return {
    title: `${project.title} - Théo Stoffelbach`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-github-gray-light dark:bg-gray-900 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 text-sm text-github-gray dark:text-gray-400">
          <Link
            href="/"
            className="hover:text-github-blue dark:hover:text-blue-400"
          >
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link
            href="/projets"
            className="hover:text-github-blue dark:hover:text-blue-400"
          >
            Projets
          </Link>
          <span className="mx-2">/</span>
          <span className="text-github-gray-dark dark:text-white">
            {project.title}
          </span>
        </div>

        {/* Titre */}
        <h1 className="text-4xl font-bold text-github-gray-dark dark:text-white mb-4">
          {project.title}
        </h1>

        {/* Technologies */}
        <div className="flex flex-wrap gap-2 mb-8">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 text-sm font-medium bg-github-blue dark:bg-blue-600 text-white rounded-md"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Image */}
        <div className="relative w-full h-96 bg-github-gray-light dark:bg-gray-700 rounded-lg overflow-hidden mb-8">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Contenu */}
        <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-github-gray-dark dark:text-white mb-4">
            À propos du projet
          </h2>
          <p className="text-github-gray-dark dark:text-gray-300 leading-relaxed mb-8">
            {project.description}
          </p>

          {/* Timeline du projet avec descriptions */}
          {project.phases && project.phases.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold text-github-gray-dark dark:text-white mb-6">
                Déroulement du projet
              </h2>
              <div className="space-y-6 mb-8">
                {(() => {
                  // Fusionner les phases consécutives de même type
                  const mergedPhases: Array<{
                    phase: string;
                    weekStart: number;
                    weekEnd: number;
                    descriptions: string[];
                  }> = [];

                  project.phases.forEach((phase) => {
                    const lastMerged = mergedPhases[mergedPhases.length - 1];

                    if (
                      lastMerged &&
                      lastMerged.phase === phase.phase &&
                      lastMerged.weekEnd === phase.week - 1
                    ) {
                      // Fusionner avec la phase précédente
                      lastMerged.weekEnd = phase.week;
                      if (phase.description) {
                        lastMerged.descriptions.push(phase.description);
                      }
                    } else {
                      // Nouvelle phase
                      mergedPhases.push({
                        phase: phase.phase,
                        weekStart: phase.week,
                        weekEnd: phase.week,
                        descriptions: phase.description
                          ? [phase.description]
                          : [],
                      });
                    }
                  });

                  // Icône selon la phase
                  const getPhaseIcon = (phaseName: string) => {
                    if (phaseName.includes("Initialisation")) return "🔍";
                    if (phaseName.includes("Développement")) return "💻";
                    if (phaseName.includes("Tests")) return "🧪";
                    if (phaseName.includes("Déploiement")) return "🚀";
                    return "📋";
                  };

                  return mergedPhases.map((merged, index) => (
                    <div
                      key={index}
                      className="relative pl-8 pb-8 border-l-2 border-github-blue dark:border-blue-500 last:pb-0"
                    >
                      {/* Point sur la ligne */}
                      <div className="absolute left-[-9px] top-0 w-4 h-4 bg-github-blue dark:bg-blue-500 rounded-full border-4 border-white dark:border-gray-800"></div>

                      {/* Badge semaine(s) */}
                      <div className="inline-flex items-center px-3 py-1 bg-github-blue dark:bg-blue-600 text-white text-xs font-semibold rounded-full mb-2">
                        {merged.weekStart === merged.weekEnd
                          ? `Semaine ${merged.weekStart}`
                          : `Semaines ${merged.weekStart} à ${merged.weekEnd}`}
                      </div>

                      {/* Phase avec icône */}
                      <h3 className="text-xl font-semibold text-github-gray-dark dark:text-white mb-3 flex items-center gap-2">
                        <span className="text-2xl">
                          {getPhaseIcon(merged.phase)}
                        </span>
                        {merged.phase}
                      </h3>

                      {/* Description(s) */}
                      {merged.descriptions.length > 0 ? (
                        <div className="space-y-3">
                          {merged.descriptions.map((desc, descIndex) => (
                            <p
                              key={descIndex}
                              className="text-github-gray dark:text-gray-300 leading-relaxed"
                            >
                              {desc}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-github-gray dark:text-gray-400 italic">
                          Aucune description disponible pour cette phase.
                        </p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </>
          )}

          {/* Informations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-github-gray dark:text-gray-400 mb-2">
                Année
              </h3>
              <p className="text-github-gray-dark dark:text-white font-medium">
                {project.year}
              </p>
            </div>

            {project.weeks && (
              <div>
                <h3 className="text-sm font-semibold text-github-gray dark:text-gray-400 mb-2">
                  Durée
                </h3>
                <p className="text-github-gray-dark dark:text-white font-medium">
                  {project.weeks.length} semaine
                  {project.weeks.length > 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          {/* Lien externe */}
          {project.projectUrl && (
            <div className="mt-8 pt-8 border-t border-github-border dark:border-gray-700">
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-github-blue dark:bg-blue-600 text-white rounded-md hover:bg-opacity-90 transition-colors font-medium"
              >
                Voir sur GitHub
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Bouton retour */}
        <div className="mt-8">
          <Link
            href="/projets"
            className="inline-flex items-center text-github-blue dark:text-blue-400 hover:underline"
          >
            ← Retour aux projets
          </Link>
        </div>
      </div>
    </div>
  );
}
