import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Théo Stoffelbach - Développeur Web",
  description:
    "Portfolio professionnel de Théo Stoffelbach, Développeur Web spécialisé en NodeJS et ReactJS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const darkMode = localStorage.getItem('darkMode') === 'true';
                if (darkMode) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-white dark:bg-gray-900">
        <Navbar />
        <main className="min-h-screen bg-github-gray-light dark:bg-gray-900">
          {children}
        </main>
      </body>
    </html>
  );
}
