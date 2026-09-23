/** Publieke basis-URL voor links in mails (zonder slash op het einde). */
export function siteUrl(): string {
  const url = process.env.SITE_URL || process.env.NEXTAUTH_URL || 'https://careaigent.be';
  return url.replace(/\/+$/, '');
}
