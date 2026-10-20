import ConsoleExperience from '@/components/console/ConsoleExperience';
import Notice from '@/components/notice/Notice';
import { loadCartridges, loadLevels } from '@/components/notice/data';

// Rendu à chaque requête : les modifications faites dans l'admin apparaissent tout de suite.
export const dynamic = 'force-dynamic';

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const [cartridges, levels, params] = await Promise.all([
    loadCartridges(),
    loadLevels(),
    searchParams,
  ]);

  // ?cartouche=<id> : la cartouche est insérée au chargement, si elle existe.
  const requested = typeof params.cartouche === 'string' ? params.cartouche : undefined;
  const initialCartridgeId = cartridges.some((cartridge) => cartridge.id === requested)
    ? requested
    : undefined;

  return (
    <>
      <a href="#notice" className="skip-link">
        Aller au mode rapide (la notice)
      </a>
      {/* Le titre h1 (masqué visuellement) est posé par la console. */}
      <main>
        <ConsoleExperience
          cartridges={cartridges}
          experiences={levels.experiences}
          formations={levels.formations}
          initialCartridgeId={initialCartridgeId}
        />
        <Notice
          cartridges={cartridges}
          experiences={levels.experiences}
          formations={levels.formations}
        />
      </main>
    </>
  );
}
