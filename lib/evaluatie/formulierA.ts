// Vraagdefinitie van evaluatieformulier A (bron: CareAIgent_Evaluatie_Workshop_
// Implementatie.md §4). Het formulier, de validatie, het dashboard en de
// CSV-export worden allemaal uit deze config opgebouwd.
//
// LET OP: dit bestand gaat mee naar de browser. De juiste antwoorden van de
// kennischeck staan daarom NIET hier maar in `kennischeck.server.ts`.
//
// De sessiekeuze (P1) is geen vraag in deze config: de editie is de
// activiteit zelf (activityId), gekozen via ?editie=<slug> of de persoonlijke link.

export const FORM_VERSIE = 'A-2026-09';

export type Schaal = { min: number; max: number; minLabel: string; maxLabel: string; labels?: string[] };

export const LIKERT5: Schaal = {
  min: 1,
  max: 5,
  minLabel: 'helemaal oneens',
  maxLabel: 'helemaal eens',
  labels: ['helemaal oneens', 'oneens', 'neutraal', 'eens', 'helemaal eens'],
};
export const COMPETENTIE5: Schaal = {
  min: 1,
  max: 5,
  minLabel: 'helemaal niet',
  maxLabel: 'zeer goed',
  labels: ['helemaal niet', 'beperkt', 'redelijk', 'goed', 'zeer goed'],
};
export const BLOK5: Schaal = { min: 1, max: 5, minLabel: 'zwak', maxLabel: 'sterk' };
export const NPS: Schaal = { min: 0, max: 10, minLabel: 'zeker niet', maxLabel: 'zeker wel' };

type Basis = { id: string; tekst: string; verplicht: boolean; hulptekst?: string };

export type Vraag =
  | (Basis & { type: 'single'; opties: string[] })
  | (Basis & { type: 'single_met_andere'; opties: string[] })
  | (Basis & { type: 'multi_met_andere'; opties: string[] })
  | (Basis & { type: 'likert5' })
  | (Basis & { type: 'nps' })
  | (Basis & { type: 'prepost' })
  | (Basis & {
      type: 'matrix';
      rijen: { id: string; label: string }[];
      kolommen: { id: string; label: string }[];
    })
  | (Basis & { type: 'tekst_kort' | 'tekst_lang'; max: number })
  | (Basis & { type: 'email'; toonAls: { vraag: string; waarde: string } });

export type Sectie = {
  id: string;
  titel: string;
  kirkpatrick?: number;
  instructie?: string;
  optioneel?: boolean;
  vragen: Vraag[];
};

export const ANDERE = 'Andere';

