import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Component tests should add `@jest-environment jsdom` docblock to override
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
};

export default config;
