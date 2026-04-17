import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'
import svelte from 'eslint-plugin-svelte'
import svelteParser from 'svelte-eslint-parser'
import globals from 'globals'

export default [
  {
    ignores: ['legacy/**', 'dist/**', '.astro/**', '_pages/**', 'node_modules/**', 'worker/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['flat/jsx-a11y-recommended'],
  ...svelte.configs['flat/recommended'],

  // Wire typescript-eslint as the inner parser for <script lang="ts"> in .svelte files
  {
    files: ['**/*.svelte'],
    languageOptions: {
      globals: globals.browser,
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // Honor the leading-underscore convention for intentionally-unused params
  // and locals — standard TypeScript-ESLint practice.
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  // Architecture boundary: components/ must not import from pages/.
  {
    files: ['src/components/**/*.{ts,tsx,astro,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/pages/**', '../pages/**', '../../pages/**'],
              message: 'components/ must not import from pages/ (three-layer boundary).',
            },
          ],
        },
      ],
    },
  },

  // Architecture boundary: lib/ must not import from components/, pages/, or UI runtimes.
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/components/**', '../components/**', '../../components/**'],
              message: 'lib/ must not import from components/ (three-layer boundary).',
            },
            {
              group: ['**/pages/**', '../pages/**', '../../pages/**'],
              message: 'lib/ must not import from pages/ (three-layer boundary).',
            },
            {
              group: ['astro:*'],
              message: 'lib/ must not import from the Astro runtime (keep lib/ headless).',
            },
            {
              group: ['svelte', 'svelte/*'],
              message: 'lib/ must not import from Svelte (keep lib/ headless).',
            },
          ],
        },
      ],
    },
  },
]
