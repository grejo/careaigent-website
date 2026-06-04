'use client';

import { useState, useEffect, useCallback } from 'react';

const linkedinIconPath =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z';

const downloadIconPath = [
  'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
  'M7 10 12 15 17 10',
  'M12 15 12 3',
];

type ResultItem =
  | {
      type: 'pdf';
      date: string;
      title: string;
      desc: string;
      tags: string[];
      pdf: string;
      download: string;
      stats: { num: string; lbl: string }[];
    }
  | {
      type: 'photos';
      date: string;
      title: string;
      desc: string;
      tags: string[];
      linkedin: string;
      photos: { src: string; caption: string }[];
    };

const resultData: Record<string, ResultItem> = {
  'bevraging-beurs': {
    type: 'pdf',
    date: 'Januari 2026 · Bevraging',
    title: 'AI in de Vlaamse Zorgsector',
    desc: 'Een bevraging bij 201 zorgprofessionals op de Technologiebeurs, januari 2026. Inzichten over adoptie, bereidheid en drempels van AI in zorg.',
    tags: ['AI-adoptie', 'Zorgprofessionals', 'Vlaanderen', 'Technologiebeurs 2026'],
    pdf: '/bevraging-beurs-jan2026.pdf',
    download: 'CareAIgent-bevraging-beurs-jan2026.pdf',
    stats: [
      { num: '201', lbl: 'Respondenten' },
      { num: '35%', lbl: 'Gebruikt AI actief' },
      { num: '88%', lbl: 'Wil AI gebruiken' },
      { num: '65%', lbl: 'Ziet hoog potentieel' },
      { num: '12', lbl: 'Bevindingen' },
    ],
  },
  'studiedag-mei': {
    type: 'photos',
    date: 'Mei 2026 · Studiedag',
    title: 'AI en technologie in de zorg',
    desc: 'Op 12 mei brachten CareAIgent en Zorgproeftuinen meer dan 80 zorgprofessionals, ontwikkelaars, beleidsmakers en onderzoekers samen in Bluepoint Antwerpen. Met keynotes van Dado Van Petegem, Simon Malfait en Scott Russell (Innatify).',
    tags: ['Studiedag', 'Bluepoint Antwerpen', '80+ deelnemers', '12 mei 2026'],
    linkedin: 'https://www.linkedin.com/feed/update/urn:li:activity:7460318196378697728',
    photos: [
      { src: '/images/studiedag-001.jpg', caption: 'Publiek tijdens de studiedag' },
      { src: '/images/studiedag-002.jpg', caption: 'Opening door de presentator' },
      { src: '/images/studiedag-003.jpg', caption: 'Introductiesessie in Bluepoint Antwerpen' },
      { src: '/images/studiedag-004.jpg', caption: 'Deelnemers tijdens de sessies' },
    ],
  },
};

const faqItems = [
  {
    question: 'Wat is CareAIgent?',
    answer:
      'CareAIgent is een praktijkgericht VLAIO TETRA-onderzoeksproject van Hogeschool PXL (PXL Zorginnovatie & PXL Smart ICT) dat loopt van 2025 tot 2027. We onderzoeken hoe bestaande AI-oplossingen de administratieve lasten in de zorg kunnen verlagen — via co-creatie met zorginstellingen en technologiebedrijven in Vlaanderen.',
  },
  {
    question: 'Welke AI-toepassingen worden onderzocht?',
    answer:
      'CareAIgent focust op concrete AI-toepassingen die de dagelijkse zorgpraktijk verlichten: automatische spraakherkenning voor zorgverslaggeving, AI-gestuurde dossierverwerking, slimme planningssystemen en beslissingsondersteuning. We testen en valideren deze oplossingen in echte zorgomgevingen — ziekenhuizen, thuiszorg en woonzorgcentra in Vlaanderen.',
  },
  {
    question: 'Wat zijn de eerste resultaten van het onderzoek?',
    answer:
      'In januari 2026 bevroegen we 201 zorgprofessionals op de Technologiebeurs in Hasselt. De resultaten zijn duidelijk: 88% wil AI actief inzetten in hun werk, 65% ziet een hoog potentieel voor AI in de zorg, maar slechts 35% gebruikt het vandaag al. De grootste drempels zijn een gebrek aan kennis, vertrouwen en implementatieondersteuning.',
  },
  {
    question: 'Kan mijn organisatie deelnemen aan CareAIgent?',
    answer:
      'Ja. CareAIgent is opgezet als een open co-creatieproject. Zorginstellingen (ziekenhuizen, thuiszorgorganisaties, woonzorgcentra) en technologiebedrijven die actief zijn in de Vlaamse zorgsector kunnen aansluiten als partner. Neem contact op via Eric.Lodewyckx@PXL.BE voor meer informatie.',
  },
  {
    question: 'Hoe verschilt CareAIgent van andere AI-initiatieven in de zorg?',
    answer:
      'CareAIgent is geen theoretisch onderzoek — we werken uitsluitend met bestaande, bewezen AI-technologie en testen die in echte zorgcontexten. De nadruk ligt op bruikbaarheid, veiligheid en het betrekken van zorgprofessionals bij elke stap. Zo wordt zorgadministratie automatiseren geen technologisch experiment, maar een gedragen verandering van onderuit.',
  },
];

