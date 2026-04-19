/**
 * Editor happy path — E2E test (issue #29, scenario 1 of 4).
 *
 * Scenario (strengthened per issue #30 / P7):
 *   A signed-in user lands on the reader. The target paragraph's ET text is
 *   EQUAL to baseline at load time (isDiverged === false, no marginalia).
 *   The user opens the inline editor, types new ET text, clicks Salvesta, and
 *   sees:
 *     - the paragraph updated with the new text
 *     - marginalia "originaal" badge appears (because the paragraph is now
 *       diverged from baseline — P7 diff recompute in handleSave)
 *     - the baseline text shown in marginalia is the original load-time ET
 *
 * All network calls are intercepted; no real GitHub or Cloudflare Worker
 * requests are made.
 *
 * Interaction note:
 *   The pencil button is CSS-hidden by default (display: none) and revealed
 *   on .read-row:hover. Playwright's locator.click() dispatches a full pointer
 *   event sequence that, combined with Svelte 5's batched reactivity, can race
 *   with the handleDocClick document listener that guards against outside-editor
 *   clicks cancelling the edit. Using locator.dispatchEvent('click') — which
 *   dispatches a synthetic DOM click without the full pointer simulation —
 *   avoids the race and reliably opens the editor.
 */

import { test, expect } from '@playwright/test'
import { CHAPTERS } from '../../src/lib/content/manifest'
import {
  setupSignedInSession,
  setupChapterContent,
  interceptCommit,
  makeBilingualChapter,
} from './fixtures/editor-e2e'

// ── Fixture data ──────────────────────────────────────────────────────────────

// Pin to ch01 — "Bill's Story" — the canonical first chapter with 72 paraIds.
const CHAPTER = CHAPTERS.find((c) => c.slug === 'ch01')
if (!CHAPTER) throw new Error("Manifest missing 'ch01' — did P1 regenerate correctly?")

const SLUG = CHAPTER.slug // 'ch01'
const PARA_IDS = CHAPTER.paraIds

// The paragraph we will edit — first body paragraph.
const TARGET_PARA_ID = `${SLUG}-p001`

// ET text at load time (= baseline default: "ET tekst <paraId>.").
// No etOverrides → isDiverged is false at load time → no marginalia initially.
const LOADED_ET_TEXT = `ET tekst ${TARGET_PARA_ID}.`

// New text the user types in the editor.
const NEW_ET_TEXT = 'Uus tekst E2E testiga.'
const NEW_SHA = 'new-sha-abc123'

