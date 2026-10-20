import {
  bevel,
  blit,
  createRng,
  createSurface,
  hl,
  inRR,
  mask,
  px,
  rect,
  spr,
  vl,
  type Surface,
} from '../pixel/engine';
import { SF, accentRise, drawText, textWidth } from '../pixel/fonts';
import { LCD, LM } from '../pixel/palette';
import {
  BENCH,
  BOULANGERE,
  BUBBLE,
  CARTICO,
  CLOUD,
  FACTEUR,
  LANTERN,
  MAILBOX,
  PASTRY,
  THEO_FRONT,
  THEO_WALK_L,
  THEO_WALK_R,
} from '../pixel/sprites';
import { SH, SW, fillRR } from './ui';

// La rue toulousaine : environ quatre écrans de briques roses, des lieux à visiter
// et un décor lointain qui défile moins vite (parallaxe).

const { L0, L1, L2, L3 } = LCD;

export const WORLD_W = 928;
const WORLD_H = 90;
const FAR_W = Math.ceil((WORLD_W - SW) * 0.5) + SW;
export const THEO_START = 84;
export const THEO_MIN = 8;
export const THEO_MAX = WORLD_W - 12;
// Le facteur attend devant la boulangerie, comme sur la maquette.
const FACTEUR_LEFT = 184;
const FACTEUR_CENTER = FACTEUR_LEFT + 6;

export type PlaceId =
  | 'facteur'
  | 'boulangerie'
  | 'ludotheque'
  | 'poste'
  | 'ecole'
  | 'sii'
  | 'serveur'
  | 'garonne';

export interface Place {
  id: PlaceId;
  label: string;
  x0: number;
  x1: number;
  // Où Théo se place pour entrer.
  spot: number;
  // Haut du bâtiment (pour le clic sur l'écran).
  top: number;
}

export const PLACES: readonly Place[] = [
  // La zone du facteur contient l'endroit où Théo s'arrête pour lui parler.
  { id: 'facteur', label: 'LE FACTEUR', x0: FACTEUR_CENTER - 16, x1: FACTEUR_CENTER + 10, spot: FACTEUR_CENTER - 14, top: 44 },
  { id: 'boulangerie', label: 'CHOCOLATINES', x0: 158, x1: 226, spot: 213, top: 10 },
  { id: 'ludotheque', label: 'LUDOTHÈQUE', x0: 236, x1: 324, spot: 307, top: 8 },
  { id: 'poste', label: 'LA POSTE', x0: 344, x1: 412, spot: 378, top: 18 },
  { id: 'ecole', label: "L'ÉCOLE", x0: 428, x1: 520, spot: 474, top: 2 },
  { id: 'sii', label: 'SII', x0: 540, x1: 612, spot: 576, top: 2 },
  { id: 'serveur', label: 'LE SERVEUR', x0: 628, x1: 700, spot: 664, top: 16 },
  { id: 'garonne', label: 'LA GARONNE', x0: 724, x1: WORLD_W, spot: 790, top: 30 },
];

export function placeById(id: PlaceId): Place {
  return PLACES.find((p) => p.id === id) as Place;
}

// Lieu devant lequel se trouve Théo (le facteur passe avant la boulangerie).
export function placeAt(x: number): Place | null {
  for (const p of PLACES) {
    if (p.id === 'facteur' ? x >= p.x0 && x <= p.x1 : x >= p.x0 + 2 && x <= p.x1 - 2) return p;
  }
  return null;
}

// Lieu touché par un clic (coordonnées monde).
export function placeHit(wx: number, y: number): Place | null {
  if (Math.abs(wx - FACTEUR_CENTER) <= 7 && y >= 44 && y < 80) return placeById('facteur');
  // Panneau « PROJETS → » : mène à la ludothèque.
  if (wx >= 112 && wx < 158 && y >= 44 && y < 80) return placeById('ludotheque');
  for (const p of PLACES) {
    if (p.id !== 'facteur' && wx >= p.x0 && wx < p.x1 && y >= p.top && y < 80) return p;
  }
  return null;
}

/* ---------- Décor fixe, dessiné une seule fois ---------- */

function bricks(s: Surface, x0: number, y0: number, w: number, h: number): void {
  rect(s, x0, y0, w, h, L1);
  for (let y = y0; y < y0 + h; y++) {
    const r = y - y0;
    if (r % 3 === 2) {
      for (let x = x0; x < x0 + w; x++) if ((x + r) % 11 !== 0) px(s, x, y, L2);
    } else {
      const off = Math.floor(r / 3) % 2 ? 4 : 0;
      for (let x = x0; x < x0 + w; x++) if ((x - x0 + off) % 8 === 0) px(s, x, y, L2);
    }
  }
}

