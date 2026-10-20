import { CATEGORY_META, STATUS_LABEL, oneLineTitle, type Cartridge } from '@/lib/catalog';
import { hl, rect, vl, type Surface } from '../pixel/engine';
import { BF, SF, drawText, drawTextCentered, fitText, textWidth, wrapText } from '../pixel/fonts';
import { LCD, LM } from '../pixel/palette';
import { CATEGORY_ICON } from '../pixel/sprites';
import type { ScreenLink } from './types';
import { SH, SW, drawFooter, drawHeader, fillRR, sprScaled } from './ui';

// Écrans d'une cartouche insérée : titre, menu, puis FICHE / STACK / CHIFFRES / LIENS.

const { L0, L1, L2, L3 } = LCD;

export type Section = 'fiche' | 'stack' | 'chiffres' | 'liens';

export const SECTIONS: readonly { id: Section; label: string }[] = [
  { id: 'fiche', label: 'FICHE' },
  { id: 'stack', label: 'STACK' },
  { id: 'chiffres', label: 'CHIFFRES' },
  { id: 'liens', label: 'LIENS' },
];

interface StatItem {
  value: string;
  label: string;
  big: boolean;
  y: number;
}

export type Page =
  | { kind: 'text'; lines: string[] }
  | { kind: 'chips'; rows: string[][] }
  | { kind: 'stats'; items: StatItem[]; lines: string[]; linesY: number }
  | { kind: 'links' };

export interface CartLink {
  id: string;
  label: string;
  href?: string;
  external: boolean;
}

const CONTENT = { x: 10, y: 18, width: 204, lines: 9 } as const;
const MENU_ROW = { x: 8, y: 24, h: 16 } as const;
const LINK_ROW = { y: 24, h: 16 } as const;
const CONTENT_BOTTOM = 112;

function chunkLines(lines: string[], size: number): Page[] {
  const pages: Page[] = [];
  for (let i = 0; i < lines.length; i += size) {
    const page = lines.slice(i, i + size);
    while (page.length > 0 && page[0] === '') page.shift();
    if (page.length > 0) pages.push({ kind: 'text', lines: page });
  }
  return pages;
}

function bullets(items: readonly string[], width: number): string[] {
  return items.flatMap((item) => {
    const wrapped = wrapText(BF, item, width - 8);
    return wrapped.map((line, i) => (i === 0 ? `• ${line}` : `  ${line}`));
  });
}

export function fichePages(cart: Cartridge): Page[] {
  const desc = cart.description.trim();
  const lines: string[] = [];
  const tagline = cart.tagline.replace(/…$/, '').trim();
  if (tagline && !desc.startsWith(tagline)) lines.push(...wrapText(BF, cart.tagline, CONTENT.width), '');
  lines.push(...wrapText(BF, desc, CONTENT.width));
  if (cart.highlights.length > 0) {
    lines.push('', 'Points forts :', ...bullets(cart.highlights, CONTENT.width));
  }
  return chunkLines(lines, CONTENT.lines);
}

export function stackPages(cart: Cartridge): Page[] {
  if (cart.technologies.length === 0) return [{ kind: 'text', lines: ['Pas de technologies renseignées.'] }];
  const rows: string[][] = [];
  let row: string[] = [];
  let x = 0;
  for (const raw of cart.technologies) {
    const tech = fitText(BF, raw, CONTENT.width - 8);
    const w = textWidth(BF, tech) + 8;
    if (row.length > 0 && x + w > CONTENT.width) {
      rows.push(row);
      row = [];
      x = 0;
    }
    row.push(tech);
    x += w + 4;
  }
  if (row.length > 0) rows.push(row);
  const pages: Page[] = [];
  for (let i = 0; i < rows.length; i += 6) pages.push({ kind: 'chips', rows: rows.slice(i, i + 6) });
  return pages;
}

// Chiffres en liste : la valeur en grand quand elle tient, son libellé dessous.
export function statsPages(cart: Cartridge): Page[] {
  const info: string[] = [];
  if (cart.role) info.push(...wrapText(BF, `Rôle : ${cart.role}`, CONTENT.width));
  if (cart.period) info.push(...wrapText(BF, `Période : ${cart.period}`, CONTENT.width));
  info.push(`Statut : ${STATUS_LABEL[cart.status]}`);
  if (cart.stats.length === 0) {
    return chunkLines(['Pas encore de chiffres publiés.', '', ...info], CONTENT.lines);
  }
  const pages: Page[] = [];
  let items: StatItem[] = [];
  let y: number = CONTENT.y;
  for (const st of cart.stats) {
    const value = fitText(BF, st.value, CONTENT.width);
    const big = textWidth(BF, value) * 2 <= CONTENT.width;
    const h = (big ? 14 : 7) + 3 + 5 + 4;
    if (items.length > 0 && y + h > CONTENT_BOTTOM) {
      pages.push({ kind: 'stats', items, lines: [], linesY: y });
      items = [];
      y = CONTENT.y;
    }
    items.push({ value, label: fitText(SF, st.label, CONTENT.width), big, y });
    y += h;
  }
  const linesY = y + 3;
  const capacity = Math.max(0, Math.floor((CONTENT_BOTTOM - linesY) / 10));
  pages.push({ kind: 'stats', items, lines: info.slice(0, capacity), linesY });
  return [...pages, ...chunkLines(info.slice(capacity), CONTENT.lines)];
}

