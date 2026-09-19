# Backlog -- between-sessions task queue

Facts redistribution tasks (splits on overflow, consolidations on stagnant stubs -- see the
Memory section of common-prompt.md) land here, plus any deferred work that must survive a
shutdown. Team-lead consults at session start; propose reprioritization, never silently reorder.

## Product / engineering queue (Plantin, 2026-09-19; order = proposed priority, PO decides)

1. npm audit: 37 advisories (3 critical: vitest, astro via esbuild+sharp, @vitest/coverage-v8;
   22 high incl. @size-limit/preset-app). All dev-time. Needs a dependency-upgrade chore story
   with the full quality gate as the acceptance test. Found 2026-09-19 after npm ci.
2. Issue #38 -- EN heading detection fails for 11 sections. Open since session 13 (2026-04-18).
   Only blocks a re-extraction; the current content tree was hand-reconciled around it.
3. Auth ADR docs/decisions/0001-auth.md -- deferred since session 2. The operational truths now
   live in facts/github-app-auth.md; the ADR's remaining value is the XSS/scope decision record.
4. v2 comments milestone (logged-in paragraph comments). Explicit post-v1 scope; needs its own
   brainstorm before any decomposition.
5. Real-device cross-browser check (Safari macOS+iOS, Firefox desktop). PO decision session 12:
   reactive only; the Playwright matrix on push to main is the standing coverage.

Dropped 2026-09-19 as resolved or superseded: Node 20 -> 24 Actions runner migration (runners
default to Node 24 now, per the 2026-09-19 CI log); ch05/ch06 mock-content mismatch and the EN
ch05-ch16 placeholder extraction (both superseded by the P1 regenerate from PDF extractions).

## Memory-system questions (Plantin, 2026-09-19; for Passepartout / Mihkel, not silently changed)

a. facts-lint type enum (person|org|service|rule|commitment) has no fit for pipeline or
   project-state facts; content-pipeline-conventions.md is typed `rule` as the least-wrong choice.
b. facts-sweep.sh lists the 10 oldest facts unconditionally, so the working set is never empty
   and "work it when non-empty" means every session start. Propose: age threshold, or weekly.
c. scratchpad-lint.sh caps backlog.md and ops-changelog.md at 100 rows too (find -maxdepth 1).
   Both are append logs; propose exempting them or adding a rotation rule.
d. Two facts stay at v:2026-04-17 because only a human can refute them from this host: the
   GitHub App dashboard settings and the Wrangler-on-Git-Bash behaviour. PO lane.
e. The carve left narrative ev: tokens ("ref-* carve 2026-09-19"); replaced with identifiers.
