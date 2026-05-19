# SEO Optimalisatie — CareAIgent Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** careaigent.be volledig technisch optimaliseren zodat Google de site vindt, crawlt en goed rankt.

**Architecture:** Statische HTML-website op Netlify. Geen build-systeem, geen npm. Alle wijzigingen zijn directe bewerkingen van HTML/XML-bestanden + een Python-script voor afbeeldingsextractie.

**Tech Stack:** HTML, XML, Python 3 (voor base64-extractie), Netlify hosting

---

## Task 1: Base64-afbeeldingen extraheren (Page Speed)

> Dit is de meest impactvolle stap. index.html is 494KB enkel door inline base64-afbeeldingen.

**Files:**
- Create: `scripts/extract-images.py`
- Modify: `index.html`, `team.html`, `evenement.html`, `resultaten.html`
- Create: `images/` directory (automatisch)

**Stap 1: Maak het extractiescript**

Maak `scripts/extract-images.py` aan met deze inhoud:

```python
import re
import base64
import os
import sys

EXT_MAP = {"jpeg": "jpg", "jpg": "jpg", "png": "png", "gif": "gif", "webp": "webp", "svg+xml": "svg"}

def extract_images(html_file):
    with open(html_file, "r", encoding="utf-8") as f:
        content = f.read()

    os.makedirs("images", exist_ok=True)
    stem = os.path.splitext(os.path.basename(html_file))[0]
    counter = {"n": 0}

    def replacer(match):
        fmt = match.group(1)
        b64data = match.group(2).replace("\n", "").replace(" ", "")
        ext = EXT_MAP.get(fmt, fmt)
        counter["n"] += 1
        name = f"{stem}-{counter['n']:03d}.{ext}"
        path = os.path.join("images", name)
        with open(path, "wb") as imgf:
            imgf.write(base64.b64decode(b64data))
        print(f"  Saved {path}")
        return f'src="/images/{name}"'

    pattern = r'src="data:image/([a-zA-Z0-9+/]+);base64,([A-Za-z0-9+/=\n ]+?)"'
    new_content = re.sub(pattern, replacer, content)

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"Processed {html_file} ({counter['n']} images extracted)")

for html_file in sys.argv[1:]:
    extract_images(html_file)
```

**Stap 2: Voer het script uit op alle HTML-bestanden**

```bash
python3 scripts/extract-images.py index.html team.html evenement.html resultaten.html
```

Verwachte output:
```
  Saved images/index-001.jpg
  Saved images/index-002.jpg
  ...
Processed index.html (4 images extracted)
Processed team.html (3 images extracted)
Processed evenement.html (3 images extracted)
Processed resultaten.html (3 images extracted)
```

**Stap 3: Verifieer de extractie**

```bash
ls images/
wc -c index.html
```

Verwacht: 13 afbeeldingsbestanden in `images/`, en `index.html` nu kleiner dan 100KB.

**Stap 4: Hernoem de eerste afbeelding als logo (voor og:image later)**

```bash
# Controleer welk bestand het logo is (eerste in index.html)
ls -la images/index-001.jpg

# Maak een kopie als og-preview
cp images/index-001.jpg images/og-preview.jpg
```

**Stap 5: Commit**

```bash
git add images/ scripts/extract-images.py index.html team.html evenement.html resultaten.html
git commit -m "feat: extract base64 images to /images/ for better page speed"
```

---

## Task 2: Sitemap lastmod datums toevoegen

**Files:**
- Modify: `sitemap.xml`

**Stap 1: Bewerk sitemap.xml**

Vervang de inhoud van `sitemap.xml` door:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://careaigent.be/</loc>
    <lastmod>2026-05-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://careaigent.be/resultaten</loc>
    <lastmod>2026-05-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://careaigent.be/evenement</loc>
    <lastmod>2026-05-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://careaigent.be/team</loc>
    <lastmod>2026-05-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

**Stap 2: Commit**

```bash
git add sitemap.xml
git commit -m "feat: add lastmod dates to sitemap"
```

---

## Task 3: og:image toevoegen aan alle pagina's

> og:image zorgt voor een preview-afbeelding bij delen op LinkedIn, WhatsApp, etc. en verhoogt click-through rate.

**Files:**
- Modify: `index.html`, `team.html`, `evenement.html`, `resultaten.html`

**Stap 1: Voeg og:image toe aan index.html**

Zoek in `index.html` de bestaande Twitter Card meta tags:
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="CareAIgent — AI voor Slimmere Zorg in Vlaanderen">
<meta name="twitter:description" content="CareAIgent onderzoekt hoe AI de administratieve last voor zorgprofessionals in Vlaanderen kan verlichten.">
```

Voeg er **na** de `twitter:description` regel twee nieuwe regels aan toe:
```html
<meta property="og:image" content="https://careaigent.be/images/og-preview.jpg">
<meta name="twitter:image" content="https://careaigent.be/images/og-preview.jpg">
```

**Stap 2: Herhaal voor team.html**

Zoek in `team.html`:
```html
<meta name="twitter:description" content="Maak kennis met het CareAIgent-team van PXL Zorginnovatie.">
```

Voeg toe:
```html
<meta property="og:image" content="https://careaigent.be/images/og-preview.jpg">
<meta name="twitter:image" content="https://careaigent.be/images/og-preview.jpg">
```

**Stap 3: Herhaal voor evenement.html en resultaten.html**

Doe hetzelfde patroon: zoek de `twitter:description` meta tag en voeg de twee og:image regels eronder toe.

**Stap 4: Verifieer**

```bash
grep -l "og:image" index.html team.html evenement.html resultaten.html
```

Verwacht: alle 4 bestanden worden getoond.

**Stap 5: Commit**

```bash
git add index.html team.html evenement.html resultaten.html
git commit -m "feat: add og:image and twitter:image to all pages"
```

---

## Task 4: Favicon toevoegen

**Files:**
- Modify: `index.html`, `team.html`, `evenement.html`, `resultaten.html`
- Create: `images/favicon.png` (via Python)

**Stap 1: Maak favicon.png vanuit het logo**

```bash
python3 -c "
from PIL import Image
import sys

