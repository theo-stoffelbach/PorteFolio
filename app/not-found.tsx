import type { Metadata } from 'next';
import MissingSheet from '@/components/notice/MissingSheet';

export const metadata: Metadata = {
  title: 'Page introuvable',
};

export default function NotFound() {
  return (
    <MissingSheet title="Page introuvable">
      <p>Cette page n&apos;existe pas, ou plus.</p>
      <p>Souffler dans la cartouche n&apos;y changera rien : la console t&apos;attend à l&apos;accueil.</p>
    </MissingSheet>
  );
}