// Fenêtre à volets (maquette).
function win(s: Surface, x: number, y: number): void {
  for (const sx of [x, x + 14]) {
    rect(s, sx, y, 4, 16, L3);
    rect(s, sx + 1, y + 1, 2, 14, L2);
    for (let j = y + 3; j < y + 15; j += 3) rect(s, sx + 1, j, 2, 1, L3);
  }
  rect(s, x + 4, y - 1, 10, 17, L0);
  rect(s, x + 5, y + 1, 8, 14, L3);
  vl(s, x + 9, y + 1, y + 15, L0);
  hl(s, x + 5, x + 13, y + 6, L0);
  px(s, x + 6, y + 3, L2);
  px(s, x + 7, y + 2, L2);
  px(s, x + 10, y + 3, L2);
  px(s, x + 11, y + 2, L2);
  px(s, x + 6, y + 9, L2);
  px(s, x + 10, y + 9, L2);
  rect(s, x + 3, y + 16, 12, 1, L0);
  rect(s, x + 3, y + 17, 12, 1, L2);
}

// Corniche à modillons.
function cornice(s: Surface, x0: number, x1: number, y: number): void {
  rect(s, x0, y, x1 - x0, 5, L2);
  hl(s, x0, x1, y, L3);
  for (let x = x0; x < x1; x++) {
    if (x % 4 === 0) vl(s, x, y + 1, y + 4, L3);
    if (x % 4 === 2) px(s, x, y + 4, L3);
  }
}

function plinth(s: Surface, x0: number, x1: number): void {
  rect(s, x0, 66, x1 - x0, 4, L2);
  hl(s, x0, x1, 66, L3);
}

// Enseigne sombre en police SF. Le bandeau monte d'autant qu'il faut pour
// que l'accent d'une capitale (É) reste dedans, avec un pixel de marge.
function sign(s: Surface, x0: number, x1: number, y: number, text: string): void {
  const top = Math.max(2, accentRise(SF, text) + 1);
  rect(s, x0, y + 2 - top, x1 - x0, top + 7, L3);
  drawText(s, SF, text, x0 + ((x1 - x0 - textWidth(SF, text)) >> 1), y + 2, L0);
}

function lamp(s: Surface, x: number): void {
  spr(s, LANTERN, x - 3, 23, LM);
  rect(s, x, 32, 1, 46, L3);
  rect(s, x + 1, 32, 1, 46, L2);
  rect(s, x - 2, 75, 5, 3, L3);
}

function house(s: Surface): void {
  rect(s, 0, 5, 68, 5, L2);
  hl(s, 0, 68, 5, L3);
  for (let x = 0; x < 68; x++) {
    if (x % 4 === 0) vl(s, x, 6, 9, L3);
    if (x % 4 === 2) px(s, x, 9, L3);
  }
  rect(s, 0, 10, 66, 2, L0);
  bricks(s, 0, 12, 66, 54);
  for (let x = 1; x < 66; x += 3) px(s, x, 12, L2);
  win(s, 4, 17);
  win(s, 38, 17);
  // Porte cintrée
  for (let y = 42; y < 66; y++)
    for (let x = 22; x < 38; x++) {
      if (inRR(x, y, 22, 42, 38, 80, 8)) px(s, x, y, inRR(x, y, 24, 44, 36, 80, 6) ? L3 : L0);
    }
  vl(s, 30, 47, 66, L2);
  rect(s, 25, 52, 3, 7, L2);
  rect(s, 33, 52, 3, 7, L2);
  px(s, 29, 58, L1);
  px(s, 31, 58, L1);
  rect(s, 42, 46, 12, 14, L0);
  rect(s, 43, 47, 10, 12, L3);
  vl(s, 46, 47, 59, L2);
  vl(s, 49, 47, 59, L2);
  rect(s, 41, 60, 14, 1, L0);
  plinth(s, 0, 66);
  vl(s, 65, 5, 70, L3);
}

