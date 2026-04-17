# Build & Tooling Gotchas

Practical issues encountered during v1-foundation. Check here before debugging mysterious failures.

## ESLint

- `eslint-plugin-astro`'s jsx-a11y configs need `eslint-plugin-jsx-a11y` installed separately — implicit peer dep not declared in `package.json`. Error: `ConfigError: Key "plugins": Key "jsx-a11y": Expected an object`.
- Flat config requires `flat/jsx-a11y-recommended`, not `jsx-a11y-recommended` (legacy variant incompatible with ESLint 9).

## size-limit

- `path` globs fail hard on empty matches (exit 1). Don't add budgets for file categories that don't exist yet.
- Reports brotli sizes, not gzip — despite common labeling as "(gzipped)."

## Prettier

- Plan files edited inline bypass format-on-save, so table column widths drift. Run `npx prettier --write <file>` before staging plan file edits.
- Generated content files (`formatContentFile` output) need `prettier --write` before commit.

## Git / Windows

- `.gitattributes` enforces `eol=lf` for 13 extensions (commit `40bcc1f`). Future CRLF traps should be rare unless a new extension is added.
- `git stash pop` on Windows with `core.autocrlf=true` can silently convert LF → CRLF. The `.gitattributes` fix addresses this for tracked files.
- Windows Git Bash `lefthook` shell-escaping: multi-step guard scripts need to be in separate `.sh` files invoked via `bash scripts/guard.sh`, not inline `sh -c` in `lefthook.yml`.

## Astro 5 + Strict TS

- `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` require null guards on DOM API return values. `document.getElementById` returns `HTMLElement | null`; use explicit casts + guards.
- `pathToFileURL(invokedPath).href` over manual `file://` concat for entry-point detection on Windows (Windows produces `file:///C:/...` vs `file://C:/...`).

## Node / CI

- Playwright browser install is ~60s, lands outside repo at `%USERPROFILE%\AppData\Local\ms-playwright\`.
- `@astrojs/svelte@^7` is the correct family for Astro 5 (not `^6` which peer-depends on `astro@^4`).

(*BB:Plantin*)
