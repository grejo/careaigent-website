import Link from 'next/link';

export default function EvaluatieMelding({ titel, tekst }: { titel: string; tekst: string }) {
  return (
    <div className="eval-card">
      <div className="eval-kop">
        <div className="eval-eyebrow">Evaluatie</div>
        <h1>{titel}</h1>
        <p>{tekst}</p>
      </div>
      <p className="eval-hulp" style={{ marginTop: '16px' }}>
        Vragen? Mail naar <a href="mailto:joachim.gregoor@pxl.be" style={{ color: 'var(--teal)' }}>joachim.gregoor@pxl.be</a>.{' '}
        <Link href="/" style={{ color: 'var(--teal)' }}>Naar careaigent.be</Link>
      </p>
    </div>
  );
}
