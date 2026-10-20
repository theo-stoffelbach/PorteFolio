import type {
  Project,
  ProjectCategory,
  ProjectStat,
  ProjectStatus,
} from './types';

// Module sans dépendance serveur : utilisable par les composants client.

export const CATEGORY_ORDER: readonly ProjectCategory[] = [
  'infra',
  'ia',
  'jeux',
  'web',
];

// Teintes d'une catégorie : contour, ombre, base, reflet.
export interface CategoryTones<T> {
  o: T;
  s: T;
  b: T;
  h: T;
}

// Source unique des couleurs de catégorie : la console (palette pixel), les
// données (champ `color`) et les jetons CSS --cat-* en dérivent.
export const CAT_HEX: Record<ProjectCategory, CategoryTones<string>> = {
  infra: { o: '#0f1d24', s: '#1d5b5a', b: '#2c8a83', h: '#5ebcad' },
  ia: { o: '#170f2a', s: '#4a2e86', b: '#7552c4', h: '#a78bf0' },
  jeux: { o: '#121c0c', s: '#3a5e22', b: '#5e9537', h: '#92c65a' },
  web: { o: '#2a1606', s: '#8e5414', b: '#d68926', h: '#f5bc5b' },
};

export const CATEGORY_META: Record<
  ProjectCategory,
  { label: string; name: string; color: string }
> = {
  infra: { label: 'INFRA', name: 'Infra & self-hosting', color: CAT_HEX.infra.b },
  ia: { label: 'IA', name: 'Outils IA', color: CAT_HEX.ia.b },
  jeux: { label: 'JEUX', name: 'Jeux', color: CAT_HEX.jeux.b },
  web: { label: 'WEB', name: 'Web fullstack', color: CAT_HEX.web.b },
};

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  'en-cours': 'En cours',
  termine: 'Terminé',
  prototype: 'Prototype',
};

export interface Cartridge {
  id: string;
  title: string;
  shortTitle: string;
  category: ProjectCategory;
  tagline: string;
  description: string;
  technologies: string[];
  role?: string;
  period?: string;
  status: ProjectStatus;
  highlights: string[];
  stats: ProjectStat[];
  repoUrl?: string;
  demoUrl?: string;
  isPrivate: boolean;
  featured: boolean;
  year: number;
  order: number;
}

const CATEGORY_HINTS: [ProjectCategory, RegExp][] = [
  ['ia', /\b(ia|ai|llm|gpt|claude|openai|agent|whisper)\b/i],
  ['jeux', /\b(jeu|game|phaser|unity|godot|multijoueur|moba)\b/i],
  ['infra', /\b(docker|kubernetes|ci|cd|nas|terraform|ansible|infra)\b/i],
];

export function inferCategory(project: Project): ProjectCategory {
  if (project.category && project.category in CATEGORY_META) {
    return project.category;
  }
  const haystack = [project.title, ...project.technologies].join(' ');
  const match = CATEGORY_HINTS.find(([, pattern]) => pattern.test(haystack));
  return match ? match[0] : 'web';
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const end = trimmed.search(/[.!?](\s|$)/);
  const sentence = end === -1 ? trimmed : trimmed.slice(0, end + 1);
  return sentence.length > 120 ? `${sentence.slice(0, 117)}…` : sentence;
}

export function toCartridge(project: Project): Cartridge {
  return {
    id: project.id,
    title: project.title,
    shortTitle: project.shortTitle?.trim() || project.title,
    category: inferCategory(project),
    tagline: project.tagline?.trim() || firstSentence(project.description),
    description: project.description,
    technologies: project.technologies ?? [],
    role: project.role,
    period: project.period,
    status: project.status ?? 'termine',
    highlights: project.highlights ?? [],
    stats: project.stats ?? [],
    repoUrl: project.isPrivate ? undefined : project.repoUrl,
    demoUrl: project.projectUrl || undefined,
    isPrivate: project.isPrivate ?? false,
    featured: project.featured ?? false,
    year: project.year,
    order: project.order ?? Number.MAX_SAFE_INTEGER,
  };
}

// Projets mis en avant d'abord, puis ordre manuel, puis les plus récents.
export function sortCartridges(list: readonly Cartridge[]): Cartridge[] {
  return [...list].sort(
    (a, b) =>
      Number(b.featured) - Number(a.featured) ||
      a.order - b.order ||
      b.year - a.year ||
      a.title.localeCompare(b.title, 'fr')
  );
}

export function toCartridges(projects: readonly Project[]): Cartridge[] {
  return sortCartridges(projects.map(toCartridge));
}

// Titre court de l'étiquette, remis sur une seule ligne (« \n » = coupure d'étiquette).
export function oneLineTitle(cart: Pick<Cartridge, 'shortTitle' | 'title'>): string {
  return (cart.shortTitle || cart.title).replace(/\s*\n\s*/g, ' ').trim();
}

/** « 3 projets », « 1 projet », « 0 projet ». */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count > 1 ? plural : singular}`;
}

/** « 3 cartouches », « 1 cartouche », « aucune cartouche ». */
export function cartridgeCount(count: number): string {
  return count === 0 ? 'aucune cartouche' : countLabel(count, 'cartouche', 'cartouches');
}
