'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Cartridge } from '@/lib/catalog';
import { SITE } from '@/lib/site';
import type { Experience, Formation } from '@/lib/types';
import ConsoleShell, { type ShellHandlers } from './ConsoleShell';
import Shelf from './Shelf';
import styles from './console.module.css';
import { Game } from './game/Game';
import { hasBooted } from './game/storage';
import type { Direction, GameHost, ScreenLink } from './game/types';
import { createSurface, present, presentLcd, type Surface } from './pixel/engine';
import { C } from './pixel/palette';
import { renderConsole, type ButtonId } from './render/body';
import { LANDSCAPE, PORTRAIT, PORTRAIT_MAX_WIDTH, SCREEN_H, SCREEN_W } from './render/layout';
import { consoleScale, lcdFactor } from './render/scale';
import { useCartridgeSlot } from './useCartridgeSlot';
import { useConsoleInput } from './useConsoleInput';

export interface ConsoleExperienceProps {
  cartridges: Cartridge[];
  experiences: Experience[];
  formations: Formation[];
  initialCartridgeId?: string;
}

// Cartouche à moitié insérée au repos : GmailIA si elle existe, sinon la première.
function pickFeatured(cartridges: readonly Cartridge[]): string | null {
  return cartridges.find((c) => c.id === 'gmailia')?.id ?? cartridges[0]?.id ?? null;
}

const ANNOUNCE_DELAY_MS = 250;
const REPEAT_DELAY_MS = 380;
const REPEAT_EVERY_MS = 140;
const KEY_FLASH_MS = 120;
// Trame de l'écran LCD : un filet du ton le plus sombre, à 10 %.
const LCD_GRID_ALPHA = 0.1;

