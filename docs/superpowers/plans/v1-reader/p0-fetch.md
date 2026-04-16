# P0 — Fetch Module

**Phase goal:** Build `src/lib/content/fetch.ts` — the runtime fetch layer that retrieves EN, baseline ET (SHA-pinned from raw.github), and current ET (Contents API with ETag conditional requests).

**Execution mode:** XP triple (Montano RED → Granjon GREEN → Ortelius PURPLE)

**Files:**

- Create: `src/lib/content/fetch.ts`
- Create: `tests/lib/content/fetch.test.ts`

**Dependencies:** `src/lib/content/baseline-config.ts` (exists, provides `BASELINE_COMMIT_SHA`)

---

## Module interface

```ts
// src/lib/content/fetch.ts

import { BASELINE_COMMIT_SHA } from './baseline-config'

export type CurrentEtResult =
  | { status: 'unchanged' }
  | { status: 'fetched'; content: string; sha: string; etag: string }

export type FetchError = {
  kind: 'network' | 'not_found' | 'unexpected'
  message: string
  statusCode?: number
}

export type FetchResult<T> = { ok: true; value: T } | { ok: false; error: FetchError }

export async function fetchEn(chapter: string): Promise<FetchResult<string>>
export async function fetchBaselineEt(chapter: string): Promise<FetchResult<string>>
export async function fetchCurrentEt(
  chapter: string,
  opts?: { etag?: string; token?: string },
): Promise<FetchResult<CurrentEtResult>>
```

**Design notes:**

- `fetchEn` and `fetchBaselineEt` hit `raw.githubusercontent.com/<BASELINE_COMMIT_SHA>/src/content/{en,et}/<chapter>.md`. Plain `fetch(url)`, no custom headers (CORS constraint on raw.github).
- `fetchCurrentEt` hits `api.github.com/repos/mitselek/bigbook/contents/src/content/et/<chapter>.md`. Supports `If-None-Match` for 304 not-modified. Attaches `Authorization: Bearer <token>` when provided (upgrades from 60 to 5000 req/hr).
- The Contents API returns `{ sha, content, encoding }` — content is base64-encoded. `fetchCurrentEt` decodes it and returns the raw markdown string alongside the sha and response etag.
- All three functions return a discriminated `FetchResult<T>` so callers handle errors explicitly. No thrown exceptions.

---

## Task P0.1 — fetchEn happy path

**AC:** `fetchEn('ch01-billi-lugu')` fetches from the correct SHA-pinned raw.github URL and returns the response text.

- [ ] **RED:** Write test that mocks `globalThis.fetch`, calls `fetchEn('ch01-billi-lugu')`, asserts the URL contains `BASELINE_COMMIT_SHA` and `/src/content/en/ch01-billi-lugu.md`, and the result is `{ ok: true, value: '<mocked markdown>' }`.

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchEn } from '../../../src/lib/content/fetch'
import { BASELINE_COMMIT_SHA } from '../../../src/lib/content/baseline-config'

describe('fetchEn', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches from SHA-pinned raw.github URL', async () => {
    const mockMarkdown = '---\nchapter: ch01\n---\n::para[ch01-p001]\nHello'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockMarkdown),
      }),
    )

    const result = await fetchEn('ch01-billi-lugu')

    expect(fetch).toHaveBeenCalledOnce()
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(url).toContain(BASELINE_COMMIT_SHA)
    expect(url).toContain('/src/content/en/ch01-billi-lugu.md')
    expect(url).toContain('raw.githubusercontent.com')
    expect(result).toEqual({ ok: true, value: mockMarkdown })
  })
})
```

- [ ] **GREEN:** Implement `fetchEn` — construct URL, call `fetch`, return `{ ok: true, value: await response.text() }`.
- [ ] **Commit:** `test(fetch): P0.1 RED — fetchEn happy path` / `feat(fetch): P0.1 GREEN — fetchEn from SHA-pinned raw.github`

---

## Task P0.2 — fetchEn and fetchBaselineEt error handling

**AC:** Both functions return `FetchResult` errors for 404 and network failures. `fetchBaselineEt` uses the same URL pattern as `fetchEn` but with `/et/` path.

- [ ] **RED:** Add tests:

```ts
it('returns not_found error on 404', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' }),
  )

  const result = await fetchEn('nonexistent')

  expect(result).toEqual({
    ok: false,
    error: { kind: 'not_found', message: expect.any(String), statusCode: 404 },
  })
})

