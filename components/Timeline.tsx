"use client";

import { useState, useEffect, useRef } from "react";
import { TimelineEvent } from "@/lib/types";

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simuler des événements depuis l'API
    const mockEvents: TimelineEvent[] = [
      {
        id: "epitech",
        title: "Formation Epitech Digital",
        date: "2022-2023",
        type: "formation",
        description: "Formation intensive en développement web",
        side: "left",
      },
      {
        id: "ynov",
        title: "Formation Ynov",
        date: "2023-2025",
        type: "formation",
        description: "Master en développement web avec spécialisation backend",
        side: "right",
      },
      {
        id: "berenisse",
        title: "Stage Bérénisse Phone",
        date: "2023 - 3 mois",
        type: "experience",
        description: "Stage développement web full-stack",
        side: "left",
      },
      {
        id: "sii",
        title: "Alternance SII",
        date: "2024 - Présent",
        type: "experience",
        description: "Développeur Web en Perl",
        side: "right",
      },
    ];
    setEvents(mockEvents);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (timelineRef.current) {
        const elementTop = timelineRef.current.getBoundingClientRect().top;
        const elementVisible = window.innerHeight - elementTop;
        if (elementVisible > 200) {
          setScrolled(true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-github-gray-dark dark:text-white mb-12 text-center">
          Chronologie
        </h2>

        <div ref={timelineRef} className="relative">
          {/* Ligne verticale centrale */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-github-blue dark:bg-blue-500"></div>

          <div className="space-y-8">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`flex items-center ${
                  event.side === "left" ? "flex-row" : "flex-row-reverse"
                } ${
                  scrolled
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-8"
                } transition-all duration-700`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div
                  className={`w-5/12 ${
                    event.side === "left" ? "pr-8 text-right" : "pl-8"
                  }`}
                >
                  <div className="bg-white dark:bg-gray-700 border border-github-border dark:border-gray-600 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-github-blue dark:text-blue-400">
                        {event.type === "formation" ? "🎓" : "💼"}
                      </span>
                      <h3 className="text-lg font-semibold text-github-gray-dark dark:text-white">
                        {event.title}
                      </h3>
                    </div>
                    <p className="text-sm text-github-gray dark:text-gray-300 mb-2">
                      {event.date}
                    </p>
                    <p className="text-github-gray-dark dark:text-gray-300">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Point sur la ligne */}
                <div className="relative z-10 w-2/12 flex justify-center">
                  <div className="w-4 h-4 bg-github-blue dark:bg-blue-500 rounded-full border-4 border-white dark:border-gray-800 shadow-md"></div>
                </div>

                {/* Espace vide */}
                <div className="w-5/12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
