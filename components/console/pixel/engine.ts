import { TRANSPARENT, type Color } from './palette';

// Moteur pixel : un tampon de couleurs 32 bits et des primitives en aplats,
// portés de la maquette r2-console. Aucun anticrénelage, aucun dégradé.

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Surface {
  readonly w: number;
  readonly h: number;
  readonly data: Uint32Array<ArrayBuffer>;
  // Zone de découpe [x0, y0, x1, y1) ; null = toute la surface.
  clip: [number, number, number, number] | null;
}

export function createSurface(w: number, h: number): Surface {
  return { w, h, data: new Uint32Array(new ArrayBuffer(w * h * 4)), clip: null };
}

export function clear(s: Surface, c: Color = TRANSPARENT): void {
  s.data.fill(c);
}

export function px(s: Surface, x: number, y: number, c: Color): void {
  if (!c) return;
  if (x < 0 || y < 0 || x >= s.w || y >= s.h) return;
  const k = s.clip;
  if (k && (x < k[0] || y < k[1] || x >= k[2] || y >= k[3])) return;
  s.data[y * s.w + x] = c;
}

export function rect(
  s: Surface,
  x: number,
  y: number,
  w: number,
  h: number,
  c: Color
): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(s, i, j, c);
}

export function hl(s: Surface, x0: number, x1: number, y: number, c: Color): void {
  for (let i = x0; i < x1; i++) px(s, i, y, c);
}

export function vl(s: Surface, x: number, y0: number, y1: number, c: Color): void {
  for (let j = y0; j < y1; j++) px(s, x, j, c);
}

// Rectangle arrondi [x0, x1) × [y0, y1) de rayon r.
export function inRR(
  x: number,
  y: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number
): boolean {
  if (x < x0 || y < y0 || x >= x1 || y >= y1) return false;
  const X = x + 0.5;
  const Y = y + 0.5;
  const cx = X < x0 + r ? x0 + r : X > x1 - r ? x1 - r : X;
  const cy = Y < y0 + r ? y0 + r : Y > y1 - r ? y1 - r : Y;
  return (X - cx) * (X - cx) + (Y - cy) * (Y - cy) <= r * r;
}

export function inDisc(x: number, y: number, cx: number, cy: number, r: number): boolean {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r + r;
}

// Masque binaire précalculé sur une boîte englobante.
export class Mask {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  private readonly w: number;
  private readonly bits: Uint8Array;

  constructor(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    test: (x: number, y: number) => boolean
  ) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.w = x1 - x0;
    const h = y1 - y0;
    this.bits = new Uint8Array(this.w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < this.w; x++) this.bits[y * this.w + x] = test(x + x0, y + y0) ? 1 : 0;
  }

  has(x: number, y: number): boolean {
    const lx = x - this.x0;
    const ly = y - this.y0;
    if (lx < 0 || ly < 0 || x >= this.x1 || y >= this.y1) return false;
    return this.bits[ly * this.w + lx] === 1;
  }
}

export function mask(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  test: (x: number, y: number) => boolean
): Mask {
  return new Mask(x0, y0, x1, y1, test);
}

export interface BevelOptions {
  outline: Color;
  base: Color;
  top?: readonly Color[];
  bottom?: readonly Color[];
  left?: readonly Color[];
  right?: readonly Color[];
}

// Ombrage par aplats : contour, puis bandes selon la distance au bord.
export function bevel(s: Surface, m: Mask, o: BevelOptions): void {
  const dist = (x: number, y: number, dx: number, dy: number, max: number): number => {
    for (let k = 1; k <= max; k++) if (!m.has(x + dx * k, y + dy * k)) return k;
    return 99;
  };
  for (let y = m.y0; y < m.y1; y++)
    for (let x = m.x0; x < m.x1; x++) {
      if (!m.has(x, y)) continue;
      if (!m.has(x - 1, y) || !m.has(x + 1, y) || !m.has(x, y - 1) || !m.has(x, y + 1)) {
        px(s, x, y, o.outline);
        continue;
      }
      let c = o.base;
      let k: number;
      if (o.bottom && (k = dist(x, y, 0, 1, o.bottom.length + 1)) < 99) c = o.bottom[k - 2];
      else if (o.right && (k = dist(x, y, 1, 0, o.right.length + 1)) < 99) c = o.right[k - 2];
      else if (o.top && (k = dist(x, y, 0, -1, o.top.length + 1)) < 99) c = o.top[k - 2];
      else if (o.left && (k = dist(x, y, -1, 0, o.left.length + 1)) < 99) c = o.left[k - 2];
      px(s, x, y, c);
    }
}

export function shadow(s: Surface, m: Mask, dx: number, dy: number, c: Color): void {
  for (let y = m.y0; y < m.y1; y++)
    for (let x = m.x0; x < m.x1; x++) if (m.has(x, y)) px(s, x + dx, y + dy, c);
}

