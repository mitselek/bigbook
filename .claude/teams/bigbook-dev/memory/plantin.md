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
| 10 | **v1-reader (full)** | All 8 phases (P0–P7) + 3 post-closure hotfixes. 52 commits, 89 unit/component tests + 4 Playwright E2E. **v1-reader CLOSED.** |

## Current State (after session 10)

- **Head of `main`:** `7284ced`. CI green. Pushed. Deployed.
- **v1-foundation:** CLOSED (milestone 1, epic #3, sub-issues #7–#13).
- **v1-reader:** CLOSED (milestone 2, epic #4, sub-issues #14–#21).
- **Live site:** `https://mitselek.github.io/bigbook/`
- **`src/lib/content/`:** 6 modules — parse.ts, validate.ts, diff.ts, manifest.ts, baseline-config.ts, fetch.ts.
- **`src/lib/reader/`:** 4 modules — scroll-anchor.ts, local-state.ts, **store.svelte.ts** (renamed from store.ts — uses `$state` rune for reactivity), idb.ts.
- **`src/components/`:** 7 components — TopBar.astro, TopBarClient.svelte, ChapterSection.svelte, ParagraphRow.svelte, Marginalia.svelte, TocOverlay.svelte, Footer.astro.
- **`src/content/{en,et}/`:** 16 chapter pairs, 731 paragraphs. EN ch01–ch04 real translations; ch05–ch16 ET-verbatim placeholders.
- **`tests/`:** 89 unit/component tests (12 test files), 4 Playwright E2E tests.
- **Coverage:** `src/lib/` — 99.29% stmts, 95.45% branch, 100% funcs.
- **Team state:** agents shut down at session 10 end.

## Session 10 Post-Closure Hotfixes

Three bugs found during PO live testing after the v1-reader milestone was closed:

1. **UTF-8 decode** (`9c75098`): `atob()` decodes base64 to Latin-1, corrupting Estonian characters. Fix: `Uint8Array.from(atob(...), c => c.charCodeAt(0))` + `TextDecoder`. Affects `fetchCurrentEt` only — `fetchEn`/`fetchBaselineEt` use `response.text()` which decodes UTF-8 correctly.
2. **TOC wiring** (`8b3fc36`): TocOverlay was rendered with static `isOpen={false}` and no-op callbacks. Fix: `readerState.tocOpen` in store drives open/close state; TopBarClient toggles it on click; TocOverlay reads it via `$derived`; also listens for `bigbook:toggle-toc` custom event (/ key).
3. **Reactive store** (`7284ced`): `store.ts` was a plain object — Svelte 5's `$derived` can't track plain property changes. Fix: rename to `store.svelte.ts` and wrap in `$state()` rune. All imports updated.

**Lesson learned:** Astro's island architecture isolates component instances. Cross-island communication requires either (a) a shared `.svelte.ts` module with `$state` runes, or (b) custom DOM events. Plain JS objects don't trigger Svelte reactivity. And component methods (like `export function requestLoad()`) are NOT accessible from outside the island — use self-contained observers or events instead.

## Architecture Notes

- **Self-observing ChapterSection:** Each ChapterSection manages its own IntersectionObserver (via createPreloadObserver) for lazy loading. Visibility-change refresh uses `bigbook:refresh-chapters` custom DOM event.
- **Cross-island state:** `store.svelte.ts` with `$state()` rune is the only mechanism that works for reactive cross-island communication in Astro + Svelte 5.
- **prettier-plugin-svelte:** Installed mid-P3. `.svelte` files fully formatted by Prettier.
- **Coverage config:** `vitest.config.ts` includes both `src/lib/**/*.ts` and `src/lib/**/*.svelte.ts`.

## Open Issues

- [#22](https://github.com/mitselek/bigbook/issues/22) — UX: current-paragraph reading position marker (future enhancement)
- [#23](https://github.com/mitselek/bigbook/issues/23) — Wire IndexedDB sha/etag persistence into ChapterSection (perf — avoids re-fetching unchanged content)
- [#24](https://github.com/mitselek/bigbook/issues/24) — TOC onSelect should force-load unloaded chapters (UX — selected chapter may be in skeleton state)

## Open Deferrals (not filed)

- Real auth ADR at `docs/decisions/0001-auth.md` (deferred session 2)
- `npm audit` moderate advisories (11+ from Astro scaffold + deps)
- Node 20 → 24 GH Actions migration (June 2026 deadline)
- ch05–ch16 ET-verbatim placeholders (v3 fixes via PDF extraction)

## Reference Files

- `ref-auth-infra.md` — GitHub App name/ID, Worker URL, token lifecycle, constraints
- `ref-xp-process.md` — XP triple process rules
- `ref-build-gotchas.md` — ESLint, size-limit, Prettier, Git/Windows, Astro 5 strict TS, Node/CI gotchas

## Next Session Entry Point

**Session 11: PO decides direction.**

1. Run `bigbook-startup` skill.
2. Verify: HEAD `7284ced`, CI green, deployed site working.
3. Options:
   - **Quick wins:** Wire #23 (IndexedDB) + #24 (TOC force-load) — small inline fixes, no team needed.
   - **v1-editor planning:** Brainstorm → spec → plan for milestone 3 (epic #5) — authenticated editing of Estonian paragraphs.
   - **Polish:** #22 (reading position marker), CSS refinements, real content for ch05–ch16.

(*BB:Plantin*)
