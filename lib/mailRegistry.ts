// Eén bron van waarheid per mailsoort: label/uitleg voor /admin/mail, welke
// velden instelbaar zijn, de standaardteksten (token-templates), de builder en
// een voorbeeldcontext. `MAIL_REGISTRY` is getypeerd als
// `{ [S in MailSoort]: ... }`: een nieuwe enumwaarde zonder entry is een
// compileerfout. Zelfde opzet als de Verpleegkunde-site.
import { MailSoort } from '@prisma/client';
import {
  renderEmail,
  resolveTeksten,
  formatDatum,
  formatUur,
  type MailStandaardTeksten,
  type MailTekstOverrides,
} from './emailTemplate';
import { generateIcal } from './ical';
import { siteUrl } from './site';

type ActiviteitInfo = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  dateStart: Date;
  dateEnd?: Date | null;
  location?: string | null;
};

export type InschrijvingBevestigingContext = {
  voornaam: string;
  naam: string;
  activiteit: ActiviteitInfo;
};

export type InschrijvingMeldingContext = {
  voornaam: string;
  naam: string;
  email: string;
  telefoon: string;
  instelling: string;
  functie: string;
  activiteit: ActiviteitInfo;
  aantalInschrijvingen: number;
  maxDeelnemers: number | null;
};

export type EvaluatieMeldingContext = {
  activiteit: ActiviteitInfo;
  aantalEvaluaties: number;
};

export type DeelnemerUitnodigingContext = {
  voornaam: string | null;
  activiteit: ActiviteitInfo;
  /** Persoonlijke evaluatielink, of null als die niet meegestuurd wordt. */
  evaluatieUrl: string | null;
  /** Persoonlijke handoutpagina met alle documenten, of null zonder bijlagen. */
  handouts: Handouts | null;
};

export type Handouts = { url: string; titels: string[] };

export type MailContextMap = {
  INSCHRIJVING_BEVESTIGING: InschrijvingBevestigingContext;
  INSCHRIJVING_MELDING_ADMIN: InschrijvingMeldingContext;
  EVALUATIE_MELDING_ADMIN: EvaluatieMeldingContext;
  DEELNEMER_EVALUATIE_UITNODIGING: DeelnemerUitnodigingContext;
};

export type MailAttachment = { name: string; contentType: string; contentBytes: string };

export type MailSoortDefinitie<S extends MailSoort = MailSoort> = {
  soort: S;
  label: string;
  beschrijving: string;
  ontvangersUitleg: string;
  /** CONTEXT: ontvanger volgt uit de gebeurtenis. INSTELBAAR: vast adres in /admin/mail. */
  ontvangerModus: 'CONTEXT' | 'INSTELBAAR';
  /** CONTEXT: reply-to volgt uit de gebeurtenis. INSTELBAAR: eigen of globale reply-to. */
  replyToModus: 'CONTEXT' | 'INSTELBAAR';
  ontvangerVerplicht?: boolean;
  ontvangerNaamVast?: string;
  defaultEnabled: boolean;
  standaard: MailStandaardTeksten;
  tokens: readonly string[];
  tokensVan: (ctx: MailContextMap[S]) => Record<string, string>;
  build: (ctx: MailContextMap[S], overrides?: MailTekstOverrides) => { subject: string; html: string };
  /** Optionele bijlagen in de webhook-payload (de flow moet ze zelf verwerken). */
  bijlagen?: (ctx: MailContextMap[S]) => MailAttachment[];
  voorbeeldContext: () => MailContextMap[S];
  payloadContext: (ctx: MailContextMap[S]) => Record<string, unknown>;
};

function wanneer(a: ActiviteitInfo): string {
  const datum = formatDatum(a.dateStart);
  return a.dateEnd ? `${datum}, ${formatUur(a.dateStart)} – ${formatUur(a.dateEnd)}` : `${datum}, ${formatUur(a.dateStart)}`;
}

/**
 * Token in de voorbeeldlinks van testmails met voorbeeldgegevens (Admin › Mail,
 * voorbeeld op het deelnemersmail-scherm). De evaluatie- en handoutpagina's
 * tonen hiervoor een uitleg in plaats van "link niet gevonden".
 */
export const VOORBEELD_TOKEN = 'voorbeeld';

function voorbeeldActiviteit(): ActiviteitInfo {
  const start = new Date();
  start.setDate(start.getDate() + 14);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(13, 0, 0, 0);
  return {
    id: 'voorbeeld',
    slug: 'ai-ambassadeur-in-de-zorg',
    title: 'Train de Trainer: AI-Ambassadeur in de Zorg',
    description: 'Halve dag opleiding voor AI-ambassadeurs.',
    dateStart: start,
    dateEnd: end,
    location: 'PXL NEXT, Hasselt',
  };
}

// ─── INSCHRIJVING_BEVESTIGING ───────────────────────────────────────────────

