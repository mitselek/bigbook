import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    conditions: ['browser'],
    // Alias prettier to its Node-API entry so tests that import format.ts
    // (a Node-only script module) resolve resolveConfig correctly.
    // The 'browser' condition above would otherwise pick standalone.mjs,
    // which omits resolveConfig.
    alias: {
      prettier: new URL('./node_modules/prettier/index.mjs', import.meta.url).pathname,
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: [
      'legacy/**',
      'node_modules/**',
      'dist/**',
      'stories/**',
      '_pages/**',
      'worker/**',
      'tests/e2e/**',
    ],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**/*.ts',
        'src/lib/**/*.svelte.ts',
        'scripts/pair-en-et/**/*.ts',
        'scripts/bootstrap-content/**/*.ts',
      ],
      exclude: [
        'src/lib/content/manifest.ts',
        'src/lib/content/baseline-config.ts',
        'scripts/pair-en-et/pair.ts',
        'scripts/bootstrap-content/bootstrap.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 85,
      },
      all: false,
    },
  },
})
