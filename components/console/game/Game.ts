import { CATEGORY_META, STATUS_LABEL, type Cartridge } from '@/lib/catalog';
import { SITE } from '@/lib/site';
import type { Surface } from '../pixel/engine';
import { BF, SF, drawText, textWidth, wrapText } from '../pixel/fonts';
import { LCD } from '../pixel/palette';
import {
  SECTIONS,
  drawMenu,
  drawTitle,
  drawView,
  linkRows,
  menuHit,
  menuText,
  pageText,
  screenLinks,
  sectionPages,
  selectableLinks,
  type Page,
  type Section,
} from './cartScreens';
import {
  CONTACT_QUESTION,
  GARONNE_PARAGRAPHS,
  GENERIC_HINT,
  SERVER_PARAGRAPHS,
  bakeryParagraphs,
  officeParagraphs,
  placeHint,
  schoolParagraphs,
} from './content';
import { BOOT_MS, FLASH_MS, LUDO, drawBoot, drawFlash, drawLudo, drawPower, ludoHit } from './screens';
import { addPlayed, eatChocolatine, markBooted, readPlayed } from './storage';
import {
  THEO_MAX,
  THEO_MIN,
  THEO_START,
  buildFar,
  buildWorld,
  cameraFor,
  drawStreet,
  placeAt,
  placeHit,
  type Place,
} from './street';
import type { Action, GameData, GameHost, GameOptions, ScreenLink } from './types';
import { BOX, boxPages, drawBox, fillRR } from './ui';

// Le jeu de l'écran LCD : une machine à états sans dépendance au DOM.
// L'hôte (le composant React) lui transmet les entrées et dessine la surface.

type Mode =
  | { kind: 'boot'; t: number }
  | { kind: 'street' }
  | { kind: 'ludo'; index: number; scroll: number }
  | { kind: 'power'; message: string }
  | { kind: 'flash'; t: number; cart: Cartridge }
  | { kind: 'title'; cart: Cartridge }
  | { kind: 'menu'; cart: Cartridge; index: number }
  | { kind: 'view'; cart: Cartridge; section: Section; pages: Page[]; page: number; link: number };

type Overlay =
  | { kind: 'dialog'; tab: string; pages: string[][]; page: number }
  | { kind: 'contact'; tab: string; index: number };

interface ContactOption {
  id: string;
  label: string;
  href: string;
  detail: string;
  external: boolean;
}

const CONTACTS: readonly ContactOption[] = [
  { id: 'email', label: 'E-MAIL', href: `mailto:${SITE.email}`, detail: SITE.email, external: false },
  {
    id: 'linkedin',
    label: 'LINKEDIN',
    href: SITE.linkedin,
    detail: SITE.linkedin.replace(/^https?:\/\/(www\.)?/, ''),
    external: true,
  },
  {
    id: 'github',
    label: 'GITHUB',
    href: SITE.github,
    detail: SITE.github.replace(/^https?:\/\/(www\.)?/, ''),
    external: true,
  },
];

const SPEED = 1.3; // pixels par image à 60 images/s
const FRAME_MS = 1000 / 60;
const STEP = 10; // petit pas quand on tape brièvement sur la croix
const IDLE_MS = 120; // cadence des petites animations au repos

const { L0, L3 } = LCD;

export class Game {
  private readonly data: GameData;
  private readonly host: GameHost;
  private reduced: boolean;
  private readonly world: Surface;
  private readonly far: Surface;