export function cartLinks(cart: Cartridge): CartLink[] {
  const links: CartLink[] = [];
  if (cart.repoUrl) links.push({ id: 'repo', label: 'Code source ↗', href: cart.repoUrl, external: true });
  else links.push({ id: 'private', label: 'Code privé : dépôt non public', external: false });
  if (cart.demoUrl) links.push({ id: 'demo', label: 'Démo en ligne ↗', href: cart.demoUrl, external: true });
  links.push({
    id: 'page',
    label: 'Fiche complète du projet',
    href: `/projets/${encodeURIComponent(cart.id)}`,
    external: false,
  });
  return links;
}

export function sectionPages(cart: Cartridge, section: Section): Page[] {
  switch (section) {
    case 'fiche':
      return fichePages(cart);
    case 'stack':
      return stackPages(cart);
    case 'chiffres':
      return statsPages(cart);
    case 'liens':
      return [{ kind: 'links' }];
  }
}

/* ---------- Dessin ---------- */

// Double filet autour de l'écran de titre.
function frame(s: Surface): void {
  rect(s, 0, 0, SW, SH, L0);
  hl(s, 2, SW - 2, 2, L3);
  hl(s, 2, SW - 2, SH - 3, L3);
  vl(s, 2, 2, SH - 2, L3);
  vl(s, SW - 3, 2, SH - 2, L3);
  hl(s, 4, SW - 4, 4, L1);
  hl(s, 4, SW - 4, SH - 5, L1);
}

// Écran de titre du projet.
export function drawTitle(s: Surface, cart: Cartridge, blinkOn: boolean): void {
  frame(s);
  const meta = CATEGORY_META[cart.category];
  rect(s, 6, 7, SW - 12, 11, L3);
  drawText(s, SF, `${meta.label} · ${meta.name}`, 11, 10, L0);
  sprScaled(s, CATEGORY_ICON[cart.category], (SW >> 1) - 16, 22, LM, 2);
  // Nom en grand si possible, sinon titre court, sinon sur plusieurs lignes.
  const big = [cart.title, oneLineTitle(cart)].find(
    (t) => textWidth(BF, t) * 2 <= SW - 20
  );
  if (big) {
    drawTextCentered(s, BF, big, SW >> 1, 63, L2, 2);
    drawTextCentered(s, BF, big, SW >> 1, 62, L3, 2);
  } else {
    wrapText(BF, cart.title, SW - 24)
      .slice(0, 2)
      .forEach((line, i) => drawTextCentered(s, BF, line, SW >> 1, 62 + i * 10, L3));
  }
  const status = [STATUS_LABEL[cart.status], cart.period].filter(Boolean).join(' · ');
  drawTextCentered(s, SF, fitText(SF, status, SW - 24), SW >> 1, 86, L3);
  if (blinkOn) drawTextCentered(s, BF, '▶ APPUIE SUR A', SW >> 1, 98, L3);
  drawText(s, SF, 'B : ÉJECTER', 10, 113, L3);
  const year = String(cart.year);
  drawText(s, SF, year, SW - 10 - textWidth(SF, year), 113, L3);
}

function menuPreview(cart: Cartridge, section: Section): string {
  switch (section) {
    case 'fiche':
      return cart.tagline;
    case 'stack':
      return cart.technologies.length > 0 ? cart.technologies.join(' · ') : 'Pas de technologies renseignées.';
    case 'chiffres':
      return cart.stats.length > 0
        ? cart.stats
            .slice(0, 3)
            .map((st) => `${st.value} ${st.label}`)
            .join(' · ')
        : cart.role ?? 'Pas encore de chiffres publiés.';
    case 'liens':
      return cart.repoUrl
        ? 'Code source public, et fiche complète du projet.'
        : "Code privé : le dépôt n'est pas public. Fiche complète du projet.";
  }
}

export function menuText(cart: Cartridge, index: number): string {
  const section = SECTIONS[index];
  return `${section.label} : ${menuPreview(cart, section.id)}`;
}

export function drawMenu(s: Surface, cart: Cartridge, index: number): void {
  rect(s, 0, 0, SW, SH, L0);
  const name = oneLineTitle(cart).toUpperCase();
  drawHeader(s, fitText(SF, name, 150), CATEGORY_META[cart.category].label);
  SECTIONS.forEach((sec, i) => {
    const y = MENU_ROW.y + i * MENU_ROW.h;
    // Entrée choisie : aplat sombre et flèche (les autres restent en encre pleine, lisibles).
    if (i === index) {
      fillRR(s, 4, y - 3, 80, y + 10, 2, L3);
      drawText(s, BF, '▶', MENU_ROW.x, y, L0);
      drawText(s, BF, sec.label, MENU_ROW.x + 9, y, L0);
    } else drawText(s, BF, sec.label, MENU_ROW.x + 9, y, L3);
  });
  fillRR(s, 84, 18, 218, 110, 3, L3);
  fillRR(s, 86, 20, 216, 108, 2, L0);
  wrapText(BF, menuPreview(cart, SECTIONS[index].id), 124)
    .slice(0, 8)
    .forEach((line, i) => drawText(s, BF, line, 90, 24 + i * 10, L3));
  drawFooter(s, 'A : OUVRIR', 'B : RETOUR');
}