function projectsSign(s: Surface): void {
  rect(s, 130, 52, 2, 26, L3);
  const m = mask(112, 44, 158, 58, (x, y) => {
    if (y < 46 || y > 55) return false;
    if (x >= 113 && x < 150) return true;
    const d = x - 150;
    return d >= 0 && Math.abs(y + 0.5 - 51) <= 5 - d;
  });
  bevel(s, m, { outline: L3, bottom: [L1], base: L0 });
  drawText(s, SF, 'PROJETS', 117, 49, L3);
}

function bakery(s: Surface): void {
  rect(s, 156, 10, 72, 5, L2);
  hl(s, 156, 228, 10, L3);
  for (let x = 156; x < 228; x++) {
    if (x % 4 === 0) vl(s, x, 11, 14, L3);
    if (x % 4 === 2) px(s, x, 14, L3);
  }
  rect(s, 158, 15, 68, 2, L0);
  bricks(s, 158, 17, 68, 49);
  win(s, 164, 21);
  win(s, 196, 21);
  plinth(s, 158, 226);
  vl(s, 158, 10, 70, L3);
  vl(s, 225, 10, 70, L3);
  rect(s, 162, 40, 58, 8, L3);
  drawText(s, SF, 'CHOCOLATINES', 167, 41, L0);
  hl(s, 160, 222, 48, L3);
  // Store rayé
  for (let x = 160; x < 222; x++) {
    const st = Math.floor((x - 160) / 4) % 2 ? L2 : L0;
    for (let y = 49; y < 54; y++) px(s, x, y, st);
    if ((x - 160) % 4 === 1 || (x - 160) % 4 === 2) px(s, x, 54, st);
  }
  // Vitrine
  rect(s, 162, 57, 38, 13, L0);
  rect(s, 163, 58, 36, 11, L3);
  for (let i = 0; i < 6; i++) spr(s, PASTRY, 165 + i * 6, 64, LM);
  hl(s, 163, 199, 67, L2);
  // Porte ouverte et boulangère
  rect(s, 203, 56, 15, 14, L0);
  rect(s, 205, 58, 11, 12, L3);
  spr(s, BOULANGERE, 205, 58, LM);
}

function ludotheque(s: Surface): void {
  cornice(s, 234, 326, 8);
  rect(s, 236, 13, 88, 2, L0);
  bricks(s, 236, 15, 88, 51);
  win(s, 242, 18);
  win(s, 271, 18);
  win(s, 300, 18);
  // Enseigne et petites cartouches de part et d'autre
  rect(s, 240, 39, 80, 11, L3);
  drawText(s, SF, 'LUDOTHÈQUE', 280 - (textWidth(SF, 'LUDOTHÈQUE') >> 1), 43, L0);
  spr(s, CARTICO, 245, 41, { '3': L1, '0': L3 });
  spr(s, CARTICO, 310, 41, { '3': L1, '0': L3 });
  // Vitrine de cartouches
  rect(s, 241, 52, 52, 14, L0);
  rect(s, 242, 53, 50, 12, L3);
  for (let i = 0; i < 6; i++) {
    const cx = 245 + i * 8;
    rect(s, cx, 55, 6, 9, i % 2 ? L1 : L2);
    px(s, cx + 5, 55, L3);
    rect(s, cx + 1, 59, 4, 3, L0);
  }
  // Porte
  rect(s, 298, 50, 20, 16, L0);
  rect(s, 300, 52, 16, 14, L2);
  rect(s, 302, 54, 12, 5, L3);
  px(s, 313, 60, L0);
  plinth(s, 236, 324);
  vl(s, 236, 8, 70, L3);
  vl(s, 323, 8, 70, L3);
}

function poste(s: Surface): void {
  cornice(s, 342, 414, 18);
  rect(s, 344, 23, 68, 2, L0);
  // Pierre de taille
  rect(s, 344, 25, 68, 41, L1);
  for (let y = 25, k = 0; y < 66; y += 6, k++) {
    hl(s, 344, 412, y, L2);
    for (let x = 344; x < 412; x++) if ((x - 344 + (k % 2) * 6) % 12 === 0) vl(s, x, y + 1, Math.min(66, y + 6), L2);
  }
  sign(s, 350, 406, 28, 'LA POSTE');
  // Fenêtres
  for (const wx of [350, 394]) {
    rect(s, wx, 41, 12, 16, L0);
    rect(s, wx + 1, 42, 10, 14, L3);
    vl(s, wx + 6, 42, 56, L0);
    hl(s, wx + 1, wx + 11, 48, L0);
  }
  // Porte cintrée
  for (let y = 42; y < 66; y++)
    for (let x = 370; x < 386; x++) {
      if (inRR(x, y, 370, 42, 386, 80, 8)) px(s, x, y, inRR(x, y, 372, 44, 384, 80, 6) ? L2 : L0);
    }
  vl(s, 378, 47, 66, L3);
  plinth(s, 344, 412);
  vl(s, 344, 18, 70, L3);
  vl(s, 411, 18, 70, L3);
  spr(s, MAILBOX, 398, 60, LM);
}

