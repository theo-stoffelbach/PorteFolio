'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

// Vrai une fois l'application hydratée. Avant (rendu serveur, navigateur sans
// JavaScript), les commandes qui ne marchent qu'avec le jeu restent masquées.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}
