import { FACTEUR, LABEL_ICON } from '@/components/console/pixel/sprites';
import { SITE } from '@/lib/site';
import { serviceLead, splitEmail } from './content';
import CopyEmail from './CopyEmail';
import PixelArt from './PixelArt';
import { GITHUB, LINKEDIN } from './sprites';
import b from './booklet.module.css';
import n from './notice.module.css';

// Le facteur en réserve sur l'aplat cobalt, sacoche et casquette framboise.
const POSTMAN_PRINT = {
  '0': 'var(--paper)',
  '1': 'var(--framboise-pale)',
  '2': 'var(--framboise)',
  '3': 'var(--cobalt-night)',
};

const ICON = { '#': 'currentColor' };

/** Dos du livret : le contact, gros et évident. */
export default function ServicePage() {
  const [local, domain] = splitEmail(SITE.email);
  const year = new Date().getFullYear();

  return (
    <section
      id="contact"
      aria-labelledby="contact-titre"
      className={`${b.sheet} ${b.sheetCobalt} ${n.anchor}`}
    >
      <div className={`${b.rubric} ${n.serviceRubric}`}>
        <h2 id="contact-titre" className={b.rubricTitle}>
          Le service après-vente
        </h2>
        {/* Le facteur de la rue, debout sur le filet de la rubrique */}
        <div className={n.postman} aria-hidden="true">
          <PixelArt rows={FACTEUR} palette={POSTMAN_PRINT} pixel="var(--sprite-px)" />
        </div>
      </div>

      <div className={n.service}>
        <p className={n.serviceLead}>{serviceLead()}</p>

        <a href={`mailto:${SITE.email}`} className={n.email}>
          <PixelArt rows={LABEL_ICON.mail} palette={ICON} pixel="0.09em" className={b.icon} />
          <span className={n.emailText}>
            {local}
            <wbr />
            {domain}
          </span>
        </a>

        <div className={n.serviceActions}>
          <CopyEmail
            email={SITE.email}
            buttonClassName={`${b.button} ${b.buttonStart}`}
            statusClassName={n.copyStatus}
          />
          <a
            href={SITE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={`${b.button} ${b.buttonPaper}`}
          >
            <PixelArt rows={LINKEDIN} palette={ICON} pixel="0.1em" className={b.icon} />
            LinkedIn
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className={`${b.button} ${b.buttonPaper}`}
          >
            <PixelArt rows={GITHUB} palette={ICON} pixel="0.1em" className={b.icon} />
            GitHub
            <span className="sr-only"> (nouvel onglet)</span>
          </a>
        </div>

      </div>

      <footer className={n.colophon}>
        <p>
          Ce site tourne sur un serveur que Théo administre lui-même : chaque
          modification passe par la CI, devient une image Docker, puis se déploie
          toute seule.
        </p>
        <p>
          © {year} {SITE.name} · Notice imprimée à {SITE.city}.{' '}
          <a href="#console" className={b.inkLink}>
            Retour à la console
          </a>
        </p>
      </footer>
    </section>
  );
}
