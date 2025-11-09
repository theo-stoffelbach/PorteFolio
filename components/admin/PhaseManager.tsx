"use client";

import { useState } from "react";
import { ProjectPhase } from "@/lib/types";

interface PhaseManagerProps {
  phases: ProjectPhase[] | undefined;
  onPhasesChange: (phases: ProjectPhase[]) => void;
}

const EMOJIS = [
  "🚀",
  "💡",
  "🎯",
  "🛠️",
  "🔧",
  "📝",
  "✅",
  "🧪",
  "🐛",
  "🎨",
  "💻",
  "📊",
  "🔍",
  "🚢",
  "⚡",
  "🌟",
  "📈",
  "🔐",
  "🌐",
  "🎬",
  "👥",
  "💼",
  "🎓",
  "📱",
  "🖥️",
  "⚙️",
  "🔄",
  "📦",
  "🎁",
  "🏆",
  "🎪",
  "🎭",
  "🎸",
  "🎬",
  "📚",
  "📖",
  "✏️",
  "📐",
  "🔬",
  "🧬",
  "🎮",
  "🕹️",
  "🎲",
  "🃏",
  "🎰",
  "🚁",
  "✈️",
  "🚂",
  "🚗",
  "🏠",
];

export default function PhaseManager({ phases = [], onPhasesChange }: PhaseManagerProps) {
  const [localPhases, setLocalPhases] = useState<ProjectPhase[]>(phases);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  const [emojiOpen, setEmojiOpen] = useState<number | null>(null);

  const handleAddPhase = () => {
    const maxWeek = localPhases.length > 0 ? Math.max(...localPhases.map(p => p.week)) : 0;
    const newPhase: ProjectPhase = {
      week: maxWeek + 1,
      phase: "Nouvelle phase",
      description: "",
    };
    const updated = [...localPhases, newPhase];
    setLocalPhases(updated);
    onPhasesChange(updated);
  };

  const handleDeletePhase = (index: number) => {
    const updated = localPhases.filter((_, i) => i !== index);
    setLocalPhases(updated);
    onPhasesChange(updated);
  };

  const handlePhaseChange = (
    index: number,
    field: keyof ProjectPhase,
    value: string | number
  ) => {
    const updated = [...localPhases];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setLocalPhases(updated);
    onPhasesChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Liste des phases */}
      <div className="space-y-3">
        {localPhases.map((phase, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-700 border border-github-border dark:border-gray-600 rounded-lg overflow-hidden"
          >
            {/* Header clickable */}
            <button
              onClick={() =>
                setExpandedPhase(expandedPhase === index ? null : index)
              }
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <div className="flex-shrink-0 w-10 h-10 bg-github-blue dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {phase.emoji || phase.week}
                </div>
                <div>
                  <h3 className="font-semibold text-github-gray-dark dark:text-white">
                    {phase.phase}
                  </h3>
                  <p className="text-sm text-github-gray dark:text-gray-400 line-clamp-1">
                    {phase.description || "Pas de description"}
                  </p>
                </div>
              </div>

              {/* Chevron */}
              <svg
                className={`w-5 h-5 text-github-gray dark:text-gray-400 transition-transform ${
                  expandedPhase === index ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>

            {/* Content - Expanded */}
            {expandedPhase === index && (
              <div className="px-6 py-4 border-t border-github-border dark:border-gray-600 space-y-4 bg-gray-50 dark:bg-gray-800">
                {/* Emoji Picker */}
                <div>
                  <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                    Émoji
                  </label>
                  <div className="relative inline-block w-full">
                    <button
                      type="button"
                      onClick={() => setEmojiOpen(emojiOpen === index ? null : index)}
                      className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue text-2xl flex items-center justify-center"
                    >
                      {phase.emoji || "😊"}
                    </button>

                    {/* Emoji Grid */}
                    {emojiOpen === index && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-700 border border-github-border dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-72">
                        <div className="grid grid-cols-8 gap-1 p-2">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                handlePhaseChange(index, "emoji", emoji);
                                setEmojiOpen(null);
                              }}
                              className="aspect-square text-lg flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phase Title */}
                <div>
                  <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                    Titre de la phase
                  </label>
                  <input
                    type="text"
                    value={phase.phase}
                    onChange={(e) =>
                      handlePhaseChange(index, "phase", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue"
                    placeholder="ex: Initialisation, Développement..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-github-gray-dark dark:text-white mb-2">
                    Description
                  </label>
                  <textarea
                    value={phase.description || ""}
                    onChange={(e) =>
                      handlePhaseChange(index, "description", e.target.value)
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-github-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-github-gray-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-github-blue resize-none"
                    placeholder="Décrivez ce qui a été fait durant cette semaine..."
                  />
                </div>

                {/* Delete Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDeletePhase(index)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Supprimer cette phase
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Phase Button */}
      <button
        onClick={handleAddPhase}
        className="w-full px-6 py-3 border-2 border-dashed border-github-blue dark:border-blue-500 text-github-blue dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 transition-colors"
      >
        + Ajouter une phase
      </button>

      {localPhases.length === 0 && (
        <div className="text-center py-8">
          <p className="text-github-gray dark:text-gray-400 mb-4">
            Aucune phase pour le moment
          </p>
          <button
            onClick={handleAddPhase}
            className="px-6 py-2 bg-github-blue text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Créer la première phase
          </button>
        </div>
      )}
    </div>
  );
}
