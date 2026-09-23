'use client';
// Invoercomponenten per vraagtype van formulier A. Alle keuzes zijn echte
// radio-/checkbox-inputs met gekoppelde labels, zodat alles met het toetsenbord
// en een schermlezer bediend kan worden.
import {
  ANDERE,
  BLOK5,
  COMPETENTIE5,
  LIKERT5,
  NPS,
  type Schaal,
  type Vraag,
} from '@/lib/evaluatie/formulierA';

export type Waarden = Record<string, unknown>;
type Zet = (key: string, value: unknown) => void;

function reeks(s: Schaal): number[] {
  return Array.from({ length: s.max - s.min + 1 }, (_, i) => s.min + i);
}

function ScoreKnoppen({
  name,
  schaal,
  waarde,
  onChange,
  labelledBy,
  nps,
}: {
  name: string;
  schaal: Schaal;
  waarde: unknown;
  onChange: (n: number) => void;
  labelledBy: string;
  nps?: boolean;
}) {
  return (
    <div>
      <div className={`eval-scores${nps ? ' nps' : ''}`} role="radiogroup" aria-labelledby={labelledBy}>
        {reeks(schaal).map((n) => (
          <label key={n} className="eval-score">
            <input
              type="radio"
              name={name}
              value={n}
              checked={waarde === n}
              onChange={() => onChange(n)}
              aria-label={schaal.labels ? `${n} – ${schaal.labels[n - schaal.min]}` : String(n)}
            />
            <span aria-hidden>{n}</span>
          </label>
        ))}
      </div>
      <div className="eval-schaal-labels" aria-hidden>
        <span>
          {schaal.min} = {schaal.minLabel}
        </span>
        <span>
          {schaal.max} = {schaal.maxLabel}
        </span>
      </div>
    </div>
  );
}

function Label({ vraag, id }: { vraag: Vraag; id: string }) {
  return (
    <span id={id} className="eval-vraag-label">
      {vraag.tekst}
      {vraag.verplicht && (
        <span className="eval-verplicht" aria-label="verplicht">
          *
        </span>
      )}
    </span>
  );
}

