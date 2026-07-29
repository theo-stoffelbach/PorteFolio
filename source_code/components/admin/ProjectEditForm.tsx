"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import { parseProjectBasicInput } from "@/lib/projectForm";
import PhaseManager from "@/components/admin/PhaseManager";

interface ProjectEditFormProps {
  project: Project;
  onSave: (project: Project) => void;
  saving: boolean;
}

export default function ProjectEditForm({
  project: initialProject,
  onSave,
  saving,
}: ProjectEditFormProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "phases">(
    "basic"
  );
  const [weeksInput, setWeeksInput] = useState<string>(
    initialProject.weeks.join(", ")
  );

  const handleBasicChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const parsedValue = parseProjectBasicInput(
      name,
      type,
      value,
      (e.target as HTMLInputElement).checked
    );
    setProject((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleTechnologiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const technologies = e.target.value.split(",").map((tech) => tech.trim());
    setProject((prev) => ({
      ...prev,
      technologies,
    }));
  };

  const handleWeeksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setWeeksInput(inputValue);

    // Parser les semaines depuis l'input
    const weeks: number[] = [];
    if (inputValue.trim()) {
      const parts = inputValue.split(/[,;]/).map(p => p.trim()).filter(p => p);
      parts.forEach(part => {
        const num = parseInt(part);
        if (!isNaN(num)) {
          weeks.push(num);
        }
      });
    }

    // Créer automatiquement les phases correspondantes aux semaines
    const existingWeeks = new Set(project.phases?.map(p => p.week) || []);
    let newPhases = [...(project.phases || [])];

    // Ajouter les nouvelles phases pour les semaines qui n'existent pas
    weeks.forEach(week => {
      if (!existingWeeks.has(week)) {
        newPhases.push({
          week,
          phase: `Phase Semaine ${week}`,
          description: "",
        });
      }
    });

    // Supprimer les phases dont la semaine n'est plus dans la liste
    newPhases = newPhases.filter(phase => weeks.includes(phase.week));

    setProject((prev) => ({
      ...prev,
      weeks: weeks.length > 0 ? weeks.sort((a, b) => a - b) : [],
      phases: newPhases,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave(project);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-github-border dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === "basic"
              ? "border-github-blue text-github-blue dark:text-blue-400"
              : "border-transparent text-github-gray dark:text-gray-400 hover:text-github-gray-dark dark:hover:text-gray-300"
          }`}
        >
          Informations de base
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === "details"
              ? "border-github-blue text-github-blue dark:text-blue-400"
              : "border-transparent text-github-gray dark:text-gray-400 hover:text-github-gray-dark dark:hover:text-gray-300"
          }`}
        >
          Détails
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("phases")}
          className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === "phases"
              ? "border-github-blue text-github-blue dark:text-blue-400"
              : "border-transparent text-github-gray dark:text-gray-400 hover:text-github-gray-dark dark:hover:text-gray-300"
          }`}
        >
          Phases
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Basic Tab */}
        {activeTab === "basic" && (
          <div className="space-y-6 bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                Titre
              </label>
              <input
                type="text"
                name="title"
                value={project.title}
                onChange={handleBasicChange}
                className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                Description courte
              </label>
              <textarea
                name="description"
                value={project.description}
                onChange={handleBasicChange}
                rows={4}
                className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue resize-none"
                required
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                URL de l'image
              </label>
              <input
                type="text"
                name="imageUrl"
                value={project.imageUrl}
                onChange={handleBasicChange}
                className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                Année
              </label>
              <input
                type="number"
                name="year"
                value={project.year}
                onChange={handleBasicChange}
                className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
                required
              />
            </div>

            {/* Featured */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="featured"
                id="featured"
                checked={project.featured || false}
                onChange={handleBasicChange}
                className="w-5 h-5 border border-github-border rounded cursor-pointer"
              />
              <label
                htmlFor="featured"
                className="font-semibold text-github-gray-dark dark:text-white cursor-pointer"
              >
                En vedette
              </label>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="space-y-6 bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8">
            {/* Technologies */}
            <div>
              <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                Technologies (séparées par des virgules)
              </label>
              <input
                type="text"
                value={project.technologies.join(", ")}
                onChange={handleTechnologiesChange}
                className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
                placeholder="React, Node.js, TypeScript"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                Couleur
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  name="color"
                  value={project.color}
                  onChange={handleBasicChange}
                  className="h-12 w-20 border border-github-border rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="color"
                  value={project.color}
                  onChange={handleBasicChange}
                  className="flex-1 px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Weeks */}
            <div>
              <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                Semaines du projet (séparées par des virgules)
              </label>
              <p className="text-sm text-github-gray dark:text-gray-400 mb-2">
                En ajoutant des semaines ici, les phases correspondantes seront créées automatiquement dans l'onglet Phases
              </p>
              <input
                type="text"
                value={weeksInput}
                onChange={handleWeeksChange}
                className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
                placeholder="1, 2, 3, 4, 5, 6"
              />
            </div>

            {/* Project URL */}
            <div>
              <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                URL du projet (optionnel)
              </label>
              <input
                type="text"
                name="projectUrl"
                value={project.projectUrl || ""}
                onChange={handleBasicChange}
                className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
                placeholder="https://..."
              />
            </div>
          </div>
        )}

        {/* Phases Tab */}
        {activeTab === "phases" && (
          <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-8">
            <PhaseManager
              phases={project.phases}
              onPhasesChange={(phases) => {
                // Synchroniser les semaines avec les phases
                const weeksFromPhases = phases.map(p => p.week).sort((a, b) => a - b);
                setWeeksInput(weeksFromPhases.join(", "));

                setProject((prev) => ({
                  ...prev,
                  phases,
                  weeks: weeksFromPhases,
                }));
              }}
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 bg-github-blue text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Sauvegarde en cours..." : "Sauvegarder les modifications"}
        </button>
      </div>
    </form>
  );
}
