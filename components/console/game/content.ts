import { cartridgeCount } from '@/lib/catalog';
import type { Experience, Formation } from '@/lib/types';
import type { PlaceId } from './street';

// Textes du jeu. Rien de sensible : aucune adresse, aucun détail d'infrastructure.

export const GENERIC_HINT = '← → pour te promener. ↑ ou A devant une porte pour entrer.';

export function placeHint(id: PlaceId, count: number): string {
  switch (id) {
    case 'facteur':
      return 'Le facteur a quelque chose pour toi. Appuie sur A pour lui parler.';
    case 'boulangerie':
      return 'Ça sent la chocolatine. Appuie sur A pour entrer.';
    case 'ludotheque':
      if (count === 0) return 'La ludothèque est encore vide. Reviens bientôt !';
      return `${cartridgeCount(count)} t'attend${count > 1 ? 'ent' : ''} ici. Appuie sur A pour entrer.`;
    case 'poste':
      return 'Un message pour Théo ? Appuie sur A pour entrer.';
    case 'ecole':
      return "Le parcours de Théo, de l'école au master. Appuie sur A.";
    case 'sii':
      return "L'alternance et les expériences de Théo. Appuie sur A.";
    case 'serveur':
      return 'Des LED clignotent derrière une porte de garage… Appuie sur A.';
    case 'garonne':
      return 'Le bord de la Garonne. Appuie sur A pour admirer la vue.';
  }
}

export function schoolParagraphs(formations: readonly Formation[]): string[] {
  if (formations.length === 0) return ["L'école est fermée pour l'instant : le parcours arrive bientôt."];
  const out = ["Bienvenue à l'école ! Voici le parcours de Théo."];
  for (const f of formations) {
    out.push(`${f.school} · ${f.period}\n${f.description}`);
    if (f.skills.length > 0) out.push(`Au programme : ${f.skills.join(', ')}.`);
  }
  return out;
}

const isSii = (e: Experience) => /\bSII\b/i.test(e.company);

export function officeParagraphs(experiences: readonly Experience[]): string[] {
  if (experiences.length === 0) return ['Le bureau est vide pour le moment.'];
  const sorted = [...experiences].sort((a, b) => Number(isSii(b)) - Number(isSii(a)));
  const out = [
    sorted.some(isSii)
      ? 'Bureau SII, bonjour ! Théo y travaille en alternance.'
      : 'Bienvenue au bureau ! Voici les expériences de Théo.',
  ];
  for (const e of sorted) {
    out.push(`${e.position} chez ${e.company} · ${e.duration}\n${e.description}`);
    if (e.technologies.length > 0) out.push(`Stack : ${e.technologies.join(', ')}.`);
  }
  return out;
}

export const SERVER_PARAGRAPHS: readonly string[] = [
  "Ce site tourne sur un serveur que j'administre moi-même.",
  'À chaque push, la CI lance les tests, construit une image Docker et la publie.',
  'Le serveur récupère la nouvelle image et se met à jour tout seul. Mon rôle : livrer, durcir, surveiller et maintenir.',
];

export function bakeryParagraphs(count: number): string[] {
  return [
    'Bonjour ! Ici, on dit chocolatine, pas pain au chocolat.',
    count <= 1
      ? 'Tiens, ta première chocolatine, toute chaude !'
      : `Tiens, encore une ! Ça te fait ${count} chocolatines.`,
  ];
}

export const GARONNE_PARAGRAPHS: readonly string[] = [
  'La Garonne. Pas de cartouche ici, juste une belle vue sur Toulouse.',
];

export const CONTACT_QUESTION = 'Tu veux écrire à Théo ?';