const BEVESTIGING_TOKENS = ['voornaam', 'naam', 'activiteit', 'datum'] as const;
const BEVESTIGING_STANDAARD: MailStandaardTeksten = {
  subject: 'Bevestiging inschrijving: {activiteit}',
  intro:
    'Beste {voornaam},\n\nJe inschrijving voor {activiteit} is bevestigd. Hieronder vind je de praktische info. Met de knop voeg je de activiteit toe aan je agenda.',
  footerNote: 'Vragen? Mail naar eric.lodewyckx@pxl.be.\nMet vriendelijke groeten, het CareAIgent-team – PXL Zorginnovatie',
};

function bevestigingTokens(ctx: InschrijvingBevestigingContext) {
  return {
    voornaam: ctx.voornaam,
    naam: ctx.naam,
    activiteit: ctx.activiteit.title,
    datum: formatDatum(ctx.activiteit.dateStart),
  };
}

function buildBevestiging(ctx: InschrijvingBevestigingContext, overrides?: MailTekstOverrides) {
  const t = resolveTeksten(BEVESTIGING_STANDAARD, overrides, bevestigingTokens(ctx));
  const a = ctx.activiteit;
  return renderEmail({
    subject: t.subject,
    eyebrow: 'Inschrijving bevestigd',
    heading: a.title,
    intro: t.intro,
    badge: { text: 'Bevestigd', kind: 'success' },
    detailRows: [
      { label: 'Wanneer', waarde: wanneer(a) },
      { label: 'Locatie', waarde: a.location || 'Wordt later meegedeeld' },
      { label: 'Info', waarde: 'Activiteitspagina', link: `${siteUrl()}/activiteiten/${a.slug}` },
    ],
    ctaLabel: 'Toevoegen aan agenda',
    ctaUrl: `${siteUrl()}/api/activities/${a.slug}/ics`,
    footerNote: t.footerNote,
  });
}

// ─── INSCHRIJVING_MELDING_ADMIN ─────────────────────────────────────────────

const MELDING_TOKENS = ['voornaam', 'naam', 'activiteit', 'instelling'] as const;
const MELDING_STANDAARD: MailStandaardTeksten = {
  subject: 'Nieuwe inschrijving: {activiteit} ({voornaam} {naam})',
  intro: 'Er is een nieuwe inschrijving binnengekomen via careaigent.be.',
  footerNote: 'Automatische melding van careaigent.be. Beantwoord deze mail om de deelnemer te contacteren.',
};

function buildMelding(ctx: InschrijvingMeldingContext, overrides?: MailTekstOverrides) {
  const t = resolveTeksten(MELDING_STANDAARD, overrides, {
    voornaam: ctx.voornaam,
    naam: ctx.naam,
    activiteit: ctx.activiteit.title,
    instelling: ctx.instelling,
  });
  const bezetting = ctx.maxDeelnemers
    ? `${ctx.aantalInschrijvingen} / ${ctx.maxDeelnemers}`
    : String(ctx.aantalInschrijvingen);
  return renderEmail({
    subject: t.subject,
    eyebrow: 'Nieuwe inschrijving',
    heading: `${ctx.voornaam} ${ctx.naam}`,
    intro: t.intro,
    badge: { text: 'Nieuw', kind: 'info' },
    detailRows: [
      { label: 'Activiteit', waarde: ctx.activiteit.title },
      { label: 'Datum', waarde: wanneer(ctx.activiteit) },
      { label: 'E-mail', waarde: ctx.email },
      { label: 'Telefoon', waarde: ctx.telefoon },
      { label: 'Instelling', waarde: ctx.instelling },
      { label: 'Functie', waarde: ctx.functie },
      { label: 'Inschrijvingen', waarde: bezetting },
    ],
    ctaLabel: 'Bekijk inschrijvingen',
    ctaUrl: `${siteUrl()}/admin/activiteiten/${ctx.activiteit.id}/inschrijvingen`,
    footerNote: t.footerNote,
  });
}

// ─── EVALUATIE_MELDING_ADMIN ────────────────────────────────────────────────

const EVAL_MELDING_TOKENS = ['activiteit', 'aantal'] as const;
const EVAL_MELDING_STANDAARD: MailStandaardTeksten = {
  subject: 'Nieuwe evaluatie: {activiteit} ({aantal} in totaal)',
  intro:
    'Er is een nieuwe evaluatie ingevuld. De antwoorden zijn anoniem en staan niet in deze mail; bekijk ze in het dashboard.',
  footerNote: 'Automatische melding van careaigent.be.',
};

