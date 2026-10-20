import { CATEGORY_META, cartridgeCount, oneLineTitle, type Cartridge } from '@/lib/catalog';
import { SITE } from '@/lib/site';
import { px, rect, spr, vl, type Surface } from '../pixel/engine';
import { BF, SF, drawText, drawTextCentered, fitText, textWidth, wrapText } from '../pixel/fonts';
import { LCD, LM } from '../pixel/palette';
import { CARTICO, NOTE } from '../pixel/sprites';
import { BOX, SH, SW, drawBox, drawHeader, fillRR, sprScaled } from './ui';

// Écrans de démarrage, de transition et menu de la ludothèque.

const { L0, L1, L2, L3 } = LCD;

export const BOOT_MS = 2300;
export const FLASH_MS = 360;

// Démarrage : le logo descend par pas de 3 px, une note, puis la rue.
export function drawBoot(s: Surface, t: number): void {
  rect(s, 0, 0, SW, SH, L0);
  const logo = 'TS-27';
  const w = textWidth(BF, logo) * 3;
  const x0 = (SW - w) >> 1;
  const y = Math.min(26, -24 + Math.floor(t / 40) * 3);
  drawText(s, BF, logo, x0, y + 3, L1, 3);
  drawText(s, BF, logo, x0, y, L3, 3);
  if (t > 850) spr(s, NOTE, x0 + w + 6, 22 + (Math.floor(t / 150) % 2), LM);
  if (t > 1050) {
    drawTextCentered(s, BF, SITE.name, SW >> 1, 62, L3);
    drawTextCentered(s, SF, `PORTFOLIO · ${SITE.role}`, SW >> 1, 76, L3);
  }
  if (t > 1450) drawTextCentered(s, SF, SITE.city, SW >> 1, 90, L3);
}

// Pendant le vol et l'enfoncement de la cartouche.
export function drawPower(s: Surface, message: string, t: number, animate: boolean): void {
  rect(s, 0, 0, SW, SH, L0);
  sprScaled(s, CARTICO, (SW >> 1) - 7, 38, LM, 3);
  const dots = animate ? '.'.repeat(Math.floor(t / 200) % 4) : '…';
  drawText(s, SF, message + dots, (SW >> 1) - (textWidth(SF, message) >> 1), 66, L3);
}

// L'écran clignote deux fois avant l'écran de titre.
export function drawFlash(s: Surface, t: number): void {
  rect(s, 0, 0, SW, SH, Math.floor(t / 90) % 2 === 0 ? L3 : L0);
}

/* ---------- Menu de la ludothèque ---------- */

export const LUDO = { y0: 16, rowH: 11, rows: 5 } as const;

function miniCart(s: Surface, x: number, y: number, body: number, label: number, bg: number): void {
  rect(s, x, y, 6, 8, body);
  rect(s, x + 1, y + 3, 4, 3, label);
  px(s, x + 5, y, bg);
}

export function drawLudo(
  s: Surface,
  carts: readonly Cartridge[],
  index: number,
  scroll: number
): void {
  rect(s, 0, 0, SW, SH, L0);
  const n = carts.length;
  drawHeader(s, 'LUDOTHÈQUE', n === 0 ? 'VIDE' : cartridgeCount(n).toUpperCase());
  if (n === 0) {
    wrapText(BF, "Les étagères sont vides pour l'instant.", 180).forEach((line, i) =>
      drawTextCentered(s, BF, line, SW >> 1, 34 + i * 10, L3)
    );
    drawBox(s, 'LUDOTHÈQUE', wrapText(BF, 'Reviens bientôt ! B pour ressortir.', BOX.width), false);
    return;
  }
  for (let r = 0; r < LUDO.rows; r++) {
    const i = scroll + r;
    if (i >= n) break;
    const cart = carts[i];
    const y = LUDO.y0 + r * LUDO.rowH;
    const selected = i === index;
    const ink = selected ? L0 : L3;
    if (selected) fillRR(s, 4, y, 214, y + LUDO.rowH, 2, L3);
    miniCart(s, 9, y + 2, selected ? L1 : L2, L0, selected ? L3 : L0);
    drawText(s, BF, fitText(BF, oneLineTitle(cart), 150), 19, y + 2, ink);
    const tag = CATEGORY_META[cart.category].label;
    drawText(s, SF, tag, 209 - textWidth(SF, tag), y + 3, selected ? L1 : L3);
  }
  if (n > LUDO.rows) {
    const track = LUDO.rows * LUDO.rowH;
    vl(s, 218, LUDO.y0, LUDO.y0 + track, L1);
    const th = Math.max(4, Math.round((track * LUDO.rows) / n));
    const ty = LUDO.y0 + Math.round(((track - th) * scroll) / (n - LUDO.rows));
    rect(s, 217, ty, 3, th, L3);
  }
  const cart = carts[index];
  const meta = CATEGORY_META[cart.category];
  drawBox(s, `${meta.label} · A : INSÉRER`, wrapText(BF, cart.tagline, BOX.width).slice(0, BOX.lines), false);
}

// Rangée touchée par un clic, ou -1.
export function ludoHit(x: number, y: number, scroll: number, n: number): number {
  if (x < 4 || x > 214 || y < LUDO.y0 || y >= LUDO.y0 + LUDO.rows * LUDO.rowH) return -1;
  const i = scroll + Math.floor((y - LUDO.y0) / LUDO.rowH);
  return i < n ? i : -1;
}
