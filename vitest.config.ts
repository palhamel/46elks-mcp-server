import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Do not run the compiled copies of the tests emitted into dist/
    exclude: ['dist/**', 'node_modules/**'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