function buildEvalMelding(ctx: EvaluatieMeldingContext, overrides?: MailTekstOverrides) {
  const t = resolveTeksten(EVAL_MELDING_STANDAARD, overrides, {
    activiteit: ctx.activiteit.title,
    aantal: String(ctx.aantalEvaluaties),
  });
  return renderEmail({
    subject: t.subject,
    eyebrow: 'Nieuwe evaluatie',
    heading: ctx.activiteit.title,
    intro: t.intro,
    badge: { text: `${ctx.aantalEvaluaties} evaluatie${ctx.aantalEvaluaties === 1 ? '' : 's'}`, kind: 'info' },
    ctaLabel: 'Open het dashboard',
    ctaUrl: `${siteUrl()}/admin/evaluatie?activiteit=${ctx.activiteit.id}`,
    footerNote: t.footerNote,
  });
}

// ─── DEELNEMER_EVALUATIE_UITNODIGING ────────────────────────────────────────

const UITNODIGING_TOKENS = ['voornaam', 'activiteit', 'datum'] as const;
const UITNODIGING_STANDAARD: MailStandaardTeksten = {
  subject: 'Bedankt voor je deelname: {activiteit}',
  intro:
    'Beste {voornaam},\n\nBedankt voor je deelname aan {activiteit} op {datum}. Wil je de opleiding evalueren? Dat duurt ongeveer 6 minuten en je antwoorden zijn anoniem. De link is persoonlijk en kan maar één keer gebruikt worden.',
  footerNote: 'Met vriendelijke groeten,\nHet CareAIgent-team – PXL Zorginnovatie',
};

function buildUitnodiging(ctx: DeelnemerUitnodigingContext, overrides?: MailTekstOverrides) {
  const t = resolveTeksten(UITNODIGING_STANDAARD, overrides, {
    voornaam: ctx.voornaam || 'deelnemer',
    activiteit: ctx.activiteit.title,
    datum: formatDatum(ctx.activiteit.dateStart),
  });
  return renderEmail({
    subject: t.subject,
    eyebrow: ctx.evaluatieUrl ? 'Evaluatie' : 'Opleidingsmateriaal',
    heading: ctx.activiteit.title,
    intro: t.intro,
    ctaLabel: ctx.evaluatieUrl ? 'Vul de evaluatie in' : undefined,
    ctaUrl: ctx.evaluatieUrl ?? undefined,
    knoppenTitel: ctx.handouts ? 'Documenten om te downloaden' : undefined,
    knoppen: ctx.handouts ? [{ label: 'Download de handouts', url: ctx.handouts.url }] : [],
    knoppenLijst: ctx.handouts?.titels,
    footerNote: t.footerNote,
  });
}

