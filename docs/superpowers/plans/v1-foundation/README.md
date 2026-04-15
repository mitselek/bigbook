# v1-foundation — Plan Overview

**Milestone:** [v1-foundation](https://github.com/mitselek/bigbook/milestone/1)
**Tracking issue:** [#3 — Epic: v1-foundation](https://github.com/mitselek/bigbook/issues/3)
**Design spec:** [Discussion #2](https://github.com/mitselek/bigbook/discussions/2) · committed at [`docs/superpowers/specs/2026-04-14-bigbook-reader-design.md`](../../specs/2026-04-14-bigbook-reader-design.md)
**Commit convention:** every commit in this plan has `Part of #3` in the body. The final commit of Phase 6 uses `Closes #3`.

**Goal:** Establish the content format, the pure-lib foundation (parse/validate/diff), mock ET/EN content bootstrapped into `src/content/`, and development infrastructure (Svelte 5 + a11y lint + Playwright scaffold + size-limit stub + upgraded lefthook hooks). Everything Vitest-testable. No UI, no runtime fetch yet.

**Architecture:** This plan lands the substrate Plans 2-4 build on top of. `src/lib/content/` becomes the input to Plan 2's runtime fetch and Plan 3's editor pre-flight. `src/content/{et,en}/` is populated by a one-shot `CONTENT_BOOTSTRAP=1` script that scrapes the legacy Jekyll ET text and translates it to EN via the Claude API. A two-commit dance captures the content (commit A) and pins `BASELINE_COMMIT_SHA` (commit B) for the diff machinery. Pre-commit hooks are upgraded: `legacy-guard` restored via a shell script to work around the Git Bash escaping bug from session 2, `content-guard` new, `hard-invariant` new and sharing `src/lib/content/validate.ts` with Plan 3's editor pre-flight.

**Tech Stack:** TypeScript 5 (strict), Astro 5, Svelte 5 (for Plan 2 islands — installed now so Plan 2 starts ready), Vitest 2.x + jsdom + `@testing-library/svelte` + `@testing-library/jest-dom`, ESLint 9 flat config + `typescript-eslint` + `eslint-plugin-astro` + `eslint-plugin-svelte`, Prettier 3 + `prettier-plugin-astro`, lefthook pre-commit, Playwright (scaffold only — tests land in Plan 2), size-limit (scaffold only — real budgets measured in Plan 4), Claude API (`claude-opus-4-6`) for the one-shot translation.

---

## Starting state (before Plan 1)

- Astro 5 scaffold from session 2 with a minimal `src/pages/index.astro`, `src/layouts/Layout.astro`, `src/pages/404.astro`
- GitHub App PKCE auth PoC under `src/lib/auth/` with a Cloudflare Worker token-exchange proxy at `worker/`
- Root configs: `astro.config.mjs`, `tsconfig.json`, `package.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `lefthook.yml`
- `docs/architecture.md`, `docs/legacy.md`, `docs/deploy.md`, `docs/superpowers/specs/2026-04-14-bigbook-reader-design.md`
- `tests/smoke.test.ts`
- Legacy Jekyll archive frozen under `legacy/` (read-only per the Coexistence Boundary)
- **No** Svelte, **no** Playwright, **no** size-limit; lefthook has only `typecheck`, `eslint`, `prettier`

## Ending state (after Plan 1)

- All new dependencies installed and wired: Svelte 5 as an Astro integration, a11y ESLint plugins, Playwright config, size-limit config
- `src/lib/content/parse.ts`, `validate.ts`, `diff.ts` — three pure modules, Vitest-covered at ≥90% lines/functions/statements and ≥85% branches
- `src/lib/content/manifest.ts` and `src/lib/content/baseline-config.ts` — both emitted by the bootstrap script
- `src/content/et/*.md` and `src/content/en/*.md` — mock content with `para-id` directives, passing the Hard Invariant
- `scripts/bootstrap-mock-content.ts` — one-shot, committed for future reference
- `scripts/legacy-guard.sh` + `scripts/content-guard.sh` — pre-commit hook logic as shell scripts
- `lefthook.yml` with `typecheck`, `eslint`, `prettier`, `legacy-guard`, `content-guard`, `hard-invariant` all active
- `playwright.config.ts` — scaffold only (no tests yet)
- `.size-limit.json` — scaffold only (placeholder budgets)

## File structure map

New files are marked `[new]`, modified `[mod]`, untouched files omitted.

```
bigbook/
├── src/
│   ├── content/
│   │   ├── et/                      [new] ~20 chapter files
│   │   └── en/                      [new] ~20 chapter files (auto-translated)
│   ├── lib/
│   │   └── content/                 [new]
│   │       ├── parse.ts
│   │       ├── validate.ts
│   │       ├── diff.ts
│   │       ├── manifest.ts          (emitted by bootstrap)
│   │       └── baseline-config.ts   (emitted by bootstrap)
├── scripts/                         [new]
│   ├── bootstrap-mock-content.ts
│   ├── legacy-guard.sh
│   └── content-guard.sh
├── tests/
│   ├── lib/
│   │   └── content/                 [new]
│   │       ├── parse.test.ts
│   │       ├── validate.test.ts
│   │       └── diff.test.ts
│   └── e2e/.gitkeep                 [new] (Plan 2 adds tests here)
├── playwright.config.ts             [new]
├── .size-limit.json                 [new]
├── astro.config.mjs                 [mod] add @astrojs/svelte integration
├── eslint.config.js                 [mod] add svelte + astro a11y rules
├── vitest.config.ts                 [mod] add jsdom env + svelte support
├── package.json                     [mod] deps + scripts
└── lefthook.yml                     [mod] legacy-guard + content-guard + hard-invariant
```

## Phases

Each phase is its own plan file under this directory. Phases are executed in order; each is reviewed before the next is written.

| Phase                     | File                                             | Purpose                                                                                      | Status  |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------- |
| **P0 — Infrastructure**   | [`p0-infrastructure.md`](./p0-infrastructure.md) | Install Svelte 5 + a11y plugins + Playwright + size-limit, wire configs, verify the dev loop | Written |
| **P1 — Parse module**     | [`p1-parse.md`](./p1-parse.md)                   | `src/lib/content/parse.ts` parses `::para[id]` directives + YAML frontmatter                 | Written |
| **P2 — Validate module**  | [`p2-validate.md`](./p2-validate.md)             | `src/lib/content/validate.ts` enforces the Hard Invariant + structured errors                | Written |
| **P3 — Diff module**      | [`p3-diff.md`](./p3-diff.md)                     | `src/lib/content/diff.ts` returns diverged `para-id`s between current and baseline           | Written |
| **P4 — Bootstrap script** | [`p4-bootstrap.md`](./p4-bootstrap.md)           | `scripts/bootstrap-mock-content.ts` scrapes legacy, calls Claude, emits manifest             | Written |
| **P5 — Pre-commit hooks** | [`p5-hooks.md`](./p5-hooks.md)                   | `legacy-guard` restored, `content-guard` new, `hard-invariant` new                           | Written |
| **P6 — Land the content** | [`p6-land-content.md`](./p6-land-content.md)     | Run the bootstrap, commit A (content + manifest), commit B (baseline SHA constant)           | Written |

All seven phase files now exist. Each phase is reviewed before the next executes; execution remains sequential.

## Execution mode per phase

Three execution patterns are available to this project, and the right one differs by phase. The decision below was made at the end of session 3 and applies to v1-foundation; later milestones may revisit it as we learn from running these.

| Pattern                                                           | When it fits                                                                        | Cost                                                                                                                                                            |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Inline** (`superpowers:executing-plans`)                        | Pure config / orchestration; no TDD cycle to gain from.                             | Burns main-session (Plantin's) context per task.                                                                                                                |
| **Generic subagents** (`superpowers:subagent-driven-development`) | Independent tasks where character/role doesn't matter. Anonymous, two-stage review. | One subagent per task; main session stays light but agents have no team membership.                                                                             |
| **XP triple** (canonical for this team)                           | Real TDD code with red/green/refactor discipline. Matches design-spec §3.7 intent.  | Highest ceremony — `TeamCreate` + Montano/Granjon/Ortelius spawned via roster prompts; Plantin coordinates per-AC handoffs and PURPLE three-strike escalations. |

**Per-phase assignment:**

| Phase                     | Mode      | Reason                                                                                                                                         |
| ------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0 — Infrastructure**   | Inline    | Pure config wiring; no behavior to TDD. Six small commits in sequence.                                                                         |
| **P1 — Parse module**     | XP triple | Real TDD work; parser logic is the first place the discipline pays off.                                                                        |
| **P2 — Validate module**  | XP triple | Real TDD work; the shared validator's correctness is load-bearing for three downstream callers.                                                |
| **P3 — Diff module**      | XP triple | Small but TDD-shaped; consistent with P1/P2 cadence.                                                                                           |
| **P4 — Bootstrap script** | Mixed     | P4.2–P4.6 (pure helpers) via XP triple; P4.1 (scaffold) and P4.7 (orchestrator) inline by Plantin. See "Why P4 is mixed" below.                |
| **P5 — Pre-commit hooks** | Inline    | Mostly shell scripts + one Node hook; the Node hook has its own Vitest suite under `tests/scripts/`. The wiring into `lefthook.yml` is config. |
| **P6 — Land the content** | Inline    | Plantin runs the bootstrap script locally with a real Claude API key, then commits. Not a TDD cycle.                                           |

**XP triple logistics** (per `common-prompt.md` Team Reuse section):

1. Plantin checks for `~/.claude/teams/bigbook-dev/`. If present, back up inboxes → delete → `TeamCreate(team_name: "bigbook-dev")` → restore inboxes.
2. Spawn Montano / Granjon / Ortelius using their roster prompts at `.claude/teams/bigbook-dev/prompts/<name>.md`, with `run_in_background: true`, `name`, and `team_name` set.
3. Plantin assigns one acceptance criterion (= one TDD task from the plan file) at a time. The XP cycle is RED (Montano writes failing test) → GREEN (Granjon makes it pass) → PURPLE (Ortelius refactors), with Plantin reviewing handoffs and handling three-strike escalations.
4. When the phase completes, agents shut down per the `shutdown` skill, scratchpads commit.

**Why P0 is not XP triple:** P0 has no failing test to write — it's `npm install` + config edits. RED-style "write a test that asserts the new dep is installed" is theatre. Inline keeps it honest.

**Why P4 is mixed:** P4.1 (install `tsx` + Anthropic SDK, scaffold a stub file with an env-var guard) is pure config wiring like P0 — no TDD cycle to gain from. P4.7's `main()` orchestrator (~130 lines of `fs` walk + sequential helper calls, exercised end-to-end during P6's live run) has no failing test to write — the plan file itself says _"this task does not add new unit tests."_ Running either through the XP triple is the same theatre P0 is inline to avoid. P4.2–P4.6 (five pure-helper functions: `stripJekyllPreamble`, `splitIntoParagraphs` + `assignParaIds`, `formatContentFile`, `translateWithClaude` with an injected fake client, `emitManifest`) remain XP triple — they are classic RED/GREEN/PURPLE shape and the core of P4's value.

---

(_BB:Plantin_)