  private mode: Mode = { kind: 'street' };
  private overlay: Overlay | null = null;
  private theoX = THEO_START;
  private facing: -1 | 1 = 1;
  private walking = false;
  private walkMs = 0;
  private held = { left: false, right: false };
  private heldMs = { left: 0, right: 0 };
  private target: number | null = null;
  private targetPlace: Place | null = null;
  private introDone = false;
  private place: Place | null = null;
  private t = 0;
  private lastRender = -Infinity;
  private dirty = true;
  private announced = '';
  // La consigne générale de la rue n'est lue qu'une fois (elle ne change jamais).
  private hintSaid = false;
  private linkKey = '';
  private played: string[];
  // Génération de l'écran : change à chaque nouveau mode ou nouvelle boîte, pas
  // quand on se déplace dans un menu. Sert à couper la répétition d'un appui maintenu.
  private screenGen = 0;
  private seenMode: Mode | null = null;
  private seenOverlay: Overlay | null = null;

  constructor(data: GameData, host: GameHost, opts: GameOptions) {
    this.data = data;
    this.host = host;
    this.reduced = opts.reducedMotion;
    this.world = buildWorld();
    this.far = buildFar();
    this.played = readPlayed();
  }

  /* ---------- Pilotage par l'hôte ---------- */

  // Le démarrage n'est noté « vu » qu'une fois terminé ou passé (voir endBoot) :
  // un montage interrompu (StrictMode en développement) le rejoue donc.
  start(boot: boolean): void {
    this.mode = boot && !this.reduced ? { kind: 'boot', t: 0 } : { kind: 'street' };
    this.changed();
  }

  setReducedMotion(reduced: boolean): void {
    this.reduced = reduced;
    this.dirty = true;
  }

  // Redessin demandé par l'hôte (changement d'échelle de l'écran).
  invalidate(): void {
    this.dirty = true;
  }

  isBooting(): boolean {
    return this.mode.kind === 'boot';
  }

  skipBoot(): void {
    if (this.mode.kind === 'boot') this.endBoot();
  }

  private endBoot(): void {
    markBooted();
    this.toStreet();
  }

  screenGeneration(): number {
    this.syncScreen();
    return this.screenGen;
  }

  private syncScreen(): void {
    if (this.mode === this.seenMode && this.overlay === this.seenOverlay) return;
    this.seenMode = this.mode;
    this.seenOverlay = this.overlay;
    this.screenGen++;
  }

  // Écran « éteint » pendant le vol et l'enfoncement de la cartouche.
  powerOff(message: string): void {
    this.overlay = null;
    this.stopWalking();
    this.mode = { kind: 'power', message };
    this.changed();
  }

  // La cartouche est enfoncée : flash puis écran de titre. Une relance de la
  // cartouche déjà en place va droit au titre (pas de flash rejoué à chaque clic).
  showCartridge(cart: Cartridge, flash = true): void {
    this.played = addPlayed(cart.id);
    this.overlay = null;
    this.mode = flash && !this.reduced ? { kind: 'flash', t: 0, cart } : { kind: 'title', cart };
    this.changed();
  }

  showStreet(): void {
    this.toStreet();
  }

  private playedCount(): number {
    const ids = new Set(this.data.cartridges.map((c) => c.id));
    return this.played.filter((id) => ids.has(id)).length;
  }

  /* ---------- Entrées ---------- */

  // Renvoie true si l'action a eu un effet (l'hôte peut alors bloquer le comportement par défaut).
  press(action: Action): boolean {
    if (this.mode.kind === 'boot') {
      this.endBoot();
      // START et SELECT gardent leur effet : le contact ou la notice s'ouvrent tout de suite.
      if (action !== 'start' && action !== 'select') return true;
    }
    const m = this.mode;
    if (m.kind === 'power' || m.kind === 'flash') return false;
    if (action === 'select') {
      this.host.notice();
      return true;
    }
    if (action === 'start') {
      if (this.overlay?.kind !== 'contact') this.openContact('CONTACT');
      return true;
    }
    if (this.overlay) return this.pressOverlay(action);
    switch (m.kind) {
      case 'street':
        return this.pressStreet(action);
      case 'ludo':
        return this.pressLudo(action);
      case 'title':
        return this.pressTitle(action);
      case 'menu':
        return this.pressMenu(action);
      case 'view':
        return this.pressView(action);
    }
  }

