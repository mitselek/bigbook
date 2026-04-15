# v1-foundation — Plan Overview

**Milestone:** [v1-foundation](https://github.com/mitselek/bigbook/milestone/1)
**Tracking issue:** [#3 — Epic: v1-foundation](https://github.com/mitselek/bigbook/issues/3)
**Design spec:** [Discussion #2](https://github.com/mitselek/bigbook/discussions/2) · committed at [`docs/superpowers/specs/2026-04-14-bigbook-reader-design.md`](../../specs/2026-04-14-bigbook-reader-design.md)
**Commit convention:** every commit in this plan has `Part of #3` in the body. The final commit of Phase 6 uses `Closes #3`.

**Goal:** Establish the content format, the pure-lib foundation (parse/validate/diff), mock ET/EN content bootstrapped into `src/content/`, and development infrastructure (Svelte 5 + a11y lint + Playwright scaffold + size-limit stub + upgraded lefthook hooks). Everything Vitest-testable. No UI, no runtime fetch yet.

**Architecture:** This plan lands the substrate Plans 2-4 build on top of. `src/lib/content/` becomes the input to Plan 2's runtime fetch and Plan 3's editor pre-flight. `src/content/{et,en}/` is populated by a one-shot `CONTENT_BOOTSTRAP=1` script that scrapes the legacy Jekyll ET text and translates it to EN via the Claude API. A two-commit dance captures the content (commit A) and pins `BASELINE_COMMIT_SHA` (commit B) for the diff machinery. Pre-commit hooks are upgraded: `legacy-guard` restored via a shell script to work around the Git Bash escaping bug from session 2, `content-guard` new, `hard-invariant` new and sharing `src/lib/content/validate.ts` with Plan 3's editor pre-flight.

**Tech Stack:** TypeScript 5 (strict), Astro 5, Svelte 5 (for Plan 2 islands — installed now so Plan 2 starts ready), Vitest 2.x + jsdom + `@testing-library/svelte` + `@testing-library/jest-dom`, ESLint 9 flat config + `typescript-eslint` + `eslint-plugin-astro` + `eslint-plugin-svelte`, Prettier 3 + `prettier-plugin-astro`, lefthook pre-commit, Playwright (scaffold only — tests land in Plan 2), size-limit (scaffold only — real budgets measured in Plan 4), Claude API (`claude-opus-4-6`) for the one-shot translation.

---

## Starting state (before Plan 1)

- Astro 5 scaffold from session 2 with a minimal `src/pages/index.astro`, `src/layouts/Layout.astro`, `src/pages/404.astro`
- GitHub App PKCE auth PoC under `src/lib/auth/` with a Cloudflare Worker token-exchange proxy at `worker/`
- Root configs: `astro.config.mjs`, `tsconfig.json`, `package.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `lefthook.yml`
- `docs/architecture.md`, `docs/legacy.md`, `docs/deploy.md`, `docs/superpowers/specs/2026-04-14-bigbook-reader-design.md`
- `tests/smoke.test.ts`
- Legacy Jekyll archive frozen under `legacy/` (read-only per the Coexistence Boundary)
- **No** Svelte, **no** Playwright, **no** size-limit; lefthook has only `typecheck`, `eslint`, `prettier`

## Ending state (after Plan 1)

- All new dependencies installed and wired: Svelte 5 as an Astro integration, a11y ESLint plugins, Playwright config, size-limit config
- `src/lib/content/parse.ts`, `validate.ts`, `diff.ts` — three pure modules, Vitest-covered at ≥90% lines/functions/statements and ≥85% branches
- `src/lib/content/manifest.ts` and `src/lib/content/baseline-config.ts` — both emitted by the bootstrap script
- `src/content/et/*.md` and `src/content/en/*.md` — mock content with `para-id` directives, passing the Hard Invariant
- `scripts/bootstrap-mock-content.mjs` — one-shot, committed for future reference
- `scripts/legacy-guard.sh` + `scripts/content-guard.sh` — pre-commit hook logic as shell scripts
- `lefthook.yml` with `typecheck`, `eslint`, `prettier`, `legacy-guard`, `content-guard`, `hard-invariant` all active
- `playwright.config.ts` — scaffold only (no tests yet)
- `.size-limit.json` — scaffold only (placeholder budgets)

## File structure map

New files are marked `[new]`, modified `[mod]`, untouched files omitted.

```
bigbook/
├── src/
│   ├── content/
│   │   ├── et/                      [new] ~20 chapter files
│   │   └── en/                      [new] ~20 chapter files (auto-translated)
│   ├── lib/
│   │   └── content/                 [new]
│   │       ├── parse.ts
│   │       ├── validate.ts
│   │       ├── diff.ts
│   │       ├── manifest.ts          (emitted by bootstrap)
│   │       └── baseline-config.ts   (emitted by bootstrap)
├── scripts/                         [new]
│   ├── bootstrap-mock-content.mjs
│   ├── legacy-guard.sh
│   └── content-guard.sh
├── tests/
│   ├── lib/
│   │   └── content/                 [new]
│   │       ├── parse.test.ts
│   │       ├── validate.test.ts
│   │       └── diff.test.ts
│   └── e2e/.gitkeep                 [new] (Plan 2 adds tests here)
├── playwright.config.ts             [new]
├── .size-limit.json                 [new]
├── astro.config.mjs                 [mod] add @astrojs/svelte integration
├── eslint.config.js                 [mod] add svelte + astro a11y rules
├── vitest.config.ts                 [mod] add jsdom env + svelte support
├── package.json                     [mod] deps + scripts
└── lefthook.yml                     [mod] legacy-guard + content-guard + hard-invariant
```

## Phases

Each phase is its own plan file under this directory. Phases are executed in order; each is reviewed before the next is written.

| Phase                     | File                                             | Purpose                                                                                      | Status  |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------- |
| **P0 — Infrastructure**   | [`p0-infrastructure.md`](./p0-infrastructure.md) | Install Svelte 5 + a11y plugins + Playwright + size-limit, wire configs, verify the dev loop | Written |
| **P1 — Parse module**     | [`p1-parse.md`](./p1-parse.md)                   | `src/lib/content/parse.ts` parses `::para[id]` directives + YAML frontmatter                 | Written |
| **P2 — Validate module**  | [`p2-validate.md`](./p2-validate.md)             | `src/lib/content/validate.ts` enforces the Hard Invariant + structured errors                | Written |
| **P3 — Diff module**      | [`p3-diff.md`](./p3-diff.md)                     | `src/lib/content/diff.ts` returns diverged `para-id`s between current and baseline           | Written |
| **P4 — Bootstrap script** | [`p4-bootstrap.md`](./p4-bootstrap.md)           | `scripts/bootstrap-mock-content.mjs` scrapes legacy, calls Claude, emits manifest            | Written |
| **P5 — Pre-commit hooks** | [`p5-hooks.md`](./p5-hooks.md)                   | `legacy-guard` restored, `content-guard` new, `hard-invariant` new                           | Written |
| **P6 — Land the content** | [`p6-land-content.md`](./p6-land-content.md)     | Run the bootstrap, commit A (content + manifest), commit B (baseline SHA constant)           | Written |

All seven phase files now exist. Each phase is reviewed before the next executes; execution remains sequential.

---

(_BB:Plantin_)
