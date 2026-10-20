import { CAT_HEX, type CategoryTones } from '@/lib/catalog';
import type { ProjectCategory } from '@/lib/types';

// Une couleur est un entier RGBA 32 bits rangé comme dans ImageData
// (petit-boutiste : 0xAABBGGRR). 0 signifie « transparent ».
export type Color = number;

export const TRANSPARENT: Color = 0;

export function hex(value: string): Color {
  const r = parseInt(value.slice(1, 3), 16);
  const g = parseInt(value.slice(3, 5), 16);
  const b = parseInt(value.slice(5, 7), 16);
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

function mapColors<K extends string>(raw: Record<K, string>): Record<K, Color> {
  const out = {} as Record<K, Color>;
  for (const key of Object.keys(raw) as K[]) out[key] = hex(raw[key]);
  return out;
}

// Palette du monde TS-27 (bureau, console cobalt, boutons, papier, LCD).
export const C_HEX = {
  d0: '#100c15',
  d1: '#19141f',
  d2: '#211a28',
  d3: '#292030',
  d4: '#3b2e46',
  bo: '#0c1130',
  bS: '#1a275a',
  bs: '#233574',
  bb: '#2e4a99',
  bl: '#4064bb',
  bh: '#6b8edd',
  zo: '#090a15',
  zb: '#181b2f',
  zl: '#272b47',
  cream: '#f3e6d0',
  white: '#ffffff',
  rose: '#ef9295',
  ink: '#241a2c',
  dim: '#8e9ad0',
  pillt: '#aab4e0',
  ro: '#3a0d1e',
  r1: '#8c2843',
  r2: '#c7425c',
  r3: '#e86d81',
  r4: '#ffb2b8',
  k0: '#090a12',
  k1: '#191b2a',
  k2: '#292c41',
  k3: '#444a6c',
  y0: '#5a3808',
  y1: '#c4841a',
  y2: '#ffc53a',
  y3: '#fff0a6',
  g0: '#1e6a46',
  g1: '#82ffb8',
  L0: '#f9e8d2',
  L1: '#eca07f',
  L2: '#b4465c',
  L3: '#3b1734',
  p0: '#efe2c6',
  p1: '#cdb995',
  tape: '#9fb1ca',
  tapeH: '#b9c8dc',
  lab: '#f2e4cb',
  w0: '#121626',
  w1: '#1a2034',
  qb: '#16111d',
  cast: '#0b0e19',
} as const;

export type ColorName = keyof typeof C_HEX;

export const C: Record<ColorName, Color> = mapColors(C_HEX);

// Les couleurs de catégorie viennent de lib/catalog.ts (source unique).
export const CAT: Record<ProjectCategory, CategoryTones<Color>> = {
  infra: mapColors(CAT_HEX.infra),
  ia: mapColors(CAT_HEX.ia),
  jeux: mapColors(CAT_HEX.jeux),
  web: mapColors(CAT_HEX.web),
};

// Écran LCD : 4 tons, du plus clair (0) au plus sombre (3).
export const LCD = { L0: C.L0, L1: C.L1, L2: C.L2, L3: C.L3 } as const;

// Correspondance des chiffres des sprites vers les tons LCD.
export const LM: Readonly<Record<string, Color>> = {
  '0': C.L0,
  '1': C.L1,
  '2': C.L2,
  '3': C.L3,
};