// Build fixture content:
//   - EN:       one line per paraId, distinct English text
//   - ET:       same as baseline for every paraId (no overrides)
//   - baseline: default ET text for every paraId
// This makes ALL paragraphs non-diverged at load time (no marginalia visible).
const CHAPTER_CONTENT = makeBilingualChapter(SLUG, PARA_IDS)

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('Editor happy path', () => {
  test.beforeEach(async ({ page }) => {
    // Wire up all intercepts BEFORE goto.
    await setupSignedInSession(page)
    await setupChapterContent(page, { slug: SLUG, ...CHAPTER_CONTENT })
    // interceptCommit AFTER setupChapterContent (LIFO: this PUT handler fires
    // first; non-PUT falls back to the GET handler in setupChapterContent).
    await interceptCommit(page, { slug: SLUG, responseKind: 'ok', newSha: NEW_SHA })
  })

  test('signs in, edits a non-diverged paragraph, saves, sees marginalia appear with baseline text', async ({
    page,
  }) => {
    // 1. Navigate deep-linked to ch01-h001. In the v1.1 manifest ch01 is at
    //    index 7 (behind 6 front-matter chapters). Deep-linking scrolls ch01
    //    into the viewport, which triggers Astro client:visible hydration and
    //    then the IntersectionObserver load() call.
    await page.goto(`./#${SLUG}-h001`)

    // 2. Wait for signed-in view — "Lahku" button confirms the refresh flow ran.
    await expect(page.locator('#signout-btn')).toBeVisible({ timeout: 15_000 })

    // 3. Wait for the target paragraph row to be visible with the loaded ET text.
    const targetParaRow = page.locator(`#${TARGET_PARA_ID}`)
    await expect(targetParaRow.locator('.col-et')).toContainText(LOADED_ET_TEXT, {
      timeout: 15_000,
    })

    // 4. Assert marginalia is NOT shown because the paragraph is NOT diverged
    //    at load time (ET == baseline). This is the P7 true happy-path start.
    await expect(targetParaRow.locator('.col-marginalia .label')).not.toBeVisible()

    // 5. Open the inline editor by dispatching a synthetic click on the pencil
    //    button. The button is CSS-hidden by default (.read-row:hover reveals
    //    it) — dispatchEvent bypasses actionability checks and avoids a timing
    //    race with Svelte 5's batched DOM updates and the document click guard.
    //    Structure: .editable-wrapper > .read-row > .paragraph-row#TARGET + .pencil-btn
    const readRow = targetParaRow.locator('..')
    const pencilBtn = readRow.locator('.pencil-btn')
    await pencilBtn.dispatchEvent('click')

    // 6. Assert the textarea is visible and pre-filled with the loaded ET text.
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 10_000 })
    await expect(textarea).toHaveValue(LOADED_ET_TEXT)

    // 7. Replace the text with new ET content.
    await textarea.fill(NEW_ET_TEXT)

    // 8. Assert the "Salvesta" button appears (dirty state).
    const salvestaBtn = page.locator('button.btn-save', { hasText: 'Salvesta' })
    await expect(salvestaBtn).toBeVisible()

    // 9. Click Salvesta and wait for the intercepted PUT response.
    const putResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/contents/src/content/et/${SLUG}.md`) &&
        resp.request().method() === 'PUT',
    )
    await salvestaBtn.click()
    const putResponse = await putResponsePromise
    expect(putResponse.status()).toBe(200)

    // 10. Assert the editor closes — textarea and Salvesta button are gone.
    await expect(textarea).not.toBeVisible()
    await expect(salvestaBtn).not.toBeVisible()

    // 11. Assert the paragraph row now renders the updated ET text.
    await expect(targetParaRow.locator('.col-et')).toContainText(NEW_ET_TEXT)

    // 12. Assert the marginalia column NOW shows "originaal" — the paragraph
    //     is now diverged from baseline (P7: handleSave recomputes diff).
    await expect(targetParaRow.locator('.col-marginalia .label')).toContainText('originaal')

    // 13. Assert the baseline text shown in marginalia is the original load-time
    //     ET text (the pre-edit content), not the new edited text.
    await expect(targetParaRow.locator('.col-marginalia .baseline-text')).toContainText(
      LOADED_ET_TEXT,
    )
  })

  test('signs in, edits a diverged paragraph back to baseline, saves, sees marginalia disappear', async ({
    page,
  }) => {
    // Fixture: target paragraph is pre-diverged (ET ≠ baseline).
    // After editing the ET back to baseline text, marginalia should disappear.

    // The baseline/default text for TARGET_PARA_ID in makeBilingualChapter.
    const BASELINE_TEXT = LOADED_ET_TEXT // "ET tekst ch01-billi-lugu-p001."
    // ET at load time is different from baseline — paragraph is diverged.
    const DIVERGED_ET_TEXT = `${BASELINE_TEXT} Lisatext diverged.`

    // Set up interceptors with a pre-diverged fixture.
    const divergedContent = makeBilingualChapter(SLUG, PARA_IDS, {
      etOverrides: { [TARGET_PARA_ID]: DIVERGED_ET_TEXT },
    })

    // Navigate to app root (beforeEach already set up intercepts for the
    // non-diverged fixture, so we need to re-register; the LIFO route system
    // means later registrations take precedence).
    await setupChapterContent(page, { slug: SLUG, ...divergedContent })
    await interceptCommit(page, { slug: SLUG, responseKind: 'ok', newSha: 'new-sha-back-to-base' })

    // Navigate deep-linked to ch01-h001 — same reason as the first test.
    await page.goto(`./#${SLUG}-h001`)
    await expect(page.locator('#signout-btn')).toBeVisible({ timeout: 15_000 })

    const targetParaRow = page.locator(`#${TARGET_PARA_ID}`)
    await expect(targetParaRow.locator('.col-et')).toContainText(DIVERGED_ET_TEXT, {
      timeout: 15_000,
    })

    // Paragraph is pre-diverged — marginalia should be visible at load.
    await expect(targetParaRow.locator('.col-marginalia .label')).toContainText('originaal')

    // Open the editor.
    const readRow = targetParaRow.locator('..')
    const pencilBtn = readRow.locator('.pencil-btn')
    await pencilBtn.dispatchEvent('click')

    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 10_000 })

    // Edit the text back to match baseline.
    await textarea.fill(BASELINE_TEXT)

    const salvestaBtn = page.locator('button.btn-save', { hasText: 'Salvesta' })
    await expect(salvestaBtn).toBeVisible()

    const putResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/contents/src/content/et/${SLUG}.md`) &&
        resp.request().method() === 'PUT',
    )
    await salvestaBtn.click()
    await putResponsePromise

    // Editor should close.
    await expect(textarea).not.toBeVisible()

    // Paragraph text should show the baseline text.
    await expect(targetParaRow.locator('.col-et')).toContainText(BASELINE_TEXT)

    // Marginalia should disappear — paragraph is no longer diverged.
    await expect(targetParaRow.locator('.col-marginalia .label')).not.toBeVisible()
  })
})
