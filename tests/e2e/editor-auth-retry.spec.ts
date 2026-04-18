/**
 * Editor 401 silent refresh + retry — E2E test (issue #29, scenario 3 of 4).
 *
 * Scenario (§3.6 row 5):
 *   A signed-in user edits a paragraph and clicks Salvesta. The first PUT to
 *   the GitHub Contents API returns 401 (access token expired). The editor
 *   silently calls the CF Worker /refresh endpoint to mint a new access token,
 *   then retries the PUT — which succeeds with 200. The user never sees a
 *   signed-out state; the editor closes normally and the new ET text renders.
 *
 * Production path: commitEditWithRetry (f9b8ecc) → commit-with-retry.ts.
 * This test locks in the E2E behaviour; the unit-level scenarios are in
 * tests/lib/editor/commit-with-retry.test.ts.
 *
 * All network calls are intercepted; no real GitHub or Cloudflare Worker
 * requests are made.
 *
 * Interaction note:
 *   The pencil button is CSS-hidden by default (display: none) and revealed
 *   on .read-row:hover. Use locator.dispatchEvent('click') — NOT locator.click()
 *   — to avoid a race with Svelte 5's batched reactivity and the document-level
 *   outside-click guard. See playwright_svelte5_gotchas.md for full explanation.
 */

import { test, expect } from '@playwright/test'
import type { Route } from '@playwright/test'
import { CHAPTERS } from '../../src/lib/content/manifest'
import {
  setupSignedInSession,
  setupChapterContent,
  makeBilingualChapter,
  WORKER_URL,
} from './fixtures/editor-e2e'

// ── Fixture data ──────────────────────────────────────────────────────────────

const CHAPTER = CHAPTERS[0]
if (!CHAPTER) throw new Error('No chapters in manifest — check manifest.ts')

const SLUG = CHAPTER.slug // 'ch01-billi-lugu'
const PARA_IDS = CHAPTER.paraIds

// First body paragraph — same target as the happy-path spec.
const TARGET_PARA_ID = `${SLUG}-p001`

// ET text at load time — no etOverrides, so it equals the baseline default.
const LOADED_ET_TEXT = `ET tekst ${TARGET_PARA_ID}.`

// New text the user types in the editor.
const NEW_ET_TEXT = 'Uus tekst 401-retry testiga.'
const NEW_SHA = 'new-sha-retry-001'

// Build fixture content (ET == baseline, all paragraphs non-diverged).
const CHAPTER_CONTENT = makeBilingualChapter(SLUG, PARA_IDS)

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('Editor 401 silent refresh + retry', () => {
  test('PUT returns 401, editor silently refreshes token and retries; second PUT returns 200; user never sees signed-out state', async ({
    page,
  }) => {
    // ── Wire up intercepts BEFORE goto ──────────────────────────────────────

    // Auth session: seeds refresh token in localStorage, intercepts /refresh
    // (responds 200 to every call — boot auth AND the silent retry) and
    // intercepts GET /user.
    await setupSignedInSession(page)

    // Chapter content: intercepts raw.githubusercontent.com (EN, baseline-ET,
    // current-ET @ main) and GET to the GitHub contents API.
    await setupChapterContent(page, { slug: SLUG, ...CHAPTER_CONTENT })

    // ── Commit counter — sequenced 401 → 200 ────────────────────────────────
    // interceptCommit only supports a single uniform response kind, so we
    // register a custom route handler with a closure-captured counter that
    // returns 401 on the first PUT and 200 on the second.
    let putCallCount = 0

    await page.route(
      `https://api.github.com/repos/mitselek/bigbook/contents/src/content/et/${SLUG}.md`,
      (route: Route) => {
        if (route.request().method() !== 'PUT') {
          // GET requests fall back to the setupChapterContent handler (LIFO).
          void route.fallback()
          return
        }

        putCallCount++

        if (putCallCount === 1) {
          // First PUT → 401 (token expired) — triggers silent refresh.
          void route.fulfill({ status: 401, body: 'Unauthorized' })
        } else {
          // Second PUT → 200 (after refresh) — commit succeeds.
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ content: { sha: NEW_SHA } }),
          })
        }
      },
    )

    // Track /refresh calls independently of setupSignedInSession's handler.
    // The handler in setupSignedInSession already intercepts every /refresh
    // call (including the retry), so we only need to count here, not fulfill.
    // Use page.on('request') so we don't interfere with the existing fulfillment.
    let refreshCallCount = 0
    page.on('request', (req) => {
      if (req.url() === `${WORKER_URL}/refresh` && req.method() === 'POST') {
        refreshCallCount++
      }
    })

    // ── Navigate & wait for auth ready ──────────────────────────────────────

    await page.goto('./')

    // "Lahku" button confirms the refresh-token boot flow ran successfully.
    await expect(page.locator('#signout-btn')).toBeVisible({ timeout: 15_000 })

    // ── Wait for chapter load ────────────────────────────────────────────────

    const targetParaRow = page.locator(`#${TARGET_PARA_ID}`)
    await expect(targetParaRow).toBeVisible({ timeout: 15_000 })
    await expect(targetParaRow.locator('.col-et')).toContainText(LOADED_ET_TEXT)

    // ── Open the inline editor (dispatchEvent — see gotchas doc) ────────────

    const readRow = targetParaRow.locator('..')
    const pencilBtn = readRow.locator('.pencil-btn')
    await pencilBtn.dispatchEvent('click')

    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 10_000 })

    // ── Type new ET text ─────────────────────────────────────────────────────

    await textarea.fill(NEW_ET_TEXT)

    const salvestaBtn = page.locator('button.btn-save', { hasText: 'Salvesta' })
    await expect(salvestaBtn).toBeVisible()

    // ── Click Salvesta — wait for BOTH PUTs to complete ─────────────────────
    // The first PUT returns 401; the retry (second PUT) returns 200.
    // We set up two waitForResponse promises before clicking to capture both.
    const firstPutPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/contents/src/content/et/${SLUG}.md`) &&
        resp.request().method() === 'PUT',
    )

    await salvestaBtn.click()

    // Await the first PUT response (401).
    const firstPutResponse = await firstPutPromise

    // Now set up the listener for the second PUT before it arrives.
    const secondPutPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/contents/src/content/et/${SLUG}.md`) &&
        resp.request().method() === 'PUT',
    )

    // Await the second PUT response (200).
    const secondPutResponse = await secondPutPromise

    // ── Assertions ───────────────────────────────────────────────────────────

    // The PUT endpoint was called exactly twice (first 401, then 200).
    expect(firstPutResponse.status()).toBe(401)
    expect(secondPutResponse.status()).toBe(200)
    expect(putCallCount).toBe(2)

    // /refresh was called at least twice: once during auth boot, at least
    // once more for the silent retry between the two commits.
    expect(refreshCallCount).toBeGreaterThanOrEqual(2)

    // Editor closes after the successful second commit.
    await expect(textarea).not.toBeVisible()
    await expect(salvestaBtn).not.toBeVisible()

    // The paragraph row renders the new ET text.
    await expect(targetParaRow.locator('.col-et')).toContainText(NEW_ET_TEXT)

    // Auth widget: "Lahku" (sign-out) button is visible — user is still
    // authenticated. "Sisene" (sign-in) button must NOT appear anywhere.
    await expect(page.locator('#signout-btn')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Sisene' })).not.toBeVisible()
  })
})
