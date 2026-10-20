import { CATEGORY_META, oneLineTitle, type Cartridge } from '@/lib/catalog';
import type { ProjectCategory } from '@/lib/types';
import {
  bevel,
  clear,
  dottedOutline,
  hl,
  mask,
  rect,
  shadow,
  spr,
  type Mask,
  type Surface,
} from '../pixel/engine';
import { BF, SF, drawText, fitText, textWidth, wrapText } from '../pixel/fonts';
import { C, CAT } from '../pixel/palette';
import { LABEL_ICON, type Sprite } from '../pixel/sprites';
import { CART_H, CART_W, SHELF_CART } from './layout';

// Silhouette de cartouche : rectangle au coin supérieur droit biseauté.
export function cartMask(x: number, y: number, w: number, h: number): Mask {
  return mask(x, y, x + w, y + h, (i, j) => {
    const lx = i - x;
    const ly = j - y;
    return !(ly < 5 && lx > w - 1 - (5 - ly));
  });
}

type CartTitle = { kind: 'big'; text: string; icon?: Sprite } | { kind: 'lines'; lines: string[] };

interface CartLabel {
  band: string;
  title: CartTitle;
}

function drawCartridge(
  s: Surface,
  x: number,
  y: number,
  w: number,
  h: number,
  category: ProjectCategory,
  label: CartLabel
): void {
  const P = CAT[category];
  const m = cartMask(x, y, w, h);
  bevel(s, m, { outline: P.o, top: [P.h], left: [P.h], right: [P.s, P.s], base: P.b });
  // Stries de préhension
  for (let r = 0; r < 3; r++) {
    hl(s, x + 4, x + w - 10, y + 3 + r * 2, P.s);
    hl(s, x + 5, x + w - 9, y + 4 + r * 2, P.h);
  }
  const lx = x + 4;
  const ly = y + 10;
  const lw = w - 8;
  const lh = h - 12;
  rect(s, lx - 1, ly - 1, lw + 2, lh + 1, P.o);
  rect(s, lx, ly, lw, lh, C.lab);
  rect(s, lx, ly, lw, 7, P.s);
  drawText(s, SF, label.band, lx + 3, ly + 1, C.lab);

  const t = label.title;
  if (t.kind === 'big') {
    const nw = textWidth(BF, t.text);
    const total = t.icon ? 9 + 3 + nw : nw;
    const sx = lx + ((lw - total) >> 1);
    if (t.icon) spr(s, t.icon, sx, ly + 11, { '#': C.ink });
    drawText(s, BF, t.text, t.icon ? sx + 12 : sx, ly + 11, C.ink);
  } else {
    t.lines.forEach((line, i) => {
      drawText(s, SF, line, lx + ((lw - textWidth(SF, line)) >> 1), ly + 9 + i * 7, C.ink);
    });
  }
}

// Titre court découpé en 2 lignes au plus (« \n » explicite ou retour au mot).
export function cartLines(cart: Cartridge, maxWidth: number): string[] {
  const source = cart.shortTitle || cart.title;
  const raw = source.includes('\n')
    ? source.split('\n').flatMap((part) => wrapText(SF, part.trim(), maxWidth))
    : wrapText(SF, source, maxWidth);
  const lines = raw.filter(Boolean);
  if (lines.length <= 2) return lines;
  return [lines[0], fitText(SF, lines.slice(1).join(' '), maxWidth)];
}

function iconFor(cart: Cartridge): Sprite {
  // Clin d'œil : GmailIA porte une enveloppe, comme sur la maquette.
  return cart.id === 'gmailia' ? LABEL_ICON.mail : LABEL_ICON[cart.category];
}

// Bandeau de la cartouche insérée : catégorie, plus le premier chiffre s'il tient.
export function slotBand(cart: Cartridge, maxWidth: number): string {
  const label = CATEGORY_META[cart.category].label;
  const stat = cart.stats[0];
  if (stat) {
    // « Commits au 18/10/2026 » devient « Commits » : la date reste dans la fiche.
    const short = stat.label.replace(/\s+(au|le|du|en)\s+\d.*$/i, '').trim();
    const withStat = `${label} · ${stat.value} ${short}`;
    if (textWidth(SF, withStat) <= maxWidth) return withStat;
  }
  return label;
}

function slotTitle(cart: Cartridge, lw: number): CartTitle {
  const text = oneLineTitle(cart).toUpperCase();
  const width = textWidth(BF, text);
  if (width <= lw - 16) return { kind: 'big', text, icon: iconFor(cart) };
  if (width <= lw - 4) return { kind: 'big', text };
  return { kind: 'lines', lines: cartLines(cart, lw - 4) };
}

// Cartouche de la fente (84 × 52, plus son ombre portée sur le bureau).
export function drawSlotCartridge(s: Surface, cart: Cartridge | null): void {
  clear(s);
  if (!cart) return;
  shadow(s, cartMask(0, 0, CART_W, CART_H), 5, 5, C.d0);
  const lw = CART_W - 8;
  drawCartridge(s, 0, 0, CART_W, CART_H, cart.category, {
    band: slotBand(cart, lw - 6),
    title: slotTitle(cart, lw),
  });
}

// Cartouche de l'étagère (64 × 40, ombre vers la droite).
export function drawShelfCartridge(s: Surface, cart: Cartridge): void {
  clear(s);
  const { w, h } = SHELF_CART;
  shadow(s, cartMask(0, 0, w, h), 3, 0, C.cast);
  drawCartridge(s, 0, 0, w, h, cart.category, {
    band: CATEGORY_META[cart.category].label,
    title: { kind: 'lines', lines: cartLines(cart, w - 10) },
  });
}

// Emplacement vide sur l'étagère quand la cartouche est dans la console.
export function drawShelfGhost(s: Surface, cart: Cartridge): void {
  clear(s);
  const { w, h } = SHELF_CART;
  const P = CAT[cart.category];
  dottedOutline(s, cartMask(0, 0, w, h), P.h);
  const first = cartLines(cart, w - 10)[0] ?? '';
  drawText(s, SF, first, (w - textWidth(SF, first)) >> 1, 13, C.dim);
  const tag = '▲ EN CONSOLE';
  drawText(s, SF, tag, (w - textWidth(SF, tag)) >> 1, 24, P.h);
}
