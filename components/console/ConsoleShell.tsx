'use client';

import { useRef, type CSSProperties, type PointerEvent, type RefObject } from 'react';
import { CAT_HEX, oneLineTitle, type Cartridge } from '@/lib/catalog';
import { SITE } from '@/lib/site';
import styles from './console.module.css';
import type { Action, Direction, ScreenLink } from './game/types';
import { SLOT_PLACEMENT, controlPlacement } from './placement';
import { BODY_IMAGE, CART_CANVAS, LANDSCAPE, PORTRAIT, SCREEN_H, SCREEN_W } from './render/layout';
import { useHydrated } from './useHydrated';

export type FaceButton = 'a' | 'b' | 'start' | 'select';

export interface ShellHandlers {
  screenClick: (x: number, y: number) => void;
  dirDown: (dir: Direction) => void;
  dirUp: (dir: Direction) => void;
  buttonDown: (id: FaceButton) => void;
  buttonUp: (id: FaceButton) => void;
  // Clic sur une commande ; `keyboard` = activée au clavier (Entrée / Espace).
  click: (action: Action, keyboard: boolean) => void;
  registerLink: (id: string, el: HTMLAnchorElement | null) => void;
}

// Chaque ref est une prop distincte : le rendu ne lit jamais une ref (règle react-hooks/refs).
interface ConsoleShellProps {
  stageRef: RefObject<HTMLDivElement | null>;
  slotAnchorRef: RefObject<HTMLDivElement | null>;
  slotRef: RefObject<HTMLDivElement | null>;
  slotCanvasRef: RefObject<HTMLCanvasElement | null>;
  bodyLandscapeRef: RefObject<HTMLCanvasElement | null>;
  bodyPortraitRef: RefObject<HTMLCanvasElement | null>;
  screenCanvasRef: RefObject<HTMLCanvasElement | null>;
  screenRef: RefObject<HTMLDivElement | null>;
  handlers: ShellHandlers;
  links: readonly ScreenLink[];
  live: string;
  // Cartouche à moitié insérée au chargement : repli en texte avant le premier dessin.
  restingCart: Cartridge | null;
}

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

const ARROWS: readonly { dir: Direction; label: string }[] = [
  { dir: 'up', label: 'Croix : haut' },
  { dir: 'left', label: 'Croix : gauche' },
  { dir: 'right', label: 'Croix : droite' },
  { dir: 'down', label: 'Croix : bas' },
];

const BUTTONS: readonly { id: FaceButton; label: string; round: boolean }[] = [
  { id: 'a', label: 'Bouton A : ouvrir', round: true },
  { id: 'b', label: 'Bouton B : retour', round: true },
  { id: 'select', label: 'SELECT : mode rapide, ouvre la notice', round: false },
  { id: 'start', label: 'START : contacter Théo', round: false },
];

