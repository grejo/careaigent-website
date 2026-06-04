import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://careaigent.be'),
  title: { default: 'CareAIgent', template: '%s · CareAIgent' },
  description:
    'CareAIgent onderzoekt hoe AI de administratieve last voor zorgprofessionals in Vlaanderen kan verlichten.',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/png" href="/images/favicon.png" />
        <link rel="apple-touch-icon" href="/images/apple-touch-icon.png" />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
