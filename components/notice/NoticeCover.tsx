import { countLabel } from '@/lib/catalog';
import { SITE } from '@/lib/site';
import PixelArt from './PixelArt';
import { CONSOLE } from './sprites';
import b from './booklet.module.css';
import n from './notice.module.css';

// La console imprimée en réserve sur l'aplat cobalt, avec la seconde encre framboise.
const CONSOLE_PRINT = {
  o: 'var(--cobalt-night)',
  b: 'var(--paper)',
  z: 'var(--cobalt-night)',
  L: 'var(--framboise-pale)',
  k: 'var(--cobalt-night)',
  r: 'var(--framboise)',
  y: 'var(--start)',
  v: 'var(--framboise)',
  l: 'var(--paper)',
};

interface NoticeCoverProps {
  projectCount: number;
  levelCount: number;
}

/** Couverture cobalt du livret, avec l'essentiel et le sommaire. */
export default function NoticeCover({ projectCount, levelCount }: NoticeCoverProps) {
  const contents = [
    { href: '#personnage', label: 'Le personnage', value: 'Théo' },
    {
      href: '#cartouches',
      label: 'Les cartouches',
      value: countLabel(projectCount, 'projet', 'projets'),
    },
    {
      href: '#niveaux',
      label: 'Les niveaux',
      value: countLabel(levelCount, 'étape', 'étapes'),
    },
    { href: '#contact', label: 'Le service après-vente', value: 'Contact' },
  ];

  return (
    <header className={`${b.sheet} ${b.sheetCobalt} ${n.cover}`}>
      <div className={n.coverGrid}>
        <div>
          <h2 id="notice-titre" className={n.coverTitle}>
            <span className={n.coverLogo}>TS-27</span>{' '}
            <span className={n.coverMode}>Mode d&apos;emploi</span>
          </h2>
          <p className={n.coverWho}>
            <strong>{SITE.name}</strong>, {SITE.role.toLowerCase()} à {SITE.city}.
          </p>
          <p className={n.quest}>
            <span className={n.questLabel}>Quête en cours :</span>{' '}
            {/* Espace insécable : le point médian reste au bout de la ligne de la date. */}
            <span className={n.questValue}>{`${SITE.availability} · ${SITE.workMode}`}</span>
          </p>
          <p className={n.coverHint}>
            Le mode rapide : tout le portfolio en une page, sans jouer.
          </p>
          <div className={n.coverActions}>
            <a href="#contact" className={`${b.button} ${b.buttonStart}`}>
              Contacter Théo
            </a>
            <a href="#console" className={`${b.inkLink} ${n.coverBack}`}>
              Retour à la console
            </a>
          </div>
        </div>

        <div className={n.coverSide}>
          <PixelArt
            rows={CONSOLE}
            palette={CONSOLE_PRINT}
            pixel="var(--sprite-px)"
            className={n.coverArt}
          />
          <nav className={n.contents} aria-labelledby="sommaire-titre">
            <h3 id="sommaire-titre" className={n.contentsTitle}>
              Sommaire
            </h3>
            <ol className={n.contentsList}>
              {contents.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className={n.contentsLink}>
                    <span className={n.contentsLabel}>{item.label}</span>{' '}
                    <span className={n.contentsValue}>{item.value}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </header>
  );
}
