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
