"use client";

import { useState, useEffect } from "react";
import { Experience } from "@/lib/types";
import ExperienceEditModal from "@/components/admin/ExperienceEditModal";

export default function AdminExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const res = await fetch("/api/experiences");
      const data = await res.json();
      setExperiences(data);
    } catch (error) {
      console.error("Erreur lors du chargement des expériences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (experience: Experience) => {
    setSelectedExperience(experience);
    setIsModalOpen(true);
  };

  const handleSave = async (updatedExperience: Experience) => {
    try {
      const res = await fetch(`/api/experiences/${updatedExperience.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExperience),
      });

      if (res.ok) {
        setExperiences(
          experiences.map((exp) =>
            exp.id === updatedExperience.id ? updatedExperience : exp
          )
        );
        setIsModalOpen(false);
        setSelectedExperience(null);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
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
        Gestion des Expériences
      </h1>

      <div className="space-y-6">
        {experiences.map((experience, index) => (
          <div
            key={experience.id}
            className="relative bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Bulle avec crayon pour éditer */}
            <button
              onClick={() => handleEditClick(experience)}
              className="absolute -top-4 -left-4 w-10 h-10 bg-github-blue text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg hover:scale-110 transform duration-200"
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
            </button>

            {/* Contenu de l'expérience */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-github-blue dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {index + 1}
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-github-gray-dark dark:text-white">
                      {experience.position}
                    </h2>
                    <p className="text-lg text-github-gray dark:text-gray-300">
                      {experience.company}
                    </p>
                  </div>
                  <div className="text-sm text-github-gray dark:text-gray-300 font-medium">
                    {experience.duration}
                  </div>
                </div>

                <p className="text-github-gray-dark dark:text-gray-300 mb-4 leading-relaxed">
                  {experience.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {experience.technologies.map((tech) => (
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

      {/* Modal d'édition */}
      {isModalOpen && selectedExperience && (
        <ExperienceEditModal
          experience={selectedExperience}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedExperience(null);
          }}
        />
      )}
    </div>
  );
}
