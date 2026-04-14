# BigBook Dev — Common Standards

## Team

- **Team:** bigbook-dev
- **Mission:** Build the bigbook bilingual reader — an Astro + TypeScript web app that renders the AA Big Book (*Anonüümsed Alkohoolikud*, 4th edition) in English and Estonian side by side, lets GitHub-authenticated collaborators edit the Estonian text and leave comments, and versions every change through commits against the bigbook repository.
- **Deployment:** GitHub Pages from `mitselek/bigbook`, served from `.github/workflows/build-and-deploy.yml`. A single Pages artifact combines two products: the Astro app at `/bigbook/` and the frozen legacy Jekyll archive at `/bigbook/legacy/`. Pages source is **"GitHub Actions"**, not classic branch-deploy.
- **Pipeline tier:** Cathedral-lite (team-lead as navigator/architect, single XP triple)

### Members

- **plantin** (team-lead / navigator / architect), **montano** (RED), **granjon** (GREEN), **ortelius** (PURPLE)

### XP Pipeline

- Plantin (decomposition) → Montano (RED) → Granjon (GREEN) → Ortelius (PURPLE)
- **Execution mode:** Sequential. One acceptance criterion at a time through the full cycle.

## Workspace

**Project:** `~/Documents/github/bigbook/` on Linux; `~/Documents/github/.mmp/bigbook/` on the Windows dev host. Team config is co-located with the repo at `.claude/teams/bigbook-dev/`, so the harness resolves the workspace from the team-config directory's closest git root — `roster.json` intentionally has no `workDir` field, and you should never add one.

The repo root **is** the Astro app. The former Jekyll site is preserved frozen under `legacy/`. The team writes at the repo root; `legacy/` is off-limits (see "Coexistence Boundary" below).

```
bigbook/
├── .github/
│   └── workflows/
│       └── build-and-deploy.yml  # dual-build Pages workflow
├── .claude/teams/bigbook-dev/    # roster, prompts, common-prompt, memory
├── docs/                          # spec, workflow, ADRs (Plantin-owned)
│   ├── architecture.md
│   ├── legacy.md
│   └── deploy.md
├── legacy/                        # FROZEN ARCHIVE — OFF-LIMITS
│   ├── _config.yml                # baseurl: /bigbook/legacy
│   ├── _layouts/  _includes/  _source/
│   ├── peatykid/  kogemuslood/  lisad/  front_matter/
│   ├── index.md  TOC.md  BIGBOOK.md
│   └── assets/
│       ├── AA-BigBook-4th-Edition.pdf         # EN authoritative source (read-only)
│       ├── BIGBOOK EST PRINT + crop marks.pdf # ET authoritative source (read-only)
│       └── css/styles.css
├── public/                        # Astro static assets (favicon, etc.)
├── src/
│   ├── components/                # UI components
│   ├── content/                   # Astro content collections
│   │   ├── en/                    # English chapters (populated by one-shot bootstrap subagents + users)
│   │   └── et/                    # Estonian chapters (populated by one-shot bootstrap subagents + users)
│   ├── layouts/                   # Astro layouts
│   ├── lib/                       # Pure logic: alignment, github, auth, diff
│   └── pages/                     # Astro routes
├── stories/                       # Story files (Plantin-owned)
├── tests/                         # Vitest test files (Montano-owned)
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
├── .prettierrc.json
├── .prettierignore
└── lefthook.yml
```

## Coexistence Boundary

The bigbook repository contains **two independent products** that share a git history:

1. **The Astro bilingual reader** (repo root). The current and canonical product. Served at `https://mitselek.github.io/bigbook/`.
2. **The legacy Jekyll archive** (`legacy/`). A frozen snapshot of the pre-2026-04-14 Estonian-only Jekyll edition. Served at `https://mitselek.github.io/bigbook/legacy/`. Read-only.

**The team works exclusively at the repo root.** `legacy/` is not ours to edit, reformat, lint, or "improve while we're here." Any change under `legacy/` — including touching `legacy/_config.yml`, modifying `legacy/assets/css/`, or updating chapter markdown — **requires `LEGACY_OVERRIDE=1` set in the commit environment with explicit PO approval recorded in the commit body**. This is a Layer 2 gate and is never relaxed without PO sign-off.

The two authoritative PDFs in `legacy/assets/` (`AA-BigBook-4th-Edition.pdf` and `BIGBOOK EST PRINT + crop marks.pdf`) are the source of truth for the book's text. They are **read-only** for the team. Content extraction and initial bilingual alignment are performed by one-shot anonymous subagents spawned by Plantin as needed — they are not the dev team's responsibility, and ongoing alignment maintenance after user edits is the end user's responsibility, not the team's.