  // Maintien de ← → (clavier ou croix tactile) pour marcher dans la rue.
  hold(dir: 'left' | 'right', on: boolean): boolean {
    if (this.held[dir] === on) return this.inStreet();
    this.held[dir] = on;
    if (on) {
      this.heldMs[dir] = 0;
      return this.inStreet();
    }
    // Appui trop bref pour avoir marché : on fait quand même un petit pas.
    if (this.inStreet() && this.heldMs[dir] < FRAME_MS * 2) {
      this.walkTo(this.theoX + (dir === 'left' ? -STEP : STEP), null);
    }
    return this.inStreet();
  }

  releaseAll(): void {
    this.held.left = false;
    this.held.right = false;
  }

  // La répétition d'un appui maintenu ne sert que dans les menus (pas dans la rue).
  acceptsRepeat(): boolean {
    return !this.inStreet();
  }

  // Clic ou toucher sur l'écran, en pixels logiques de l'écran (224 × 126).
  pointer(x: number, y: number): boolean {
    const m = this.mode;
    if (m.kind === 'boot') {
      this.endBoot();
      return true;
    }
    if (m.kind === 'power' || m.kind === 'flash') return false;
    if (this.overlay) {
      if (this.overlay.kind === 'dialog') return this.press('a');
      // Contact : les vrais liens sont posés par-dessus ; un clic au-dessus de la boîte la ferme.
      if (y < 77) return this.press('b');
      return false;
    }
    switch (m.kind) {
      case 'street': {
        if (y >= 77) return this.press('a');
        const cam = cameraFor(this.theoX);
        const wx = cam + x;
        const hit = placeHit(wx, y);
        if (hit) this.walkTo(hit.spot, hit);
        else this.walkTo(wx, null);
        return true;
      }
      case 'ludo': {
        const n = this.data.cartridges.length;
        const row = ludoHit(x, y, m.scroll, n);
        if (row >= 0) {
          m.index = row;
          this.changed();
          this.host.insert(this.data.cartridges[row].id);
          return true;
        }
        if (y >= 77 && n > 0) return this.press('a');
        return false;
      }
      case 'title':
        return this.press('a');
      case 'menu': {
        const i = menuHit(x, y);
        if (i < 0) return false;
        m.index = i;
        return this.press('a');
      }
      case 'view':
        // Sur l'écran LIENS, ce sont les <a> superposés qui reçoivent le clic.
        if (m.section === 'liens') return false;
        return this.press('a');
    }
  }

  /* ---------- Boucle ---------- */

  update(dt: number): void {
    this.t += dt;
    const m = this.mode;
    if (m.kind === 'boot') {
      m.t += dt;
      this.dirty = true;
      if (m.t >= BOOT_MS) this.endBoot();
      return;
    }
    if (m.kind === 'flash') {
      m.t += dt;
      this.dirty = true;
      if (m.t >= FLASH_MS) {
        this.mode = { kind: 'title', cart: m.cart };
        this.changed();
      }
      return;
    }
    if (m.kind === 'street' && !this.overlay) this.walk(dt);
  }

  // Faut-il redessiner maintenant ?
  needsRender(now: number): boolean {
    if (this.dirty || this.walking) return true;
    return !this.reduced && now - this.lastRender >= IDLE_MS;
  }

