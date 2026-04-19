import { test, expect } from '@playwright/test'
import { CHAPTERS } from '../../src/lib/content/manifest'

// Pin to ch01 — "Bill's Story" — which has ch01-h001 + 71 body paragraphs.
const CHAPTER = CHAPTERS.find((c) => c.slug === 'ch01')
if (!CHAPTER) throw new Error("Manifest missing 'ch01' — did P1 regenerate correctly?")
const SLUG = CHAPTER.slug

test.describe('Anonymous reader', () => {
  test('landing page renders top bar, skeleton, and footer', async ({ page }) => {
    await page.goto('./')

    await expect(page.locator('.wordmark')).toHaveText('bigbook', { useInnerText: true })

    const firstPara = page.locator(`[id^="${SLUG}"]`).first()
    await expect(firstPara).toBeVisible()

    await expect(page.locator('.reader-footer')).toContainText('github.com/mitselek/bigbook')
  })

  test('chapter content loads on scroll', async ({ page }) => {
    await page.goto('./')

    await expect(page.locator(`#${SLUG}-h001`)).toBeVisible({ timeout: 15000 })
    await expect(page.locator(`#${SLUG}-p001`)).toContainText(/.+/, { timeout: 15000 })
  })

  test('top bar title updates on scroll', async ({ page }) => {
    await page.goto('./')

    await expect(page.locator(`#${SLUG}-h001`)).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.top-bar-center')).toContainText(/.+/)
  })

  test('deep-link anchor scrolls to paragraph', async ({ page }) => {
    await page.goto(`./#${SLUG}-p005`)

    const para = page.locator(`#${SLUG}-p005`).first()
    await expect(para).toBeVisible({ timeout: 15000 })
  })
})
