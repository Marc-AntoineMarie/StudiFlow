import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import './globals.css';
import { SCRIPT_THEME_INLINE } from '@/lib/theme';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Studiflow',
  description: "Suivi intermittence et freelance pour monteur vidéo indépendant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Applique le thème mémorisé avant le premier paint : évite un flash du
            thème sombre par défaut si l'utilisateur avait choisi le clair. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME_INLINE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