  render(s: Surface, now: number): void {
    this.dirty = false;
    this.lastRender = now;
    const phase = Math.floor(this.t / 400) % 2;
    const blinkOn = this.reduced || phase === 0;
    // Le ▶ « suite » des dialogues reste toujours affiché : il sautille d'un pixel
    // toutes les 400 ms (immobile si l'animation est réduite) au lieu de clignoter,
    // pour que l'invitation à jouer se voie dès le premier coup d'œil.
    const bob = this.reduced ? 0 : phase;
    const m = this.mode;
    switch (m.kind) {
      case 'boot':
        drawBoot(s, m.t);
        return;
      case 'power':
        drawPower(s, m.message, this.t, !this.reduced);
        return;
      case 'flash':
        drawFlash(s, m.t);
        return;
      case 'street':
        drawStreet(s, this.world, this.far, {
          cam: cameraFor(this.theoX),
          t: this.t,
          animate: !this.reduced,
          theoX: this.theoX,
          facing: this.facing,
          walking: this.walking,
          walkFrame: Math.floor(this.walkMs / 130),
          played: this.playedCount(),
          total: this.data.cartridges.length,
        });
        if (!this.overlay) {
          const box = this.streetBox();
          drawBox(s, box.tab, wrapText(BF, box.text, BOX.width).slice(0, BOX.lines), box.arrow, bob);
        }
        break;
      case 'ludo':
        drawLudo(s, this.data.cartridges, m.index, m.scroll);
        break;
      case 'title':
        drawTitle(s, m.cart, blinkOn);
        break;
      case 'menu':
        drawMenu(s, m.cart, m.index);
        break;
      case 'view':
        drawView(s, m.cart, m.section, m.pages, m.page, m.link, blinkOn);
        break;
    }
    if (this.overlay) this.drawOverlay(s, bob);
  }

  /* ---------- Rue ---------- */

  private inStreet(): boolean {
    return this.mode.kind === 'street' && !this.overlay;
  }

  private walkTo(x: number, place: Place | null): void {
    this.target = Math.max(THEO_MIN, Math.min(THEO_MAX, x));
    this.targetPlace = place;
    this.introDone = true;
    this.changed();
  }

  private stopWalking(): void {
    this.target = null;
    this.targetPlace = null;
    this.walking = false;
    this.releaseAll();
  }

  private walk(dt: number): void {
    const k = dt / FRAME_MS;
    let dir = 0;
    if (this.held.left) this.heldMs.left += dt;
    if (this.held.right) this.heldMs.right += dt;
    if (this.held.left !== this.held.right) {
      dir = this.held.left ? -1 : 1;
      this.target = null;
      this.targetPlace = null;
    } else if (this.target !== null) {
      const gap = this.target - this.theoX;
      if (Math.abs(gap) <= SPEED * k) {
        this.theoX = this.target;
        const arrived = this.targetPlace;
        this.target = null;
        this.targetPlace = null;
        this.walking = false;
        this.updatePlace();
        if (arrived) this.enter(arrived);
        else this.changed();
        return;
      }
      dir = Math.sign(gap);
    }
    if (dir === 0) {
      this.stopped();
      return;
    }
    const next = Math.max(THEO_MIN, Math.min(THEO_MAX, this.theoX + dir * SPEED * k));
    if (next === this.theoX) {
      // Bord du monde : Théo reprend la pose de face (redessin même sans animation).
      this.stopped();
      return;
    }
    this.theoX = next;
    this.facing = dir < 0 ? -1 : 1;
    this.walking = true;
    this.walkMs += dt;
    if (!this.introDone) {
      this.introDone = true;
      this.changed();
    }
    this.updatePlace();
  }

  // Théo vient de s'arrêter : pose de face et consigne complète du lieu.
  private stopped(): void {
    if (!this.walking) return;
    this.walking = false;
    this.changed();
  }

  private updatePlace(): void {
    const p = placeAt(this.theoX);
    if (p !== this.place) {
      this.place = p;
      this.changed();
    }
  }

  private streetBox(): { tab: string; text: string; arrow: boolean } {
    if (!this.introDone) return { tab: 'THÉO', text: SITE.intro, arrow: true };
    if (this.place) {
      return { tab: this.place.label, text: placeHint(this.place.id, this.data.cartridges.length), arrow: true };
    }
    return { tab: 'THÉO', text: GENERIC_HINT, arrow: false };
  }

