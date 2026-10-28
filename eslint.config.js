import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'stats',
      'node_modules',
      // Generated reports / artifacts
      'test-results',
      'playwright-report',
      // Deno-based Supabase edge functions (different runtime & lint rules)
      'supabase/functions',
      // Appwrite function runtime entry (plain JS, deployed as-is)
      'functions',
      // Local dev servers (plain JS/CJS, not part of the app bundle)
      'server',
      // Archived historical documentation
      'docs/archive',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Vercel serverless functions run in Node with browser CORS fetch APIs.
    files: ['api/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, fetch: 'readonly', AbortController: 'readonly' },
    },
  },
  {
    // Unit tests run in Node via vitest.
    files: ['tests/**/*.ts', 'src/**/__tests__/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Playwright specs run in Node.
    files: ['tests/playwright/**/*.ts', 'playwright.config.ts', 'vitest.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  }
);
