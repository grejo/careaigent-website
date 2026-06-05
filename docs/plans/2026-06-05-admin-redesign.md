# Admin Redesign — Design Document

## Doel

De admin-sectie visueel op niveau brengen van de publieke site: sidebar vervangen door een topnav (zoals `Nav.tsx`), content full-width met goede spacing, stat cards en tabellen gepolijst.

## Architectuur

### AdminNav component (nieuw)
- `components/AdminNav.tsx` — Client component, gelijkend op `Nav.tsx`
- Bevat: logo + "Admin" badge, links (Dashboard · Activiteiten), Uitloggen knop (teal nav-cta stijl)
- Hamburger + mobiel menu voor kleine schermen
- Uitloggen via Server Action (zelfde patroon als huidige sidebar)

### AdminLayout (`app/admin/layout.tsx`)
- Sidebar verwijderen
- `AdminNav` renderen bovenaan (alleen als `session` aanwezig)
- Content wrapper: `<main className="admin-main">` met `padding-top` voor de vaste nav

### CSS (`app/globals.css`)
Nieuwe klassen:
- `.admin-nav-badge` — "Admin" pill naast het logo
- `.admin-main` — vervangt `.admin-content`, full-width, off-white, padding-top 80px, content max-width 1040px gecentreerd
- `.admin-stat-card` — grotere kaart met teal boverand (zelfde patroon als `.activity-form-card-header`)
- `.admin-stat-number`, `.admin-stat-label` — getallen/labels in stat cards
- `.admin-table` verbeteren — witte achtergrond, row hover, betere spacing

Verwijderen: `.admin-layout`, `.admin-sidebar`, `.admin-content`

## Pagina's (geen TSX-wijzigingen nodig buiten layout)
- `app/admin/page.tsx` — stat cards CSS klassen aanpassen
- `app/admin/layout.tsx` — sidebar vervangen door AdminNav
- `app/admin/activiteiten/page.tsx` — geen wijziging
- `app/admin/activiteiten/[id]/page.tsx` — geen wijziging
- `app/admin/activiteiten/[id]/inschrijvingen/page.tsx` — geen wijziging
- `app/admin/activiteiten/nieuw/page.tsx` — geen wijziging

## Visueel

### AdminNav
```
[logo] CareAIgent [Admin]    Dashboard  Activiteiten    [Uitloggen →]
```

### Dashboard
```
┌────────────────────────────────────────────────────────┐
│  Dashboard                                             │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ [teal top]   │  │ [teal top]   │                   │
│  │  5           │  │  42          │                   │
│  │  Activiteiten│  │  Inschrijv.  │                   │
│  └──────────────┘  └──────────────┘                   │
│  [Beheer activiteiten →]                               │
└────────────────────────────────────────────────────────┘
```
