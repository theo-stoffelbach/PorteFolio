import { SITE } from '@/lib/site';
import { bevel, hl, inRR, mask, px, rect, type Rect, type Surface } from '../pixel/engine';
import { SF, drawText } from '../pixel/fonts';
import { C, type Color } from '../pixel/palette';
import type { LayoutId } from './layout';

type Segment = [text: string, color: Color];

// Texte en segments colorés séparés de 4 px (comme sur la maquette).
function segments(s: Surface, parts: Segment[], x: number, y: number): void {
  let cx = x;
  for (const [text, color] of parts) cx += drawText(s, SF, text, cx, y, color) + 4;
}

// Touches en framboise foncée (6,5:1 sur le papier), consignes en encre.
const KEY = C.r1;

// Post-it des commandes, avec son ruban adhésif et son coin corné. Les touches
// de la console sont doublées de leur équivalent au clavier.
export function drawNote(s: Surface, r: Rect, layout: LayoutId): void {
  const { x, y, w, h } = r;
  rect(s, x + 2, y + 2, w, h, C.d0);
  rect(s, x, y, w, h, C.p0);
  for (let j = 0; j < 5; j++)
    for (let i = 0; i < 5; i++) {
      const cx = x + w - 5 + i;
      const cy = y + h - 5 + j;
      if (i + j > 4) px(s, cx, cy, C.d0);
      else if (i + j === 4 || (i >= 2 && j >= 2)) px(s, cx, cy, C.p1);
    }
  // En paysage, le post-it colle au haut de la scène : le ruban mord 4 lignes du
  // papier, au-dessus du texte. En portrait, il est remonté sur le bord (3 lignes
  // au-dessus du papier) et le texte descend d'une ligne : il ne touche plus « OUVRIR ».
  const portrait = layout === 'portrait';
  const tx = x + (w >> 1) - 13;
  const ty = portrait ? y - 3 : y - 1;
  rect(s, tx, ty, 28, 5, C.tape);
  hl(s, tx, tx + 28, ty, C.tapeH);
  const buttons: Segment[] = [
    ['A', KEY],
    ['(ENTRÉE)', KEY],
    ['OUVRIR ·', C.ink],
    ['B', KEY],
    ['(ÉCHAP)', KEY],
    ['RETOUR', C.ink],
  ];
  if (!portrait) {
    // Lignes espacées de 9 et 8 px : l'accent d'ENTRÉE ne touche pas la ligne du dessus.
    segments(s, [['← ↑ → ↓', KEY], ['POUR BOUGER', C.ink]], x + 6, y + 5);
    segments(s, buttons, x + 6, y + 14);
    drawText(s, SF, 'OU CLIQUE SUR UNE CARTOUCHE', x + 6, y + 22, C.ink);
  } else {
    segments(s, [['← ↑ → ↓', KEY], ['BOUGER ·', C.ink], ...buttons], x + 6, y + 6);
    drawText(s, SF, "OU TOUCHE UNE CARTOUCHE DE L'ÉTAGÈRE", x + 6, y + 14, C.ink);
  }
}

// Encart « quête en cours » : la disponibilité de Théo. En portrait, la promesse
// (« CDI à partir de juillet 2027 ») passe au double pas de pixel pour rester
// lisible sur un téléphone ; le titre et « Toulouse ou remote » restent au pas de 1.
export function drawQuest(s: Surface, r: Rect, layout: LayoutId): void {
  const { x, y, w, h } = r;
  rect(s, x + 2, y + 2, w, h, C.d0);
  const m = mask(x, y, x + w, y + h, (i, j) => inRR(i, j, x, y, x + w, y + h, 3));
  bevel(s, m, { outline: C.y1, base: C.qb });
  rect(s, x + 5, y + 4, 7, 9, C.y2);
  px(s, x + 5, y + 4, C.qb);
  px(s, x + 11, y + 4, C.qb);
  px(s, x + 5, y + 12, C.qb);
  px(s, x + 11, y + 12, C.qb);
  drawText(s, SF, '!', x + 8, y + 6, C.y0);
  drawText(s, SF, 'QUÊTE EN COURS', x + 16, y + 5, C.y2);
  if (layout === 'portrait') {
    // L'accent du À (doublé, 4 lignes) laisse 2 lignes sous le titre.
    drawText(s, SF, SITE.availability, x + 16, y + 18, C.cream, 2);
    drawText(s, SF, SITE.workMode, x + 16, y + 31, C.dim);
    return;
  }
  drawText(s, SF, SITE.availability, x + 16, y + 13, C.cream);
  drawText(s, SF, SITE.workMode, x + 16, y + 21, C.dim);
}
