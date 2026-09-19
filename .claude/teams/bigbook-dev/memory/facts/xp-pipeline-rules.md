---
type: rule
status: live
---

- Wait for explicit CYCLE_COMPLETE from Ortelius before dispatching the next TEST_SPEC to Montano, even on regression-only cycles -- dispatching ahead races Ortelius's gate run against uncommitted work. `v:2026-04-17`
  - `ev: session 6 P2.2 race; ref-xp-process carve 2026-09-19`
  - `rf:`
- Every cycle flows RED to GREEN to PURPLE to team-lead, even when GREEN and PURPLE are no-ops -- bypassing the chain leaves agents stale on closed ACs. `v:2026-04-17`
  - `ev: session 6; ref-xp-process carve 2026-09-19`
  - `rf:`
- PURPLE holds a duplication note at cycle N until N+K shows the pattern is real; one informed refactor beats two speculative ones. "Nothing to do here" is the active default. `v:2026-04-17`
  - `ev: session 6 P2.3; ref-xp-process carve 2026-09-19`
  - `rf:`
- Coverage thresholds gate at phase exit, not mid-phase; temporal gaps (GREEN pre-implementing bodies later tests cover) are legitimate. `v:2026-04-17`
  - `ev: session 6 P2.3 P2.4; ref-xp-process carve 2026-09-19`
  - `rf:`
- Scratchpad-save requests carry specific itemized content, never generic "save your learnings"; multi-step dispatches may need a follow-up poke if the agent idles after reading. `v:2026-04-17`
  - `ev: sessions 5 and 7; ref-xp-process carve 2026-09-19`
  - `rf:`
- Before executing any phase, re-read the plan file and fix drifts (JS-to-TS porting, Windows path idioms, stale code blocks) -- cheap discipline, clean implementation commits. `v:2026-04-17`
  - `ev: session 7, applied 7-8; ref-xp-process carve 2026-09-19`
  - `rf:`
- Never leave uncommitted docs edits in the tree while agents are active: their git add -A sweeps them into agent commits. Commit housekeeping immediately or stash. `v:2026-04-17`
  - `ev: session 7; ref-xp-process carve 2026-09-19`
  - `rf:`