export const SECTIES: Sectie[] = [
  {
    id: 'profiel',
    titel: 'Over jou',
    vragen: [
      {
        id: 'P2',
        type: 'single_met_andere',
        verplicht: true,
        tekst: 'Wat is je functie?',
        opties: ['Leidinggevende', 'Innovatiecoördinator', 'Kwaliteitsverantwoordelijke', 'Manager', ANDERE],
      },
      {
        id: 'P3',
        type: 'single_met_andere',
        verplicht: true,
        tekst: 'In welk type instelling werk je?',
        opties: ['Ziekenhuis', 'Woonzorgcentrum', 'Thuiszorg', 'Geestelijke gezondheidszorg', 'Eerstelijn', ANDERE],
      },
      {
        id: 'P4',
        type: 'single',
        verplicht: true,
        tekst: 'Heb je een formeel AI-mandaat in je instelling?',
        opties: ['Ja', 'In voorbereiding', 'Nee'],
      },
    ],
  },
  {
    id: 'reactie',
    titel: 'Jouw ervaring',
    kirkpatrick: 1,
    vragen: [
      { id: 'R1', type: 'likert5', verplicht: true, tekst: 'De inhoud sloot aan bij mijn rol en de noden van mijn instelling.' },
      { id: 'R2', type: 'likert5', verplicht: true, tekst: 'De doelstellingen van de opleiding waren duidelijk.' },
      {
        id: 'R3',
        type: 'likert5',
        verplicht: true,
        tekst:
          'De werkvormen (herkenningsoefening, regelgevingsquiz, stakeholderanalyse, 100-dagenplan) hielpen me de inhoud toe te passen.',
      },
      { id: 'R4', type: 'likert5', verplicht: true, tekst: 'De verhouding tussen theorie en praktijk was goed.' },
      { id: 'R5', type: 'likert5', verplicht: true, tekst: 'De halve dag was de tijdsinvestering waard.' },
      { id: 'R6', type: 'likert5', verplicht: true, tekst: 'De organisatie en de locatie waren in orde.' },
      {
        id: 'R7',
        type: 'matrix',
        verplicht: true,
        tekst: 'Geef per blok een score van 1 (zwak) tot 5 (sterk).',
        rijen: [
          { id: 'B1', label: 'Blok 1 – De wereld van AI in de zorg' },
          { id: 'B2', label: 'Blok 2 – Regelgeving: van angst naar houvast' },
          { id: 'B3', label: 'Blok 3 – AI implementeren: van plan naar praktijk' },
          { id: 'B4', label: 'Blok 4 – Jouw rol als AI-ambassadeur' },
        ],
        kolommen: [
          { id: 'relevantie', label: 'Relevantie' },
          { id: 'uitwerking', label: 'Uitwerking' },
        ],
      },
      {
        id: 'R8',
        type: 'nps',
        verplicht: true,
        tekst: 'Hoe waarschijnlijk is het dat je deze opleiding aanbeveelt aan een collega?',
      },
    ],
  },
  {
    id: 'leren',
    titel: 'Wat heb je geleerd?',
    kirkpatrick: 2,
    instructie:
      'Geef voor elke uitspraak twee scores: hoe goed je dit kon VÓÓR de opleiding, en hoe goed je het NU kan. 1 = helemaal niet, 5 = zeer goed.',
    vragen: [
      { id: 'L1', type: 'prepost', verplicht: true, tekst: "Ik kan de kern van de AI Act, GDPR en MDR in begrijpelijke taal uitleggen aan collega's." },
      { id: 'L2', type: 'prepost', verplicht: true, tekst: 'Ik kan een eenvoudige AI-risicobeoordeling uitvoeren voor een concreet gebruik in mijn instelling.' },
      { id: 'L3', type: 'prepost', verplicht: true, tekst: "Ik kan shadow AI herkennen en collega's begeleiden naar veilige alternatieven." },
      { id: 'L4', type: 'prepost', verplicht: true, tekst: 'Ik kan een stappenplan voor AI-adoptie opzetten met het ADKAR-model.' },
      { id: 'L5', type: 'prepost', verplicht: true, tekst: 'Ik kan fungeren als aanspreekpunt tussen werkvloer, directie en leveranciers.' },
      { id: 'L6', type: 'prepost', verplicht: true, tekst: 'Ik kan een interne AI-policy opstellen of mee beoordelen.' },
      { id: 'L7', type: 'prepost', verplicht: true, tekst: 'Ik kan uitleggen wat het competentieprofiel van een AI-ambassadeur inhoudt.' },
    ],
  },
  {
    id: 'kennis',
    titel: 'Korte kennischeck',
    kirkpatrick: 2,
    optioneel: true,
    instructie: 'Drie korte vragen. Je mag ze overslaan. Na het verzenden zie je meteen de juiste antwoorden.',
    vragen: [
      {
        id: 'K1',
        type: 'single',
        verplicht: false,
        tekst: 'Welke fase volgt in het ADKAR-model op Desire?',
        opties: ['Awareness', 'Knowledge', 'Ability', 'Reinforcement'],
      },
      {
        id: 'K2',
        type: 'single',
        verplicht: false,
        tekst: 'Een AI-tool die zorgverleners ondersteunt bij een diagnose, valt mogelijk ook onder…',
        opties: ['CCB Cyber Fundamentals', 'De MDR (Medical Device Regulation)', 'De NIS2-richtlijn', 'Geen enkele extra regelgeving'],
      },
      {
        id: 'K3',
        type: 'single',
        verplicht: false,
        tekst: 'Wat is shadow AI?',
        opties: [
          'Gebruik van AI-tools buiten het zicht of de goedkeuring van de organisatie',
          'AI die zonder internetverbinding werkt',
          'AI in medische beeldvorming',
          'Een verouderd AI-model',
        ],
      },
    ],
  },
  {
    id: 'transfer',
    titel: 'Aan de slag',
    kirkpatrick: 3,
    vragen: [
      { id: 'T1', type: 'likert5', verplicht: true, tekst: 'Ik voel me voldoende uitgerust om de rol van AI-ambassadeur op te nemen.' },
      { id: 'T2', type: 'likert5', verplicht: true, tekst: 'Ik start binnen de maand met mijn 100-dagenplan.' },
      { id: 'T3', type: 'tekst_kort', verplicht: false, max: 300, tekst: 'Wat is de eerste concrete stap die je zet in je instelling?' },
      {
        id: 'T4',
        type: 'multi_met_andere',
        verplicht: false,
        tekst: 'Welke drempels verwacht je?',
        opties: ['Tijd', 'Steun van directie', 'IT- of EPD-integratie', 'Budget', 'Juridische onzekerheid', "Weerstand bij collega's", ANDERE],
      },
      {
        id: 'T5',
        type: 'single',
        verplicht: false,
        tekst: 'Heb je interesse in de peer learning community of het vervolgtraject?',
        opties: ['Ja', 'Misschien', 'Nee'],
      },
    ],
  },
  {
    id: 'open',
    titel: 'Jouw feedback',
    vragen: [
      { id: 'O1', type: 'tekst_lang', verplicht: false, max: 1000, tekst: 'Wat moeten we zeker behouden?' },
      { id: 'O2', type: 'tekst_lang', verplicht: false, max: 1000, tekst: 'Wat moeten we veranderen of schrappen?' },
      { id: 'O3', type: 'tekst_lang', verplicht: false, max: 1000, tekst: 'Welk onderwerp miste je?' },
    ],
  },
  {
    id: 'toestemming',
    titel: 'Opvolging',
    vragen: [
      {
        id: 'C1',
        type: 'single',
        verplicht: true,
        tekst: 'Mogen we je over 3 maanden een korte opvolgvragenlijst (3 minuten) sturen?',
        opties: ['Ja', 'Nee'],
      },
      {
        id: 'C2',
        type: 'email',
        verplicht: false,
        toonAls: { vraag: 'C1', waarde: 'Ja' },
        tekst: 'Je e-mailadres',
        hulptekst:
          'Je e-mailadres wordt apart bewaard en niet gekoppeld aan je antwoorden. We gebruiken het alleen voor deze ene opvolgbevraging.',
      },
    ],
  },
];

