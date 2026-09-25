import { bepaalToegang } from '@/lib/evaluatie/opslag';
import { datumLabel, TOEGANG_MELDING } from '@/lib/evaluatie/weergave';
import EvaluatieWizard from '@/components/evaluatie/EvaluatieWizard';
import EvaluatieMelding from '@/components/evaluatie/EvaluatieMelding';

export const dynamic = 'force-dynamic';

export default async function PersoonlijkeEvaluatiePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const toegang = await bepaalToegang({ token });
  if (!toegang.ok) return <EvaluatieMelding {...TOEGANG_MELDING[toegang.reden]} />;
  const a = toegang.activiteit;
  return (
    <EvaluatieWizard
      activiteit={{ id: a.id, title: a.title, datum: datumLabel(a.dateStart) }}
      token={token}
      editie={null}
      test={toegang.isTest}
    />
  );
}
