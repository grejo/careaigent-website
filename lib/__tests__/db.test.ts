// Mock the adapter BEFORE importing the module under test
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({
    // Minimal mock — PrismaClient just needs an object here
  })),
}));

// Also mock @prisma/client to avoid actual connection attempts
jest.mock('@prisma/client', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    activity: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    registration: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    admin: { findUnique: jest.fn(), upsert: jest.fn() },
    $disconnect: jest.fn(),
  }));
  return { PrismaClient: mockPrismaClient };
});

import { prisma } from '../db';

describe('prisma client', () => {
  it('exports a PrismaClient instance', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.activity.findMany).toBe('function');
    expect(typeof prisma.registration.findMany).toBe('function');
    expect(typeof prisma.admin.findUnique).toBe('function');
  });
});
