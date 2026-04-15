# Plantin — Scratchpad

## 2026-04-14 — Session 1 (pre-bootstrap)

**[CHECKPOINT]** Repository is now committed end-to-end, but still pre-bootstrap for the app.
- PR #1 (Kylli's two authoritative PDFs) merged into `main` — `assets/AA-BigBook-4th-Edition.pdf` (EN) and `assets/BIGBOOK EST PRINT + crop marks.pdf` (ET). These are the source of truth.
- Team workspace committed at `.claude/teams/bigbook-dev/` (roster, common-prompt, four role prompts, design-spec).
- Session bootstrap committed at `.claude/startup.md` and tmux harness at `.tmux-layout.yaml`.
- No `app/` directory yet. No `app/docs/spec.md`, no `WORKFLOW.md`, no stories. No persistent team spawned this session.

**[WIP]** Next session starts from a clean tree. The natural first move is still the list I gave the PO at the top of this session:
1. Write `app/docs/spec.md` (Plantin owns).
2. Write `app/docs/WORKFLOW.md` (Plantin owns).
3. Draft the first story — `app/` scaffold bootstrap (package.json, Astro 5 config, tsconfig strict, lefthook gates, eslint, vitest, folder layout per the design-spec architecture boundary).
4. Only then spawn Montano / Granjon / Ortelius against the bootstrap story's first AC.

**[DEFERRED]** PO gave no direction on which of the four to start with — ask at session start.

**[GOTCHA]** `gh` is installed as a snap (`/snap/bin/gh → /usr/bin/snap`), so its filesystem sandbox **cannot read `/tmp/`**. Any `gh pr merge --body-file`, `gh issue create --body-file`, etc. must point at a path **inside `$HOME`** (e.g. `/home/michelek/.commit-msg.txt` or somewhere under the repo). Learned the hard way when `--body-file /tmp/pr1-merge-body.txt` failed with "no such file or directory" even though the file was there — the error is misleading, it's a snap confinement problem, not a missing file.
**Why it matters:** the global `CLAUDE.md` commit-message convention ("use a temp file to avoid backtick escaping") needs adjusting on this host — the temp file must live in `$HOME`, not `/tmp/`.

**[DECISION]** Team boundary convention for pre-lefthook commits: the Layer 2 boundary gate (`JEKYLL_CROSSOVER=1` flag) does not yet exist as a lefthook hook (no `app/`, no lefthook). For now, record crossovers in the commit body in prose ("PO-approved crossover…") and reserve the literal `JEKYLL_CROSSOVER=1` env var for actual Jekyll-site diffs. Once `app/` is bootstrapped and lefthook is installed, every commit outside `app/` and `.claude/teams/bigbook-dev/` will need the env var set regardless of semantic.

(*BB:Plantin*)

## 2026-04-14 — Session 2, coexistence inversion landed

**[DECISION]** Coexistence inverted. The Jekyll site was moved atomically from the repo root into `legacy/` as a frozen read-only archive. The repo root is now the Astro 5 bilingual reader app. A single GitHub Actions workflow at `.github/workflows/build-and-deploy.yml` builds both products and combines them into one GitHub Pages artifact — Astro serves at `https://mitselek.github.io/bigbook/`, the Jekyll archive at `https://mitselek.github.io/bigbook/legacy/`. Pages source was flipped from classic branch-deploy to "GitHub Actions" (one-time manual change in repo settings).

**[DECISION]** Runtime content fetch. The Astro build is a thin shell (layout, JS, CSS, navigation), chapter content is fetched at runtime from `raw.githubusercontent.com` so collaborator commits become visible to live users without waiting for a rebuild. ~5-minute raw.github cache TTL accepted for anonymous reads; editors use optimistic local state + IndexedDB-persisted `lastKnownSha` for SHA-pinned cross-session freshness.

**[DECISION]** Collaborator-only editing (E1 from the three-option decision matrix). Anonymous visitors are read-only. Editors authenticate via PKCE OAuth through a **GitHub App** registration (not a classic OAuth App — GitHub Apps support the refresh-token/access-token split natively). Refresh token in `localStorage`, short-lived access token in in-session memory, auto-renewed. Scope: `public_repo`. Concrete auth ADR deferred to the bootstrap story's auth spike.

**[DECISION]** `roster.json` `workDir` field removed. Team config is co-located with the repo at `.claude/teams/bigbook-dev/`; the harness resolves the workspace from the team-config directory's closest git root. Any absolute path (even `$HOME`-anchored) is host-specific and broke between Linux session 1 and Windows session 2. See the saved feedback memory at `~/.claude/projects/.../memory/feedback_roster_os_agnostic_paths.md`.

**[DONE]** Commits 1-3 of the restructure sequence landed and deployed green:
- `0dcfa0f` initial workflow (with broken `hashFiles` job-level guard — superseded)
- `d7efecb` dropped the broken `build-astro` guard
- `4f86d8f` atomic `git mv` of Jekyll into `legacy/`, baseurl rewrite to `/bigbook/legacy`, workflow update, placeholder root `index.html`
- `ce321a0` Astro skeleton at the repo root with three-layer `no-restricted-imports` architecture boundary, lefthook pre-commit (minus the legacy-guard hook which hit a shell-escaping issue on Windows Git Bash), docs/{architecture,legacy,deploy}.md, tests/smoke.test.ts

**[DONE]** Commit 4 (this commit) rewrites team config: `common-prompt.md` and `design-spec.md` fully rewritten to reflect the inverted boundary, all `app/` prefixes purged from prompts, `_sass/` fact error removed, `JEKYLL_CROSSOVER` renamed to `LEGACY_OVERRIDE`, runtime-fetch and editor-auth sections added, `roster.json` `workDir` removed, and this memory entry appended.

**[DONE]** PO requested GitHub auth PoC on the scaffolding page. Landed end-to-end in commits 5 and 6 (see "Session 2 wrap — auth PoC" below).

**[DEFERRED]** `legacy-guard` lefthook pre-commit hook (blocks staged diffs under `legacy/` unless `LEGACY_OVERRIDE=1`). Hit a shell-escaping issue when running the multi-step guard through lefthook -> sh -c on Windows Git Bash (`staged: -c: line N: syntax error: unexpected end of file`). Until it is restored, treat `legacy/` as off-limits by convention. Options to revisit: (1) move logic to `scripts/legacy-guard.sh` and invoke via `bash scripts/legacy-guard.sh`, (2) use `bash -c` explicitly, (3) implement as a GitHub Actions check.

**[DEFERRED]** `WORKFLOW.md` and `docs/spec.md`. The new product spec will be written during the product brainstorm that follows this restructure.

**[NEXT]** After the auth PoC: product brainstorm.

