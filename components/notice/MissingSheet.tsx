import type { ReactNode } from 'react';
import Link from 'next/link';
import b from './booklet.module.css';
import p from './project.module.css';

interface MissingSheetProps {
  title: string;
  children: ReactNode;
}

/** Page d'erreur imprimée sur le même papier que la notice. */
export default function MissingSheet({ title, children }: MissingSheetProps) {
  return (
    <main className={`${b.desk} ${p.page}`}>
      <div className={p.frame}>
        <article className={`${b.sheet} ${p.missing}`} aria-labelledby="erreur-titre">
          <h1 id="erreur-titre" className={p.title}>
            {title}
          </h1>
          <div className={p.missingText}>{children}</div>
          <div className={p.missingActions}>
            <Link href="/#console" className={`${b.button} ${b.buttonCobalt}`}>
              Retour à la console
            </Link>
            <Link href="/#cartouches" className={b.inkLink}>
              Voir toutes les cartouches
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
