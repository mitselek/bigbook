# Plantin — Scratchpad

## Project Timeline

| Sessions | Milestone | What landed |
|---|---|---|
| 1–2 | Pre-bootstrap | Coexistence inversion (Jekyll → `legacy/`, repo root → Astro), dual-build GH Actions workflow, auth PoC (GitHub App PKCE + CF Worker token proxy) |
| 3 | Planning | Product brainstorm → spec (`2026-04-14-bigbook-reader-design.md`), v1-foundation plan (7 phases, 36 tasks), GitHub milestones + epics + sub-issues |
| 4 | v1-foundation P0 | Infrastructure: Svelte 5, a11y ESLint, Playwright scaffold, size-limit scaffold |
| 5 | v1-foundation P1 | `parse.ts` — 115 lines, 12 tests, 100% coverage. XP triple first live exercise. |
| 6 | v1-foundation P2+P3 | `validate.ts` (88 lines) + `diff.ts` (23 lines). `.gitattributes` LF enforcement. |
| 7 | v1-foundation P4 | `scripts/bootstrap-mock-content.ts` — 268 lines, 6 pure helpers + orchestrator. Mixed-mode (inline + XP triple). |
| 8 | v1-foundation P5+P6 | Pre-commit hooks (legacy-guard restored, content-guard, hard-invariant). Mock content bootstrap (16 chapters, 731 para pairs). **v1-foundation CLOSED.** |
| 9 | Plan 2 writing | v1-reader brainstorm (visual companion + 11 decisions) → spec → plan (8 phases, 38 tasks). No agents spawned. |
| 10 | **v1-reader (full)** | All 8 phases (P0–P7) executed in one session. 49 commits, 89 unit/component tests + 4 Playwright E2E. **v1-reader CLOSED.** |

## Current State (after session 10)

- **Head of `main`:** `67ed9e1` (session 10 wrap). CI triggered. Pushed.
- **v1-foundation:** CLOSED (milestone 1, epic #3, sub-issues #7–#13).
- **v1-reader:** CLOSED (milestone 2, epic #4, sub-issues #14–#21).
- **`src/lib/content/`:** 6 modules — parse.ts, validate.ts, diff.ts, manifest.ts, baseline-config.ts, fetch.ts.
- **`src/lib/reader/`:** 4 modules — scroll-anchor.ts, local-state.ts, store.ts, idb.ts.
- **`src/components/`:** 7 components — TopBar.astro, TopBarClient.svelte, ChapterSection.svelte, ParagraphRow.svelte, Marginalia.svelte, TocOverlay.svelte, Footer.astro.
- **`src/content/{en,et}/`:** 16 chapter pairs, 731 paragraphs. EN ch01–ch04 real translations; ch05–ch16 ET-verbatim placeholders.
- **`tests/`:** 89 unit/component tests (12 test files), 4 Playwright E2E tests.
- **Coverage:** `src/lib/` — 99.29% stmts, 95.45% branch, 100% funcs.
- **Team state:** agents shut down at session 10 end.

## Architecture Notes from Session 10

- **Self-observing ChapterSection:** Astro's island hydration doesn't expose Svelte component methods on DOM elements. ChapterSection manages its own IntersectionObserver (via createPreloadObserver) instead of relying on external `requestLoad()` calls. Visibility-change refresh uses a custom DOM event (`bigbook:refresh-chapters`).
- **prettier-plugin-svelte:** Installed mid-P3 when Ortelius flagged the formatting gap. `.svelte` files are now fully formatted by Prettier. The `.prettierrc.json` has a `"files": "*.svelte"` override with `"parser": "svelte"`.
- **Coverage config:** `vitest.config.ts` coverage includes `src/lib/**/*.ts` (broadened from `src/lib/content/**` during P1 when Ortelius flagged the gap).

## Open Deferrals

- Real auth ADR at `docs/decisions/0001-auth.md` (deferred session 2)
- `npm audit` moderate advisories (11+ from Astro scaffold + deps)
- Node 20 → 24 GH Actions migration (June 2026 deadline)
- P4.7 `main()` orchestrator exercise (deferred to v3's PDF bootstrap)
- ch05–ch16 ET-verbatim placeholders (v3 fixes via PDF extraction)
- TOC overlay not wired to TopBarClient's onToggleToc (static `isOpen={false}` in TopBar.astro — needs a page-level Svelte store or custom event to toggle)
- IndexedDB sha/etag persistence (idb.ts created but not wired into ChapterSection's fetch pipeline)

## Reference Files (extracted from earlier session narratives)

- `ref-auth-infra.md` — GitHub App name/ID, Worker URL, token lifecycle, constraints
- `ref-xp-process.md` — XP triple process rules (pipeline serialization, hold-then-refactor, coverage gates, v8 gotcha, pre-dispatch refresh, git hygiene)
- `ref-build-gotchas.md` — ESLint, size-limit, Prettier, Git/Windows, Astro 5 strict TS, Node/CI gotchas

## Next Session Entry Point

**Session 11: v1-editor (Plan 3) or TOC/IDB wiring follow-ups.**

1. Run `bigbook-startup` skill.
2. Verify: HEAD `67ed9e1`, CI green, deployed site working at `https://mitselek.github.io/bigbook/`.
3. Decide with PO: start v1-editor planning, or wire up remaining P5 follow-ups (TOC toggle, IndexedDB persistence).
4. If v1-editor: brainstorm → spec → plan (same workflow as sessions 3 and 9).

(*BB:Plantin*)
