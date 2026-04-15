# Granjon — Scratchpad

## 2026-04-15 — Session 5, v1-foundation Phase 1 parse module

[LEARNED] The `noUncheckedIndexedAccess` coverage trap: `match[N] ?? fallback` guards that exist solely to satisfy TypeScript's strict indexing flag are counted as uncovered branches by v8's coverage provider, even when the surrounding regex guarantees the capture group is defined at runtime. Four of these in `parse.ts` dragged branch coverage to 81.48% (threshold: 85%). Resolution: `/* v8 ignore next */` on the line immediately above each unreachable branch. Preserves runtime defense-in-depth; removes only the coverage footprint. Do NOT annotate branches that are genuinely reachable (e.g., `if (!m) continue` on blank frontmatter lines — that one was left unannotated and is correctly counted uncovered).

[GOTCHA] The four patterns that trigger the v8 branch-coverage trap in this codebase:
  1. `match[N] ?? fallback` after a regex `.match()` call
  2. `m[1]` / `m[2]` destructuring after another regex match (use named variables + undefined guards)
  3. `directive[N] ?? null` after a DIRECTIVE_RE match
  4. `if (key === undefined || val === undefined)` after regex group destructuring
  For `validate.ts` and `diff.ts` in P2/P3, consider these alternatives from the start to avoid the ignore-annotation dance: (a) string slicing (`content.slice(start, end)` returns `string`, never `undefined`), (b) typed narrowing helpers that throw on undefined, (c) named capture groups with explicit narrowing.

[DECISION] For P1.1–P1.7, the minimum-viable approach was followed correctly: write the exact code the current test needs, no more. The P1.1 scaffold (full type exports upfront) was accepted by Ortelius as "thin bones" justified by the module contract. The same judgement applies for future parse-adjacent modules — export the full type surface when the plan document lists them as module exports, but do not add helpers or utilities that no test yet demands.

[GOTCHA] Multi-step instructions from Plantin (edit → verify → commit → handoff) must be worked through in a single turn, not read and idled on. If a step is blocked or unclear, SendMessage Plantin immediately rather than going silent.

[GOTCHA] `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` are active in `tsconfig.json`. No `any`, no `!` non-null assertions, no `@ts-ignore`. The `??` fallback pattern is the approved workaround for regex groups, with `/* v8 ignore next */` to neutralise the coverage cost. `@ts-expect-error` is allowed only with an explanatory comment.

## 2026-04-15 — Session 6, v1-foundation Phase 2 + Phase 3

[LEARNED] **CRLF trap is now closed by `.gitattributes` (commit `40bcc1f`).** Ortelius tripped on it during P2.3 PURPLE: a `git stash pop` on Windows with `core.autocrlf=true` silently rewrote `validate.ts` to CRLF, causing Prettier's `endOfLine: "lf"` check to fail in lefthook. Plantin landed a `.gitattributes` enforcing `eol=lf` for all text extensions that Prettier touches. If this symptom ever reappears (prettier hook blocked with a CRLF complaint), the fix is `git add --renormalize .` — the root cause is a tracked file that hasn't been renormalized since `.gitattributes` was added. Do not hunt for a Prettier config issue — the config is correct.

[LEARNED] **Plan pre-implementation is legitimate when the plan spec calls for it.** In P2.3, the plan told me to land the full `validateProposedContent` body — including the reference-id mismatch loops — even though P2.4's regression tests hadn't been written yet. This produced a mid-phase coverage dip (~88% branch) that Ortelius noted but correctly did not flag as a process violation. The principle: **coverage thresholds gate at phase exit, not mid-phase**. Do not over-tune a GREEN commit to hit coverage ahead of tests that the plan's decomposition places in a later AC. If the plan is honest about when tests land, the coverage will close at phase exit. This applies to P4 (bootstrap script): if the plan says to implement a helper now and test it in a later AC, implement it now.

[LEARNED] **Single-turn discipline held cleanly in session 6.** The session-5 self-pace lesson (multi-step instructions must be completed in one turn without idling after reading) produced no near-misses this session. Every GREEN handoff executed the full sequence — implement → run tests → run quality gates → commit → send handoff — in a single turn. No idle-after-read incidents. Lesson fully internalized.

[RECORD] **Clean GREEN record for session 6.** Seven ACs across Phase 2 (P2.1–P2.4) and Phase 3 (P3.1–P3.3): zero PURPLE rejections, zero three-strike escalations. Only one PURPLE commit this session was Ortelius's `e329678` (extracting `collectMissing`/`toResult` helpers post-P2.3) — structural refactoring on working GREEN code, not a rejection. No-op GREEN cycles (P2.2, P2.4, P3.2, P3.3) were all correctly identified: implementation from the prior AC already handled the regression tests. Baseline for P4: if Phase 4's bootstrap script character produces PURPLE rejections, compare against this clean baseline to judge whether the issue is GREEN quality or plan decomposition.

(*BB:Granjon*)