  private pressStreet(action: Action): boolean {
    switch (action) {
      case 'left':
      case 'right':
        if (!this.held.left && !this.held.right) {
          this.walkTo(this.theoX + (action === 'left' ? -STEP : STEP), null);
        }
        return true;
      case 'up':
        if (!this.place) return false;
        this.enter(this.place);
        return true;
      case 'a':
        if (this.place) {
          this.enter(this.place);
          return true;
        }
        if (!this.introDone) {
          this.introDone = true;
          this.changed();
          return true;
        }
        return false;
      case 'b':
        if (!this.introDone) {
          this.introDone = true;
          this.changed();
          return true;
        }
        return false;
      default:
        return false;
    }
  }

  private enter(place: Place): void {
    this.stopWalking();
    this.introDone = true;
    switch (place.id) {
      case 'ludotheque':
        this.mode = { kind: 'ludo', index: 0, scroll: 0 };
        this.changed();
        return;
      case 'ecole':
        this.openDialog("L'ÉCOLE", schoolParagraphs(this.data.formations));
        return;
      case 'sii':
        this.openDialog('SII', officeParagraphs(this.data.experiences));
        return;
      case 'boulangerie':
        this.openDialog('BOULANGÈRE', bakeryParagraphs(eatChocolatine()));
        return;
      case 'facteur':
        this.openContact('LE FACTEUR');
        return;
      case 'poste':
        this.openContact('LA POSTE');
        return;
      case 'serveur':
        this.openDialog('LE SERVEUR', SERVER_PARAGRAPHS);
        return;
      case 'garonne':
        this.openDialog('LA GARONNE', GARONNE_PARAGRAPHS);
        return;
    }
  }

  private toStreet(): void {
    this.overlay = null;
    this.mode = { kind: 'street' };
    this.updatePlace();
    this.changed();
  }

  /* ---------- Boîtes de dialogue et contact ---------- */

  private openDialog(tab: string, paragraphs: readonly string[]): void {
    this.overlay = { kind: 'dialog', tab, pages: boxPages(paragraphs), page: 0 };
    this.changed();
  }

  private openContact(tab: string): void {
    this.stopWalking();
    this.overlay = { kind: 'contact', tab, index: 0 };
    this.changed();
  }

  private pressOverlay(action: Action): boolean {
    const o = this.overlay;
    if (!o) return false;
    if (action === 'b') {
      this.overlay = null;
      this.changed();
      return true;
    }
    if (o.kind === 'dialog') {
      if (action !== 'a' && action !== 'right' && action !== 'down') return false;
      if (o.page < o.pages.length - 1) o.page++;
      else this.overlay = null;
      this.changed();
      return true;
    }
    const n = CONTACTS.length;
    switch (action) {
      case 'left':
      case 'up':
        o.index = (o.index + n - 1) % n;
        this.changed();
        return true;
      case 'right':
      case 'down':
        o.index = (o.index + 1) % n;
        this.changed();
        return true;
      case 'a':
        this.host.activateLink(CONTACTS[o.index].id);
        return true;
      default:
        return false;
    }
  }

  // Choix du contact sur une ligne ; « ↗ » signale ceux qui ouvrent un nouvel onglet.
  private contactLayout(): { option: ContactOption; text: string; x: number; w: number }[] {
    let x = 20;
    return CONTACTS.map((option) => {
      const text = option.external ? `${option.label} ↗` : option.label;
      const w = textWidth(BF, text);
      const item = { option, text, x, w };
      x += w + 16;
      return item;
    });
  }

  private drawOverlay(s: Surface, bob: number): void {
    const o = this.overlay;
    if (!o) return;
    if (o.kind === 'dialog') {
      drawBox(s, o.tab, o.pages[o.page], true, bob);
      return;
    }
    drawBox(s, o.tab, [CONTACT_QUESTION], false);
    const y = BOX.y + BOX.lineH;
    for (const [i, item] of this.contactLayout().entries()) {
      // Le choix courant se lit à son aplat sombre et à sa flèche, pas à une teinte pâle.
      if (i === o.index) {
        fillRR(s, item.x - 10, y - 2, item.x + item.w + 3, y + 9, 2, L3);
        drawText(s, BF, '▶', item.x - 8, y, L0);
        drawText(s, BF, item.text, item.x, y, L0);
      } else drawText(s, BF, item.text, item.x, y, L3);
    }
    drawText(s, SF, CONTACTS[o.index].detail, BOX.x + 1, BOX.y + BOX.lineH * 2 + 2, L3);
  }