(*BB:Plantin*)

## 2026-04-14 — Session 2 wrap — auth PoC landed, prepping for clear

**[DONE]** End-to-end production-shaped GitHub auth PoC is live on `https://mitselek.github.io/bigbook/`. Sign in → redirect to github.com → authorize → callback → CF Worker exchange → `/user` fetch → avatar + username render on the landing page. PO verified the full round-trip manually.

**[FACTS for next session]**

- **GitHub App name:** `bigbook-dev` (installed on `mitselek/bigbook`, "Expire user authorization tokens" enabled, Contents read+write permission, OAuth during installation enabled).
- **GitHub App Client ID:** `Iv23lipPWHpw0QWj8lYF` (public, hardcoded in `src/lib/auth/config.ts`).
- **GitHub App Client Secret:** Lives only as `GITHUB_CLIENT_SECRET` in the Cloudflare Worker's secret store (set via `wrangler secret put`). Not recorded anywhere else by design.
- **Cloudflare Worker:** `https://bigbook-auth-proxy.mihkel-putrinsh.workers.dev`. Source under `worker/` (not part of the Pages deploy). Deployed via `cd worker && npx wrangler deploy`. Holds the `GITHUB_CLIENT_SECRET` env secret. Two endpoints: `POST /exchange` and `POST /refresh`. CORS allowlist: `https://mitselek.github.io`.
- **Commits 5 and 6:**
  - `1d87d02` feat(auth): scaffold GitHub App PKCE PoC with Cloudflare Worker token proxy (worker/ + src/lib/auth/ + callback page + landing UI wiring, placeholder CLIENT_ID and WORKER_URL)
  - `29e8a1d` feat(auth): wire real GitHub App Client ID + Cloudflare Worker URL

**[LESSONS]** (worth writing up into the auth ADR later)

1. **GitHub's `/login/oauth/access_token` has no CORS.** Browsers cannot POST to it. This is a deliberate GitHub policy, not an oversight. Applies to both web-flow and device-flow token exchange, and also to the refresh-token endpoint. Any browser-based auth flow for GitHub (OAuth App or GitHub App) requires a backend for the token exchange step.
2. **PKCE on GitHub Apps does not eliminate `client_secret`.** GitHub Apps accept `code_challenge` + `code_verifier` on the authorize step as extra protection, but the token exchange endpoint still requires `client_secret` regardless. PKCE is defense-in-depth, not a secret substitute.
3. **Device-flow refresh tokens do not require `client_secret` on refresh** (per docs), but this is moot given lesson 1 — CORS still blocks the endpoint from a browser.
4. **The minimum-viable backend for the token exchange is ~170 lines of Cloudflare Worker code.** Free tier, stateless, aligns with the organization's standard stack per the parent `CLAUDE.md`. The `worker/` subdirectory is a sibling service to the Astro app, not part of the Pages deploy — deployed separately via `wrangler deploy`.
5. **Wrangler on Git Bash (Windows) silently falls back to non-interactive mode.** Prompts for secrets and confirmations are skipped — you get a "Success" message with an empty-string default value. Workaround: use stdin pipe (`printf '%s' 'secret' | npx wrangler secret put NAME`) or the Cloudflare dashboard for sensitive inputs.
6. **Astro 5 strict TS + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`** require care around DOM API return values. `document.getElementById` returns `HTMLElement | null`; the callback and landing pages use explicit casts (`as HTMLButtonElement | null`) and null guards on every reference.

**[TOKEN lifecycle]** (confirmed working end-to-end)

- Access token: 8 hours, in-memory only (`src/lib/auth/token-store.ts`). Gone on reload.
- Refresh token: 6 months, rotating, `localStorage` key `bigbook.auth.refresh`. Rotates on every refresh.
- Silent refresh triggered by: (a) stale in-memory access token on page load, (b) 401 response from `api.github.com/user`.

**[FOLLOW-UPS for next session]** (in rough priority order)

1. **Write the real auth ADR** at `docs/decisions/0001-auth.md`. The PoC *is* the production shape, minus the ADR artefact. Capture what was ruled out (pure static, device flow) and why (lessons 1-3 above).
2. **Restore the `legacy-guard` lefthook hook** — move logic to `scripts/legacy-guard.sh` and invoke via `bash` (option 1 from the earlier deferral). Small, self-contained.
3. **Node 20 deprecation warnings** on GH Actions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `actions/configure-pages@v5`). GitHub is forcing Node 24 in June 2026. Upstream action versions for Node 24 not yet available at time of session 2; recheck in a month or two.
4. **`npm audit` reports 10 moderate-severity advisories** in the fresh Astro scaffold. Triage separately.
5. **Chat history cleared at end of session 2.** Next session starts without the chat context of how we got here. This scratchpad + the plan file at `~/.claude/plans/sparkling-gliding-knuth.md` + commits 0dcfa0f..29e8a1d are the full record.

**[NEXT SESSION ENTRY POINT]** Product brainstorm. The entire workdir + deploy + auth infrastructure is now in place. The question that opens session 3 is: *"what does the bilingual reader actually look like, feel like, and do?"* No code to write before that conversation happens — the next session should start with the brainstorming skill, not with implementation.

**[UNADDRESSED from session start]** The PO asked at the top of session 2 for "higher-level workdir decisions, then brainstorm a product." The workdir decisions turned into a full plan + four-commit restructure, then the auth PoC was added on top. The product brainstorm is still the unsatisfied ask — pick it up first thing in session 3.

(*BB:Plantin*)

## 2026-04-15 — Session 3, full brainstorm → spec → plan landed

**[DONE]** Product brainstorm completed via the `superpowers:brainstorming` skill with the visual companion (browser-based mockups, accepted by PO). Twelve question rounds covering audience, reading unit, alignment, mobile, navigation, edit UX, comments, MVP scope, divergence semantics, content pipeline, rebuild semantics, and quality gates. Each decision logged inline in the conversation as it was made.

**[DECISION]** The big shape decisions, locked in:

- **Reader-first** — anonymous read is the gravity; editor is a subtle affordance for signed-in contributors.
- **Continuous scroll** — whole book is one long scroll, chapter titles are paragraphs (`<chapter>-title`) participating in the same alignment/edit/fetch pipeline. Top bar's center title updates via IntersectionObserver. Reverses the earlier "chapter pages" decision.
- **Row-aligned columns** — EN ~45% / ET ~55% (45/55 split tunable once real ET content lands; ET typically 20-40% longer), 140px marginalia column. Mobile collapses to stacked pairs <900px.
- **Inline edit** — click ET paragraph → bordered text box in place; Esc cancels, Ctrl/Cmd+Enter commits via Contents API directly to main.
- **Marginalia for baseline-diff** — replaces the pink-background idea entirely. Marginalia column doubles as the divergence signal in v1 and adds comment threads in v2.
- **Phasing** — v1: read + edit + marginalia diff (mock content); v2: + comments; v3: real PDF content via separate bootstrap pipeline.
- **Content pipeline** — mock content from legacy ET (Jekyll markdown) + Claude-translated EN, via one-shot `scripts/bootstrap-mock-content.mjs` with `CONTENT_BOOTSTRAP=1` env gate.
- **Runtime fetch** — current ET via Contents API with `If-None-Match` ETag (304 = no-op, no rate-limit cost); EN and baseline ET SHA-pinned to `BASELINE_COMMIT_SHA` (immutable, raw.github CDN-cached forever). Visibility-change refresh refetches only current ET. Live polling deferred to v2.
- **Quality gates** — three-layer architecture: Layer A lefthook (dev-team only: `legacy-guard` restored, `content-guard` new, `hard-invariant` new — sharing `validate.ts` with editor pre-flight); Layer B GH Actions CI (size-limit hard gate, Playwright Chromium on PR, three-browser on push to main); Layer C client-side pre-flight via shared `validate.ts`.

**[DONE]** Spec written and committed at `docs/superpowers/specs/2026-04-14-bigbook-reader-design.md` (commit `4c1fbfc`). Posted as **GitHub Discussion #2** under the Ideas category — https://github.com/mitselek/bigbook/discussions/2. Discussion was iteratively edited inline as the design evolved during the brainstorm (visibility-change refresh, EN-as-baseline insight, ETag refinement, full quality-gate section).

**[DECISION]** Plan structure: **4 milestones × 4 epics × per-phase sub-issues × per-phase plan files**, all on `main` (no worktree per session-2 convention).

- **Milestones:** v1-foundation (#1), v1-reader (#2), v1-editor (#3), v1-ship (#4).
- **Epic tracking issues:** #3, #4, #5, #6 — one per milestone, with bilingual phase checklist using GitHub's task-list feature (linked sub-issue items).
- **Plan files:** organized as `docs/superpowers/plans/<milestone>/{README.md, p<N>-<name>.md}` after a refactor halfway through writing — the original monolithic plan file had hit ~1640 lines with only 2 of 7 phases written, so I split per-phase. Keeps each file under ~800 lines for review.

**[DONE]** v1-foundation plan fully written. **All 7 phase files exist** under `docs/superpowers/plans/v1-foundation/`:
- `README.md` — plan overview (goal, architecture, file structure map, phase index)
- `p0-infrastructure.md` — install Svelte 5, a11y plugins, Playwright, size-limit, wire configs (7 tasks)
- `p1-parse.md` — TDD `src/lib/content/parse.ts` (7 tasks)
- `p2-validate.md` — TDD shared `validate.ts` (4 tasks)
- `p3-diff.md` — TDD `diff.ts` (3 tasks)
- `p4-bootstrap.md` — build `scripts/bootstrap-mock-content.mjs` with pure helpers + Claude SDK integration (7 tasks)
- `p5-hooks.md` — restore `legacy-guard`, add `content-guard` + `hard-invariant` (4 tasks)
- `p6-land-content.md` — run the bootstrap, commit A (content + manifest with `CONTENT_BOOTSTRAP=1`), commit B (`baseline-config.ts` with `Closes #3`) (4 tasks)

