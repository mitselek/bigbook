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
- **GitHub App Client Secret:** **NOT recorded in any durable location**. It was pasted in chat once and uploaded to the Cloudflare Worker via `wrangler secret put`. It lives only in Cloudflare's secret store from here on. **Rotate it at the first opportunity in the next session** (GitHub App settings → Generate a new client secret → `wrangler secret put GITHUB_CLIENT_SECRET` via stdin pipe to overwrite).
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

1. **Rotate the leaked client secret** (security cleanup, blast-radius reduction).
2. **Write the real auth ADR** at `docs/decisions/0001-auth.md`. The PoC *is* the production shape, minus the ADR artefact. Capture what was ruled out (pure static, device flow) and why (lessons 1-3 above).
3. **Restore the `legacy-guard` lefthook hook** — move logic to `scripts/legacy-guard.sh` and invoke via `bash` (option 1 from the earlier deferral). Small, self-contained.
4. **Node 20 deprecation warnings** on GH Actions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`, `actions/configure-pages@v5`). GitHub is forcing Node 24 in June 2026. Upstream action versions for Node 24 not yet available at time of session 2; recheck in a month or two.
5. **`npm audit` reports 10 moderate-severity advisories** in the fresh Astro scaffold. Triage separately.
6. **Chat history cleared at end of session 2.** Next session starts without the chat context of how we got here. This scratchpad + the plan file at `~/.claude/plans/sparkling-gliding-knuth.md` + commits 0dcfa0f..29e8a1d are the full record.

**[NEXT SESSION ENTRY POINT]** Product brainstorm. The entire workdir + deploy + auth infrastructure is now in place. The question that opens session 3 is: *"what does the bilingual reader actually look like, feel like, and do?"* No code to write before that conversation happens — the next session should start with the brainstorming skill, not with implementation.

**[UNADDRESSED from session start]** The PO asked at the top of session 2 for "higher-level workdir decisions, then brainstorm a product." The workdir decisions turned into a full plan + four-commit restructure, then the auth PoC was added on top. The product brainstorm is still the unsatisfied ask — pick it up first thing in session 3.

(*BB:Plantin*)

## 2026-04-15 — Session 3, full brainstorm → spec → plan landed

**[DONE]** PO confirmed at session start that the leaked client secret from session 2 was rotated. (Acknowledged but not verified on my end — trusting PO's word.)

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

**[NEXT SESSION ENTRY POINT]** **Execute v1-foundation Phase 0** — task #7. Two execution choices per the writing-plans skill:

1. **Subagent-driven** (recommended) — fresh subagent per task, two-stage review between. Use `superpowers:subagent-driven-development`.
2. **Inline** — execute tasks in the main session with checkpoints. Use `superpowers:executing-plans`.

P0 is config-only (no TDD), so inline execution might feel cleaner for that phase specifically — six small commits in sequence. P1 onwards is TDD-heavy and benefits from subagent isolation.

The plan file at `docs/superpowers/plans/v1-foundation/p0-infrastructure.md` has every command, every code block, every commit message — an executor needs nothing else. Issue #7 holds the high-level task list; the plan file holds the per-step instructions.

**[CONTEXT NOTE]** Session 3 ended at ~54% context used (mostly the long plan-writing dialogue). PO suggested handover-via-scratchpad and a fresh session for execution. This entry IS that handover; no separate tmp file needed.

(*BB:Plantin*)
