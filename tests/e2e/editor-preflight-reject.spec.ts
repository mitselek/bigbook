/**
 * Editor pre-flight validation rejection — E2E test (issue #29, scenario 4 of 4).
 *
 * §3.6 row 3 — when the user's proposed edit introduces a para-id outside the
 * chapter's reference set, handleSave must:
 *   1. Run preflight() → validateProposedContent() returns !ok (extra_pair).
 *   2. Call commitError('Valideerimisviga: …') — never reaching the PUT.
 *   3. Keep the editor open with the user's typed text preserved.
 *
 * Mechanism: the textarea content is stored as the paragraph text.  When
 * serialize() emits the full chapter it writes that text verbatim.  A line
 * like `::para[ch99-p999]` inside the stored text becomes a new ::para[]
 * directive in the serialized output; parse() sees it as a real paragraph,
 * so validateProposedContent flags it as extra_pair.
 *
 * The bogus para-id used here is `ch99-p999` — guaranteed not to exist in
 * ch01-billi-lugu's manifest.
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
  makeBilingualChapter,
} from './fixtures/editor-e2e'

// ── Fixture data ──────────────────────────────────────────────────────────────

const CHAPTER = CHAPTERS[0]
if (!CHAPTER) throw new Error('No chapters in manifest — check manifest.ts')

const SLUG = CHAPTER.slug // 'ch01-billi-lugu'
const PARA_IDS = CHAPTER.paraIds

// The paragraph we will edit — first body paragraph.
const TARGET_PARA_ID = `${SLUG}-p001`

// ET text at load time (= baseline default: "ET tekst <paraId>.").
const LOADED_ET_TEXT = `ET tekst ${TARGET_PARA_ID}.`

// A bogus para-id guaranteed not to exist in ch01-billi-lugu's manifest.
// When this string appears as a line in the textarea, serialize() emits
// `::para[ch99-p999]` verbatim into the chapter body; parse() treats it as
// a real paragraph; validateProposedContent flags it as extra_pair.
const BOGUS_PARA_DIRECTIVE = '::para[ch99-p999]'

// Textarea input that triggers pre-flight rejection:
// the original paragraph text followed by a bogus ::para directive line and
// additional body text, so the extra para-id injection is clear.
const BOGUS_ET_TEXT = `${LOADED_ET_TEXT}\n${BOGUS_PARA_DIRECTIVE}\nLisarida mis ei peaks siin olema.`

// Build fixture content (no etOverrides → all paragraphs non-diverged at load).
const CHAPTER_CONTENT = makeBilingualChapter(SLUG, PARA_IDS)

// ── Test ──────────────────────────────────────────────────────────────────────

test.describe('Editor pre-flight validation rejection', () => {
  test('pre-flight rejects bogus ::para directive, never fires PUT, shows Estonian error banner, editor stays open', async ({
    page,
  }) => {
    // Track PUT calls — any PUT must NEVER be reached.
    let putCallCount = 0

    // 1. Wire up intercepts BEFORE goto.
    await setupSignedInSession(page)
    await setupChapterContent(page, { slug: SLUG, ...CHAPTER_CONTENT })

    // Register the PUT interceptor. If a PUT is ever attempted, count it
    // (and fulfill with a fake 200 so the test doesn't hang on a timeout).
    // The assertion at the end will catch putCallCount > 0.
    await page.route(
      `https://api.github.com/repos/mitselek/bigbook/contents/src/content/et/${SLUG}.md`,
      (route) => {
        if (route.request().method() === 'PUT') {
          putCallCount++
          // Fulfill to prevent the test from hanging; assertion will catch this.
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ content: { sha: 'should-never-happen' } }),
          })
        } else {
          // GET — fall back to the setupChapterContent handler
          void route.fallback()
        }
      },
    )

    // 2. Navigate to the app root.
    await page.goto('./')

    // 3. Wait for signed-in view — "Lahku" button confirms the refresh flow ran.
    await expect(page.locator('#signout-btn')).toBeVisible({ timeout: 15_000 })

    // 4. Wait for the target paragraph row to be visible.
    const targetParaRow = page.locator(`#${TARGET_PARA_ID}`)
    await expect(targetParaRow).toBeVisible({ timeout: 15_000 })
    await expect(targetParaRow.locator('.col-et')).toContainText(LOADED_ET_TEXT)

    // 5. Open the inline editor via dispatchEvent('click') on the pencil button.
    //    Must use dispatchEvent (not locator.click()) to avoid the timing race
    //    with the document-level outside-click guard in EditableRow.svelte.
    const readRow = targetParaRow.locator('..')
    const pencilBtn = readRow.locator('.pencil-btn')
    await pencilBtn.dispatchEvent('click')

    // 6. Assert the textarea is visible and pre-filled with the loaded ET text.
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible({ timeout: 10_000 })
    await expect(textarea).toHaveValue(LOADED_ET_TEXT)

    // 7. Fill the textarea with the bogus input that includes a ::para directive.
    //    Using fill() replaces the entire content, matching what a user would do
    //    by selecting all and pasting.
    await textarea.fill(BOGUS_ET_TEXT)

    // 8. Assert the "Salvesta" button is visible (dirty state).
    const salvestaBtn = page.locator('button.btn-save', { hasText: 'Salvesta' })
    await expect(salvestaBtn).toBeVisible()

    // 9. Click Salvesta — this triggers handleSave → preflight → !ok → commitError.
    //    Do NOT use waitForResponse here because the PUT must NEVER happen.
    await salvestaBtn.click()

    // 10. Wait for the error banner to appear (short but definite beat).
    const errorBanner = page.locator('.error-banner')
    await expect(errorBanner).toBeVisible({ timeout: 5_000 })

    // ── Key assertion: PUT was never fired ──────────────────────────────────
    expect(putCallCount).toBe(0)

    // ── Error banner shows the Estonian validation error prefix ─────────────
    await expect(errorBanner).toContainText(/Valideerimisviga:/)

    // ── Editor is still open (textarea still visible) ───────────────────────
    await expect(textarea).toBeVisible()

    // ── Textarea still contains the user's typed text (not cleared) ─────────
    await expect(textarea).toHaveValue(BOGUS_ET_TEXT)

    // ── User is still signed in ─────────────────────────────────────────────
    await expect(page.locator('#signout-btn')).toBeVisible()

    // ── Paragraph row still shows original ET text (not the bogus input) ────
    // The paragraph display text is inside .col-et, outside the editor.
    // Because the editor is still open on this paragraph, the read-row is
    // replaced by the edit-row; assert the textarea value (already done above).
    // We can also check that the save button is NOT disabled (isSaving=false).
    await expect(salvestaBtn).not.toBeDisabled()
  })
})