## Runtime content fetch

The Astro build is a **thin shell** — layout, navigation, JS bundles, CSS — but **not** the chapter content. Chapter markdown files are fetched at runtime from `https://raw.githubusercontent.com/mitselek/bigbook/main/src/content/{en,et}/<chapter>.md` so collaborator commits to chapter content become visible to live users without waiting for a GitHub Pages rebuild.

Constraints the dev team must respect:

- **Simple GETs only.** CORS preflight on `raw.githubusercontent.com` returns 403, so fetch requests must not set custom headers or use non-GET methods. No `Authorization`, no `Content-Type` override, no `If-None-Match`. Plain `fetch(url)` only.
- **~5-minute cache TTL.** Unpinned reads from `raw.github.../main/...` can be up to five minutes stale. This is acceptable for anonymous read traffic (better than a rebuild wait) but the editor must not depend on it for same-session consistency.
- **Editor freshness via optimistic local state.** After a successful `PUT` to the GitHub Contents API, re-render from in-memory state — do not refetch. The editor already has the new text in memory at commit time.
- **Cross-session freshness via SHA pinning.** Persist `lastKnownSha` per file in `IndexedDB` and use SHA-pinned URLs (`raw.github.../<sha>/...`) on session resume to bypass the 5-minute cache. Fall back to unpinned `main` URLs once the staleness window closes.

## Editor auth (architectural intent; ADR deferred)

Anonymous visitors are read-only. Collaborators authenticate via **PKCE OAuth using a GitHub App** registration (not a classic OAuth App — GitHub Apps issue rotating refresh tokens that support the split-persistence pattern). Token persistence:

- **Refresh token** (~6 months, rotating): `localStorage`.
- **Access token** (~8 hours): in-session memory only, silently refreshed.

Edits commit directly to `main` via `PUT /repos/mitselek/bigbook/contents/{path}` from the browser. Token scope: `public_repo` (minimum).

The concrete auth ADR — GitHub App registration, scopes, refresh cadence, XSS mitigations — is deferred to the bootstrap story's auth spike. This section describes intent, not implementation.

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata.

**REQUIREMENT ACKNOWLEDGMENT:** When you receive a message containing new requirements or instructions, acknowledge EACH item explicitly before beginning work.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*BB:<AgentName>*)` or the equivalent underscore form `(_BB:<AgentName>_)`. Both render identically as italic in Markdown; Prettier may rewrite one into the other during formatting, so treat them as interchangeable.

| Output type | Placement |
|---|---|
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading |
| Code comment (where warranted) | At the end of the comment |
| Git commit message | In the commit body |

## Stack

- **Language:** TypeScript 5 (strict mode — `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Runtime:** Node 22+ (the GH Actions workflow pins Node 20 until upstream actions ship Node 24 support; local dev on Node 22+ is fine)
- **Framework:** Astro 5 with static output (`output: 'static'`), `site: 'https://mitselek.github.io/bigbook/'`, `base: '/bigbook'`, `trailingSlash: 'always'`
- **UI components:** Astro components by default; an island framework (Svelte or solid-js) may be introduced for interactive islands only after explicit spec approval
- **Content delivery:** Runtime fetch from `raw.githubusercontent.com` (see "Runtime content fetch" above). Chapter content is NOT baked into the Astro build.
- **Auth:** PKCE OAuth via a GitHub App (see "Editor auth" above)
- **Tests:** Vitest 2.x with `@testing-library/*` for component tests (once islands land)
- **Linting:** ESLint 9 with flat config and `typescript-eslint` + `eslint-plugin-astro`
- **Formatting:** Prettier 3.x with `prettier-plugin-astro`
- **Pre-commit:** lefthook (`typecheck`, `eslint`, `prettier --check`; the `legacy-guard` hook is a known follow-up — see `lefthook.yml` TODO)
- **Deployment:** GitHub Pages via `.github/workflows/build-and-deploy.yml`. Single Pages artifact combining Astro at `/bigbook/` and Jekyll at `/bigbook/legacy/`.

### Type Discipline

- No `any` — anywhere
- No `!` non-null assertions
- No `@ts-ignore`
- `@ts-expect-error` only with a comment explaining why and how to remove it
- All "one of N kinds" types are discriminated unions, not string enums
- `switch-exhaustiveness-check` on all domain unions (e.g., `EditState`, `AuthState`, `ParagraphStatus`)

