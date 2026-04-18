/**
 * Shared fixtures for editor E2E tests.
 *
 * Provides:
 *   - setupSignedInSession  — seeds localStorage refresh token and intercepts
 *                             CF Worker /refresh and api.github.com /user.
 *   - setupChapterContent   — intercepts raw.githubusercontent.com (EN,
 *                             baseline-ET) and api.github.com contents GET
 *                             (current-ET, authenticated path).
 *   - interceptCommit       — intercepts the api.github.com PUT for a chapter;
 *                             configurable response shape for ok / 409 / 401.
 *   - makeBilingualChapter  — content-factory matching the ::para[…] format.
 *
 * Ordering note: call setupChapterContent before interceptCommit in each test.
 * Playwright routes are matched LIFO, so interceptCommit (registered last)
 * runs first for PUT requests; its handler calls route.fallback() for non-PUT
 * so the setupChapterContent handler (registered earlier) sees GET requests.
 */

import type { Page, Route } from '@playwright/test'

// ── Auth constants ────────────────────────────────────────────────────────────

export const WORKER_URL = 'https://bigbook-auth-proxy.mihkel-putrinsh.workers.dev'
export const BASELINE_SHA = 'ecf8c0e8827b971abbca01677d43f4e7916d6df5'

const FAKE_ACCESS_TOKEN = 'ghu_FAKE_ACCESS_TOKEN_FOR_E2E'
const FAKE_REFRESH_TOKEN = 'ghr_FAKE_REFRESH_TOKEN_FOR_E2E'

export const FAKE_CONTENT_SHA = 'deadbeef00000000000000000000000000000000'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BilingualChapter {
  en: string
  et: string
  baseline: string
}

export interface ChapterContentOptions {
  slug: string
  en: string
  et: string
  baseline: string
}

export interface CommitInterceptOptions {
  slug: string
  /** Defaults to 200 OK with a new sha. */
  responseKind?: 'ok' | 'conflict' | 'auth_expired'
  newSha?: string
}

// ── Auth seeding ──────────────────────────────────────────────────────────────

/**
 * Seeds a valid refresh token in localStorage (before page load via
 * addInitScript) and intercepts the /refresh Worker endpoint and the
 * api.github.com /user endpoint so the app boots in an authenticated state.
 *
 * Must be called before page.goto().
 */
export async function setupSignedInSession(page: Page): Promise<void> {
  // 1. Seed localStorage before the page runs any JS.
  const refreshPayload = JSON.stringify({
    refreshToken: FAKE_REFRESH_TOKEN,
    // 6 months from now — far enough to never expire during tests
    refreshTokenExpiresAt: Date.now() + 6 * 30 * 24 * 60 * 60 * 1000,
  })
  await page.addInitScript((payload: string) => {
    localStorage.setItem('bigbook.auth.refresh', payload)
  }, refreshPayload)

  // 2. Intercept POST /refresh → return a fake token pair.
  await page.route(`${WORKER_URL}/refresh`, (route: Route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: FAKE_ACCESS_TOKEN,
        token_type: 'bearer',
        expires_in: 28800,
        refresh_token: FAKE_REFRESH_TOKEN,
        refresh_token_expires_in: 15897600,
        scope: '',
      }),
    })
  })

  // 3. Intercept GET api.github.com/user → return a fake GitHubUser.
  await page.route('https://api.github.com/user', (route: Route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        login: 'e2e-test-user',
        avatar_url: '',
        name: 'E2E Test User',
        html_url: 'https://github.com/e2e-test-user',
      }),
    })
  })
}

// ── Chapter content ───────────────────────────────────────────────────────────

/**
 * Intercepts raw.githubusercontent.com requests for EN and baseline-ET,
 * the raw @ main ET URL (unauthenticated path), and the api.github.com
 * contents API GET for current-ET (authenticated path).
 *
 * Intercepting both ET paths (raw @ main and GitHub API) makes the fixture
 * work regardless of whether the chapter loads before or after the auth
 * refresh completes — a race condition that can occur between force-load
 * dispatch and readerState.isAuthenticated being set.
 *
 * Must be called before page.goto(). Call interceptCommit after this to add
 * PUT interception on the same contents URL.
 */
