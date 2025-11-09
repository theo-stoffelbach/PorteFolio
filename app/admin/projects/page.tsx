"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/types";
import Link from "next/link";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Erreur lors du chargement des projets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-github-gray dark:text-gray-400">
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-github-gray-dark dark:text-white mb-8">
        Gestion des Projets
      </h1>

      <div className="space-y-6">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="relative bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Bulle avec crayon pour éditer - En haut à droite */}
            <Link
              href={`/admin/projects/${project.id}`}
              className="absolute -top-4 -right-4 w-10 h-10 bg-github-blue text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg hover:scale-110 transform duration-200"
              title="Éditer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </Link>

            {/* Contenu du projet */}
            <div className="flex items-start gap-6">
              {/* Image du projet */}
              <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                {project.imageUrl && (
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Infos du projet */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-github-gray-dark dark:text-white">
                      {project.title}
                    </h2>
                    <p className="text-sm text-github-gray dark:text-gray-400 mt-1">
                      {project.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.featured && (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 dark:bg-opacity-30 text-yellow-700 dark:text-yellow-300 text-sm font-semibold rounded-full">
                        ⭐ En vedette
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-github-gray-dark dark:text-gray-300 mb-4 leading-relaxed line-clamp-2">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-sm bg-github-gray-light dark:bg-gray-700 text-github-gray-dark dark:text-gray-200 rounded-md font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-github-gray dark:text-gray-400 text-lg">
            Aucun projet trouvé
          </p>
        </div>
      )}
    </div>
  );
}
