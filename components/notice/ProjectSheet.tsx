import type { CSSProperties } from 'react';
import Link from 'next/link';
import { CATEGORY_META, STATUS_LABEL, type Cartridge } from '@/lib/catalog';
import {
  CATEGORY_COLORS,
  cleanList,
  insertHref,
  paragraphs,
  projectHref,
} from './content';
import PixelArt from './PixelArt';
import { ARROW_LEFT, ARROW_RIGHT, LOCK } from './sprites';
import b from './booklet.module.css';
import p from './project.module.css';

const ICON = { '#': 'currentColor' };

interface ProjectSheetProps {
  cartridge: Cartridge;
  previous?: Cartridge;
  next?: Cartridge;
}

/**
 * Page de notice dédiée à une cartouche. Les rubriques reprennent le menu
 * de l'écran de titre dans la console : FICHE, STACK, CHIFFRES, LIENS.
 */
export default function ProjectSheet({ cartridge, previous, next }: ProjectSheetProps) {
  const meta = CATEGORY_META[cartridge.category] ?? CATEGORY_META.web;
  const colors = CATEGORY_COLORS[cartridge.category] ?? CATEGORY_COLORS.web;
  const description = paragraphs(cartridge.description);
  const highlights = cleanList(cartridge.highlights);
  const technologies = cleanList(cartridge.technologies);
  const stats = (cartridge.stats ?? []).filter((stat) => stat?.label && stat?.value);
  const cartridgeColors = {
    '--cat': colors.base,
    '--cat-deep': colors.deep,
    '--cat-light': colors.light,
  } as CSSProperties;

  return (
    <main className={`${b.desk} ${p.page}`}>
      <div className={p.frame}>
        <nav className={p.topbar} aria-label="Navigation de la fiche">
          <Link href="/#cartouches" className={p.back}>
            <PixelArt rows={ARROW_LEFT} palette={ICON} pixel="0.125em" className={b.icon} />
            <span className={p.backText}>Toutes les cartouches</span>
          </Link>
          <Link href={insertHref(cartridge.id)} className={`${b.button} ${b.buttonFramboise}`}>
            Insérer dans la console
          </Link>
        </nav>

        <article className={b.sheet} aria-labelledby="projet-titre">
          <header className={p.header}>
            <div className={p.cartridge} style={cartridgeColors} aria-hidden="true">
              <div className={p.shell}>
                <div className={p.ridges} />
                <div className={p.label}>
                  <span className={p.band}>{meta.label}</span>
                  <span className={p.labelName}>{cartridge.shortTitle}</span>
                </div>
              </div>
            </div>

            <div>
              <h1 id="projet-titre" className={p.title}>
                {cartridge.title}
              </h1>
              {cartridge.tagline ? <p className={p.tagline}>{cartridge.tagline}</p> : null}
              <dl className={p.facts}>
                <div className={p.fact}>
                  <dt className={p.factKey}>Catégorie</dt>
                  <dd className={p.factValue}>{meta.name}</dd>
                </div>
                <div className={p.fact}>
                  <dt className={p.factKey}>Statut</dt>
                  <dd className={p.factValue}>
                    <span className={b.status} data-status={cartridge.status}>
                      {STATUS_LABEL[cartridge.status] ?? STATUS_LABEL.termine}
                    </span>
                  </dd>
                </div>
                {cartridge.period ? (
                  <div className={p.fact}>
                    <dt className={p.factKey}>Période</dt>
                    <dd className={p.factValue}>{cartridge.period}</dd>
                  </div>
                ) : null}
                {cartridge.role ? (
                  <div className={p.fact}>
                    <dt className={p.factKey}>Rôle</dt>
                    <dd className={p.factValue}>{cartridge.role}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </header>

          <div className={p.body}>
            <section aria-labelledby="projet-fiche">
              <div className={b.rubric}>
                <h2 id="projet-fiche" className={b.rubricTitle}>
                  La fiche
                </h2>
              </div>
              {description.length > 0 ? (
                description.map((paragraph, index) => (
                  <p key={index} className={p.text}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className={p.text}>La description de ce projet arrive bientôt.</p>
              )}

              {highlights.length > 0 ? (
                <>
                  <h3 className={p.sectionTitle}>Points forts</h3>
                  <ul className={p.points}>
                    {highlights.map((highlight, index) => (
                      <li key={`${index}-${highlight}`}>{highlight}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>

            <div className={p.aside}>
              {technologies.length > 0 ? (
                <section aria-labelledby="projet-stack">
                  <h2 id="projet-stack" className={p.asideTitle}>
                    Stack
                  </h2>
                  <ul className={`${b.inlineList} ${p.stack}`}>
                    {technologies.map((tech, index) => (
                      <li key={`${index}-${tech}`}>{tech}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {stats.length > 0 ? (
                <section aria-labelledby="projet-chiffres">
                  <h2 id="projet-chiffres" className={p.asideTitle}>
                    Chiffres
                  </h2>
                  <dl className={p.records}>
                    {stats.map((stat, index) => (
                      <div key={`${index}-${stat.label}`} className={p.record}>
                        <dt className={p.recordLabel}>{stat.label}</dt>
                        <dd className={p.recordValue}>{stat.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              <section aria-labelledby="projet-liens">
                <h2 id="projet-liens" className={p.asideTitle}>
                  Liens
                </h2>
                <ul className={p.links}>
                  {cartridge.repoUrl ? (
                    <li className={p.linkRow}>
                      <a
                        href={cartridge.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={b.inkLink}
                      >
                        Code source
                        <span className="sr-only"> (nouvel onglet)</span>
                      </a>
                    </li>
                  ) : (
                    <li className={`${p.linkRow} ${p.private}`}>
                      <PixelArt rows={LOCK} palette={ICON} pixel="0.125em" className={b.icon} />
                      Code privé : détails sur demande
                    </li>
                  )}
                  {cartridge.demoUrl ? (
                    <li className={p.linkRow}>
                      <a
                        href={cartridge.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={b.inkLink}
                      >
                        Voir la démo
                        <span className="sr-only"> (nouvel onglet)</span>
                      </a>
                    </li>
                  ) : null}
                  <li className={p.linkRow}>
                    <Link href={insertHref(cartridge.id)} className={b.inkLink}>
                      Insérer dans la console
                    </Link>
                  </li>
                  <li className={p.linkRow}>
                    <Link href="/#contact" className={b.inkLink}>
                      Écrire à Théo
                    </Link>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </article>

        {previous || next ? (
          <nav className={p.pager} aria-label="Cartouches voisines">
            {previous ? (
              <Link href={projectHref(previous.id)} className={p.pagerLink}>
                <span className={p.pagerHint}>
                  <PixelArt rows={ARROW_LEFT} palette={ICON} pixel="0.125em" className={b.icon} />
                  Précédente
                </span>
                <span className={p.pagerTitle}>{previous.title}</span>
              </Link>
            ) : null}
            {next ? (
              <Link href={projectHref(next.id)} className={`${p.pagerLink} ${p.pagerNext}`}>
                <span className={p.pagerHint}>
                  Suivante
                  <PixelArt rows={ARROW_RIGHT} palette={ICON} pixel="0.125em" className={b.icon} />
                </span>
                <span className={p.pagerTitle}>{next.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
