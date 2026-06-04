'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on scroll
  useEffect(() => {
    const handleScroll = () => setMenuOpen(false);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav>
        <Link href="/" className="nav-logo">
          <Image
            src="/images/favicon.png"
            alt="CareAIgent logo"
            width={44}
            height={44}
            style={{ objectFit: 'cover', borderRadius: '8px' }}
          />
          <div className="nav-logo-text">Care<span>AI</span>gent</div>
        </Link>
        <ul className="nav-links">
          <li><Link href="/#probleem">Probleem</Link></li>
          <li><Link href="/#aanpak">Aanpak</Link></li>
          <li><Link href="/#partners">Partners</Link></li>
          <li><Link href="/resultaten">Resultaten</Link></li>
          <li><Link href="/team">Team</Link></li>
          <li><Link href="/agenda" className="nav-cta">Agenda</Link></li>
        </ul>
        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          aria-label="Menu openen"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <Link href="/#probleem" onClick={() => setMenuOpen(false)}>Probleem</Link>
        <Link href="/#aanpak" onClick={() => setMenuOpen(false)}>Aanpak</Link>
        <Link href="/#partners" onClick={() => setMenuOpen(false)}>Partners</Link>
        <Link href="/resultaten" onClick={() => setMenuOpen(false)}>Resultaten</Link>
        <Link href="/team" onClick={() => setMenuOpen(false)}>Team</Link>
        <Link href="/agenda" onClick={() => setMenuOpen(false)}>Agenda</Link>
      </div>
    </>
  );
}
