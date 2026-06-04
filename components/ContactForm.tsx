'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await fetch('/__forms.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData as unknown as Record<string, string>).toString(),
    });
    router.push('/bedankt');
  }

  return (
    <form
      className="contact-form"
      name="contact"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="form-name" value="contact" />
      <p style={{ display: 'none' }}>
        <label>Niet invullen: <input name="bot-field" /></label>
      </p>

      <div className="form-group">
        <label htmlFor="naam">VOORNAAM &amp; ACHTERNAAM</label>
        <input type="text" id="naam" name="naam" placeholder="Jan Peeters" required />
      </div>
      <div className="form-group">
        <label htmlFor="organisatie">ORGANISATIE</label>
        <input type="text" id="organisatie" name="organisatie" placeholder="Jessa Ziekenhuis" />
      </div>
      <div className="form-group">
        <label htmlFor="email">E-MAILADRES</label>
        <input type="email" id="email" name="email" placeholder="jan.peeters@organisatie.be" required />
      </div>
      <div className="form-group">
        <label htmlFor="bericht">UW VRAAG OF BERICHT</label>
        <textarea id="bericht" name="bericht" placeholder="Stel hier uw vraag over het project..." required />
      </div>
      <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
        {submitting ? 'Versturen…' : 'Verstuur bericht →'}
      </button>
    </form>
  );
}
