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

## 2026-04-16 — Session 7, v1-foundation Phase 4 bootstrap helpers (P4.2–P4.6b)

[RECORD] **Clean GREEN record for session 7.** Six ACs across P4.2–P4.6 plus the P4.6b adjunct: zero PURPLE rejections, zero three-strike escalations. All five helpers (`stripJekyllPreamble`, `splitIntoParagraphs`+`assignParaIds`, `formatContentFile`, `translateWithClaude`+`buildRealClaudeClient`, `emitManifest`) plus the `tsStringLit` escape fix landed with no structural issues. HEAD `d1b86a2`, 42/42 tests green.

[LEARNED] **Plan spec and test assertions can diverge — defer to the test.** In P4.6, the plan sketch used `JSON.stringify()` for title strings (produces double-quoted output), but the test asserted single-quoted form. The test is the specification; the sketch is illustrative. When they conflict, implement to pass the test and document the discrepancy honestly in the GREEN_HANDOFF for Ortelius/Plantin to judge.

[LEARNED] **`tsStringLit` escape order matters: backslash first, then apostrophe.** Reversing the order would double-escape backslashes that the apostrophe step produces. Pattern: `s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")`. Apply this to any future code-emission helper in `scripts/`.

[LEARNED] **`npm run format:check` runs against all tracked files, not just staged ones.** Lefthook's `prettier` hook runs staged-only and is the gate that blocks commits. The `format:check` npm script is broader. Pre-existing dirt in `docs/` files (Plantin's domain) will surface there but not block GREEN commits. When `format:check` fails but the file is in `docs/`, flag it in the handoff as pre-existing and confirm via `npx prettier --check <my-file>` that my file is clean.

[GOTCHA] **Montano's RED commits may be on HEAD already — always `git log` before reading the file.** In P4.5 and P4.6, the stub was in a commit that had already landed when the handoff arrived. Checking the file directly after getting the handoff can show a stale read if the file was modified between when I last read it and when Montano's commit arrived. Always confirm with `git log` and `git show <sha>` to find the exact stub location.

## 2026-04-17 — Session 10, v1-reader Phase 0 fetch module (P0.1–P0.5)

[RECORD] **Clean GREEN record for session 10.** Five ACs across P0.1–P0.5: zero PURPLE rejections, zero three-strike escalations. HEAD `e42b890` (Ortelius refactor). 56/56 tests green, all phase-exit gates pass.

[LEARNED] **304 is `ok: false` per the Fetch API spec.** Only 200–299 responses have `ok: true`. Must check `response.status === 304` explicitly — not `!response.ok` — to detect not-modified. The 304 guard must come before `response.json()` to avoid calling json() on a body-less response.

[LEARNED] **Plain `Record<string, string>` headers, not `Headers` instance, for Vitest `objectContaining` assertions.** Tests like `expect(init.headers).toEqual(expect.objectContaining({ 'If-None-Match': '...' }))` work against plain objects but fail against `Headers` instances. Build headers as `Record<string, string>` and pass as `fetch(url, { headers })`.

[LEARNED] **Duplicated error-shape logic across functions is a reliable PURPLE refactor target.** When `fetchCurrentEt` and `fetchRawGithub` ended up with identical 3-branch error-shape logic, Ortelius extracted `httpErrorResult` + `networkErrorResult` helpers post-P0.5. Pattern: when two functions share identical error mapping, flag it explicitly in the GREEN_HANDOFF as a duplication candidate rather than pre-extracting (which is Ortelius's domain).

## 2026-04-18 — Session 13, Task 16 hotfix + Task 17 batch

[RESOLVED] Task 16-hotfix apostrophe bug closed. Plantin chose option (a): Montano amended RED in-place to `c31515a` (curly `\u2019`). My GREEN maxBuffer edit was preserved through a stash and landed as `f55f7cd`. Task 16 full run landed as `02a42eb` (Plantin bundled artifacts + `.prettierignore` fix). Task 17 batch landed as `ad71181`.

[LEARNED] **Generated markdown artifacts need `.prettierignore` coverage.** The `data/extractions/sample-review.md` generator emits long blockquote lines (one per sampled paragraph). Prettier with default `proseWrap` wants to wrap them and will block pre-commit. Any future extractor that emits markdown should: (a) add the output dir to `.prettierignore` (what Plantin did — same pattern as `legacy/`, `worker/`), OR (b) design the generator to emit already-prettier-compliant markdown (wrapped at 80 col on spaces). Option (a) is correct for artifacts; option (b) is correct for authored docs. Don't run `prettier --write` on the artifact as a band-aid — regeneration will dirty it again immediately.

[LEARNED] **`spawnSync` default `maxBuffer` is 1 MiB.** This bit us latent through Tasks 1–15 because per-section (15–20 pages) stdout stayed under 1 MiB. First full-book extraction at Task 16 surfaced it as `status: null` + empty `stderr` (child killed by SIGTERM, misleading "exit null" error surface). Fix pattern: `{ encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 }`. Apply to any new `spawnSync` wrapper touching large stdout. Also: diagnose "exit null" as buffer overflow before hunting for pdf corruption.

[LEARNED] **Protocol discipline: send STARTED on every handoff receipt, no exceptions.** In the resumed hotfix cycle (after Montano amended RED in-place to `c31515a`), I went straight from the amended-RED handoff to GREEN+FINISH without STARTED. Plantin corrected: even when the previous phase's context is still warm, STARTED is the atomic protocol step. One-liner is fine. No exceptions, even for "continuation" cycles.

[LEARNED] **When GREEN scope forbids the clean fix, reach for the scratchpad + SendMessage to team-lead, not destructive workarounds.** Task 16-hotfix RED had a test-data bug (ASCII vs curly apostrophe). GREEN role can't touch tests. Multiple SendMessages to Plantin had body-loss issues. Correct escalation: (1) write state to scratchpad with `[WIP]`, (2) ping team-lead with a pointer. PO Mihkel confirmed this is the fallback. Don't be tempted to "just fix the test" from the GREEN role.

[RECORD] **Clean GREEN record, Tasks 12–17.** Six consecutive ACs (Tasks 12, 13, 14, 15, 16 + hotfix, 17) with zero PURPLE rejections and zero three-strike escalations. Task 17 was the largest single GREEN batch of the v1-foundation + extract-en-book run (7 REDs + 1 regression guard, 2 files, ~40 LoC delta). Option (i) for the S2 tail-kind constraint ("skip detectKind, set paragraph directly") was the right call — Montano's option (ii) (tighten list-item regex) would have been broader than needed for an S2-scoped tail.

[GOTCHA] **Tmp file location is `.tmp/`, not `/tmp/` and not `.claude/`.** Project policy enforced by PO Mihkel this session: "dedicated tmp folder for our project". `/tmp/` is blocked by snap confinement on this host anyway. `.tmp/` is in `.gitignore`. Use `.tmp/commit-msg.txt` for HEREDOC-style commit messages going forward.

(*BB:Granjon*)