function ecole(s: Surface): void {
  // Fronton triangulaire et horloge
  const cx = 474;
  for (let y = 2; y < 14; y++) {
    const half = (y - 2) * 4 + 2;
    rect(s, cx - half, y, half * 2, 1, L2);
    px(s, cx - half, y, L3);
    px(s, cx + half - 1, y, L3);
  }
  for (let y = 3; y < 13; y++)
    for (let x = cx - 5; x < cx + 5; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - 8;
      const d = dx * dx + dy * dy;
      if (d <= 25) px(s, x, y, d > 16 ? L3 : L0);
    }
  vl(s, cx, 5, 9, L3);
  hl(s, cx, cx + 3, 8, L3);
  cornice(s, 426, 522, 14);
  rect(s, 428, 19, 92, 2, L0);
  bricks(s, 428, 21, 92, 45);
  sign(s, 450, 498, 24, "L'ÉCOLE");
  // Hautes fenêtres cintrées
  for (const wx of [434, 448, 488, 502]) {
    for (let y = 36; y < 58; y++)
      for (let x = wx; x < wx + 12; x++) {
        if (inRR(x, y, wx, 36, wx + 12, 70, 6)) px(s, x, y, inRR(x, y, wx + 1, 37, wx + 11, 70, 5) ? L3 : L0);
      }
    vl(s, wx + 6, 38, 58, L0);
    hl(s, wx, wx + 12, 58, L0);
  }
  for (let y = 40; y < 66; y++)
    for (let x = 466; x < 482; x++) {
      if (inRR(x, y, 466, 40, 482, 80, 8)) px(s, x, y, inRR(x, y, 468, 42, 480, 80, 6) ? L2 : L0);
    }
  vl(s, 474, 45, 66, L3);
  plinth(s, 428, 520);
  rect(s, 462, 64, 24, 2, L0);
  vl(s, 428, 14, 70, L3);
  vl(s, 519, 14, 70, L3);
}

function sii(s: Surface): void {
  rect(s, 538, 2, 76, 3, L3);
  rect(s, 540, 5, 72, 61, L2);
  vl(s, 540, 2, 70, L3);
  vl(s, 611, 2, 70, L3);
  // Enseigne
  rect(s, 559, 8, 34, 14, L0);
  hl(s, 559, 593, 21, L1);
  drawText(s, SF, 'SII', 576 - textWidth(SF, 'SII'), 10, L3, 2);
  // Façade vitrée
  for (let y = 26; y < 50; y += 8)
    for (let x = 544; x < 608; x += 8) {
      rect(s, x, y, 6, 6, L3);
      px(s, x + 1, y + 1, L1);
    }
  rect(s, 564, 50, 24, 16, L0);
  rect(s, 566, 52, 9, 14, L3);
  rect(s, 577, 52, 9, 14, L3);
  px(s, 567, 53, L1);
  px(s, 578, 53, L1);
  rect(s, 540, 66, 72, 4, L3);
}

// Position des LED du serveur (animées à chaque image).
const SERVER_LEDS = Array.from({ length: 11 }, (_, i) => ({ x: 643 + i * 4, y: 38 }));

function serveur(s: Surface): void {
  cornice(s, 626, 702, 16);
  rect(s, 628, 21, 72, 2, L0);
  bricks(s, 628, 23, 72, 43);
  sign(s, 640, 688, 25, 'LE SERVEUR');
  rect(s, 640, 36, 48, 5, L3);
  // Porte de garage
  rect(s, 638, 42, 52, 24, L0);
  rect(s, 640, 44, 48, 22, L2);
  for (let y = 46; y < 66; y += 3) hl(s, 640, 688, y, L3);
  rect(s, 662, 62, 4, 1, L0);
  plinth(s, 628, 700);
  vl(s, 628, 16, 70, L3);
  vl(s, 699, 16, 70, L3);
}

