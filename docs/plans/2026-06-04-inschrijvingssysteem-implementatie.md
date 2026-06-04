# Inschrijvingssysteem Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate de statische CareAIgent website naar Next.js 14 en voeg een volledig inschrijvingssysteem toe met Railway PostgreSQL, admin panel, bevestigingsmails en iCal uitnodigingen.

**Architecture:** Next.js 14 App Router in de root van de bestaande repo. Bestaande GitHub → Netlify pipeline blijft intact via `@netlify/plugin-nextjs`. Railway PostgreSQL als database via Prisma ORM.

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL (Railway), NextAuth v5, Resend, ical-generator, zod, bcryptjs, exceljs, csv-stringify

**Design doc:** `docs/plans/2026-06-04-inschrijvingssysteem-design.md`

---

## Prerequisites (doe dit handmatig voor je begint)

1. Maak een Railway project aan en voeg een PostgreSQL database toe → kopieer de `DATABASE_URL`
2. Maak een Resend account aan op resend.com → kopieer de `RESEND_API_KEY`
3. Maak een `.env.local` file aan in de repo root:

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="willekeurige-lange-string-minimum-32-chars"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."
ADMIN_EMAIL="admin@careaigent.be"
ADMIN_PASSWORD="tijdelijkWachtwoord123!"
```

4. Genereer een NextAuth secret: `openssl rand -base64 32`

---

## Task 1: Initialiseer Next.js in de bestaande repo

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `app/layout.tsx` (root layout — leeg voor nu)
- Create: `app/page.tsx` (home — leeg voor nu)
- Create: `.env.local` (al gedaan in prerequisites)

**Step 1: Verwijder de netlify.toml build config tijdelijk (bewaar de headers)**

De huidige `netlify.toml` heeft `publish = "."` — dat werkt niet meer voor Next.js. We updaten dit in Task 3. Sla de bestaande headers op voor later.

**Step 2: Initialiseer Next.js**

```bash
npx create-next-app@latest . \
  --typescript \
  --app \
  --no-tailwind \
  --no-eslint \
  --no-src-dir \
  --import-alias "@/*"
```

Als gevraagd wordt of je wil doorgaan in een non-empty directory: kies **Yes**.

**Step 3: Installeer alle project dependencies**

```bash
npm install @prisma/client @auth/prisma-adapter next-auth@beta \
  resend ical-generator zod bcryptjs \
  exceljs csv-stringify

npm install -D prisma @types/bcryptjs ts-node jest \
  @testing-library/react @testing-library/jest-dom @types/jest \
  jest-environment-jsdom ts-jest
```

**Step 4: Configureer Jest**

Maak `jest.config.ts` aan:

```typescript
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathPattern: '.*\\.test\\.ts$',
};

export default config;
```

Voeg toe aan `package.json` scripts:
```json
"test": "jest",
"test:watch": "jest --watch"
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 with TypeScript and App Router"
```

---

## Task 2: Database schema met Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/db.ts`
- Create: `prisma/seed.ts`

**Step 1: Initialiseer Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

**Step 2: Schrijf het Prisma schema**

Vervang `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Activity {
  id                   String         @id @default(cuid())
  slug                 String         @unique
  title                String
  description          String?
  dateStart            DateTime
  dateEnd              DateTime?
  location             String?
  maxParticipants      Int?
  registrationDeadline DateTime?
  isOpen               Boolean        @default(true)
  extraFields          Json           @default("[]")
  createdAt            DateTime       @default(now())
  registrations        Registration[]
}

model Registration {
  id         String   @id @default(cuid())
  activityId String
  activity   Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  naam       String
  voornaam   String
  email      String
  telefoon   String
  instelling String
  functie    String
  extraData  Json     @default("{}")
  createdAt  DateTime @default(now())
}

model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  createdAt    DateTime @default(now())
}
```

**Step 3: Schrijf het admin seed script**

Maak `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
  }

  const passwordHash = await hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: 'Admin' },
  });

  console.log(`Admin created/verified: ${admin.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Voeg toe aan `package.json`:
```json
"prisma": {
  "seed": "ts-node --project tsconfig.json prisma/seed.ts"
}
```

En in `tsconfig.json`, zorg dat `ts-node` module resolution werkt:
```json
"ts-node": {
  "compilerOptions": {
    "module": "CommonJS"
  }
}
```

**Step 4: Maak de Prisma client singleton**

Maak `lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Step 5: Voer de migratie uit en seed**

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Verwacht: "Admin created/verified: admin@careaigent.be"

**Step 6: Schrijf een test voor de db singleton**

Maak `lib/__tests__/db.test.ts`:

```typescript
import { prisma } from '../db';

describe('prisma client', () => {
  it('exports a PrismaClient instance', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.activity.findMany).toBe('function');
  });
});
```

Run: `npm test lib/__tests__/db.test.ts`  
Verwacht: PASS

**Step 7: Commit**

```bash
git add prisma/ lib/db.ts lib/__tests__/db.test.ts
git commit -m "feat: add Prisma schema with Activity, Registration, and Admin models"
```

---

## Task 3: Netlify configuratie voor Next.js

**Files:**
- Modify: `netlify.toml`
- Create: `next.config.ts`

**Step 1: Installeer de Netlify Next.js plugin**

```bash
npm install -D @netlify/plugin-nextjs
```

**Step 2: Vervang `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-XSS-Protection = "1; mode=block"
```

**Step 3: Voeg environment variables toe aan Netlify**

Ga naar Netlify dashboard → Site settings → Environment variables. Voeg toe:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (de productie URL, bv. `https://careaigent.be`)
- `RESEND_API_KEY`

**Step 4: Controleer next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: [],
  },
};

