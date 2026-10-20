export interface ProjectPhase {
  week: number;
  phase: string;
  description?: string;
  emoji?: string;
}

export type ProjectCategory = 'infra' | 'ia' | 'jeux' | 'web';

export type ProjectStatus = 'en-cours' | 'termine' | 'prototype';

export interface ProjectStat {
  label: string;
  value: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  projectUrl?: string;
  color: string;
  weeks: number[];
  phases?: ProjectPhase[];
  year: number;
  featured?: boolean;
  // Champs de présentation de la console (tous optionnels pour rester
  // compatibles avec les projets créés depuis l'admin)
  category?: ProjectCategory;
  shortTitle?: string;
  tagline?: string;
  role?: string;
  period?: string;
  status?: ProjectStatus;
  highlights?: string[];
  stats?: ProjectStat[];
  repoUrl?: string;
  isPrivate?: boolean;
  order?: number;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  duration: string;
  technologies: string[];
  description: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  responsibilities?: string[];
  achievements?: string[];
  fullDescription?: string;
}

export interface Formation {
  id: string;
  school: string;
  period: string;
  description: string;
  skills: string[];
}

