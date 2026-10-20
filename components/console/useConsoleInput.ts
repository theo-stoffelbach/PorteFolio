'use client';

import { useEffect, type RefObject } from 'react';
import type { Game } from './game/Game';
import type { Action } from './game/types';
import type { ButtonId } from './render/body';

// Clavier : ← → marchent, ↑ ↓ naviguent, A / X / Entrée / Espace = A,
// B / Z / Échap / Retour arrière = B.
const KEYMAP: Readonly<Record<string, Action>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  Enter: 'a',
  ' ': 'a',
  a: 'a',
  A: 'a',
  x: 'a',
  X: 'a',
  Escape: 'b',
  Backspace: 'b',
  b: 'b',
  B: 'b',
  z: 'b',
  Z: 'b',
};

// Raccourcis d'une seule lettre : seulement quand le focus est dans la console
// (WCAG 2.1.4), jamais depuis le reste de la page.
const LETTER = /^[a-z]$/i;

function isEditable(el: Element | null): boolean {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}

interface InputOptions {
  gameRef: RefObject<Game | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  screenRef: RefObject<HTMLDivElement | null>;
  visibleRef: RefObject<boolean>;
  setButton: (id: ButtonId, on: boolean) => void;
  onInteract: () => void;
}

// Les touches ne sont prises que si le focus est dans la console, ou sur la page
// (document.body) pendant que la console est visible. Une touche sans effet dans
// l'état courant garde son comportement normal (pas de preventDefault).
export function useConsoleInput({ gameRef, stageRef, screenRef, visibleRef, setButton, onInteract }: InputOptions) {
  useEffect(() => {
    // Touches tenues dont le premier appui a eu un effet, avec l'écran où il a eu lieu.
    const held = new Map<string, { button: ButtonId; screen: number }>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const game = gameRef.current;
      const stage = stageRef.current;
      if (!game || !stage) return;
      const active = document.activeElement;
      const inDevice = !!active && stage.contains(active);
      const onPage = !active || active === document.body || active === document.documentElement;
      if (!inDevice && !(onPage && visibleRef.current)) return;
      if (isEditable(active)) return;
      const action = KEYMAP[e.key];
      if (LETTER.test(e.key) && !inDevice) return;
      if (game.isBooting()) {
        game.skipBoot();
        onInteract();
        if (action) e.preventDefault();
        return;
      }
      if (!action) return;
      // Entrée et Espace activent nativement le bouton ou le lien qui a le focus.
      const native =
        inDevice &&
        active !== screenRef.current &&
        (active instanceof HTMLButtonElement || active instanceof HTMLAnchorElement);
      if (native && (e.key === 'Enter' || e.key === ' ')) return;

      if (e.repeat) {
        // Répétition automatique : rien si le premier appui n'a rien fait ;
        // sinon seules les flèches répètent, et seulement sur l'écran où l'appui a commencé.
        const first = held.get(e.key);
        if (!first) return;
        e.preventDefault();
        if (action === 'a' || action === 'b' || first.screen !== game.screenGeneration()) return;
        game.press(action);
        return;
      }

      onInteract();
      const screen = game.screenGeneration();
      let handled = false;
      if (action === 'left' || action === 'right') handled = game.hold(action, true);
      handled = game.press(action) || handled;
      if (!handled) return;
      e.preventDefault();
      if (!held.has(e.key)) {
        held.set(e.key, { button: action, screen });
        setButton(action, true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const action = KEYMAP[e.key];
      if (!action) return;
      if (action === 'left' || action === 'right') gameRef.current?.hold(action, false);
      const first = held.get(e.key);
      if (first) {
        held.delete(e.key);
        setButton(first.button, false);
      }
    };

    const onBlur = () => {
      gameRef.current?.releaseAll();
      for (const { button } of held.values()) setButton(button, false);
      held.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [gameRef, stageRef, screenRef, visibleRef, setButton, onInteract]);
}