export default function ConsoleExperience({
  cartridges,
  experiences,
  formations,
  initialCartridgeId,
}: ConsoleExperienceProps) {
  // Les données viennent du serveur une fois pour toutes : le jeu les garde telles quelles.
  const [data] = useState(() => ({ cartridges, experiences, formations, initialCartridgeId }));
  const featuredId = useMemo(() => pickFeatured(data.cartridges), [data]);
  const restingCart = useMemo(
    () => data.cartridges.find((c) => c.id === featuredId) ?? null,
    [data, featuredId]
  );

  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bodyLandscape = useRef<HTMLCanvasElement>(null);
  const bodyPortrait = useRef<HTMLCanvasElement>(null);
  const screenCanvas = useRef<HTMLCanvasElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const slotCanvas = useRef<HTMLCanvasElement>(null);
  const slotAnchor = useRef<HTMLDivElement>(null);

  const gameRef = useRef<Game | null>(null);
  const visibleRef = useRef(false);
  const reducedRef = useRef(false);
  const interactedRef = useRef(false);
  // Agrandissement entier du tampon de l'écran LCD (voir presentLcd).
  const lcdScale = useRef(1);
  const pressedRef = useRef(new Set<ButtonId>());
  const bodySurfaces = useRef<{ landscape: Surface; portrait: Surface } | null>(null);
  const linkEls = useRef(new Map<string, HTMLAnchorElement>());
  const shelfEls = useRef(new Map<string, HTMLElement>());
  const repeatTimer = useRef<number | null>(null);
  const announceTimer = useRef<number | null>(null);

  const [links, setLinks] = useState<ScreenLink[]>([]);
  const [live, setLive] = useState('');

  const {
    state: slotState,
    insert,
    eject,
    cancel: cancelSlot,
  } = useCartridgeSlot({
    cartridges: data.cartridges,
    featuredId,
    gameRef,
    slotRef: slot,
    slotCanvasRef: slotCanvas,
    anchorRef: slotAnchor,
    stageRef: stage,
    screenCanvasRef: screenCanvas,
    screenRef: screen,
    shelfEls,
    reducedRef,
  });
  const insertRef = useRef(insert);
  const ejectRef = useRef(eject);
  useEffect(() => {
    insertRef.current = insert;
    ejectRef.current = eject;
  }, [insert, eject]);

  /* ---------- Échelle du monde pixel ---------- */

  // Fluide en largeur et en hauteur, nette au pixel physique quand l'arrondi coûte
  // peu (render/scale.ts). Posée sur <html> : la notice et ses ombres suivent la console.
  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const html = document.documentElement;
    const portrait = window.matchMedia(`(max-width: ${PORTRAIT_MAX_WIDTH}px)`);
    let dprQuery: MediaQueryList | null = null;

    const update = () => {
      const dpr = window.devicePixelRatio || 1;
      const px = consoleScale(section.clientWidth, window.innerHeight, dpr, portrait.matches);
      html.style.setProperty('--px', `${px}px`);
      const k = lcdFactor(px, dpr);
      if (k !== lcdScale.current) {
        lcdScale.current = k;
        gameRef.current?.invalidate();
      }
    };
    // Changement de densité de pixels (zoom du navigateur, écran déplacé).
    const onDpr = () => {
      watchDpr();
      update();
    };
    const watchDpr = () => {
      dprQuery?.removeEventListener('change', onDpr);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      dprQuery.addEventListener('change', onDpr);
    };

    const observer = new ResizeObserver(update);
    observer.observe(section);
    window.addEventListener('resize', update);
    portrait.addEventListener('change', update);
    watchDpr();
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
      portrait.removeEventListener('change', update);
      dprQuery?.removeEventListener('change', onDpr);
      html.style.removeProperty('--px');
    };
  }, []);

  /* ---------- Corps de la console et boutons enfoncés ---------- */

  const redrawBody = useCallback(() => {
    const surfaces = bodySurfaces.current;
    if (!surfaces) return;
    const pressed = Object.fromEntries([...pressedRef.current].map((id) => [id, true]));
    if (bodyLandscape.current) present(renderConsole('landscape', pressed, surfaces.landscape), bodyLandscape.current);
    if (bodyPortrait.current) present(renderConsole('portrait', pressed, surfaces.portrait), bodyPortrait.current);
  }, []);

  const setButton = useCallback(
    (id: ButtonId, on: boolean) => {
      const set = pressedRef.current;
      if (set.has(id) === on) return;
      if (on) set.add(id);
      else set.delete(id);
      redrawBody();
    },
    [redrawBody]
  );

  const flashButton = useCallback(
    (id: ButtonId) => {
      setButton(id, true);
      window.setTimeout(() => setButton(id, false), KEY_FLASH_MS);
    },
    [setButton]
  );

  // Le corps est déjà visible avant le JavaScript (image de fond générée au build) ;
  // le canvas prend le relais pour dessiner les boutons enfoncés.
  useEffect(() => {
    bodySurfaces.current = {
      landscape: createSurface(LANDSCAPE.w, LANDSCAPE.h),
      portrait: createSurface(PORTRAIT.w, PORTRAIT.h),
    };
    redrawBody();
  }, [redrawBody]);

  /* ---------- Le jeu ---------- */

  const markInteracted = useCallback(() => {
    interactedRef.current = true;
  }, []);

  useEffect(() => {
    const canvas = screenCanvas.current;
    const stageEl = stage.current;
    if (!canvas || !stageEl) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = reduced.matches;

    const host: GameHost = {
      announce: (text) => {
        // Pas d'annonce avant la première interaction : la page ne parle pas toute seule.
        if (!interactedRef.current) return;
        if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
        announceTimer.current = window.setTimeout(() => setLive(text), ANNOUNCE_DELAY_MS);
      },
      insert: (id) => void insertRef.current(id, 'menu'),
      eject: () => void ejectRef.current(),
      links: (list) => {
        // Le lien qui a le focus va disparaître (B, Échap) : le focus revient sur l'écran
        // au lieu de retomber sur la page.
        const active = document.activeElement;
        for (const [id, el] of linkEls.current) {
          if (el === active && !list.some((link) => link.id === id)) {
            screen.current?.focus({ preventScroll: true });
            break;
          }
        }
        setLinks(list);
      },
      activateLink: (id) => linkEls.current.get(id)?.click(),
      notice: () => {
        const notice = document.getElementById('notice');
        if (!notice) {
          window.location.hash = 'notice';
          return;
        }
        notice.scrollIntoView({ block: 'start', behavior: 'auto' });
        notice.focus({ preventScroll: true });
      },
    };

    const game = new Game(data, host, { reducedMotion: reduced.matches });
    gameRef.current = game;
    const initial = data.initialCartridgeId
      ? data.cartridges.find((c) => c.id === data.initialCartridgeId)
      : undefined;
    game.start(!initial && !hasBooted());
    if (initial) void insertRef.current(initial.id, 'initial');

    const surface = createSurface(SCREEN_W, SCREEN_H);
    const show = (now: number) => {
      game.render(surface, now);
      presentLcd(surface, canvas, lcdScale.current, C.L3, LCD_GRID_ALPHA);
    };
    let raf = 0;
    let last = 0;
    let running = false;
    let inView = false;

    const frame = (now: number) => {
      const dt = Math.min(100, now - last);
      last = now;
      game.update(dt);
      if (game.needsRender(now)) show(now);
      raf = window.requestAnimationFrame(frame);
    };
    const sync = () => {
      const should = inView && !document.hidden;
      if (should === running) return;
      running = should;
      if (should) {
        last = performance.now();
        raf = window.requestAnimationFrame(frame);
      } else {
        window.cancelAnimationFrame(raf);
        game.releaseAll();
      }
    };

    // Premier dessin immédiat, puis la boucle ne tourne que si la console est visible.
    show(performance.now());

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        visibleRef.current = entry.intersectionRatio >= 0.25;
        sync();
      },
      { threshold: [0, 0.25, 0.5] }
    );
    observer.observe(stageEl);
    document.addEventListener('visibilitychange', sync);
    const onMotion = (e: MediaQueryListEvent) => {
      reducedRef.current = e.matches;
      game.setReducedMotion(e.matches);
    };
    reduced.addEventListener('change', onMotion);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', onMotion);
      window.cancelAnimationFrame(raf);
      if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
      // Une insertion en cours visait ce jeu-ci : elle s'arrête avec lui.
      cancelSlot();
      gameRef.current = null;
    };
  }, [data, cancelSlot]);

  useConsoleInput({
    gameRef,
    stageRef: stage,
    screenRef: screen,
    visibleRef,
    setButton,
    onInteract: markInteracted,
  });

  /* ---------- Commandes tactiles et souris ---------- */

  const stopRepeat = useCallback(() => {
    if (repeatTimer.current !== null) window.clearTimeout(repeatTimer.current);
    repeatTimer.current = null;
  }, []);

  useEffect(() => stopRepeat, [stopRepeat]);

  const handlers = useMemo<ShellHandlers>(() => {
    // Appui maintenu sur la croix : répète dans les menus, tant que l'écran où
    // l'appui a commencé est toujours affiché.
    const repeat = (dir: Direction, delay: number, screenGen: number) => {
      repeatTimer.current = window.setTimeout(() => {
        const game = gameRef.current;
        if (!game || game.screenGeneration() !== screenGen) {
          repeatTimer.current = null;
          return;
        }
        if (game.acceptsRepeat()) game.press(dir);
        repeat(dir, REPEAT_EVERY_MS, screenGen);
      }, delay);
    };
    return {
      screenClick: (x, y) => {
        markInteracted();
        gameRef.current?.pointer(x, y);
      },
      dirDown: (dir) => {
        markInteracted();
        setButton(dir, true);
        const game = gameRef.current;
        if (!game) return;
        const screenGen = game.screenGeneration();
        if (dir === 'left' || dir === 'right') game.hold(dir, true);
        game.press(dir);
        stopRepeat();
        repeat(dir, REPEAT_DELAY_MS, screenGen);
      },
      dirUp: (dir) => {
        setButton(dir, false);
        stopRepeat();
        if (dir === 'left' || dir === 'right') gameRef.current?.hold(dir, false);
      },
      buttonDown: (id) => setButton(id, true),
      buttonUp: (id) => setButton(id, false),
      click: (action, keyboard) => {
        markInteracted();
        gameRef.current?.press(action);
        if (keyboard) flashButton(action);
      },
      registerLink: (id, el) => {
        if (el) linkEls.current.set(id, el);
        else linkEls.current.delete(id);
      },
    };
  }, [markInteracted, setButton, stopRepeat, flashButton]);

  /* ---------- Étagère ---------- */

  const onInsert = useCallback(
    (id: string) => {
      markInteracted();
      void insert(id, 'shelf');
    },
    [insert, markInteracted]
  );

  const registerCart = useCallback((id: string, el: HTMLElement | null) => {
    if (el) shelfEls.current.set(id, el);
    else shelfEls.current.delete(id);
  }, []);

  const away = useMemo(() => {
    const ids = new Set(slotState.flying);
    if (slotState.slotId) ids.add(slotState.slotId);
    return ids;
  }, [slotState]);

  return (
    <section ref={root} id="console" aria-label="Console de jeu de Théo" className={styles.root}>
      <div className={styles.scaler}>
        <h1 className={styles.srOnly}>
          {SITE.name}, {SITE.role.toLowerCase()} à {SITE.city}
        </h1>
        <ConsoleShell
          stageRef={stage}
          slotAnchorRef={slotAnchor}
          slotRef={slot}
          slotCanvasRef={slotCanvas}
          bodyLandscapeRef={bodyLandscape}
          bodyPortraitRef={bodyPortrait}
          screenCanvasRef={screenCanvas}
          screenRef={screen}
          handlers={handlers}
          links={links}
          live={live}
          restingCart={restingCart}
        />
        <Shelf cartridges={data.cartridges} away={away} onInsert={onInsert} registerCart={registerCart} />
      </div>
    </section>
  );
}
