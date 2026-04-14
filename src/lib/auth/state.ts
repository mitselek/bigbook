/**
 * CSRF state + PKCE verifier staging for the OAuth redirect.
 *
 * The state string and the PKCE code verifier are generated before the
 * authorize redirect, stashed in sessionStorage, and consumed on the
 * callback page. sessionStorage survives the full-page redirect to
 * github.com and back because the origin (https://mitselek.github.io)
 * is the same before and after the redirect.
 */

const STATE_KEY = 'bigbook.auth.state'
const VERIFIER_KEY = 'bigbook.auth.code_verifier'

export interface SavedAuthState {
  state: string
  codeVerifier: string
}

export function saveAuthState(state: string, codeVerifier: string): void {
  sessionStorage.setItem(STATE_KEY, state)
  sessionStorage.setItem(VERIFIER_KEY, codeVerifier)
}

/**
 * Consumes the saved auth state, removing it from sessionStorage.
 * Returns null if no state is saved or only one of the two values is present.
 */
export function consumeAuthState(): SavedAuthState | null {
  const state = sessionStorage.getItem(STATE_KEY)
  const codeVerifier = sessionStorage.getItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
  if (state === null || codeVerifier === null) {
    return null
  }
  return { state, codeVerifier }
}

/**
 * Generates a random 16-byte hex state string for CSRF protection.
 */
export function generateState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
