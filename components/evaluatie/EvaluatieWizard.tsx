'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SECTIES, PRIVACY_KORT, PRIVACY_LANG, PRIVACY_PERSOONLIJKE_LINK } from '@/lib/evaluatie/formulierA';
import { valideerVragen } from '@/lib/evaluatie/validatie';
import { VraagVeld, type Waarden } from './Vragen';

type Props = {
  activiteit: { id: string; title: string; datum: string };
  /** Persoonlijk token uit de mail, of null bij de algemene link. */
  token: string | null;
  /** Slug voor de algemene link (?editie=). */
  editie: string | null;
};

export const RESULTAAT_KEY = 'careaigent-evaluatie-resultaat';

function veilig<T>(fn: () => T, terugval: T): T {
  try {
    return fn();
  } catch {
    return terugval;
  }
}

export default function EvaluatieWizard({ activiteit, token, editie }: Props) {
  const router = useRouter();
  const draftKey = `careaigent-evaluatie-concept:${activiteit.id}`;
  const ingevuldKey = `careaigent-evaluatie-ingevuld:${activiteit.id}`;

  const [stap, setStap] = useState(0);
  const [waarden, setWaarden] = useState<Waarden>({});
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [fouten, setFouten] = useState<Record<string, string>>({});
  const [bezig, setBezig] = useState(false);
  const [algemeneFout, setAlgemeneFout] = useState<string | null>(null);
  const [alIngevuld, setAlIngevuld] = useState(false);
  const bovenkant = useRef<HTMLDivElement>(null);
  // State (geen ref): pas na een render mét het herstelde concept mag er
  // bewaard worden, anders overschrijft de lege beginstand het concept.
  const [geladen, setGeladen] = useState(false);

  // Concept herstellen (bv. na per ongeluk herladen) en waarschuwen als er op
  // dit toestel al ingevuld werd. Enkel een waarschuwing, geen blokkering.
  useEffect(() => {
    const concept = veilig(() => sessionStorage.getItem(draftKey), null);
    if (concept) {
      const c = veilig(() => JSON.parse(concept) as { waarden: Waarden; stap: number }, null);
      if (c) {
        setWaarden(c.waarden ?? {});
        setStap(Math.min(Math.max(0, c.stap ?? 0), SECTIES.length - 1));
      }
    }
    if (!token) setAlIngevuld(veilig(() => localStorage.getItem(ingevuldKey) === '1', false));
    setGeladen(true);
  }, [draftKey, ingevuldKey, token]);

  // Het e-mailadres wordt bewust niet in het concept bewaard.
  useEffect(() => {
    if (!geladen) return;
    veilig(() => sessionStorage.setItem(draftKey, JSON.stringify({ waarden, stap })), undefined);
  }, [geladen, waarden, stap, draftKey]);

  const sectie = SECTIES[stap];
  const laatste = stap === SECTIES.length - 1;

  function zet(key: string, value: unknown) {
    setWaarden((w) => ({ ...w, [key]: value }));
    const vraagId = key.split('_')[0];
    const matrixVraag = /^B\d$/.test(vraagId) ? 'R7' : vraagId;
    setFouten((f) => {
      if (!f[matrixVraag]) return f;
      const rest = { ...f };
      delete rest[matrixVraag];
      return rest;
    });
  }

  function scrollNaarFout(ids: string[]) {
    requestAnimationFrame(() => {
      const eerste = ids.map((id) => document.getElementById(`vraag-${id}`)).find(Boolean);
      if (eerste) {
        eerste.scrollIntoView({ behavior: 'smooth', block: 'start' });
        eerste.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true });
      }
    });
  }

  function naarStap(nieuw: number) {
    setStap(nieuw);
    setAlgemeneFout(null);
    requestAnimationFrame(() => bovenkant.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function controleerStap(): boolean {
    const r = valideerVragen(sectie.vragen, { antwoorden: waarden, email });
    if (r.ok) {
      setFouten({});
      return true;
    }
    setFouten(r.fouten);
    scrollNaarFout(sectie.vragen.map((v) => v.id).filter((id) => r.fouten[id]));
    return false;
  }

  async function verzend() {
    if (!controleerStap()) return;
    setBezig(true);
    setAlgemeneFout(null);
    const res = await fetch('/api/evaluatie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, editie, antwoorden: waarden, email, website }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    setBezig(false);

    if (res?.status === 201) {
      veilig(() => {
        sessionStorage.removeItem(draftKey);
        sessionStorage.setItem(
          RESULTAAT_KEY,
          JSON.stringify({ kennisScore: data?.kennisScore ?? null, feedback: data?.feedback ?? [], activiteit: activiteit.title }),
        );
        if (!token) localStorage.setItem(ingevuldKey, '1');
      }, undefined);
      router.push('/evaluatie/bedankt');
      return;
    }
    if (res?.status === 422 && data?.fouten) {
      const serverFouten = data.fouten as Record<string, string>;
      const index = SECTIES.findIndex((s) => s.vragen.some((v) => serverFouten[v.id]));
      setFouten(serverFouten);
      if (index >= 0 && index !== stap) setStap(index);
      scrollNaarFout(Object.keys(serverFouten));
      return;
    }
    setAlgemeneFout(data?.error ?? 'Verzenden mislukt. Controleer je verbinding en probeer opnieuw.');
  }

  const eersteMetInstructie = sectie.vragen.find((v) => v.type === 'prepost')?.id;

  return (
    <div className="eval-card" ref={bovenkant} style={{ scrollMarginTop: '90px' }}>
      <div className="eval-kop">
        <div className="eval-eyebrow">Evaluatie · {activiteit.datum}</div>
        <h1>{activiteit.title}</h1>
        {stap === 0 && (
          <>
            <p>
              Bedankt voor je deelname. Deze evaluatie duurt ongeveer 6 minuten en is anoniem. Je antwoorden helpen
              ons de opleiding te verbeteren.
            </p>
            <details className="eval-privacy">
              <summary>{PRIVACY_KORT} Meer over privacy</summary>
              <p>{PRIVACY_LANG}</p>
              {token && <p>{PRIVACY_PERSOONLIJKE_LINK}</p>}
            </details>
          </>
        )}
      </div>

      {alIngevuld && stap === 0 && (
        <p className="eval-melding info">
          Het lijkt erop dat je deze evaluatie op dit toestel al invulde. Vul ze gerust opnieuw in als dat voor iemand
          anders is.
        </p>
      )}

      <div className="eval-voortgang" aria-live="polite">
        <div className="eval-voortgang-tekst">
          <span>
            Stap {stap + 1} van {SECTIES.length}
          </span>
          <span>{sectie.titel}</span>
        </div>
        <div
          className="eval-voortgang-balk"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={SECTIES.length}
          aria-valuenow={stap + 1}
          aria-label="Voortgang"
        >
          <span style={{ width: `${((stap + 1) / SECTIES.length) * 100}%` }} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (laatste) verzend();
          else if (controleerStap()) naarStap(stap + 1);
        }}
        noValidate
      >
        <h2 className="eval-sectie-titel">
          {sectie.titel}
          {sectie.optioneel && <span className="eval-optioneel">Mag je overslaan</span>}
        </h2>
        {sectie.instructie && <p className="eval-instructie">{sectie.instructie}</p>}

        {sectie.vragen.map((v) => (
          <VraagVeld
            key={v.id}
            vraag={v}
            waarden={waarden}
            zet={zet}
            email={email}
            zetEmail={(val) => {
              setEmail(val);
              setFouten((f) => {
                const rest = { ...f };
                delete rest.C2;
                return rest;
              });
            }}
            fout={fouten[v.id]}
            eersteInSectie={v.id === eersteMetInstructie}
            instructie={sectie.instructie ? 'VÓÓR = hoe goed je dit kon vóór de opleiding · NU = hoe goed je het nu kan.' : undefined}
          />
        ))}

        <div className="eval-honeypot" aria-hidden="true">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
        </div>

        {algemeneFout && (
          <p className="eval-melding fout" role="alert">
            {algemeneFout}
          </p>
        )}

        <div className="eval-navigatie">
          {stap > 0 ? (
            <button type="button" className="eval-knop-terug" onClick={() => naarStap(stap - 1)}>
              ← Vorige
            </button>
          ) : (
            <span />
          )}
          <button type="submit" className="btn-submit" disabled={bezig}>
            {laatste ? (bezig ? 'Verzenden…' : 'Verzenden') : 'Volgende →'}
          </button>
        </div>
      </form>
    </div>
  );
}
