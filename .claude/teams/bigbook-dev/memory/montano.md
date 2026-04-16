# Montano — Scratchpad

## 2026-04-15 — Session 5, v1-foundation Phase 1 parse module

[LEARNED] The regression-test pattern (used in P1.3/P1.4/P1.5): when Plantin's TEST_SPEC explicitly says "regression test — passes on first run", the commit subject drops the "RED" label (e.g. `test(parse): P1.3 — multi-paragraph order preservation`, not `test(parse): P1.3 RED — ...`). The GREEN handoff in these cycles is a no-op verification; Granjon just confirms vitest passes and forwards to Ortelius with "no src/ change needed" in impl notes. The distinction matters for message framing — don't frame a regression handoff as a blocking RED.

[GOTCHA] When `noUncheckedIndexedAccess` forces defensive `?? fallback` or `=== undefined` guards on regex capture groups (e.g. `match[1] ?? ''`, `directive[1] ?? null`), v8's branch counter treats the `??` right-hand side as a branch that no test input can ever exercise — the regex guarantees the group is defined on match. These show up as uncovered branches in `npm run test:coverage` even though 100% of exercisable paths are covered. Resolution is `/* v8 ignore next */` annotations on the dead lines (Option 3), which is a `src/` change — escalate to Plantin, do not add tests for unreachable paths. For context: P1.7's adjunct cycle ended at 81.48% branches (vs 85% threshold) due to four such dead branches in `parse.ts`; Granjon annotated them in `717064b`.

[DECISION] Of five branches originally flagged in the P1.7 escalation, four were genuinely unreachable. One (`if (!m) continue` at line 48 in `parseFrontmatter`) was reachable — blank lines in a frontmatter block don't match `/^(\w+):\s*(.*)$/`, so `!m` fires. The existing tests already exercised this path; it showed as covered. Self-correction: be more careful when auditing "unreachable" branches — check whether blank/empty string inputs can trigger the no-match arm.

[CONTEXT] Map insertion order is load-bearing for the Hard Invariant. P1.3's regression test (`[...result.paragraphs.keys()].toEqual([...])`) exists specifically because downstream pairing and diff operations in Phase 2 and beyond assume `paragraphs` iteration order equals directive order. JavaScript `Map` preserves insertion order by spec, but the test makes it machine-checked. Do not remove or weaken this test in any future refactor.

[PHASE 2 PREP] Phase 2 is `validate.ts` — the Hard Invariant checker. It takes two `ParsedChapter` objects (EN + ET) and verifies every `para-id` in EN has exactly one counterpart in ET and vice versa. Tests will live in `tests/lib/content/validate.test.ts`. The pattern will be TDD with real failing tests (not regression-only). Expect Plantin to dispatch the first TEST_SPEC for validate at the start of session 6.

(*BB:Montano*)

## 2026-04-15 — Session 6, v1-foundation Phase 2 + Phase 3

[PIPELINE SERIALIZATION] Every cycle — even regression-only ones — must flow RED → GREEN (no-op) → PURPLE (no-op) → back to team-lead. Do NOT report directly to Plantin after a regression commit. Granjon and Ortelius need the handoff chain to know which ACs have closed; bypassing it leaves them stale. The P2.2 mistake: sent the regression commit + "standing by for P2.3" directly to team-lead without notifying Granjon or Ortelius. Plantin corrected mid-turn. Fixed retroactively by sending a no-op DM to Granjon. From P2.4 onward the full chain was followed correctly.

[REGRESSION CYCLE PROCEDURE]
1. Add test(s) inside the existing `describe` block — verbatim from the plan's Step 1.
2. Run `npx vitest run` — confirm all pass on first run.
3. Commit with subject that has **no RED label**: e.g. `test(validate): lock in missing_pair, extra_pair, and both`. Use the plan's exact Step 3 commit body. Include `Part of #3` + `(*BB:Montano*)`.
4. Send Granjon a message: "regression-only cycle, no-op GREEN. All N tests pass. No src/ change needed. Please confirm tests pass and forward no-op GREEN_HANDOFF to Ortelius."
5. Wait for Ortelius CYCLE_COMPLETE before accepting next TEST_SPEC (no compressed pipelines).

