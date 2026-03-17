'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  projects: {
    total: number;
    featured: number;
    totalWeeks: number;
    totalPhases: number;
    byYear: Record<number, number>;
    avgWeeksPerProject: number;
  };
  experiences: {
    total: number;
    currentPosition: string | null;
  };
  formations: {
    total: number;
    totalSkills: number;
  };
  technologies: {
    total: number;
    top: { name: string; count: number }[];
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-4 sm:p-6">
              <div className="h-12 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3 sm:mb-4"></div>
              <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 sm:p-6">
          <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">Erreur lors du chargement des statistiques</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 sm:px-6 py-4 sm:py-6">
      {/* KPI Cards principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        {/* Projets */}
        <Link href="/admin/projects" className="block">
          <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-4 sm:p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer h-full">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                {stats.projects.featured} featured
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-github-gray-dark dark:text-white mb-1">
              {stats.projects.total}
            </div>
            <div className="text-xs sm:text-sm text-github-gray dark:text-gray-400">Projets</div>
          </div>
        </Link>

        {/* Technologies */}
        <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-github-gray-dark dark:text-white mb-1">
            {stats.technologies.total}
          </div>
          <div className="text-xs sm:text-sm text-github-gray dark:text-gray-400">Technologies</div>
        </div>

        {/* Expériences */}
        <Link href="/admin/experiences" className="block">
          <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-4 sm:p-6 hover:border-green-500 dark:hover:border-green-400 transition-colors cursor-pointer h-full">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {stats.experiences.currentPosition && (
                <span className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  En poste
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-github-gray-dark dark:text-white mb-1">
              {stats.experiences.total}
            </div>
            <div className="text-xs sm:text-sm text-github-gray dark:text-gray-400">Expériences</div>
          </div>
        </Link>

        {/* Formations */}
        <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-4 sm:p-6 h-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {stats.formations.totalSkills} skills
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-github-gray-dark dark:text-white mb-1">
            {stats.formations.total}
          </div>
          <div className="text-xs sm:text-sm text-github-gray dark:text-gray-400">Formations</div>
        </div>
      </div>

      {/* Section détails */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Activité projets */}
        <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-github-gray-dark dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-github-gray dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Activité Projets
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-github-gray dark:text-gray-400">Semaines travaillées</span>
              <span className="font-semibold text-github-gray-dark dark:text-white">{stats.projects.totalWeeks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-github-gray dark:text-gray-400">Phases documentées</span>
              <span className="font-semibold text-github-gray-dark dark:text-white">{stats.projects.totalPhases}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-github-gray dark:text-gray-400">Moy. semaines/projet</span>
              <span className="font-semibold text-github-gray-dark dark:text-white">{stats.projects.avgWeeksPerProject}</span>
            </div>
            <div className="pt-3 border-t border-github-border dark:border-gray-700">
              <div className="text-xs sm:text-sm text-github-gray dark:text-gray-400 mb-2">Projets par année</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.projects.byYear)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, count]) => (
                    <span key={year} className="px-2 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs sm:text-sm">
                      <span className="font-medium text-github-gray-dark dark:text-white">{year}</span>
                      <span className="text-github-gray dark:text-gray-400 ml-1">({count})</span>
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Technologies */}
        <div className="bg-white dark:bg-gray-800 border border-github-border dark:border-gray-700 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-github-gray-dark dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-github-gray dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Top Technologies
          </h3>
          <div className="space-y-3">
            {stats.technologies.top.map((tech, index) => {
              const maxCount = stats.technologies.top[0]?.count || 1;
              const percentage = (tech.count / maxCount) * 100;
              const colors = [
                'bg-blue-500',
                'bg-green-500',
                'bg-purple-500',
                'bg-orange-500',
                'bg-pink-500'
              ];
              return (
                <div key={tech.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs sm:text-sm font-medium text-github-gray-dark dark:text-white">{tech.name}</span>
                    <span className="text-[10px] sm:text-xs text-github-gray dark:text-gray-400">{tech.count} projet{tech.count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                    <div
                      className={`${colors[index % colors.length]} h-1.5 sm:h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Position actuelle */}
      {stats.experiences.currentPosition && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm text-green-700 dark:text-green-400">Actuellement</span>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-semibold text-github-gray-dark dark:text-white">
            {stats.experiences.currentPosition}
          </div>
        </div>
      )}
    </main>
  );
}
