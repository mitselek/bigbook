# Architecture

The `bigbook` repository is an Astro 5 + TypeScript static site deployed to GitHub Pages at `https://mitselek.github.io/bigbook/`.

## Coexistence

Two products share one git history:

1. **Astro bilingual reader** (repo root). The current and canonical product. Builds to static HTML + JS + CSS and is served at `/bigbook/`. Fetches chapter markdown at runtime from `raw.githubusercontent.com` so collaborator commits to content become visible to live users within the raw.github cache TTL (~5 minutes), without waiting for a GitHub Pages rebuild.
2. **Legacy Jekyll archive** (`legacy/`). A frozen snapshot of the pre-2026-04-14 Estonian-only Jekyll edition. Still builds cleanly and is served at `/bigbook/legacy/`. Read-only.

A single GitHub Actions workflow at `.github/workflows/build-and-deploy.yml` builds both products and combines them into one Pages artifact (Astro at `/`, Jekyll at `/legacy/`). The Pages source is set to "GitHub Actions" (not branch-based), which is a one-time repo settings flip.

## Three-layer boundary

The Astro app follows a strict three-layer dependency rule enforced by ESLint `no-restricted-imports`:

- **`src/lib/`** — pure, headless, testable domain logic: alignment, diff, GitHub API wrappers, auth state machines. **Must not** import from `components/`, `pages/`, or any UI runtime (`astro:*`).
- **`src/components/`** — UI components. Depends on `lib/`. Never imports from `pages/`.
- **`src/pages/`** — Astro routes. Top of the dependency graph. Depends on `components/` and `lib/`.

Inner layers never import from outer layers; layers are never skipped.

## Runtime content fetch

The Astro build is a thin shell: layout, navigation, JS bundles, CSS — but **not** the chapter content. Chapter markdown files are fetched at runtime from `raw.githubusercontent.com/mitselek/bigbook/main/src/content/{en,et}/<chapter>.md` so collaborator commits become visible without a rebuild. Constraints:

- Reads must be simple GETs with no custom headers (CORS preflight returns 403 on `raw.githubusercontent.com`).
- Cache TTL is ~5 minutes; anonymous reads accept this staleness window.
- Editors get instant feedback via optimistic local state after successful `PUT` to the Contents API — no refetch needed.
- Cross-session freshness uses SHA-pinned URLs (`raw.../<sha>/...`) via a `lastKnownSha` persisted in IndexedDB per file, falling back to unpinned `main` URLs after the staleness window closes.

## Editor auth (intent; ADR deferred)

Anonymous visitors are read-only. Collaborators authenticate via **PKCE OAuth using a GitHub App** registration (not a classic OAuth App — GitHub Apps issue rotating refresh tokens that support the split-persistence pattern). Token persistence:

- **Refresh token** (~6 months, rotating): `localStorage`.
- **Access token** (~8 hours): in-session memory only, silently refreshed.

Edits commit directly to `main` via `PUT /repos/mitselek/bigbook/contents/{path}` from the browser. Scope: `public_repo` (minimum).

The concrete auth ADR (GitHub App configuration, scopes, refresh cadence, XSS mitigations) is deferred to the bootstrap story's auth spike.

## The hard invariant

**Every paragraph in the English content collection has exactly one paired paragraph in the Estonian content collection**, identified by a stable `para-id` of the form `<section>-<ordinal>` (e.g., `ch01-p007`). Edits may change text but must never break the mapping. All paragraph-level operations — rendering, editing, diffing, commenting — are keyed on `para-id`.

See also: `docs/legacy.md`, `docs/deploy.md`.

(_BB:Plantin_)
