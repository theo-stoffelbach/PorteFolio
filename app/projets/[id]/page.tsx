import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProjectSheet from '@/components/notice/ProjectSheet';
import { loadCartridges } from '@/components/notice/data';

// Rendu à chaque requête : une cartouche modifiée dans l'admin est à jour tout de suite.
export const dynamic = 'force-dynamic';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

async function findCartridge(id: string) {
  const cartridges = await loadCartridges();
  const index = cartridges.findIndex((cartridge) => cartridge.id === id);
  if (index === -1) return null;
  return {
    cartridge: cartridges[index],
    previous: index > 0 ? cartridges[index - 1] : undefined,
    next: index < cartridges.length - 1 ? cartridges[index + 1] : undefined,
  };
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await findCartridge(id);
  if (!found) {
    return { title: 'Cartouche introuvable' };
  }
  const { cartridge } = found;
  const description = cartridge.tagline || cartridge.description;
  return {
    title: cartridge.title,
    description,
    openGraph: {
      type: 'article',
      locale: 'fr_FR',
      title: cartridge.title,
      description,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const found = await findCartridge(id);
  if (!found) {
    notFound();
  }

  return (
    <ProjectSheet
      cartridge={found.cartridge}
      previous={found.previous}
      next={found.next}
    />
  );
}
