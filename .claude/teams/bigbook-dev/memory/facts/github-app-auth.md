---
type: service
status: live
---

- Client ID is public and hardcoded beside the Worker URL and the Pages callback path; the app authorizes through GitHub's standard OAuth authorize URL. `v:2026-09-19`
  - `ev: src/lib/auth/config.ts`
  - `rf: =ev`
- GitHub App "bigbook-dev" settings: Contents read+write, "expire user tokens" on, OAuth during install on, scope public_repo, installed on the bigbook repo. `v:2026-04-17`
  - `ev: Iv23lipPWHpw0QWj8lYF`
  - `rf: github.com/settings/apps/bigbook-dev`
- Client secret exists ONLY in the Cloudflare Worker secret store (wrangler secret put); unrecorded elsewhere by design, local dev uses an uncommitted .dev.vars. `v:2026-09-19`
  - `ev: GITHUB_CLIENT_SECRET; worker/README.md:48-77; worker/src/index.ts:17`
  - `rf: cd worker && npx wrangler secret list`
- Auth proxy: Cloudflare Worker, source worker/ (sibling service, outside the Pages deploy); endpoints POST /exchange + /refresh; origin allowlist comes from the ALLOWED_ORIGIN var, currently the Pages origin only. Deploy: cd worker && npx wrangler deploy. `v:2026-09-19`
  - `ev: bigbook-auth-proxy.mihkel-putrinsh.workers.dev; worker/wrangler.jsonc:8; worker/src/index.ts:161-165`
  - `rf: curl -X OPTIONS the worker URL with an Origin header`
- Access token 8h in-memory only (gone on reload); refresh token 6mo rotating in localStorage. Silent refresh on stale token at page load or 401 from api.github.com/user. `v:2026-09-19`
  - `ev: src/lib/auth/token-store.ts:1-25; src/lib/auth/github-app.ts:116-129; localStorage key bigbook.auth.refresh`
  - `rf: src/lib/auth/token-store.ts`
- Browser cannot POST to GitHub's token endpoint (no CORS) and PKCE on GitHub Apps still requires client_secret 1) hence the Worker exists 2) no secretless design is possible. `v:2026-09-19`
  - `ev: login/oauth/access_token; worker/README.md:7`
  - `rf: curl -X OPTIONS the token endpoint with an Origin header: no access-control headers`
- Wrangler on Git Bash (Windows) silently falls back to non-interactive mode; set secrets via stdin pipe or the Cloudflare dashboard. `v:2026-04-17`
  - `ev: worker/README.md:61-62`
  - `rf:`
