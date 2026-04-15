# BigBook v1 Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the content format, the pure-lib foundation (parse/validate/diff), mock ET/EN content bootstrapped into `src/content/`, and development infrastructure (Svelte 5 + a11y lint + Playwright scaffold + size-limit stub + upgraded lefthook hooks). Everything Vitest-testable. No UI, no runtime fetch yet.

**Architecture:** This plan lands the substrate Plans 2-4 build on top of. `src/lib/content/` becomes the input to Plan 2's runtime fetch and Plan 3's editor pre-flight. `src/content/{et,en}/` is populated by a one-shot `CONTENT_BOOTSTRAP=1` script that scrapes the legacy Jekyll ET text and translates it to EN via the Claude API. A two-commit dance captures the content (commit A) and pins `BASELINE_COMMIT_SHA` (commit B) for the diff machinery. Pre-commit hooks are upgraded: `legacy-guard` restored via a shell script to work around the Git Bash escaping bug from session 2, `content-guard` new, `hard-invariant` new and sharing `src/lib/content/validate.ts` with Plan 3's editor pre-flight.

**Tech Stack:** TypeScript 5 (strict), Astro 5, Svelte 5 (for Plan 2 islands — installed now so Plan 2 starts ready), Vitest 2.x + jsdom + `@testing-library/svelte` + `@testing-library/jest-dom`, ESLint 9 flat config + `typescript-eslint` + `eslint-plugin-astro` + `eslint-plugin-svelte`, Prettier 3 + `prettier-plugin-astro`, lefthook pre-commit, Playwright (scaffold only — tests land in Plan 2), size-limit (scaffold only — real budgets measured in Plan 4), Claude API (`claude-opus-4-6`) for the one-shot translation.

