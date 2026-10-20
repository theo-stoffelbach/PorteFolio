'use client';

import { memo, useCallback, type CSSProperties, type MouseEvent } from 'react';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  CAT_HEX,
  cartridgeCount,
  oneLineTitle,
  type Cartridge,
} from '@/lib/catalog';
import type { ProjectCategory } from '@/lib/types';
import styles from './console.module.css';
import PixelCanvas from './PixelCanvas';
import type { Surface } from './pixel/engine';
import { drawShelfCartridge, drawShelfGhost } from './render/cartridge';
import { SHELF_CART } from './render/layout';
import { useHydrated } from './useHydrated';

interface ShelfProps {
  cartridges: readonly Cartridge[];
  // Cartouches absentes de l'étagère (dans la console ou en vol).
  away: ReadonlySet<string>;
  onInsert: (id: string) => void;
  registerCart: (id: string, el: HTMLElement | null) => void;
}

// Nom de la couleur de chaque bandeau, pour les lecteurs d'écran.
const COLOR_NAME: Record<ProjectCategory, string> = {
  infra: 'sarcelle',
  ia: 'violet',
  jeux: 'vert',
  web: 'orange',
};

// Petit triangle pixel du titre (le ▼ de la police SF de la console).
const ARROW_ROWS = ['#####', '.###.', '..#..'];

// L'étagère « Ludothèque » : chaque cartouche est un vrai lien vers sa fiche,
// que le JavaScript intercepte pour l'insérer dans la console. Titre et légende
// sont du texte en police pixel : visibles dès le premier rendu.
export default function Shelf({ cartridges, away, onInsert, registerCart }: ShelfProps) {
  const n = cartridges.length;
  const hydrated = useHydrated();

  return (
    <section id="ludotheque" className={styles.shelf} aria-labelledby="ludotheque-titre">
      <div className={styles.shelfInner}>
        <div className={styles.shelfHead}>
          <h2 id="ludotheque-titre" className={styles.shelfTitle}>
            <svg
              className={styles.shelfArrow}
              viewBox="0 0 5 3"
              shapeRendering="crispEdges"
              aria-hidden="true"
              focusable="false"
            >
              {ARROW_ROWS.flatMap((row, y) =>
                [...row].map((cell, x) => (cell === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null))
              )}
            </svg>
            {`Ludothèque · ${cartridgeCount(n)}`}
          </h2>
          {n > 0 && (
            <ul className={styles.legend} aria-label="Couleurs des catégories">
              {CATEGORY_ORDER.map((k) => (
                <li key={k}>
                  <span
                    className={styles.swatch}
                    style={{ '--cat': CAT_HEX[k].b } as CSSProperties}
                    aria-hidden="true"
                  />
                  {CATEGORY_META[k].label}
                  <span className={styles.srOnly}> : bandeau {COLOR_NAME[k]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {n === 0 ? (
          <p className={styles.empty}>Les étagères sont vides pour l&apos;instant.</p>
        ) : (
          <ul className={styles.cartList}>
            {cartridges.map((cart) => (
              <ShelfCart
                key={cart.id}
                cart={cart}
                away={away.has(cart.id)}
                onInsert={onInsert}
                registerCart={registerCart}
                hydrated={hydrated}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

interface ShelfCartProps {
  cart: Cartridge;
  away: boolean;
  // Avant l'hydratation (ou sans JavaScript), le lien mène simplement à la fiche.
  hydrated: boolean;
  onInsert: (id: string) => void;
  registerCart: (id: string, el: HTMLElement | null) => void;
}

// Nom accessible qui reprend d'abord le texte visible de l'étiquette (WCAG 2.5.3).
function cartName(cart: Cartridge, away: boolean, hydrated: boolean): string {
  const label = oneLineTitle(cart);
  const full = label.toLowerCase() === cart.title.toLowerCase() ? label : `${label}, ${cart.title}`;
  const category = `catégorie ${CATEGORY_META[cart.category].label}`;
  if (!hydrated) return `Fiche de la cartouche ${full}, ${category}`;
  if (away) return `Cartouche ${full}, ${category}, en console : la relancer`;
  return `Insérer la cartouche ${full}, ${category}`;
}

const ShelfCart = memo(function ShelfCart({ cart, away, hydrated, onInsert, registerCart }: ShelfCartProps) {
  const paint = useCallback(
    (s: Surface) => (away ? drawShelfGhost(s, cart) : drawShelfCartridge(s, cart)),
    [cart, away]
  );

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Ctrl, Cmd, Maj ou clic du milieu : on laisse le navigateur ouvrir la fiche.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onInsert(cart.id);
  };

  return (
    <li className={styles.cartItem}>
      <a
        ref={(el) => registerCart(cart.id, el)}
        href={`/projets/${encodeURIComponent(cart.id)}`}
        className={styles.cartLink}
        aria-label={cartName(cart, away && hydrated, hydrated)}
        title={cart.tagline}
        onClick={onClick}
        style={{ '--cat': CAT_HEX[cart.category].b } as CSSProperties}
      >
        {!hydrated && (
          <span className={styles.cartFallback} aria-hidden="true">
            {cart.shortTitle}
          </span>
        )}
        <PixelCanvas width={SHELF_CART.canvasW} height={SHELF_CART.h} paint={paint} scale="--spx" />
      </a>
    </li>
  );
});
