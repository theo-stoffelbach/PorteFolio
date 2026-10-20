import { cache } from 'react';
import { toCartridges, type Cartridge } from '@/lib/catalog';
import { getExperiences, getFormations, getProjects } from '@/lib/dataManager';
import type { Experience, Formation, Project, ProjectStat } from '@/lib/types';

// Chargement côté serveur des données publiques, tolérant aux fichiers vides
// ou incomplets : une entrée illisible est ignorée au lieu de casser la page.
// cache() évite de relire les fichiers deux fois dans une même requête
// (generateMetadata puis la page).

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Projets publiables sous forme de cartouches, déjà triées. */
export const loadCartridges = cache(async (): Promise<Cartridge[]> => {
  const projects = asList<Project>(await getProjects())
    .filter((project) => isRecord(project) && hasText(project.id) && hasText(project.title))
    .map((project) => ({
      ...project,
      description: hasText(project.description) ? project.description : '',
      technologies: asList<string>(project.technologies).filter(hasText),
      highlights: asList<string>(project.highlights).filter(hasText),
      stats: asList<ProjectStat>(project.stats).filter(
        (stat) => isRecord(stat) && hasText(stat.label) && hasText(stat.value)
      ),
      year: Number.isFinite(project.year) ? project.year : 0,
    }));
  return toCartridges(projects);
});

/** Expériences et formations affichables (une entrée sans nom est ignorée). */
export const loadLevels = cache(async (): Promise<{
  experiences: Experience[];
  formations: Formation[];
}> => {
  const [experiences, formations] = await Promise.all([
    getExperiences(),
    getFormations(),
  ]);
  return {
    experiences: asList<Experience>(experiences).filter(
      (experience) => isRecord(experience) && hasText(experience.id) && hasText(experience.company)
    ),
    formations: asList<Formation>(formations).filter(
      (formation) => isRecord(formation) && hasText(formation.id) && hasText(formation.school)
    ),
  };
});