export async function setupChapterContent(
  page: Page,
  options: ChapterContentOptions,
): Promise<void> {
  const { slug, en, et, baseline } = options

  // EN — raw.githubusercontent.com @ BASELINE_SHA
  await page.route(
    `https://raw.githubusercontent.com/mitselek/bigbook/${BASELINE_SHA}/src/content/en/${slug}.md`,
    (route: Route) => {
      void route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: en,
      })
    },
  )

  // Baseline-ET — raw.githubusercontent.com @ BASELINE_SHA
  await page.route(
    `https://raw.githubusercontent.com/mitselek/bigbook/${BASELINE_SHA}/src/content/et/${slug}.md`,
    (route: Route) => {
      void route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: baseline,
      })
    },
  )

  // Current-ET (unauthenticated path) — raw.githubusercontent.com @ main
  // Used when readerState.isAuthenticated is false at load time.
  await page.route(
    `https://raw.githubusercontent.com/mitselek/bigbook/main/src/content/et/${slug}.md`,
    (route: Route) => {
      void route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: et,
      })
    },
  )

  // Current-ET (authenticated path) — api.github.com/repos/.../contents/...
  // Returns base64-encoded content with sha and etag.
  // Only fulfills GET; PUT falls through to the interceptCommit handler.
  const etBase64 = Buffer.from(et, 'utf-8').toString('base64')

  await page.route(
    `https://api.github.com/repos/mitselek/bigbook/contents/src/content/et/${slug}.md`,
    (route: Route) => {
      if (route.request().method() === 'GET') {
        void route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { etag: '"fake-etag-001"' },
          body: JSON.stringify({
            sha: FAKE_CONTENT_SHA,
            content: etBase64 + '\n',
            encoding: 'base64',
          }),
        })
      } else {
        // PUT — fall back so a later interceptCommit handler can handle it
        void route.fallback()
      }
    },
  )
}

// ── Commit interceptor ────────────────────────────────────────────────────────

/**
 * Intercepts the PUT to api.github.com/repos/.../contents/et/<slug>.md.
 *
 * - 'ok'           → 200 with { content: { sha: newSha } }
 * - 'conflict'     → 409 (for the 409 conflict scenario)
 * - 'auth_expired' → 401 (for the token-refresh scenario)
 *
 * Must be registered AFTER setupChapterContent so that this handler (LIFO)
 * runs first for any request to the contents URL. GET requests are passed
 * back via route.fallback() to the setupChapterContent handler.
 */
export async function interceptCommit(page: Page, options: CommitInterceptOptions): Promise<void> {
  const { slug, responseKind = 'ok', newSha = 'new-sha-123' } = options

  await page.route(
    `https://api.github.com/repos/mitselek/bigbook/contents/src/content/et/${slug}.md`,
    (route: Route) => {
      if (route.request().method() !== 'PUT') {
        // Not a PUT — let earlier handler (setupChapterContent GET) take it
        void route.fallback()
        return
      }

      switch (responseKind) {
        case 'conflict':
          void route.fulfill({ status: 409, body: 'Conflict' })
          return
        case 'auth_expired':
          void route.fulfill({ status: 401, body: 'Unauthorized' })
          return
        default:
          // 'ok'
          void route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ content: { sha: newSha } }),
          })
      }
    },
  )
}

// ── Content factory ───────────────────────────────────────────────────────────

/**
 * Builds minimal but valid bilingual chapter content strings for a given slug
 * and list of paraIds (taken from the CHAPTERS manifest).
 *
 * The title paraId (ending in '-title') gets heading text. Body paraIds get
 * short dummy text. ET and baseline content are identical by default so all
 * paragraphs start as non-diverged (isDiverged === false). Pass etOverrides
 * to make specific ET paragraphs differ from baseline (isDiverged === true).
 *
 * Returns { en, et, baseline } — three markdown strings ready to pass to
 * setupChapterContent.
 */
export function makeBilingualChapter(
  slug: string,
  paraIds: readonly string[],
  options?: { etOverrides?: Record<string, string> },
): BilingualChapter {
  const etOverrides = options?.etOverrides ?? {}

  function buildContent(lang: 'en' | 'et' | 'baseline'): string {
    const langLabel = lang === 'en' ? 'en' : 'et'
    const lines: string[] = [
      '---',
      `chapter: ${slug}`,
      `title: Test chapter ${slug}`,
      `lang: ${langLabel}`,
      '---',
      '',
    ]

    for (const paraId of paraIds) {
      lines.push(`::para[${paraId}]`)
      if (paraId.endsWith('-title')) {
        if (lang === 'en') {
          lines.push(`# EN Title for ${slug}`)
        } else {
          // both 'et' and 'baseline' get the same heading
          lines.push(`# ET Pealkiri for ${slug}`)
        }
      } else {
        // Body paragraph
        if (lang === 'en') {
          lines.push(`EN text for ${paraId}.`)
        } else if (lang === 'et') {
          const override = etOverrides[paraId]
          lines.push(override !== undefined ? override : `ET tekst ${paraId}.`)
        } else {
          // baseline — always the unmodified ET text so isDiverged starts false
          lines.push(`ET tekst ${paraId}.`)
        }
      }
      lines.push('')
    }

    return lines.join('\n')
  }

  return {
    en: buildContent('en'),
    et: buildContent('et'),
    baseline: buildContent('baseline'),
  }
}
