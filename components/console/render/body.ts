import { SITE } from '@/lib/site';
import {
  bevel,
  createSurface,
  dottedOutline,
  inDisc,
  inRR,
  mask,
  px,
  rect,
  shadow,
  spr,
  type BevelOptions,
  type Mask,
  type Rect,
  type Surface,
} from '../pixel/engine';
import { BF, SF, drawText, textWidth } from '../pixel/fonts';
import { C, type Color } from '../pixel/palette';
import { LABEL_ICON } from '../pixel/sprites';
import { drawNote, drawQuest } from './decor';
import {
  CART_W,
  CONTACT_ICON_GAP,
  CONTROL_LABELS,
  LAYOUTS,
  PILL,
  contactLabelWidth,
  type ConsoleLayout,
  type LayoutId,
  type Point,
} from './layout';

// Corps de la console TS-27 dans ses deux dispositions, avec l'état enfoncé des boutons.

export type ButtonId = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'select' | 'start';
export type Pressed = Partial<Record<ButtonId, boolean>>;

const BODY_BEVEL: BevelOptions = {
  outline: C.bo,
  top: [C.bh, C.bl],
  left: [C.bl],
  bottom: [C.bS, C.bS, C.bS, C.bS, C.bS, C.bs],
  right: [C.bS, C.bs],
  base: C.bb,
};

const RECESS_BEVEL: BevelOptions = {
  outline: C.bS,
  top: [C.bS],
  left: [C.bS],
  bottom: [C.bl],
  right: [C.bl],
  base: C.bs,
};

function bodyMask(L: ConsoleLayout): Mask {
  // Encoche de la fente : la cartouche s'y enfonce.
  const notch = (x: number, y: number) =>
    y < L.bodyTop + 2 && x >= L.cart.x - 6 && x < L.cart.x + CART_W + 6;
  if (L.id === 'landscape') {
    return mask(20, 30, 460, 252, (x, y) => {
      if (notch(x, y)) return false;
      return (
        inRR(x, y, 24, 36, 456, 235, 18) ||
        inRR(x, y, 24, 120, 152, 248, 30) ||
        inRR(x, y, 328, 120, 456, 248, 30)
      );
    });
  }
  // Portrait : coin inférieur droit très arrondi, comme une console verticale.
  const x0 = 4;
  const y0 = L.bodyTop;
  const x1 = 254;
  const y1 = L.bodyTop + 360;
  const R = 36;
  return mask(0, y0 - 2, L.w, y1 + 2, (x, y) => {
    if (notch(x, y) || !inRR(x, y, x0, y0, x1, y1, 16)) return false;
    const cx = x1 - R;
    const cy = y1 - R;
    if (x >= cx && y >= cy) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      return dx * dx + dy * dy <= R * R;
    }
    return true;
  });
}

function shoulders(s: Surface): void {
  const opt: BevelOptions = {
    outline: C.k0,
    top: [C.k3],
    left: [C.k3],
    bottom: [C.k1],
    right: [C.k1],
    base: C.k2,
  };
  bevel(s, mask(40, 28, 108, 46, (x, y) => inRR(x, y, 42, 30, 106, 44, 5)), opt);
  bevel(s, mask(372, 28, 440, 46, (x, y) => inRR(x, y, 374, 30, 438, 44, 5)), opt);
}

function bezel(s: Surface, S: Rect): void {
  const x0 = S.x - 8;
  const y0 = S.y - 10;
  const x1 = S.x + S.w + 8;
  const y1 = S.y + S.h + 20;
  bevel(s, mask(x0, y0, x1, y1, (x, y) => inRR(x, y, x0, y0, x1, y1, 6)), {
    outline: C.zo,
    top: [C.zl],
    left: [C.zl],
    base: C.zb,
  });
  rect(s, S.x - 1, S.y - 1, S.w + 2, S.h + 2, C.zo);
  // L'écran lui-même : ton LCD clair tant que le jeu n'a rien dessiné.
  rect(s, S.x, S.y, S.w, S.h, C.L0);
  for (let k = 0; k < 6; k++) {
    px(s, S.x - 4 + k, S.y + 7 - k, C.zl);
    px(s, S.x - 4 + k, S.y + 11 - k, C.zl);
  }
  // Voyant « disponible »
  rect(s, S.x + 1, S.y - 6, 3, 3, C.g1);
  px(s, S.x + 1, S.y - 6, C.g0);
  px(s, S.x + 3, S.y - 6, C.g0);
  px(s, S.x + 1, S.y - 4, C.g0);
  px(s, S.x + 3, S.y - 4, C.g0);
  drawText(s, SF, 'DISPO', S.x + 7, S.y - 7, C.dim);
  // Sérigraphie
  const name = SITE.name.toUpperCase();
  const role = `· ${SITE.role}`;
  const wN = textWidth(BF, name);
  const wR = textWidth(SF, role);
  const sx = S.x + (S.w >> 1) - ((wN + 5 + wR) >> 1);
  drawText(s, BF, name, sx, S.y + S.h + 7, C.cream);
  drawText(s, SF, role, sx + wN + 5, S.y + S.h + 9, C.rose);
}