// La console dessinée et ses commandes : de vrais boutons posés sur le dessin.
export default function ConsoleShell({
  stageRef,
  slotAnchorRef,
  slotRef,
  slotCanvasRef,
  bodyLandscapeRef,
  bodyPortraitRef,
  screenCanvasRef,
  screenRef,
  handlers,
  links,
  live,
  restingCart,
}: ConsoleShellProps) {
  const dpadDir = useRef<Direction | null>(null);
  const dpadPointer = useRef<number | null>(null);
  // Sans JavaScript (ou avant l'hydratation), les commandes n'ont aucun effet :
  // elles restent hors de l'ordre de tabulation et hors de l'arbre d'accessibilité.
  const hydrated = useHydrated();

  const dirAt = (e: PointerEvent<HTMLDivElement>): Direction | null => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    // Zone morte au centre : on garde la direction en cours.
    if (Math.hypot(dx, dy) < r.width * 0.08) return dpadDir.current;
    if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'up' : 'down';
  };

  const setDir = (dir: Direction | null) => {
    if (dir === dpadDir.current) return;
    if (dpadDir.current) handlers.dirUp(dpadDir.current);
    dpadDir.current = dir;
    if (dir) handlers.dirDown(dir);
  };

  const onDpadDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dpadPointer.current = e.pointerId;
    setDir(dirAt(e));
  };

  const onDpadMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dpadPointer.current !== e.pointerId) return;
    setDir(dirAt(e));
  };

  const onDpadEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (dpadPointer.current !== e.pointerId) return;
    dpadPointer.current = null;
    setDir(null);
  };

  const screenPlacement = controlPlacement('screen');

  return (
    <div className={styles.stageWrap}>
      <div ref={stageRef} className={styles.stage}>
        <p className={styles.srOnly} hidden={!hydrated}>
          Commandes : les flèches pour bouger, A ou Entrée pour ouvrir, B ou Échap pour revenir. Tu peux aussi
          cliquer sur une cartouche de l'étagère.
        </p>
        <p className={styles.srOnly}>
          Quête en cours : {SITE.availability}, {SITE.workMode.toLowerCase()}.
        </p>

        <div
          ref={slotAnchorRef}
          className={cx(styles.abs, styles.slotAnchor)}
          style={SLOT_PLACEMENT}
          aria-hidden="true"
        />
        <div ref={slotRef} className={cx(styles.abs, styles.slot)} style={SLOT_PLACEMENT} aria-hidden="true">
          {!hydrated && restingCart && (
            <span
              className={styles.slotFallback}
              style={{ '--cat': CAT_HEX[restingCart.category].b } as CSSProperties}
            >
              {oneLineTitle(restingCart)}
            </span>
          )}
          <canvas ref={slotCanvasRef} width={CART_CANVAS.w} height={CART_CANVAS.h} />
        </div>

        {/* Le corps dessiné existe aussi en image (générée au build par app/pixel) :
            il s'affiche dès le premier rendu, avant le JavaScript ou sans lui. */}
        <canvas
          ref={bodyLandscapeRef}
          width={LANDSCAPE.w}
          height={LANDSCAPE.h}
          className={cx(styles.body, styles.bodyLandscape)}
          style={{ backgroundImage: `url(${BODY_IMAGE.landscape})` }}
          aria-hidden="true"
        />
        <canvas
          ref={bodyPortraitRef}
          width={PORTRAIT.w}
          height={PORTRAIT.h}
          className={cx(styles.body, styles.bodyPortrait)}
          style={{ backgroundImage: `url(${BODY_IMAGE.portrait})` }}
          aria-hidden="true"
        />

        <canvas
          ref={screenCanvasRef}
          width={SCREEN_W}
          height={SCREEN_H}
          className={cx(styles.abs, styles.screenCanvas)}
          style={screenPlacement}
          aria-hidden="true"
        />
        <noscript>
          <div className={cx(styles.abs, styles.noscript)} style={screenPlacement}>
            <span>La console a besoin de JavaScript pour s&apos;allumer.</span>
            <a href="#notice">Lire la notice : tout le contenu en clair</a>
          </div>
        </noscript>

        <div
          ref={screenRef}
          hidden={!hydrated}
          role="application"
          aria-roledescription="écran de jeu"
          aria-label="Écran de la console"
          aria-describedby="console-aide"
          tabIndex={0}
          className={cx(styles.abs, styles.screen)}
          style={screenPlacement}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            handlers.screenClick(
              ((e.clientX - r.left) / r.width) * SCREEN_W,
              ((e.clientY - r.top) / r.height) * SCREEN_H
            );
          }}
        />
        {links.length > 0 && (
          <div className={styles.abs} style={{ ...screenPlacement, zIndex: 5, pointerEvents: 'none' }}>
            {links.map((link) => (
              <a
                key={link.id}
                ref={(el) => handlers.registerLink(link.id, el)}
                href={link.href}
                className={styles.screenLink}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                style={{
                  left: `${(link.x / SCREEN_W) * 100}%`,
                  top: `${(link.y / SCREEN_H) * 100}%`,
                  width: `${(link.w / SCREEN_W) * 100}%`,
                  height: `${(link.h / SCREEN_H) * 100}%`,
                  pointerEvents: 'auto',
                }}
              >
                <span className={styles.srOnly}>
                  {link.label}
                  {link.external ? ' (nouvel onglet)' : ''}
                </span>
              </a>
            ))}
          </div>
        )}

        <div
          hidden={!hydrated}
          className={cx(styles.abs, styles.dpad)}
          style={controlPlacement('dpad')}
          aria-hidden="true"
          onPointerDown={onDpadDown}
          onPointerMove={onDpadMove}
          onPointerUp={onDpadEnd}
          onPointerCancel={onDpadEnd}
          onLostPointerCapture={onDpadEnd}
          onContextMenu={(e) => e.preventDefault()}
        />
        {ARROWS.map(({ dir, label }) => (
          <button
            key={dir}
            type="button"
            hidden={!hydrated}
            tabIndex={-1}
            className={cx(styles.abs, styles.arrow)}
            style={controlPlacement(dir)}
            aria-label={label}
            onClick={(e) => handlers.click(dir, e.detail === 0)}
          />
        ))}
        {BUTTONS.map(({ id, label, round }) => (
          <button
            key={id}
            type="button"
            hidden={!hydrated}
            className={cx(styles.abs, styles.control, round && styles.round)}
            style={controlPlacement(id)}
            aria-label={label}
            onPointerDown={(e) => {
              if (e.button === 0) handlers.buttonDown(id);
            }}
            onPointerUp={() => handlers.buttonUp(id)}
            onPointerLeave={() => handlers.buttonUp(id)}
            onPointerCancel={() => handlers.buttonUp(id)}
            onClick={(e) => handlers.click(id, e.detail === 0)}
          />
        ))}

        <p id="console-aide" className={styles.srOnly}>
          Flèches : se déplacer et choisir. A, X, Entrée ou Espace : ouvrir et valider. B, Z, Échap ou Retour
          arrière : revenir. Le texte de l'écran est lu dans la zone d'annonce.
        </p>
        <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
          {live}
        </p>
      </div>
    </div>
  );
}
