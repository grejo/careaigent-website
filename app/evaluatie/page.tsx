import Link from 'next/link';
import { prisma } from '@/lib/db';
import { bepaalToegang } from '@/lib/evaluatie/opslag';
import { datumLabel, TOEGANG_MELDING } from '@/lib/evaluatie/weergave';
import EvaluatieWizard from '@/components/evaluatie/EvaluatieWizard';
import EvaluatieMelding from '@/components/evaluatie/EvaluatieMelding';

export const dynamic = 'force-dynamic';

export default async function EvaluatiePage({ searchParams }: { searchParams: Promise<{ editie?: string }> }) {
  const { editie } = await searchParams;

  if (editie) {
    const toegang = await bepaalToegang({ editie });
    if (!toegang.ok) return <EvaluatieMelding {...TOEGANG_MELDING[toegang.reden]} />;
    const a = toegang.activiteit;
    return (
      <EvaluatieWizard
        activiteit={{ id: a.id, title: a.title, datum: datumLabel(a.dateStart) }}
        token={null}
        editie={a.slug}
      />
    );
  }

  // Geen editie in de link: kies uit de evaluaties met een algemene link.
  const open = await prisma.activity.findMany({
    where: { evaluatieOpen: true, evaluatieOpenLink: true },
    orderBy: { dateStart: 'desc' },
    select: { slug: true, title: true, dateStart: true },
  });

  if (open.length === 0) {
    return (
      <EvaluatieMelding
        titel="Geen open evaluaties"
        tekst="Er staan momenteel geen evaluaties open. Heb je een mail met een persoonlijke link gekregen? Gebruik dan die link."
      />
    );
  }

  return (
    <div className="eval-card">
      <div className="eval-kop">
        <div className="eval-eyebrow">Evaluatie</div>
        <h1>Welke sessie volgde je?</h1>
        <p>Kies de opleiding die je wil evalueren.</p>
      </div>
      <div className="eval-opties">
        {open.map((a) => (
          <Link key={a.slug} href={`/evaluatie?editie=${encodeURIComponent(a.slug)}`} className="eval-optie" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span>
              <strong>{a.title}</strong>
              <br />
              <span style={{ color: 'var(--text-mid)', fontSize: '0.9rem' }}>{datumLabel(a.dateStart)}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
