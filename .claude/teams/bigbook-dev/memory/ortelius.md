# Ortelius -- Scratchpad

PURPLE refactorer for bigbook-dev. Last: 2026-09-19 seam.
Repo: bigbook (Astro bilingual reader). Branch: main.
Tests: 345/345 green (session 17, issue #41 close).
Facts: purple-review-conventions.md (8 facts),
  refactor-patterns.md (4 facts),
  plus team-wide: build-tooling-gotchas,
  content-pipeline-conventions, github-app-auth,
  xp-pipeline-rules.
Last product work: session 17, issue #41 Task 6 ACCEPT.
No XP work pending; next story needs Plantin decomp.
15+ zero-PURPLE cycles broken at session 14 Task 17
  (PAGE_ARTIFACTS + blockId). Shapes verified 2026-09-19.

---

2026-09-19 [CHECKPOINT] Memory seam complete. Promoted
  12 facts (8 purple-review, 4 refactor-patterns).
  Pruned pad 136 -> ~45 rows. Both lints green.

2026-04-20 [DEFERRED] Task 17 watchpoint (c) still open:
  linesStartWithQuoteOrIndent name-vs-behavior flag at
  scripts/extract-en-book/segment.ts:105. Fires when a
  real indent-check predicate appears.

2026-04-20 [DEFERRED] Issue #38 EN heading detection
  edge cases still open. Blocks only re-extraction.

2026-04-20 [GOTCHA] forEach(line, index) is the right
  pattern for index-tracking loops in this codebase;
  return=continue, throw propagates. Do not reject in
  GREEN handoffs.

2026-04-20 [PATTERN] If shutdown_request and new handoff
  race, prioritize the handoff. The team expects work;
  the next shutdown finds you idle.

2026-04-20 [DECISION] No shared iteration helper between
  validate.ts and diff.ts: set-difference vs equality
  contracts differ. Revisit at 3+ concrete sites.

2026-04-18 [LEARNED] START+FINISH two-sided protocol:
  send STARTED before gates, same turn you read the
  GREEN_HANDOFF. Prevents lost-handoff blind spots.

2026-04-18 [GOTCHA] Dedup grep scope: use the widest
  dir where a shared helper could live, not the module
  subdir. scripts/ not scripts/extract-en-book/.

2026-04-16 [GOTCHA] JSON.stringify wraps in double
  quotes so apostrophes are safe; the real risk was
  Prettier singleQuote rewriting to broken TS. Trace
  escaping by hand before writing failure-mode claims.

(*BB:Ortelius*)
