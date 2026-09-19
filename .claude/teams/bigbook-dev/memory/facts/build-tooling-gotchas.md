---
type: rule
status: live
---

- eslint-plugin-astro's jsx-a11y configs need eslint-plugin-jsx-a11y installed separately (undeclared peer dep); flat config wants flat/jsx-a11y-recommended, not the legacy variant. `v:2026-04-17`
  - `ev: ConfigError Key "plugins" Key "jsx-a11y"; eslint.config.js`
  - `rf: npx eslint . after a clean install`
- size-limit path globs fail hard on empty matches (exit 1) -- no budgets for not-yet-existing categories; it reports brotli sizes despite "(gzipped)" labels. `v:2026-04-17`
  - `ev: ref-build-gotchas carve 2026-09-19`
  - `rf: package.json size-limit block`
- Plan files edited inline bypass format-on-save; run npx prettier --write before staging plan edits and on generated content (formatContentFile output). `v:2026-04-17`
  - `ev: ref-build-gotchas carve 2026-09-19`
  - `rf: git diff after prettier --write`
- .gitattributes enforces eol=lf on 13 extensions; git stash pop on Windows with autocrlf=true can silently convert LF to CRLF on untracked-by-attribute files. `v:2026-04-17`
  - `ev: commit 40bcc1f; .gitattributes`
  - `rf: .gitattributes`
- Windows Git Bash lefthook: multi-step guard scripts go in separate .sh files invoked via bash, never inline sh -c in lefthook.yml (shell-escaping breaks). `v:2026-04-17`
  - `ev: lefthook.yml; ref-build-gotchas carve 2026-09-19`
  - `rf: lefthook.yml`
- Strict TS (noUncheckedIndexedAccess + exactOptionalPropertyTypes) demands null guards on DOM returns; use pathToFileURL().href over manual file:// concat for entry-point detection on Windows. `v:2026-04-17`
  - `ev: tsconfig.json; ref-build-gotchas carve 2026-09-19`
  - `rf: tsconfig.json compilerOptions`
- Playwright browser install ~60s, lands outside the repo (user-profile ms-playwright dir); @astrojs/svelte@^7 is the Astro 5 family (^6 peer-depends on astro@^4). `v:2026-04-17`
  - `ev: package.json; ref-build-gotchas carve 2026-09-19`
  - `rf: package.json deps`
- v8 coverage + noUncheckedIndexedAccess on regex captures: prefer 1) string slicing 2) assertDefined helpers 3) destructure-and-check 4) v8-ignore as last resort; catch at plan review. `v:2026-04-17`
  - `ev: session 5 P1.7; ref-xp-process carve 2026-09-19`
  - `rf:`
