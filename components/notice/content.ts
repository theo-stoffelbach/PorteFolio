import type { Cartridge } from '@/lib/catalog';
import { SITE } from '@/lib/site';
import type { ProjectCategory } from '@/lib/types';

// Fiche du personnage : faits vérifiés (PRODUCT.md), sans aucun détail
// d'infrastructure (pas d'adresse, de réseau ni de matériel nommé).
export const CHARACTER = {
  intro:
    "Théo construit des applications fullstack complètes et va jusqu'à les exploiter lui-même. Il développe avec des agents IA, mais encadre ce qu'ils produisent par des tests, de la CI et une revue de code.",
  facts: [
    {
      key: 'Alternance',
      value: 'SII depuis 2024 · Perl, Java, PostgreSQL, Linux',
    },
    {
      key: 'Formation',
      value: 'Master Ynov Campus Toulouse, en M2 · diplôme en juin 2027',
    },
  ],
  moves: [
    {
      name: 'Livrer',
      text: "Des applications de bout en bout : interface React, API Node.js ou Python, base PostgreSQL, jusqu'à la mise en production.",
    },
    {
      name: 'Durcir',
      text: "Conteneurs non-root aux droits réduits, images et actions épinglées, limite de tentatives de connexion : les mêmes réflexes d'un projet à l'autre.",
    },
    {
      name: 'Mesurer',
      text: 'Tests et seuil de couverture vérifiés en CI, revue de code multi-IA avant de fusionner.',
    },
    {
      name: 'Maintenir',
      text: "Ses projets tournent sur un serveur qu'il administre lui-même : chaque modification devient une image Docker, déployée automatiquement.",
    },
  ],
} as const;

/** Couleurs de bandeau des cartouches, reprises des jetons de app/globals.css. */
export const CATEGORY_COLORS: Record<
  ProjectCategory,
  { base: string; deep: string; light: string }
> = {
  infra: {
    base: 'var(--cat-infra)',
    deep: 'var(--cat-infra-deep)',
    light: 'var(--cat-infra-light)',
  },
  ia: { base: 'var(--cat-ia)', deep: 'var(--cat-ia-deep)', light: 'var(--cat-ia-light)' },
  jeux: {
    base: 'var(--cat-jeux)',
    deep: 'var(--cat-jeux-deep)',
    light: 'var(--cat-jeux-light)',
  },
  web: { base: 'var(--cat-web)', deep: 'var(--cat-web-deep)', light: 'var(--cat-web-light)' },
};

/** Palette de la mini cartouche d'une catégorie (voir CARTRIDGE dans sprites.ts). */
export function cartridgePalette(category: ProjectCategory) {
  const colors = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.web;
  return {
    o: 'var(--ink)',
    b: colors.base,
    r: colors.deep,
    d: colors.deep,
    l: 'var(--label)',
  };
}

export interface CartridgeGroup {
  category: ProjectCategory;
  items: Cartridge[];
}

/**
 * Regroupe les cartouches par catégorie en gardant l'ordre de la ludothèque :
 * la catégorie du premier projet mis en avant passe en premier.
 */
export function groupByCategory(
  cartridges: readonly Cartridge[]
): CartridgeGroup[] {
  const groups = new Map<ProjectCategory, Cartridge[]>();
  for (const cartridge of cartridges) {
    const list = groups.get(cartridge.category);
    if (list) list.push(cartridge);
    else groups.set(cartridge.category, [cartridge]);
  }
  return Array.from(groups, ([category, items]) => ({ category, items }));
}

/** Découpe un texte en paragraphes sur les lignes vides. */
export function paragraphs(text: string | undefined): string[] {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Garde uniquement les chaînes non vides d'une liste qui peut manquer. */
export function cleanList(list: readonly unknown[] | undefined): string[] {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  );
}

/**
 * Accroche du service après-vente, en une seule chaîne : les espaces autour des
 * valeurs insérées ne dépendent pas des règles d'espacement du JSX.
 */
export function serviceLead(): string {
  return `Un poste en ${SITE.availability}, à ${SITE.city} ou en remote ? Le plus simple est d'écrire à Théo.`;
}

/** Coupe une adresse e-mail après l'arobase pour un retour à la ligne propre. */
export function splitEmail(email: string): [string, string] {
  const at = email.indexOf('@');
  return at === -1 ? [email, ''] : [email.slice(0, at + 1), email.slice(at + 1)];
}

export function projectHref(id: string): string {
  return `/projets/${encodeURIComponent(id)}`;
}

/** Lien qui recharge l'accueil avec la cartouche insérée dans la console. */
export function insertHref(id: string): string {
  return `/?cartouche=${encodeURIComponent(id)}#console`;
}
