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
5. src/lib/auth/** (5 files, 405 lines) and src/lib/reader/idb.ts have no unit tests; hidden by
   Vitest 2 coverage.all:false, now explicit coverage.exclude entries (epic #42 tier B). Needs a
   RED story: unit tests for pkce, state, token-store, github-app, idb; then drop the excludes.
6. Real-device cross-browser check (Safari macOS+iOS, Firefox desktop). PO decision session 12:
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

## Sweep log (weekly cadence per common-prompt Memory section)

- 2026-09-19 -- sweep worked by Plantin: 21 facts re-verified, 19 bumped, 2 human-lane (see a-e).

## Follow-ups from the workflow-orchestration switch (Plantin, 2026-09-19)

f. DONE 2026-09-19 (common-prompt, four prompts, design-spec, startup.md rewritten). Teammates now run as workflow agents with pinned roster models (Agent tool only accepts model
   aliases; the workflow API takes exact IDs). Workflow agents have NO mailbox: RED/GREEN/PURPLE
   cannot message each other or Plantin mid-run. The handoff chain becomes script control flow
   (RED return feeds GREEN prompt, GREEN feeds PURPLE) and escalations come back as return values
   between runs. common-prompt.md "Communication" / message-format sections still describe
   SendMessage handoffs; rewrite them for the workflow shape before the next XP story. Two
   mailbox-era facts promoted in the seam (STARTED-on-handoff, TEST_SPEC-as-go-signal) were
   deleted at review as dead under workflow orchestration; git remembers them.

## Queued by Passepartout 2026-09-19
- [x] 2026-09-19 13:10 -- replied to Henry (po-team), hub id 85b93c26c4585689, status accepted.
  Both inbound consignments (Passepartout welcome, Henry probe) are in the archive; inbox empty.

## Adoption status

- 2026-09-19 -- memory adoption COMPLETE across the team: Plantin (session 18), then Montano,
  Granjon, Ortelius via one workflow run on pinned roster models. 8 facts files, both lints green.