try:
    img = Image.open('images/index-001.jpg')
    img = img.resize((32, 32), Image.LANCZOS)
    img.save('images/favicon.png')
    img2 = img.resize((180, 180), Image.LANCZOS)
    img2.save('images/apple-touch-icon.png')
    print('Favicon aangemaakt')
except ImportError:
    print('Pillow niet beschikbaar — installeer met: pip3 install Pillow')
    print('Of gebruik https://favicon.io om handmatig een favicon te maken van images/index-001.jpg')
"
```

Als Pillow niet beschikbaar is: upload `images/index-001.jpg` naar https://favicon.io/favicon-converter/ en sla het resultaat op als `images/favicon.png` en `images/apple-touch-icon.png`.

**Stap 2: Voeg favicon toe aan alle HTML-pagina's**

In elk HTML-bestand, zoek de regel:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
```

Voeg **er boven** in:
```html
<link rel="icon" type="image/png" href="/images/favicon.png">
<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">
```

Doe dit in: `index.html`, `team.html`, `evenement.html`, `resultaten.html`

**Stap 3: Verifieer**

```bash
grep -l "favicon" index.html team.html evenement.html resultaten.html
```

Verwacht: alle 4 bestanden.

**Stap 4: Commit**

```bash
git add images/favicon.png images/apple-touch-icon.png index.html team.html evenement.html resultaten.html
git commit -m "feat: add favicon and apple-touch-icon to all pages"
```

---

## Task 5: Heading-structuur fixen in index.html

> Google gebruikt heading-hiërarchie (h1→h2→h3) om pagina-inhoud te begrijpen. Momenteel staan `section-title`-divs als `<div>` i.p.v. `<h2>`, en `<h3>`-kaarten missen een bovenliggende `<h2>`.

**Files:**
- Modify: `index.html`

**Stap 1: Verander section-title divs naar h2 in de probleemse­ctie**

Zoek in `index.html`:
```html
  <div class="section-title">Zorgprofessionals verdrinken in administratie</div>
```

Vervang door:
```html
  <h2 class="section-title">Zorgprofessionals verdrinken in administratie</h2>
```

**Stap 2: Verander section-title div naar h2 in de aanpak-sectie**

Zoek:
```html
      <div class="section-title">Praktijkgericht onderzoek & co-creatie</div>
```

Vervang door:
```html
      <h2 class="section-title">Praktijkgericht onderzoek & co-creatie</h2>
```

**Stap 3: Verander section-title div naar h2 in de partners-sectie**

Zoek:
```html
  <div class="section-title">Gedragen door de sector</div>
```

Vervang door:
```html
  <h2 class="section-title">Gedragen door de sector</h2>
```

**Stap 4: Verifieer heading-hiërarchie**

```bash
grep -n "<h[1-4]" index.html
```

Verwacht: één `<h1>`, gevolgd door meerdere `<h2>` tags per sectie, dan `<h3>` voor subonderdelen. Geen `<h3>` zonder bovenliggende `<h2>` in dezelfde sectie.

**Stap 5: Commit**

```bash
git add index.html
git commit -m "fix: improve heading hierarchy for SEO (section-title divs -> h2)"
```

---

## Task 6: Search Console activeren (handmatig)

> Dit is geen codewijziging maar een kritieke stap — zonder dit weet Google niet dat de site bestaat.

**Stap 1: Ga naar Google Search Console**

Navigeer naar: https://search.google.com/search-console

**Stap 2: Voeg domein toe**

- Klik op "Eigendom toevoegen"
- Kies "Domein" (niet URL-voorvoegsel)
- Vul in: `careaigent.be`

**Stap 3: Verificeer via DNS TXT-record**

Google geeft een TXT-record waarde (bv. `google-site-verification=abc123...`).

Voeg dit toe bij je domeinhoster:
- Type: `TXT`
- Naam: `@` (of leeg, afhankelijk van hoster)
- Waarde: de code van Google
- TTL: 3600

**Stap 4: Bevestig en wacht**

DNS-wijzigingen kunnen 15 min tot 24u duren. Klik daarna op "Verificeren" in Search Console.

**Stap 5: Dien de sitemap in**

Na verificatie: ga naar "Sitemaps" in het linkermenu → voeg in: `sitemap.xml` → klik "Indienen".

**Stap 6: Vraag indexering aan voor de homepage**

Gebruik de URL-inspectietool bovenaan → vul `https://careaigent.be/` in → klik "Indexering aanvragen".

---

## Verifieer eindresultaat

Nadat alle taken klaar zijn en Netlify heeft gedeployd:

```bash
# Controleer paginagrootte (moet < 100KB zijn)
curl -s -o /dev/null -w "%{size_download}" https://careaigent.be/

# Controleer sitemap
curl https://careaigent.be/sitemap.xml

# Controleer robots.txt
curl https://careaigent.be/robots.txt
```

Test de Core Web Vitals via: https://pagespeed.web.dev/report?url=https://careaigent.be/

Doel: score > 80 op Performance (was waarschijnlijk < 30 door base64-afbeeldingen).
