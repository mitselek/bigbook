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
