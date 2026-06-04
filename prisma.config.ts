import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

// Load .env.local for local dev (won't override already-set env vars like on Railway/Netlify)
config({ path: '.env.local', override: false });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'ts-node --project tsconfig.json prisma/seed.ts',
  },
});
