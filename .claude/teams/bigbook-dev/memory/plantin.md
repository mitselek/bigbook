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
| 11 | **v1-editor + polish** | Polish: reading position dot, TOC force-load, markdown rendering (marked), rate-limit fix, return-visit scroll. Editor: brainstorm → spec → plan → implementation (7 tasks via subagent-driven). ET content corrections ch05–ch11 from PDF. **116 tests.** |

## Current State (after session 11)

- **Head of `main`:** `9fd7655`. CI green. Pushed. Deployed.
- **v1-foundation:** CLOSED (milestone 1, epic #3, sub-issues #7–#13).
- **v1-reader:** CLOSED (milestone 2, epic #4, sub-issues #14–#21).
- **v1-editor:** FUNCTIONALLY COMPLETE — needs live testing, E2E tests, and PO acceptance.
- **Live site:** `https://mitselek.github.io/bigbook/`
- **`src/lib/content/`:** 7 modules — parse.ts, serialize.ts, validate.ts, diff.ts, manifest.ts, baseline-config.ts, fetch.ts.
- **`src/lib/editor/`:** 2 modules — state.svelte.ts, commit.ts.
- **`src/lib/reader/`:** 4 modules — scroll-anchor.ts, local-state.ts, store.svelte.ts, idb.ts.
- **`src/lib/auth/`:** 5 modules — github-app.ts, token-store.ts, pkce.ts, state.ts, config.ts.
- **`src/components/`:** 8 components — TopBar.astro, TopBarClient.svelte, ChapterSection.svelte, ParagraphRow.svelte, EditableRow.svelte, Marginalia.svelte, TocOverlay.svelte, Footer.astro.
- **`src/content/{en,et}/`:** 16 chapter pairs, 731 paragraphs. EN ch01–ch04 real English; ch05–ch16 ET-verbatim placeholders. ET ch05–ch11 corrected against authoritative PDF.
- **`tests/`:** 116 unit/component tests (16 test files), 4 Playwright E2E tests.
- **Team state:** all subagents shut down.

## Session 11 Work Summary

### Polish (pre-editor)
- **#22 Reading position dot:** 1/3-viewport observer, 5px dot on EN/ET separator, centered vertically. Focus observer lives in ChapterSection (not index.astro — fixes observer-on-replaced-DOM bug). Return-visit scroll places saved paragraph at 1/3 viewport.
- **#23 IndexedDB:** Initially wired Contents API + etag caching, but hit rate limit (60 req/hr anon). Simplified: anonymous reads use raw.githubusercontent.com (unlimited). IndexedDB + Contents API reserved for authenticated users (5000 req/hr).
- **#24 TOC force-load:** `bigbook:force-load` custom event from TocOverlay, ChapterSection listens and starts loading immediately.
- **Markdown rendering:** Added `marked` library. ParagraphRow renders body paragraphs through `marked.parse()` inside `{@html}` (eslint-suppressed — git-repo content). Supports blockquotes, lists, tables, bold. CSS for `.prose` elements.
- **Rate limit fix:** Dropped Contents API for all anonymous reads. `fetchCurrentEtFromMain()` for anonymous, `fetchCurrentEt()` with token for authenticated.
- **Blob SHA lesson:** Contents API `sha` is a blob SHA, not a commit ref. Can't use it in raw.githubusercontent.com URLs.

### Editor implementation
- **Spec:** `docs/superpowers/specs/2026-04-17-v1-editor-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-17-v1-editor.md` (9 tasks, 7 phases)
- **Execution:** Subagent-driven development — 7 implementer subagents (sonnet), all tasks completed.
- **New modules:** serialize.ts (19 lines), editor/state.svelte.ts (~60 lines), editor/commit.ts (~60 lines), EditableRow.svelte (~180 lines)
- **Modified:** ChapterSection.svelte (auth fetch + EditableRow wiring), store.svelte.ts (isAuthenticated), index.astro (auth state init)
- **Tests:** 27 new tests across 4 test files

### ET content corrections
- **ch05–ch11** corrected against authoritative Estonian PDF by background subagent
- ch05/ch06: heavy corrections (~110 total — different translation version)
- ch07–ch11: moderate to minimal corrections
- Structural note: ch05 contains content spanning PDF chapters 5+6; ch06 has duplicates from ch05

## Open Items

### Must-do before PO acceptance
- [ ] **Live testing:** Sign in with GitHub, test the edit flow on the deployed site
- [ ] **E2E tests:** Playwright tests for the editor flow (Task 8 deferred)

### Open deferrals
- Real auth ADR at `docs/decisions/0001-auth.md` (deferred session 2)
- `npm audit` moderate advisories (11+ from Astro scaffold + deps)
- Node 20 → 24 GH Actions migration (June 2026 deadline)
- EN ch05–ch16 still ET-verbatim placeholders (PDF extraction subagents failed — need different approach)
- Comments feature (deferred to v2 per editor spec)
- ch05/ch06 structural mismatch with PDF chapter boundaries (missing content between p010-p011)

## Session 11 Lessons

- **Contents API is wrong for anonymous reads.** 60 req/hr unauthenticated limit. All anonymous reads must go through raw.githubusercontent.com (unlimited).
- **Blob SHA ≠ commit SHA.** The Contents API `sha` field is a blob SHA, not a commit ref.
- **Save/restore position must use the same viewport anchor.** 1/3-viewport observer + 1/3-viewport scroll = stable position.
- **IntersectionObserver on replaced DOM elements.** Observer must live in the component that owns the DOM lifecycle.
- **PDF extraction via subagents is unreliable.** EN extraction subagents failed to produce output despite multiple attempts. The ET extractor (verification/correction against existing text) worked well. For EN extraction (greenfield text from PDF), a different approach is needed — possibly manual extraction or a dedicated script.
- **Subagent-driven development works well for lib-layer tasks.** Tasks 1–4 (pure functions, clear specs) completed quickly with sonnet. Integration tasks (5, 7) also worked but needed more careful prompting.

## Next Session Entry Point

**Session 12: PO decides direction.**

1. Live-test the editor on the deployed site (sign in, edit a paragraph, verify commit)
2. If working: write E2E tests, file GitHub milestone/issues for v1-editor
3. If bugs: fix inline
4. Then: decide next milestone — v2-comments, EN content extraction, or other

(*BB:Plantin*)
