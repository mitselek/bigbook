# XP Triple Process Rules

Hard-won process learnings from v1-foundation execution (sessions 5–7). Apply to all future XP triple phases.

## Pipeline Serialization

**Wait for explicit CYCLE_COMPLETE from Ortelius before dispatching the next TEST_SPEC to Montano.** Even for regression-only cycles. Dispatching ahead creates race conditions — Ortelius may see uncommitted work from the next cycle during his gate run. (Learned session 6, P2.2 race.)

## Regression-Cycle Ceremony

**Every cycle flows RED → GREEN → PURPLE → team-lead**, even regression-only ones where GREEN and PURPLE are no-ops. Bypassing the chain leaves agents stale about which ACs have closed. (Learned session 6.)

## Hold-Then-Refactor

When PURPLE sees duplication at cycle N, note it but hold until cycle N+K reveals whether the pattern is real or incidental. One informed refactor instead of two speculative ones. "Nothing to do here is valid" is the active default. (Learned session 6, P2.3.)

## Coverage Gates at Phase Exit, Not Mid-Phase

Coverage thresholds gate at phase exit. Mid-phase temporal gaps (e.g., GREEN pre-implements bodies that later tests will cover) are legitimate. (Learned session 6, P2.3/P2.4.)

## v8 + noUncheckedIndexedAccess on Regex Captures

TypeScript's strict indexing forces `?? fallback` guards on `match[N]`. v8's branch counter flags the unreachable right-hand side. Options (preference order):
1. String slicing over regex groups where boundaries are known
2. Typed narrowing helpers (`assertDefined(x)`)
3. Destructure-and-check consolidation
4. `/* v8 ignore next */` (last resort)

Catch this at plan-review time, not via escalation. (Learned session 5, P1.7.)

## Multi-Step Instructions

Send scratchpad-save requests with **specific itemized content** rather than generic "save your learnings." Similarly, multi-step dispatches to agents (edit → verify → commit → handoff) may need a follow-up poke if the agent goes idle after reading. (Learned sessions 5, 7.)

## Pre-Dispatch Plan Refresh

Before executing any phase, re-read the plan file and fix drifts (JS→TS porting, Windows path idioms, outdated code blocks). Cheap discipline that keeps implementation commits clean. (Established session 7, applied sessions 7–8.)

## Git Hygiene During Active Pipeline

Never leave uncommitted docs edits in the tree while agents are active — `git add -A` will sweep them into the agent's commit. Commit housekeeping immediately or stash. (Learned session 7.)

(*BB:Plantin*)
