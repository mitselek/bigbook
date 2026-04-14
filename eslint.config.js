import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'

export default [
  {
    ignores: ['legacy/**', 'dist/**', '.astro/**', '_pages/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,

  // Architecture boundary: components/ must not import from pages/.
  {
    files: ['src/components/**/*.{ts,tsx,astro}'],
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
          ],
        },
      ],
    },
  },
]
