import ActivityGrid from "@/components/ActivityGrid";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/lib/types";

async function getAllProjects(): Promise<Project[]> {
  try {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/projects`,
      {
        cache: "no-store",
      }
    );
    return await res.json();
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export default async function ProjetsPage() {
  const projects = await getAllProjects();

  // Grouper par année
  const projectsByYear = projects.reduce((acc, project) => {
    if (!acc[project.year]) {
      acc[project.year] = [];
    }
    acc[project.year].push(project);
    return acc;
  }, {} as Record<number, Project[]>);

  // Filtrer uniquement les années qui ont des projets
  const years = Object.keys(projectsByYear)
    .map(Number)
    .filter((year) => projectsByYear[year].length > 0)
    .sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-github-gray-light dark:bg-gray-900 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-github-gray-dark dark:text-white mb-12 text-center">
          Mes Projets
        </h1>

        {/* Grille GitHub */}
        <div className="mb-16">
          <ActivityGrid />
        </div>

        {/* Liste des projets par année - N'affiche que les années avec des projets */}
        {years.length > 0 ? (
          <div className="space-y-12">
            {years.map((year) => (
              <div key={year}>
                <h2 className="text-2xl font-bold text-github-gray-dark dark:text-white mb-6">
                  {year}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projectsByYear[year].map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-github-gray dark:text-gray-400">
            Aucun projet pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