**Total: 36 TDD tasks across 7 phases.** Sub-issues #7-#13 created, one per phase, each linking its plan file. Issue #3's body uses GitHub's task-list feature (`- [ ] #7` etc.) so closing each sub-issue auto-ticks the parent epic.

**[DONE]** Memory: feedback memory updated as the session went — visibility-companion accepted, per-phase plan-file split adopted, no per-task sub-issues (epics-only ceremony level), tasks feature in epic body.

**[FACTS for next session]**

- **Plan 1 commits this session:** `4c1fbfc` (spec) → `5964951` (Phase 0 inline) → `308fc13` (Phase 1 inline) → `36cefb1` (split into per-phase files) → `0ece9bf` (Phases 2-6 added). All on `main`.
- **GitHub state:** Discussion #2 (spec), milestones 1-4, epics #3-#6, sub-issues #7-#13. Roadmap view at https://github.com/mitselek/bigbook/milestones.
- **Open questions deliberately deferred to implementation time:** EN/ET split ratio (45/55 starting point), skeleton row height estimates (60px title / 110px body guesses), Claude model for translation (opus or sonnet), exact commit body wording for edits, AA license attribution in the footer, size-limit thresholds (real values measured in v1-ship).
- **Plans 2, 3, 4 are NOT written.** Only v1-foundation is fully planned. The Plan 2 file is written *after* Plan 1 executes so it can reference the actual shape of `parse.ts`/`validate.ts`/`diff.ts`/`manifest.ts`/`baseline-config.ts` as they landed, instead of guessing.
- **`mitselek/bigbook` Discussions are enabled.** Six default categories. Used Ideas for the spec. Future ADRs probably also Ideas; release announcements would go in Announcements.

**[GOTCHAS]**

1. **`gh api graphql -f body=@file` does NOT expand the `@`** the way `gh issue create --body-file` does. For string variables in mutations I had to build a JSON payload file via Python and use `gh api graphql --input <file>`. The first attempt posted the literal string `@C:/...` as the discussion body. PO had a chuckle. Worked fine after the JSON-payload approach.
2. **Brainstorm visual companion server times out after ~30 min idle.** When it does, the existing screen file is still on disk; just restart the server (`scripts/start-server.sh --project-dir <repo>`) and copy the latest screen file over to the new session's `content/` directory so the user doesn't lose context. State persists in `.superpowers/brainstorm/<id>/state/events`.
3. **Plan-file size matters.** A 1500-line plan is borderline; 2000+ becomes hard to review and edit. The per-phase split happened mid-session and was the right call. Going forward, default to per-phase from the start.

**[DEFERRED to v2/v3/follow-up]** All recorded in spec §5 and discussion #2. Specifically:
- Lighthouse CI (deferred — needs preview-deploy URL + CI minutes)
- Server-side validation proxy in the Cloudflare Worker (deferred — Layer C client-side covers the realistic failure mode)
- Safari `overflow-anchor` workaround via off-screen height measurement (deferred — tuning skeleton estimates first)
- v2 freshness via signed-in polling using `git/trees` batched SHA check
- Real auth ADR at `docs/decisions/0001-auth.md`
- `npm audit` triage (10 moderate advisories from Astro scaffold)
- Node 20 → 24 GH Actions migration (waiting on upstream action versions)

