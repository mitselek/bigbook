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

## 2026-04-17 — Session 10, v1-reader Plan 2 (P3 + P4)

[COMPLETED] All RED tasks for P3 (Paragraph rendering, issue #17) and P4 (TOC overlay, issue #18) committed this session.

P3 commits:
- P3.3 RED: `e0f8fca` — marginalia rendering (Marginalia.svelte stub created)
- P3.4 RED: `a91ad30` — accessibility pairing (aria-labelledby, id attrs)
- P3.5 RED: `c18c491` — Marginalia label and baseline text (regression, new test file)
- P3.6 RED: `83e4aff` — expand/collapse + lazy metadata (fetch mock pattern)

P4 commits:
- P4.1 RED: `eb39e74` — TocOverlay grouped rendering (TocOverlay.svelte stub created)
- P4.2 RED: `a6e4f78` — click select and dismiss
- P4.3 RED: `ac444f9` — keyboard navigation (ArrowDown/Enter/Escape)
- P4.4 RED: `182fa34` — focus trap and auto-focus (final P4 task)

[LEARNED] Svelte 5 component tests with @testing-library/svelte require `resolve: { conditions: ['browser'] }` in vitest.config.ts (routes to client build, not SSR). Already applied from P3.1 — do not remove.

[LEARNED] `vi.stubGlobal` / `vi.restoreAllMocks()` in beforeEach/afterEach is the correct cleanup pattern for fetch mocks across expand/collapse tests in the same describe block. Used in P3.6.

[LEARNED] `role="option"` on entries and `role="dialog"` on the overlay container are the expected ARIA patterns for TocOverlay. Tests query by these roles; GREEN must implement them. `data-focused="true"` on the focused entry is the mechanism for keyboard nav state in tests.

[CONTEXT] All P3 and P4 GREEN/PURPLE handoffs were sent to Granjon. Pipeline state at shutdown: P4.4 cycle in progress (182fa34 RED sent to Granjon). Plantin to run phase-exit gate after P4.4 CYCLE_COMPLETE.

(*BB:Montano*)

## 2026-04-18 — Session 13, v1-extract Task 2 (EN book extraction, kebabCase)

[DECISION] **TEST_SPEC is the go signal, not `task_assignment`.** On Task 2 a `task_assignment` notification fired ~25 min before Plantin's TEST_SPEC. I proceeded from the task_assignment and shipped RED (commit `6081f44`) before the spec arrived — two of the five ACs then came back as deviations. Plantin accepted both deviations and fixed the process: from now on, wait for an explicit TEST_SPEC message before starting. TaskUpdate assignments alone are not authorization.

[PATTERN] **Module-scaffold cycle endorsed for this plan too.** Plantin accepted the stub-in-same-RED-commit approach over "let the test commit fail tsc" — the pattern stays. Plantin's own TEST_SPEC wording going forward will be "meaningful failure pointing at missing behavior" rather than prescribing "Cannot find module"; mechanism is my call.

[PATTERN] **RED commit subject convention for extract plan:** `test(extract): Task N RED — <short description>`. Plantin's original TEST_SPEC proposed `test(extract): failing tests for kebabCase slug helper`; Plantin then adopted my format as the convention. Use `Task N RED —` prefix across Tasks 2, 3, 4, ... (matches earlier sessions' `PX.Y RED` style, just different numbering scheme for this plan).

[CONTEXT] Task 2 RED commit `6081f44` — 6 failing `it()` blocks in `tests/scripts/extract-en-book/slug.test.ts`, stub at `scripts/extract-en-book/slug.ts`. Granjon began GREEN immediately on the handoff; Plantin instructed: do not amend the RED commit. Next expected TEST_SPEC: Task 3 (section-id mapping) after Ortelius's CYCLE_COMPLETE lands.

(*BB:Montano*)

## 2026-04-18 — Session 13, derivation-check discipline (3-for-3 on extract plan)

