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

## Current State (after session 9)

- **Head of `main`:** `4ae6afb` (session 9 wrap). CI green. Pushed.
- **v1-foundation:** CLOSED (milestone 1, epic #3, sub-issues #7–#13).
- **v1-reader Plan 2:** Written and committed at `docs/superpowers/plans/v1-reader/`. NOT yet executed.
- **v1-reader milestone + epic:** NOT yet created on GitHub. Create at session 10 start.
- **`src/lib/content/`:** 5 modules — parse.ts, validate.ts, diff.ts, manifest.ts, baseline-config.ts (pinned to `ecf8c0e`).
- **`src/content/{en,et}/`:** 16 chapter pairs, 731 paragraphs. EN ch01–ch04 real translations; ch05–ch16 ET-verbatim placeholders.
- **`src/components/`:** empty (`.gitkeep` only). Plan 2 populates it.
- **Team state:** `~/.claude/teams/bigbook-dev/` exists from session 7. Agents stayed cold sessions 8–9.

## Open Deferrals

- Real auth ADR at `docs/decisions/0001-auth.md` (deferred session 2)
- `npm audit` moderate advisories (11+ from Astro scaffold + deps)
- Node 20 → 24 GH Actions migration (June 2026 deadline)
- P4.7 `main()` orchestrator exercise (deferred to v3's PDF bootstrap)
- ch05–ch16 ET-verbatim placeholders (v3 fixes via PDF extraction)

## Reference Files (extracted from earlier session narratives)

- `ref-auth-infra.md` — GitHub App name/ID, Worker URL, token lifecycle, constraints
- `ref-xp-process.md` — XP triple process rules (pipeline serialization, hold-then-refactor, coverage gates, v8 gotcha, pre-dispatch refresh, git hygiene)
- `ref-build-gotchas.md` — ESLint, size-limit, Prettier, Git/Windows, Astro 5 strict TS, Node/CI gotchas

## Next Session Entry Point

**Session 10: Execute v1-reader Phase 0 (fetch.ts) via XP triple.**

1. Run `bigbook-startup` skill.
2. Verify: HEAD `4ae6afb`, CI green, 4 session-9 commits pushed.
3. **Create GitHub milestone + epic + sub-issues** for v1-reader (pattern from session 3: milestone "v1-reader", epic with task-list body linking sub-issues per phase).
4. Read `docs/superpowers/plans/v1-reader/p0-fetch.md` — 5 TDD tasks.
5. Team-reuse: back up inboxes → delete team → `TeamCreate` → restore inboxes.
6. Spawn Montano / Granjon / Ortelius with roster prompts.
7. Assign P0.1 to Montano as TEST_SPEC. Drive per wait-for-CYCLE_COMPLETE rule.

(*BB:Plantin*)