function garonne(s: Surface): void {
  // Le Pont-Neuf et ses arches, au-dessus de l'eau
  rect(s, 724, 30, 204, 3, L2);
  hl(s, 724, WORLD_W, 30, L3);
  rect(s, 724, 33, 204, 19, L2);
  for (let i = 0; i < 6; i++) {
    const ax = 732 + i * 34;
    for (let y = 37; y < 52; y++)
      for (let x = ax; x < ax + 26; x++) {
        const dx = x + 0.5 - (ax + 13);
        const dy = y + 0.5 - 52;
        if (dx * dx + dy * dy <= 13 * 13) px(s, x, y, L1);
      }
    // Les « dégueuloirs » des piles
    const hx = ax + 30;
    for (let y = 37; y < 44; y++)
      for (let x = hx - 3; x < hx + 3; x++) {
        const dx = x + 0.5 - hx;
        const dy = y + 0.5 - 40;
        if (dx * dx + dy * dy <= 7) px(s, x, y, L0);
      }
  }
  // Le fleuve
  rect(s, 716, 52, 212, 10, L1);
  const rnd = createRng(31);
  for (let k = 0; k < 26; k++) {
    const x = 716 + ((rnd() * 200) | 0);
    const y = 53 + ((rnd() * 8) | 0);
    hl(s, x, Math.min(WORLD_W, x + 3 + ((rnd() * 5) | 0)), y, L0);
  }
  // Parapet du quai et sa plaque
  hl(s, 716, WORLD_W, 62, L0);
  bricks(s, 716, 63, 212, 7);
  hl(s, 716, WORLD_W, 63, L2);
  sign(s, 770, 818, 61, 'LA GARONNE');
  vl(s, 716, 30, 70, L3);
}

function pavement(s: Surface): void {
  rect(s, 0, 70, WORLD_W, 16, L0);
  hl(s, 0, WORLD_W, 70, L1);
  hl(s, 0, WORLD_W, 77, L1);
  for (let x = 0; x < WORLD_W; x++) {
    if (x % 16 === 5) vl(s, x, 71, 77, L1);
    if (x % 16 === 13) vl(s, x, 78, 86, L1);
  }
}

// Premier plan : façades, trottoir, lampadaires, panneau.
export function buildWorld(): Surface {
  const s = createSurface(WORLD_W, WORLD_H);
  house(s);
  bakery(s);
  ludotheque(s);
  poste(s);
  ecole(s);
  sii(s);
  serveur(s);
  garonne(s);
  pavement(s);
  for (const x of [60, 330, 418, 528, 620, 710, 868]) lamp(s, x);
  projectsSign(s);
  spr(s, BENCH, 742, 67, LM);
  return s;
}

function tower(s: Surface, tcx: number): void {
  for (let r = 0; r < 8; r++) rect(s, tcx - r, 1 + r, 2 * r + 1, 1, L1);
  px(s, tcx, 0, L1);
  const tiers: [number, number, number, number][] = [
    [tcx - 7, tcx + 7, 9, 15],
    [tcx - 9, tcx + 9, 15, 22],
    [tcx - 11, tcx + 11, 22, 30],
    [tcx - 14, tcx + 14, 30, 46],
  ];
  for (const [x0, x1, y0, y1] of tiers) {
    rect(s, x0, y0, x1 - x0, y1 - y0, L1);
    rect(s, x0 - 1, y0, x1 - x0 + 2, 1, L1);
    const n = Math.floor((x1 - x0 - 2) / 5);
    const start = x0 + Math.floor((x1 - x0 - (n * 5 - 2)) / 2);
    for (let i = 0; i < n; i++) {
      const bx = start + i * 5;
      px(s, bx + 1, y0 + 2, L0);
      rect(s, bx, y0 + 3, 3, Math.min(3, y1 - y0 - 4), L0);
    }
  }
}

// Le dôme de la Grave, qui apparaît en approchant de la Garonne.
function dome(s: Surface, cx: number): void {
  rect(s, cx - 1, 8, 3, 6, L1);
  px(s, cx, 6, L1);
  for (let y = 14; y < 30; y++)
    for (let x = cx - 14; x <= cx + 14; x++) {
      const dx = x - cx;
      const dy = y - 30;
      if (dx * dx + dy * dy <= 14 * 14) px(s, x, y, L1);
    }
  for (const dx of [-8, 0, 8]) vl(s, cx + dx, 18, 30, L2);
  rect(s, cx - 16, 30, 33, 40, L1);
  for (let x = cx - 13; x < cx + 14; x += 6) rect(s, x, 36, 2, 5, L0);
}

