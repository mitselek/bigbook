import { describe, it, expect, vi } from 'vitest'
import type { CommitResult } from '../../../src/lib/editor/commit'
import { commitEditWithRetry } from '../../../src/lib/editor/commit-with-retry'

describe('commitEditWithRetry', () => {
  const baseParams = {
    slug: 'ch01-test',
    paraId: 'ch01-test-p001',
    newText: 'Hello.',
    currentContent:
      '---\nchapter: ch01-test\ntitle: Test\nlang: et\n---\n\n::para[ch01-test-p001]\nOld.\n',
    sha: 'sha-abc',
  }

  it('returns ok on first attempt — no retry needed', async () => {
    const okResult: CommitResult = { ok: true, newSha: 'new-sha-1' }
    const commit = vi.fn().mockResolvedValue(okResult)
    const refresh = vi.fn().mockResolvedValue('tok-2')

    const result = await commitEditWithRetry({
      ...baseParams,
      getToken: () => 'tok-1',
      commit,
      refresh,
    })

    expect(result).toEqual(okResult)
    expect(commit).toHaveBeenCalledOnce()
    expect(commit).toHaveBeenCalledWith('tok-1')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('401 → refresh succeeds → second attempt succeeds', async () => {
    const authExpired: CommitResult = { ok: false, kind: 'auth_expired', message: 'Unauthorized' }
    const okResult: CommitResult = { ok: true, newSha: 'new-sha-2' }
    const commit = vi.fn().mockResolvedValueOnce(authExpired).mockResolvedValueOnce(okResult)
    const refresh = vi.fn().mockResolvedValue('tok-refreshed')

    const result = await commitEditWithRetry({
      ...baseParams,
      getToken: () => 'tok-1',
      commit,
      refresh,
    })

    expect(result).toEqual(okResult)
    expect(commit).toHaveBeenCalledTimes(2)
    expect(commit).toHaveBeenNthCalledWith(1, 'tok-1')
    expect(commit).toHaveBeenNthCalledWith(2, 'tok-refreshed')
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('401 → refresh fails (returns null) → propagates auth_expired', async () => {
    const authExpired: CommitResult = { ok: false, kind: 'auth_expired', message: 'Unauthorized' }
    const commit = vi.fn().mockResolvedValue(authExpired)
    const refresh = vi.fn().mockResolvedValue(null)

    const result = await commitEditWithRetry({
      ...baseParams,
      getToken: () => 'tok-1',
      commit,
      refresh,
    })

    expect(result).toEqual(authExpired)
    expect(commit).toHaveBeenCalledOnce()
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('401 → refresh succeeds → 401 again → propagates auth_expired (no third attempt)', async () => {
    const authExpired: CommitResult = { ok: false, kind: 'auth_expired', message: 'Unauthorized' }
    const commit = vi.fn().mockResolvedValue(authExpired)
    const refresh = vi.fn().mockResolvedValue('tok-refreshed')

    const result = await commitEditWithRetry({
      ...baseParams,
      getToken: () => 'tok-1',
      commit,
      refresh,
    })

    expect(result).toEqual(authExpired)
    expect(commit).toHaveBeenCalledTimes(2)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('non-401 error on first attempt is returned directly without retry', async () => {
    const conflictResult: CommitResult = { ok: false, kind: 'conflict', message: 'Conflict' }
    const commit = vi.fn().mockResolvedValue(conflictResult)
    const refresh = vi.fn()

    const result = await commitEditWithRetry({
      ...baseParams,
      getToken: () => 'tok-1',
      commit,
      refresh,
    })

    expect(result).toEqual(conflictResult)
    expect(commit).toHaveBeenCalledOnce()
    expect(refresh).not.toHaveBeenCalled()
  })
})
