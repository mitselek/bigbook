# Granjon — GREEN (bigbook-dev, 2026-09-19)
Role: GREEN in XP pipeline; writes minimum src/ code to pass Montano's RED tests.
State: Memory-adoption seam done 2026-09-19. No product work in progress.
Facts: memory/facts/ — 8 files (added green-implementation-conventions.md, 2026-09-19).
Pipeline: Plantin → Montano (RED) → Granjon (GREEN) → Ortelius (PURPLE).
Key invariant: para-id alignment survives every edit (ch01-p007 form, 2033 pairs).
Auth: PKCE via GitHub App + Worker proxy; access token in-memory 8h, refresh in localStorage.
Stack: Astro 5 static, TypeScript strict, Vitest; no any/!/ts-ignore.
Last work: Task 17 batch (7 REDs, ~40 LoC), session 13, 2026-04-18. Idle since.
Workflow: runs as workflow agent (no mailbox); return value IS the report to Plantin.
Common-prompt: .claude/teams/bigbook-dev/common-prompt.md
Layers: src/lib/ > src/components/ > src/pages/ (inner layers never import outer).
Off-limits: legacy/, src/content/, tests/ (Montano-owned).
Tmp: .tmp/ (not /tmp/, not .claude/); gh snap-confined on Linux host.
Backlog: memory/backlog.md; key f/u: common-prompt.md rewrite for workflow agents.

[CHECKPOINT] 2026-09-19 — Memory-adoption seam. 10 facts promoted: 4 new in
green-implementation-conventions.md, 2 appended to xp-pipeline-rules.md, 4 appended
to build-tooling-gotchas.md. Scratchpad rewritten from 68 rows to under cap.

[CHECKPOINT] 2026-09-19 13:23 — Epic #42 tier A (#43). prettier --write eslint.config.js;
npm audit fix resolved marked->18.0.13, svelte->5.57.1 + other transitives. All 7 gates 0.
extract-zip still advisory (fix says no-force but npm reports "up to date" on 2nd run).
Remaining 18 vulns are all Tier B/C (astro, vitest, esbuild, sharp, etc.) — Tier B next.

[CHECKPOINT] 2026-09-19 13:31 — Epic #42 tier B (#44) ESCALATION. Vitest 4.1.11
breaks 5 tests in scroll-anchor.test.ts: vi.fn() arrow impl is not a constructor
under Vitest 4. Reverted, npm ci restored. No commit. Returned escalation to Plantin.

[CHECKPOINT] 2026-09-19 13:56 — Epic #42 tier B (#44) run 2 ESCALATION. All pkgs
installed: vitest@4.1.11, coverage-v8@4.1.11, size-limit@14.0.0, sdk@0.127.0.
coverage.all removed from vitest.config.ts; added src/lib/auth/** + reader/idb.ts
to coverage.exclude. 6/7 gates pass (typecheck, lint, format, test 345, build,
size). FAIL: branches 84.46% < 85%. Root: Vitest 4 V8 counts ?? as 2 branches;
createFocusObserver (lines 53-54) has 2 uncovered branches. Vitest 2 did not count
?? branches → same code was 85.11% (223/262). Fix: Montano adds test calling
createFocusObserver or createPreloadObserver(cb, margin) for ?? coverage. Reverted.

[GOTCHA] 2026-09-19 — coverage.all removal in Vitest 4: must also add explicit
excludes for src/lib/auth/** and src/lib/reader/idb.ts (were implicitly excluded
by all:false in Vitest 2). Without this, auth files drag coverage below thresholds.

(*BB:Granjon*)
