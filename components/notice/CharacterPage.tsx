import { THEO_FRONT } from '@/components/console/pixel/sprites';
import { SITE } from '@/lib/site';
import { CHARACTER } from './content';
import PixelArt from './PixelArt';
import b from './booklet.module.css';
import n from './notice.module.css';

// Théo imprimé en deux encres : contour cobalt, pull framboise, joues en trame.
const THEO_PRINT = {
  '0': 'var(--paper)',
  '1': 'var(--framboise-light)',
  '2': 'var(--framboise-ink)',
  '3': 'var(--ink)',
};

/** Rubrique « Le personnage » : qui est Théo, ce qu'il cherche, sa façon de travailler. */
export default function CharacterPage() {
  return (
    <section
      id="personnage"
      aria-labelledby="personnage-titre"
      className={`${b.sheet} ${n.anchor}`}
    >
      <div className={b.rubric}>
        <h2 id="personnage-titre" className={b.rubricTitle}>
          Le personnage
        </h2>
      </div>

      <div className={n.character}>
        <div className={n.portrait} aria-hidden="true">
          <div className={n.portraitFrame}>
            <PixelArt rows={THEO_FRONT} palette={THEO_PRINT} pixel="var(--sprite-px, 8px)" />
          </div>
          <div className={n.nameplate}>THÉO · DISPO</div>
        </div>

        <div>
          <h3 className={n.characterName}>{SITE.name}</h3>
          <p className={n.characterClass}>
            {SITE.role} · {SITE.city}
          </p>
          <p className={n.lead}>{CHARACTER.intro}</p>

          <dl className={n.table}>
            <div className={n.tableRow}>
              <dt className={n.factKey}>Quête</dt>
              <dd className={`${n.factValue} ${n.factQuest}`}>
                {SITE.availability} · {SITE.workMode}
              </dd>
            </div>
            {CHARACTER.facts.map((fact) => (
              <div key={fact.key} className={n.tableRow}>
                <dt className={n.factKey}>{fact.key}</dt>
                <dd className={n.factValue}>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <h3 className={n.subTitle}>Coups spéciaux</h3>
          <dl className={n.table}>
            {CHARACTER.moves.map((move) => (
              <div key={move.name} className={n.tableRow}>
                <dt className={n.moveKey}>{move.name}</dt>
                <dd className={n.moveValue}>{move.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
