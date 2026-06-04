import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Bedankt voor uw bericht',
  robots: { index: false, follow: false },
};

export default function BedanktPage() {
  return (
    <section
      style={{
        padding: '80px 20px',
        textAlign: 'center',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--navy)',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
        <h1
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 900,
            fontSize: 'clamp(28px, 5vw, 44px)',
            letterSpacing: '-1px',
            marginBottom: '16px',
            color: '#fff',
          }}
        >
          Bericht <span style={{ color: 'var(--teal-light)' }}>ontvangen!</span>
        </h1>
        <p
          style={{
            fontSize: '17px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.7,
            maxWidth: '480px',
            margin: '0 auto 40px',
          }}
        >
          Bedankt voor uw bericht. Het CareAIgent-team neemt zo snel mogelijk contact met u op.
        </p>
        <Link href="/" className="btn-primary">
          ← Terug naar de website
        </Link>
      </div>
    </section>
  );
}
