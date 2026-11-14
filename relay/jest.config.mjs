import { createDefaultEsmPreset } from 'ts-jest';

const preset = createDefaultEsmPreset({
  tsconfig: './tsconfig.spec.json',
});

export default {
  ...preset,

  testEnvironment: 'node',

  testMatch: ['<rootDir>/src/**/*.spec.ts'],

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}
