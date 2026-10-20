import { hl, inRR, px, rect, type Surface } from '../pixel/engine';
import { BF, SF, drawText, textWidth, wrapText } from '../pixel/fonts';
import { LCD, type Color } from '../pixel/palette';
import type { Sprite } from '../pixel/sprites';
import { SCREEN_H, SCREEN_W } from '../render/layout';

// Habillage commun des écrans du jeu : boîte de dialogue, bandeau, pied de page.

// Écran logique (raccourcis des dimensions définies dans render/layout.ts).
export const SW = SCREEN_W;
export const SH = SCREEN_H;
const { L0, L1, L2, L3 } = LCD;

export function fillRR(
  s: Surface,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
  c: Color
): void {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (inRR(x, y, x0, y0, x1, y1, r)) px(s, x, y, c);
}

// Sprite LCD agrandi k fois (icônes de catégorie de l'écran de titre).
export function sprScaled(
  s: Surface,
  rows: Sprite,
  x: number,
  y: number,
  map: Readonly<Record<string, Color>>,
  k: number
): void {
  for (let j = 0; j < rows.length; j++)
    for (let i = 0; i < rows[j].length; i++) {
      const c = map[rows[j][i]];
      if (c) rect(s, x + i * k, y + j * k, k, k, c);
    }
}

export const BOX = { x: 11, y: 91, width: 196, lines: 3, lineH: 10 } as const;

// Boîte de dialogue du bas de l'écran (reprise de la maquette), avec son onglet.
// `arrow` : indicateur ▶ « suite » ; `bob` le descend d'un pixel (0 ou 1) pour
// le faire sautiller par pas de pixel sans jamais disparaître.
export function drawBox(
  s: Surface,
  tab: string | null,
  lines: readonly string[],
  arrow: boolean,
  bob = 0
): void {
  fillRR(s, 4, 84, 220, 122, 3, L3);
  fillRR(s, 6, 86, 218, 120, 2, L0);
  hl(s, 7, 217, 119, L1);
  if (tab) {
    fillRR(s, 9, 77, 9 + textWidth(SF, tab) + 10, 89, 2, L3);
    drawText(s, SF, tab, 14, 82, L0);
  }
  lines.forEach((line, i) => drawText(s, BF, line, BOX.x, BOX.y + i * BOX.lineH, L3));
  if (arrow) drawText(s, BF, '▶', 208, 110 + bob, L2);
}

// Découpe un texte en pages de lignes pour une largeur donnée.
export function paginate(text: string, width: number, perPage: number): string[][] {
  const lines = wrapText(BF, text, width);
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += perPage) {
    const page = lines.slice(i, i + perPage);
    while (page.length > 0 && page[0] === '') page.shift();
    if (page.length > 0) pages.push(page);
  }
  return pages.length > 0 ? pages : [['']];
}

export function boxPages(paragraphs: readonly string[]): string[][] {
  return paragraphs.flatMap((p) => paginate(p, BOX.width, BOX.lines));
}

// Bandeau sombre du haut des écrans plein cadre.
export function drawHeader(s: Surface, left: string, right?: string): void {
  rect(s, 0, 0, SW, 13, L3);
  drawText(s, SF, left, 6, 5, L0);
  if (right) drawText(s, SF, right, SW - 6 - textWidth(SF, right), 5, L1);
}

// Aide du bas des écrans plein cadre.
export function drawFooter(s: Surface, left: string, right?: string): void {
  hl(s, 4, SW - 4, 114, L1);
  drawText(s, SF, left, 6, 118, L3);
  if (right) drawText(s, SF, right, SW - 6 - textWidth(SF, right), 118, L3);
}
