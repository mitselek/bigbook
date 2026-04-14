/**
 * bigbook-auth-proxy — Cloudflare Worker
 *
 * Proxies OAuth token exchange + refresh for the bigbook GitHub App.
 * Required because GitHub's /login/oauth/access_token endpoint does not
 * support CORS and the App's web flow requires client_secret, which
 * cannot live in the browser.
 *
 * Endpoints:
 *   POST /exchange  — exchanges an authorization code for access+refresh tokens
 *   POST /refresh   — exchanges a refresh token for a new access+refresh pair
 *
 * All responses are CORS-allowlisted to ALLOWED_ORIGIN.
 */

export interface Env {
  GITHUB_CLIENT_SECRET: string
  ALLOWED_ORIGIN: string
}

interface ExchangeBody {
  client_id?: string
  code?: string
  redirect_uri?: string
  code_verifier?: string
}

interface RefreshBody {
  client_id?: string
  refresh_token?: string
}

const GITHUB_TOKEN_ENDPOINT = 'https://github.com/login/oauth/access_token'

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function jsonResponse(
  body: unknown,
  status: number,
  env: Env,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env.ALLOWED_ORIGIN),
    },
  })
}

function isAllowedOrigin(request: Request, env: Env): boolean {
  return request.headers.get('Origin') === env.ALLOWED_ORIGIN
}

async function postToGitHub(params: URLSearchParams): Promise<Response> {
  return fetch(GITHUB_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'bigbook-auth-proxy',
    },
    body: params.toString(),
  })
}

async function exchangeCode(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as ExchangeBody

  if (!body.client_id || !body.code || !body.redirect_uri) {
    return jsonResponse(
      { error: 'missing_parameters', required: ['client_id', 'code', 'redirect_uri'] },
      400,
      env,
    )
  }

  const params = new URLSearchParams()
  params.set('client_id', body.client_id)
  params.set('client_secret', env.GITHUB_CLIENT_SECRET)
  params.set('code', body.code)
  params.set('redirect_uri', body.redirect_uri)
  if (body.code_verifier) {
    params.set('code_verifier', body.code_verifier)
  }

  const githubResponse = await postToGitHub(params)
  const responseBody = await githubResponse.text()

  return new Response(responseBody, {
    status: githubResponse.status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env.ALLOWED_ORIGIN),
    },
  })
}

async function refreshAccessToken(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as RefreshBody

  if (!body.client_id || !body.refresh_token) {
    return jsonResponse(
      { error: 'missing_parameters', required: ['client_id', 'refresh_token'] },
      400,
      env,
    )
  }

  const params = new URLSearchParams()
  params.set('client_id', body.client_id)
  params.set('client_secret', env.GITHUB_CLIENT_SECRET)
  params.set('grant_type', 'refresh_token')
  params.set('refresh_token', body.refresh_token)

  const githubResponse = await postToGitHub(params)
  const responseBody = await githubResponse.text()

  return new Response(responseBody, {
    status: githubResponse.status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(env.ALLOWED_ORIGIN),
    },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(request, env)) {
        return new Response(null, { status: 403 })
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env.ALLOWED_ORIGIN),
      })
    }

    // Origin allowlist (defense-in-depth; the real security is that only
    // codes issued for our client_id can be exchanged with our client_secret).
    if (!isAllowedOrigin(request, env)) {
      return jsonResponse({ error: 'forbidden_origin' }, 403, env)
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405, env)
    }

    if (url.pathname === '/exchange') {
      return exchangeCode(request, env)
    }

    if (url.pathname === '/refresh') {
      return refreshAccessToken(request, env)
    }

    return jsonResponse({ error: 'not_found', path: url.pathname }, 404, env)
  },
}
