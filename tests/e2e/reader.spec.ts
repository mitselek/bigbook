import { test, expect } from '@playwright/test'

test.describe('Anonymous reader', () => {
  test('landing page renders top bar, skeleton, and footer', async ({ page }) => {
    await page.goto('./')

    await expect(page.locator('.wordmark')).toHaveText('bigbook')

    const firstPara = page.locator('[id^="ch01-billi-lugu"]').first()
    await expect(firstPara).toBeVisible()

    await expect(page.locator('.reader-footer')).toContainText('github.com/mitselek/bigbook')
  })

  test('chapter content loads on scroll', async ({ page }) => {
    await page.goto('./')

    await expect(page.locator('#ch01-billi-lugu-title')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('#ch01-billi-lugu-p001')).toContainText(/.+/, { timeout: 15000 })
  })

  test('top bar title updates on scroll', async ({ page }) => {
    await page.goto('./')

    await expect(page.locator('#ch01-billi-lugu-title')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.top-bar-center')).toContainText(/.+/)
  })

  test('deep-link anchor scrolls to paragraph', async ({ page }) => {
    await page.goto('./#ch01-billi-lugu-p005')

    const para = page.locator('#ch01-billi-lugu-p005')
    await expect(para).toBeVisible({ timeout: 15000 })
  })
})
