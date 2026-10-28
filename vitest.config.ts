import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Unit tests only. Playwright specs (*.spec.ts) live under tests/playwright
    // and must never be loaded by vitest.
    include: ['tests/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'tests/playwright/**', '**/*.spec.ts'],
    environment: 'node',
    passWithNoTests: false,
  },
});
