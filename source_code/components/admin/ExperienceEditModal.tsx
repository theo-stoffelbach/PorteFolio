"use client";

import { useState } from "react";
import { Experience } from "@/lib/types";

interface ExperienceEditModalProps {
  experience: Experience;
  onSave: (experience: Experience) => void;
  onClose: () => void;
}

export default function ExperienceEditModal({
  experience,
  onSave,
  onClose,
}: ExperienceEditModalProps) {
  const [formData, setFormData] = useState<Experience>(experience);
  const [technologiesInput, setTechnologiesInput] = useState(
    experience.technologies.join(", ")
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTechnologiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setTechnologiesInput(inputValue);
    const technologies = inputValue
      .split(",")
      .map((tech) => tech.trim())
      .filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      technologies,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-github-border dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-github-gray-dark dark:text-white">
            Éditer l'expérience
          </h2>
          <button
            onClick={onClose}
            className="text-github-gray dark:text-gray-400 hover:text-github-gray-dark dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Position */}
          <div>
            <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
              Poste
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
              required
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
              Entreprise
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
              Durée
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue resize-none"
              required
            />
          </div>

          {/* Technologies */}
          <div>
            <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
              Technologies (séparées par des virgules)
            </label>
            <input
              type="text"
              value={technologiesInput}
              onChange={handleTechnologiesChange}
              className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
              placeholder="React, Node.js, TypeScript"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
              Localisation
            </label>
            <input
              type="text"
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
              Description complète (optionnel)
            </label>
            <textarea
              name="fullDescription"
              value={formData.fullDescription || ""}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end border-t border-github-border dark:border-gray-700 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-github-border dark:border-gray-600 text-github-gray-dark dark:text-white rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-github-blue text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
