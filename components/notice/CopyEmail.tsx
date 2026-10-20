'use client';

import { useEffect, useRef, useState } from 'react';
import PixelArt from './PixelArt';
import { CHECK, COPY } from './sprites';
import b from './booklet.module.css';

type CopyState = 'idle' | 'copied' | 'failed';

const MESSAGES: Record<CopyState, string> = {
  idle: '',
  copied: 'Adresse copiée.',
  failed: "Copie impossible ici : sélectionne l'adresse à la main.",
};

interface CopyEmailProps {
  email: string;
  buttonClassName?: string;
  statusClassName?: string;
}

/** Copie l'adresse e-mail dans le presse-papiers, pour qui n'a pas de client mail. */
export default function CopyEmail({
  email,
  buttonClassName,
  statusClassName,
}: CopyEmailProps) {
  const [state, setState] = useState<CopyState>('idle');
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  async function copy() {
    try {
      // navigator.clipboard est absent hors contexte sécurisé : l'erreur est rattrapée.
      await navigator.clipboard.writeText(email);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setState('idle'), 5000);
  }

  return (
    <>
      <button type="button" onClick={copy} className={buttonClassName}>
        <PixelArt
          rows={state === 'copied' ? CHECK : COPY}
          palette={{ '#': 'currentColor' }}
          pixel="0.125em"
          className={b.icon}
        />
        Copier l&apos;adresse
      </button>
      <span role="status" className={statusClassName}>
        {MESSAGES[state]}
      </span>
    </>
  );
}
