import { defineConfig } from 'prisma/config';
import { config } from 'dotenv';

// Load .env.local (Next.js convention for local secrets)
config({ path: '.env.local', override: false });

export default defineConfig({
  schema: 'prisma/schema.prisma',
});
