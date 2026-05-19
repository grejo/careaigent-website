# SEO Optimalisatie — CareAIgent
**Datum:** 2026-05-19
**Aanpak:** Technische SEO (Aanpak B)
**Doel:** Website vindbaar maken via Google voor naamsbekendheid én het aantrekken van partners/zorginstellingen

---

## Context

- Site: careaigent.be (statische HTML, gehost op Netlify)
- Status: live maar niet aangemeld bij Google Search Console
- Hoofdprobleem: Google heeft de site nog nooit gecrawld
- Kritiek technisch probleem: index.html is 494KB door base64-ingesloten afbeeldingen → slechte Core Web Vitals

---

## Sectie 1 — Indexering via Google Search Console

**Probleem:** Google kent de site niet.

**Oplossing (handmatig door eigenaar):**
1. Ga naar https://search.google.com/search-console
2. Voeg domein `careaigent.be` toe
3. Verifieer via DNS TXT-record bij je domeinhoster of Netlify DNS
4. Dien de sitemap in: `https://careaigent.be/sitemap.xml`

Dit vereist geen codewijziging. De instructies worden gedocumenteerd.

---

## Sectie 2 — Page Speed / Core Web Vitals

**Probleem:** Alle afbeeldingen zitten als base64 inline in de HTML. Dit maakt index.html ~494KB en zorgt voor:
- Trage Time to First Byte (TTFB)
- Slechte Largest Contentful Paint (LCP)
- Google straft dit af in rankings

**Oplossing:**
- Base64-afbeeldingen extraheren naar `/images/*.webp`
- `<img src="data:image/...">` vervangen door `<img src="/images/naam.webp">`
- Resultaat: HTML van ~494KB naar ~50KB; afbeeldingen worden gecached

Geldt voor: `index.html`, `team.html`, `evenement.html`, `resultaten.html`

---

## Sectie 3 — Sitemap verbeteren

**Probleem:** Sitemap mist `<lastmod>` datums.

**Oplossing:** `<lastmod>2026-05-19</lastmod>` toevoegen per URL in `sitemap.xml`.

---

## Sectie 4 — og:image (sociale preview)

**Probleem:** Geen `og:image` op pagina's → geen preview bij delen op LinkedIn/WhatsApp.

**Oplossing:**
- Eén standaard preview-afbeelding aanmaken: `/images/og-preview.webp`
- Toevoegen aan alle HTML-pagina's:
  ```html
  <meta property="og:image" content="https://careaigent.be/images/og-preview.webp">
  <meta name="twitter:image" content="https://careaigent.be/images/og-preview.webp">
  ```

---

## Sectie 5 — Favicon

**Probleem:** Geen favicon → ontbreekt in browsertabblad en Google zoekresultaten.

**Oplossing:**
- Favicon genereren vanuit bestaand logo
- Toevoegen aan alle HTML-pagina's:
  ```html
  <link rel="icon" type="image/png" href="/images/favicon.png">
  <link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
  ```

---

## Sectie 6 — Heading-structuur

**Probleem:** In `index.html` staan `<h3>`-tags in de probleemse­ctie zonder bovenliggende `<h2>`. Semantisch incorrect voor Google.

**Oplossing:** Elke sectie controleren op correcte h1→h2→h3 hiërarchie en corrigeren waar nodig.

---

## Uitvoervolgorde

| Prioriteit | Taak | Impact | Inspanning |
|---|---|---|---|
| 1 | Search Console + sitemap indienen | Hoog | Laag (handmatig) |
| 2 | Base64-afbeeldingen extraheren | Hoog | Middel |
| 3 | Sitemap lastmod toevoegen | Middel | Laag |
| 4 | og:image toevoegen | Middel | Laag |
| 5 | Favicon toevoegen | Laag | Laag |
| 6 | Heading-structuur fixen | Middel | Laag |

---

## Buiten scope (fase 2)

- Keyword-gerichte content optimalisatie
- FAQ-secties toevoegen
- Backlinks via PXL-website en VLAIO stimuleren
