import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onderzoeksresultaten AI in de Vlaamse Zorg — CareAIgent',
  description:
    'Bekijk de onderzoeksresultaten van CareAIgent. Eerste bevindingen over AI-gebruik en -behoeften in de Vlaamse zorgsector, gepresenteerd op de beurs van januari 2026.',
  keywords:
    'AI resultaten zorgsector, onderzoek AI zorg Vlaanderen, CareAIgent bevindingen, AI behoeften zorgprofessionals',
  openGraph: {
    type: 'article',
    url: 'https://careaigent.be/resultaten',
    title: 'Onderzoeksresultaten AI in de Vlaamse Zorg — CareAIgent',
    description:
      'Eerste bevindingen over AI-gebruik en -behoeften in de Vlaamse zorgsector vanuit het CareAIgent VLAIO TETRA-project.',
    siteName: 'CareAIgent',
    locale: 'nl_BE',
    images: [{ url: '/images/og-preview.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Onderzoeksresultaten AI in de Vlaamse Zorg — CareAIgent',
    description:
      'Eerste bevindingen over AI-gebruik en -behoeften in de Vlaamse zorgsector vanuit het CareAIgent VLAIO TETRA-project.',
    images: ['/images/og-preview.jpg'],
  },
  alternates: {
    canonical: 'https://careaigent.be/resultaten',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ScholarlyArticle',
  headline: 'AI in de Vlaamse Zorgsector — Bevraging Beurs Januari 2026',
  description:
    'Eerste resultaten van de CareAIgent-bevraging over AI-gebruik en -behoeften bij zorgprofessionals in Vlaanderen.',
  url: 'https://careaigent.be/resultaten',
  inLanguage: 'nl-BE',
  datePublished: '2026-01-01',
  publisher: {
    '@type': 'EducationalOrganization',
    name: 'PXL Zorginnovatie',
    url: 'https://www.pxl.be/',
  },
  isPartOf: {
    '@type': 'ResearchProject',
    name: 'CareAIgent',
    url: 'https://careaigent.be/',
  },
};

export default function ResultatenPage() {
  return (
    <>
      {/* JSON-LD structured data — static content, safe to inline */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <section
        className="hero"
        style={{
          minHeight: 'unset',
          padding: '140px 48px 80px',
          background: 'var(--navy)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="hero-inner" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div className="hero-label">Onderzoeksresultaten</div>
          <h1>
            Wat we <em>leren</em>
            <br />
            uit de praktijk
          </h1>
          <p className="hero-sub">
            Publicaties, bevragingen en analyses uit het CareAIgent TETRA-project. Klik op een
            resultaat om het te bekijken of te downloaden.
          </p>
        </div>
      </section>

      {/* RESULTATEN */}
      <div style={{ background: 'var(--navy-dark)' }}>
        <div className="results-section">

          {/* TIJDLIJN */}
          <div className="timeline">
            <div className="timeline-title">Publicaties</div>
            <div className="timeline-track">

              <div className="timeline-item active">
                <div className="timeline-dot"></div>
                <div className="timeline-card">
                  <span className="timeline-date">Januari 2026</span>
                  <h3>AI in de Vlaamse Zorgsector</h3>
                  <p>Bevraging bij 201 zorgprofessionals · Technologiebeurs</p>
                </div>
              </div>

              <div className="timeline-coming">
                Meer resultaten volgen in 2026 &amp; 2027 ·
              </div>
            </div>
          </div>

          {/* PDF VIEWER */}
          <div className="pdf-panel" id="pdfPanel">

            <div className="pdf-header">
              <div className="pdf-meta">
                <span className="pdf-date">Januari 2026 · Bevraging</span>
                <h2>AI in de Vlaamse Zorgsector</h2>
                <p>
                  Een bevraging bij 201 zorgprofessionals op de Technologiebeurs, januari 2026.
                  Inzichten over adoptie, bereidheid en drempels van AI in zorg.
                </p>
                <div className="pdf-tags">
                  <span className="pdf-tag">AI-adoptie</span>
                  <span className="pdf-tag">Zorgprofessionals</span>
                  <span className="pdf-tag">Vlaanderen</span>
                  <span className="pdf-tag">Technologiebeurs 2026</span>
                </div>
              </div>
              <div className="pdf-actions">
                <a
                  className="btn-download"
                  href="/bevraging-beurs-jan2026.pdf"
                  download="CareAIgent-bevraging-beurs-jan2026.pdf"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </a>
              </div>
            </div>

            <div className="pdf-stats">
              <div className="pdf-stat">
                <span className="num">201</span>
                <span className="lbl">Respondenten</span>
              </div>
              <div className="pdf-stat">
                <span className="num">35%</span>
                <span className="lbl">Gebruikt AI actief</span>
              </div>
              <div className="pdf-stat">
                <span className="num">88%</span>
                <span className="lbl">Wil AI gebruiken</span>
              </div>
              <div className="pdf-stat">
                <span className="num">65%</span>
                <span className="lbl">Ziet hoog potentieel</span>
              </div>
              <div className="pdf-stat">
                <span className="num">12</span>
                <span className="lbl">Bevindingen</span>
              </div>
            </div>

            <div className="pdf-viewer-wrap">
              <iframe
                src="/bevraging-beurs-jan2026.pdf#toolbar=1&navpanes=0"
                title="AI in de Vlaamse Zorgsector — CareAIgent"
              />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