export default nextConfig;
```

**Step 5: Commit**

```bash
git add netlify.toml next.config.ts package.json package-lock.json
git commit -m "feat: configure Netlify for Next.js deployment with plugin"
```

---

## Task 4: Authenticatie setup (NextAuth v5)

**Files:**
- Create: `auth.ts`
- Create: `middleware.ts`
- Create: `lib/__tests__/auth.test.ts`

**Step 1: Schrijf een test voor de auth config (faalt eerst)**

Maak `lib/__tests__/auth.test.ts`:

```typescript
describe('auth configuration', () => {
  it('requires email and password credentials', () => {
    // Verifies the auth module exports the correct handler shape
    const auth = require('../../auth');
    expect(auth.handlers).toBeDefined();
    expect(auth.auth).toBeDefined();
    expect(auth.signIn).toBeDefined();
    expect(auth.signOut).toBeDefined();
  });
});
```

Run: `npm test lib/__tests__/auth.test.ts`  
Verwacht: FAIL (module not found)

**Step 2: Maak `auth.ts` in de root**

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Wachtwoord', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email as string },
        });

        if (!admin) return null;

        const match = await compare(
          credentials.password as string,
          admin.passwordHash
        );
        if (!match) return null;

        return { id: admin.id, email: admin.email, name: admin.name };
      },
    }),
  ],
  pages: { signIn: '/admin/login' },
  session: { strategy: 'jwt' },
});
```

**Step 3: Maak `middleware.ts` in de root**

```typescript
import { auth } from './auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isLoginPage = req.nextUrl.pathname === '/admin/login';

  if (isAdminRoute && !isLoginPage && !req.auth) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Step 4: Voeg de NextAuth API route toe**

Maak `app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```

**Step 5: Run de test**

Run: `npm test lib/__tests__/auth.test.ts`  
Verwacht: PASS

**Step 6: Commit**

```bash
git add auth.ts middleware.ts app/api/auth/
git commit -m "feat: add NextAuth v5 credentials authentication for admin"
```

---

## Task 5: Globale CSS + gedeelde layout

**Files:**
- Create: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `components/Nav.tsx`
- Create: `components/Footer.tsx`

**Step 1: Extraheer CSS uit de bestaande HTML bestanden**

De CSS staat inline in elke HTML pagina. Kopieer de gemeenschappelijke CSS (CSS variabelen, reset, nav, footer, typografie) uit `index.html` naar `app/globals.css`.

Maak `app/globals.css` met minimaal:

```css
/* CSS custom properties */
:root {
  --navy: #002841;
  --navy-dark: #001B2B;
  --navy-mid: #003459;
  --teal: #219ABD;
  --teal-light: #25C7D9;
  --teal-dark: #1A7A97;
  --white: #FFFFFF;
  --light-bg: #F5F9FC;
  --text-dark: #1a1a2e;
  --text-mid: #4a4a6a;
  --text-light: #6b6b8a;
}

/* Alle gemeenschappelijke CSS van index.html kopiëren hier */
/* ... (nav, footer, body reset, typografie, responsiveness) ... */
```

**Step 2: Maak de Nav component**

Maak `components/Nav.tsx` door de `<nav>` HTML uit `index.html` te converteren naar React/JSX. Gebruik `next/link` voor alle ankertags.

```typescript
'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function Nav() {
  return (
    <nav>
      <Link href="/" className="nav-logo">
        <Image src="/images/favicon.png" alt="CareAIgent logo" width={32} height={32} />
        <div className="nav-logo-text">
          Care<span>AI</span>gent
        </div>
      </Link>
      <div className="nav-links">
        <Link href="/#aanpak">Aanpak</Link>
        <Link href="/#partners">Partners</Link>
        <Link href="/resultaten">Resultaten</Link>
        <Link href="/team">Team</Link>
        <Link href="/agenda" className="nav-cta">Agenda</Link>
      </div>
    </nav>
  );
}
```

**Step 3: Maak de Footer component**

Maak `components/Footer.tsx` door de `<footer>` HTML uit `index.html` te converteren naar JSX.

**Step 4: Maak de root layout**

Vervang `app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://careaigent.be'),
  title: { default: 'CareAIgent', template: '%s · CareAIgent' },
  description: 'CareAIgent onderzoekt hoe AI de administratieve last voor zorgprofessionals in Vlaanderen kan verlichten.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

**Step 5: Verplaats afbeeldingen naar `public/images/`**

```bash
mkdir -p public/images
cp images/* public/images/
```

**Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx components/ public/images/
git commit -m "feat: add shared layout, Nav, Footer components and global CSS"
```

---

## Task 6: Migreer statische HTML pagina's naar Next.js

**Files:**
- Modify: `app/page.tsx` (home)
- Create: `app/team/page.tsx`
- Create: `app/resultaten/page.tsx`
- Create: `app/bedankt/page.tsx`

**Step 1: Migreer `index.html` → `app/page.tsx`**

Converteer de `<body>` inhoud (alles tussen `</nav>` en `</footer>`) van `index.html` naar JSX.

Regels:
- `class` → `className`
- `<a href="/evenement">` → vervangen door `<a href="/agenda">`
- Inline `<script>` tags → React event handlers of `useEffect`
- `<img>` → `<Image>` van next/image waar mogelijk
- Structured data JSON-LD → in de `generateMetadata` export

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CareAIgent — AI voor Slimmere Zorg in Vlaanderen',
  description: '...',
};

export default function HomePage() {
  return (
    <>
      {/* Inhoud van index.html body hier */}
    </>
  );
}
```

**Step 2: Migreer `team.html` → `app/team/page.tsx`**

