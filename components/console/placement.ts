import type { CSSProperties } from 'react';
import type { Rect } from './pixel/engine';
import { CART_CANVAS, LANDSCAPE, PORTRAIT, type ControlId } from './render/layout';

// Variables CSS de placement pour les deux dispositions (voir .abs dans console.module.css).
export function placement(land: Rect, port: Rect): CSSProperties {
  return {
    '--lx': land.x,
    '--ly': land.y,
    '--lw': land.w,
    '--lh': land.h,
    '--qx': port.x,
    '--qy': port.y,
    '--qw': port.w,
    '--qh': port.h,
  } as CSSProperties;
}

export function controlPlacement(id: ControlId): CSSProperties {
  return placement(LANDSCAPE.controls[id], PORTRAIT.controls[id]);
}

// Emplacement de la cartouche à moitié insérée (avec son ombre).
export const SLOT_PLACEMENT = placement(
  { x: LANDSCAPE.cart.x, y: LANDSCAPE.cart.y, w: CART_CANVAS.w, h: CART_CANVAS.h },
  { x: PORTRAIT.cart.x, y: PORTRAIT.cart.y, w: CART_CANVAS.w, h: CART_CANVAS.h }
);
