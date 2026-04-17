import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchEn, fetchBaselineEt, fetchCurrentEt } from '../../../src/lib/content/fetch'
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
})

describe('fetchBaselineEt', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

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
    expect(url).toContain(BASELINE_COMMIT_SHA)
    expect(url).toContain('/src/content/et/ch01-billi-lugu.md')
    expect(url).toContain('raw.githubusercontent.com')
    expect(result).toEqual({ ok: true, value: mockMarkdown })
  })
})

describe('fetchCurrentEt', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

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

  it('sends If-None-Match and returns unchanged on 304', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
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
})
