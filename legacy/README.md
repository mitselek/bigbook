# Frozen archive

This directory contains the pre-restructure Jekyll site that was deployed to GitHub Pages as `https://mitselek.github.io/bigbook/` before the 2026-04-14 coexistence inversion. It is preserved here as a read-only historical snapshot and deployed at `https://mitselek.github.io/bigbook/legacy/` by the same workflow that builds the new Astro app at the repo root.

Do not edit files under this directory. A lefthook `legacy-guard` pre-commit hook (installed in a subsequent commit of the restructure sequence) will block any staged diff under `legacy/` unless `LEGACY_OVERRIDE=1` is set in the commit environment with explicit PO approval recorded in the commit body.

Pre-restructure inbound URLs like `https://mitselek.github.io/bigbook/peatykid/billi-lugu/` are redirected to the corresponding `https://mitselek.github.io/bigbook/legacy/peatykid/billi-lugu/` paths by the new Astro app at the repo root, so existing bookmarks continue to resolve.

(*BB:Plantin*)
