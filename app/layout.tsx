import type { Metadata, Viewport } from 'next';
import { Dela_Gothic_One, M_PLUS_Rounded_1c, Silkscreen } from 'next/font/google';
import { SITE } from '@/lib/site';
import './globals.css';

// Polices téléchargées au build et servies par le site lui-même
// (CSP font-src 'self' : aucune requête vers un domaine tiers à l'exécution).

// Titres de notice de jeu des années 90 : gothique lourde.
const display = Dela_Gothic_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

// Texte courant arrondi, lisible en petit corps sur le papier rose.
const body = M_PLUS_Rounded_1c({
  weight: ['400', '500', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

// Police pixel pour les petits libellés en DOM (sérigraphie de la console).
const pixel = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
});

const TITLE = `${SITE.name} · ${SITE.role} à ${SITE.city}`;
const DESCRIPTION = `${SITE.name}, ${SITE.role.toLowerCase()} à ${SITE.city}, en alternance chez SII et en Master à Ynov. Disponible en ${SITE.availability}. Des projets réels en web, IA, jeux multijoueurs et auto-hébergement, à parcourir dans une console de jeu ou dans sa notice.`;

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s · ${SITE.name}`,
  },
  description: DESCRIPTION,
  applicationName: 'TS-27',
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE.name,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#211a28',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${display.variable} ${body.variable} ${pixel.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