Zelfde aanpak. Verwijder nav en footer (die zitten al in de root layout).

**Step 3: Migreer `resultaten.html` → `app/resultaten/page.tsx`**

**Step 4: Maak een eenvoudige bedankt pagina**

Maak `app/bedankt/page.tsx` (wordt later uitgebreid in Task 10):

```typescript
export default function BedanktPage() {
  return (
    <section style={{ padding: '80px 20px', textAlign: 'center' }}>
      <h1>Bedankt voor uw inschrijving!</h1>
      <p>U ontvangt een bevestigingsmail met de kalenderuitnodiging.</p>
      <a href="/agenda">← Terug naar agenda</a>
    </section>
  );
}
```

**Step 5: Voeg redirects toe voor oude URLs**

Voeg toe aan `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/evenement', destination: '/agenda', permanent: true },
      { source: '/evenement.html', destination: '/agenda', permanent: true },
      { source: '/index.html', destination: '/', permanent: true },
    ];
  },
};
```

**Step 6: Test lokaal**

```bash
npm run dev
```

Open http://localhost:3000 en controleer:
- Home pagina laadt correct
- /team laadt correct
- /resultaten laadt correct
- /evenement redirect naar /agenda (404 voor nu, maar de redirect werkt)

**Step 7: Commit**

```bash
git add app/ next.config.ts
git commit -m "feat: migrate static HTML pages to Next.js components"
```

---

## Task 7: Zod validatie schemas

**Files:**
- Create: `lib/validation.ts`
- Create: `lib/__tests__/validation.test.ts`

**Step 1: Schrijf tests voor de validatieschemas (faalt eerst)**

Maak `lib/__tests__/validation.test.ts`:

```typescript
import { registrationSchema, activitySchema } from '../validation';

describe('registrationSchema', () => {
  const valid = {
    naam: 'Janssen',
    voornaam: 'Jan',
    email: 'jan@test.be',
    telefoon: '0479123456',
    instelling: 'AZ Ziekenhuis',
    functie: 'Verpleegkundige',
    extraData: {},
  };

  it('accepts valid registration', () => {
    expect(() => registrationSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing email', () => {
    expect(() => registrationSchema.parse({ ...valid, email: '' })).toThrow();
  });

  it('rejects invalid email format', () => {
    expect(() => registrationSchema.parse({ ...valid, email: 'geen-email' })).toThrow();
  });

  it('rejects empty naam', () => {
    expect(() => registrationSchema.parse({ ...valid, naam: '' })).toThrow();
  });
});

describe('activitySchema', () => {
  it('accepts valid activity', () => {
    const valid = {
      title: 'AI Opleiding',
      slug: 'ai-opleiding',
      dateStart: new Date().toISOString(),
      isOpen: true,
      extraFields: [],
    };
    expect(() => activitySchema.parse(valid)).not.toThrow();
  });
});
```

Run: `npm test lib/__tests__/validation.test.ts`  
Verwacht: FAIL (module not found)

**Step 2: Implementeer `lib/validation.ts`**

```typescript
import { z } from 'zod';

export const registrationSchema = z.object({
  naam: z.string().min(1, 'Naam is verplicht'),
  voornaam: z.string().min(1, 'Voornaam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  telefoon: z.string().min(1, 'Telefoonnummer is verplicht'),
  instelling: z.string().min(1, 'Instelling is verplicht'),
  functie: z.string().min(1, 'Functie is verplicht'),
  extraData: z.record(z.string(), z.any()).default({}),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const activitySchema = z.object({
  title: z.string().min(1, 'Titel is verplicht'),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug mag alleen kleine letters, cijfers en koppeltekens bevatten'),
  description: z.string().optional(),
  dateStart: z.string().datetime({ offset: true }).or(z.string().min(1)),
  dateEnd: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  registrationDeadline: z.string().optional().nullable(),
  isOpen: z.boolean().default(true),
  extraFields: z.array(
    z.object({
      key: z.string().min(1),
      label: z.string().min(1),
      type: z.enum(['text', 'textarea', 'radio', 'checkbox']),
      options: z.array(z.string()).optional(),
      required: z.boolean().default(false),
    })
  ).default([]),
});

export type ActivityInput = z.infer<typeof activitySchema>;
```

**Step 3: Run de tests**

Run: `npm test lib/__tests__/validation.test.ts`  
Verwacht: PASS (alle 4 tests)

**Step 4: Commit**

```bash
git add lib/validation.ts lib/__tests__/validation.test.ts
git commit -m "feat: add Zod validation schemas for registrations and activities"
```

---

## Task 8: Email + iCal service

**Files:**
- Create: `lib/email.ts`
- Create: `lib/__tests__/email.test.ts`

**Step 1: Schrijf tests voor iCal generatie (faalt eerst)**

Maak `lib/__tests__/email.test.ts`:

```typescript
import { generateIcal } from '../email';

const mockActivity = {
  id: 'act-1',
  slug: 'test',
  title: 'AI Opleiding Test',
  description: 'Een testbeschrijving',
  dateStart: new Date('2026-09-22T09:00:00+02:00'),
  dateEnd: new Date('2026-09-22T13:00:00+02:00'),
  location: 'PXL NEXT, Hasselt',
  maxParticipants: 20,
  registrationDeadline: null,
  isOpen: true,
  extraFields: [],
  createdAt: new Date(),
  registrations: [],
};

describe('generateIcal', () => {
  it('generates a valid iCal string', () => {
    const ics = generateIcal(mockActivity);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('AI Opleiding Test');
  });

  it('includes the location', () => {
    const ics = generateIcal(mockActivity);
    expect(ics).toContain('PXL NEXT');
  });
});
```

