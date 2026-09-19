# Plantin -- Scratchpad
Summary header (rewritten 2026-09-19, session 18: memory-adoption session, no product work)
- Role: team-lead of bigbook-dev (main session); XP triple Montano, Granjon, Ortelius; Boderie.
- State: main @ 29beda3, clean, CI green, deployed. Tag v1.1.0 = 296099b. 345 Vitest + 9 Playwright.
- Milestones v1-foundation, v1-reader, v1-editor, v1-ship, v1.1-content all CLOSED; #41 CLOSED.
- Open issues: #38 only (EN heading detection, 11 sections, deferred since session 13).
- Memory: facts/ is the truth tier (4 files, 38 facts; all v:2026-09-19 except 2 human-lane).
- Queue: memory/backlog.md. Newest item: npm audit 37 advisories incl. 3 critical (dev-time).
- Next product direction: PO's call. Candidates: audit-upgrade chore, #38, v2 comments brainstorm.
- Scripts: team dir scripts/{facts-lint,facts-sweep,scratchpad-lint}.sh; run both lints at shutdown.
- Content tree: 70 files per language, generated only by bootstrap (facts/content-pipeline-*.md).
- Team: no persistent team; dispatch one-shot roster agents with prompts/<name>.md + the task.
- Session 17 (2026-04-20) closed #41 in 6 tasks; this pad missed it until today (see GOTCHA).
- URLs: memory/urls/{live-site,github-releases}. Ops changelog: nothing out-of-repo touched.

## 2026-09-19 -- Session 18: memory rewiring adopted

[CHECKPOINT] Assessed 9f83b24 + 29beda3 (Passepartout, directed by Mihkel). Adopted in full.
- Worked the sweep: all 21 carved facts re-verified against source; 19 bumped, 2 human-lane kept.
- Corrected while verifying: prettier fact (bootstrap emit self-formats since 3f1c8d9); size-limit
  fact (brotli is the default unless gzip:true); Worker allowlist is an env var, not code.
- Split the GitHub App fact: config.ts half verified, dashboard-settings half left for PO eyes.
- Replaced narrative ev: tokens ("ref-* carve") with identifiers (file:line, commits, commands).
- Promoted 20 stable truths from this pad into facts/: build-tooling +6, xp-pipeline +3, and the
  new content-pipeline-conventions (7). Deleted the project timeline: git log and tags remember it.
- Deferred items moved to backlog.md; obsolete ones dropped (Node 20 runner warning is moot,
  runners default to Node 24 now; ch05/06 mock mismatch superseded by the P1 regenerate).
- Disputes recorded in backlog.md "Memory-system questions" (a-e), nothing reverted.

[DECISION] 2026-09-19 Facts type enum has no project-state type; content-pipeline typed rule.
[DECISION] 2026-09-19 Ran npm ci here (node_modules was absent). Local install, not an ops event.
[GOTCHA] 2026-09-19 Session 17 got no Plantin header refresh: pad said "after session 16" while
  #41 was already closed on main. Rewrite the header at every shutdown, even one-issue sessions.
[LEARNED] 2026-09-19 The sweep is never empty by construction (10 oldest always listed). Budget
  ~10 source checks per session start, or push for the threshold change (backlog question b).
[LEARNED] 2026-09-19 .claude/ is prettier-ignored, so the pre-commit prettier hook never touches
  memory files; the facts geometry is safe from reformatting. Only the two team lints apply.

## Session 17 (2026-04-20) -- issue #41 bootstrap idempotency (reconstructed from git + pads)

[CHECKPOINT] 2026-04-20 Six tasks: format.ts helper (RED 54127f6 / GREEN 23bf72e); drop
  generatedAt (5358898, RED+GREEN merged because compile-error RED clashes with the typecheck
  hook); Prettier in emit (3f1c8d9); one-shot normalization (d3b6e66, 2 files not ~137 because
  earlier steps absorbed the drift); regression test (328c505); Ortelius PURPLE ACCEPT, zero
  refactor commits. Pushed and #41 closed on 2026-09-19 08:16 UTC alongside the rewiring push.
[PATTERN] 2026-04-20 Plan-deviation test (Ortelius): did it change a success criterion or reduce
  a guard? If not, accept and document in the commit body. Commit shape is a guide, not a contract.

## Standing orientation

[PATTERN] Dispatch template for one-shot work: TDD skill named, MAY / MAY NOT file lists, commit
  footer template (Part of #epic, Closes #issue), (*BB:Role*) attribution, "do not push".
[PATTERN] Story acceptance = typecheck, lint, format:check, test, coverage, build, then PO handoff.
[PATTERN] PO makes live-editor commits on main mid-session; rebase agent branches, never force.
[DEFERRED] Numbering-convention debt (extraction position-in-section vs within-kind ordinal):
  decide at the next content-pipeline revisit; facts/content-pipeline-conventions.md has it.
[WIP] none. Awaiting PO direction on the next story.

(*BB:Plantin*)
