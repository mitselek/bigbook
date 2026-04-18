/**
 * Editor 409 conflict recovery — E2E test (issue #29, scenario 2 of 4).
 *
 * Scenario (§3.6 row 4):
 *   A signed-in user edits a paragraph and clicks Salvesta. The PUT returns
 *   409 (sha conflict). The UI must:
 *     - Show the Estonian conflict banner
 *     - Keep the textarea visible with the user's typed text
 *     - Switch the textarea to readonly
 *     - Replace Salvesta/Tühista buttons with Sulge + Kopeeri ja laadi uuesti
 *     - Keep the user signed in
 *
 * The destructive "Kopeeri ja laadi uuesti" button is NOT clicked in this test
 * (it calls navigator.clipboard.writeText and window.location.reload — both
 * flaky to assert under Playwright).
 *
 * Interaction note:
 *   The pencil button must be opened via dispatchEvent('click'), not
 *   locator.click(), to avoid a timing race with the document outside-click
 *   guard in EditableRow.svelte (see editor-happy-path.spec.ts for details).
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

// ET text at load time (= baseline default: "ET tekst <paraId>.").
const LOADED_ET_TEXT = `ET tekst ${TARGET_PARA_ID}.`

// New text the user types before the conflict.
const NEW_ET_TEXT = 'Muudatus mis põrkub konfliktiga.'

// Build fixture content — all paragraphs non-diverged at load time.
const CHAPTER_CONTENT = makeBilingualChapter(SLUG, PARA_IDS)

// Exact conflict banner text from EditableRow.svelte {#if editorState.conflict} branch.
// Playwright's toContainText normalises whitespace so the mid-template newline is fine.
const CONFLICT_BANNER_TEXT =
  'Seda lõiku on vahepeal muudetud. Sinu muudatused on alles — kopeeri tekst ja laadi leht uuesti.'

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('Editor 409 conflict recovery', () => {
  test.beforeEach(async ({ page }) => {
    // Wire up all intercepts BEFORE goto.
    await setupSignedInSession(page)
    await setupChapterContent(page, { slug: SLUG, ...CHAPTER_CONTENT })
    // interceptCommit AFTER setupChapterContent (LIFO: PUT handler fires first;
    // non-PUT falls back to the GET handler registered by setupChapterContent).
    await interceptCommit(page, { slug: SLUG, responseKind: 'conflict' })
  })

  test('PUT returns 409 → conflict banner visible, textarea readonly with typed text, action buttons switched, user still signed in', async ({
    page,
  }) => {
    // 1. Navigate to the app root.
    await page.goto('./')

    // 2. Wait for signed-in view — "Lahku" button confirms the auth refresh ran.
    await expect(page.locator('#signout-btn')).toBeVisible({ timeout: 15_000 })

    // 3. Wait for the target paragraph row to be visible.
    const targetParaRow = page.locator(`#${TARGET_PARA_ID}`)
    await expect(targetParaRow).toBeVisible({ timeout: 15_000 })
    await expect(targetParaRow.locator('.col-et')).toContainText(LOADED_ET_TEXT)

    // 4. Open the inline editor by dispatching a synthetic click on the pencil
    //    button — bypasses actionability checks and avoids the outside-click race.
    const readRow = targetParaRow.locator('..')
    const pencilBtn = readRow.locator('.pencil-btn')
    await pencilBtn.dispatchEvent('click')

    // 5. Assert the textarea is visible and pre-filled.
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 10_000 })
    await expect(textarea).toHaveValue(LOADED_ET_TEXT)

    // 6. Type new ET text.
    await textarea.fill(NEW_ET_TEXT)

    // 7. Assert Salvesta is visible (dirty state).
    const salvestaBtn = page.locator('button.btn-save', { hasText: 'Salvesta' })
    await expect(salvestaBtn).toBeVisible()

    // 8. Click Salvesta; capture the PUT response (expect exactly one hit).
    let putCount = 0
    const putResponsePromise = page.waitForResponse((resp) => {
      const isPut =
        resp.url().includes(`/contents/src/content/et/${SLUG}.md`) &&
        resp.request().method() === 'PUT'
      if (isPut) putCount++
      return isPut
    })
    await salvestaBtn.click()
    const putResponse = await putResponsePromise
    expect(putResponse.status()).toBe(409)

    // Assert no silent retry on 409 — the component must call PUT exactly once.
    // (Retries are only for 401, locked in by commit f9b8ecc.)
    expect(putCount).toBe(1)

    // 9. Assert the conflict banner is visible with the expected text.
    const conflictBanner = page.locator('.conflict-banner')
    await expect(conflictBanner).toBeVisible({ timeout: 5_000 })
    await expect(conflictBanner).toContainText(CONFLICT_BANNER_TEXT)

    // 10. Assert the textarea is still visible and contains the user's typed text.
    await expect(textarea).toBeVisible()
    await expect(textarea).toHaveValue(NEW_ET_TEXT)

    // 11. Assert the textarea is now readonly.
    await expect(textarea).toHaveAttribute('readonly', '')

    // 12. Assert conflict-specific action buttons are present.
    await expect(page.locator('button.btn-cancel', { hasText: 'Sulge' })).toBeVisible()
    await expect(
      page.locator('button.btn-save', { hasText: 'Kopeeri ja laadi uuesti' }),
    ).toBeVisible()

    // 13. Assert normal Salvesta and Tühista buttons are NOT present.
    await expect(page.locator('button.btn-save', { hasText: 'Salvesta' })).not.toBeVisible()
    await expect(page.locator('button.btn-cancel', { hasText: 'Tühista' })).not.toBeVisible()

    // 14. Assert the user is still signed in — signout button present, no Sisene.
    await expect(page.locator('#signout-btn')).toBeVisible()
    await expect(page.locator('button', { hasText: 'Sisene' })).not.toBeVisible()
  })
})
