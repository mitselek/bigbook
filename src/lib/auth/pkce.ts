/**
 * PKCE (Proof Key for Code Exchange) helpers for the GitHub App OAuth flow.
 * RFC 7636.
 */

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(hash)
}

/**
 * Generates a PKCE code verifier. RFC 7636 requires 43-128 characters from
 * [A-Z a-z 0-9 - . _ ~]; base64url of 32 random bytes yields 43 URL-safe
 * characters that satisfy the grammar.
 */
export function generateCodeVerifier(): string {
  return base64url(randomBytes(32))
}

/**
 * Derives the S256 code challenge from a code verifier.
 */
export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier)
  return base64url(hashed)
}
