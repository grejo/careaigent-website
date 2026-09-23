import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Evaluatie',
  robots: { index: false, follow: false },
};

export default function EvaluatieLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="eval-page">
      <div className="eval-wrap">{children}</div>
    </div>
  );
}
