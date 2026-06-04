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

type ActivityData = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  dateStart?: string;
  dateEnd?: string | null;
  location?: string | null;
  maxParticipants?: number | null;
  registrationDeadline?: string | null;
  isOpen?: boolean;
  extraFields?: ExtraField[];
};

type Props = { activity?: ActivityData };

export default function ActivityForm({ activity }: Props) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [extraFields, setExtraFields] = useState<ExtraField[]>(
    activity?.extraFields ?? []
  );

  function addField() {
    setExtraFields([
      ...extraFields,
      { key: `field_${Date.now()}`, label: '', type: 'text', required: false },
    ]);
  }

  function removeField(index: number) {
    setExtraFields(extraFields.filter((_, i) => i !== index));
  }

  function updateField(index: number, update: Partial<ExtraField>) {
    setExtraFields(extraFields.map((f, i) => (i === index ? { ...f, ...update } : f)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const maxP = formData.get('maxParticipants');

    const body = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      dateStart: formData.get('dateStart'),
      dateEnd: formData.get('dateEnd') || null,
      location: formData.get('location') || null,
      maxParticipants: maxP ? parseInt(maxP as string, 10) : null,
      registrationDeadline: formData.get('registrationDeadline') || null,
      isOpen: formData.get('isOpen') === 'true',
      extraFields,
    };

    const url = activity?.id
      ? `/api/admin/activities/${activity.id}`
      : '/api/admin/activities';
    const method = activity?.id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push('/admin/activiteiten');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ? JSON.stringify(data.error) : 'Er is iets misgelopen.');
      setSaving(false);
    }
  }

  const toDatetimeLocal = (d?: string | null) =>
    d ? new Date(d).toISOString().slice(0, 16) : '';

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="form-error" style={{ marginBottom: '16px' }}>
          {error}
        </p>
      )}

      <div className="form-group">
        <label htmlFor="title">Titel *</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={activity?.title}
        />
      </div>

      <div className="form-group">
        <label htmlFor="slug">Slug * (URL-vriendelijk, bv. ai-ambassadeur-22-09)</label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          defaultValue={activity?.slug}
          pattern="[a-z0-9-]+"
          title="Alleen kleine letters, cijfers en koppeltekens"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Beschrijving</label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={activity?.description ?? ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="dateStart">Startdatum en -tijd *</label>
        <input
          id="dateStart"
          name="dateStart"
          type="datetime-local"
          required
          defaultValue={toDatetimeLocal(activity?.dateStart)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="dateEnd">Einddatum en -tijd</label>
        <input
          id="dateEnd"
          name="dateEnd"
          type="datetime-local"
          defaultValue={toDatetimeLocal(activity?.dateEnd)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="location">Locatie</label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={activity?.location ?? ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="maxParticipants">Max. deelnemers</label>
        <input
          id="maxParticipants"
          name="maxParticipants"
          type="number"
          min="1"
          defaultValue={activity?.maxParticipants ?? ''}
        />
      </div>

      <div className="form-group">
        <label htmlFor="registrationDeadline">Inschrijvingsdeadline</label>
        <input
          id="registrationDeadline"
          name="registrationDeadline"
          type="datetime-local"
          defaultValue={toDatetimeLocal(activity?.registrationDeadline)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="isOpen">Status inschrijvingen</label>
        <select
          id="isOpen"
          name="isOpen"
          defaultValue={activity?.isOpen === false ? 'false' : 'true'}
        >
          <option value="true">Open</option>
          <option value="false">Gesloten</option>
        </select>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--navy)', marginBottom: '12px' }}>Extra formuliervelden</h3>
        {extraFields.map((field, i) => (
          <div
            key={i}
            style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Veldnaam (key)</label>
                <input
                  type="text"
                  value={field.key}
                  onChange={(e) => updateField(i, { key: e.target.value })}
                  placeholder="bv. lunch"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Label</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                  placeholder="bv. Ik neem deel aan de lunch"
                />
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                alignItems: 'end',
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Type</label>
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateField(i, { type: e.target.value as ExtraField['type'] })
                  }
                >
                  <option value="text">Tekstveld</option>
                  <option value="textarea">Tekstblok</option>
                  <option value="radio">Keuzevraag (radio)</option>
                  <option value="checkbox">Aankruisvakje</option>
                </select>
              </div>
              {(field.type === 'radio' || field.type === 'checkbox') && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Opties (kommagescheiden)</label>
                  <input
                    type="text"
                    value={field.options?.join(', ') ?? ''}
                    onChange={(e) =>
                      updateField(i, {
                        options: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Ja, Neen"
                  />
                </div>
              )}
              <label className="radio-label" style={{ gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(i, { required: e.target.checked })}
                />
                Verplicht
              </label>
            </div>
            <button
              type="button"
              onClick={() => removeField(i)}
              className="btn-danger-small"
              style={{ marginTop: '12px' }}
            >
              Veld verwijderen
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addField}
          className="btn-secondary"
          style={{ marginTop: '4px' }}
        >
          + Veld toevoegen
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" className="btn-submit" disabled={saving}>
          {saving
            ? 'Opslaan…'
            : activity?.id
            ? 'Wijzigingen opslaan'
            : 'Activiteit aanmaken'}
        </button>
        <a href="/admin/activiteiten" className="btn-secondary">
          Annuleren
        </a>
      </div>
    </form>
  );
}