Run: `npm test lib/__tests__/email.test.ts`  
Verwacht: FAIL

**Step 2: Implementeer `lib/email.ts`**

```typescript
import { Resend } from 'resend';
import ical from 'ical-generator';
import type { Activity, Registration } from '@prisma/client';

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateIcal(activity: Activity & { registrations?: Registration[] }): string {
  const cal = ical({ name: 'CareAIgent' });
  cal.createEvent({
    start: activity.dateStart,
    end: activity.dateEnd ?? activity.dateStart,
    summary: activity.title,
    description: activity.description ?? '',
    location: activity.location ?? '',
    url: `https://careaigent.be/activiteiten/${activity.slug}`,
  });
  return cal.toString();
}

export async function sendConfirmationEmail(
  registration: Registration,
  activity: Activity
): Promise<void> {
  const icsContent = generateIcal(activity);
  const dateFormatted = activity.dateStart.toLocaleDateString('nl-BE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  await resend.emails.send({
    from: 'CareAIgent <noreply@careaigent.be>',
    to: registration.email,
    subject: `Bevestiging inschrijving: ${activity.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #002841;">Bevestiging inschrijving</h1>
        <p>Beste ${registration.voornaam} ${registration.naam},</p>
        <p>Uw inschrijving voor <strong>${activity.title}</strong> is bevestigd.</p>
        <ul>
          <li><strong>Datum:</strong> ${dateFormatted}</li>
          <li><strong>Locatie:</strong> ${activity.location ?? 'Wordt later meegedeeld'}</li>
        </ul>
        <p>U vindt een kalenderuitnodiging in bijlage.</p>
        <p>Bij vragen: <a href="mailto:eric.lodewyckx@pxl.be">eric.lodewyckx@pxl.be</a></p>
        <p>Met vriendelijke groeten,<br>Team CareAIgent</p>
      </div>
    `,
    attachments: [
      {
        filename: 'uitnodiging.ics',
        content: Buffer.from(icsContent).toString('base64'),
      },
    ],
  });
}
```

**Step 3: Run de tests**

Run: `npm test lib/__tests__/email.test.ts`  
Verwacht: PASS (beide tests)

**Step 4: Commit**

```bash
git add lib/email.ts lib/__tests__/email.test.ts
git commit -m "feat: add iCal generation and Resend email service"
```

---

## Task 9: Publieke activities API

**Files:**
- Create: `app/api/activities/route.ts`
- Create: `app/api/activities/[slug]/route.ts`

**Step 1: Maak `app/api/activities/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const activities = await prisma.activity.findMany({
    where: { isOpen: true },
    orderBy: { dateStart: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      dateStart: true,
      dateEnd: true,
      location: true,
      maxParticipants: true,
      registrationDeadline: true,
      isOpen: true,
      _count: { select: { registrations: true } },
    },
  });
  return NextResponse.json(activities);
}
```

**Step 2: Maak `app/api/activities/[slug]/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const activity = await prisma.activity.findUnique({
    where: { slug: params.slug },
    include: { _count: { select: { registrations: true } } },
  });

  if (!activity) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }

  return NextResponse.json(activity);
}
```

**Step 3: Test lokaal**

```bash
npm run dev
# In een andere terminal:
curl http://localhost:3000/api/activities
```

Verwacht: JSON array (leeg als er nog geen activiteiten zijn)

**Step 4: Commit**

```bash
git add app/api/activities/
git commit -m "feat: add public activities GET API routes"
```

---

## Task 10: Agenda pagina (publieke activiteitenlijst)

**Files:**
- Create: `app/agenda/page.tsx`

**Step 1: Maak `app/agenda/page.tsx`**

```typescript
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Agenda',
  description: 'Overzicht van alle CareAIgent activiteiten en opleidingen.',
};

export const revalidate = 60; // ISR: refresh elke minuut

async function getActivities() {
  return prisma.activity.findMany({
    where: { isOpen: true },
    orderBy: { dateStart: 'asc' },
    include: { _count: { select: { registrations: true } } },
  });
}

