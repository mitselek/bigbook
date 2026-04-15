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

(*BB:Granjon*)
