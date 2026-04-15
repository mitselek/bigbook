# Montano — Scratchpad

## 2026-04-15 — Session 5, v1-foundation Phase 1 parse module

[LEARNED] The regression-test pattern (used in P1.3/P1.4/P1.5): when Plantin's TEST_SPEC explicitly says "regression test — passes on first run", the commit subject drops the "RED" label (e.g. `test(parse): P1.3 — multi-paragraph order preservation`, not `test(parse): P1.3 RED — ...`). The GREEN handoff in these cycles is a no-op verification; Granjon just confirms vitest passes and forwards to Ortelius with "no src/ change needed" in impl notes. The distinction matters for message framing — don't frame a regression handoff as a blocking RED.

[GOTCHA] When `noUncheckedIndexedAccess` forces defensive `?? fallback` or `=== undefined` guards on regex capture groups (e.g. `match[1] ?? ''`, `directive[1] ?? null`), v8's branch counter treats the `??` right-hand side as a branch that no test input can ever exercise — the regex guarantees the group is defined on match. These show up as uncovered branches in `npm run test:coverage` even though 100% of exercisable paths are covered. Resolution is `/* v8 ignore next */` annotations on the dead lines (Option 3), which is a `src/` change — escalate to Plantin, do not add tests for unreachable paths. For context: P1.7's adjunct cycle ended at 81.48% branches (vs 85% threshold) due to four such dead branches in `parse.ts`; Granjon annotated them in `717064b`.

[DECISION] Of five branches originally flagged in the P1.7 escalation, four were genuinely unreachable. One (`if (!m) continue` at line 48 in `parseFrontmatter`) was reachable — blank lines in a frontmatter block don't match `/^(\w+):\s*(.*)$/`, so `!m` fires. The existing tests already exercised this path; it showed as covered. Self-correction: be more careful when auditing "unreachable" branches — check whether blank/empty string inputs can trigger the no-match arm.

[CONTEXT] Map insertion order is load-bearing for the Hard Invariant. P1.3's regression test (`[...result.paragraphs.keys()].toEqual([...])`) exists specifically because downstream pairing and diff operations in Phase 2 and beyond assume `paragraphs` iteration order equals directive order. JavaScript `Map` preserves insertion order by spec, but the test makes it machine-checked. Do not remove or weaken this test in any future refactor.

[PHASE 2 PREP] Phase 2 is `validate.ts` — the Hard Invariant checker. It takes two `ParsedChapter` objects (EN + ET) and verifies every `para-id` in EN has exactly one counterpart in ET and vice versa. Tests will live in `tests/lib/content/validate.test.ts`. The pattern will be TDD with real failing tests (not regression-only). Expect Plantin to dispatch the first TEST_SPEC for validate at the start of session 6.

(*BB:Montano*)
