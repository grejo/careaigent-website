import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ons Team — CareAIgent',
  description:
    'Maak kennis met het CareAIgent-team van PXL Zorginnovatie: de onderzoekers en experten die werken aan AI-oplossingen voor de Vlaamse zorgsector.',
  keywords:
    'CareAIgent team, PXL Zorginnovatie onderzoekers, AI zorg team, Eric Lodewyckx, Isabel Kortleven, Tom Hermans, Robin Schrijvers, Lotte Smeets, Joachim Gregoor',
  openGraph: {
    type: 'website',
    url: 'https://careaigent.be/team',
    title: 'Ons Team — CareAIgent',
    description:
      'Maak kennis met het CareAIgent-team van PXL Zorginnovatie: de onderzoekers en experten die werken aan AI-oplossingen voor de Vlaamse zorgsector.',
    siteName: 'CareAIgent',
    locale: 'nl_BE',
    images: [{ url: '/images/og-preview.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ons Team — CareAIgent',
    description: 'Maak kennis met het CareAIgent-team van PXL Zorginnovatie.',
    images: ['/images/og-preview.jpg'],
  },
  alternates: {
    canonical: 'https://careaigent.be/team',
  },
};

const linkedinIconPath =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

function LinkedInButton({ href }: { href: string }) {
  return (
    <a className="linkedin-btn" href={href} target="_blank" rel="noopener">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d={linkedinIconPath} />
      </svg>
      LinkedIn
    </a>
  );
}

export default function TeamPage() {
  return (
    <>
      {/* HERO */}
      <section className="hero" style={{ minHeight: 'unset', padding: '130px 48px 80px' }}>
        <div className="hero-inner" style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="hero-badge">CareAIgent · PXL Zorginnovatie</div>
          <h1>
            Ons <em>team</em>
          </h1>
          <p className="hero-sub">
            De mensen achter CareAIgent — onderzoekers en experten die samenwerken aan
            AI-oplossingen voor de Vlaamse zorgsector.
          </p>
        </div>
      </section>

      {/* TEAM GRID */}
      <section style={{ background: 'var(--off-white)', padding: '80px 48px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', maxWidth: '1100px', margin: '0 auto' }}>

          {/* Eric Lodewyckx */}
          <div className="team-card">
            <div className="team-avatar">EL</div>
            <div className="team-name">Eric Lodewyckx</div>
            <div className="team-role">Projectleider · PXL Zorginnovatie</div>
            <LinkedInButton href="https://www.linkedin.com/in/eric-lodewyckx/" />
          </div>

          {/* Isabel Kortleven */}
          <div className="team-card">
            <div className="team-avatar">IK</div>
            <div className="team-name">Isabel Kortleven</div>
            <div className="team-role">Onderzoeker · PXL Zorginnovatie</div>
            <LinkedInButton href="https://www.linkedin.com/in/isabel-kortleven-8817436/" />
          </div>

          {/* Tom Hermans */}
          <div className="team-card">
            <div className="team-avatar">TH</div>
            <div className="team-name">Tom Hermans</div>
            <div className="team-role">Onderzoeker · PXL Zorginnovatie</div>
            <LinkedInButton href="https://www.linkedin.com/in/tom-hermans/" />
          </div>

          {/* Robin Schrijvers */}
          <div className="team-card">
            <div className="team-avatar">RS</div>
            <div className="team-name">Robin Schrijvers</div>
            <div className="team-role">AI-onderzoeker · PXL Smart ICT</div>
            <LinkedInButton href="https://www.linkedin.com/in/robin-schrijvers-498b27b8/" />
          </div>

          {/* Lotte Smeets */}
          <div className="team-card">
            <div className="team-avatar">LS</div>
            <div className="team-name">Lotte Smeets</div>
            <div className="team-role">Onderzoeker · PXL Zorginnovatie</div>
            <LinkedInButton href="https://www.linkedin.com/in/lotte-smeets-409317185/" />
          </div>

          {/* Joachim Gregoor */}
          <div className="team-card">
            <div className="team-avatar">JG</div>
            <div className="team-name">Joachim Gregoor</div>
            <div className="team-role">E-learning &amp; Digitale Innovatie · PXL</div>
            <LinkedInButton href="https://be.linkedin.com/in/joachimgregoor" />
          </div>

        </div>
      </section>
    </>
  );
}
