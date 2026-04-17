import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { commitParagraphEdit } from '../../../src/lib/editor/commit'

describe('commitParagraphEdit', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const chapterContent = [
    '---',
    'chapter: ch01-test',
    'title: # Test',
    'lang: et',
    '---',
    '',
    '::para[ch01-test-title]',
    '',
    '# Test',
    '',
    '::para[ch01-test-p001]',
    'Old text.',
    '',
  ].join('\n')

  it('sends PUT with base64 content and returns success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content: { sha: 'new-sha-abc' },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await commitParagraphEdit({
      slug: 'ch01-test',
      paraId: 'ch01-test-p001',
      newText: 'New text.',
      currentContent: chapterContent,
      sha: 'old-sha-123',
      token: 'ghu_token',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.newSha).toBe('new-sha-abc')
    }

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(
      'https://api.github.com/repos/mitselek/bigbook/contents/src/content/et/ch01-test.md',
    )
    expect(init.method).toBe('PUT')
    const body = JSON.parse(init.body as string) as Record<string, string>
    expect(body.sha).toBe('old-sha-123')
    expect(body.message).toBe('Muuda ch01-test-p001 (et)')

    const encodedContent = body['content']
    if (encodedContent === undefined) throw new Error('body.content missing')
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(encodedContent), (c) => c.charCodeAt(0)),
    )
    expect(decoded).toContain('New text.')
    expect(decoded).not.toContain('Old text.')
  })

  it('returns conflict on 409', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 409, statusText: 'Conflict' }),
    )

    const result = await commitParagraphEdit({
      slug: 'ch01-test',
      paraId: 'ch01-test-p001',
      newText: 'New text.',
      currentContent: chapterContent,
      sha: 'old-sha',
      token: 'ghu_token',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.kind).toBe('conflict')
    }
  })

  it('returns auth_expired on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' }),
    )

    const result = await commitParagraphEdit({
      slug: 'ch01-test',
      paraId: 'ch01-test-p001',
      newText: 'x',
      currentContent: chapterContent,
      sha: 'sha',
      token: 'tok',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.kind).toBe('auth_expired')
    }
  })

  it('returns network error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const result = await commitParagraphEdit({
      slug: 'ch01-test',
      paraId: 'ch01-test-p001',
      newText: 'x',
      currentContent: chapterContent,
      sha: 'sha',
      token: 'tok',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.kind).toBe('network')
      expect(result.message).toBe('offline')
    }
  })
})
