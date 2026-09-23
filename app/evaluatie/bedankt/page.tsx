'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ALLE_VRAGEN } from '@/lib/evaluatie/formulierA';
import { RESULTAAT_KEY } from '@/components/evaluatie/EvaluatieWizard';

type Resultaat = {
  kennisScore: number | null;
  feedback: { id: string; gegeven: string | null; correct: boolean; juisteAntwoord: string }[];
  activiteit: string;
};

export default function BedanktPage() {
  const [resultaat, setResultaat] = useState<Resultaat | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESULTAAT_KEY);
      if (raw) setResultaat(JSON.parse(raw));
    } catch {
      // geen resultaat beschikbaar: enkel de dankjewel tonen
    }
  }, []);

  const vraagTekst = (id: string) => ALLE_VRAGEN.find((v) => v.id === id)?.tekst ?? id;

  return (
    <div className="eval-card">
      <div className="eval-kop">
        <div className="eval-eyebrow">Evaluatie verzonden</div>
        <h1>Bedankt!</h1>
        <p>
          Je antwoorden zijn goed ontvangen{resultaat?.activiteit ? ` voor ${resultaat.activiteit}` : ''}. Ze helpen ons
          de opleiding AI-Ambassadeur in de Zorg verder te verbeteren.
        </p>
      </div>

      {resultaat && resultaat.kennisScore !== null && (
        <div style={{ marginTop: '20px' }}>
          <h2 className="eval-sectie-titel">Kennischeck: {resultaat.kennisScore} op 3</h2>
          <ul className="eval-resultaat">
            {resultaat.feedback.map((f) => (
              <li key={f.id} className={f.gegeven ? (f.correct ? 'juist' : 'fout') : undefined}>
                <strong>{vraagTekst(f.id)}</strong>
                <br />
                {f.gegeven ? (
                  f.correct ? (
                    <>✓ Juist: {f.juisteAntwoord}</>
                  ) : (
                    <>
                      Jouw antwoord: {f.gegeven}
                      <br />✓ Juist antwoord: {f.juisteAntwoord}
                    </>
                  )
                ) : (
                  <>Niet beantwoord. Juist antwoord: {f.juisteAntwoord}</>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="eval-instructie" style={{ marginTop: '24px' }}>
        <strong>Blijf in contact met andere AI-ambassadeurs.</strong> Interesse in de peer learning community of het
        vervolgtraject? Laat het weten via{' '}
        <a href="mailto:joachim.gregoor@pxl.be" style={{ color: 'var(--teal)' }}>joachim.gregoor@pxl.be</a> of volg de
        nieuwe activiteiten op de <Link href="/agenda" style={{ color: 'var(--teal)' }}>agenda</Link>.
      </div>
    </div>
  );
}
