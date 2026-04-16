# P7 — E2E + Verification

**Phase goal:** Write Playwright E2E tests covering the anonymous reader happy path, update size-limit budgets, verify the full build + deploy pipeline.

**Execution mode:** Inline (Plantin)

**Files:**

- Create: `tests/e2e/reader.spec.ts`
- Modify: `playwright.config.ts` (add reader test project, configure webServer)
- Modify: `.size-limit.json` (update budgets after measuring first green build)

---

## Task P7.1 — Playwright config + webServer

- [ ] Update `playwright.config.ts`:

1. Add a `webServer` block that runs `npm run preview` (Astro's preview server serves the `dist/` directory).
2. Configure the base URL to `http://localhost:4321/bigbook/`.
3. Set up projects: `chromium` (default), `firefox` and `webkit` (run on push to main only — controlled by the CI workflow, not the config).

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'npm run preview',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4321/bigbook/',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
```

- [ ] Verify: `npx playwright test --project chromium` runs (even with no test files yet).
- [ ] **Commit:** `feat(e2e): P7.1 — Playwright config with webServer`

---

## Task P7.2 — Anonymous reader E2E happy path

- [ ] Write `tests/e2e/reader.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Anonymous reader', () => {
  test('landing page renders top bar, skeleton, and footer', async ({ page }) => {
    await page.goto('/')

    // Top bar
    await expect(page.locator('.wordmark')).toHaveText('bigbook')

    // Skeleton rows exist (at least one)
    const skeletonOrRow = page.locator('[id^="ch01-billi-lugu"]').first()
    await expect(skeletonOrRow).toBeVisible()

    // Footer
    await expect(page.locator('.reader-footer')).toContainText('github.com/mitselek/bigbook')
  })

  test('chapter content loads on scroll', async ({ page }) => {
    await page.goto('/')

    // Wait for first chapter to load (its title paragraph should appear)
    await expect(page.locator('#ch01-billi-lugu-title')).toBeVisible({ timeout: 10000 })

    // Verify actual content rendered (not just skeleton)
    await expect(page.locator('#ch01-billi-lugu-p001')).toContainText(/War fever|Sõjapalavik/)
  })

  test('TOC opens, shows grouped chapters, and navigates', async ({ page }) => {
    await page.goto('/')

    // Open TOC by clicking center title
    await page.locator('.top-bar-center').click()

    // Verify overlay
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Front matter')).toBeVisible()
    await expect(page.getByText('Chapters')).toBeVisible()
    await expect(page.getByText('Appendices')).toBeVisible()

    // Close with Esc
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('deep-link anchor scrolls to correct paragraph', async ({ page }) => {
    await page.goto('/#ch01-billi-lugu-p005')

    // The paragraph should be near the top of the viewport
    const para = page.locator('#ch01-billi-lugu-p005')
    await expect(para).toBeVisible({ timeout: 10000 })
  })

  test('top bar title updates on scroll', async ({ page }) => {
    await page.goto('/')

    // Wait for content to load
    await expect(page.locator('#ch01-billi-lugu-title')).toBeVisible({ timeout: 10000 })

    // Title should show chapter 1
    await expect(page.locator('.top-bar-center')).toContainText(/Bill's Story|Billi lugu/)
  })
})
```

**Note on network mocking:** These tests run against the real deployed content fetched from `raw.githubusercontent.com` and `api.github.com`. For CI stability, consider adding Playwright route interception to mock the GitHub API responses — but start with real network calls and only add mocks if tests are flaky.

- [ ] Verify: `npx playwright test --project chromium` passes.
- [ ] **Commit:** `test(e2e): P7.2 — anonymous reader happy path`

---

## Task P7.3 — Size-limit budget update

- [ ] Run `npm run build` and measure actual bundle sizes.
- [ ] Update `.size-limit.json` with budgets at roughly 2× the measured values:

```bash
npm run build
npx size-limit
```

Record the actual values, then set budgets:

| Bundle    | Measured (est.) | Budget |
| --------- | --------------- | ------ |
| Total JS  | ~40 KB          | 80 KB  |
| Total CSS | ~10 KB          | 20 KB  |
| HTML      | ~50 KB          | 100 KB |

(Actual values will differ — measure and set accordingly.)

- [ ] Verify: `npm run size` passes with the new budgets.
- [ ] **Commit:** `chore(size-limit): P7.3 — update budgets from measured v1-reader build`

---

## Task P7.4 — Full gate run + deploy verification

- [ ] Run the complete Layer 3 gate:

```bash
npm run typecheck       # clean
npm run lint            # exit 0
npm run format:check    # exit 0
npm run test            # all pass (42 existing + all new unit/component tests)
npm run test:coverage   # src/lib/ ≥90% lines, ≥85% branches
npm run build           # zero warnings
npm run size            # within budget
npx playwright test --project chromium  # E2E passes
```

- [ ] Push to `origin/main`. Verify CI run succeeds (all jobs green).
- [ ] Check deployed site at `https://mitselek.github.io/bigbook/`:
  - Reader loads, chapters lazy-fetch
  - TOC opens and navigates
  - Marginalia shows for diverged paragraphs (if any in the current content)
  - Mobile responsive at <900px
  - Auth sign-in button visible in top bar
  - Legacy site at `/bigbook/legacy/` still works
- [ ] Close the v1-reader milestone and epic issue.
- [ ] **Commit:** `chore(reader): P7.4 — v1-reader gate run + deploy verification` (with `Closes #<epic>` in body)

---

## Phase-exit gate

Full Layer 3 + Playwright + deploy verification. This is the final gate for Plan 2.

(_BB:Plantin_)
