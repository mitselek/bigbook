---
type: rule
status: live
---

- Extraction scope matches duplication scope: in-function call sites yield a private helper, cross-export sites yield module-level. Do not promote extraction scope prematurely. `v:2026-09-19`
  - `ev: validate.ts:14 collectMissing (module); bootstrap-mock-content.ts:222 tsStringLit (private)`
  - `rf: =ev`
- Bundle refactors triggered by the same cycle event into one PURPLE commit; separate commits only when refactors surface in different cycles or are independently revertible. `v:2026-09-19`
  - `ev: session 14 Task 17 commit 1f4cf78 (PAGE_ARTIFACTS + blockId)`
  - `rf:`
- When collapsing N conditionals into an array plus loop, prefer named-element form over inline literals; named constants survive for grep, debug stepping, and test introspection. `v:2026-09-19`
  - `ev: scripts/extract-en-book/normalize.ts:15 PAGE_ARTIFACTS array`
  - `rf: =ev`
- Production dedup thresholds count definitions not call-sites; test-fixture uses do not inflate the production threshold. After consolidation the helper body is one definition. `v:2026-09-19`
  - `ev: scripts/extract-en-book/segment.ts:73 blockId; session 13 padStart tracking`
  - `rf: =ev`