export function VraagVeld({
  vraag,
  waarden,
  zet,
  email,
  zetEmail,
  fout,
  eersteInSectie,
  instructie,
}: {
  vraag: Vraag;
  waarden: Waarden;
  zet: Zet;
  email: string;
  zetEmail: (v: string) => void;
  fout?: string;
  eersteInSectie?: boolean;
  instructie?: string;
}) {
  const labelId = `label-${vraag.id}`;
  const foutId = `fout-${vraag.id}`;
  const beschrijving = fout ? foutId : undefined;

  if (vraag.type === 'email' && waarden[vraag.toonAls.vraag] !== vraag.toonAls.waarde) return null;

  let inhoud: React.ReactNode;
  switch (vraag.type) {
    case 'likert5':
    case 'nps':
      inhoud = (
        <ScoreKnoppen
          name={vraag.id}
          schaal={vraag.type === 'nps' ? NPS : LIKERT5}
          waarde={waarden[vraag.id]}
          onChange={(n) => zet(vraag.id, n)}
          labelledBy={labelId}
          nps={vraag.type === 'nps'}
        />
      );
      break;
    case 'matrix':
      inhoud = vraag.rijen.map((r) => (
        <div key={r.id} className="eval-blok">
          <div className="eval-blok-titel" id={`label-${r.id}`}>
            {r.label}
          </div>
          <div className="eval-blok-rijen">
            {vraag.kolommen.map((k) => {
              const key = `${r.id}_${k.id}`;
              return (
                <div key={k.id} className="eval-blok-rij">
                  <div className="eval-blok-rij-label" id={`label-${key}`}>
                    {k.label}
                  </div>
                  <ScoreKnoppen
                    name={key}
                    schaal={BLOK5}
                    waarde={waarden[key]}
                    onChange={(n) => zet(key, n)}
                    labelledBy={`label-${r.id} label-${key}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ));
      break;
    case 'prepost':
      inhoud = (
        <>
          {eersteInSectie && instructie && <p className="eval-hulp">{instructie}</p>}
          <div className="eval-prepost-rij voor">
            <div className="eval-blok-rij-label" id={`label-${vraag.id}-pre`}>
              Vóór de opleiding
            </div>
            <ScoreKnoppen
              name={`${vraag.id}_pre`}
              schaal={COMPETENTIE5}
              waarde={waarden[`${vraag.id}_pre`]}
              onChange={(n) => zet(`${vraag.id}_pre`, n)}
              labelledBy={`${labelId} label-${vraag.id}-pre`}
            />
          </div>
          <div className="eval-prepost-rij nu">
            <div className="eval-blok-rij-label" id={`label-${vraag.id}-post`}>
              Nu
            </div>
            <ScoreKnoppen
              name={`${vraag.id}_post`}
              schaal={COMPETENTIE5}
              waarde={waarden[`${vraag.id}_post`]}
              onChange={(n) => zet(`${vraag.id}_post`, n)}
              labelledBy={`${labelId} label-${vraag.id}-post`}
            />
          </div>
        </>
      );
      break;
    case 'single':
    case 'single_met_andere':
      inhoud = (
        <>
          <div className="eval-opties" role="radiogroup" aria-labelledby={labelId} aria-describedby={beschrijving}>
            {vraag.opties.map((o) => (
              <label key={o} className="eval-optie">
                <input type="radio" name={vraag.id} value={o} checked={waarden[vraag.id] === o} onChange={() => zet(vraag.id, o)} />
                <span>{o}</span>
              </label>
            ))}
          </div>
          {vraag.type === 'single_met_andere' && waarden[vraag.id] === ANDERE && (
            <AndersVeld vraagId={vraag.id} waarden={waarden} zet={zet} />
          )}
        </>
      );
      break;
    case 'multi_met_andere': {
      const gekozen = Array.isArray(waarden[vraag.id]) ? (waarden[vraag.id] as string[]) : [];
      inhoud = (
        <>
          <p className="eval-hulp">Meerdere antwoorden mogelijk.</p>
          <div className="eval-opties" role="group" aria-labelledby={labelId}>
            {vraag.opties.map((o) => (
              <label key={o} className="eval-optie">
                <input
                  type="checkbox"
                  value={o}
                  checked={gekozen.includes(o)}
                  onChange={(e) => zet(vraag.id, e.target.checked ? [...gekozen, o] : gekozen.filter((x) => x !== o))}
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
          {gekozen.includes(ANDERE) && <AndersVeld vraagId={vraag.id} waarden={waarden} zet={zet} />}
        </>
      );
      break;
    }
    case 'tekst_kort':
    case 'tekst_lang': {
      const v = typeof waarden[vraag.id] === 'string' ? (waarden[vraag.id] as string) : '';
      const props = {
        id: `invoer-${vraag.id}`,
        className: 'eval-invoer',
        value: v,
        maxLength: vraag.max,
        'aria-labelledby': labelId,
        'aria-describedby': beschrijving,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => zet(vraag.id, e.target.value),
      };
      inhoud = (
        <>
          {vraag.type === 'tekst_kort' ? <input type="text" {...props} /> : <textarea {...props} />}
          <div className="eval-teller" aria-live="polite">
            {v.length} / {vraag.max}
          </div>
        </>
      );
      break;
    }
    case 'email':
      inhoud = (
        <input
          id={`invoer-${vraag.id}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          className="eval-invoer"
          value={email}
          onChange={(e) => zetEmail(e.target.value)}
          aria-labelledby={labelId}
          aria-describedby={beschrijving}
          aria-required="true"
        />
      );
      break;
  }

  return (
    <div id={`vraag-${vraag.id}`} className={`eval-vraag${fout ? ' heeft-fout' : ''}`}>
      <Label vraag={vraag.type === 'email' ? { ...vraag, verplicht: true } : vraag} id={labelId} />
      {vraag.hulptekst && <p className="eval-hulp">{vraag.hulptekst}</p>}
      {inhoud}
      {fout && (
        <p id={foutId} className="eval-fout" role="alert">
          {fout}
        </p>
      )}
    </div>
  );
}

function AndersVeld({ vraagId, waarden, zet }: { vraagId: string; waarden: Waarden; zet: Zet }) {
  const key = `${vraagId}_anders`;
  return (
    <div style={{ marginTop: '8px' }}>
      <label htmlFor={`invoer-${key}`} className="eval-sr">
        Andere, namelijk
      </label>
      <input
        id={`invoer-${key}`}
        type="text"
        className="eval-invoer"
        placeholder="Andere, namelijk…"
        maxLength={200}
        value={typeof waarden[key] === 'string' ? (waarden[key] as string) : ''}
        onChange={(e) => zet(key, e.target.value)}
      />
    </div>
  );
}
