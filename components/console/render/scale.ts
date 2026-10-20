// Échelle du monde pixel : combien de pixels CSS pour un pixel logique (--px).
//
// Paysage : la partie dessinée de la scène va du post-it (x = 6) à l'encart de
// quête (x = 474), soit 468 pixels logiques, et doit tenir dans la largeur moins
// une gouttière de 16 px de chaque côté. En hauteur, la scène au-dessus de
// l'étagère (258 pixels logiques, moins les 5 que l'étagère recouvre) doit tenir
// avec le haut de l'étagère jusqu'au nom des premières cartouches (47 pixels
// logiques : chant 1, marge 3, titre 8, dégagement 4, étiquette jusqu'à la
// 2e ligne du nom 31 ; voir .shelf et .cartList dans console.module.css).
// Portrait (mobile) : la console verticale fait 260 pixels de large.
//
// Le pixel reste net (multiple du pixel physique) quand l'arrondi coûte peu ;
// sinon l'échelle reste fluide. Les mêmes formules, sans l'arrondi, servent de
// valeur de départ en CSS avant le JavaScript (app/globals.css).

export const SCALE = {
  contentW: 468,
  stageH: 253,
  shelfRows: 47,
  gutter: 16,
  max: 6,
  portraitW: 260,
  portraitMax: 4,
  // Écart toléré pour arrondir au pixel physique : 6 % vers le bas, 1 % vers le haut.
  roundDown: 0.06,
  roundUp: 0.01,
} as const;

// Arrondit au pixel physique si l'écart reste faible et que `limit` le permet.
function crisp(fit: number, dpr: number, limit: number): number {
  const up = Math.ceil(fit * dpr - 1e-6) / dpr;
  if (up <= fit * (1 + SCALE.roundUp) && up <= limit) return up;
  const down = Math.floor(fit * dpr + 1e-6) / dpr;
  return down > 0 && down >= fit * (1 - SCALE.roundDown) ? down : fit;
}

export function consoleScale(width: number, height: number, dpr: number, portrait: boolean): number {
  const ratio = dpr > 0 ? dpr : 1;
  if (portrait) {
    const fit = Math.min((width - 2 * SCALE.gutter) / SCALE.portraitW, SCALE.portraitMax);
    // Arrondi vers le haut seulement si la gouttière garde au moins 8 px.
    return crisp(fit, ratio, Math.min((width - SCALE.gutter) / SCALE.portraitW, SCALE.portraitMax));
  }
  const fitW = (width - 2 * SCALE.gutter) / SCALE.contentW;
  const fitH = height / (SCALE.stageH + SCALE.shelfRows);
  // Fenêtre très basse : la console garde une taille lisible, la page défile.
  const fit = Math.max(Math.min(fitW, fitH, SCALE.max), Math.min(fitW, 1));
  const limit = Math.min(fitH, (width - SCALE.gutter) / SCALE.contentW, SCALE.max);
  return crisp(fit, ratio, limit);
}

// Agrandissement entier de l'écran LCD dans son tampon (au moins la densité
// réelle de pixels, plafonné pour garder un coût de dessin raisonnable).
export function lcdFactor(px: number, dpr: number): number {
  return Math.min(6, Math.max(1, Math.ceil(px * (dpr > 0 ? dpr : 1) - 1e-6)));
}
