import { valideerFormulier } from '../validatie';
import { berekenKennisScore } from '../kennischeck.server';
import { antwoordSleutels } from '../formulierA';
import { geldigeAntwoorden } from './fixtures';

describe('valideerFormulier', () => {
  it('aanvaardt een volledig formulier', () => {
    const r = valideerFormulier({ antwoorden: geldigeAntwoorden() });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.email).toBeNull();
      expect(r.c1Opvolging).toBe(false);
      expect(r.antwoorden.L1_post).toBe(4);
    }
  });

  it('geeft fouten per vraag bij ontbrekende verplichte velden', () => {
    const a = geldigeAntwoorden();
    delete a.R1;
    delete a.B3_uitwerking;
    delete a.L4_pre;
    const r = valideerFormulier({ antwoorden: a });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fouten).sort()).toEqual(['L4', 'R1', 'R7']);
  });

  it('weigert waarden buiten de schaal of de optielijst', () => {
    const r = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), R2: 6, R8: 11, P4: 'Misschien' } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fouten).sort()).toEqual(['P4', 'R2', 'R8']);
  });

  it('vraagt tekst bij ‘Andere’', () => {
    const zonder = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), P2: 'Andere' } });
    expect(zonder.ok).toBe(false);
    const met = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), P2: 'Andere', P2_anders: 'Directeur' } });
    expect(met.ok).toBe(true);
  });

  it('C2 is enkel verplicht als C1 = Ja', () => {
    const zonderMail = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), C1: 'Ja' } });
    expect(zonderMail.ok).toBe(false);
    if (!zonderMail.ok) expect(zonderMail.fouten.C2).toBeDefined();

    const metMail = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), C1: 'Ja' }, email: ' An@Voorbeeld.be ' });
    expect(metMail.ok).toBe(true);
    if (metMail.ok) {
      expect(metMail.email).toBe('an@voorbeeld.be');
      expect(metMail.c1Opvolging).toBe(true);
    }

    const nee = valideerFormulier({ antwoorden: geldigeAntwoorden(), email: 'genegeerd@voorbeeld.be' });
    expect(nee.ok && nee.email).toBeNull();
  });

  it('zet het e-mailadres nooit in de antwoorden', () => {
    const r = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), C1: 'Ja', C2: 'x@y.be' }, email: 'an@voorbeeld.be' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(JSON.stringify(r.antwoorden)).not.toContain('@');
  });

  it('strip HTML en dwingt de maximumlengte af', () => {
    const r = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), O1: '<b>Behouden</b> de quiz<script>x</script>' } });
    expect(r.ok && r.antwoorden.O1).toBe('Behouden de quizx');
    const lang = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), T3: 'a'.repeat(301) } });
    expect(lang.ok).toBe(false);
  });

  it('negeert onbekende sleutels', () => {
    const r = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), hack: 'x' } });
    expect(r.ok && 'hack' in r.antwoorden).toBe(false);
  });

  it('multi-select: ontdubbelen en enkel geldige opties', () => {
    const r = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), T4: ['Budget', 'Tijd', 'Budget'] } });
    expect(r.ok && r.antwoorden.T4).toEqual(['Tijd', 'Budget']);
    const fout = valideerFormulier({ antwoorden: { ...geldigeAntwoorden(), T4: ['Iets'] } });
    expect(fout.ok).toBe(false);
  });
});

describe('berekenKennisScore', () => {
  it('null als niets ingevuld', () => {
    expect(berekenKennisScore({}).kennisScore).toBeNull();
  });
  it('telt juiste antwoorden', () => {
    const r = berekenKennisScore({ K1: 'Knowledge', K2: 'De NIS2-richtlijn' });
    expect(r.kennisScore).toBe(1);
    expect(r.feedback.find((f) => f.id === 'K2')?.juisteAntwoord).toBe('De MDR (Medical Device Regulation)');
  });
});

describe('antwoordSleutels', () => {
  it('bevat de exportkolommen en nooit C2', () => {
    const keys = antwoordSleutels();
    expect(keys).toContain('B1_relevantie');
    expect(keys).toContain('L7_post');
    expect(keys).toContain('T4_anders');
    expect(keys).not.toContain('C2');
  });
});