[PATTERN] **Run the mechanical-derivation check pre-RED, every time — not just when the tests look fishy.** For a hand-written plan, the Step-3 impl snippets carry bugs that won't surface from the test list alone. Walk each test expectation through the plan's impl verbatim *before* writing. If the impl can't satisfy the expectation, flag Plantin pre-RED with a concrete scenario (specific input → what the plan's impl produces → what the test requires). Three catches this session:

- **Task 9** (paragraph rejoin across page breaks): Plan's "collapse consecutive blanks" couldn't satisfy test 1 — after stripping artifacts only one blank remained between halves. Plan fix `4c5ea19` (two-pass: also strip blanks adjacent to stripped lines).
- **Task 11** (heading detection): Plan used strict `===` match, but PDF heading 'FOREWORD TO FOURTH EDITION' is a superset of outline title 'Foreword to Fourth'. Plan fix `ac5858f` (`===` → `.startsWith(normalizedTitle)`).
- **Task 12** (block-kind detection): Plan Step 3's replacement loop reverted the `.startsWith` fix back to `===` — would regress Task 11 GREEN. Tests themselves derived fine; flagged anyway as an impl-level regression trap. Plan fix `80614f2` (preserve `.startsWith` in the new loop).

[LEARNED] **Regression traps count too.** Task 12's tests all derived cleanly against the plan snippet in isolation — but the snippet, if Granjon copied it verbatim, would undo a prior-task fix. Flag these proactively even when the current task's RED would pass, because Granjon works from the plan snippet, not git history. Plantin's endorsement: "three-for-three on derivation catches. This is exactly the value the RED role is supposed to provide when the plan is hand-written."

[DECISION] **When a derivation bug is found, still write RED verbatim per the original TEST_SPEC** (unless Plantin says otherwise). The plan gets fixed upstream; the tests are already correct. Don't rewrite tests around the bug. All three catches this session followed this flow: flag → Plantin pushes plan fix → I ship RED verbatim → handoff message to Granjon references the plan-fix commit(s) so GREEN reads the corrected Step 3.

(*BB:Montano*)

## 2026-04-18 — Session 13, `!` non-null-assertion convention (clarified)

[DECISION] **Non-null assertion (`!`) policy — per Plantin 2026-04-18.** The ban is review-enforced, not lint-enforced (eslint has no `no-non-null-assertion` rule configured). Two zones, different rules:

- **Production code** (`src/**`, `scripts/**/*.ts` non-test): **no `!` allowed.** Zero exceptions. Originates here for type-hygiene reasons — avoid load-bearing runtime assumptions in non-test code. If a derivation check catches a plan snippet that would require `!`, flag and get it rewritten (Task 15 `pickN` pattern: index-map → `filter` = naturally typed, zero `!`).
- **Test code** (`tests/**/*.test.ts`): **`!` acceptable in *setup* positions** where a helper-function invariant or just-constructed local guarantees the shape. Example: `doc.sections[0]!.blocks[0]!.text = '   '` inside a test that called `sampleDoc()` one line earlier. **Not acceptable in *expect* positions** — use `toMatchObject` or optional-chained access (`?.text`) there. Task 14 RED uses this pattern and was accepted on review.

[PATTERN] **When stepping around `!` in impl code.** Prefer transformations that are naturally typed:
- `arr.filter((_, i) => indices.has(i))` over `[...indices].map((i) => arr[i]!)` — same semantics, no `!`.
- Early-return guards / narrowing helpers over inline `!` when the invariant is expressible.
- For test setup, small local `firstSection(doc)` helpers are cleaner than a chain of `!`s — but inline `!` is acceptable when the chain is short.

[DEFERRED] Adding `@typescript-eslint/no-non-null-assertion` with test-file override is a good post-extraction cleanup task — Plantin noted it.

[CONTEXT] Task 16 is not an RED cycle — it's "run the extraction, inspect, commit artifacts." Plantin + Granjon direct; I stand down after Task 15 PURPLE. Task 17 comes back to RED-driven: each proofread finding from the sample review = fresh TEST_SPEC → failing fixture-test → Granjon fix. Iterative, one cycle per parser bug.

(*BB:Montano*)

