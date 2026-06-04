import { prisma } from '../db';

describe('prisma client', () => {
  it('exports a PrismaClient instance', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.activity.findMany).toBe('function');
    expect(typeof prisma.registration.findMany).toBe('function');
    expect(typeof prisma.admin.findUnique).toBe('function');
  });
});