  /* ---------- Ludothèque ---------- */

  private pressLudo(action: Action): boolean {
    const m = this.mode;
    if (m.kind !== 'ludo') return false;
    const n = this.data.cartridges.length;
    if (action === 'b') {
      this.toStreet();
      return true;
    }
    if (n === 0) return false;
    const move = (to: number) => {
      m.index = to;
      if (m.index < m.scroll) m.scroll = m.index;
      if (m.index >= m.scroll + LUDO.rows) m.scroll = m.index - LUDO.rows + 1;
      this.changed();
    };
    switch (action) {
      case 'up':
        move((m.index + n - 1) % n);
        return true;
      case 'down':
        move((m.index + 1) % n);
        return true;
      case 'left':
        move(Math.max(0, m.index - LUDO.rows));
        return true;
      case 'right':
        move(Math.min(n - 1, m.index + LUDO.rows));
        return true;
      case 'a':
        this.host.insert(this.data.cartridges[m.index].id);
        return true;
      default:
        return false;
    }
  }

  /* ---------- Cartouche ---------- */

  private pressTitle(action: Action): boolean {
    const m = this.mode;
    if (m.kind !== 'title') return false;
    if (action === 'a') {
      this.mode = { kind: 'menu', cart: m.cart, index: 0 };
      this.changed();
      return true;
    }
    if (action === 'b') {
      this.host.eject();
      return true;
    }
    return false;
  }

  private pressMenu(action: Action): boolean {
    const m = this.mode;
    if (m.kind !== 'menu') return false;
    const n = SECTIONS.length;
    switch (action) {
      case 'up':
        m.index = (m.index + n - 1) % n;
        this.changed();
        return true;
      case 'down':
        m.index = (m.index + 1) % n;
        this.changed();
        return true;
      case 'a': {
        const section = SECTIONS[m.index].id;
        const link = selectableLinks(m.cart)[0] ?? 0;
        this.mode = {
          kind: 'view',
          cart: m.cart,
          section,
          pages: sectionPages(m.cart, section),
          page: 0,
          link,
        };
        this.changed();
        return true;
      }
      case 'b':
        this.mode = { kind: 'title', cart: m.cart };
        this.changed();
        return true;
      default:
        return false;
    }
  }

  private backToMenu(cart: Cartridge, section: Section): void {
    this.mode = { kind: 'menu', cart, index: SECTIONS.findIndex((s) => s.id === section) };
    this.changed();
  }

  private pressView(action: Action): boolean {
    const m = this.mode;
    if (m.kind !== 'view') return false;
    if (action === 'b') {
      this.backToMenu(m.cart, m.section);
      return true;
    }
    if (m.section === 'liens') {
      const selectable = selectableLinks(m.cart);
      const at = selectable.indexOf(m.link);
      switch (action) {
        case 'up':
        case 'down': {
          if (selectable.length < 2) return false;
          const step = action === 'up' ? -1 : 1;
          m.link = selectable[(at + step + selectable.length) % selectable.length];
          this.changed();
          return true;
        }
        case 'a': {
          const link = linkRows(m.cart)[m.link];
          if (!link?.href) return false;
          this.host.activateLink(link.id);
          return true;
        }
        default:
          return false;
      }
    }
    const last = m.page >= m.pages.length - 1;
    switch (action) {
      case 'a':
      case 'right':
      case 'down':
        if (last) {
          if (action !== 'a') return false;
          this.backToMenu(m.cart, m.section);
          return true;
        }
        m.page++;
        this.changed();
        return true;
      case 'left':
      case 'up':
        if (m.page === 0) return false;
        m.page--;
        this.changed();
        return true;
      default:
        return false;
    }
  }

