import type { Experience, Formation } from '@/lib/types';
import { cleanList, paragraphs } from './content';
import b from './booklet.module.css';
import n from './notice.module.css';

interface LevelsPageProps {
  experiences: Experience[];
  formations: Formation[];
}

/**
 * Rubrique « Les niveaux » : le parcours, en entreprise puis en formation.
 * Une seule colonne de rangées « nom et dates | texte », pour garder une mesure
 * de lecture confortable (comme la liste des cartouches).
 */
export default function LevelsPage({ experiences, formations }: LevelsPageProps) {
  return (
    <section
      id="niveaux"
      aria-labelledby="niveaux-titre"
      className={`${b.sheet} ${n.anchor}`}
    >
      <div className={b.rubric}>
        <h2 id="niveaux-titre" className={b.rubricTitle}>
          Les niveaux
        </h2>
      </div>

      <div className={n.levels}>
        <section aria-labelledby="experiences-titre">
          <h3 id="experiences-titre" className={n.subTitle}>
            Expériences
          </h3>
          {experiences.length === 0 ? (
            <p className={n.levelText}>Aucune expérience renseignée pour le moment.</p>
          ) : (
            <ol className={n.levelList}>
              {experiences.map((experience) => (
                <ExperienceLevel key={experience.id} experience={experience} />
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="formations-titre">
          <h3 id="formations-titre" className={n.subTitle}>
            Formations
          </h3>
          {formations.length === 0 ? (
            <p className={n.levelText}>Aucune formation renseignée pour le moment.</p>
          ) : (
            <ol className={n.levelList}>
              {formations.map((formation) => (
                <FormationLevel key={formation.id} formation={formation} />
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}

function ExperienceLevel({ experience }: { experience: Experience }) {
  const when = [experience.duration, experience.location].filter(Boolean).join(' · ');
  const points = [
    ...cleanList(experience.responsibilities),
    ...cleanList(experience.achievements),
  ];
  const technologies = cleanList(experience.technologies);
  // Résumé court en priorité ; sinon le premier paragraphe de la description longue.
  const summary =
    experience.description?.trim() || paragraphs(experience.fullDescription)[0];

  return (
    <li className={n.level}>
      <div>
        <h4 className={n.levelName}>{experience.company}</h4>
        {experience.position ? <p className={n.levelRole}>{experience.position}</p> : null}
        {when ? <p className={n.levelWhen}>{when}</p> : null}
      </div>
      <div className={n.levelBody}>
        {summary ? <p className={n.levelText}>{summary}</p> : null}
        {points.length > 0 ? (
          <ul className={n.levelPoints}>
            {points.map((point, index) => (
              <li key={`${index}-${point}`}>{point}</li>
            ))}
          </ul>
        ) : null}
        {technologies.length > 0 ? (
          <ul className={`${b.inlineList} ${n.levelTech}`} aria-label="Technologies">
            {technologies.map((tech, index) => (
              <li key={`${index}-${tech}`}>{tech}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

function FormationLevel({ formation }: { formation: Formation }) {
  const skills = cleanList(formation.skills);

  return (
    <li className={n.level}>
      <div>
        <h4 className={n.levelName}>{formation.school}</h4>
        {formation.period ? <p className={n.levelWhen}>{formation.period}</p> : null}
      </div>
      <div className={n.levelBody}>
        {formation.description ? (
          <p className={n.levelText}>{formation.description}</p>
        ) : null}
        {skills.length > 0 ? (
          <ul className={`${b.inlineList} ${n.levelTech}`} aria-label="Compétences">
            {skills.map((skill, index) => (
              <li key={`${index}-${skill}`}>{skill}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