export const ALLE_VRAGEN: Vraag[] = SECTIES.flatMap((s) => s.vragen);

/** Vraag-ID's van open tekstantwoorden (voor dashboard en anonimiseren). */
export const OPEN_VRAGEN = ALLE_VRAGEN.filter(
  (v): v is Extract<Vraag, { type: 'tekst_kort' | 'tekst_lang' }> => v.type === 'tekst_kort' || v.type === 'tekst_lang',
);

/** Waarde van een antwoord: getal, tekst of lijst van teksten. */
export type Antwoordwaarde = string | number | string[];
export type Antwoorden = Record<string, Antwoordwaarde>;

/** Alle antwoordsleutels in vaste volgorde (ook de kolommen van de CSV-export). */
export function antwoordSleutels(): string[] {
  const keys: string[] = [];
  for (const v of ALLE_VRAGEN) {
    switch (v.type) {
      case 'email':
        break; // nooit in de antwoorden
      case 'matrix':
        for (const r of v.rijen) for (const k of v.kolommen) keys.push(`${r.id}_${k.id}`);
        break;
      case 'prepost':
        keys.push(`${v.id}_pre`, `${v.id}_post`);
        break;
      case 'single_met_andere':
      case 'multi_met_andere':
        keys.push(v.id, `${v.id}_anders`);
        break;
      default:
        keys.push(v.id);
    }
  }
  return keys;
}

export const PRIVACY_KORT =
  'Deze evaluatie is anoniem. We vragen geen naam.';
export const PRIVACY_LANG =
  'Je antwoorden gebruiken we alleen om de opleiding AI-Ambassadeur in de Zorg te verbeteren en om geanonimiseerd te rapporteren over het CareAIgent-project (PXL Zorginnovatie). Als je kiest voor een opvolgbevraging, bewaren we je e-mailadres apart van je antwoorden en verwijderen we het na maximaal 6 maanden. Vragen? Mail naar joachim.gregoor@pxl.be.';
export const PRIVACY_PERSOONLIJKE_LINK =
  'Je ontving een persoonlijke link zodat je maar één keer kan invullen. We registreren alleen dát je invulde, niet wat je antwoordde.';
