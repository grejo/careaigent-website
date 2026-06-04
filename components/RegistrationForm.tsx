'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ExtraField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  options?: string[];
  required: boolean;
};

type Props = {
  activitySlug: string;
  extraFields: ExtraField[];
};

export default function RegistrationForm({ activitySlug, extraFields }: Props) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const extraData: Record<string, string> = {};
    extraFields.forEach((f) => {
      if (f.type === 'checkbox') {
        const vals = formData.getAll(f.key);
        if (vals.length > 0) extraData[f.key] = vals.join(', ');
      } else {
        const val = formData.get(f.key);
        if (val !== null) extraData[f.key] = val as string;
      }
    });

    const body = {
      activitySlug,
      naam: formData.get('naam'),
      voornaam: formData.get('voornaam'),
      email: formData.get('email'),
      telefoon: formData.get('telefoon'),
      instelling: formData.get('instelling'),
      functie: formData.get('functie'),
      extraData,
    };

    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push('/bedankt');
    } else {
      const data = await res.json().catch(() => ({}));
      setErrors(data.errors ?? { general: data.error ?? 'Er is iets misgelopen. Probeer opnieuw.' });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      {errors.general && (
        <p className="form-error" style={{ marginBottom: '16px', fontSize: '1rem' }}>
          {errors.general}
        </p>
      )}

      <div className="form-group">
        <label htmlFor="naam">Naam *</label>
        <input id="naam" name="naam" type="text" required />
        {errors.naam && <p className="form-error">{errors.naam}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="voornaam">Voornaam *</label>
        <input id="voornaam" name="voornaam" type="text" required />
        {errors.voornaam && <p className="form-error">{errors.voornaam}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="email">E-mailadres *</label>
        <input id="email" name="email" type="email" required />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="telefoon">Telefoonnummer *</label>
        <input id="telefoon" name="telefoon" type="tel" required />
        {errors.telefoon && <p className="form-error">{errors.telefoon}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="instelling">Instelling *</label>
        <input id="instelling" name="instelling" type="text" required />
        {errors.instelling && <p className="form-error">{errors.instelling}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="functie">Functie / rol *</label>
        <input id="functie" name="functie" type="text" required />
        {errors.functie && <p className="form-error">{errors.functie}</p>}
      </div>

      {extraFields.map((field) => (
        <div key={field.key} className="form-group">
          <label htmlFor={field.key}>
            {field.label}{field.required ? ' *' : ''}
          </label>
          {field.type === 'text' && (
            <input
              id={field.key}
              name={field.key}
              type="text"
              required={field.required}
            />
          )}
          {field.type === 'textarea' && (
            <textarea
              id={field.key}
              name={field.key}
              rows={4}
              required={field.required}
            />
          )}
          {field.type === 'radio' && field.options?.map((opt) => (
            <label key={opt} className="radio-label" htmlFor={`${field.key}-${opt}`}>
              <input
                type="radio"
                id={`${field.key}-${opt}`}
                name={field.key}
                value={opt}
                required={field.required}
              />
              {opt}
            </label>
          ))}
          {field.type === 'checkbox' && field.options?.map((opt) => (
            <label key={opt} className="radio-label" htmlFor={`${field.key}-${opt}`}>
              <input
                type="checkbox"
                id={`${field.key}-${opt}`}
                name={field.key}
                value={opt}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? 'Bezig met versturen…' : 'Inschrijven'}
      </button>
    </form>
  );
}
