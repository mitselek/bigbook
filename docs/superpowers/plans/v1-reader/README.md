# v1-reader — Plan 2 Overview

> **For agentic workers:** This plan uses the bigbook-dev XP triple (Montano RED → Granjon GREEN → Ortelius PURPLE) for TDD phases and Plantin-inline for config/wiring phases. See "Execution mode per phase" below.

**Milestone:** v1-reader
**Tracking issue:** TBD (Plantin creates after plan commit)
**Design spec:** [`docs/superpowers/specs/2026-04-16-v1-reader-design.md`](../../specs/2026-04-16-v1-reader-design.md)
**Parent spec:** [`docs/superpowers/specs/2026-04-14-bigbook-reader-design.md`](../../specs/2026-04-14-bigbook-reader-design.md)
**Commit convention:** every commit in this plan has `Part of #<epic>` in the body. The final commit uses `Closes #<epic>`.

**Goal:** Build the read-only bilingual reader — continuous scroll, lazy-loaded chapter content, row-aligned EN/ET columns, marginalia baseline-diff annotations, grouped TOC overlay, mobile responsive. Consumes the v1-foundation primitives (parse/validate/diff/manifest/baseline-config) and produces a deployable reader at `https://mitselek.github.io/bigbook/`.

**Architecture:** The reader is a single Astro page (`index.astro`) that boots from `manifest.ts` with a full-book skeleton, then lazy-loads chapter content via IntersectionObserver into Svelte 5 interactive islands. Three new `src/lib/` modules provide the pure logic (fetch, scroll-anchor, local-state). Six new components provide the UI (TopBar, TocOverlay, ParagraphRow, Marginalia, ChapterSection, Footer). The page-level state (current chapter, per-chapter fetch states) is managed by a shared Svelte store so that islands can communicate (e.g., ChapterSection reports its visibility → TopBar updates the title).

**Tech Stack:** TypeScript 5 (strict), Astro 5, Svelte 5 islands (`client:load` for TopBar/TocOverlay, `client:visible` for ChapterSection), Vitest + `@testing-library/svelte` for component tests, Playwright for E2E.

---

## Starting state (before Plan 2)

- v1-foundation CLOSED (sessions 4–8): `parse.ts`, `validate.ts`, `diff.ts`, `manifest.ts`, `baseline-config.ts` all landed
- 16 chapter pairs in `src/content/{en,et}/` (731 paragraph pairs, baseline pinned to `ecf8c0e`)
- Auth PoC in `src/lib/auth/` + Cloudflare Worker at `worker/`
- Svelte 5, Playwright, size-limit, a11y ESLint all installed (P0 of v1-foundation)
- `src/pages/index.astro` is the auth PoC landing page (will be rewritten)
- `src/components/` is empty (`.gitkeep` only)
- Pre-commit hooks: `typecheck`, `eslint`, `prettier`, `legacy-guard`, `content-guard`, `hard-invariant`

## Ending state (after Plan 2)

- A deployable bilingual reader at `/bigbook/` with:
  - Full-book skeleton rendering from manifest on page load
  - Per-chapter lazy fetch from raw.github (EN, baseline ET) + Contents API (current ET)
  - Row-aligned EN/ET paragraph pairs with marginalia baseline-diff annotations
  - Grouped TOC overlay with toggle dismiss and keyboard navigation
  - Top bar with IntersectionObserver-driven bilingual chapter title
  - Auth affordance (sign in / avatar) in top bar
  - Mobile responsive (<900px stacked pairs with EN/ET labels)
  - Visibility-change refresh for current ET
  - IndexedDB persistence for sha/etag, localStorage for lastParaId
  - Deep-link anchors (`#<para-id>`) that resolve before content loads
- Playwright E2E covering the anonymous reader happy path
- All 42 existing tests green + new tests for fetch, scroll-anchor, local-state, components
- `src/lib/` coverage ≥90% lines/functions/statements, ≥85% branches

## File structure map

New files marked `[new]`, modified `[mod]`, untouched files omitted.