// Texte centré en petite police ; `k` = pas de pixel (2 pour les libellés en portrait).
function centered(s: Surface, text: string, cx: number, y: number, c: Color, k = 1): void {
  drawText(s, SF, text, cx - ((textWidth(SF, text) * k) >> 1), y, c, k);
}

function dpadBase(s: Surface, D: Point, k: number): void {
  bevel(s, mask(D.x - 25, D.y - 25, D.x + 26, D.y + 26, (x, y) => inDisc(x, y, D.x, D.y, 23)), RECESS_BEVEL);
  centered(s, CONTROL_LABELS.dpad, D.x, D.y + 28, C.cream, k);
}

function faceBase(s: Surface, P: Point, label: string, k: number): void {
  bevel(s, mask(P.x - 14, P.y - 14, P.x + 15, P.y + 15, (x, y) => inDisc(x, y, P.x, P.y, 13)), RECESS_BEVEL);
  centered(s, label, P.x, P.y + 16, C.cream, k);
}

function pillBase(s: Surface, P: Point): void {
  const { x, y } = P;
  const { w, h } = PILL;
  bevel(
    s,
    mask(x - 3, y - 3, x + w + 3, y + h + 3, (i, j) => inRR(i, j, x - 2, y - 2, x + w + 2, y + h + 2, 6)),
    RECESS_BEVEL
  );
}

function startSelectBase(s: Surface, L: ConsoleLayout): void {
  pillBase(s, L.select);
  pillBase(s, L.start);
  const { x, y } = L.start;
  // Halo pointillé autour de START : le contact se voit toujours.
  const ring = mask(x - 7, y - 7, x + 38, y + 17, (i, j) => inRR(i, j, x - 4, y - 4, x + 35, y + 14, 7));
  dottedOutline(s, ring, C.y2);
  px(s, x - 6, y - 5, C.y3);
  px(s, x + 37, y - 5, C.y3);
  px(s, x - 7, y - 4, C.y2);
  px(s, x + 38, y - 4, C.y2);
  const k = L.labelScale;
  centered(s, CONTROL_LABELS.select, L.select.x + 15, L.select.y + 16, C.cream, k);
  // CONTACT suit le même pas de pixel que les autres libellés : il reste le plus gros.
  const tx = x + 15 - (contactLabelWidth(k) >> 1);
  const n = drawText(s, BF, CONTROL_LABELS.start, tx, y + 15, C.y2, k);
  spr(s, LABEL_ICON.mail, tx + n + CONTACT_ICON_GAP * k, y + 15, { '#': C.y2 }, k);
}

function speakerAndLogo(s: Surface, L: ConsoleLayout): void {
  for (let k = 0; k < 6; k++) {
    const sx = L.speaker.x + k * 7;
    const sy = L.speaker.y;
    for (let i = 0; i < 13; i++) {
      px(s, sx + i, sy - i, C.bS);
      px(s, sx + i + 1, sy - i, C.bS);
      px(s, sx + i + 2, sy - i, C.bl);
    }
  }
  drawText(s, BF, 'TS-27', L.logo.x, L.logo.y + 1, C.bS);
  drawText(s, BF, 'TS-27', L.logo.x, L.logo.y, C.bh);
  centered(s, 'PORTFOLIO', L.logo.x + 14, L.logo.y + 11, C.bl);
}

function drawBase(L: ConsoleLayout): Surface {
  const s = createSurface(L.w, L.h);
  drawNote(s, L.note, L.id);
  drawQuest(s, L.quest, L.id);
  const body = bodyMask(L);
  shadow(s, body, 5, 5, C.d0);
  if (L.shoulders) shoulders(s);
  bevel(s, body, BODY_BEVEL);
  bezel(s, L.screen);
  dpadBase(s, L.dpad, L.labelScale);
  faceBase(s, L.a, CONTROL_LABELS.a, L.labelScale);
  faceBase(s, L.b, CONTROL_LABELS.b, L.labelScale);
  startSelectBase(s, L);
  speakerAndLogo(s, L);
  return s;
}

/* ---------- Commandes (redessinées à chaque appui) ---------- */

const ARM_UP: BevelOptions = {
  outline: C.k0,
  top: [C.k1],
  left: [C.k1],
  bottom: [C.k2],
  right: [C.k2],
  base: C.k1,
};