  /* ---------- Liens DOM et annonces ---------- */

  private currentLinks(): ScreenLink[] {
    const o = this.overlay;
    if (o?.kind === 'contact') {
      return this.contactLayout().map(({ option, x, w }) => ({
        id: option.id,
        href: option.href,
        label: option.label === 'E-MAIL' ? `Écrire un e-mail à ${SITE.name}` : `${SITE.name} sur ${option.label === 'LINKEDIN' ? 'LinkedIn' : 'GitHub'}`,
        external: option.external,
        x: x - 10,
        y: BOX.y + BOX.lineH - 3,
        w: w + 14,
        h: 12,
      }));
    }
    if (!o && this.mode.kind === 'view' && this.mode.section === 'liens') return screenLinks(this.mode.cart);
    return [];
  }

  private describe(): string {
    const o = this.overlay;
    if (o?.kind === 'dialog') {
      const more = o.page < o.pages.length - 1 ? ' (A pour la suite)' : '';
      return `${o.tab} : ${o.pages[o.page].join(' ')}${more}`;
    }
    if (o?.kind === 'contact') {
      const c = CONTACTS[o.index];
      const tab = c.external ? ' (nouvel onglet)' : '';
      return `${CONTACT_QUESTION} Choix ${o.index + 1} sur ${CONTACTS.length} : ${c.label}${tab}, ${c.detail}.`;
    }
    const m = this.mode;
    switch (m.kind) {
      case 'boot':
        return 'La console démarre.';
      case 'power':
        return `${m.message}…`;
      case 'flash':
        return '';
      case 'street': {
        if (!this.introDone) return SITE.intro;
        // En marche, seul le nom du lieu est annoncé ; la consigne vient à l'arrêt.
        const moving = this.walking || this.target !== null;
        if (this.place) {
          const name = `Devant : ${this.place.label}.`;
          return moving ? name : `${name} ${placeHint(this.place.id, this.data.cartridges.length)}`;
        }
        return moving || this.hintSaid ? '' : GENERIC_HINT;
      }
      case 'ludo': {
        const n = this.data.cartridges.length;
        if (n === 0) return "Ludothèque : les étagères sont vides pour l'instant.";
        const c = this.data.cartridges[m.index];
        return `Ludothèque, ${m.index + 1} sur ${n} : ${c.title}, ${CATEGORY_META[c.category].label}. ${c.tagline} A pour insérer.`;
      }
      case 'title': {
        const c = m.cart;
        const details = [CATEGORY_META[c.category].name, STATUS_LABEL[c.status], c.period].filter(Boolean).join(', ');
        return `Cartouche ${c.title} insérée : ${details}. A pour ouvrir le menu, B pour éjecter.`;
      }
      case 'menu':
        return menuText(m.cart, m.index);
      case 'view': {
        const page = m.pages[m.page];
        const label = SECTIONS.find((s) => s.id === m.section)?.label ?? '';
        const counter = m.pages.length > 1 ? ` (page ${m.page + 1} sur ${m.pages.length})` : '';
        return `${label}${counter} : ${pageText(page, m.cart)}`;
      }
    }
  }

  private changed(): void {
    this.dirty = true;
    this.syncScreen();
    const links = this.currentLinks();
    const key = JSON.stringify(links);
    if (key !== this.linkKey) {
      this.linkKey = key;
      this.host.links(links);
    }
    const text = this.describe();
    // Un silence (entre deux lieux) permet de réannoncer le même lieu au retour.
    if (!text) this.announced = '';
    else if (text !== this.announced) {
      this.announced = text;
      if (text === GENERIC_HINT) this.hintSaid = true;
      this.host.announce(text);
    }
  }
}