### Architecture Boundary

The app is organized in three concentric layers:

- **`src/lib/`** — pure, headless, testable domain logic: alignment, diff, GitHub API wrappers, auth state machines. **Must not** import from `components/`, `pages/`, or any UI runtime (`astro:*`, `svelte`, etc.).
- **`src/components/`** — UI components. Depend on `lib/`. Must not import from `pages/`.
- **`src/pages/`** — Astro routes. Depend on `components/` and `lib/`. Top of the dependency graph.

ESLint `no-restricted-imports` enforces this in `eslint.config.js`. Inner layers never import from outer layers.

## The Hard Invariant

**Bilingual alignment integrity.** Every paragraph in the English content collection has exactly one paired paragraph in the Estonian content collection, identified by a stable `para-id` of the form `<section>-<ordinal>` (e.g., `ch01-p007`, `appA-p003`). Edits may change text but must **never** break the mapping. The reader's scroll-sync, the edit UI, and the pink-background diff marker all depend on this invariant.

This is the single most important rule in the codebase. All paragraph-level operations — rendering, editing, committing, diffing, commenting — are keyed on `para-id`. No operation is allowed to orphan, duplicate, or renumber a `para-id`.

When writing or reviewing code, ask: *"Does this operation preserve alignment integrity? After this change, does every `para-id` in EN still have exactly one pair in ET, and vice versa?"* If the answer is not obviously yes, something is wrong.

A secondary invariant is derived from this one: **anonymous read-only**. Any code path that mutates content collections or calls the GitHub Contents API must verify an authenticated session first. An unauthenticated visitor must never be able to produce a commit.

## XP Development Pipeline

### The Cycle

For each **story**, Plantin decomposes into acceptance criteria, then runs:

```
Plantin assigns AC to Montano
   |
   v
┌──────────────────┐
│  MONTANO (RED)   │  Write one failing test
│  sonnet          │
└────────┬─────────┘
         v
┌──────────────────┐
│ GRANJON (GREEN)  │  Minimum code to pass
│  sonnet          │
└────────┬─────────┘
         │ GREEN_HANDOFF
         v
┌─────────────────────┐
│ ORTELIUS (PURPLE)   │  Refactor with judgment
│  opus               │
└──────────┬──────────┘
         │
         ├── ACCEPT → CYCLE_COMPLETE → next AC
         └── REJECT → back to GREEN
              (3 strikes → escalate to Plantin)
```

### Message Types

#### TEST_SPEC (Plantin → Montano)

```markdown
## Test Spec
- Story: <story-id>
- Test case: <N of M> — <one-line description>
- Preconditions: <what must be true before this test>
- Expected behavior: <what the test asserts>
- Constraints: <boundaries>

### Acceptance criteria
<specific, testable conditions>

### Spec reference
<relevant section(s) from docs/spec.md>
```

#### GREEN_HANDOFF (Granjon → Ortelius)

```markdown
## Green Handoff
- Story: <story-id>
- Test case: <N of M>
- Files changed: <list>
- Test result: PASS (all tests green)
- Implementation notes: <shortcuts taken, what's ugly, what GREEN knows is suboptimal>
- Commit: <sha>
```

**Implementation notes are mandatory and must be honest.** Ortelius needs context. An empty notes field is a protocol violation and Ortelius will reject-with-guidance.

#### PURPLE_VERDICT (Ortelius → Granjon or Plantin)

```markdown
## Purple Verdict
- Story: <story-id>
- Test case: <N of M>
- Verdict: ACCEPT | REJECT
- Rejection count: <N>

### Changes made (if ACCEPT)
<list of refactoring actions taken>
<commit sha>

### Rejection reason (if REJECT)
<specific structural issue>

### Guidance for GREEN (if REJECT)
<concrete direction>

### Escalation (if rejection_count >= 3)
<full rejection chain summary for Plantin>
```

#### CYCLE_COMPLETE (Ortelius → Plantin)

```markdown
## Cycle Complete
- Story: <story-id>
- Test case: <N of M> — DONE
- Total cycles: <how many GREEN→PURPLE round-trips>
- Final commit: <sha>
- Quality notes: <structural observations>

### Ready for next test case: YES | NO (explain)
```

## File Ownership (Temporal Ownership Model)

Within the pipeline, agents hold the write-lock sequentially. No merge conflicts.

