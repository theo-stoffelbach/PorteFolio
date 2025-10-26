"use client";

import { useState, useEffect } from "react";
import { Experience } from "@/lib/types";
import Link from "next/link";

export default function ExperiencePreview() {
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    fetch("/api/experiences")
      .then((res) => res.json())
      .then((data) => setExperiences(data.slice(0, 2)))
      .catch((err) => console.error("Error fetching experiences:", err));
  }, []);

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-github-gray-dark dark:text-white">
            Expériences Professionnelles
          </h2>
          <Link
            href="/experiences"
            className="text-github-blue dark:text-blue-400 hover:underline text-sm font-medium"
          >
            Voir tout →
          </Link>
        </div>

        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="border border-github-border dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-github-gray-dark dark:text-white">
                    {exp.position}
                  </h3>
                  <p className="text-github-gray dark:text-gray-300">
                    {exp.company}
                  </p>
                </div>
                <div className="text-sm text-github-gray dark:text-gray-300">
                  {exp.duration}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {exp.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 text-xs bg-github-gray-light dark:bg-gray-600 text-github-gray-dark dark:text-gray-200 rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
