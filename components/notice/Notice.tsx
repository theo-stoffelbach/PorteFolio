import type { Cartridge } from '@/lib/catalog';
import type { Experience, Formation } from '@/lib/types';
import CartridgesPage from './CartridgesPage';
import CharacterPage from './CharacterPage';
import LevelsPage from './LevelsPage';
import NoticeCover from './NoticeCover';
import ServicePage from './ServicePage';
import b from './booklet.module.css';
import n from './notice.module.css';

export interface NoticeProps {
  cartridges: Cartridge[];
  experiences: Experience[];
  formations: Formation[];
}

/**
 * La notice de la console = le mode rapide.
 * Tout le contenu de la console existe ici en HTML rendu côté serveur
 * (lecteurs d'écran, référencement, visiteurs pressés, navigateur sans JS).
 * SELECT y fait défiler la page et lui donne le focus (d'où le tabIndex -1).
 */
export default function Notice({ cartridges, experiences, formations }: NoticeProps) {
  return (
    <section
      id="notice"
      tabIndex={-1}
      aria-labelledby="notice-titre"
      className={`${b.desk} ${n.notice}`}
    >
      <div className={n.booklet}>
        <NoticeCover
          projectCount={cartridges.length}
          levelCount={experiences.length + formations.length}
        />
        <CharacterPage />
        <CartridgesPage cartridges={cartridges} />
        <LevelsPage experiences={experiences} formations={formations} />
        <ServicePage />
      </div>
    </section>
  );
}
