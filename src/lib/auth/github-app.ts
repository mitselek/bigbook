/**
 * GitHub App OAuth flow driver.
 *
 * Public API:
 *   beginAuth()   — kick off the authorize redirect
 *   completeAuth  — called by the callback page after GitHub redirects back
 *   currentUser   — fetch the signed-in GitHub user (handles token refresh)
 *   signOut       — clear tokens
 *   isSignedIn    — cheap local check (no network)
 */

import { AUTHORIZE_URL, CLIENT_ID, REDIRECT_URI, WORKER_URL } from './config'
import { deriveCodeChallenge, generateCodeVerifier } from './pkce'
import { consumeAuthState, generateState, saveAuthState } from './state'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasRefreshToken,
  setTokens,
} from './token-store'

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  refresh_token_expires_in: number
  scope: string
}

interface ErrorResponse {
  error: string
  error_description?: string
}

export interface GitHubUser {
  login: string
  avatar_url: string
  name: string | null
  html_url: string
}

export type AuthResult = { ok: true } | { ok: false; error: string }

/**
 * Kicks off the OAuth authorize redirect. Does not return — the browser
 * navigates away to GitHub. On success GitHub redirects back to
 * REDIRECT_URI with `?code=...&state=...` in the query string; the
 * callback page calls `completeAuth` to finish the exchange.
 */
export async function beginAuth(): Promise<void> {
  const state = generateState()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await deriveCodeChallenge(codeVerifier)

  saveAuthState(state, codeVerifier)

  const url = new URL(AUTHORIZE_URL)
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')

  window.location.href = url.toString()
}

/**
 * Completes the OAuth flow from the callback page. Validates the CSRF
 * state, POSTs the code to the Cloudflare Worker for exchange, and
 * stores the returned tokens on success.
 */
export async function completeAuth(code: string, stateFromUrl: string): Promise<AuthResult> {
  const saved = consumeAuthState()
  if (!saved) {
    return { ok: false, error: 'No auth state found — start the sign-in flow first.' }
  }
  if (saved.state !== stateFromUrl) {
    return { ok: false, error: 'State mismatch — possible CSRF, aborting.' }
  }

  let response: Response
  try {
    response = await fetch(`${WORKER_URL}/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: saved.codeVerifier,
      }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Worker unreachable: ${message}` }
  }

  if (!response.ok) {
    const text = await response.text()
    return { ok: false, error: `Token exchange failed: ${response.status} ${text}` }
  }

  const data = (await response.json()) as TokenResponse | ErrorResponse

  if ('error' in data) {
    return { ok: false, error: data.error_description ?? data.error }
  }

  setTokens(data.access_token, data.refresh_token, data.expires_in, data.refresh_token_expires_in)
  return { ok: true }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return false
  }

  let response: Response
  try {
    response = await fetch(`${WORKER_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        refresh_token: refreshToken,
      }),
    })
  } catch {
    return false
  }

  if (!response.ok) {
    clearTokens()
    return false
  }

  const data = (await response.json()) as TokenResponse | ErrorResponse

  if ('error' in data) {
    clearTokens()
    return false
  }

  setTokens(data.access_token, data.refresh_token, data.expires_in, data.refresh_token_expires_in)
  return true
}

async function fetchUser(allowRetry: boolean): Promise<GitHubUser | null> {
  let accessToken = getAccessToken()

  if (!accessToken && hasRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (!refreshed) {
      return null
    }
    accessToken = getAccessToken()
  }

  if (!accessToken) {
    return null
  }

  const response = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (response.status === 401 && allowRetry && hasRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return fetchUser(false)
    }
    clearTokens()
    return null
  }

  if (!response.ok) {
    return null
  }

  const user = (await response.json()) as GitHubUser
  return user
}

export function currentUser(): Promise<GitHubUser | null> {
  return fetchUser(true)
}

export function signOut(): void {
  clearTokens()
}

export function isSignedIn(): boolean {
  return getAccessToken() !== null || hasRefreshToken()
}
