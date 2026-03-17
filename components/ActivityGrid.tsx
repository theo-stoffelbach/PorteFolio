"use client";

import { useState, useEffect } from "react";
import { ActivityYear, Project } from "@/lib/types";

export default function ActivityGrid() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activityData, setActivityData] = useState<ActivityYear | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [hoveredWeek, setHoveredWeek] = useState<{
    projectId: string;
    weekNum: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [activityRes, projectsRes] = await Promise.all([
          fetch(`/api/activity/${selectedYear}`),
          fetch("/api/projects"),
        ]);

        const activity = await activityRes.json();
        const fetchedProjects = await projectsRes.json();

        setActivityData(activity);
        setAllProjects(fetchedProjects);
        setProjects(
          fetchedProjects.filter((p: Project) => p.year === selectedYear)
        );
      } catch (error) {
        console.error("Error fetching activity data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // Calculer les années disponibles à partir des projets existants
  const availableYears = Array.from(
    new Set(allProjects.map((p) => p.year))
  ).sort((a, b) => b - a);

  // Ajuster l'année sélectionnée si elle n'a pas de projets
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  const weeks = activityData?.weeks || [];

  const isProjectActiveInWeek = (
    projectId: string,
    weekNumber: number
  ): boolean => {
    const week = weeks.find((w) => w.week === weekNumber);
    return week ? week.projects.includes(projectId) : false;
  };

  const getProjectPhase = (projectId: string, weekNumber: number): string => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !project.phases) return "";

    const phase = project.phases.find((p) => p.week === weekNumber);
    return phase ? phase.phase : "";
  };

  return (
    <section className="py-16 bg-github-gray-light dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-github-gray-dark dark:text-white mb-8 text-center">
          Activité Projets
        </h2>

        <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-6 shadow-sm">
          {/* Header avec années à droite */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-github-gray-dark dark:text-gray-200">
              Contributions
            </h3>
            {availableYears.length > 0 && (
              <div className="flex gap-2">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      selectedYear === year
                        ? "bg-github-blue text-white"
                        : "text-github-gray hover:text-github-gray-dark dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-github-gray dark:text-gray-400">
              Chargement...
            </div>
          ) : availableYears.length === 0 ? (
            <div className="text-center py-12 text-github-gray dark:text-gray-400">
              Aucun projet pour le moment.
            </div>
          ) : weeks.length === 0 || projects.length === 0 ? (
            <div className="text-center py-12 text-github-gray dark:text-gray-400">
              Aucune activité pour cette année.
            </div>
          ) : (
            <>
              {/* Numéros de semaine en haut */}
              <div className="flex gap-3 mb-2">
                <div className="w-32 flex-shrink-0"></div>
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: weeks.length }, (_, i) => i + 1).map(
                    (weekNum, index) => (
                      <div
                        key={weekNum}
                        className="flex-1 flex flex-col items-center"
                      >
                        {(index + 1) % 10 === 0 && (
                          <div className="text-[6px] text-github-gray dark:text-gray-400">
                            {weekNum}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Chronologie par projet */}
              <div className="space-y-2">
                {projects.map((project) => (
                  <div key={project.id} className="flex gap-3 items-center">
                    {/* Nom du projet à gauche */}
                    <div className="w-32 flex-shrink-0 text-xs text-github-gray-dark dark:text-gray-200 truncate">
                      {project.title}
                    </div>

                    {/* Toutes les semaines de l'année pour ce projet */}
                    <div className="flex gap-1 flex-1">
                      {Array.from(
                        { length: weeks.length },
                        (_, i) => i + 1
                      ).map((weekNum) => {
                        const isActive = isProjectActiveInWeek(
                          project.id,
                          weekNum
                        );

                        return (
                          <div
                            key={weekNum}
                            className={`flex-1 aspect-square rounded-sm cursor-pointer hover:ring-2 hover:ring-gray-400 transition-all ${
                              !isActive ? "dark:bg-gray-700" : ""
                            }`}
                            style={{
                              backgroundColor: isActive
                                ? project.color
                                : "#ebedf0",
                            }}
                            onMouseEnter={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setHoveredWeek({
                                projectId: isActive ? project.id : "",
                                weekNum,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10,
                              });
                            }}
                            onMouseLeave={() => setHoveredWeek(null)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tooltip personnalisé */}
        {hoveredWeek && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: `${hoveredWeek.x}px`,
              top: `${hoveredWeek.y}px`,
            }}
          >
            <div className="px-3 py-2 text-xs bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-xl border border-gray-700 dark:border-gray-600 transform -translate-x-1/2 -translate-y-full mb-2">
              {hoveredWeek.projectId ? (
                <>
                  <div className="font-semibold text-sm mb-1">
                    {
                      projects.find((p) => p.id === hoveredWeek.projectId)
                        ?.title
                    }
                  </div>
                  <div className="text-gray-300 dark:text-gray-400">
                    📅 Semaine {hoveredWeek.weekNum}
                  </div>
                  {getProjectPhase(
                    hoveredWeek.projectId,
                    hoveredWeek.weekNum
                  ) && (
                    <div className="text-blue-300 dark:text-blue-400 mt-1 font-medium">
                      📋{" "}
                      {getProjectPhase(
                        hoveredWeek.projectId,
                        hoveredWeek.weekNum
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-300 dark:text-gray-400">
                  Semaine {hoveredWeek.weekNum}
                </div>
              )}
              {/* Flèche du tooltip */}
              <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                <div className="border-8 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
