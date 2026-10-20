import type { Rect } from '../pixel/engine';
import { BF, SF, textWidth } from '../pixel/fonts';
import { LABEL_ICON } from '../pixel/sprites';

// Les deux dispositions de la console, en pixels logiques.
// Les éléments DOM superposés (boutons, écran, fente) sont placés avec ces
// coordonnées multipliées par la variable CSS --px.

export type LayoutId = 'landscape' | 'portrait';

export type ControlId =
  | 'screen'
  | 'dpad'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'a'
  | 'b'
  | 'select'
  | 'start';

export interface Point {
  x: number;
  y: number;
}

export interface ConsoleLayout {
  id: LayoutId;
  w: number;
  h: number;
  screen: Rect;
  // Cartouche dans la fente : position au repos (à moitié insérée) et profondeur d'enfoncement.
  cart: Point & { sink: number };
  bodyTop: number;
  note: Rect;
  quest: Rect;
  dpad: Point;
  a: Point;
  b: Point;
  select: Point;
  start: Point;
  logo: Point;
  speaker: Point;
  shoulders: boolean;
  // Pas de pixel des libellés gravés sous les commandes et de la ligne « CDI » de
  // l'encart de quête : 1 en paysage, 2 en portrait (lisibles sur un téléphone).
  labelScale: 1 | 2;
  controls: Record<ControlId, Rect>;
}

export const SCREEN_W = 224;
export const SCREEN_H = 126;
export const CART_W = 84;
export const CART_H = 52;
// La cartouche projette une ombre de 5 px : son canvas est un peu plus grand.
export const CART_CANVAS = { w: CART_W + 5, h: CART_H + 5 };
export const SHELF_CART = { w: 64, h: 40, canvasW: 67 };
export const PILL = { w: 31, h: 10 };

// Libellés gravés sous les commandes (dessinés par render/body.ts).
export const CONTROL_LABELS = {
  dpad: 'NAVIGUER',
  a: 'OUVRIR',
  b: 'RETOUR',
  select: 'MODE RAPIDE',
  start: 'CONTACT',
} as const;

// Écart entre le mot CONTACT et son enveloppe, à l'échelle 1.
export const CONTACT_ICON_GAP = 3;

// Largeur du libellé CONTACT (texte, écart et enveloppe) au pas de pixel k.
export function contactLabelWidth(k: number): number {
  return (textWidth(BF, CONTROL_LABELS.start) + CONTACT_ICON_GAP + LABEL_ICON.mail[0].length) * k;
}

// Zone de clic d'une pastille (SELECT, START) élargie à son libellé agrandi,
// pour qu'un doigt posé sur « MODE RAPIDE » ou « CONTACT » déclenche la commande.
function widenToLabel(r: Rect, labelW: number, labelBottom: number): Rect {
  const cx = r.x + (r.w >> 1);
  const w = Math.max(r.w, labelW + 8);
  return { x: cx - (w >> 1), y: r.y, w, h: Math.max(r.h, labelBottom + 3 - r.y) };
}

function controls(base: Omit<ConsoleLayout, 'controls'>): Record<ControlId, Rect> {
  const { screen, dpad: D, a, b, select, start, labelScale: k } = base;
  const selectHit = { x: select.x - 8, y: select.y - 5, w: PILL.w + 16, h: 29 };
  const startHit = { x: start.x - 8, y: start.y - 8, w: PILL.w + 16, h: 33 };
  return {
    screen,
    dpad: { x: D.x - 25, y: D.y - 25, w: 51, h: 51 },
    up: { x: D.x - 7, y: D.y - 21, w: 15, h: 15 },
    down: { x: D.x - 7, y: D.y + 7, w: 15, h: 15 },
    left: { x: D.x - 21, y: D.y - 7, w: 15, h: 15 },
    right: { x: D.x + 7, y: D.y - 7, w: 15, h: 15 },
    a: { x: a.x - 14, y: a.y - 14, w: 29, h: 29 },
    b: { x: b.x - 14, y: b.y - 14, w: 29, h: 29 },
    // Au pas de 1, les zones d'origine couvrent déjà pastille et libellé.
    select:
      k === 1
        ? selectHit
        : widenToLabel(selectHit, textWidth(SF, CONTROL_LABELS.select) * k, select.y + 16 + SF.height * k),
    start:
      k === 1 ? startHit : widenToLabel(startHit, contactLabelWidth(k), start.y + 15 + BF.height * k),
  };
}

function makeLayout(base: Omit<ConsoleLayout, 'controls'>): ConsoleLayout {
  return { ...base, controls: controls(base) };
}

// Console paysage : reprise exacte de la maquette approuvée (scène 480 × 258).
export const LANDSCAPE: ConsoleLayout = makeLayout({
  id: 'landscape',
  w: 480,
  h: 258,
  screen: { x: 128, y: 54, w: SCREEN_W, h: SCREEN_H },
  cart: { x: 198, y: 2, sink: 14 },
  bodyTop: 36,
  note: { x: 6, y: 1, w: 144, h: 29 },
  quest: { x: 346, y: 1, w: 128, h: 28 },
  dpad: { x: 72, y: 108 },
  a: { x: 422, y: 98 },
  b: { x: 394, y: 118 },
  select: { x: 196, y: 205 },
  start: { x: 253, y: 205 },
  logo: { x: 58, y: 197 },
  speaker: { x: 399, y: 225 },
  shoulders: true,
  labelScale: 1,
});

// Console portrait (mobile) : écran en haut, commandes dessous, comme une console verticale.
// Les libellés y sont au double pas de pixel : A et B s'écartent, SELECT passe sous
// la croix et START sous A et B pour que « MODE RAPIDE » et « CONTACT » tiennent côte à côte.
export const PORTRAIT: ConsoleLayout = makeLayout({
  id: 'portrait',
  w: 260,
  h: 479,
  screen: { x: 17, y: 96, w: SCREEN_W, h: SCREEN_H },
  cart: { x: 87, y: 44, sink: 14 },
  bodyTop: 78,
  note: { x: 6, y: 452, w: 246, h: 23 },
  quest: { x: 4, y: 1, w: 250, h: 38 },
  dpad: { x: 62, y: 294 },
  a: { x: 222, y: 282 },
  b: { x: 180, y: 304 },
  select: { x: 47, y: 344 },
  start: { x: 171, y: 344 },
  logo: { x: 22, y: 400 },
  speaker: { x: 172, y: 428 },
  shoulders: false,
  labelScale: 2,
});

export const LAYOUTS: Record<LayoutId, ConsoleLayout> = {
  landscape: LANDSCAPE,
  portrait: PORTRAIT,
};

// Largeur (px CSS) sous laquelle la console passe en portrait (même seuil que
// les media queries de console.module.css et de app/globals.css).
export const PORTRAIT_MAX_WIDTH = 719.98;

// Image du corps de chaque disposition, générée au build par app/pixel/[name]/route.ts.
const BODY_IMAGE_DIR = '/pixel/';
export const BODY_IMAGE: Record<LayoutId, string> = {
  landscape: `${BODY_IMAGE_DIR}console-paysage.png`,
  portrait: `${BODY_IMAGE_DIR}console-portrait.png`,
};
