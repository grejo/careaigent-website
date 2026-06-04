import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'CareAIgent — AI voor Slimmere Zorg in Vlaanderen',
  description:
    'CareAIgent onderzoekt hoe AI de administratieve last voor zorgprofessionals in Vlaanderen kan verlichten. Een VLAIO TETRA-project van PXL Zorginnovatie samen met zorginstellingen en technologiebedrijven.',
  keywords:
    'AI zorg Vlaanderen, kunstmatige intelligentie zorgsector, administratieve last zorgprofessionals, VLAIO TETRA, PXL Zorginnovatie, CareAIgent, AI zorgverleners',
  openGraph: {
    type: 'website',
    url: 'https://careaigent.be/',
    title: 'CareAIgent — AI voor Slimmere Zorg in Vlaanderen',
    description:
      'CareAIgent onderzoekt hoe AI de administratieve last voor zorgprofessionals in Vlaanderen kan verlichten. Praktijkgericht onderzoek via co-creatie met zorginstellingen en technologiebedrijven.',
    siteName: 'CareAIgent',
    locale: 'nl_BE',
    images: [{ url: '/images/og-preview.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareAIgent — AI voor Slimmere Zorg in Vlaanderen',
    description:
      'CareAIgent onderzoekt hoe AI de administratieve last voor zorgprofessionals in Vlaanderen kan verlichten.',
    images: ['/images/og-preview.jpg'],
  },
  alternates: {
    canonical: 'https://careaigent.be/',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ResearchProject',
  name: 'CareAIgent',
  url: 'https://careaigent.be/',
  description:
    'CareAIgent onderzoekt hoe bestaande AI-oplossingen de administratieve last voor zorgprofessionals concreet kunnen verlichten via praktijkgericht onderzoek en co-creatie met zorginstellingen en technologiebedrijven.',
  keywords: 'AI, zorg, Vlaanderen, administratie, PXL, VLAIO',
  inLanguage: 'nl-BE',
  funder: {
    '@type': 'Organization',
    name: 'VLAIO',
    url: 'https://www.vlaio.be/',
  },
  sourceOrganization: {
    '@type': 'EducationalOrganization',
    name: 'PXL Zorginnovatie',
    url: 'https://www.pxl.be/',
    sameAs: 'https://www.linkedin.com/company/careaigent/',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'eric.lodewyckx@pxl.be',
    contactType: 'projectleider',
  },
};

export default function HomePage() {
  return (
    <>
      {/* JSON-LD structured data — static content, safe to inline */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-grid-overlay"></div>

        <div className="hero-content">
          <div className="hero-badge">VLAIO TETRA-project · PXL Zorginnovatie</div>
          <h1>
            Minder admin.
            <br />
            <em>Meer zorg.</em>
          </h1>
          <p className="hero-sub">
            CareAIgent onderzoekt hoe bestaande AI-oplossingen de administratieve last voor
            zorgprofessionals concreet kunnen verlichten — via praktijkgericht onderzoek en
            co-creatie met zorginstellingen en technologiebedrijven.
          </p>
          <div className="hero-actions">
            <a href="#contact" className="btn-primary">
              Contacteer ons
            </a>
            <a href="#aanpak" className="btn-outline">
              Hoe werkt het? →
            </a>
          </div>
          <div className="vlaio-badge">
            <strong>VLAIO</strong> TETRA-project · 2025–2027 · Hogeschool PXL
          </div>
        </div>

        <div className="hero-visual">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img
              src="/images/index-002.jpg"
              alt="CareAIgent onderzoeksproject — AI-oplossingen voor minder administratie in de zorg"
              style={{
                width: '140px',
                height: '140px',
                objectFit: 'cover',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            />
          </div>
          <a className="float-card" href="/resultaten#bevraging-beurs">
            <div className="float-card-label">Bevraging 2026 · 201 zorgprofessionals</div>
            <div className="float-card-title">88% wil AI inzetten</div>
            <div className="float-card-text">
              De grote meerderheid van zorgprofessionals wil AI actief gebruiken in hun dagelijkse praktijk
            </div>
            <div className="float-card-stat">
              <div className="stat-number">88%</div>
              <div className="stat-label">wil AI gebruiken</div>
            </div>
          </a>
          <a className="float-card" href="/resultaten#bevraging-beurs">
            <div className="float-card-label">Bevraging 2026 · 201 zorgprofessionals</div>
            <div className="float-card-title">65% ziet hoog potentieel</div>
            <div className="float-card-text">
              Twee op drie zorgprofessionals gelooft dat AI een grote rol kan spelen in hun werk
            </div>
            <div className="float-card-stat">
              <div className="stat-number">65%</div>
              <div className="stat-label">ziet hoog potentieel</div>
            </div>
          </a>
          <a className="float-card" href="/resultaten#bevraging-beurs">
            <div className="float-card-label">Bevraging 2026 · 201 zorgprofessionals</div>
            <div className="float-card-title">Slechts 35% gebruikt AI vandaag</div>
            <div className="float-card-text">
              Het potentieel is grotendeels onbenut — kennis en implementatieondersteuning ontbreken
            </div>
            <div className="float-card-stat">
              <div className="stat-number">35%</div>
              <div className="stat-label">gebruikt AI actief</div>
            </div>
          </a>
        </div>
      </section>

      {/* PROBLEEM SECTION */}
      <section className="problem-section" id="probleem">
        <div className="section-label">Het probleem</div>
        <h2 className="section-title">Zorgprofessionals verdrinken in administratie</h2>
        <p className="section-sub">
          Zorgverleners spenderen gemiddeld 30 tot 50% van hun werktijd aan administratieve taken.
          Dat is tijd die niet naar patiënten gaat — en het leidt tot burn-out, fouten en
          frustratie.
        </p>

        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-icon">📋</div>
            <h3>Overladen rapportage</h3>
            <p>
              Handmatige verslaglegging, dubbele invoer en complexe zorddossiers vreten kostbare
              tijd die zorgprofessionals beter aan patiënten besteden.
            </p>
          </div>
          <div className="problem-card">
            <div className="problem-icon">🔄</div>
            <h3>Gefragmenteerde systemen</h3>
            <p>
              Meerdere softwaresystemen die niet met elkaar praten, verplichten medewerkers tot
              herhaalde manuele handelingen en vergroot de kans op fouten.
            </p>
          </div>
          <div className="problem-card">
            <div className="problem-icon">🤖</div>
            <h3>AI-potentieel onbenut</h3>
            <p>
              Tal van AI-oplossingen bestaan al, maar worden nauwelijks ingezet in de dagelijkse
              zorgpraktijk. Kennis, vertrouwen en implementatieondersteuning ontbreken.
            </p>
          </div>
        </div>
      </section>

      {/* AANPAK SECTION */}
      <section id="aanpak">
        <div className="section-label">Onze aanpak</div>
        <div className="approach-grid">
          <div>
            <h2 className="section-title">Praktijkgericht onderzoek &amp; co-creatie</h2>
            <p className="section-sub">
              CareAIgent brengt zorginstellingen en technologiebedrijven samen om AI-oplossingen te
              testen, valideren en implementeren in echte zorgcontexten.
            </p>

            <div className="approach-steps">
              <div className="approach-step">
                <div className="step-number">01</div>
                <div className="step-content">
                  <h4>Behoeftenanalyse</h4>
                  <p>
                    We brengen de concrete administratieve pijnpunten bij zorgprofessionals in kaart
                    via focusgroepen en observaties.
                  </p>
                </div>
              </div>
              <div className="approach-step">
                <div className="step-number">02</div>
                <div className="step-content">
                  <h4>Co-creatie met technologiepartners</h4>
                  <p>
                    Zorginstellingen en techbedrijven ontwikkelen samen AI-oplossingen die écht
                    aansluiten op de werkpraktijk.
                  </p>
                </div>
              </div>
              <div className="approach-step">
                <div className="step-number">03</div>
                <div className="step-content">
                  <h4>Piloot in zorgomgevingen</h4>
                  <p>
                    Oplossingen worden getest en geëvalueerd in reële zorgsettings — met begeleiding
                    van PXL-onderzoekers.
                  </p>
                </div>
              </div>
              <div className="approach-step">
                <div className="step-number">04</div>
                <div className="step-content">
                  <h4>Kennisdisseminatie</h4>
                  <p>
                    Resultaten worden breed gedeeld via publicaties, congressen en een
                    technologiebeurs — zodat de hele sector er van leert.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="approach-visual">
            <div className="section-label" style={{ marginBottom: '28px' }}>
              Projectcijfers
            </div>
            <div className="approach-stat-grid">
              <div className="approach-stat">
                <div className="big-num">2</div>
                <div className="num-label">
                  jaar onderzoek
                  <br />
                  2025–2027
                </div>
              </div>
              <div className="approach-stat">
                <div className="big-num">3+</div>
                <div className="num-label">
                  piloot­omgevingen
                  <br />
                  in de zorg
                </div>
              </div>
              <div className="approach-stat">
                <div className="big-num">2×</div>
                <div className="num-label">
                  overlegmomenten
                  <br />
                  per jaar
                </div>
              </div>
              <div className="approach-stat">
                <div className="big-num">∞</div>
                <div className="num-label">
                  kennisdeling
                  <br />
                  via events &amp; publicaties
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Missie & Visie — SEO tekstblok */}
        <div style={{ maxWidth: '760px', margin: '64px auto 0', paddingTop: '48px', borderTop: '1px solid rgba(33,154,189,0.15)' }}>
          <h2 style={{ fontFamily: "'Raleway',sans-serif", fontWeight: 900, fontSize: 'clamp(22px,3vw,32px)', color: '#fff', marginBottom: '20px', lineHeight: 1.2 }}>
            Onze missie: AI in de zorg concreet en bruikbaar maken
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '16px' }}>
            CareAIgent gelooft dat <strong>AI in de zorg</strong> een fundamentele rol kan spelen in het verlichten van administratieve lasten — maar enkel als het op een mensgerichte, praktijkgerichte manier wordt ingezet. Zorgprofessionals verdienen tools die écht werken in hun dagelijkse context.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, marginBottom: '16px' }}>
            Via <strong>PXL Zorginnovatie in Vlaanderen</strong> willen we de kloof overbruggen tussen de beschikbare AI-technologie en de concrete noden van zorgverleners. Denk aan automatische spraakherkenning voor verslaggeving, slimme planningssystemen en AI-gestuurde dossierverwerking — oplossingen die <strong>administratieve lasten in de zorg verlagen</strong> zonder de menselijke factor te verliezen.
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
            Ons VLAIO TETRA-project loopt van 2025 tot 2027 en brengt zorginstellingen en technologiebedrijven samen in co-creatietrajecten. Zo zorgen we ervoor dat <strong>AI-oplossingen voor ziekenhuizen en zorgorganisaties</strong> niet in een lab worden ontwikkeld, maar samen met de mensen die ze dagelijks zullen gebruiken.
          </p>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="partners-section" id="partners">
        <div className="section-label">Begeleidingsgroep</div>
        <h2 className="section-title">Gedragen door de sector</h2>
        <p className="section-sub" style={{ margin: '0 auto 48px' }}>
          CareAIgent wordt mogelijk gemaakt door een breed netwerk van zorgorganisaties,
          technologiebedrijven en kennisinstellingen.
        </p>

        {/* Zorgorganisaties */}
        <div className="partner-category">
          <div className="partner-category-label">
            <span className="partner-cat-icon">🏥</span> Zorgorganisaties
          </div>
          <div className="partner-logo-grid">
            <a className="partner-name-card" href="https://www.sfz.be" target="_blank" rel="noopener">Sint-Franciscusziekenhuis</a>
            <a className="partner-name-card" href="https://www.azgroeninge.be" target="_blank" rel="noopener">AZ Groeninge</a>
            <a className="partner-name-card" href="https://www.azvoorkempen.be" target="_blank" rel="noopener">AZ Voorkempen (Emmaus)</a>
            <a className="partner-name-card" href="https://www.mariamiddelares.be" target="_blank" rel="noopener">Maria Middelares</a>
            <a className="partner-name-card" href="https://www.azoostende.be" target="_blank" rel="noopener">AZ Oostende</a>
            <a className="partner-name-card" href="https://iglimburg.be" target="_blank" rel="noopener">IGL Ter Heide</a>
            <a className="partner-name-card" href="https://www.mintus.be" target="_blank" rel="noopener">Mintus</a>
            <a className="partner-name-card" href="https://www.witgelekruis.be" target="_blank" rel="noopener">WGK (Wit-Gele Kruis)</a>
            <a className="partner-name-card" href="https://www.fiolavzw.be" target="_blank" rel="noopener">Fiola</a>
            <a className="partner-name-card" href="https://www.arum.be" target="_blank" rel="noopener">Arum</a>
            <a className="partner-name-card" href="https://www.zuidwestlimburg.be" target="_blank" rel="noopener">Hulpverleningszone Zuidwest Limburg</a>
            <a className="partner-name-card" href="https://www.jessazh.be" target="_blank" rel="noopener">Jessa Ziekenhuis</a>
            <a className="partner-name-card" href="https://www.sint-trudo.be" target="_blank" rel="noopener">St. Trudo Ziekenhuis</a>
          </div>
        </div>

        {/* Technologieorganisaties */}
        <div className="partner-category">
          <div className="partner-category-label">
            <span className="partner-cat-icon">💻</span> Technologieorganisaties
          </div>
          <div className="partner-logo-grid">
            <a className="partner-name-card" href="https://www.salesnote.be" target="_blank" rel="noopener">Salesnote</a>
            <a className="partner-name-card" href="https://www.polaris.be" target="_blank" rel="noopener">Polaris</a>
            <a className="partner-name-card" href="https://curavex.com" target="_blank" rel="noopener">Curavex</a>
            <a className="partner-name-card" href="https://spikes.be" target="_blank" rel="noopener">Spikes</a>
            <a className="partner-name-card" href="https://www.innatify.com" target="_blank" rel="noopener">Innatify</a>
            <a className="partner-name-card" href="https://www.studio55.ai" target="_blank" rel="noopener">Studio55</a>
          </div>
        </div>

        {/* Andere & Kennisinstellingen */}
        <div className="partner-category">
          <div className="partner-category-label">
            <span className="partner-cat-icon">🎓</span> Andere &amp; Kennisinstellingen
          </div>
          <div className="partner-logo-grid">
            <a className="partner-name-card" href="https://www.nxtgn.be" target="_blank" rel="noopener">NXTGN</a>
            <a className="partner-name-card" href="https://healthcampus.be" target="_blank" rel="noopener">Health Campus Limburg</a>
            <a className="partner-name-card" href="https://www.vaia.be" target="_blank" rel="noopener">VAIA</a>
            <a className="partner-name-card" href="https://www.umcutrecht.nl/en/info/ai-labs" target="_blank" rel="noopener">Kennisnetwerk AI — UMC Utrecht</a>
            <a className="partner-name-card" href="https://www.netwerkverpleegkunde.be" target="_blank" rel="noopener">Netwerk Verpleegkunde (NVKVV)</a>
            <a className="partner-name-card" href="https://www.imec-int.com" target="_blank" rel="noopener">Imec</a>
            <a className="partner-name-card" href="https://www.inspirehealth.be" target="_blank" rel="noopener">Inspirehealth</a>
            <a className="partner-name-card" href="https://www.zorgneticuro.be" target="_blank" rel="noopener">Zorgnet Icuro</a>
            <a className="partner-name-card" href="https://www.thomasmore.be" target="_blank" rel="noopener">Thomas More</a>
            <a className="partner-name-card" href="https://www.arteveldehogeschool.be" target="_blank" rel="noopener">Artevelde Hogeschool</a>
            <a className="partner-name-card" href="https://umaniq.eu" target="_blank" rel="noopener">Umaniq</a>
          </div>
        </div>
      </section>

      {/* AGENDA */}
      <section id="agenda" style={{ background: 'var(--off-white)', padding: '100px 48px' }}>
        <div className="section-label" style={{ color: 'var(--teal)' }}>
          Evenementen
        </div>
        <div className="section-title" style={{ color: 'var(--navy)', marginBottom: '12px' }}>
          Agenda
        </div>
        <p style={{ fontSize: '17px', fontWeight: 300, color: 'var(--text-mid)', lineHeight: 1.7, maxWidth: '600px', marginBottom: '56px' }}>
          Ontdek onze komende activiteiten, symposia en technologiebeurzen rond AI in de zorg.
        </p>

        {/* EVENT CARD */}
        <div className="agenda-card">
          <div className="agenda-card-header">
            <div className="agenda-date-block">
              <span className="agenda-day">12</span>
              <span className="agenda-month">MEI 2026</span>
            </div>
            <div className="agenda-header-info">
              <div className="agenda-badge">Technologiebeurs · Netwerkevent</div>
              <h2 className="agenda-title">AI en technologie in de zorg</h2>
              <div className="agenda-meta-row">
                <span className="agenda-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  BluePoint Antwerpen · Filip Williotstraat 9, 2600 Antwerpen
                </span>
                <span className="agenda-meta-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  9u00 – 16u30
                </span>
              </div>
            </div>
            <Link href="/resultaten#studiedag-mei" className="agenda-cta-btn">
              Bekijk resultaten
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* PODCAST */}
      <section id="podcast" style={{ background: 'var(--navy)', padding: '100px 48px' }}>
        <div className="section-label" style={{ color: 'var(--teal-light)' }}>
          Luister &amp; leer
        </div>
        <div className="section-title" style={{ color: '#fff', marginBottom: '12px' }}>
          Onze Podcastreeks
        </div>
        <p style={{ fontSize: '17px', fontWeight: 300, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, maxWidth: '600px', marginBottom: '48px' }}>
          In onze podcast duiken we dieper in de wereld van AI en zorgadministratie. Beluister alle
          afleveringen rechtstreeks hier of via Spotify.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '40px', alignItems: 'start' }}>
          {/* Spotify Embed */}
          <div>
            <iframe
              style={{ borderRadius: '16px', width: '100%', border: 'none', display: 'block' }}
              src="https://open.spotify.com/embed/show/5KQZRmDYw7P6T169fsdINh?utm_source=generator&theme=0"
              width="100%"
              height="500"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>

          {/* Info + Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(33,154,189,0.2)', borderRadius: '14px', padding: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--teal-light)', marginBottom: '12px' }}>
                Over de podcast
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                De CareAIgent-podcast brengt onderzoekers, zorgprofessionals en technologiepartners
                samen voor open gesprekken over AI in de zorg. Van praktijkervaringen tot
                toekomstvisies — luister mee en laat je inspireren.
              </p>
            </div>

            <a
              href="https://open.spotify.com/show/5KQZRmDYw7P6T169fsdINh"
              target="_blank"
              rel="noopener"
              style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#1DB954', color: '#000', fontFamily: "'Raleway',sans-serif", fontWeight: 700, fontSize: '15px', padding: '16px 24px', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Beluisteren op Spotify
            </a>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>
                Ook beschikbaar via
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>🎙 Spotify</span>
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>🍎 Apple Podcasts</span>
                <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>📡 RSS Feed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="contact-section" id="contact">
        <div className="section-label">Contact</div>
        <div className="section-title" style={{ marginBottom: '48px' }}>
          Stel uw vraag
        </div>

        <div className="contact-grid">
          <div className="contact-info">
            <h3>Eric Lodewyckx</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-mid)', marginBottom: '28px' }}>
              Projectcoördinator CareAIgent · PXL Zorginnovatie
            </p>

            <div className="contact-detail">
              <div className="contact-icon">🏛</div>
              <div className="contact-detail-text">
                <strong>Hogeschool PXL — Campus Healthcare</strong>
                Guffenslaan 39, 3500 Hasselt
              </div>
            </div>
            <div className="contact-detail">
              <div className="contact-icon">✉️</div>
              <div className="contact-detail-text">
                <strong>E-mail</strong>
                Eric.Lodewyckx@PXL.BE
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
