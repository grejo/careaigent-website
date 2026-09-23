export function datumLabel(d: Date): string {
  return d.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Brussels' });
}

export const TOEGANG_MELDING = {
  onbekend: { titel: 'Link niet gevonden', tekst: 'Deze evaluatielink is ongeldig of verlopen. Controleer de link in je mail.' },
  gesloten: { titel: 'Deze evaluatie is afgesloten', tekst: 'Je kan deze evaluatie niet meer invullen. Bedankt voor je interesse.' },
  al_ingevuld: { titel: 'Al ingevuld', tekst: 'Je hebt deze evaluatie al ingevuld via deze persoonlijke link. Bedankt!' },
  geen_open_link: {
    titel: 'Gebruik je persoonlijke link',
    tekst: 'Deze evaluatie vul je in via de persoonlijke link die je per mail ontving.',
  },
} as const;