export const MAIL_REGISTRY: { [S in MailSoort]: MailSoortDefinitie<S> } = {
  [MailSoort.INSCHRIJVING_BEVESTIGING]: {
    soort: MailSoort.INSCHRIJVING_BEVESTIGING,
    label: 'Bevestiging inschrijving',
    beschrijving: 'Verstuurd zodra iemand zich inschrijft voor een activiteit.',
    ontvangersUitleg: 'De persoon die zich inschreef.',
    ontvangerModus: 'CONTEXT',
    replyToModus: 'INSTELBAAR',
    defaultEnabled: true,
    standaard: BEVESTIGING_STANDAARD,
    tokens: BEVESTIGING_TOKENS,
    tokensVan: bevestigingTokens,
    build: buildBevestiging,
    bijlagen: (ctx) => [
      {
        name: 'uitnodiging.ics',
        contentType: 'text/calendar; charset=utf-8',
        contentBytes: Buffer.from(generateIcal(ctx.activiteit)).toString('base64'),
      },
    ],
    voorbeeldContext: () => ({ voornaam: 'An', naam: 'Peeters', activiteit: voorbeeldActiviteit() }),
    payloadContext: (ctx) => ({
      type: MailSoort.INSCHRIJVING_BEVESTIGING,
      activiteit: ctx.activiteit.title,
      start: ctx.activiteit.dateStart.toISOString(),
    }),
  },

  [MailSoort.INSCHRIJVING_MELDING_ADMIN]: {
    soort: MailSoort.INSCHRIJVING_MELDING_ADMIN,
    label: 'Melding nieuwe inschrijving (admin)',
    beschrijving: 'Verstuurd naar het team bij elke nieuwe inschrijving.',
    ontvangersUitleg: 'Het hieronder ingestelde adres. Reply-to is de deelnemer.',
    ontvangerModus: 'INSTELBAAR',
    replyToModus: 'CONTEXT',
    ontvangerVerplicht: true,
    ontvangerNaamVast: 'CareAIgent-team',
    defaultEnabled: false,
    standaard: MELDING_STANDAARD,
    tokens: MELDING_TOKENS,
    tokensVan: (ctx) => ({
      voornaam: ctx.voornaam,
      naam: ctx.naam,
      activiteit: ctx.activiteit.title,
      instelling: ctx.instelling,
    }),
    build: buildMelding,
    voorbeeldContext: () => ({
      voornaam: 'An',
      naam: 'Peeters',
      email: 'an.peeters@voorbeeld.be',
      telefoon: '0470 00 00 00',
      instelling: 'WZC Voorbeeld',
      functie: 'Innovatiecoördinator',
      activiteit: voorbeeldActiviteit(),
      aantalInschrijvingen: 12,
      maxDeelnemers: 25,
    }),
    payloadContext: (ctx) => ({
      type: MailSoort.INSCHRIJVING_MELDING_ADMIN,
      activiteit: ctx.activiteit.title,
      deelnemer: ctx.email,
    }),
  },

  [MailSoort.EVALUATIE_MELDING_ADMIN]: {
    soort: MailSoort.EVALUATIE_MELDING_ADMIN,
    label: 'Melding nieuwe evaluatie (admin)',
    beschrijving: 'Verstuurd naar het team bij elke ingevulde evaluatie. Bevat geen antwoorden.',
    ontvangersUitleg: 'Het hieronder ingestelde adres.',
    ontvangerModus: 'INSTELBAAR',
    replyToModus: 'INSTELBAAR',
    ontvangerVerplicht: true,
    ontvangerNaamVast: 'CareAIgent-team',
    defaultEnabled: false,
    standaard: EVAL_MELDING_STANDAARD,
    tokens: EVAL_MELDING_TOKENS,
    tokensVan: (ctx) => ({ activiteit: ctx.activiteit.title, aantal: String(ctx.aantalEvaluaties) }),
    build: buildEvalMelding,
    voorbeeldContext: () => ({ activiteit: voorbeeldActiviteit(), aantalEvaluaties: 7 }),
    payloadContext: (ctx) => ({
      type: MailSoort.EVALUATIE_MELDING_ADMIN,
      activiteit: ctx.activiteit.title,
      aantal: ctx.aantalEvaluaties,
    }),
  },

  [MailSoort.DEELNEMER_EVALUATIE_UITNODIGING]: {
    soort: MailSoort.DEELNEMER_EVALUATIE_UITNODIGING,
    label: 'Mail naar deelnemers (evaluatie en documenten)',
    beschrijving:
      'Verstuurd vanuit Activiteiten › Mail naar deelnemers. Bevat de persoonlijke evaluatielink en/of een knop naar de handoutpagina.',
    ontvangersUitleg: 'De deelnemers die je op dat scherm bevestigt of manueel toevoegt.',
    ontvangerModus: 'CONTEXT',
    replyToModus: 'INSTELBAAR',
    defaultEnabled: true,
    standaard: UITNODIGING_STANDAARD,
    tokens: UITNODIGING_TOKENS,
    tokensVan: (ctx) => ({
      voornaam: ctx.voornaam || 'deelnemer',
      activiteit: ctx.activiteit.title,
      datum: formatDatum(ctx.activiteit.dateStart),
    }),
    build: buildUitnodiging,
    voorbeeldContext: () => ({
      voornaam: 'An',
      activiteit: voorbeeldActiviteit(),
      evaluatieUrl: `${siteUrl()}/evaluatie/t/${VOORBEELD_TOKEN}`,
      handouts: {
        url: `${siteUrl()}/d/${VOORBEELD_TOKEN}`,
        titels: ['Slides AI-Ambassadeur (pdf)', 'Werkblad prompts (docx)'],
      },
    }),
    payloadContext: (ctx) => ({
      type: MailSoort.DEELNEMER_EVALUATIE_UITNODIGING,
      activiteit: ctx.activiteit.title,
      evaluatie: Boolean(ctx.evaluatieUrl),
      downloads: ctx.handouts?.titels.length ?? 0,
    }),
  },
};

export const MAIL_SOORT_VOLGORDE: MailSoort[] = [
  MailSoort.INSCHRIJVING_BEVESTIGING,
  MailSoort.INSCHRIJVING_MELDING_ADMIN,
  MailSoort.EVALUATIE_MELDING_ADMIN,
  MailSoort.DEELNEMER_EVALUATIE_UITNODIGING,
];

export function isMailSoort(value: string): value is MailSoort {
  return Object.prototype.hasOwnProperty.call(MAIL_REGISTRY, value);
}

// Voor routes waar de soort pas tijdens het verzoek bekend is.
export function voorbeeldContextFor(soort: MailSoort): unknown {
  return MAIL_REGISTRY[soort].voorbeeldContext();
}

export function buildMail(
  soort: MailSoort,
  ctx: unknown,
  overrides?: MailTekstOverrides,
): { subject: string; html: string } {
  return MAIL_REGISTRY[soort].build(ctx as never, overrides);
}

export function payloadContextFor(soort: MailSoort, ctx: unknown): Record<string, unknown> {
  return MAIL_REGISTRY[soort].payloadContext(ctx as never);
}
