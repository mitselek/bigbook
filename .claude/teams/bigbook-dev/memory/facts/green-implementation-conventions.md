---
type: rule
status: live
---

- When plan spec and test assertions diverge, defer to the test; document the discrepancy honestly in GREEN_HANDOFF for Ortelius/Plantin to judge. `v:2026-09-19`
  - `ev: session 7 P4.6; commit d1b86a2`
  - `rf:`
- Export the full module type surface when the plan lists them as exports, but add no helpers tests do not yet demand; minimum-viable scoping. `v:2026-09-19`
  - `ev: session 5 P1.1; ortelius.md "thin bones" acceptance; common-prompt.md Architecture Boundary`
  - `rf:`
- Montano's RED commit may already be on HEAD when the GREEN handoff arrives; confirm with git log before reading the stub content. `v:2026-09-19`
  - `ev: session 7 P4.5-P4.6; commit d1b86a2`
  - `rf: git log --oneline -5 after receiving any RED handoff`
- When two functions share identical error-mapping shape, flag in GREEN_HANDOFF as a duplication candidate; do not pre-extract — extraction is Ortelius's domain. `v:2026-09-19`
  - `ev: session 10 P0.5; src/lib/content/fetch.ts:15 httpErrorResult`
  - `rf: =ev`