function dpad(s: Surface, D: Point, pressed: Pressed): void {
  const vArm = (x: number, y: number) => inRR(x, y, D.x - 6, D.y - 19, D.x + 7, D.y + 20, 3);
  const hArm = (x: number, y: number) => inRR(x, y, D.x - 19, D.y - 6, D.x + 20, D.y + 7, 3);
  const cross = mask(D.x - 21, D.y - 21, D.x + 22, D.y + 22, (x, y) => vArm(x, y) || hArm(x, y));
  shadow(s, cross, 1, 2, C.bS);
  bevel(s, cross, {
    outline: C.k0,
    top: [C.k3],
    left: [C.k3],
    bottom: [C.k1, C.k1, C.k1],
    right: [C.k1],
    base: C.k2,
  });
  // Bras enfoncé : teintes inversées et joint sombre côté centre.
  const arms: Record<'up' | 'down' | 'left' | 'right', (x: number, y: number) => boolean> = {
    up: (x, y) => vArm(x, y) && y < D.y - 6,
    down: (x, y) => vArm(x, y) && y > D.y + 6,
    left: (x, y) => hArm(x, y) && x < D.x - 6,
    right: (x, y) => hArm(x, y) && x > D.x + 6,
  };
  for (const dir of ['up', 'down', 'left', 'right'] as const) {
    if (pressed[dir]) bevel(s, mask(D.x - 21, D.y - 21, D.x + 22, D.y + 22, arms[dir]), ARM_UP);
  }
  bevel(s, mask(D.x - 4, D.y - 4, D.x + 5, D.y + 5, (x, y) => inDisc(x, y, D.x, D.y - 1, 3)), {
    outline: C.k1,
    top: [C.k1],
    bottom: [C.k3],
    base: C.k2,
  });
  const ink = (dir: keyof typeof arms) => ({ '#': pressed[dir] ? C.k0 : C.k1 });
  spr(s, ['.#.', '###'], D.x - 1, D.y - 15, ink('up'));
  spr(s, ['###', '.#.'], D.x - 1, D.y + 11, ink('down'));
  spr(s, ['.#', '##', '.#'], D.x - 15, D.y - 2, ink('left'));
  spr(s, ['#.', '##', '#.'], D.x + 13, D.y - 2, ink('right'));
}

function faceButton(s: Surface, P: Point, letter: string, down: boolean): void {
  const { x, y } = P;
  const off = down ? 0 : -1;
  const cap = mask(x - 12, y - 13, x + 13, y + 12, (i, j) => inDisc(i, j, x, y + off, 10));
  // La lettre est en blanc (4,8:1 sur la framboise) avec une ombre gravée d'un pixel.
  if (down) {
    bevel(s, cap, { outline: C.ro, top: [C.r1], left: [C.r1], bottom: [C.r2], right: [C.r2], base: C.r2 });
    drawText(s, BF, letter, x - 2, y - 4, C.r1);
    drawText(s, BF, letter, x - 2, y - 5, C.white);
    return;
  }
  bevel(s, cap, {
    outline: C.ro,
    top: [C.r4, C.r3],
    left: [C.r3],
    bottom: [C.r1, C.r1, C.r1],
    right: [C.r1],
    base: C.r2,
  });
  rect(s, x - 7, y - 7, 2, 2, C.r4);
  drawText(s, BF, letter, x - 2, y - 5, C.r1);
  drawText(s, BF, letter, x - 2, y - 6, C.white);
}

interface PillStyle {
  o: Color;
  h: Color;
  s: Color;
  b: Color;
  text: Color;
}

const SELECT_STYLE: PillStyle = { o: C.k0, h: C.k3, s: C.k1, b: C.k2, text: C.pillt };
const START_STYLE: PillStyle = { o: C.y0, h: C.y3, s: C.y1, b: C.y2, text: C.y0 };

function pill(s: Surface, P: Point, name: string, st: PillStyle, down: boolean): void {
  const { w, h } = PILL;
  const x = P.x;
  const y = P.y + (down ? 1 : 0);
  const p = mask(x, y, x + w, y + h, (i, j) => inRR(i, j, x, y, x + w, y + h, 4));
  bevel(
    s,
    p,
    down
      ? { outline: st.o, top: [st.s], bottom: [st.b], base: st.b }
      : { outline: st.o, top: [st.h], bottom: [st.s, st.s], base: st.b }
  );
  drawText(s, SF, name, x + ((w - textWidth(SF, name)) >> 1), y + 2, st.text);
}

function drawControls(s: Surface, L: ConsoleLayout, pressed: Pressed): void {
  dpad(s, L.dpad, pressed);
  faceButton(s, L.a, 'A', !!pressed.a);
  faceButton(s, L.b, 'B', !!pressed.b);
  pill(s, L.select, 'SELECT', SELECT_STYLE, !!pressed.select);
  pill(s, L.start, 'START', START_STYLE, !!pressed.start);
}

const bases = new Map<LayoutId, Surface>();

// Dessine la console complète (post-it, encart de quête, corps, boutons) dans `target`.
export function renderConsole(id: LayoutId, pressed: Pressed, target?: Surface): Surface {
  const L = LAYOUTS[id];
  let base = bases.get(id);
  if (!base) {
    base = drawBase(L);
    bases.set(id, base);
  }
  const out = target ?? createSurface(L.w, L.h);
  out.data.set(base.data);
  drawControls(out, L, pressed);
  return out;
}