## 2026-04-18 — Session 13, Task 17 batch RED (7 parser fixes, shipped)

[WIP] **Task 17 batch RED shipped at `099a8de`** on branch `feat/en-book-extraction`. 7 failing tests + 1 green regression guard across `tests/scripts/extract-en-book/normalize.test.ts` and `tests/scripts/extract-en-book/segment.test.ts`. Pipeline at shutdown: Granjon should be working on GREEN; Ortelius queued for PURPLE. After CYCLE_COMPLETE, next Montano work is either (a) another Task 17 batch if PO finds more proofread issues, or (b) stand down for Task 18 phase-exit gate. Earlier same session: hotfix RED for `extractPages` maxBuffer shipped at `c31515a` (amended from `eb8c818`), Granjon's GREEN at `f55f7cd`, then Task 16 extraction artifact at `02a42eb`.

[LEARNED] **"Backstop test" in a TEST_SPEC may mean green-from-start, not RED.** Plantin's initial Task 17 spec listed S1 (chapter-title bleed) alongside 6 other "RED" tests with a phase-gate of "all 7 tests fail". Derivation check showed S1's fixture (`'Chapter 4\n\nIn the preceding chapters...'` with `\n\n` already present) already produces the expected 2 blocks against current impl — it was a regression guard for the N1/N2 upstream reshape, not a RED. Flagged pre-RED; Plantin reframed as "6 RED + 1 green-regression guard" and added N4 to the batch. Rule: when a spec uses words like "backstop" or "regression" for a test but calls it RED, derive the fixture before writing — the fixture often reveals it's already satisfied.

[PATTERN] **Derivation catches from Task 17 (four-for-four now):**
- **S1** (initial spec): fixture already green; reframed as regression guard.
- **N4** (added mid-spec by Plantin after corpus re-inspection triggered by S1 discussion): the blanket `line.trim().toUpperCase() === sectionTitleUpper` strip rule in `normalize.ts` was eating legitimate first-occurrence headings across stories/chapters. Fix: remove the rule entirely. Running titles in Big Book are always paired with page numbers, so `PAGE_AND_TITLE` + new `TITLE_AND_PAGE` (N3) cover the actual stripping cases.
- **S2 tail-kind trap** (impl-level constraint flagged pre-RED): `detectKind`'s list-item regex `/^(\d+\.|[a-z]\.|\([a-z0-9]+\))\s/i` matches `'(3) Despite...'` because `[a-z0-9]` with `/i` flag covers digits. If Granjon's S2 split delegates tail classification to `detectKind`, the tail comes back `'list-item'` and the test (which asserts `paragraph`) fails. Recommended option (i): set tail `kind='paragraph'` directly in the split path, bypassing `detectKind`.
- **N3 false-positive check** (no action needed): verified `TITLE_AND_PAGE` regex `^\s*[A-Z][A-Z .'\u2019-]+\s+\d{1,3}\s*$` won't match common false-positive lines (4-digit years like `1950`, `'IN 500 B.C.'` with internal non-letter chars). Flagged in handoff for Granjon's awareness.

[DECISION] **When Plantin adds a new fix mid-spec (N4 here), re-run derivation check on the whole batch.** Don't assume earlier clean cases stay clean after a new sibling rule lands. N4's removal of the title-strip rule potentially affected existing tests using `sectionTitle: 'A Vision For You'` etc — verified all existing tests don't have a matching standalone-title line (they rely on `PAGE_AND_TITLE` patterns). Clean bill reported in the GREEN handoff.

[CONTEXT] Handoff message to Granjon covered: file-by-file change map (4 normalize + 3 segment), S2 tail-kind constraint with option (i) recommendation, ordering note (normalize before segment, N1/N2 upstream enables S1 regression guard to stay green), warning about N1 application order (apply *after* strip pass, not before, to avoid tripping on already-stripped running-title lines), and `!` policy reminder. Verification command: `npx vitest run tests/scripts/extract-en-book/normalize.test.ts tests/scripts/extract-en-book/segment.test.ts` → target 26 passed / 0 failed after GREEN.

(*BB:Montano*)
