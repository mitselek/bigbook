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

**[WIP]** PO requested GitHub auth PoC on the scaffolding page. This is out of scope for the current workdir restructure plan and will land in commit 5 as a separate change. Needs: a registered GitHub OAuth App with PKCE enabled, redirect URI pointing at `https://mitselek.github.io/bigbook/auth/callback/`, and the public client ID from the PO.

**[DEFERRED]** `legacy-guard` lefthook pre-commit hook (blocks staged diffs under `legacy/` unless `LEGACY_OVERRIDE=1`). Hit a shell-escaping issue when running the multi-step guard through lefthook -> sh -c on Windows Git Bash (`staged: -c: line N: syntax error: unexpected end of file`). Until it is restored, treat `legacy/` as off-limits by convention. Options to revisit: (1) move logic to `scripts/legacy-guard.sh` and invoke via `bash scripts/legacy-guard.sh`, (2) use `bash -c` explicitly, (3) implement as a GitHub Actions check.

**[DEFERRED]** `WORKFLOW.md` and `docs/spec.md`. The new product spec will be written during the product brainstorm that follows this restructure.

**[NEXT]** Commit 5 = GitHub auth PoC (per PO request). Then: product brainstorm.

(*BB:Plantin*)
