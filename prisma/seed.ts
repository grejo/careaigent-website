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
