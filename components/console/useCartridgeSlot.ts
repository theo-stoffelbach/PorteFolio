'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Cartridge } from '@/lib/catalog';
import styles from './console.module.css';
import type { Game } from './game/Game';
import { createSurface, present } from './pixel/engine';
import { drawSlotCartridge } from './render/cartridge';
import { CART_CANVAS, LANDSCAPE } from './render/layout';

// L'interaction signature : la cartouche vole de l'étagère jusqu'à la fente,
// s'enfonce, l'écran clignote, puis le projet démarre. Tout se fait par pas de pixels.

export type InsertOrigin = 'shelf' | 'menu' | 'initial';

export interface SlotState {
  // Cartouche physiquement dans la fente (à moitié insérée au repos).
  slotId: string | null;
  // La cartouche est enfoncée et le projet tourne à l'écran.
  playing: boolean;
  // Cartouches en vol entre l'étagère et la console.
  flying: readonly string[];
}

interface SlotOptions {
  cartridges: readonly Cartridge[];
  featuredId: string | null;
  gameRef: RefObject<Game | null>;
  slotRef: RefObject<HTMLDivElement | null>;
  slotCanvasRef: RefObject<HTMLCanvasElement | null>;
  anchorRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  // Écran dessiné (toujours présent) : sert à vérifier qu'il est visible.
  screenCanvasRef: RefObject<HTMLCanvasElement | null>;
  // Écran interactif : reçoit le focus après une insertion depuis l'étagère.
  screenRef: RefObject<HTMLDivElement | null>;
  shelfEls: RefObject<Map<string, HTMLElement>>;
  reducedRef: RefObject<boolean>;
}

const FLIGHT_MS = 450;
const FLIGHT_STEPS = 10;
const SINK = LANDSCAPE.cart.sink;
const SINK_MS = 140;

function depthTransform(depth: number): string {
  return `translateY(calc(${depth} * var(--px)))`;
}

// Juste au-dessus de la fente : point de départ quand la cartouche vient du menu.
function above(r: DOMRect): DOMRect {
  return new DOMRect(r.left, r.top - r.height * 1.4, r.width, r.height);
}

// Attend la fin d'une animation, avec un filet de sécurité si la page ne dessine plus
// (onglet masqué) : la séquence d'insertion ne reste jamais bloquée.
async function settle(anim: Animation, ms: number): Promise<void> {
  let timer = 0;
  try {
    await Promise.race([
      anim.finished,
      new Promise<void>((resolve) => {
        timer = window.setTimeout(resolve, ms + 250);
      }),
    ]);
  } catch {
    // Animation annulée : on poursuit avec l'état final.
  } finally {
    window.clearTimeout(timer);
  }
}

