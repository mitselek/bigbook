# Montano -- Scratchpad
Summary header (rewritten 2026-09-19, memory-adoption seam, no product work)
- Role: RED in bigbook-dev XP pipeline (Plantin→Montano→Granjon→Ortelius).
- Scope: may write tests/, vitest.config.ts, and this pad only.
- Repo: bigbook main branch, clean, CI green, v1.1.0 @ 296099b.
- Stack: Astro 5 + TS strict (noUncheckedIndexedAccess + exactOptionalPropertyTypes).
- Tests: 345 Vitest (43 files) + 9 Playwright. Para-id alignment is the hard invariant.
- Last work: session 17 Task 5 -- idempotency regression test 328c505 (#41 closed).
- Session 16 Task 2: compile-error RED escalated; resolved as RED+GREEN dual commit 5358898.
- Facts: memory/facts/. Montano-specific: red-test-writing-conventions.md (11 facts).
- Also see: xp-pipeline-rules.md, build-tooling-gotchas.md, content-pipeline-conventions.md.
- WIP: none. Pipeline idle, awaiting PO direction for next story.
- Backlog: memory/backlog.md (npm audit 3 critical, #38 open, auth ADR, v2 comments).
- No-mailbox: workflow agents have no SendMessage; escalations are structured return values.
- common-prompt.md Communication section still describes SendMessage; needs rewrite.

## 2026-09-19 -- Session 18: memory-adoption seam

[CHECKPOINT] 11 facts promoted to red-test-writing-conventions.md (new, this seam).
  Subjects: regression-cycle label, module-scaffold stub, derivation-check protocol,
  TEST_SPEC gate, toMatchObject, backstop detection, ! in setup, Map.get() contract,
  regression trap in impl snippets, mid-spec re-run rule, RED-verbatim-after-bug rule.
[DEFERRED] Add @typescript-eslint/no-non-null-assertion with test-file override.
  Plantin noted 2026-04-18 as post-extraction cleanup. No issue filed yet.
[DEFERRED] Rewrite common-prompt.md Communication section for no-mailbox workflow shape.
  Backlog item f (Plantin 2026-09-19). No Montano action until next XP story dispatch.

(*BB:Montano*)

## 2026-09-19 13:37 -- Session 18 run 2: tier B constructor fix

[CHECKPOINT] 2026-09-19 13:37 RED-fix: make IntersectionObserver stub constructable (Vitest 4)
  Changed vi.fn((cb)=>{}) to vi.fn(function(this:unknown,cb){}) for Vitest 4 compat.
  Only one file needed fixing; all other vi.stubGlobal calls stub fetch (not constructed).
  All gates pass: 345 tests, typecheck 0, lint 0, format:check 0.

(*BB:Montano*)

## 2026-09-19 14:05 -- Session 18 run 3: coverage gap tests

[CHECKPOINT] 2026-09-19 14:05 RED-cover: createFocusObserver + preload rootMargin tests
  Added 6 tests: 4 in describe(createFocusObserver), 2 in describe(createPreloadObserver).
  All 351 tests pass; scroll-anchor.ts 100% branches; global branches 92.28% (>85%).
  Used toMatchObject on mock.calls array to avoid noUncheckedIndexedAccess issues.
  typecheck 0, lint 0, format:check 0. Gates all pass.

(*BB:Montano*)
