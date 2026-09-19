---
type: service
status: live
---

- GitHub App "bigbook-dev": Contents read+write, "expire user tokens" on, OAuth during install on, scope public_repo, installed on the bigbook repo. Client ID is public, hardcoded in src/lib/auth/config.ts. `v:2026-04-17`
  - `ev: Iv23lipPWHpw0QWj8lYF; src/lib/auth/config.ts`
  - `rf: github.com app settings / src/lib/auth/config.ts`
- Client secret exists ONLY in the Cloudflare Worker secret store (wrangler secret put); unrecorded elsewhere by design. `v:2026-04-17`
  - `ev: GITHUB_CLIENT_SECRET; worker/`
  - `rf: wrangler secret list in worker/`
- Auth proxy: Cloudflare Worker, source worker/ (sibling service, outside the Pages deploy); endpoints POST /exchange + /refresh; CORS allowlist mitselek.github.io only. Deploy: cd worker && npx wrangler deploy. `v:2026-04-17`
  - `ev: bigbook-auth-proxy.mihkel-putrinsh.workers.dev; worker/`
  - `rf: curl -X OPTIONS the worker URL / worker/ source`
- Access token 8h in-memory only (gone on reload); refresh token 6mo rotating in localStorage. Silent refresh on stale token at page load or 401 from api.github.com/user. `v:2026-04-17`
  - `ev: src/lib/auth/token-store.ts; localStorage key bigbook.auth.refresh`
  - `rf: src/lib/auth/token-store.ts`
- Browser cannot POST to GitHub's token endpoint (no CORS) and PKCE on GitHub Apps still requires client_secret 1) hence the Worker exists 2) no secretless design is possible. `v:2026-04-17`
  - `ev: login/oauth/access_token; ref-auth-infra carve 2026-09-19`
  - `rf:`
- Wrangler on Git Bash (Windows) silently falls back to non-interactive mode; set secrets via stdin pipe or the Cloudflare dashboard. `v:2026-04-17`
  - `ev: ref-auth-infra carve 2026-09-19`
  - `rf:`
