import type { Cartridge } from '@/lib/catalog';
import type { Experience, Formation } from '@/lib/types';

export type Direction = 'left' | 'right' | 'up' | 'down';
export type Action = Direction | 'a' | 'b' | 'start' | 'select';

export interface GameData {
  cartridges: Cartridge[];
  experiences: Experience[];
  formations: Formation[];
}

// Lien réel posé par-dessus l'écran (contact, code source, fiche) : un vrai <a> DOM.
export interface ScreenLink {
  id: string;
  href: string;
  label: string;
  external: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Ce que le jeu demande à la page qui l'héberge.
export interface GameHost {
  // Texte repris par la région aria-live.
  announce(text: string): void;
  // Insertion choisie dans le menu de la ludothèque.
  insert(id: string): void;
  // B sur l'écran de titre : éjection de la cartouche.
  eject(): void;
  // Liens actuellement affichés à l'écran (vide = aucun).
  links(links: ScreenLink[]): void;
  // Valide le lien sélectionné (clic sur le vrai <a>).
  activateLink(id: string): void;
  // SELECT : mode rapide, défile jusqu'à la notice.
  notice(): void;
}

export interface GameOptions {
  reducedMotion: boolean;
}
