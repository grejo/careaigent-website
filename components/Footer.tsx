import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="footer-inner">
        {/* Logo block */}
        <div className="footer-brand">
          <div className="footer-logo-row">
            <Image
              src="/images/index-003.png"
              alt="PXL Zorginnovatie"
              width={160}
              height={48}
              className="footer-logo-img footer-logo-light"
              style={{ objectFit: 'contain' }}
            />
            <div className="footer-divider" />
            <Image
              src="/images/vlaio-biovia.png"
              alt="VLAIO · Biovia — samen voor #sterkgroeien"
              width={200}
              height={64}
              className="footer-logo-img footer-logo-vlaio"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <p className="footer-tagline">AI-onderzoek voor slimmere zorg in Vlaanderen</p>
          <a
            href="https://www.linkedin.com/company/careaigent/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              color: 'rgba(255,255,255,0.6)',
              textDecoration: 'none',
              fontSize: '13px',
              transition: 'color 0.2s',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>
        </div>

        {/* Navigation links */}
        <div className="footer-nav">
          <div className="footer-nav-title">Navigatie</div>
          <Link href="/#probleem">Het probleem</Link>
          <Link href="/#aanpak">Onze aanpak</Link>
          <Link href="/#partners">Partners</Link>
          <Link href="/#podcast">Podcast</Link>
          <Link href="/#contact">Contact</Link>
        </div>

        {/* Contact */}
        <div className="footer-nav">
          <div className="footer-nav-title">Contact</div>
          <a href="mailto:Eric.Lodewyckx@PXL.BE">Eric.Lodewyckx@PXL.BE</a>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
            Guffenslaan 39<br />3500 Hasselt
          </span>
          <a
            href="https://www.pxl.be"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: '4px' }}
          >
            www.pxl.be
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <span>© {year} Hogeschool PXL — CareAIgent</span>
        <span className="footer-bottom-right">Een VLAIO TETRA-project via Biovia · PXL Zorginnovatie</span>
      </div>
    </footer>
  );
}
