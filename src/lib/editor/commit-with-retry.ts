import type { CommitResult } from './commit'

export interface CommitWithRetryParams {
  slug: string
  paraId: string
  newText: string
  currentContent: string
  sha: string
  /** Returns the current access token. */
  getToken: () => string | null
  /**
   * Performs the actual commit call with the given token. Injected so the
   * caller (ChapterSection) and unit tests can supply stubs without mocking
   * globals.
   */
  commit: (token: string) => Promise<CommitResult>
  /**
   * Attempts a silent token refresh. Returns the new access token on success,
   * or null if the refresh failed (tokens have already been cleared by the
   * refresh machinery).
   */
  refresh: () => Promise<string | null>
}

/**
 * Wraps a single commit attempt with one silent-refresh retry on 401.
 *
 * Spec §3.6 row 5: "Edit commit 401 (token expired) — Silent refresh attempt;
 * if that fails, bounce to re-auth."
 *
 * Flow:
 *   1. Call commit(token) with the current token.
 *   2. If result is auth_expired, attempt refresh().
 *   3. On refresh success, call commit(newToken) exactly once.
 *   4. On refresh failure, propagate the original auth_expired.
 *   5. Any non-auth_expired result is returned immediately.
 *
 * Pure logic — no side effects beyond what the injected helpers do.
 */
export async function commitEditWithRetry(params: CommitWithRetryParams): Promise<CommitResult> {
  const { getToken, commit, refresh } = params

  const token = getToken()
  if (!token) {
    return { ok: false, kind: 'auth_expired', message: 'No access token' }
  }

  const firstResult = await commit(token)

  if (!firstResult.ok && firstResult.kind === 'auth_expired') {
    const newToken = await refresh()
    if (!newToken) {
      return firstResult
    }
    return commit(newToken)
  }

  return firstResult
}
