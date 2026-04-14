/**
 * Token persistence for the GitHub App user access token and refresh token.
 *
 * Split storage per the architectural intent locked in common-prompt.md:
 *   - Access token (~8 hours): in-memory only, gone on reload.
 *   - Refresh token (~6 months, rotating): localStorage, survives reloads
 *     so the user stays signed in across sessions.
 *
 * Refresh tokens are rotated on every refresh — the old one becomes
 * invalid immediately, so both the in-memory and localStorage values
 * must be updated atomically via `setTokens`.
 */

interface InMemoryTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
}

interface StoredRefresh {
  refreshToken: string
  refreshTokenExpiresAt: number
}

const STORAGE_KEY = 'bigbook.auth.refresh'

let memoryTokens: InMemoryTokens | null = null

export function setTokens(
  accessToken: string,
  refreshToken: string,
  accessTokenExpiresIn: number,
  refreshTokenExpiresIn: number,
): void {
  const now = Date.now()
  memoryTokens = {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: now + accessTokenExpiresIn * 1000,
  }
  const stored: StoredRefresh = {
    refreshToken,
    refreshTokenExpiresAt: now + refreshTokenExpiresIn * 1000,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

/**
 * Returns the in-memory access token, or null if the token is missing
 * or expired. Callers should try `refreshAccessToken` if this returns
 * null but `hasRefreshToken()` is true.
 */
export function getAccessToken(): string | null {
  if (!memoryTokens) {
    return null
  }
  if (Date.now() >= memoryTokens.accessTokenExpiresAt) {
    return null
  }
  return memoryTokens.accessToken
}

/**
 * Returns the refresh token from memory (preferred — freshest) or
 * localStorage (fallback — survives reload). Returns null if there is
 * no refresh token or the stored one has expired.
 */
export function getRefreshToken(): string | null {
  if (memoryTokens) {
    return memoryTokens.refreshToken
  }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    const stored = JSON.parse(raw) as StoredRefresh
    if (Date.now() >= stored.refreshTokenExpiresAt) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return stored.refreshToken
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearTokens(): void {
  memoryTokens = null
  localStorage.removeItem(STORAGE_KEY)
}

export function hasRefreshToken(): boolean {
  return getRefreshToken() !== null
}