// Contour pointillé d'un masque (un pixel sur deux).
export function dottedOutline(s: Surface, m: Mask, c: Color, phase = 0): void {
  for (let y = m.y0; y < m.y1; y++)
    for (let x = m.x0; x < m.x1; x++) {
      if (!m.has(x, y)) continue;
      if (m.has(x - 1, y) && m.has(x + 1, y) && m.has(x, y - 1) && m.has(x, y + 1)) continue;
      if ((x + y + phase) % 2 === 0) px(s, x, y, c);
    }
}

// Sprite décrit par des lignes de caractères ; `map` donne la couleur de chaque caractère.
// `k` agrandit chaque pixel en bloc k×k (comme drawText).
export function spr(
  s: Surface,
  rows: readonly string[],
  x: number,
  y: number,
  map: Readonly<Record<string, Color>>,
  k = 1
): void {
  for (let j = 0; j < rows.length; j++) {
    const r = rows[j];
    for (let i = 0; i < r.length; i++) {
      const c = map[r[i]];
      if (!c) continue;
      if (k === 1) px(s, x + i, y + j, c);
      else rect(s, x + i * k, y + j * k, k, k, c);
    }
  }
}

// Copie une surface sur une autre en ignorant les pixels transparents.
export function blit(
  dst: Surface,
  src: Surface,
  dx: number,
  dy: number,
  sx = 0,
  sy = 0,
  w = src.w,
  h = src.h
): void {
  for (let j = 0; j < h; j++) {
    const syy = sy + j;
    if (syy < 0 || syy >= src.h) continue;
    for (let i = 0; i < w; i++) {
      const sxx = sx + i;
      if (sxx < 0 || sxx >= src.w) continue;
      const c = src.data[syy * src.w + sxx];
      if (c) px(dst, dx + i, dy + j, c);
    }
  }
}

// Générateur pseudo-aléatoire déterministe (mulberry32), pour des décors stables.
export function createRng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const images = new WeakMap<Surface, ImageData>();

// Pousse la surface dans un canvas (redimensionné à la taille de la surface).
export function present(s: Surface, canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (canvas.width !== s.w) canvas.width = s.w;
  if (canvas.height !== s.h) canvas.height = s.h;
  let image = images.get(s);
  if (!image) {
    // L'ImageData partage le tampon de la surface : aucune copie par image.
    image = new ImageData(new Uint8ClampedArray(s.data.buffer), s.w, s.h);
    images.set(s, image);
  }
  ctx.putImageData(image, 0, 0);
}

// Mélange deux couleurs (même format 0xAABBGGRR), `a` = part de la seconde.
function mix(c: Color, g: Color, a: number): Color {
  const ch = (shift: number) => Math.round(((c >>> shift) & 255) * (1 - a) + ((g >>> shift) & 255) * a);
  return ((255 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)) >>> 0;
}

interface ScaledBuffer {
  k: number;
  data: Uint32Array<ArrayBuffer>;
  image: ImageData;
}

const scaledBuffers = new WeakMap<HTMLCanvasElement, ScaledBuffer>();
const shades = new Map<string, Map<Color, Color>>();

// Écran LCD : chaque pixel logique devient un bloc k × k (plus proche voisin) et la
// trame de l'écran (un filet sombre en haut et à gauche de chaque bloc) est dessinée
// dans le tampon même. Elle reste ainsi alignée sur les pixels à toute échelle,
// y compris fractionnaire, là où un motif CSS superposé produirait du moiré.
export function presentLcd(s: Surface, canvas: HTMLCanvasElement, k: number, grid: Color, alpha: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = s.w * k;
  const H = s.h * k;
  let buf = scaledBuffers.get(canvas);
  if (!buf || buf.k !== k) {
    const data = new Uint32Array(new ArrayBuffer(W * H * 4));
    buf = { k, data, image: new ImageData(new Uint8ClampedArray(data.buffer), W, H) };
    scaledBuffers.set(canvas, buf);
  }
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const key = `${grid}:${alpha}`;
  let shade = shades.get(key);
  if (!shade) {
    shade = new Map();
    shades.set(key, shade);
  }
  // Épaisseur du filet : environ un tiers de pixel logique, jamais moins d'un pixel physique.
  const t = k >= 2 ? Math.max(1, Math.round(k / 3)) : 0;
  const out = buf.data;
  for (let j = 0; j < s.h; j++) {
    for (let r = 0; r < k; r++) {
      const row = (j * k + r) * W;
      const edge = r < t;
      for (let i = 0; i < s.w; i++) {
        const c = s.data[j * s.w + i];
        let d = shade.get(c);
        if (d === undefined) {
          d = c ? mix(c, grid, alpha) : 0;
          shade.set(c, d);
        }
        const base = row + i * k;
        for (let q = 0; q < k; q++) out[base + q] = edge || q < t ? d : c;
      }
    }
  }
  ctx.putImageData(buf.image, 0, 0);
}
