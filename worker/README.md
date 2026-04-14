# bigbook-auth-proxy

Cloudflare Worker that proxies OAuth token exchange + refresh for the bigbook GitHub App.

## Why this exists

GitHub's `/login/oauth/access_token` endpoint does not support CORS, so a pure browser app on GitHub Pages cannot complete the OAuth token exchange directly. The GitHub App's web flow also requires `client_secret` at the exchange step, which cannot safely live in browser JavaScript. This Worker is the smallest possible backend that solves both problems — it holds the `client_secret` as a Cloudflare Worker secret and relays the token exchange request on behalf of the browser.

## Endpoints

### `POST /exchange`

Exchanges a GitHub OAuth authorization code for access + refresh tokens.

Request body (JSON):

```json
{
  "client_id": "Iv23...",
  "code": "<github-authorization-code>",
  "redirect_uri": "https://mitselek.github.io/bigbook/auth/callback/",
  "code_verifier": "<pkce-code-verifier>"
}
```

Response body: the GitHub token response passed through verbatim.

### `POST /refresh`

Exchanges a refresh token for a new access + refresh token pair (rotation).

Request body (JSON):

```json
{
  "client_id": "Iv23...",
  "refresh_token": "ghr_..."
}
```

Response body: the GitHub token response passed through verbatim.

## Environment

The Worker reads two environment values:

- **`ALLOWED_ORIGIN`** (plaintext var, checked into `wrangler.jsonc`): the single origin allowed by CORS. Defaults to `https://mitselek.github.io`.
- **`GITHUB_CLIENT_SECRET`** (secret, NOT in config — set via `wrangler secret put`): the GitHub App client secret.

## Setup & deploy

From this directory (`worker/`):

```bash
# Install dependencies (wrangler, types, typescript)
npm install

# Authenticate with Cloudflare (opens browser)
npx wrangler login

# Set the GitHub App client secret as a Worker secret (paste when prompted)
npx wrangler secret put GITHUB_CLIENT_SECRET

# Deploy to <worker-name>.<your-subdomain>.workers.dev
npx wrangler deploy
```

After `wrangler deploy`, the output prints the deployed URL. Paste that URL into `../src/lib/auth/config.ts` as `WORKER_URL`.

## Local dev

```bash
# Start the Worker locally on http://localhost:8787 with a test secret
npx wrangler dev --var ALLOWED_ORIGIN:http://localhost:4321
```

Note: local dev needs a test `GITHUB_CLIENT_SECRET` in `.dev.vars` (NOT committed):

```
GITHUB_CLIENT_SECRET=test-secret-value-here
```

## Security notes

- The `GITHUB_CLIENT_SECRET` is stored in Cloudflare's secret store and never exposed to client code or committed to git.
- The `ALLOWED_ORIGIN` CORS allowlist is defense-in-depth; the primary security property is that only OAuth codes issued for our specific `client_id` can be successfully exchanged via our `client_secret`, so even an attacker bypassing CORS (e.g., via a server-side request) cannot produce a token for an arbitrary user.
- No tokens, codes, or secrets are logged.
- Rate limiting is inherited from the Cloudflare Workers free tier's built-in protection.