**[NEXT SESSION ENTRY POINT]** **Execute v1-foundation Phase 0** — task #7.

**Execution mode per phase is decided and documented** at [`docs/superpowers/plans/v1-foundation/README.md`](../../../docs/superpowers/plans/v1-foundation/README.md#execution-mode-per-phase). Summary:

- **P0, P5, P6 → inline** via `superpowers:executing-plans`. Pure config / orchestration; no TDD cycle to gain from.
- **P1, P2, P3, P4 → XP triple** (Montano RED → Granjon GREEN → Ortelius PURPLE) via `TeamCreate(team_name: "bigbook-dev")` and the roster prompts at `.claude/teams/bigbook-dev/prompts/<name>.md`. Real TDD code; this is what the team config exists for.

The third pattern, generic anonymous subagents (`superpowers:subagent-driven-development`), was considered and rejected — when the team has named XP roles in the roster, the canonical pattern is to use them. Read the README's "Execution mode per phase" section for the full table and reasoning before executing.

The plan file at `docs/superpowers/plans/v1-foundation/p0-infrastructure.md` has every command, every code block, every commit message — an executor (or Plantin running inline) needs nothing else. Issue #7 holds the high-level task list; the plan file holds the per-step instructions.

**[CONTEXT NOTE]** Session 3 ended at ~54% context used (mostly the long plan-writing dialogue). PO suggested handover-via-scratchpad and a fresh session for execution. This entry IS that handover; no separate tmp file needed.

(*BB:Plantin*)

## 2026-04-15 — Session 4, v1-foundation Phase 0 landed

**[DONE]** Plan 1 / Phase 0 executed inline via `superpowers:executing-plans`. Six commits, pushed to `origin/main`, deploy run `24458173668` succeeded:

```
a00bed3 feat(size-limit): scaffold placeholder budgets
3899dcb feat(playwright): scaffold config + tests/e2e directory
12dfeb4 feat(vitest): jsdom env + svelte plugin + coverage thresholds
8bcca9e feat(eslint): add svelte + astro a11y rule sets
d727fee feat(astro): wire @astrojs/svelte integration
82d67f8 chore(deps): add svelte 5, testing-library, playwright, size-limit
```

All dev-loop gates green: `typecheck`, `lint`, `format:check`, `test`, `test:coverage` (vacuous), `build`, `size`. Empty-commit lefthook verification from P0.7 skipped — the six real commits already exercised every hook.

**[PLAN DEVIATIONS]** (all documented in the relevant commit bodies, summarized here for fast recall)

1. **`@astrojs/svelte` loosened from `^6.0.0` → `^7.0.0`** (commit `82d67f8`). `^6.x` peer-depends on `astro@^4`; the repo is on `astro@^5`. `^7.x` is the right family for Astro 5. The plan explicitly authorized this escape hatch ("Loosen a single version to the latest stable release if necessary; record in the commit body what you loosened and why"). `@astrojs/svelte@^8` also exists but needs `astro@^6`.

2. **Two devDeps the plan missed** (commits `82d67f8` and `8bcca9e`):
   - `@vitest/coverage-v8` — required peer of `provider: 'v8'` in `vitest.config.ts`. Added in `82d67f8` alongside the other dev-infra deps.
   - `eslint-plugin-jsx-a11y` — required peer of `eslint-plugin-astro`'s jsx-a11y configs. Without it, the astro flat/jsx-a11y config has a `null` plugin entry and ESLint refuses to load (`Key "plugins": Key "jsx-a11y": Expected an object`). Added in `8bcca9e`.

3. **`flat/jsx-a11y-recommended`, not `jsx-a11y-recommended`** (commit `8bcca9e`). The plan's exact key name (`astro.configs['jsx-a11y-recommended']`) is the legacy variant and is incompatible with ESLint 9's flat config. Both the flat `...recommended` and `...flat/jsx-a11y-recommended` keys exist on the `configs` object; for our flat config we need the `flat/` prefix on the jsx-a11y entry. The base `...astro.configs.recommended` happens to work without the prefix because the plugin exports both shapes under one name there.

4. **Dropped the `dist/_astro/*.css` size-limit budget** (commit `a00bed3`). `size-limit`'s `path` globs are hard asserts — matching zero files exits 1, which would block CI. The repo currently has no CSS chunks because existing pages use only inline `style=""` attributes; the first `.svelte` island in Plan 2 will trigger CSS extraction and the budget re-adds naturally. Plan 4 retunes budgets against measured values anyway.

5. **Bonus a11y fix** (commit `8bcca9e`). The newly-active `anchor-is-valid` rule caught a real issue in `src/pages/index.astro`: the auth PoC's profile-link `<a>` had no SSR-time `href` (the script sets it when the user signs in). Added a placeholder `href="https://github.com/"` — functionally equivalent, satisfies the rule. Technically a `src/pages/` touch from Plantin, which the access matrix reserves for Granjon/Ortelius, but the auth PoC's authorship came from session 2's inline work and this is the same pattern (one-line a11y fix bundled into the ESLint-wiring commit that surfaced it). Noted for transparency.

**[GOTCHAS for future sessions]**

1. **`eslint-plugin-astro`'s jsx-a11y configs need `eslint-plugin-jsx-a11y` installed separately** — it's an implicit peer dep that the plugin doesn't declare in `package.json`. If you see `ConfigError: Config (unnamed): Key "plugins": Key "jsx-a11y": Expected an object`, install `eslint-plugin-jsx-a11y`.
2. **`size-limit`'s `path` globs fail hard on empty matches** — plan with care when adding budgets for file categories that don't exist yet. Either drop the budget or emit at least one file in the category before wiring it.
3. **`@size-limit/preset-app` reports brotli sizes, not gzip**, despite the plan's "(gzipped)" labels. Cosmetic mismatch; fix in Plan 4's retune pass.
4. **Windows Git Bash + `mkdir -p tests/e2e`** — works fine, but the plan's `printf '' > tests/e2e/.gitkeep` also works fine. No surprises here; mentioning because Windows-vs-Unix quirks come up often.
5. **Playwright browser install is slow (~60s)** and lands in `%USERPROFILE%\AppData\Local\ms-playwright\`, outside the repo. Not in `.gitignore` because it's outside the repo tree.

**[FACTS for next session]**

- **State on `main`:** seven green commits past session 3's scratchpad prune. `worker/package-lock.json` untracked (expected — sibling service, not part of Pages deploy).
- **Live site:** unchanged user-visible. P0 is pure dev-infrastructure — no runtime shipping difference.
- **`npm audit`:** now 11 moderate severity vulnerabilities (was 10 pre-P0 — one added by the P0 deps tree). Still deferred per session 2's wrap.
- **Node 20 deprecation warnings** still firing on GH Actions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `actions/configure-pages@v5`). Still deferred. June 2026 forced upgrade.

**[NEXT SESSION ENTRY POINT]** **Execute v1-foundation Phase 1** — the parse module via XP triple mode. Hard boundary vs P0: Phase 1 is real TDD code with red/green/refactor discipline, and Plantin's role flips from hands-on executor to orchestrator.

Startup sequence for P1:

1. Run the usual bigbook-startup skill (reads this file, the docs, the plan).
2. Read `docs/superpowers/plans/v1-foundation/p1-parse.md` end-to-end — seven TDD tasks, each one an acceptance criterion driven through Montano (RED) → Granjon (GREEN) → Ortelius (PURPLE).
3. **Check whether `~/.claude/teams/bigbook-dev/` already exists.** If yes, follow the team-reuse protocol from `common-prompt.md`: back up inboxes → delete team → `TeamCreate(team_name: "bigbook-dev")` → restore inboxes. If no, just `TeamCreate`.
4. Spawn Montano / Granjon / Ortelius with `run_in_background: true`, each using their roster prompt at `.claude/teams/bigbook-dev/prompts/<name>.md`, and the team_name parameter set.
5. Assign the first AC from `p1-parse.md` to Montano as a `TEST_SPEC` message (format in `common-prompt.md`).
6. Drive the cycle: wait for `CYCLE_COMPLETE` from Ortelius after each AC, then assign the next. Handle three-strike escalations if they come.

**[CONTEXT NOTE]** Session 4 ended at whatever-it-was (not measured at wrap time — the session was short, ~6 config commits plus some read-through). Fresh session for P1 is the explicit recommendation: XP triple produces high-volume cross-agent messaging, and the P0 config-wiring history is irrelevant to P1's algorithmic TDD work. Same pattern session 3 used.

(*BB:Plantin*)

## 2026-04-15 — Session 5, v1-foundation Phase 1 parse module

**[DONE]** Plan 1 / Phase 1 executed via XP triple mode (`TeamCreate(team_name: "bigbook-dev")` + Agent-tool spawn of montano/granjon/ortelius in this session). All seven TDD tasks closed across 13 commits, pushed to `origin/main`, CI run `24463378744` → success. Commits on `main` from f4a50a9:

```
717064b chore(parse): P1.7 — v8 ignore for defensive branches unreachable under strict indexing
084280e test(parse): P1.7 — cover missing-title branch
853a8d6 feat(parse): P1.7 GREEN — strict frontmatter field validation
6b57a39 test(parse): P1.7 RED — failing tests for strict frontmatter validation
7e806ff feat(parse): P1.6 GREEN — detect malformed ::para[] directives
c320d23 test(parse): P1.6 RED — failing tests for malformed directive
ed57e67 test(parse): P1.5 — missing frontmatter throws ParseError
a896319 test(parse): P1.4 — multi-line paragraph body joining
bd68b16 test(parse): P1.3 — multi-paragraph order preservation
9dbf441 feat(parse): P1.2 GREEN — ::para[id] directive parsing
e067cca test(parse): P1.2 RED — failing test for single directive
5c031e7 feat(parse): P1.1 GREEN — frontmatter-only parsing
20d5e12 test(parse): P1.1 RED — failing test for frontmatter-only parsing
```

Final shape of `src/lib/content/parse.ts`: 115 lines, three sections (types/exports, `parse()` + `parseFrontmatter`, `DIRECTIVE_RE` + `parseBody`), four `/* v8 ignore next */` annotations on unreachable defensive branches. Coverage: 100% stmts/funcs/lines, 96.29% branches (threshold 85%). 12 tests passing (1 pre-existing smoke test + 11 new parse tests).

**[DONE]** `shutdown-agent-tool-team` skill authored at `~/.claude/skills/shutdown-agent-tool-team/SKILL.md`. Sibling to the existing tmux-based `shutdown-team`. Documents the Agent-tool architecture: `TeamCreate` + `Agent`-spawn team created in an interactive Claude Code session, shut down via `shutdown_request` JSON protocol messages on mailboxes (not `tmux send-keys /exit`). Auto-registered and visible in the skills list during this session. First live exercise of the skill was this session's wrap — procedure worked end-to-end, no gaps found.

**[DECISION]** Plan 2/3/4 plan files remain unwritten. The explicit decision in session 3 was to write P2 *after* P1 lands so it can reference the actual shape of `parse.ts` as it exists rather than guess. That moment is now — session 6 begins with writing `p2-validate.md` before any TDD work, using the learnings from P1 (especially the v8+`noUncheckedIndexedAccess` pattern, see LESSONS #1 below) to shape the decomposition.

**[DECISION]** Per-phase context refresh confirmed as the right rhythm. Session 5 → session 6 break happens at the P1/P2 boundary, same as session 3 → session 4 did at P0/P1. XP triple produces high-volume cross-agent messaging + long CYCLE_COMPLETE writeups + escalation dialogs; a phase-boundary refresh keeps per-phase context tight and lets the startup skill rehydrate cleanly from the scratchpads.

**[LESSONS]** (grouped from the three agent scratchpads + my own observations)

1. **v8 coverage + `noUncheckedIndexedAccess` interact badly on regex capture groups.** TypeScript's strict indexing forces defensive `?? fallback` guards on `match[N]` because tsc cannot see the outer regex's guarantees about group presence. v8's branch counter treats the `??` right-hand side as an uncovered branch that no input can ever exercise. Four such dead branches in `parse.ts` dragged branch coverage to 81.48% on P1.7 close, below the 85% threshold. Ortelius correctly held the PURPLE_VERDICT rather than rejecting Granjon; I adjudicated via `/* v8 ignore next */` annotations (Option 3) in commit `717064b`. Three alternatives Ortelius flagged for future modules under `src/lib/content/`:
   - **String slicing over regex groups** where boundaries are known by position (`content.slice(a, b)` returns `string`, never `undefined`)
   - **Typed narrowing helpers** like `assertDefined(x, 'match[1]')` that throw on undefined — exchanges a dead branch for a reachable-in-principle throw that v8 doesn't flag the same way
   - **Destructure-and-check consolidation** — `const [, a, b] = match` then `if (a === undefined || b === undefined) throw`, consolidating to one place per match

   For P2 (`validate.ts`) and P3 (`diff.ts`), **catch this at plan-review time**, not via a second P1.7-style escalation. If the impl sketch uses `.match()` + capture groups, either flag it as structural guidance before the first GREEN cycle, or pre-build a small narrowing helper in `src/lib/content/` that both modules can share.

2. **Hold the verdict on spec gaps.** P1.7 produced a coverage failure that was neither Montano's nor Granjon's fault — the plan listed 2 test cases (missing chapter, unknown lang) but the impl prescribed 3 guards (chapter, title, lang). The `!title` branch was uncovered. Ortelius correctly held his PURPLE_VERDICT (rejection count 0) and escalated to me rather than rejecting Granjon-without-cause. Resolution: I dispatched Montano to write an adjunct regression test (missing title), then Granjon to add the v8 ignore annotations. Three-strike is an authority boundary signal for decomposition correctness, not a punishment vector — Ortelius read that correctly. Plan decomposition gaps are mine to own, not the XP triple's to absorb via rejection-based fallout.

3. **Regression-test pattern (P1.3/P1.4/P1.5).** A test that passes on first run because earlier cycles already delivered the behavior. My TEST_SPEC framing dropped the "RED" label in the commit subject, explicitly told Montano to expect PASS-on-first-run, and told her to forward a no-op GREEN handoff to Granjon who forwards a no-op to Ortelius. Worked smoothly — all three cycles closed in about 3 minutes each. Keep this framing for future regression cycles: name the pattern, set the expectation, and skip the "make it fail first" ceremony when it would be ceremony rather than verification.

4. **Line 50 `if (!m) continue` in `parseFrontmatter` is reachable but unexercised.** Ortelius's closing report WARNING: blank lines in a frontmatter block don't match `/^(\w+):\s*(.*)$/`, so the `!m` branch does fire on blank-line input — but the current fixtures don't include blank lines inside the frontmatter, so v8 sees that branch as only partially exercised. Not blocking because overall branch coverage sits at 96.29%, well above the 85% threshold. If P2 or a future test case adds a blank-frontmatter-line fixture, this branch closes on its own. Worth remembering so nobody wastes time adding a dedicated test for it.

5. **Multi-step instructions must be actioned in full per turn.** Granjon's self-pace gotcha: when I sent a complex multi-step instruction (the v8 ignore dispatch: edit → verify → commit → handoff), he processed the message and went idle without executing. I had to send a short poke message to kick him. Granjon's scratchpad captures the lesson on his side; consider adding "work through multi-step instructions to completion within the same turn, don't idle after reading" to the granjon role prompt if it recurs in P2.

6. **Montano's self-correction on unreachable branches.** She initially flagged 5 dead branches in her P1.7 escalation; 4 were genuinely dead, one (`!m` in `parseFrontmatter`) was reachable because blank lines in the frontmatter block don't match the per-line regex. I corrected her; her scratchpad records the self-correction ("check whether blank/empty string inputs can trigger the no-match arm"). Good discipline — surfaced the error for the next session's Montano to inherit.

**[FACTS for next session]**

- **CI run `24463378744`** — green, head SHA `717064b`. URL: https://github.com/mitselek/bigbook/actions/runs/24463378744
- **Live site** unchanged — Phase 1 was pure lib addition, no Astro-facing files touched, `dist/` output identical.
- **Parse module shape:** `src/lib/content/parse.ts` exports `ChapterFrontmatter`, `ParsedChapter`, `ParseErrorCategory`, `ParseError`, and `parse(content: string): ParsedChapter`. These are the public surface P2's `validate.ts` will consume.
- **Team state:** `bigbook-dev` team exists at `~/.claude/teams/bigbook-dev/`. Inboxes persist. Scratchpads for montano/granjon/ortelius/plantin all written this session. Per common-prompt team-reuse protocol, session 6's startup should back up inboxes → delete team → `TeamCreate` → restore inboxes before spawning P2.
- **The `shutdown-agent-tool-team` skill** now exists at `~/.claude/skills/shutdown-agent-tool-team/SKILL.md` for future phase-boundary refreshes.
- **Open deferrals still unresolved (carried from earlier sessions):**
  - `legacy-guard` lefthook pre-commit hook (deferred since session 2 due to Windows Git Bash shell-escaping issue). Treat `legacy/` as off-limits by convention.
  - Real auth ADR at `docs/decisions/0001-auth.md` (deferred from session 2 auth PoC)
  - `npm audit` 11 moderate advisories (from Astro scaffold + P0 deps)
  - Node 20 → 24 GH Actions migration (waiting on upstream action versions, June 2026 deadline)

**[NEXT SESSION ENTRY POINT]** **Write `docs/superpowers/plans/v1-foundation/p2-validate.md`, then execute it** via XP triple mode.

Startup sequence for session 6:

1. Run `bigbook-startup` skill — reads this scratchpad, the common-prompt, the three docs snapshots, the roster.
2. Verify state from this wrap: CI green on `717064b`, 13 commits pushed, scratchpads committed.
3. Read `docs/superpowers/plans/v1-foundation/README.md` and the existing `p1-parse.md` for the pattern. Note that P2, P3, P4 are NOT yet written.
4. **Before writing `p2-validate.md`:** read LESSONS #1 above (v8 + `noUncheckedIndexedAccess`). Structure P2's impl sketch to avoid regex capture groups in favor of string slicing or narrowing helpers where possible. If capture groups are unavoidable, pre-approve the `/* v8 ignore next */` pattern in the plan rather than discovering it via escalation.
5. Write `p2-validate.md` with its TDD tasks (pattern from `p1-parse.md`'s 7 tasks, but smaller scope — validate is `(en: ParsedChapter, et: ParsedChapter) => ValidationResult` kind of shape; smaller behavior set than parse).
6. Follow the session 3 discipline: spec section first, then TDD tasks with exact code blocks and commit commands.
7. After `p2-validate.md` lands on `main`, start Phase 2 execution via the XP triple protocol. Apply the team-reuse (back up inboxes → delete team → recreate → restore inboxes) if session 6's Plantin spawns a fresh team.

**[CONTEXT NOTE]** Session 5 wrapped via the new `shutdown-agent-tool-team` skill's procedure (scratchpad-and-closing-report dispatch → verify scratchpads on disk → `shutdown_request` protocol → team-lead writes own scratchpad → memory commit → push → user clears for session 6). First live exercise of the skill; procedure worked cleanly end-to-end.

(*BB:Plantin*)

## 2026-04-15 — Session 6, v1-foundation Phase 2 + Phase 3

**[CORRECTION to session 5 scratchpad]** Session 5's `[NEXT SESSION ENTRY POINT]` said "Write `p2-validate.md`, then execute it" — but `p2-validate.md` already existed, written in session 3 at commit `0ece9bf` alongside `p3-diff.md` / `p4-bootstrap.md` / `p5-hooks.md` / `p6-land-content.md`. Session 5 confused **Plans 2/3/4** (top-level milestones: v1-reader, v1-editor, v1-ship — those are genuinely unwritten) with **Phases P2/P3/P4** (within the v1-foundation plan — all already drafted). Session 6 caught the confusion at startup, verified the plan files exist, and proceeded to execute P2 and P3 directly.

**[DONE]** Both Phases 2 and 3 executed via XP triple mode (`TeamCreate(team_name: "bigbook-dev")` + Agent-tool spawn of montano/granjon/ortelius). 11 + 1 commits total across this session, all pushed to `origin/main`, CI runs `24465891574` (P2 + `.gitattributes`) and `24466449160` (P3) both green. Final head: `b6ed6df`.

Phase 2 commit chain (`800a4c1` → `9544aee`, 7 commits):
- `800a4c1 test(validate): P2.1 RED — validatePair happy path`
- `62662d7 feat(validate): module scaffold + validatePair happy path`
- `c95d4b0 test(validate): P2.2 — lock in missing_pair, extra_pair, and both`
- `90348f4 test(validate): P2.3 RED — validateProposedContent parse success + parse error`
- `02ed8e4 feat(validate): validateProposedContent for editor pre-flight`
- `e329678 refactor(validate): extract collectMissing helper for symmetric two-loop bodies`
- `9544aee test(validate): lock in reference id set mismatches`

Plus the infra commit between phases: `40bcc1f chore(git): add .gitattributes enforcing LF eol for text files`.

Phase 3 commit chain (`55b215f` → `b6ed6df`, 4 commits):
- `55b215f test(diff): P3.1 RED — identical chapters return empty Set`
- `202075e feat(diff): module scaffold + identical-chapters empty result`
- `041ff9c test(diff): confirm single-paragraph divergence detection`
- `b6ed6df test(diff): lock in multiple-change and permissive-id-set behavior`

**Final state of `src/lib/content/` at session 6 close:**
- `parse.ts` — 115 lines, 100% stmts/funcs/lines, 96.29% branches (unchanged from session 5)
- `validate.ts` — 88 lines, 2 public functions (`validatePair`, `validateProposedContent`) + 2 private helpers (`collectMissing`, `toResult`), 97.14% lines, 94.11% branches
- `diff.ts` — 23 lines, 1 public function (`diffCurrentVsBaseline`), 100% everything

26/26 tests green across the three modules + the smoke test. Three of v1-foundation's four core pure-lib modules are now landed (parse / validate / diff). The only primitive left is `baseline-config.ts`, which lands in P6 as a two-line constant emitted by the bootstrap script.

**[DECISION]** Pipeline serialization discipline tightened after a P2.2 race condition. When Montano's P2.2 self-report came back to me as team-lead, I dispatched P2.3's TEST_SPEC immediately without waiting for Ortelius's PURPLE verdict on P2.2 to close. Ortelius correctly flagged this during his P2.2 gate run — he saw Montano's uncommitted P2.3 RED work in the tree, which would have contaminated his verdict if P2.2 had had any substance. He handled it cleanly (verified P2.2 from the commit diff alone, accepted on merits, escalated the process concern in parallel — applying his session-5 rule "don't block the verdict when the upstream issue is process not spec"). My corrective rule from here on: **wait for explicit CYCLE_COMPLETE from Ortelius before dispatching the next TEST_SPEC to Montano, every time, even for regression-only cycles**. This rule was applied consistently from P2.3 onward and there were no further races.

**[DECISION]** Regression-cycle ceremony matters for visibility. When Montano closed P2.2 she initially reported directly back to me, bypassing the no-op GREEN/PURPLE handoff chain. I corrected mid-session: **every cycle — even regression-only ones — flows RED → GREEN (no-op) → PURPLE (no-op) → back to team-lead**, because the chain is how Granjon and Ortelius learn which ACs have closed. Bypassing it leaves them stale. She backfilled a retroactive no-op DM to Granjon for P2.2 and applied the rule cleanly for P2.4, P3.2, P3.3. Worth preserving so session 7's Montano inherits the rule from the scratchpad rather than discovering it via correction.

**[DECISION]** `.gitattributes` infra commit landed between P2 exit and P3 start. Ortelius flagged the CRLF / `git stash pop` trap during his P2.3 PURPLE refactor (his first commit attempt was blocked by the prettier hook because an earlier stash operation had silently converted `validate.ts` from LF to CRLF on a Windows Git Bash host with `core.autocrlf=true`). He correctly escalated rather than writing `.gitattributes` himself (outside PURPLE scope). I landed the fix as `40bcc1f` with 13 extension-scoped `text eol=lf` entries (covering everything prettier touches), deferred until after P2 exit so it wouldn't contaminate P2.4's clean-tree baseline for Ortelius's phase-exit gate run. Phase 3 PURPLE was cleaner on this dimension.

**[DECISION]** No PURPLE refactor between `validate.ts` and `diff.ts`. Both modules iterate `ParsedChapter.paragraphs` maps, both return collections driven by per-id comparisons — but Ortelius explicitly decided NOT to extract shared infrastructure. Different semantics (set-difference vs text-equality-comparison), and `collectMissing`'s signature is `ValidationError`-typed; generalizing to "iterate and collect differences" would turn a focused helper into an abstract combinator. His rule: **if a third call site emerges in P4/P5 and two of the three look like the same shape, revisit. Not before.** Correct call — small focused modules are the design intent.

**[DECISION]** Hold-then-refactor as the active form of "nothing to do here is valid". Ortelius flagged the `validatePair` two-loop duplication after P2.1 but did NOT refactor — held through P2.2 (regression, no new code), then extracted `collectMissing` + `toResult` at P2.3 close when the fourth duplicated loop body arrived. One informed refactor instead of two speculative ones. The general rule: **when you see duplication at cycle N, note it but hold until cycle N+K reveals whether the shape is real or incidental**. This is the active discipline form of the session-5 default rule "nothing to do here is valid"; recorded in Ortelius's scratchpad as a named pattern.

**[DECISION]** Session 6 wrapped at Phase 3 close, not continued into Phase 4. Three reasons: (a) Phase 3 closes the pure-lib content primitives (parse + validate + diff), clean natural boundary; (b) Phase 4 is different in character — `scripts/` directory + `legacy/assets/*.pdf` read surface + Claude API integration + eventual `src/content/` write path — and needs a plan-review pass before dispatch; (c) session-5 established per-phase context refreshes as the right rhythm. PO confirmed. `shutdown-agent-tool-team` skill ran cleanly for the second time.

**[GOTCHA]** The P2.3 plan file has a latent `noUncheckedIndexedAccess` trap at its literal code block: `expect(result.errors[0].category).toBe('parse_error')` is a TS18048 under strict indexing. I flagged this to Montano in the P2.3 TEST_SPEC and she landed the fix in the RED commit without a typecheck bounce (she used `toMatchObject` to match the P2.2 style). The plan file itself still has the trap in its snippets — if session 7 or later revisits P2 for any reason (bug fix, refactor), either update the plan file or dispatch with the same heads-up. `p3-diff.md` has no equivalent trap because its tests use `Set` equality, not indexed property access.

**[GOTCHA]** At P2.3 close, global `npm run test:coverage` reported 88.07% lines — below the 90% threshold. This was NOT a defect: the plan had Granjon pre-implement the full `validateProposedContent` body (including the reference-id mismatch loops) in P2.3, with P2.4's regression tests covering those branches. The coverage gap was temporal. Ortelius correctly did NOT block on it, and P2.4's three tests brought the number back to 97.14% at phase exit. **Coverage thresholds gate at phase exit, not mid-phase.** Granjon's session-6 scratchpad records this as the "plan pre-implementation is a legitimate pattern" rule — he can over-implement with confidence in P4 when the plan calls for it.

**[GOTCHA]** `validate.ts` lines 67-68 are uncovered at phase exit — the `throw err` rethrow inside the `catch (err)` block in `validateProposedContent`, which catches non-`ParseError` throws from `parse()`. Today `parse()` only throws `ParseError`, so the branch is structurally unreachable. Ortelius explicitly declined to add `/* v8 ignore next */` annotations (the session-5 pattern preference is "string slicing > narrowing helpers > destructure-and-check > v8 ignore", and in this case the branch is defensive against a broader API surface than parse's internal use). Coverage clears the 85% branch threshold by a margin, so no ignore is needed. If Phase 4's bootstrap script or Phase 5's hooks introduce a non-`ParseError` thrower through `parse()`, this branch becomes reachable and the rethrow is already correct.

**[FACTS for next session]**

- **Head of `main`:** `b6ed6df` (Phase 3 close). CI run `24466449160` in progress at session wrap; Phases 2 CI `24465891574` and `.gitattributes` push CI both confirmed green. Expect Phase 3 CI to match.
- **Commits pushed this session:** 11 Phase-work commits + 1 `.gitattributes` infra commit = 12 total, all on `main`.
- **`src/lib/content/`** now has three pure-lib modules (`parse.ts`, `validate.ts`, `diff.ts`) + no `manifest.ts`/`baseline-config.ts` yet (those emit in P6).
- **`p2-validate.md` and `p3-diff.md` are done.** `p4-bootstrap.md`, `p5-hooks.md`, `p6-land-content.md` are written (session 3, commit `0ece9bf`) but not yet executed. The README's execution-mode table says P4 = XP triple (pure helpers), P5 = inline (shell scripts + one Node hook), P6 = inline (Plantin runs bootstrap with `CONTENT_BOOTSTRAP=1`).
- **`.gitattributes` is live** at repo root enforcing `eol=lf` for 13 extensions. Future XP cycles should not hit the CRLF trap again unless a tracked file needs `git add --renormalize .`.
- **Team state:** `~/.claude/teams/bigbook-dev/` exists from this session's `TeamCreate`. Per common-prompt team-reuse protocol, session 7's startup should back up inboxes → delete team → `TeamCreate` → restore inboxes before spawning P4's XP triple.
- **Open deferrals still unresolved:**
  - `legacy-guard` lefthook hook (deferred since session 2 — Windows Git Bash shell-escaping; treat `legacy/` as off-limits by convention). Phase 5 is where this finally gets restored as part of `scripts/legacy-guard.sh`.
  - Real auth ADR at `docs/decisions/0001-auth.md` (deferred from session 2 auth PoC).
  - `npm audit` 11 moderate advisories (Astro scaffold + P0 deps tree).
  - Node 20 → 24 GH Actions migration (waiting on upstream action versions, June 2026 deadline).
  - Plans 2/3/4 plan files (genuinely — the top-level milestones v1-reader, v1-editor, v1-ship, not the v1-foundation phase files). These land AFTER v1-foundation completes in P6.
- **v1-foundation status:** P0 ✓, P1 ✓, P2 ✓, P3 ✓. Halfway. Remaining: P4 (bootstrap), P5 (hooks), P6 (land content + baseline SHA).

**[NEXT SESSION ENTRY POINT]** **Review `docs/superpowers/plans/v1-foundation/p4-bootstrap.md` with Ortelius's scope flag in mind, then execute it via XP triple mode.**

Startup sequence for session 7:

1. Run `bigbook-startup` skill — reads this scratchpad, common-prompt, docs snapshots, roster.
2. Verify state from this wrap: CI green on `b6ed6df`, 12 session-6 commits pushed, all three agent scratchpads committed.
3. Read `docs/superpowers/plans/v1-foundation/README.md` execution-mode table and `docs/superpowers/plans/v1-foundation/p4-bootstrap.md` end-to-end (7 tasks per the README). **Validate the XP-triple scope:** pure helpers only (markdown parse, Claude API call with mocked transport, output formatting), NOT the orchestrator's one-shot `src/content/{en,et}/` write. The orchestrator runs inline in P6 with `CONTENT_BOOTSTRAP=1`, not through the XP triple. If the plan file doesn't cleanly separate helpers from orchestrator, update it before dispatch.
4. Check whether `~/.claude/teams/bigbook-dev/` still exists (it should, from session 6's `TeamCreate`). If yes, follow the team-reuse protocol: back up inboxes → delete team → `TeamCreate(team_name: "bigbook-dev")` → restore inboxes. If no, just `TeamCreate`.
5. Spawn Montano / Granjon / Ortelius with their roster prompts + a session-7 startup task. Each agent should read their own scratchpad first — the session-6 entries written today carry the pipeline-serialization rule (Montano), the coverage-gate-at-phase-exit rule (Granjon), and the hold-then-refactor pattern + P4 scope flag (Ortelius).
6. Assign P4's first AC to Montano as TEST_SPEC. Apply the **wait-for-explicit-CYCLE_COMPLETE** serialization discipline locked in during session 6.
7. Drive the cycle. P4 has 7 tasks — longer than P2 (4) or P3 (3). Expect more real RED/GREEN/PURPLE work than P3 had, because helpers for markdown parsing and API mocking have more structural surface than `diff.ts` did.

**[CONTEXT NOTE]** Session 6 wrapped via the `shutdown-agent-tool-team` skill's procedure — second live exercise since the skill was authored in session 5. Procedure worked cleanly end-to-end again: scratchpad-and-closing-report dispatch → verify scratchpads on disk (all three modified, sizes 5213/6517/16207 bytes) → `shutdown_request` protocol → three `shutdown_approved` responses → team-lead writes own scratchpad → memory commit → push → user clears for session 7. No gaps found.

(*BB:Plantin*)
