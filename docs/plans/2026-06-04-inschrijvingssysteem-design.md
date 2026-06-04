# Design: Inschrijvingssysteem met Admin Panel

**Datum:** 2026-06-04  
**Status:** Goedgekeurd

## Samenvatting

Migratie van de statische Netlify-site naar Next.js 14 (App Router), uitgebreid met een inschrijvingssysteem voor activiteiten, een admin panel, en koppeling met een Railway PostgreSQL database. De bestaande GitHub → Netlify CI/CD pipeline blijft intact.

---

## Architectuur

```
GitHub repo (bestaand)
  ↓ push naar main
Netlify (@netlify/plugin-nextjs)
  → Publieke pagina's (SSR/SSG)
  → API routes als Netlify Functions
  → Admin panel (/admin/*)
  ↓
Railway PostgreSQL
  → activities
  → registrations
  → admins
```

### Tech Stack

| Doel | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database ORM | Prisma |
| Database | Railway PostgreSQL |
| Admin auth | NextAuth.js v5 (Credentials Provider) |
| E-mail | Resend |
| iCal aanmaken | `ical-generator` |
| CSV/Excel export | `csv-stringify` + `exceljs` |
| Deployment | Netlify (bestaande pipeline) |

---

## Pagina's

### Publiek
| Route | Beschrijving |
|---|---|
| `/` | Home (bestaand, gemigreerd) |
| `/agenda` | Publieke lijst van alle open activiteiten |
| `/activiteiten/[slug]` | Activiteitsdetail + inschrijvingsformulier |
| `/bedankt` | Bevestigingspagina na inschrijving |
| `/resultaten` | Bestaand, gemigreerd |
| `/team` | Bestaand, gemigreerd |

### Admin (beschermd via NextAuth sessie)
| Route | Beschrijving |
|---|---|
| `/admin/login` | Login pagina |
| `/admin` | Dashboard |
| `/admin/activiteiten` | Lijst + beheer activiteiten |
| `/admin/activiteiten/nieuw` | Nieuwe activiteit aanmaken |
| `/admin/activiteiten/[id]` | Activiteit bewerken |
| `/admin/activiteiten/[id]/inschrijvingen` | Inschrijvingen per activiteit bekijken, exporteren, verwijderen |

---

## Database Schema

### `activities`
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
slug                  TEXT UNIQUE NOT NULL
title                 TEXT NOT NULL
description           TEXT
date_start            TIMESTAMP WITH TIME ZONE NOT NULL
date_end              TIMESTAMP WITH TIME ZONE
location              TEXT
max_participants      INT
registration_deadline TIMESTAMP WITH TIME ZONE
is_open               BOOLEAN DEFAULT true
extra_fields          JSONB DEFAULT '[]'
created_at            TIMESTAMP WITH TIME ZONE DEFAULT now()
```

`extra_fields` is een array van velddefinities, bijv.:
```json
[
  { "key": "begeleidingsgroep", "label": "Mijn instelling behoort tot de begeleidingsgroep van CareAIgent", "type": "radio", "options": ["Ja", "Neen"], "required": true },
  { "key": "ai_mandaat", "label": "Heeft u een formeel AI-mandaat?", "type": "radio", "options": ["Ja", "Neen", "In opbouw / informeel"], "required": true },
  { "key": "lunch", "label": "Ik neem deel aan de lunch", "type": "radio", "options": ["Ja", "Neen"], "required": true },
  { "key": "dieet", "label": "Dieetvoorkeuren of voedselallergieën", "type": "text", "required": false },
  { "key": "vragen", "label": "Specifieke vragen of verwachtingen", "type": "textarea", "required": false }
]
```

### `registrations`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
activity_id  UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE
naam         TEXT NOT NULL
voornaam     TEXT NOT NULL
email        TEXT NOT NULL
telefoon     TEXT NOT NULL
instelling   TEXT NOT NULL
functie      TEXT NOT NULL
extra_data   JSONB DEFAULT '{}'
created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
```

### `admins`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
email         TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
name          TEXT NOT NULL
created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
```

---

## API Routes

### Publiek (geen auth)
| Route | Methode | Doel |
|---|---|---|
| `/api/activities` | GET | Alle open activiteiten ophalen |
| `/api/activities/[slug]` | GET | Één activiteit ophalen |
| `/api/registrations` | POST | Nieuwe inschrijving + bevestigingsmail sturen |

### Admin (NextAuth sessie vereist)
| Route | Methode | Doel |
|---|---|---|
| `/api/admin/activities` | GET, POST | Activiteiten ophalen / aanmaken |
| `/api/admin/activities/[id]` | PUT, DELETE | Activiteit aanpassen / verwijderen |
| `/api/admin/activities/[id]/registrations` | GET | Inschrijvingen per activiteit |
| `/api/admin/activities/[id]/registrations/export` | GET | Download als CSV of Excel |
| `/api/admin/registrations/[id]` | DELETE | Inschrijving verwijderen |
| `/api/auth/[...nextauth]` | * | NextAuth login/logout |

---

## Gebruikersstromen

### Deelnemer inschrijven
1. Bezoekt `/agenda` → lijst van open activiteiten
2. Klikt op activiteit → `/activiteiten/[slug]`
3. Formulier invullen (vaste velden + activiteit-specifieke extra velden)
4. Submit → API valideert, slaat op in DB
5. Bevestigingsmail + iCal bijlage (`.ics`) verstuurd via Resend
6. Redirect naar `/bedankt`

**Grensgeval:** Als `max_participants` bereikt of `is_open = false` → formulier gedeactiveerd met melding.

### Admin activiteit aanmaken
1. Login via `/admin/login`
2. Ga naar `/admin/activiteiten/nieuw`
3. Vul naam, datum, locatie, max. deelnemers, deadline, beschrijving in
4. Configureer extra formuliervelden (toggle/add via UI)
5. Opslaan → activiteit verschijnt op `/agenda`

### Admin inschrijvingen beheren
1. Ga naar `/admin/activiteiten/[id]/inschrijvingen`
2. Bekijk tabel met alle deelnemers
3. Download als `.csv` of `.xlsx`
4. Verwijder individuele inschrijving (met bevestigingsdialoog)
5. Toggle `is_open` om inschrijvingen te openen/sluiten

---

## Beveiliging

- Admin routes server-side beveiligd via NextAuth middleware
- Wachtwoorden gehashed met `bcrypt` (salt rounds: 12)
- Eerste admin aangemaakt via `npm run seed:admin` script
- CSRF bescherming via NextAuth ingebouwd
- Input validatie met `zod` op alle API routes

---

## E-mail & iCal

Bij elke succesvolle inschrijving:
1. `ical-generator` maakt een `.ics` event aan (titel, datum, locatie, beschrijving)
2. Resend verstuurt een HTML bevestigingsmail met:
   - Samenvatting van de inschrijving
   - `.ics` bijlage
   - Contactgegevens (bv. eric.lodewyckx@pxl.be)

---

## Migratie van statische site

Alle bestaande HTML pagina's worden 1-op-1 gemigreerd naar Next.js componenten. CSS variabelen en stijlen worden overgenomen. De bestaande URL-structuur blijft behouden (geen redirects nodig). De Netlify `_redirects` file wordt vervangen door Next.js `next.config.js` redirects.
