// Mock next-auth before importing auth.ts
jest.mock('next-auth', () => {
  const mockHandlers = { GET: jest.fn(), POST: jest.fn() };
  const mockAuth = jest.fn();
  const mockSignIn = jest.fn();
  const mockSignOut = jest.fn();
  const NextAuth = jest.fn().mockReturnValue({
    handlers: mockHandlers,
    auth: mockAuth,
    signIn: mockSignIn,
    signOut: mockSignOut,
  });
  return {
    __esModule: true,
    default: NextAuth,
  };
});

jest.mock('next-auth/providers/credentials', () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue({ id: 'credentials', type: 'credentials' }),
  };
});

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

// Mock Prisma adapter and client (same pattern as db.test.ts)
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@prisma/client', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    activity: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    registration: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    admin: { findUnique: jest.fn(), upsert: jest.fn() },
    $disconnect: jest.fn(),
  }));
  return { PrismaClient: mockPrismaClient };
});

describe('auth configuration', () => {
  it('exports handlers, auth, signIn, signOut', () => {
    const authModule = require('../../auth');
    expect(authModule.handlers).toBeDefined();
    expect(authModule.auth).toBeDefined();
    expect(authModule.signIn).toBeDefined();
    expect(authModule.signOut).toBeDefined();
  });
});