function farHouse(s: Surface, x0: number, x1: number, top: number): void {
  rect(s, x0, top, x1 - x0, 70 - top, L1);
  hl(s, x0, x1, top, L2);
  for (let wy = top + 4; wy < 64; wy += 8) for (let wx = x0 + 3; wx < x1 - 3; wx += 6) rect(s, wx, wy, 2, 3, L0);
}

// Arrière-plan : maisons lointaines, clocher octogonal, dôme.
export function buildFar(): Surface {
  const s = createSurface(FAR_W, WORLD_H);
  tower(s, 112);
  dome(s, 476);
  // Les maisons de la maquette, puis une suite pseudo-aléatoire stable.
  const mock: [number, number, number][] = [
    [66, 90, 40],
    [88, 104, 46],
    [102, 122, 42],
    [120, 140, 44],
    [138, 158, 38],
  ];
  const rnd = createRng(8);
  const houses: [number, number, number][] = [];
  for (let x = 0; x < 66; ) {
    const w = 16 + ((rnd() * 9) | 0);
    houses.push([x, Math.min(66, x + w), 38 + ((rnd() * 10) | 0)]);
    x += w - 2;
  }
  houses.push(...mock);
  for (let x = 156; x < FAR_W; ) {
    const w = 16 + ((rnd() * 9) | 0);
    houses.push([x, x + w, 36 + ((rnd() * 12) | 0)]);
    x += w - 2;
  }
  for (const [x0, x1, top] of houses) farHouse(s, x0, x1, top);
  return s;
}

/* ---------- Dessin d'une image de la rue ---------- */

export interface StreetView {
  cam: number;
  t: number;
  animate: boolean;
  theoX: number;
  facing: -1 | 1;
  walking: boolean;
  walkFrame: number;
  played: number;
  total: number;
}

const CLOUDS: [number, number][] = [
  [66, 14],
  [132, 26],
  [236, 10],
  [330, 22],
  [430, 12],
  [520, 25],
];
const CLOUD_SPACE = 600;

export function drawStreet(s: Surface, world: Surface, far: Surface, v: StreetView): void {
  rect(s, 0, 0, SW, SH, L0);
  const drift = v.animate ? v.t / 400 : 0;
  for (const [cx, cy] of CLOUDS) {
    let x = Math.round(cx - v.cam * 0.25 - drift) % CLOUD_SPACE;
    if (x < -20) x += CLOUD_SPACE;
    if (x < SW) spr(s, CLOUD, x, cy, LM);
  }
  blit(s, far, 0, 0, Math.round(v.cam * 0.5), 0, SW, WORLD_H);
  blit(s, world, 0, 0, v.cam, 0, SW, WORLD_H);

  // LED du serveur : un chenillard discret
  const step = v.animate ? Math.floor(v.t / 160) : 0;
  for (let i = 0; i < SERVER_LEDS.length; i++) {
    const led = SERVER_LEDS[i];
    const x = led.x - v.cam;
    if (x < -2 || x > SW) continue;
    const on = (i * 3 + step) % 5 < 2;
    rect(s, x, led.y, 2, 1, on ? L0 : L2);
  }

  // Le facteur et sa bulle « ! »
  const fx = FACTEUR_LEFT - v.cam;
  if (fx > -16 && fx < SW) {
    rect(s, fx + 1, 77, 11, 2, L1);
    spr(s, FACTEUR, fx, 57, LM);
    const bob = v.animate && Math.floor(v.t / 500) % 2 ? 1 : 0;
    rect(s, fx + 3, 45 - bob, 7, 10, L0);
    spr(s, BUBBLE, fx + 4, 46 - bob, LM);
  }

  // Théo
  const tx = Math.round(v.theoX) - 6 - v.cam;
  rect(s, tx + 1, 77, 11, 2, L1);
  const frames = v.facing < 0 ? THEO_WALK_L : THEO_WALK_R;
  spr(s, v.walking ? frames[v.walkFrame % frames.length] : THEO_FRONT, tx, 57, LM);

  // Compteur de cartouches lancées
  const hud = `${v.played}/${v.total}`;
  const hx = 220 - textWidth(SF, hud);
  fillRR(s, hx - 10, 1, 223, 11, 2, L0);
  spr(s, CARTICO, hx - 7, 3, LM);
  drawText(s, SF, hud, hx, 4, L3);
}

export function cameraFor(theoX: number): number {
  return Math.max(0, Math.min(WORLD_W - SW, Math.round(theoX) - 112));
}
