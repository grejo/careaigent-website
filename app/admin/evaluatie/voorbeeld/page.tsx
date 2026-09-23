import Link from 'next/link';
import { prisma } from '@/lib/db';
import { datumLabel } from '@/lib/evaluatie/weergave';
import EvaluatieWizard from '@/components/evaluatie/EvaluatieWizard';

export const dynamic = 'force-dynamic';

/** Het evaluatieformulier bekijken zoals deelnemers het zien, zonder iets op te slaan. */
export default async function EvaluatieVoorbeeldPage({ searchParams }: { searchParams: Promise<{ activiteit?: string }> }) {
  const { activiteit } = await searchParams;
  const a = activiteit
    ? await prisma.activity.findUnique({ where: { id: activiteit }, select: { id: true, title: true, dateStart: true } })
    : null;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <Link href={`/admin/evaluatie${a ? `?activiteit=${a.id}` : ''}`} style={{ color: 'var(--teal)', textDecoration: 'none', fontSize: '0.875rem' }}>
            ← Resultaten evaluatie
          </Link>
          <h1 style={{ color: 'var(--navy)', marginTop: '8px' }}>Evaluatieformulier bekijken</h1>
        </div>
      </div>
      <div className="eval-wrap">
        <EvaluatieWizard
          activiteit={
            a
              ? { id: a.id, title: a.title, datum: datumLabel(a.dateStart) }
              : { id: 'voorbeeld', title: 'Train de Trainer: AI-Ambassadeur in de Zorg', datum: 'voorbeeld' }
          }
          token={null}
          editie={null}
          voorbeeld
        />
      </div>
    </div>
  );
}