it('returns network error on fetch rejection', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

  const result = await fetchEn('ch01-billi-lugu')

  expect(result).toEqual({
    ok: false,
    error: { kind: 'network', message: expect.any(String) },
  })
})
```

And a parallel `describe('fetchBaselineEt')` block:

```ts
describe('fetchBaselineEt', () => {
  it('fetches from SHA-pinned raw.github URL with /et/ path', async () => {
    const mockMarkdown = '---\nchapter: ch01\nlang: et\n---\n::para[ch01-p001]\nTere'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(mockMarkdown),
      }),
    )

    const result = await fetchBaselineEt('ch01-billi-lugu')

    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(url).toContain('/src/content/et/ch01-billi-lugu.md')
    expect(result).toEqual({ ok: true, value: mockMarkdown })
  })
})
```

- [ ] **GREEN:** Add error handling to `fetchEn`, extract shared `fetchRawGithub` helper, implement `fetchBaselineEt` reusing it.
- [ ] **Commit:** `test(fetch): P0.2 RED — error handling + fetchBaselineEt` / `feat(fetch): P0.2 GREEN — error paths + fetchBaselineEt`

---

## Task P0.3 — fetchCurrentEt happy path

**AC:** `fetchCurrentEt` hits the Contents API, decodes base64 content, returns `{ status: 'fetched', content, sha, etag }`.

- [ ] **RED:**

```ts
describe('fetchCurrentEt', () => {
  it('fetches from Contents API and decodes base64', async () => {
    const markdown = '---\nchapter: ch01\n---\n::para[ch01-p001]\nTere'
    const base64Content = btoa(markdown)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            sha: 'abc123',
            content: base64Content,
            encoding: 'base64',
          }),
        headers: new Headers({ etag: '"etag-value"' }),
      }),
    )

    const result = await fetchCurrentEt('ch01-billi-lugu')

    expect(result).toEqual({
      ok: true,
      value: {
        status: 'fetched',
        content: markdown,
        sha: 'abc123',
        etag: '"etag-value"',
      },
    })
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(url).toContain('api.github.com')
    expect(url).toContain('/contents/src/content/et/ch01-billi-lugu.md')
  })
})
```

- [ ] **GREEN:** Implement `fetchCurrentEt` — construct Contents API URL, call `fetch`, parse JSON, decode base64 via `atob()`, extract sha + etag from response.
- [ ] **Commit:** `test(fetch): P0.3 RED — fetchCurrentEt happy path` / `feat(fetch): P0.3 GREEN — Contents API fetch with base64 decode`

---

## Task P0.4 — fetchCurrentEt conditional request (304) and auth token

**AC:** When `opts.etag` is provided, the request includes `If-None-Match` and a 304 response returns `{ status: 'unchanged' }`. When `opts.token` is provided, the request includes `Authorization: Bearer <token>`.

- [ ] **RED:**

```ts
it('sends If-None-Match and returns unchanged on 304', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 304,
      headers: new Headers(),
    }),
  )

  const result = await fetchCurrentEt('ch01-billi-lugu', { etag: '"prev-etag"' })

  expect(result).toEqual({ ok: true, value: { status: 'unchanged' } })
  const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
  expect(init.headers).toEqual(expect.objectContaining({ 'If-None-Match': '"prev-etag"' }))
})

it('attaches Authorization header when token provided', async () => {
  const markdown = '---\nchapter: ch01\n---\n'
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ sha: 'abc', content: btoa(markdown), encoding: 'base64' }),
      headers: new Headers({ etag: '"e"' }),
    }),
  )

  await fetchCurrentEt('ch01-billi-lugu', { token: 'gh_token_123' })

  const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
  expect(init.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer gh_token_123' }))
})
```

- [ ] **GREEN:** Add conditional header logic: build `headers` object from `opts`, handle 304 status as `{ status: 'unchanged' }`.
- [ ] **Commit:** `test(fetch): P0.4 RED — conditional 304 + auth token` / `feat(fetch): P0.4 GREEN — If-None-Match + Authorization headers`

---

## Task P0.5 — fetchCurrentEt error handling

**AC:** `fetchCurrentEt` returns `FetchResult` errors for 404, network failure, and other HTTP errors (401, 403, 422, 5xx).

- [ ] **RED:**

```ts
it('returns not_found on 404', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
    }),
  )

  const result = await fetchCurrentEt('nonexistent')
  expect(result).toEqual({
    ok: false,
    error: { kind: 'not_found', message: expect.any(String), statusCode: 404 },
  })
})

it('returns unexpected error on 403', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers(),
    }),
  )

  const result = await fetchCurrentEt('ch01-billi-lugu')
  expect(result).toEqual({
    ok: false,
    error: { kind: 'unexpected', message: expect.any(String), statusCode: 403 },
  })
})

it('returns network error on fetch rejection', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')))

  const result = await fetchCurrentEt('ch01-billi-lugu')
  expect(result).toEqual({
    ok: false,
    error: { kind: 'network', message: expect.any(String) },
  })
})
```

- [ ] **GREEN:** Add error handling to `fetchCurrentEt`, reusing error-shape logic from the `fetchRawGithub` helper where applicable.
- [ ] **Commit:** `test(fetch): P0.5 RED — fetchCurrentEt error handling` / `feat(fetch): P0.5 GREEN — error paths for Contents API`

---

## Phase-exit gate

After all 5 tasks:

```bash
npm run typecheck   # clean
npm run lint        # exit 0
npm run format:check # exit 0
npm run test        # all pass (42 existing + new fetch tests)
npm run test:coverage # src/lib/ ≥90% lines, ≥85% branches
npm run build       # zero warnings
```

(_BB:Plantin_)