This procedure was applied cleanly for P2.2 (after correction), P2.4, P3.2, P3.3.

[MODULE-SCAFFOLD CYCLE PATTERN] Used three times this session: P2.1 (`validate.ts` new module, commit `800a4c1`), P2.3 (`validateProposedContent` new export on existing `validate.ts`, commit `90348f4`), P3.1 (`diff.ts` new module, commit `55b215f`). Pattern: when a test imports a not-yet-existing export, land a minimum type-stub in `src/lib/content/` in the **same RED commit** so tsc resolves the import and ESLint/prettier hooks pass. Stub signature must match exactly what the test imports. Body: `void param1 / void param2 / throw new Error('not implemented')` (the `void` silences the `@typescript-eslint/no-unused-vars` rule; underscore prefixing does not reliably work with this rule). This is an authorized cross-role scaffold touch — precedent `20d5e12` from P1.1. Granjon replaces the body in GREEN.

[STRICT INDEXING ON TEST ASSERTIONS] `result.errors[0].category` is a TS18048 error under `noUncheckedIndexedAccess` because array indexing returns `T | undefined`. Resolution used throughout P2: use `toMatchObject` on the array element instead of accessing `.category` directly:
```ts
expect(result.errors[0]).toMatchObject({ category: 'missing_pair', paraId: 'ch05-p002' })
```
This avoids the type error because `toMatchObject` accepts `unknown`. Alternative: add `expect(result.errors[0]).toBeDefined()` as a guard before the direct property access. `toMatchObject` is preferred — it's also more expressive and catches both property values in one assertion.

[MAP_GET_TYPE] `Map.get()` always returns `T | undefined` regardless of `noUncheckedIndexedAccess`. That flag only affects array/tuple `[]` indexing. When tests work with `ParsedChapter.paragraphs.get(id)`, the `| undefined` is genuine contract behavior — the `baselineText === undefined` branch in `diff.ts` is a real exercisable path (tested in P3.3's "ignores para-ids present only in current" case), not a v8-ignorable dead branch like the regex capture group `??` branches from P1.7.

[PHASE 4 PREP] Phase 4 is the bootstrap script (`scripts/bootstrap-mock-content.mjs`). It scrapes legacy ET markdown, calls Claude API for EN translation, emits `src/content/{et,en}/*.md` files and `manifest.ts` / `baseline-config.ts`. Tests live in `tests/scripts/`. XP triple applies to the pure helpers; the orchestrator `main()` is run once in P6 and is not unit-tested.

(*BB:Montano*)

## 2026-04-16 — Session 7, v1-foundation Phase 4 (bootstrap script)

[LEARNED] The module-scaffold cycle pattern (stubs in the same RED commit so tsc passes) applies equally to `scripts/` targets as to `src/lib/content/` targets. For `scripts/bootstrap-mock-content.ts`, stub parameters must use underscore prefix (`_estonianText`, `_client`) rather than `void param` because the script context doesn't have the same `no-unused-vars` rule behavior as src/ — both work in practice, but underscore prefix is cleaner for script stubs.

[LEARNED] The plan's verbatim test code sometimes uses untyped `const calls = []` or direct array index access (`result[0].id`) that is not tsc-clean under `noUncheckedIndexedAccess`. Correct deviations preemptively: type the array (`const calls: string[] = []`), use optional chaining (`result[0]?.id`), and annotate callback params (`prompt: string`). These are spec-conformant substitutions — same assertion behavior, zero tsc errors. Document each deviation in the GREEN_HANDOFF note.

[DEFERRED] P5 (pre-commit hooks: `legacy-guard` restored, `content-guard` new, `hard-invariant` new) and P6 (bootstrap run + content commit + baseline SHA commit) are both Plantin-inline. The XP triple scope for v1-foundation is fully complete.

[WARNING] `emitManifest` in the plan's Step 2 sketch uses unescaped template interpolation for title strings — latent bug for titles with `'` or `\` (e.g. "Bill's Story"). The P4.6b adjunct cycle closed it via a `tsStringLit` helper. If future generated TypeScript emitters appear in this codebase, apply the same escape pattern preemptively rather than waiting for Ortelius to flag it.

[UNADDRESSED] None.

(*BB:Montano*)
