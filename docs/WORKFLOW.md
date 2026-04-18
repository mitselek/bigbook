# Workflow

The `bigbook` codebase is grown using a **RED → GREEN → PURPLE** test-driven discipline borrowed from Extreme Programming. This document is the public description of that discipline. It is intentionally role-neutral: the operational scaffolding for the specific developer roster lives at `.claude/teams/bigbook-dev/` and is not part of the project documentation.

## Summary

For every acceptance criterion of every story:

1. **RED** — write a failing test that specifies the desired behavior.
2. **GREEN** — write the minimum code to make the test pass. No optimization, no generalization, no speculative structure.
3. **PURPLE** — refactor the structure without changing behavior. All tests must stay green. Honor every passing test exactly as it is.

Each acceptance criterion goes through the full cycle once. Cycles do not run in parallel within a story. One thing at a time, through the full pipeline.

## Phase responsibilities

### RED

- Writes one failing test that captures one behavioral contract.
- MUST NOT write implementation code.
- MUST NOT tighten an existing test — a new behavior deserves its own test.
- Failing tests that do not yet have implementation are the correct state at the end of the phase.

### GREEN

- Writes the minimum code needed to turn the RED test green.
- MAY write ugly code. MAY copy-paste. MAY hardcode values. MAY leave tech debt.
- MUST NOT generalize beyond what the test requires.
- MUST NOT modify the RED test. If the test appears wrong, escalate — do not edit around it.
- Exits the phase with a `GREEN_HANDOFF` note that lists **every shortcut taken and every structural concern the author is aware of**. Handoff notes are mandatory; an empty notes field is a protocol violation.

### PURPLE

- Refactors the structure without changing behavior. All tests must stay green throughout.
- MAY rename, extract, deduplicate within a module; tighten internal types; simplify logic; remove duplication introduced by GREEN.
- MUST escalate before: moving code between modules, adding or removing files, changing public exports, crossing the `lib/` ↔ `components/` ↔ `pages/` boundary, introducing a new dependency, or any change to the module layout documented in `docs/architecture.md`.
- Returns one of two verdicts: `ACCEPT` (the cycle closes) or `REJECT` (with specific structural guidance for a GREEN rework).

## Three-strike rule

On `REJECT`, GREEN reworks with PURPLE's guidance and submits again. After three consecutive rejections on the same acceptance criterion, PURPLE escalates the full rejection chain. The escalation resolves one of three ways:

1. Rewrite the acceptance criterion into smaller steps.
2. Split the test case into narrower ones.
3. Override PURPLE and accept with a documented tech-debt marker.

Option 3 is a last resort — it means accepting structural debt knowingly and in writing.

## Write ownership

At any moment, exactly one role holds the write-lock on production code.

| Domain                                                     | Holder                                                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Test files under `tests/`                                  | RED (during the RED phase)                                                                                                             |
| Production code under `src/`                               | GREEN → PURPLE (sequential handoff per cycle)                                                                                          |
| Story decomposition, spec, and ADRs                        | Project lead, outside the cycle                                                                                                        |
| `src/content/`                                             | Neither cycle phase. Populated by one-shot bootstrap subagents or by end users through the editor — never by the regular TDD pipeline. |
| Everything outside the app (e.g., `legacy/`, root configs) | Off-limits without explicit PO approval; see `docs/legacy.md` and the `legacy-guard` pre-commit hook.                                  |

Sequential ownership means no merge conflicts between phase roles — the baton is passed, not shared.

## Quality gates

The TDD cycle sits inside a three-layer gate hierarchy documented in `docs/superpowers/specs/2026-04-14-bigbook-reader-design.md` §3.8:

- **Layer A** — pre-commit hooks (lefthook): typecheck, lint, prettier, architecture guard, content guard, legacy guard, hard-invariant validator. Runs on every commit.
- **Layer B** — CI checks (GitHub Actions): `npm run typecheck`, `lint`, `test`, `size`, plus a Playwright E2E matrix (chromium on PR; chromium + firefox + webkit on push to `main`). Every PR and every push to `main`.
- **Layer C** — client-side pre-flight: the editor validates its proposed commit against the hard-invariant rules before firing a `PUT`. Implemented in `src/lib/editor/preflight.ts`.

Each layer enforces the same rules as the layer above it, so escaping one layer does not escape all of them.

## What this workflow is not

- **Not a rigid process for every change.** One-shot hotfixes, typo corrections, small documentation edits, and content imports use simpler patterns — the RED/GREEN/PURPLE cycle is reserved for acceptance-criterion-sized units of behavior in `src/`.
- **Not Scrum and not Kanban.** There are no iterations, standups, story points, or backlog ceremonies. The cycle operates on a single AC at a time; stories are tracked as GitHub issues and epics.
- **Not tied to a particular tool or LLM.** The discipline predates this codebase and its tooling; the tool choices happen to fit the discipline well, not the other way around.
- **Not a substitute for code review.** PURPLE is not a replacement for human review at merge time; PRs still go through standard review, the difference is that every AC arrives with its behavioral justification already codified as a test.

(_BB:Plantin_)