export default async function AgendaPage() {
  const activities = await getActivities();

  return (
    <section className="agenda-section">
      <div className="container">
        <h1 className="section-title">Agenda</h1>
        {activities.length === 0 ? (
          <p>Momenteel zijn er geen activiteiten gepland. Kom later terug.</p>
        ) : (
          <div className="activity-grid">
            {activities.map((activity) => {
              const isFull =
                activity.maxParticipants !== null &&
                activity._count.registrations >= activity.maxParticipants;
              const dateStr = activity.dateStart.toLocaleDateString('nl-BE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={activity.id} className="activity-card">
                  <div className="activity-date">{dateStr}</div>
                  <h2 className="activity-title">{activity.title}</h2>
                  {activity.location && (
                    <p className="activity-location">📍 {activity.location}</p>
                  )}
                  {activity.description && (
                    <p className="activity-description">{activity.description.slice(0, 200)}…</p>
                  )}
                  <div className="activity-footer">
                    {activity.maxParticipants && (
                      <span className="activity-spots">
                        {isFull
                          ? '🔴 Volzet'
                          : `${activity.maxParticipants - activity._count.registrations} plaatsen beschikbaar`}
                      </span>
                    )}
                    {!isFull ? (
                      <Link href={`/activiteiten/${activity.slug}`} className="btn-primary">
                        Inschrijven →
                      </Link>
                    ) : (
                      <span className="btn-disabled">Inschrijven niet mogelijk</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
```

**Step 2: Voeg de bijhorende CSS toe aan `globals.css`**

Voeg agenda-specifieke stijlen toe (activity-grid, activity-card, enz.) die consistent zijn met de bestaande design tokens (`--navy`, `--teal`, enz.).

**Step 3: Test lokaal**

```bash
npm run dev
```

Maak via Prisma Studio een testactiviteit aan:
```bash
npx prisma studio
```

Ga naar http://localhost:3000/agenda en controleer de weergave.

**Step 4: Commit**

```bash
git add app/agenda/
git commit -m "feat: add public agenda page with activity listing"
```

---

## Task 11: Inschrijvingsformulier pagina

**Files:**
- Create: `app/activiteiten/[slug]/page.tsx`
- Create: `components/RegistrationForm.tsx`

**Step 1: Maak de server-side pagina**

Maak `app/activiteiten/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import RegistrationForm from '@/components/RegistrationForm';
import type { Metadata } from 'next';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const activity = await prisma.activity.findUnique({ where: { slug: params.slug } });
  if (!activity) return { title: 'Niet gevonden' };
  return { title: activity.title, description: activity.description ?? undefined };
}

export default async function ActivityPage({ params }: Props) {
  const activity = await prisma.activity.findUnique({
    where: { slug: params.slug },
    include: { _count: { select: { registrations: true } } },
  });

  if (!activity) notFound();

  const isFull =
    activity.maxParticipants !== null &&
    activity._count.registrations >= activity.maxParticipants;
  const isClosed = !activity.isOpen;

  return (
    <section className="activity-detail-section">
      <div className="container">
        <h1>{activity.title}</h1>
        {activity.description && <div className="activity-description">{activity.description}</div>}
        {(isClosed || isFull) ? (
          <div className="registration-closed">
            <p>{isFull ? 'Deze activiteit is volzet.' : 'Inschrijvingen zijn gesloten.'}</p>
          </div>
        ) : (
          <RegistrationForm
            activitySlug={activity.slug}
            extraFields={activity.extraFields as ExtraField[]}
          />
        )}
      </div>
    </section>
  );
}
```

**Step 2: Maak de RegistrationForm client component**

Maak `components/RegistrationForm.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ExtraField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  options?: string[];
  required: boolean;
};

type Props = {
  activitySlug: string;
  extraFields: ExtraField[];
};

export default function RegistrationForm({ activitySlug, extraFields }: Props) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const extraData: Record<string, string> = {};
    extraFields.forEach((f) => {
      const val = formData.get(f.key);
      if (val) extraData[f.key] = val as string;
    });

    const body = {
      activitySlug,
      naam: formData.get('naam'),
      voornaam: formData.get('voornaam'),
      email: formData.get('email'),
      telefoon: formData.get('telefoon'),
      instelling: formData.get('instelling'),
      functie: formData.get('functie'),
      extraData,
    };

    const res = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push('/bedankt');
    } else {
      const data = await res.json();
      setErrors(data.errors ?? { general: data.error ?? 'Er is iets misgelopen.' });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="registration-form">
      {errors.general && <p className="form-error">{errors.general}</p>}

      <div className="form-group">
        <label htmlFor="naam">Naam *</label>
        <input id="naam" name="naam" type="text" required />
        {errors.naam && <p className="form-error">{errors.naam}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="voornaam">Voornaam *</label>
        <input id="voornaam" name="voornaam" type="text" required />
      </div>

      <div className="form-group">
        <label htmlFor="email">E-mailadres *</label>
        <input id="email" name="email" type="email" required />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="telefoon">Telefoonnummer *</label>
        <input id="telefoon" name="telefoon" type="tel" required />
      </div>

      <div className="form-group">
        <label htmlFor="instelling">Instelling *</label>
        <input id="instelling" name="instelling" type="text" required />
      </div>

      <div className="form-group">
        <label htmlFor="functie">Functie / rol *</label>
        <input id="functie" name="functie" type="text" required />
      </div>

      {extraFields.map((field) => (
        <div key={field.key} className="form-group">
          <label htmlFor={field.key}>
            {field.label} {field.required && '*'}
          </label>
          {field.type === 'text' && (
            <input id={field.key} name={field.key} type="text" required={field.required} />
          )}
          {field.type === 'textarea' && (
            <textarea id={field.key} name={field.key} rows={4} required={field.required} />
          )}
          {field.type === 'radio' && field.options?.map((opt) => (
            <label key={opt} className="radio-label">
              <input type="radio" name={field.key} value={opt} required={field.required} />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? 'Bezig met versturen...' : 'Inschrijven'}
      </button>
    </form>
  );
}
```

**Step 3: Commit**

```bash
git add app/activiteiten/ components/RegistrationForm.tsx
git commit -m "feat: add activity detail page with dynamic registration form"
```

---

## Task 12: Inschrijvingen API route (POST)

**Files:**
- Create: `app/api/registrations/route.ts`
- Create: `app/api/registrations/__tests__/route.test.ts`

**Step 1: Schrijf een test (faalt eerst)**

Maak `app/api/registrations/__tests__/route.test.ts`:

```typescript
import { registrationSchema } from '@/lib/validation';

describe('registration API input validation', () => {
  it('validates a complete registration payload', () => {
    const result = registrationSchema.safeParse({
      naam: 'Peeters',
      voornaam: 'An',
      email: 'an@test.be',
      telefoon: '0479000000',
      instelling: 'WZC Test',
      functie: 'Directeur',
      extraData: { lunch: 'Ja' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects payload with invalid email', () => {
    const result = registrationSchema.safeParse({
      naam: 'Peeters',
      voornaam: 'An',
      email: 'niet-valide',
      telefoon: '0479000000',
      instelling: 'WZC Test',
      functie: 'Directeur',
    });
    expect(result.success).toBe(false);
  });
});
```

Run: `npm test app/api/registrations/__tests__/route.test.ts`  
Verwacht: PASS (hergebruikt al geïmplementeerde validatieschema)

**Step 2: Maak de API route**

Maak `app/api/registrations/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registrationSchema } from '@/lib/validation';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  const body = await req.json();
  const { activitySlug, ...fields } = body;

  if (!activitySlug) {
    return NextResponse.json({ error: 'activitySlug is verplicht' }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(fields);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const key = issue.path[0]?.toString() ?? 'general';
      errors[key] = issue.message;
    });
    return NextResponse.json({ errors }, { status: 422 });
  }

  const activity = await prisma.activity.findUnique({
    where: { slug: activitySlug },
    include: { _count: { select: { registrations: true } } },
  });

  if (!activity) {
    return NextResponse.json({ error: 'Activiteit niet gevonden' }, { status: 404 });
  }

  if (!activity.isOpen) {
    return NextResponse.json({ error: 'Inschrijvingen zijn gesloten' }, { status: 409 });
  }

  if (
    activity.maxParticipants !== null &&
    activity._count.registrations >= activity.maxParticipants
  ) {
    return NextResponse.json({ error: 'Activiteit is volzet' }, { status: 409 });
  }

  const registration = await prisma.registration.create({
    data: {
      activityId: activity.id,
      naam: parsed.data.naam,
      voornaam: parsed.data.voornaam,
      email: parsed.data.email,
      telefoon: parsed.data.telefoon,
      instelling: parsed.data.instelling,
      functie: parsed.data.functie,
      extraData: parsed.data.extraData,
    },
  });

  // E-mail versturen (niet blokkeren op errors)
  sendConfirmationEmail(registration, activity).catch((err) =>
    console.error('Email error:', err)
  );

  return NextResponse.json({ success: true, id: registration.id }, { status: 201 });
}
```

**Step 3: Test via curl**

```bash
npm run dev
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{"activitySlug":"test-slug","naam":"Test","voornaam":"User","email":"test@test.be","telefoon":"0479000000","instelling":"Test WZC","functie":"Directeur"}'
```

**Step 4: Commit**

```bash
git add app/api/registrations/
git commit -m "feat: add registration POST API with validation, capacity check, and email"
```

---

## Task 13: Admin login pagina

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/layout.tsx`

**Step 1: Maak de admin layout**

Maak `app/admin/layout.tsx`:

```typescript
import { auth } from '@/auth';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="admin-layout">
      {session && (
        <aside className="admin-sidebar">
          <div className="admin-brand">Admin</div>
          <nav>
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/activiteiten">Activiteiten</Link>
          </nav>
          <form action="/api/auth/signout" method="POST">
            <button type="submit">Uitloggen</button>
          </form>
        </aside>
      )}
      <div className="admin-content">{children}</div>
    </div>
  );
}
```

**Step 2: Maak de login pagina**

Maak `app/admin/login/page.tsx`:

```typescript
'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);

    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    if (result?.error) {
      setError('Ongeldig e-mailadres of wachtwoord.');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  }

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-card">
        <h1>Admin login</h1>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-mailadres</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Wachtwoord</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Inloggen...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Test login flow**

```bash
npm run dev
```

Ga naar http://localhost:3000/admin/login en log in met de credentials uit `.env.local`.
Verwacht: redirect naar /admin (nog leeg)

**Step 4: Commit**

```bash
git add app/admin/
git commit -m "feat: add admin login page and admin layout with sidebar"
```

---

## Task 14: Admin dashboard + activiteiten CRUD

**Files:**
- Create: `app/admin/page.tsx`
- Create: `app/admin/activiteiten/page.tsx`
- Create: `app/admin/activiteiten/nieuw/page.tsx`
- Create: `app/admin/activiteiten/[id]/page.tsx`
- Create: `app/api/admin/activities/route.ts`
- Create: `app/api/admin/activities/[id]/route.ts`

**Step 1: Maak de admin activities API routes**

Maak `app/api/admin/activities/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { activitySchema } from '@/lib/validation';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const activities = await prisma.activity.findMany({
    orderBy: { dateStart: 'asc' },
    include: { _count: { select: { registrations: true } } },
  });
  return NextResponse.json(activities);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = activitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const activity = await prisma.activity.create({
    data: {
      ...parsed.data,
      dateStart: new Date(parsed.data.dateStart),
      dateEnd: parsed.data.dateEnd ? new Date(parsed.data.dateEnd) : null,
      registrationDeadline: parsed.data.registrationDeadline
        ? new Date(parsed.data.registrationDeadline)
        : null,
    },
  });
  return NextResponse.json(activity, { status: 201 });
}
```

Maak `app/api/admin/activities/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { activitySchema } from '@/lib/validation';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = activitySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const activity = await prisma.activity.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      dateStart: parsed.data.dateStart ? new Date(parsed.data.dateStart) : undefined,
    },
  });
  return NextResponse.json(activity);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.activity.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

**Step 2: Maak de admin activiteiten UI pagina's**

Maak `app/admin/page.tsx`:

```typescript
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export default async function AdminDashboard() {
  await auth(); // session gegarandeerd door middleware
  const [activityCount, registrationCount] = await Promise.all([
    prisma.activity.count(),
    prisma.registration.count(),
  ]);

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-number">{activityCount}</span>
          <span className="stat-label">Activiteiten</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{registrationCount}</span>
          <span className="stat-label">Inschrijvingen</span>
        </div>
      </div>
    </div>
  );
}
```

Maak `app/admin/activiteiten/page.tsx` — een server component die alle activiteiten toont als tabel met links naar detail, inschrijvingen, en delete-knop.

Maak `app/admin/activiteiten/nieuw/page.tsx` en `app/admin/activiteiten/[id]/page.tsx` — client components met een formulier (titel, slug, datum, locatie, max deelnemers, deadline, beschrijving, extra velden configurator).

**Step 3: Extra velden configurator in het activiteitsformulier**

De extra velden worden opgeslagen als JSON array. Geef de admin een interface om velden toe te voegen:

- "Voeg veld toe" knop opent een modal: naam/key, label, type (text/radio/textarea), opties (voor radio), verplicht ja/nee
- Elk veld is verwijderbaar
- State wordt meegegeven als JSON bij het opslaan

**Step 4: Test de volledige flow**

```bash
npm run dev
```

1. Ga naar /admin/activiteiten/nieuw
2. Maak een testactiviteit aan
3. Verifieer dat de activiteit verschijnt op /agenda
4. Verifieer dat het inschrijvingsformulier werkt op /activiteiten/[slug]

**Step 5: Commit**

```bash
git add app/admin/ app/api/admin/activities/
git commit -m "feat: add admin activity CRUD with API routes and UI"
```

---

## Task 15: Admin inschrijvingen beheer + export

**Files:**
- Create: `app/admin/activiteiten/[id]/inschrijvingen/page.tsx`
- Create: `app/api/admin/activities/[id]/registrations/route.ts`
- Create: `app/api/admin/activities/[id]/registrations/export/route.ts`
- Create: `app/api/admin/registrations/[id]/route.ts`
- Create: `lib/export.ts`

**Step 1: Schrijf tests voor de export functie (faalt eerst)**

Maak `lib/__tests__/export.test.ts`:

```typescript
import { buildCsvBuffer } from '../export';

describe('buildCsvBuffer', () => {
  it('generates CSV with header row', async () => {
    const registrations = [
      {
        id: '1',
        naam: 'Janssen',
        voornaam: 'Jan',
        email: 'jan@test.be',
        telefoon: '0479',
        instelling: 'AZ Test',
        functie: 'Arts',
        extraData: { lunch: 'Ja' },
        createdAt: new Date('2026-01-01'),
        activityId: 'act-1',
      },
    ];
    const csv = await buildCsvBuffer(registrations as any);
    const text = csv.toString('utf-8');
    expect(text).toContain('naam');
    expect(text).toContain('Janssen');
    expect(text).toContain('jan@test.be');
  });
});
```

Run: `npm test lib/__tests__/export.test.ts`  
Verwacht: FAIL

**Step 2: Implementeer `lib/export.ts`**

```typescript
import { Registration } from '@prisma/client';
import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';

const FIXED_COLUMNS = ['naam', 'voornaam', 'email', 'telefoon', 'instelling', 'functie', 'createdAt'] as const;

export async function buildCsvBuffer(registrations: Registration[]): Promise<Buffer> {
  const rows = registrations.map((r) => {
    const extra = (r.extraData ?? {}) as Record<string, string>;
    return {
      naam: r.naam,
      voornaam: r.voornaam,
      email: r.email,
      telefoon: r.telefoon,
      instelling: r.instelling,
      functie: r.functie,
      ...extra,
      createdAt: r.createdAt.toISOString(),
    };
  });

  const csv = stringify(rows, { header: true });
  return Buffer.from(csv, 'utf-8');
}

export async function buildExcelBuffer(registrations: Registration[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inschrijvingen');

  const extraKeys = new Set<string>();
  registrations.forEach((r) => {
    Object.keys((r.extraData ?? {}) as object).forEach((k) => extraKeys.add(k));
  });

  const allColumns = [...FIXED_COLUMNS, ...extraKeys];
  sheet.columns = allColumns.map((key) => ({ header: key, key, width: 20 }));

  registrations.forEach((r) => {
    const extra = (r.extraData ?? {}) as Record<string, string>;
    sheet.addRow({
      naam: r.naam,
      voornaam: r.voornaam,
      email: r.email,
      telefoon: r.telefoon,
      instelling: r.instelling,
      functie: r.functie,
      ...extra,
      createdAt: r.createdAt,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
```

**Step 3: Run de test**

Run: `npm test lib/__tests__/export.test.ts`  
Verwacht: PASS

**Step 4: Maak de admin registrations API routes**

Maak `app/api/admin/activities/[id]/registrations/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const registrations = await prisma.registration.findMany({
    where: { activityId: params.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(registrations);
}
```

Maak `app/api/admin/activities/[id]/registrations/export/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { buildCsvBuffer, buildExcelBuffer } from '@/lib/export';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') ?? 'csv';

  const registrations = await prisma.registration.findMany({
    where: { activityId: params.id },
    orderBy: { createdAt: 'asc' },
  });

  const activity = await prisma.activity.findUnique({ where: { id: params.id } });
  const filename = `inschrijvingen-${activity?.slug ?? params.id}`;

  if (format === 'xlsx') {
    const buffer = await buildExcelBuffer(registrations);
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const buffer = await buildCsvBuffer(registrations);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    },
  });
}
```

Maak `app/api/admin/registrations/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.registration.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

**Step 5: Maak de admin inschrijvingen UI**

Maak `app/admin/activiteiten/[id]/inschrijvingen/page.tsx`:

```typescript
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function InschrijvingenPage({ params }: { params: { id: string } }) {
  const activity = await prisma.activity.findUnique({ where: { id: params.id } });
  if (!activity) notFound();

  const registrations = await prisma.registration.findMany({
    where: { activityId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="admin-page-header">
        <h1>Inschrijvingen: {activity.title}</h1>
        <div className="admin-actions">
          <a href={`/api/admin/activities/${params.id}/registrations/export?format=csv`} className="btn-secondary">
            Download CSV
          </a>
          <a href={`/api/admin/activities/${params.id}/registrations/export?format=xlsx`} className="btn-secondary">
            Download Excel
          </a>
          {/* Toggle open/gesloten */}
          <form action={`/api/admin/activities/${params.id}`} method="POST">
            {/* Client component voor toggle — zie hieronder */}
          </form>
        </div>
      </div>

      <p>{registrations.length} inschrijvingen</p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Naam</th>
            <th>E-mail</th>
            <th>Instelling</th>
            <th>Functie</th>
            <th>Datum</th>
            <th>Acties</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((r) => (
            <tr key={r.id}>
              <td>{r.voornaam} {r.naam}</td>
              <td>{r.email}</td>
              <td>{r.instelling}</td>
              <td>{r.functie}</td>
              <td>{r.createdAt.toLocaleDateString('nl-BE')}</td>
              <td>
                {/* DeleteButton client component */}
                <button
                  onClick={() => {/* handled by client component */}}
                  className="btn-danger-small"
                >
                  Verwijderen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Maak een `components/admin/DeleteRegistrationButton.tsx` client component die een DELETE fetch doet naar `/api/admin/registrations/[id]` na bevestiging via `window.confirm`.

**Step 6: Run alle tests**

```bash
npm test
```

Verwacht: alle tests PASS

**Step 7: Commit**

```bash
git add app/admin/activiteiten/ app/api/admin/ lib/export.ts lib/__tests__/export.test.ts components/admin/
git commit -m "feat: add admin registration viewer with CSV/Excel export and delete"
```

---

## Task 16: Admin activiteit open/sluiten toggle

**Files:**
- Create: `components/admin/ToggleActivityButton.tsx`
- Modify: `app/api/admin/activities/[id]/route.ts` (al aangemaakt in Task 14)

**Step 1: Maak de toggle button als client component**

Maak `components/admin/ToggleActivityButton.tsx`:

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = { activityId: string; isOpen: boolean };

export default function ToggleActivityButton({ activityId, isOpen }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/activities/${activityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOpen: !isOpen }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading} className={isOpen ? 'btn-warning' : 'btn-success'}>
      {loading ? '...' : isOpen ? 'Inschrijvingen sluiten' : 'Inschrijvingen openen'}
    </button>
  );
}
```

**Step 2: Voeg toe aan de inschrijvingen pagina**

In `app/admin/activiteiten/[id]/inschrijvingen/page.tsx`, importeer en gebruik `ToggleActivityButton`:

```typescript
import ToggleActivityButton from '@/components/admin/ToggleActivityButton';

// In de JSX:
<ToggleActivityButton activityId={params.id} isOpen={activity.isOpen} />
```

**Step 3: Test lokaal**

```bash
npm run dev
```

1. Ga naar een activiteit in de admin
2. Klik "Inschrijvingen sluiten"
3. Ga naar de publieke pagina → formulier moet geblokkeerd zijn
4. Klik "Inschrijvingen openen" → formulier beschikbaar

**Step 4: Commit**

```bash
git add components/admin/ToggleActivityButton.tsx app/admin/activiteiten/
git commit -m "feat: add toggle for opening/closing activity registrations"
```

---

## Task 17: Finale checks en opschonen

**Files:**
- Delete: `index.html`, `team.html`, `resultaten.html`, `evenement.html`, `bedankt.html`
- Modify: `.gitignore`
- Modify: `sitemap.xml` (voeg /agenda toe)

**Step 1: Verwijder oude statische HTML bestanden**

```bash
rm index.html team.html resultaten.html evenement.html bedankt.html
```

**Step 2: Update `.gitignore`**

Zorg dat `.env.local` en `.next/` in de `.gitignore` staan:

```
.env.local
.env*.local
.next/
node_modules/
```

**Step 3: Update `sitemap.xml`**

Voeg `/agenda` toe aan de sitemap, en overweeg de sitemap dynamisch te maken via `app/sitemap.ts`.

Maak `app/sitemap.ts`:

```typescript
import { prisma } from '@/lib/db';
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const activities = await prisma.activity.findMany({
    where: { isOpen: true },
    select: { slug: true, createdAt: true },
  });

  const activityUrls = activities.map((a) => ({
    url: `https://careaigent.be/activiteiten/${a.slug}`,
    lastModified: a.createdAt,
  }));

  return [
    { url: 'https://careaigent.be/', lastModified: new Date() },
    { url: 'https://careaigent.be/agenda', lastModified: new Date() },
    { url: 'https://careaigent.be/resultaten', lastModified: new Date() },
    { url: 'https://careaigent.be/team', lastModified: new Date() },
    ...activityUrls,
  ];
}
```

**Step 4: Run alle tests**

```bash
npm test
```

Verwacht: alle tests PASS

**Step 5: Build test**

```bash
npm run build
```

Verwacht: succesvolle build zonder errors

**Step 6: Finale commit**

```bash
git add -A
git commit -m "feat: finalize inschrijvingssysteem — remove old HTML, update sitemap"
```

---

## Omgevingsvariabelen checklist

Zorg dat deze variabelen op Netlify zijn ingesteld vóór deploy:

| Variabele | Waarde |
|---|---|
| `DATABASE_URL` | Railway PostgreSQL connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` output |
| `NEXTAUTH_URL` | `https://careaigent.be` |
| `RESEND_API_KEY` | Resend API key |

---

## Na deployment

1. Run de database seed op productie: `npx prisma db seed` (of voer het seed script handmatig uit via Railway's psql console)
2. Verifieer `/admin/login` werkt op productie
3. Maak een eerste activiteit aan via het admin panel
4. Test een inschrijving van begin tot eind (inclusief bevestigingsmail)
