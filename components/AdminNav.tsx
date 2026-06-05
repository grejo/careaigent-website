'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

type Props = {
  signOutAction: () => Promise<void>;
};

export default function AdminNav({ signOutAction }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setMenuOpen(false);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav>
        <Link href="/admin" className="nav-logo">
          <Image
            src="/images/favicon.png"
            alt="CareAIgent logo"
            width={44}
            height={44}
            style={{ objectFit: 'cover', borderRadius: '8px' }}
          />
          <div className="nav-logo-text">
            Care<span>AI</span>gent
            <span className="admin-nav-badge">Admin</span>
          </div>
        </Link>

        <ul className="nav-links">
          <li><Link href="/admin">Dashboard</Link></li>
          <li><Link href="/admin/activiteiten">Activiteiten</Link></li>
        </ul>

        <form action={signOutAction} style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="submit"
            className="nav-cta"
            style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600 }}
          >
            Uitloggen
          </button>
        </form>

        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          aria-label="Menu openen"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <Link href="/admin" onClick={() => setMenuOpen(false)}>Dashboard</Link>
        <Link href="/admin/activiteiten" onClick={() => setMenuOpen(false)}>Activiteiten</Link>
        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              fontSize: '1rem',
              fontFamily: 'inherit',
              padding: '14px 0',
              width: '100%',
              textAlign: 'left',
            }}
          >
            Uitloggen
          </button>
        </form>
      </div>
    </>
  );
}
