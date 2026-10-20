import { mirror } from '@/components/console/pixel/sprites';

// Dessins pixel propres à la notice, tracés sur la même grille que la console
// (un caractère = un pixel). Les personnages (Théo, le facteur) et l'enveloppe
// viennent directement de components/console/pixel/sprites.ts.
// Les couleurs sont choisies au rendu via la palette passée à <PixelArt>.

/**
 * La console TS-27 vue de face, cartouche à moitié insérée (même dessin que l'icône du site).
 * o contour, b coque, z cadre d'écran, L écran, k croix, r boutons A/B, y START, v cartouche, l étiquette.
 */
export const CONSOLE = [
  '......vvvv......',
  '......vllv......',
  '.oooooooooooooo.',
  'obbbbbbbbbbbbbbo',
  'obbbzzzzzzzzbbbo',
  'obkbzLLLLLLzbbro',
  'okkkzLLLLLLzbrbo',
  'obkbzLLLLLLzbbbo',
  'obbbzzzzzzzzbbbo',
  'obbbbbbyybbbbbbo',
  '.oooooooooooooo.',
] as const;

/** « in » découpé dans un carré arrondi. */
export const LINKEDIN = [
  '.########.',
  '##########',
  '##.#######',
  '##########',
  '##.#...###',
  '##.#.##.##',
  '##.#.##.##',
  '##.#.##.##',
  '##########',
  '.########.',
] as const;

/** Tête de chat aux oreilles pointues, clin d'œil à la mascotte de GitHub. */
export const GITHUB = [
  '.#.......#.',
  '.##.....##.',
  '.#########.',
  '###########',
  '###.###.###',
  '###.###.###',
  '###########',
  '.#########.',
  '..#######..',
  '..##...##..',
] as const;

/** Flèche vers la droite. */
export const ARROW_RIGHT = [
  '....#...',
  '....##..',
  '#######.',
  '########',
  '#######.',
  '....##..',
  '....#...',
] as const;

/** Flèche vers la gauche. */
export const ARROW_LEFT = mirror(ARROW_RIGHT);

/** Deux feuilles qui se chevauchent : copier. */
export const COPY = [
  '######..',
  '#....#..',
  '#.######',
  '#.#....#',
  '#.#....#',
  '###....#',
  '..#....#',
  '..######',
] as const;

/** Coche : copie réussie. */
export const CHECK = [
  '.......#',
  '......##',
  '#....##.',
  '##..##..',
  '.####...',
  '..##....',
] as const;

/** Mini cartouche (o contour, b coque, r rainures, d bandeau, l étiquette). */
export const CARTRIDGE = [
  'ooooooooo..',
  'obbbbbbbbo.',
  'obrrrrrrbbo',
  'obbbbbbbbbo',
  'obdddddddbo',
  'oblllllllbo',
  'oblllllllbo',
  'oblllllllbo',
  'obbbbbbbbbo',
  'ooooooooooo',
] as const;

/** Cadenas : code source privé. */
export const LOCK = [
  '..####..',
  '.#....#.',
  '.#....#.',
  '########',
  '########',
  '###..###',
  '###..###',
  '########',
] as const;
