# Deploy pipeline

## Overview

A single GitHub Actions workflow at `.github/workflows/build-and-deploy.yml` builds both products and deploys them to one GitHub Pages site:

- **Astro app** at the repo root → deploys to `https://mitselek.github.io/bigbook/`
- **Legacy Jekyll archive** at `legacy/` → deploys to `https://mitselek.github.io/bigbook/legacy/`

## Pages source configuration

The repo's Pages source is set to **GitHub Actions** (not "Deploy from a branch"). This was a one-time manual flip performed during the 2026-04-14 restructure. Do not change it back — the classic branch auto-builder cannot handle the two-product layout and would only deploy the `legacy/` Jekyll site.

`actions/configure-pages` is invoked with `enablement: false` so that a future workflow run cannot accidentally flip the Pages source itself.

## Workflow jobs

1. **`build-jekyll`** — runs `actions/jekyll-build-pages@v1` against `source: ./legacy` with `destination: ./_site_jekyll`. `baseurl` is read from `legacy/_config.yml` (`"/bigbook/legacy"`). Uploads the output as the `jekyll-build` artifact.
2. **`build-astro`** — runs `npm ci` + `npx astro build` at the repo root. Uploads `./dist/` as the `astro-build` artifact.
3. **`assemble`** — downloads both artifacts, places Astro `dist/*` at `_pages/` and Jekyll `_site_jekyll/*` at `_pages/legacy/`, then uploads the combined directory as the `github-pages` Pages artifact via `actions/upload-pages-artifact@v4`.
4. **`deploy`** — runs `actions/deploy-pages@v4` against the `github-pages` environment. Consumes the `github-pages` artifact and publishes it.

## Triggering

- `push` to `main` — automatic on any merged PR or direct push.
- `workflow_dispatch` — manual trigger from the Actions tab (useful for re-deploying without a code change, e.g., after a Pages source flip or to refresh the baked-in build SHA).

## Local dry-run

```bash
npm ci
npm run build          # Astro build -> dist/
cd legacy && bundle exec jekyll build --destination ../_site_jekyll   # Jekyll build (requires Ruby + github-pages gem)
```

Combined assemble isn't scripted locally; rely on the workflow for integration testing.

## Verification URLs (post-deploy smoke test)

These should all return 200:

- `https://mitselek.github.io/bigbook/` → Astro landing
- `https://mitselek.github.io/bigbook/legacy/` → Jekyll archive index
- `https://mitselek.github.io/bigbook/legacy/TOC/` → Jekyll table of contents
- `https://mitselek.github.io/bigbook/legacy/peatykid/billi-lugu/` → Jekyll chapter

And this should auto-redirect to `/bigbook/legacy/peatykid/billi-lugu/`:

- `https://mitselek.github.io/bigbook/peatykid/billi-lugu/` (handled by `src/pages/404.astro` client-side JS + meta-refresh fallback)

(_BB:Plantin_)
