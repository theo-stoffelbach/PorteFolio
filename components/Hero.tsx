"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Hero() {
  const [bio, setBio] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then(() => {
        setBio(
          "Développeur Web passionné par les technologies modernes. Spécialisé en NodeJS et ReactJS, je construis des applications performantes et évolutives."
        );
      })
      .catch(() => {
        setBio("Développeur Web passionné par les technologies modernes.");
      });
  }, []);

  return (
    <section className="bg-white dark:bg-gray-800 py-16 border-b border-github-border dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative w-48 h-48 md:w-56 md:h-56">
            <Image
              src="/images/profile.jpg.svg"
              alt="Théo Stoffelbach"
              fill
              className="rounded-full object-cover border-4 border-github-border dark:border-gray-700"
              priority
            />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-github-gray-dark dark:text-white mb-2">
              Théo Stoffelbach 2
            </h1>
            <p className="text-xl text-github-gray dark:text-gray-300 mb-4">
              Développeur Web (NodeJS, ReactJS) - Alternant chez SII
            </p>
            <p className="text-github-gray-dark dark:text-gray-300 leading-relaxed">
              {bio || "Chargement..."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