**Tracking issue:** [#3 — Epic: v1-foundation](https://github.com/mitselek/bigbook/issues/3)
**Milestone:** [v1-foundation](https://github.com/mitselek/bigbook/milestone/1)
**Design spec:** [Discussion #2](https://github.com/mitselek/bigbook/discussions/2) · committed at [`docs/superpowers/specs/2026-04-14-bigbook-reader-design.md`](../specs/2026-04-14-bigbook-reader-design.md)
**Commit convention:** every commit in this plan has `Part of #3` in the body. The final commit of Phase 6 uses `Closes #3`.

---

## Plan context

### Starting state (before Plan 1)

- Astro 5 scaffold from session 2 with a minimal `src/pages/index.astro`, `src/layouts/Layout.astro`, `src/pages/404.astro`
- GitHub App PKCE auth PoC under `src/lib/auth/` with a Cloudflare Worker token-exchange proxy at `worker/`
- Root configs: `astro.config.mjs`, `tsconfig.json`, `package.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `lefthook.yml`
- `docs/architecture.md`, `docs/legacy.md`, `docs/deploy.md`, `docs/superpowers/specs/2026-04-14-bigbook-reader-design.md`
- `tests/smoke.test.ts`
- Legacy Jekyll archive frozen under `legacy/` (read-only per the Coexistence Boundary)
- **No** Svelte, **no** Playwright, **no** size-limit; lefthook has only `typecheck`, `eslint`, `prettier`

### Ending state (after Plan 1)

- All new dependencies installed and wired: Svelte 5 as an Astro integration, a11y ESLint plugins, Playwright config, size-limit config
- `src/lib/content/parse.ts`, `validate.ts`, `diff.ts` — three pure modules, Vitest-covered at ≥90% lines/functions/statements and ≥85% branches
- `src/lib/content/manifest.ts` and `src/lib/content/baseline-config.ts` — both emitted by the bootstrap script
- `src/content/et/*.md` and `src/content/en/*.md` — mock content with `para-id` directives, passing the Hard Invariant
- `scripts/bootstrap-mock-content.mjs` — one-shot, committed for future reference
- `scripts/legacy-guard.sh` + `scripts/content-guard.sh` — pre-commit hook logic as shell scripts
- `lefthook.yml` with `typecheck`, `eslint`, `prettier`, `legacy-guard`, `content-guard`, `hard-invariant` all active
- `playwright.config.ts` — scaffold only (no tests yet)
- `.size-limit.json` — scaffold only (placeholder budgets)

### File structure map

New files are marked `[new]`, modified `[mod]`, untouched files omitted.

```
bigbook/
├── src/
│   ├── content/
│   │   ├── et/                      [new] ~20 chapter files
│   │   └── en/                      [new] ~20 chapter files (auto-translated)
│   ├── lib/
│   │   └── content/                 [new]
│   │       ├── parse.ts
│   │       ├── validate.ts
│   │       ├── diff.ts
│   │       ├── manifest.ts          (emitted by bootstrap)
│   │       └── baseline-config.ts   (emitted by bootstrap)
├── scripts/                         [new]
│   ├── bootstrap-mock-content.mjs
│   ├── legacy-guard.sh
│   └── content-guard.sh
├── tests/
│   ├── lib/
│   │   └── content/                 [new]
│   │       ├── parse.test.ts
│   │       ├── validate.test.ts
│   │       └── diff.test.ts
│   └── e2e/.gitkeep                 [new] (Plan 2 adds tests here)
├── playwright.config.ts             [new]
├── .size-limit.json                 [new]
├── astro.config.mjs                 [mod] add @astrojs/svelte integration
├── eslint.config.js                 [mod] add svelte + astro a11y rules
├── vitest.config.ts                 [mod] add jsdom env + svelte support
├── package.json                     [mod] deps + scripts
└── lefthook.yml                     [mod] legacy-guard + content-guard + hard-invariant
```

### Phases

- **Phase 0 — Infrastructure:** install Svelte 5 + a11y plugins + Playwright + size-limit, wire configs, verify the dev loop
- **Phase 1 — Parse module:** `src/lib/content/parse.ts` parses `::para[id]` directives + YAML frontmatter
- **Phase 2 — Validate module:** `src/lib/content/validate.ts` enforces the Hard Invariant + structured errors
- **Phase 3 — Diff module:** `src/lib/content/diff.ts` returns diverged `para-id`s between current and baseline
- **Phase 4 — Bootstrap script:** `scripts/bootstrap-mock-content.mjs` scrapes legacy, calls Claude, emits manifest
- **Phase 5 — Pre-commit hooks:** `legacy-guard` restored, `content-guard` new, `hard-invariant` new
- **Phase 6 — Land the content:** run the bootstrap, commit A (content + manifest), commit B (baseline SHA constant)

---

## Phase 0: Infrastructure

Phase 0 installs every new dependency and wires every config Plans 1-4 will need, so Phase 1 onward has a working dev loop (typecheck + lint + test + build + size-limit check + Playwright scaffold) green on a clean tree.

Nothing in Phase 0 is TDD per se (there is no behavior to test yet — these are pure config changes). Each task substitutes the "run failing test" step with a "run verification command and confirm expected output" step.

**Files touched in Phase 0:**

- Create: `playwright.config.ts`, `.size-limit.json`, `tests/e2e/.gitkeep`
- Modify: `package.json`, `astro.config.mjs`, `eslint.config.js`, `vitest.config.ts`

### Task P0.1: Install new dependencies

**Files:**

- Modify: `package.json`, `package-lock.json` (via npm)

New devDependencies:

| Package                            | Purpose                                                         |
| ---------------------------------- | --------------------------------------------------------------- |
| `@astrojs/svelte@^6.0.0`           | Astro 5 ↔ Svelte 5 integration                                  |
| `svelte@^5.0.0`                    | Svelte 5 runtime                                                |
| `@testing-library/svelte@^5.2.0`   | Component tests (used in Plan 2)                                |
| `@testing-library/jest-dom@^6.5.0` | Vitest matchers (`.toBeInTheDocument`, etc.)                    |
| `jsdom@^25.0.0`                    | DOM environment for Vitest                                      |
| `eslint-plugin-svelte@^2.45.0`     | Svelte lint rules incl. built-in a11y rules                     |
| `@playwright/test@^1.48.0`         | E2E test framework (config scaffolded in P0.5, tests in Plan 2) |
| `size-limit@^11.1.0`               | Bundle size budget tool                                         |
| `@size-limit/preset-app@^11.1.0`   | `size-limit` preset for web apps (measures gzipped output)      |

- [ ] **Step 1: Install the packages**

Run:

```bash
npm install --save-dev \
  @astrojs/svelte@^6.0.0 \
  svelte@^5.0.0 \
  @testing-library/svelte@^5.2.0 \
  @testing-library/jest-dom@^6.5.0 \
  jsdom@^25.0.0 \
  eslint-plugin-svelte@^2.45.0 \
  @playwright/test@^1.48.0 \
  size-limit@^11.1.0 \
  @size-limit/preset-app@^11.1.0
```

Expected: npm installs all packages, updates `package.json` and `package-lock.json`, no errors. If npm reports version conflicts, investigate — most likely `@astrojs/svelte` vs Svelte or Astro major versions. Loosen a single version to the latest stable release if necessary; record in the commit body what you loosened and why.

- [ ] **Step 2: Install the Playwright browser binaries**

Run:

```bash
npx playwright install chromium firefox webkit
```

Expected: Playwright downloads the three browsers into its cache. Takes 1-2 minutes. The downloaded browsers are outside the repo (in `%USERPROFILE%\AppData\Local\ms-playwright\` on Windows) so there's nothing to gitignore.

- [ ] **Step 3: Add the new npm scripts to `package.json`**

Current scripts block:

```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run"
  },
```

Replace with:

```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest",
    "size": "size-limit",
    "e2e": "playwright test --project=chromium",
    "e2e:all-browsers": "playwright test"
  },
```

- [ ] **Step 4: Verify install**

Run:

```bash
npm run typecheck
```

Expected: exit 0, no output beyond tsc's normal banner. If errors mention missing modules for any of the newly-installed packages, the install is broken — diagnose before continuing.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore(deps): add svelte 5, testing-library, playwright, size-limit

Installs the full dev-infrastructure dependency set for v1:
- @astrojs/svelte + svelte 5 for interactive islands (used from Plan 2)
- @testing-library/svelte + @testing-library/jest-dom + jsdom for
  component tests
- eslint-plugin-svelte for lint including built-in a11y rules
- @playwright/test for E2E (config scaffolded in P0.5, tests land in
  Plan 2)
- size-limit + @size-limit/preset-app for bundle budget gates

Adds corresponding npm scripts: test:coverage, test:watch, size,
e2e, e2e:all-browsers.

Part of #3
(*BB:Plantin*)
EOF
)"
```

### Task P0.2: Wire `@astrojs/svelte` integration

**Files:**

- Modify: `astro.config.mjs`

- [ ] **Step 1: Update `astro.config.mjs`**

Current content:

```js
import { defineConfig } from 'astro/config'

export default defineConfig({
  output: 'static',
  site: 'https://mitselek.github.io/bigbook/',
  base: '/bigbook',
  trailingSlash: 'always',
})
```

Replace with:

```js
import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'

export default defineConfig({
  output: 'static',
  site: 'https://mitselek.github.io/bigbook/',
  base: '/bigbook',
  trailingSlash: 'always',
  integrations: [svelte()],
})
```

- [ ] **Step 2: Verify the integration loads**

Run:

```bash
npx astro check
```

Expected: no errors about `@astrojs/svelte`. If Astro reports that Svelte is not installed, something's wrong with P0.1 — re-run `npm install`.

- [ ] **Step 3: Verify the build still works**

Run:

```bash
npm run build
```

Expected: exit 0, `dist/` produced, no warnings about the Svelte integration.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs
git commit -m "$(cat <<'EOF'
feat(astro): wire @astrojs/svelte integration

Adds svelte() to the astro.config.mjs integrations array so Plan 2
can create .svelte interactive islands. No .svelte files exist yet;
this is pure wiring.

Part of #3
(*BB:Plantin*)
EOF
)"
```

### Task P0.3: Wire ESLint a11y rule sets

**Files:**

- Modify: `eslint.config.js`

The current config already has `astro.configs.recommended` from `eslint-plugin-astro`. The recommended set doesn't include the a11y rules — those live in `astro.configs['jsx-a11y']` (misleadingly named — it applies to `.astro` files via a ported rule set). For Svelte we add `svelte.configs['flat/recommended']` which brings in the built-in a11y rules by default.

- [ ] **Step 1: Update `eslint.config.js`**

Current content:

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'

export default [
  {
    ignores: ['legacy/**', 'dist/**', '.astro/**', '_pages/**', 'node_modules/**', 'worker/**'],
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
```

Replace with:

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'
import svelte from 'eslint-plugin-svelte'

export default [
  {
    ignores: ['legacy/**', 'dist/**', '.astro/**', '_pages/**', 'node_modules/**', 'worker/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  ...svelte.configs['flat/recommended'],

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
```

Three additions:

1. `import svelte from 'eslint-plugin-svelte'` at the top
2. `...astro.configs['jsx-a11y-recommended']` — ports the jsx-a11y rules onto `.astro` files
3. `...svelte.configs['flat/recommended']` — Svelte recommended config, which includes built-in a11y rules
4. Expanded the `components/` boundary glob to `.svelte` and the `lib/` forbidden imports to include `svelte`

- [ ] **Step 2: Verify ESLint accepts the config**

Run:

```bash
npx eslint --print-config src/lib/auth/config.ts | grep -c '"rules"'
```

Expected: `1` (one "rules" key in the resolved config, meaning the config parses cleanly). If it errors with "Cannot find plugin…" then something in P0.1 didn't install correctly.

- [ ] **Step 3: Run full lint and confirm zero errors**

Run:

```bash
npm run lint
```

Expected: exit 0, zero errors, zero warnings. The existing files in `src/` do not yet violate any of the newly-added rules (all the new rules target `.svelte` files or jsx-a11y patterns, neither of which exist in the tree yet).

- [ ] **Step 4: Commit**

```bash
git add eslint.config.js
git commit -m "$(cat <<'EOF'
feat(eslint): add svelte + astro a11y rule sets

Extends the flat config with:
- eslint-plugin-svelte (flat/recommended) — covers .svelte files
  including built-in a11y rules
- astro.configs['jsx-a11y-recommended'] — ports jsx-a11y to .astro files
- Expanded the components/ boundary glob to include .svelte
- Added 'svelte' imports to lib/'s forbidden-imports list

No .svelte files exist yet; the new rules activate once Plan 2 adds them.

Part of #3
(*BB:Plantin*)
EOF
)"
```

### Task P0.4: Wire Vitest jsdom environment + Svelte support

**Files:**

- Modify: `vitest.config.ts`
- Create: `tests/setup.ts`

Vitest component tests for Svelte need: (a) a DOM environment (jsdom), (b) the Svelte Vite plugin so `.svelte` imports in tests compile, (c) `@testing-library/jest-dom/vitest` registered so `.toBeInTheDocument` et al. are available.

- [ ] **Step 1: Create `tests/setup.ts`**

New file content:

```ts
import '@testing-library/jest-dom/vitest'
```

This single import extends Vitest's `expect` with the jest-dom matchers. Keeping it in a setup file rather than in each test file avoids repetition.

- [ ] **Step 2: Update `vitest.config.ts`**

Current content:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['legacy/**', 'node_modules/**', 'dist/**', 'stories/**', '_pages/**', 'worker/**'],
  },
})
```

Replace with:

```ts
import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({ hot: false })],
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
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/content/manifest.ts', 'src/lib/content/baseline-config.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 85,
      },
    },
  },
})
```

Key changes:

- `plugins: [svelte({ hot: false })]` — let Vitest compile `.svelte` imports in component tests. `hot: false` disables HMR which Vitest doesn't use.
- `environment: 'jsdom'` — DOM available in every test (safe for lib/ tests that don't use DOM, essential for components)
- `setupFiles: ['tests/setup.ts']` — register jest-dom matchers
- `exclude: […, 'tests/e2e/**']` — keep Playwright tests out of Vitest's run
- `coverage` — enforce the Layer 3 thresholds from common-prompt (≥90% lines/functions/statements, ≥85% branches) **only for `src/lib/**/\*.ts`\*\*. Excludes the two emitted constant files.

`@sveltejs/vite-plugin-svelte` is brought in transitively by `@astrojs/svelte` so it's already in `node_modules` — no extra install needed.

- [ ] **Step 3: Run the existing smoke test under the new config**

Run:

```bash
npm run test
```

Expected: `tests/smoke.test.ts` still passes. If it fails with "Cannot find module 'jsdom'", check P0.1. If it fails with coverage errors, the `src/lib/` coverage may be below threshold because `src/lib/auth/` is untested — that's fine in v1, but the coverage gate only applies to `npm run test:coverage`, not `npm run test`. Confirm `test` is green.

- [ ] **Step 4: Run the coverage command once and record what it reports**

Run:

```bash
npm run test:coverage
```

Expected: likely fails with a coverage threshold error because `src/lib/auth/` has no tests. **That's expected at P0 time** — we haven't written auth tests yet (and won't in Plan 1; they're part of Plan 3). The coverage threshold applies only at story-acceptance time per the Layer 3 gate, not per-commit.

To unblock CI, temporarily relax the coverage gate for auth during Plan 1 by narrowing the include glob to only what this plan is adding. Revise `coverage.include` to:

```ts
      include: ['src/lib/content/**/*.ts'],
```

This keeps the ≥90% threshold active against `src/lib/content/` (the modules we're building in Phases 1-3) without blocking Plan 1 on auth coverage. When Plan 3 lands the editor, it'll expand `include` to `src/lib/**/*.ts`.

Re-run:

```bash
npm run test:coverage
```

Expected: coverage reports 100% (because there's nothing in `src/lib/content/` yet so the included set is empty — v8 treats that as satisfied). If the reporter errors on an empty include, also add:

```ts
      all: false,
```

to the coverage block.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/setup.ts
git commit -m "$(cat <<'EOF'
feat(vitest): jsdom env + svelte plugin + coverage thresholds

- plugins: [svelte({ hot: false })] to compile .svelte imports in component tests
- environment: 'jsdom' so tests run with a DOM
- setupFiles register @testing-library/jest-dom matchers
- exclude tests/e2e/** (Playwright handles those)
- coverage.include narrowed to src/lib/content/** for Plan 1 scope;
  Plan 3 will widen to src/lib/** once auth tests land
- coverage thresholds: 90% lines/functions/statements, 85% branches

Part of #3
(*BB:Plantin*)
EOF
)"
```

### Task P0.5: Playwright scaffold

**Files:**

- Create: `playwright.config.ts`
- Create: `tests/e2e/.gitkeep`

No tests yet — just the config and the directory so Plan 2's first E2E task can drop tests in without needing to scaffold.

- [ ] **Step 1: Create `playwright.config.ts`**

New file content:

```ts
import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config.
 *
 * The PR matrix runs Chromium only (see .github/workflows in Plan 4).
 * The `main` branch push matrix adds Firefox and WebKit.
 * Run locally:
 *   - npm run e2e             (chromium only)
 *   - npm run e2e:all-browsers (all three)
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
```

Notes:

- `baseURL` points at Astro's preview server port (default 4321). `webServer` launches `npm run preview` so tests can hit the production-like build; if it's already running (dev loop), reuse it.
- `testDir: './tests/e2e'` matches the Vitest exclusion.
- Three projects (chromium/firefox/webkit) so `--project=chromium` or `--project=webkit` can target one. `npm run e2e` from P0.1 selects Chromium; `npm run e2e:all-browsers` runs all three.
- `trace: 'on-first-retry'` captures a trace file when a test flakes, useful for debugging.

- [ ] **Step 2: Create `tests/e2e/.gitkeep`**

Empty file so the directory is tracked even without tests yet.

```bash
mkdir -p tests/e2e
printf '' > tests/e2e/.gitkeep
```

- [ ] **Step 3: Verify Playwright resolves the config**

Run:

```bash
npx playwright test --list
```

Expected: Playwright reports `Listing tests: 0 tests in 0 files`. If it errors on the config, check the TypeScript syntax. If it errors that browsers aren't installed, re-run `npx playwright install chromium firefox webkit` from P0.1 step 2.

- [ ] **Step 4: Add `playwright-report/`, `test-results/`, and `playwright/.cache/` to `.gitignore`**

Current `.gitignore` ends with `.superpowers/`. Append:

```
# Playwright
playwright-report/
test-results/
playwright/.cache/
```

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/.gitkeep .gitignore
git commit -m "$(cat <<'EOF'
feat(playwright): scaffold config + tests/e2e directory

Adds playwright.config.ts with three browser projects (chromium,
firefox, webkit), webServer auto-launch against `npm run preview`,
and a baseURL of http://localhost:4321 (Astro preview default).

No tests yet; Plan 2 lands the anonymous reader E2E suite here.

Gitignore: playwright-report/, test-results/, playwright/.cache/.

Part of #3
(*BB:Plantin*)
EOF
)"
```

### Task P0.6: size-limit scaffold

**Files:**

- Create: `.size-limit.json`

Placeholder budgets with headroom well above anything we'll have for months. Plan 4 remeasures and tightens them.

- [ ] **Step 1: Create `.size-limit.json`**

New file content:

```json
[
  {
    "name": "Astro JS bundles (gzipped)",
    "path": "dist/_astro/*.js",
    "limit": "150 kB"
  },
  {
    "name": "Astro CSS bundles (gzipped)",
    "path": "dist/_astro/*.css",
    "limit": "40 kB"
  },
  {
    "name": "Root index.html (raw)",
    "path": "dist/index.html",
    "gzip": false,
    "limit": "200 kB"
  }
]
```

These are intentionally generous (roughly 2× the v1 targets documented in the spec) so CI doesn't fail during Plans 1-3. Plan 4 retunes against measured values.

- [ ] **Step 2: Verify size-limit reads the config**

Run:

```bash
npm run build
npm run size
```

Expected: build succeeds and `size-limit` reports that current bundles are well under budget. If the build has no `dist/_astro/*.js` files (Astro build produces them lazily when there's content), size-limit may report "No files matched" — that's acceptable at P0 time and will self-correct once Plan 2 adds Svelte islands.

- [ ] **Step 3: Commit**

```bash
git add .size-limit.json
git commit -m "$(cat <<'EOF'
feat(size-limit): scaffold placeholder budgets

Three budget targets wired as a hard gate via the `npm run size`
script (which Plan 4 adds to CI):

- dist/_astro/*.js: 150 kB gzipped (~2× spec target)
- dist/_astro/*.css: 40 kB gzipped (~2× spec target)
- dist/index.html: 200 kB raw

Budgets are generous on purpose — they catch catastrophic regressions
during Plans 1-3 without blocking routine work. Plan 4 retunes against
measured values.

Part of #3
(*BB:Plantin*)
EOF
)"
```

### Task P0.7: Verify the full dev loop

No new files or commits. Just a sanity check that everything P0 wired up works together.

- [ ] **Step 1: Run every gate**

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npm run size
```

Expected: every command exits 0. If any fail, diagnose and fix before moving on — Phase 1's first test commit assumes a green baseline.

- [ ] **Step 2: Verify the lefthook hooks still fire**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
chore: verify lefthook after P0 infrastructure

This is an empty commit to trigger the pre-commit hooks and confirm
they run green on the P0-state tree. No code change; will be removed
or kept for history at Plantin's discretion.

Part of #3
(*BB:Plantin*)
EOF
)"
```

Expected: lefthook runs typecheck + eslint + prettier, reports "skip" on everything (no staged files), commits the empty commit.

Optionally `git reset HEAD~1` to drop the empty commit — or keep it as a marker that P0 verification passed. Plantin's call; not load-bearing either way.

- [ ] **Step 3: Push P0 to origin/main**

```bash
git push origin main
```

Expected: push succeeds. The `build-and-deploy.yml` workflow runs; Astro build passes (no source changes); Pages deploy succeeds. The live site is unchanged from before Plan 1 started — Phase 0 is invisible to end users.

---

## Phases 1-6

Intentionally blank until Phase 0 is reviewed and merged. Each subsequent phase is appended to this file in its own commit and presented for review before Plantin writes the next one.

(_BB:Plantin_)