| Domain | Write-lock holder | Notes |
|---|---|---|
| `stories/` | Plantin (Lead) | Story files and decomposition |
| `tests/` | Montano (RED) | Test files, fixtures, vitest config |
| `src/` production code | Granjon (GREEN) → Ortelius (PURPLE) | Sequential handoff |
| `docs/` | Plantin (Lead) | Spec, workflow, ADRs |
| `src/content/en/` and `src/content/et/` | **Neither** | Populated by one-shot subagents (initial) and the web app's users (ongoing). Tests must use fixtures under `tests/fixtures/`, never touch real content. |
| `legacy/` | **Off-limits** (Coexistence Boundary) | Any staged diff under `legacy/` requires `LEGACY_OVERRIDE=1` plus explicit PO approval recorded in the commit body. |
| Root config (`astro.config.mjs`, `tsconfig.json`, `package.json`, `vitest.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `lefthook.yml`) | Granjon (GREEN) with Plantin review | Infrastructure changes should be flagged in GREEN_HANDOFF for Ortelius review. |
| `.github/workflows/` | Plantin (Lead) | CI / deploy pipeline |

## Quality Gates

### Layer 1 — Phase gates

Per `docs/WORKFLOW.md` (TBD — lands with the first story). Enforced by the performing agent, verified by the next.

### Layer 2 — Pre-commit (lefthook)

1. `tsc --noEmit` — strict config, zero errors (`typecheck` hook)
2. `eslint` — zero warnings (`eslint` hook, runs against staged files only)
3. `prettier --check` — formatting clean (`prettier` hook, runs against staged files only)
4. Architecture (enforced by ESLint `no-restricted-imports`): no `components/` or `pages/` imports from `lib/`; no `pages/` imports from `components/`
5. Content guard: no commit under `src/content/en/` or `src/content/et/` from the dev team (enforced by an ESLint rule or a lefthook-script TBD; the only legitimate writer is one-shot bootstrap subagents spawned by Plantin with `CONTENT_BOOTSTRAP=1` set in the commit environment)
6. Type hygiene: no `any`, no `!`, no `@ts-ignore` (enforced by ESLint rules)
7. Boundary guard: no staged diffs under `legacy/` unless `LEGACY_OVERRIDE=1` is set in the commit environment with PO approval recorded in the commit body. **Currently a known follow-up** — the `legacy-guard` hook in `lefthook.yml` was deferred due to a shell-escaping issue on Windows Git Bash; treat `legacy/` as off-limits by convention until the hook is restored.

**`vitest run` is NOT a per-commit gate** — RED commits must contain failing tests by design.

### Layer 3 — Story acceptance

Before Plantin hands a story to PO:

1. `npm run typecheck` — clean
2. `npm run lint` — exit 0
3. `npm run format:check` — exit 0
4. `npm run test` — all tests pass
5. `npm run test:coverage` — coverage thresholds met (`src/lib/` ≥ 90% lines/functions/statements, ≥ 85% branches)
6. `npm run build` — Astro build succeeds with zero warnings
7. Every AC went RED → GREEN → PURPLE
8. Plantin reviewed commits against the spec
9. PO explicitly accepts

## Scope Restriction

**This team builds what the spec defines and nothing more.** If a task looks like a scope expansion beyond the spec, agents escalate to Plantin. Plantin escalates to PO.

"Scope expansion" explicitly includes:

- Touching any file under `legacy/` (Coexistence Boundary)
- Adding dependencies not in the stack contract
- Introducing a second UI framework
- Producing a dedicated backend when the PKCE client-side flow is still viable
- Rewriting paragraphs in `src/content/` (only one-shot subagents or end users do that)

## Client Communication

**PO-only.** Team may draft messages; PO sends them.

## Shutdown Protocol

1. Write in-progress state to your scratchpad at `.claude/teams/bigbook-dev/memory/<your-name>.md`
2. If you are PURPLE and mid-refactor: revert uncommitted changes and note what you were doing in scratchpad
3. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]`, `[UNADDRESSED]` (1 bullet each, max)
4. Approve shutdown

Team-lead shuts down last, commits memory files, pushes.

## On Startup

1. Read your personal scratchpad at `.claude/teams/bigbook-dev/memory/<your-name>.md` if it exists
2. Read `docs/architecture.md`, `docs/legacy.md`, `docs/deploy.md`
3. Read `docs/WORKFLOW.md` and `docs/spec.md` once they exist (lands with the first story)
4. Send a brief intro message to `team-lead`

(*BB:Plantin*)