function flipTransform(from: DOMRect, to: DOMRect): string {
  return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${
    from.height / to.height
  })`;
}

export function useCartridgeSlot(o: SlotOptions) {
  const [state, setState] = useState<SlotState>({ slotId: o.featuredId, playing: false, flying: [] });
  const stateRef = useRef(state);
  const busyRef = useRef(false);
  // Jeton de séquence : il change quand le jeu est démonté (StrictMode en
  // développement, navigation). Une séquence dont le jeton a changé s'arrête net.
  const runRef = useRef(0);
  const clones = useRef(new Set<HTMLElement>());
  const {
    cartridges,
    gameRef,
    slotRef,
    slotCanvasRef,
    anchorRef,
    stageRef,
    screenCanvasRef,
    screenRef,
    shelfEls,
    reducedRef,
  } = o;

  const commit = useCallback((next: SlotState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const find = useCallback((id: string | null) => cartridges.find((c) => c.id === id) ?? null, [cartridges]);

  const paintSlot = useCallback(
    (cart: Cartridge | null) => {
      const canvas = slotCanvasRef.current;
      if (!canvas) return;
      const s = createSurface(CART_CANVAS.w, CART_CANVAS.h);
      drawSlotCartridge(s, cart);
      present(s, canvas);
    },
    [slotCanvasRef]
  );

  // Au montage : la cartouche mise en avant attend, à moitié insérée.
  useEffect(() => {
    paintSlot(find(stateRef.current.slotId));
  }, [find, paintSlot]);

  useEffect(() => {
    const live = clones.current;
    return () => {
      for (const el of live) el.remove();
      live.clear();
    };
  }, []);

  // Abandonne la séquence en cours (appelé quand le jeu est démonté).
  const cancel = useCallback(() => {
    runRef.current++;
    busyRef.current = false;
  }, []);

  // Enfonce ou remonte la cartouche dans la fente, par pas de 2 px.
  const moveSlot = useCallback(
    async (from: number, to: number, run: number) => {
      const el = slotRef.current;
      const anchor = anchorRef.current;
      if (!el) return;
      if (!reducedRef.current && anchor && from !== to && typeof el.animate === 'function') {
        const unit = anchor.getBoundingClientRect().height / CART_CANVAS.h;
        const anim = el.animate(
          [{ transform: `translateY(${from * unit}px)` }, { transform: `translateY(${to * unit}px)` }],
          { duration: SINK_MS, easing: `steps(${Math.max(1, Math.abs(to - from) / 2)}, end)`, fill: 'forwards' }
        );
        await settle(anim, SINK_MS);
        anim.cancel();
        if (run !== runRef.current) return;
      }
      el.style.transform = depthTransform(to);
    },
    [slotRef, anchorRef, reducedRef]
  );

  // Vol d'une cartouche entre l'étagère et la fente (FLIP, mouvement en marches).
  const fly = useCallback(
    async (cart: Cartridge, shelf: DOMRect, slot: DOMRect, direction: 'in' | 'out') => {
      if (reducedRef.current) return;
      const s = createSurface(CART_CANVAS.w, CART_CANVAS.h);
      drawSlotCartridge(s, cart);
      const canvas = document.createElement('canvas');
      present(s, canvas);
      canvas.setAttribute('aria-hidden', 'true');
      canvas.className = styles.flyingCart;
      Object.assign(canvas.style, {
        left: `${slot.left}px`,
        top: `${slot.top}px`,
        width: `${slot.width}px`,
        height: `${slot.height}px`,
      });
      if (typeof canvas.animate !== 'function') return;
      document.body.appendChild(canvas);
      clones.current.add(canvas);
      const away = flipTransform(shelf, slot);
      const lift = `translate(${(shelf.left - slot.left) * 0.2}px, ${
        Math.min(0, shelf.top - slot.top) * 0.2 - slot.height
      }px)`;
      const frames =
        direction === 'in'
          ? [{ transform: away }, { transform: lift, offset: 0.6 }, { transform: 'none' }]
          : [{ transform: 'none' }, { transform: lift, offset: 0.4 }, { transform: away }];
      const anim = canvas.animate(frames, {
        duration: FLIGHT_MS,
        easing: `steps(${FLIGHT_STEPS}, end)`,
        fill: 'forwards',
      });
      await settle(anim, FLIGHT_MS);
      canvas.remove();
      clones.current.delete(canvas);
    },
    [reducedRef]
  );

  const shelfRect = useCallback(
    (id: string): DOMRect | null => shelfEls.current.get(id)?.getBoundingClientRect() ?? null,
    [shelfEls]
  );

  // Échange la cartouche de la fente contre une autre, les deux vols en même temps.
  // Renvoie false si la séquence a été abandonnée pendant le vol.
  const swap = useCallback(
    async (outgoing: Cartridge | null, incoming: Cartridge, from: DOMRect | null, run: number) => {
      const anchor = anchorRef.current;
      const slot = anchor?.getBoundingClientRect();
      const back = outgoing ? shelfRect(outgoing.id) : null;
      paintSlot(null);
      commit({
        slotId: null,
        playing: false,
        flying: outgoing ? [incoming.id, outgoing.id] : [incoming.id],
      });
      if (slot) {
        await Promise.all([
          fly(incoming, from ?? above(slot), slot, 'in'),
          outgoing && back ? fly(outgoing, back, slot, 'out') : null,
        ]);
        if (run !== runRef.current) return false;
      }
      const el = slotRef.current;
      if (el) el.style.transform = depthTransform(0);
      paintSlot(incoming);
      commit({ slotId: incoming.id, playing: false, flying: [] });
      return true;
    },
    [anchorRef, shelfRect, paintSlot, commit, fly, slotRef]
  );

  // Fait remonter la console dans la vue quand l'écran n'est pas entièrement visible.
  const reveal = useCallback(() => {
    const screen = screenCanvasRef.current;
    const stage = stageRef.current;
    if (!screen || !stage) return;
    const r = screen.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= window.innerHeight) return;
    stage.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [screenCanvasRef, stageRef]);

  const insert = useCallback(
    async (id: string, origin: InsertOrigin) => {
      const cart = find(id);
      if (!gameRef.current || !cart || busyRef.current) return;
      const cur = stateRef.current;
      if (cur.playing && cur.slotId === id) {
        // Relance de la cartouche déjà enfoncée : retour au titre, sans flash.
        gameRef.current.showCartridge(cart, false);
        if (origin === 'shelf') screenRef.current?.focus({ preventScroll: true });
        return;
      }
      const run = runRef.current;
      busyRef.current = true;
      try {
        if (origin !== 'menu') reveal();
        gameRef.current.powerOff('INSERTION');
        if (cur.slotId !== id) {
          const outgoing = find(cur.slotId);
          if (outgoing && cur.playing) {
            await moveSlot(SINK, 0, run);
            if (run !== runRef.current) return;
          }
          if (!(await swap(outgoing, cart, origin === 'menu' ? null : shelfRect(id), run))) return;
        }
        await moveSlot(0, SINK, run);
        // Le jeu a pu être remplacé pendant l'animation : on relit l'instance courante.
        const game = gameRef.current;
        if (run !== runRef.current || !game) return;
        commit({ slotId: id, playing: true, flying: [] });
        game.showCartridge(cart);
        if (origin === 'shelf') screenRef.current?.focus({ preventScroll: true });
      } finally {
        if (run === runRef.current) busyRef.current = false;
      }
    },
    [gameRef, find, reveal, moveSlot, swap, shelfRect, commit, screenRef]
  );

  const eject = useCallback(async () => {
    const cur = stateRef.current;
    if (!gameRef.current || busyRef.current || !cur.playing || !cur.slotId) return;
    const run = runRef.current;
    busyRef.current = true;
    try {
      gameRef.current.powerOff('ÉJECTION');
      await moveSlot(SINK, 0, run);
      if (run !== runRef.current) return;
      const featured = find(o.featuredId);
      if (featured && featured.id !== cur.slotId) {
        if (!(await swap(find(cur.slotId), featured, shelfRect(featured.id), run))) return;
      } else {
        commit({ slotId: cur.slotId, playing: false, flying: [] });
      }
      gameRef.current?.showStreet();
    } finally {
      if (run === runRef.current) busyRef.current = false;
    }
  }, [gameRef, moveSlot, find, o.featuredId, swap, shelfRect, commit]);

  return { state, insert, eject, cancel };
}
