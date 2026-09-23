import { stringify } from 'csv-stringify/sync';
import { antwoordSleutels, type Antwoorden } from './formulierA';

type ExportRij = {
  activiteit: string;
  datum: Date;
  formVersie: string;
  antwoorden: Antwoorden;
  kennisScore: number | null;
};

/**
 * CSV met één rij per antwoord en kolomnamen = vraag-ID's (P2, R1,
 * B1_relevantie, L1_pre, …). Scheidingsteken ';' en UTF-8 met BOM, zodat
 * Excel (Belgische instellingen) kolommen en accenten correct toont.
 * Meerkeuzeantwoorden worden met '; ' samengevoegd (en dus gequote).
 */
export function buildEvaluatieCsv(rijen: ExportRij[]): Buffer {
  const sleutels = antwoordSleutels();
  // C1 zit al in de antwoorden (vraag-ID); kennisScore wordt server-side berekend.
  const kolommen = ['activiteit', 'datum', 'formVersie', ...sleutels, 'kennisScore'];
  const data = rijen.map((r) => {
    const rij: Record<string, string | number> = {
      activiteit: r.activiteit,
      datum: r.datum.toISOString().slice(0, 10),
      formVersie: r.formVersie,
      kennisScore: r.kennisScore ?? '',
    };
    for (const k of sleutels) {
      const v = r.antwoorden[k];
      rij[k] = Array.isArray(v) ? v.join('; ') : v ?? '';
    }
    return rij;
  });
  const csv = stringify(data, { header: true, columns: kolommen, delimiter: ';' });
  return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(csv, 'utf-8')]);
}
