# Auth Infrastructure Reference

Facts about the GitHub App PKCE auth setup, not documented in committed code files.

## GitHub App

- **Name:** `bigbook-dev`
- **Client ID:** `Iv23lipPWHpw0QWj8lYF` (public, hardcoded in `src/lib/auth/config.ts`)
- **Client Secret:** lives only as `GITHUB_CLIENT_SECRET` in the Cloudflare Worker's secret store (set via `wrangler secret put`). Not recorded anywhere else by design.
- **Installed on:** `mitselek/bigbook`
- **Settings:** "Expire user authorization tokens" enabled, Contents read+write permission, OAuth during installation enabled
- **Scope:** `public_repo` (minimum)

## Cloudflare Worker

- **URL:** `https://bigbook-auth-proxy.mihkel-putrinsh.workers.dev`
- **Source:** `worker/` (sibling service, not part of the Pages deploy)
- **Deploy:** `cd worker && npx wrangler deploy`
- **Endpoints:** `POST /exchange`, `POST /refresh`
- **CORS allowlist:** `https://mitselek.github.io`
- **Holds:** `GITHUB_CLIENT_SECRET` env secret

## Token Lifecycle

- **Access token:** 8 hours, in-memory only (`src/lib/auth/token-store.ts`). Gone on reload.
- **Refresh token:** 6 months, rotating, `localStorage` key `bigbook.auth.refresh`. Rotates on every refresh.
- **Silent refresh triggered by:** (a) stale in-memory access token on page load, (b) 401 response from `api.github.com/user`.

## Key Constraints

1. **GitHub's `/login/oauth/access_token` has no CORS.** Browsers cannot POST to it — any browser-based GitHub auth requires a backend for the token exchange step.
2. **PKCE on GitHub Apps does not eliminate `client_secret`.** The token exchange endpoint still requires it regardless.
3. **Wrangler on Git Bash (Windows) silently falls back to non-interactive mode.** Use stdin pipe or the Cloudflare dashboard for secrets.

(*BB:Plantin*)