export function menuHit(x: number, y: number): number {
  if (x < 4 || x > 82) return -1;
  const i = Math.floor((y - MENU_ROW.y + 4) / MENU_ROW.h);
  return i >= 0 && i < SECTIONS.length ? i : -1;
}

export function linkRows(cart: Cartridge): (CartLink & { y: number })[] {
  return cartLinks(cart).map((link, i) => ({ ...link, y: LINK_ROW.y + i * LINK_ROW.h }));
}

// Liens DOM à superposer sur l'écran LIENS.
export function screenLinks(cart: Cartridge): ScreenLink[] {
  return linkRows(cart)
    .filter((l) => l.href)
    .map((l) => ({
      id: l.id,
      href: l.href as string,
      label: l.label.replace(' ↗', ''),
      external: l.external,
      x: 6,
      y: l.y - 4,
      w: SW - 12,
      h: LINK_ROW.h,
    }));
}

export function pageText(page: Page, cart: Cartridge): string {
  switch (page.kind) {
    case 'text':
      return page.lines.join(' ');
    case 'chips':
      return page.rows.flat().join(', ');
    case 'stats':
      return [...page.items.map((it) => `${it.label} : ${it.value}`), ...page.lines].join('. ');
    case 'links':
      return cartLinks(cart)
        .map((l) => l.label.replace(' ↗', ' (nouvel onglet)'))
        .join('. ');
  }
}

export function drawView(
  s: Surface,
  cart: Cartridge,
  section: Section,
  pages: readonly Page[],
  pageIndex: number,
  linkIndex: number,
  blinkOn: boolean
): void {
  rect(s, 0, 0, SW, SH, L0);
  const label = SECTIONS.find((sec) => sec.id === section)?.label ?? '';
  const name = oneLineTitle(cart).toUpperCase();
  drawHeader(s, fitText(SF, `${label} · ${name}`, 170), pages.length > 1 ? `${pageIndex + 1}/${pages.length}` : undefined);
  const page = pages[pageIndex];
  const last = pageIndex >= pages.length - 1;

  if (page.kind === 'text') {
    page.lines.forEach((line, i) => drawText(s, BF, line, CONTENT.x, CONTENT.y + i * 10, L3));
  } else if (page.kind === 'chips') {
    page.rows.forEach((row, r) => {
      let x = CONTENT.x;
      const y = 20 + r * 15;
      for (const tech of row) {
        const w = textWidth(BF, tech) + 8;
        fillRR(s, x, y, x + w, y + 13, 2, L3);
        fillRR(s, x + 1, y + 1, x + w - 1, y + 12, 1, L0);
        drawText(s, BF, tech, x + 4, y + 3, L3);
        x += w + 4;
      }
    });
  } else if (page.kind === 'stats') {
    for (const item of page.items) {
      drawText(s, BF, item.value, CONTENT.x, item.y, L3, item.big ? 2 : 1);
      drawText(s, SF, item.label, CONTENT.x, item.y + (item.big ? 17 : 10), L3);
    }
    if (page.lines.length > 0) hl(s, CONTENT.x, SW - CONTENT.x, page.linesY - 3, L1);
    page.lines.forEach((line, i) => drawText(s, BF, line, CONTENT.x, page.linesY + i * 10, L3));
  } else {
    linkRows(cart).forEach((link, i) => {
      const enabled = !!link.href;
      if (enabled && i === linkIndex) {
        fillRR(s, 6, link.y - 4, SW - 6, link.y + 11, 2, L3);
        drawText(s, BF, '▶', 11, link.y, L0);
        drawText(s, BF, link.label, 21, link.y, L0);
      } else {
        drawText(s, BF, link.label, 21, link.y, L3);
      }
    });
  }

  if (page.kind === 'links') drawFooter(s, 'A : OUVRIR LE LIEN', 'B : MENU');
  else {
    const next = last ? 'A : MENU' : 'A : SUITE';
    drawFooter(s, next, 'B : MENU');
    // La flèche « suite » clignote dans le pied de page : elle ne mord jamais sur le texte.
    if (!last && blinkOn) drawText(s, SF, '▶', 6 + textWidth(SF, next) + 3, 118, L3);
  }
}

// Index des liens qu'on peut sélectionner (le code privé ne l'est pas).
export function selectableLinks(cart: Cartridge): number[] {
  return cartLinks(cart)
    .map((l, i) => (l.href ? i : -1))
    .filter((i) => i >= 0);
}
