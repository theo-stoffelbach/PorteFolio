"use client";

import { useState, useEffect } from "react";
import { Project } from "@/lib/types";
import Link from "next/link";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const deleteProject = async (id: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
        showToast("Projet supprimé avec succès !", "success");
      } else {
        showToast("Erreur lors de la suppression du projet", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showToast("Erreur lors de la suppression du projet", "error");
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
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-github-gray-dark dark:text-white">
          Gestion des Projets
        </h1>
        <button
          onClick={async () => {
            // Créer un nouveau projet avec les données par défaut
            const newProject: Project = {
              id: `projet-${Date.now()}`,
              title: "Nouveau Projet",
              description: "Description du projet",
              technologies: [],
              imageUrl: "",
              color: "#3b82f6",
              weeks: [],
              year: new Date().getFullYear(),
              featured: false,
            };

            try {
              // Créer le projet via l'API
              const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProject),
              });

              if (res.ok) {
                const createdProject = await res.json();
                setProjects([...projects, createdProject]);
                showToast("Projet créé avec succès !", "success");
                // Rediriger vers la page d'édition après un court délai
                setTimeout(() => {
                  window.location.href = `/admin/projects/${createdProject.id}`;
                }, 1000);
              } else {
                showToast("Erreur lors de la création du projet", "error");
              }
            } catch (error) {
              console.error("Erreur:", error);
              showToast("Erreur lors de la création du projet", "error");
            }
          }}
          className="px-6 py-3 bg-github-blue dark:bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
        >
          + Nouveau Projet
        </button>
      </div>

      <div className="space-y-6">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="relative bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Boutons d'action - En haut à droite */}
            <div className="absolute -top-4 -right-4 flex gap-2">
              {/* Bouton supprimer */}
              <button
                onClick={() => deleteProject(project.id, project.title)}
                className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg hover:scale-110 transform duration-200"
                title="Supprimer"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              {/* Bouton éditer */}
              <Link
                href={`/admin/projects/${project.id}`}
                className="w-10 h-10 bg-github-blue text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg hover:scale-110 transform duration-200"
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
            </div>

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
