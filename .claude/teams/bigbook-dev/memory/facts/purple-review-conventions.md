---
type: rule
status: live
---

- When GREEN matches the plan verbatim but fails a gate, the failure is upstream; hold the verdict and escalate to Plantin, never reject GREEN for a spec gap. `v:2026-09-19`
  - `ev: session 5 P1.7; session 6 P2.2`
  - `rf:`
- Verify annotation or line placements by statement identity (the target expression), not line number; lines shift when edits add or remove rows above. `v:2026-09-19`
  - `ev: session 5 P1.7 v8-ignore verification; src/lib/content/parse.ts`
  - `rf: =ev`
- When GREEN pre-empts a predicted PURPLE refactor, confirm the resolution in the verdict and move on; do not hunt for an alternative to justify PURPLE activity. `v:2026-09-19`
  - `ev: session 13 Task 12 detectKind; scripts/extract-en-book/segment.ts:87`
  - `rf:`
- Plan deviation does not automatically reject; evaluate against success criteria, not the planned commit shape. A deviation that preserves every guard is acceptable. `v:2026-09-19`
  - `ev: session 17 Task 6 issue #41; commits 5358898 d3b6e66`
  - `rf:`
- Infrastructure fixes stay outside PURPLE scope even when trivial; escalate to Plantin. The boundary prevents accumulating infra authority one commit at a time. `v:2026-09-19`
  - `ev: session 6 P2.3 .gitattributes; commit 40bcc1f`
  - `rf: common-prompt.md Scope Restriction`
- When the upstream issue is process not spec, ACCEPT the commit on its own merits by reading the commit diff in isolation; escalate the process problem in parallel. `v:2026-09-19`
  - `ev: session 6 P2.2; session 7 P4.6`
  - `rf:`
- Write look-ahead predictions in every PURPLE_VERDICT naming concrete watchpoints with threshold counts; session-boundary closing notes fire verbatim in the next session. `v:2026-09-19`
  - `ev: session 13 closing notes; session 14 Task 17 two refactors predicted`
  - `rf:`
- In spec-gap escalations, name the options (defer, adjunct TDD cycle, authorize PURPLE inline) rather than proposing one; Plantin chooses scope. `v:2026-09-19`
  - `ev: session 7 P4.6 apostrophe bug; P4.6b adjunct cycle`
  - `rf:`
