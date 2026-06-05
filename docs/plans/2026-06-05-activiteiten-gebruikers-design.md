# Activiteiten kopiëren, Geschiedenis, Gebruikersbeheer — Design

## Features

### 1. Activiteit kopiëren
- "Kopieer" knop in admin activiteitenlijst naast "Bewerken"
- Kopieert: title, description, location, maxParticipants, extraFields
- Leeg laat: dateStart, dateEnd, registrationDeadline
- isOpen → false, slug → `{originele-slug}-kopie` (of `-kopie-2` etc. bij conflict)
- API POST `/api/admin/activities/[id]/duplicate`
- Redirect na kopiëren naar `/admin/activiteiten/[nieuw-id]`

### 2. Geschiedenis op agenda (publiek)
- Agenda page splitst activiteiten op datum:
  - Aankomend: `dateStart >= vandaag`
  - Geschiedenis: `dateStart < vandaag`
- Geschiedenis-kaarten: zelfde layout, grijs accent (var(--text-mid) ipv teal), geen inschrijven-knop
- Sectietitel "Geschiedenis" met visuele scheiding
- Sectie verborgen als er geen voorbije activiteiten zijn

### 3. Gebruikers aanmaken
- Pagina `/admin/gebruikers`: lijst van admins + formulier voor nieuwe gebruiker
- Formulier: naam, e-mail, tijdelijk wachtwoord (min. 8 tekens)
- Server action: bcryptjs hash, prisma.admin.create, validatie uniek e-mail
- "Gebruikers" link in AdminNav

### 4. Wachtwoord wijzigen (profiel)
- Pagina `/admin/profiel`: naam + e-mail readonly, wachtwoordformulier
- Formulier: huidig wachtwoord, nieuw wachtwoord, bevestig nieuw wachtwoord
- Server action: compare huidig, hash nieuw, prisma.admin.update
- Naam van ingelogde gebruiker in AdminNav als link naar `/admin/profiel`

## Tech stack
- Next.js 14 App Router, Server Actions, Prisma, bcryptjs, NextAuth v5 JWT
