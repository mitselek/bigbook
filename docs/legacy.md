# Legacy Jekyll archive

The `legacy/` directory contains the pre-2026-04-14 Jekyll site that used to live at the repo root. It is served at `https://mitselek.github.io/bigbook/legacy/` as a frozen read-only archive.

## Policy

Do not edit files under `legacy/`. The `legacy-guard` lefthook pre-commit hook (in `lefthook.yml`) blocks any staged diff under `legacy/` unless `LEGACY_OVERRIDE=1` is set in the commit environment with explicit PO approval recorded in the commit body.

## Inbound URL handling

The new Astro app at the repo root renders a 404 page (`src/pages/404.astro`) that auto-redirects pre-restructure slug prefixes — `peatykid`, `kogemuslood`, `lisad`, `front_matter`, `TOC`, `BIGBOOK` — to the corresponding `/bigbook/legacy/...` paths via client-side JS, with a `<meta http-equiv="refresh">` fallback for no-JS clients (5-second timer pointing at the legacy index). This preserves existing bookmarks and inbound links from the Estonian-only Jekyll era.

## Why we kept it

1. **Content preservation.** It contains a substantial body of manually-transcribed Estonian content that took many commits to produce. Throwing it away would destroy history.
2. **Reference translation.** The new bilingual app will grow its own `src/content/{en,et}/` tree from the authoritative PDFs in `legacy/assets/`. The existing Estonian markdown serves as a reference translation during the bootstrap process.
3. **Inbound link continuity.** Existing links and search-engine indexing for `https://mitselek.github.io/bigbook/peatykid/...` etc. continue to resolve via the 404-redirect.

## Build specifics

`legacy/_config.yml` has `baseurl: "/bigbook/legacy"` so the Jekyll build produces a self-contained archive under the `/legacy/` subpath of the Pages deploy. Every internal link in the Jekyll markdown uses `{{ site.baseurl }}`, so no hardcoded URL surgery was needed to rebase the archive.

(_BB:Plantin_)