function Modal({
  itemId,
  onClose,
}: {
  itemId: string | null;
  onClose: () => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const data = itemId ? resultData[itemId] : null;

  const showPhoto = useCallback(
    (idx: number) => {
      if (data?.type !== 'photos') return;
      setPhotoIndex((idx + data.photos.length) % data.photos.length);
    },
    [data]
  );

  useEffect(() => {
    setPhotoIndex(0);
  }, [itemId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!data) return;
      if (e.key === 'Escape') onClose();
      if (data.type === 'photos') {
        if (e.key === 'ArrowRight') showPhoto(photoIndex + 1);
        if (e.key === 'ArrowLeft') showPhoto(photoIndex - 1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [data, onClose, photoIndex, showPhoto]);

  useEffect(() => {
    if (itemId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [itemId]);

  if (!data) return null;

  const currentPhoto = data.type === 'photos' ? data.photos[photoIndex] : null;

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-meta">
            <span className="pdf-date">{data.date}</span>
            <h2>{data.title}</h2>
            <p>{data.desc}</p>
            <div className="pdf-tags">
              {data.tags.map((tag) => (
                <span key={tag} className="pdf-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="modal-header-actions">
            {data.type === 'pdf' && (
              <a
                className="btn-download"
                href={data.pdf}
                download={data.download}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={downloadIconPath[0]} />
                  <polyline points={downloadIconPath[1]} />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </a>
            )}
            {data.type === 'photos' && data.linkedin && (
              <a
                className="btn-linkedin"
                href={data.linkedin}
                target="_blank"
                rel="noopener"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d={linkedinIconPath} />
                </svg>
                LinkedIn
              </a>
            )}
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Sluiten"
            >
              &#x2715;
            </button>
          </div>
        </div>

        <div className="modal-body">
          {data.type === 'pdf' && (
            <div>
              <div className="pdf-stats">
                {data.stats.map((s) => (
                  <div key={s.lbl} className="pdf-stat">
                    <span className="num">{s.num}</span>
                    <span className="lbl">{s.lbl}</span>
                  </div>
                ))}
              </div>
              <div className="pdf-viewer-wrap">
                <iframe
                  src={`${data.pdf}#toolbar=1&navpanes=0`}
                  title="Document"
                  style={{ width: '100%', height: '72vh', minHeight: '500px', border: 'none', display: 'block' }}
                />
              </div>
            </div>
          )}

          {data.type === 'photos' && currentPhoto && (
            <div>
              <div className="gallery-main">
                <img src={currentPhoto.src} alt={currentPhoto.caption} />
                <button
                  className="gallery-arrow prev"
                  onClick={() => showPhoto(photoIndex - 1)}
                  aria-label="Vorige foto"
                >
                  &#8592;
                </button>
                <button
                  className="gallery-arrow next"
                  onClick={() => showPhoto(photoIndex + 1)}
                  aria-label="Volgende foto"
                >
                  &#8594;
                </button>
              </div>
              <p className="gallery-caption">{currentPhoto.caption}</p>
              <div className="gallery-thumbs">
                {data.photos.map((p, i) => (
                  <div
                    key={i}
                    className={`gallery-thumb${i === photoIndex ? ' active' : ''}`}
                    onClick={() => showPhoto(i)}
                  >
                    <img src={p.src} alt={p.caption} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FaqAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(33,154,189,0.2)',
        borderRadius: '12px',
        padding: '24px 28px',
        cursor: 'pointer',
      }}
      onClick={() => setOpen((o) => !o)}
    >
      <div
        style={{
          fontFamily: "'Raleway',sans-serif",
          fontWeight: 700,
          fontSize: '17px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span>{question}</span>
        <span style={{ color: 'var(--teal-light)', fontSize: '20px', flexShrink: 0 }}>
          {open ? '−' : '+'}
        </span>
      </div>
      {open && (
        <p
          style={{
            marginTop: '16px',
            fontSize: '15px',
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.8,
          }}
        >
          {answer}
        </p>
      )}
    </div>
  );
}

export default function ResultatenPage() {
  const [modalId, setModalId] = useState<string | null>(null);

  const openModal = (id: string) => setModalId(id);
  const closeModal = () => setModalId(null);

  // Handle hash-based deep-linking on initial load
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && resultData[hash]) {
      setModalId(hash);
    }
  }, []);

  return (
    <>
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
            Publicaties, bevragingen en analyses over AI in de zorg — uit het CareAIgent VLAIO TETRA-project. Klik op een resultaat om het te bekijken of te downloaden.
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

              <div
                className="timeline-item"
                onClick={() => openModal('bevraging-beurs')}
                style={{ cursor: 'pointer' }}
              >
                <div className="timeline-dot"></div>
                <div className="timeline-card">
                  <span className="timeline-date">Januari 2026</span>
                  <h3>AI in de Vlaamse Zorgsector</h3>
                  <p>Bevraging bij 201 zorgprofessionals · Technologiebeurs</p>
                  <span className="timeline-hint">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Klik voor meer info
                  </span>
                </div>
              </div>

              <div
                className="timeline-item"
                id="studiedag-mei"
                onClick={() => openModal('studiedag-mei')}
                style={{ cursor: 'pointer' }}
              >
                <div className="timeline-dot"></div>
                <div className="timeline-card">
                  <span className="timeline-date">Mei 2026</span>
                  <h3>Studiedag AI en technologie in de zorg</h3>
                  <p>80+ deelnemers · Bluepoint Antwerpen · 12 mei 2026</p>
                  <span className="timeline-hint">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Klik voor meer info
                  </span>
                </div>
              </div>

              <div className="timeline-coming">
                Meer resultaten volgen in 2026 &amp; 2027 ·
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tekstsamenvatting bevindingen — crawlbaar voor zoekmachines */}
      <section style={{ background: 'var(--navy)', padding: '64px 48px 80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal-light)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-block', width: '24px', height: '2px', background: 'var(--teal)' }}></span>
            Samenvatting bevindingen
          </div>
          <h2 style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 900, fontSize: 'clamp(24px,3vw,36px)', color: '#fff', marginBottom: '24px', lineHeight: 1.2 }}>
            AI in de Vlaamse zorgsector: wat leren 201 zorgprofessionals ons?
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '20px' }}>
            In januari 2026 voerde CareAIgent een grootschalige bevraging uit op de Technologiebeurs in Hasselt. In totaal namen 201 zorgprofessionals deel — verpleegkundigen, artsen, zorgcoördinatoren en beleidsmakers uit ziekenhuizen, thuiszorgorganisaties en woonzorgcentra in Vlaanderen.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '32px' }}>
            De bevraging peilde naar het huidige gebruik van AI in de zorg, de bereidheid om AI in te zetten, en de drempels die zorgprofessionals ervaren bij <strong>het automatiseren van zorgadministratie</strong> via AI-oplossingen.
          </p>
          <h3 style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '20px' }}>Belangrijkste bevindingen</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { num: '88%', text: 'van de bevraagde zorgprofessionals wil AI actief inzetten in hun dagelijkse praktijk. De bereidheid is groot — maar de stap naar implementatie wordt nog zelden gezet.' },
              { num: '65%', text: 'ziet een hoog potentieel voor AI-oplossingen in de zorg — met name voor automatische verslaggeving, dossierverwerking en planningsondersteuning.' },
              { num: '35%', text: 'gebruikt AI vandaag al actief op de werkvloer. Het potentieel van AI in de zorg is dus grotendeels onbenut — een belangrijke vaststelling voor zorginnovatie in Vlaanderen.' },
              { num: '201', text: 'zorgprofessionals namen deel aan de bevraging, waaruit 12 concrete bevindingen voortkwamen over AI-adoptie, drempels en behoeften in de Vlaamse zorgsector.' },
            ].map(({ num, text }) => (
              <div key={num} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(33,154,189,0.15)', borderRadius: '12px', padding: '20px 24px' }}>
                <div style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 900, fontSize: '28px', color: 'var(--teal-light)', marginBottom: '6px' }}>{num}</div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{text}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>
            De grootste drempels voor het gebruik van AI in ziekenhuizen en zorgorganisaties zijn: gebrek aan kennis over beschikbare tools, onvoldoende vertrouwen in AI-systemen, en een tekort aan begeleiding bij implementatie. CareAIgent werkt via co-creatietrajecten aan oplossingen voor elk van deze drempels — samen met zorgprofessionals, technologiebedrijven en beleidsmakers.
          </p>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section style={{ padding: '80px 48px', background: 'var(--navy-dark)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--teal-light)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-block', width: '24px', height: '2px', background: 'var(--teal)' }}></span>
            Veelgestelde vragen
          </div>
          <h2 style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 900, fontSize: 'clamp(28px,4vw,48px)', color: '#fff', marginBottom: '48px', lineHeight: 1.1 }}>
            Alles over <em style={{ fontStyle: 'normal', color: 'var(--teal-light)' }}>CareAIgent</em>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqItems.map((item) => (
              <FaqAccordion key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* MODAL */}
      {modalId && <Modal itemId={modalId} onClose={closeModal} />}
    </>
  );
}