```
bigbook/
├── src/
│   ├── lib/
│   │   ├── content/
│   │   │   └── fetch.ts                [new] runtime fetch (EN, baseline ET, current ET)
│   │   └── reader/
│   │       ├── scroll-anchor.ts        [new] IntersectionObserver + chapter tracking
│   │       ├── local-state.ts          [new] localStorage (lastParaId)
│   │       ├── store.ts               [new] shared Svelte-compatible reactive state
│   │       └── idb.ts                 [new] IndexedDB wrapper for chapter sha/etag
│   ├── components/
│   │   ├── TopBar.astro               [new] persistent top bar (wordmark, title, nav)
│   │   ├── TopBarClient.svelte        [new] reactive title update island
│   │   ├── ChapterSection.svelte      [new] per-chapter fetch/render island
│   │   ├── ParagraphRow.svelte        [new] one EN/ET pair + marginalia slot
│   │   ├── Marginalia.svelte          [new] baseline-diff annotation + expand
│   │   ├── TocOverlay.svelte          [new] full-screen grouped TOC
│   │   └── Footer.astro               [new] slim attribution footer
│   └── pages/
│       └── index.astro                [mod] rewritten as the reader page
├── tests/
│   ├── lib/
│   │   ├── content/
│   │   │   └── fetch.test.ts          [new]
│   │   └── reader/
│   │       ├── scroll-anchor.test.ts  [new]
│   │       └── local-state.test.ts    [new]
│   ├── components/
│   │   ├── ParagraphRow.test.ts       [new]
│   │   ├── Marginalia.test.ts         [new]
│   │   └── TocOverlay.test.ts         [new]
│   └── e2e/
│       └── reader.spec.ts            [new] Playwright E2E
├── playwright.config.ts               [mod] add reader test project
└── .size-limit.json                   [mod] update budgets after first green build
```

## Phases

| Phase                        | File                                           | Purpose                                                                                                               | Tasks | Mode      |
| ---------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----- | --------- |
| **P0 — Fetch module**        | [`p0-fetch.md`](./p0-fetch.md)                 | `src/lib/content/fetch.ts` — runtime fetch with ETag + SHA-pinning                                                    | 5     | XP triple |
| **P1 — Reader utilities**    | [`p1-reader-utils.md`](./p1-reader-utils.md)   | `scroll-anchor.ts`, `local-state.ts`, `store.ts`                                                                      | 5     | XP triple |
| **P2 — Page skeleton**       | [`p2-page-skeleton.md`](./p2-page-skeleton.md) | TopBar, Footer, index.astro, skeleton rendering from manifest                                                         | 5     | Inline    |
| **P3 — Paragraph rendering** | [`p3-paragraph.md`](./p3-paragraph.md)         | `ParagraphRow.svelte` + `Marginalia.svelte` with component tests                                                      | 6     | XP triple |
| **P4 — TOC overlay**         | [`p4-toc.md`](./p4-toc.md)                     | `TocOverlay.svelte` with grouped display + keyboard nav                                                               | 4     | XP triple |
| **P5 — Runtime wiring**      | [`p5-wiring.md`](./p5-wiring.md)               | `ChapterSection.svelte`, fetch→render pipeline, IO preload, visibility-change refresh, IndexedDB, return-visit scroll | 6     | Inline    |
| **P6 — Mobile responsive**   | [`p6-mobile.md`](./p6-mobile.md)               | <900px breakpoint, stacked pairs, EN/ET labels, burger menu                                                           | 3     | Inline    |
| **P7 — E2E + verification**  | [`p7-e2e.md`](./p7-e2e.md)                     | Playwright E2E, build verification, size-limit update, deploy check                                                   | 4     | Inline    |

**Total: 38 tasks across 8 phases.**

## Execution mode per phase

| Pattern                                                       | When it fits                                            | Phases         |
| ------------------------------------------------------------- | ------------------------------------------------------- | -------------- |
| **XP triple** (Montano RED → Granjon GREEN → Ortelius PURPLE) | Real TDD code: pure lib modules, Svelte component tests | P0, P1, P3, P4 |
| **Inline** (Plantin via `superpowers:executing-plans`)        | Config/wiring, Astro templating, E2E, CSS               | P2, P5, P6, P7 |

Same split logic as v1-foundation: XP triple for code with failing tests, inline for config and integration wiring.

**XP triple logistics** (unchanged from v1-foundation):

1. Plantin checks for `~/.claude/teams/bigbook-dev/`. If present, back up inboxes → delete → `TeamCreate(team_name: "bigbook-dev")` → restore inboxes.
2. Spawn Montano / Granjon / Ortelius using roster prompts at `.claude/teams/bigbook-dev/prompts/<name>.md`.
3. One acceptance criterion at a time. Wait for CYCLE_COMPLETE from Ortelius before dispatching next TEST_SPEC.
4. Phase-boundary context refresh: wrap the team, commit scratchpads, start fresh session for next phase.

## Dependency graph

```
P0 (fetch) ─────────────────┐
P1 (reader utils) ──────────┤
P2 (page skeleton) ─────────┤── P5 (wiring) ── P6 (mobile) ── P7 (E2E)
P3 (paragraph + marginalia) ─┤
P4 (TOC) ───────────────────┘
```

P0, P1, P2, P3, P4 have no inter-dependencies. They CAN run in parallel (different sessions or agents), but the XP triple is sequential by design (one pipeline). Recommended execution order: P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7. P5 is the integration phase where the app comes alive.

---

(_BB:Plantin_)
