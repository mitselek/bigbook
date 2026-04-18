/**
 * Editor happy path — E2E test (issue #29, scenario 1 of 4).
 *
 * Scenario:
 *   A signed-in user lands on the reader, opens the inline editor for a
 *   paragraph whose ET text already diverges from baseline, types new ET text,
 *   clicks Salvesta, and sees the paragraph updated with the new text while
 *   the marginalia "originaal" badge remains visible (divergence persists
 *   because isDiverged is computed at load time and is not reset on commit).
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

// Use the first chapter from the manifest — ch01-billi-lugu with 43 paraIds.
const CHAPTER = CHAPTERS[0]
if (!CHAPTER) throw new Error('No chapters in manifest — check manifest.ts')

const SLUG = CHAPTER.slug // 'ch01-billi-lugu'
const PARA_IDS = CHAPTER.paraIds

// The paragraph we will edit — first body paragraph.
const TARGET_PARA_ID = `${SLUG}-p001`
// ET text for the target paragraph at load time (differs from baseline so
// isDiverged is true and marginalia is shown before the edit).
const LOADED_ET_TEXT = `ET tekst ${TARGET_PARA_ID} muudetud.`
// New text the user types in the editor.
const NEW_ET_TEXT = 'Uus tekst E2E testiga.'
const NEW_SHA = 'new-sha-abc123'

// Build fixture content:
//   - EN:       one line per paraId, distinct English text
//   - ET:       same as baseline for all paragraphs except TARGET_PARA_ID
//   - baseline: default ET text for every paraId (no overrides)
// This makes TARGET_PARA_ID diverged at load time so marginalia renders.
const CHAPTER_CONTENT = makeBilingualChapter(SLUG, PARA_IDS, {
  etOverrides: { [TARGET_PARA_ID]: LOADED_ET_TEXT },
})

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

  test('signs in, edits a diverged paragraph, saves, sees updated text and marginalia', async ({
    page,
  }) => {
    // 1. Navigate to the app root.
    await page.goto('./')

    // 2. Wait for signed-in view — "Lahku" button confirms the refresh flow ran.
    await expect(page.locator('#signout-btn')).toBeVisible({ timeout: 15_000 })

    // 3. Wait for the target paragraph row to be visible with the loaded ET text.
    //    The first chapter loads automatically via IntersectionObserver when
    //    it enters the viewport on page load.
    const targetParaRow = page.locator(`#${TARGET_PARA_ID}`)
    await expect(targetParaRow).toBeVisible({ timeout: 15_000 })
    await expect(targetParaRow.locator('.col-et')).toContainText(LOADED_ET_TEXT)

    // 4. Verify marginalia is shown because the paragraph is already diverged.
    await expect(targetParaRow.locator('.col-marginalia .label')).toContainText('originaal')

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

    // 12. Assert the marginalia column still shows "originaal" — isDiverged was
    //     true at load time and is not reset on commit, so the Marginalia
    //     component stays mounted with the original baseline text.
    await expect(targetParaRow.locator('.col-marginalia .label')).toContainText('originaal')
  })
})
