import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'CareAIgent', template: '%s · CareAIgent' },
  description: 'CareAIgent onderzoekt hoe AI de administratieve last voor zorgprofessionals in Vlaanderen kan verlichten.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
