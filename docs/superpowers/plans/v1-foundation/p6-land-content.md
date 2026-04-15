# v1-foundation · Phase 6: Land the content

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this phase task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Plan overview:** [v1-foundation/README.md](./README.md)
**Tracking issue:** [#3 — Epic: v1-foundation](https://github.com/mitselek/bigbook/issues/3)
**Design spec:** [Discussion #2](https://github.com/mitselek/bigbook/discussions/2) · [committed spec](../../specs/2026-04-14-bigbook-reader-design.md)
**Prerequisites:** [P5 — Pre-commit hooks](./p5-hooks.md) committed + pushed to `origin/main`
**Commit convention:** every commit in this phase has `Part of #3` in the body. **The final commit of this phase uses `Closes #3`** — it's the last commit of the v1-foundation milestone.

Run the bootstrap script end-to-end, produce the mock content tree, and land it in two sequential commits:

1. **Commit A — content**: `src/content/en/*.md`, `src/content/et/*.md`, and `src/lib/content/manifest.ts`. Committed with `CONTENT_BOOTSTRAP=1` set in the environment so the content-guard hook allows it.
2. **Commit B — baseline constant**: `src/lib/content/baseline-config.ts` containing `export const BASELINE_COMMIT_SHA = '<commit A SHA>'`. Committed without any env vars; it's pure metadata.

The reader in Plan 2 will fetch `src/content/et/*.md` at runtime from `raw.githubusercontent.com/mitselek/bigbook/main/...` (current) and from `raw.githubusercontent.com/mitselek/bigbook/<BASELINE_COMMIT_SHA>/...` (baseline). Commit A is the baseline the reader diffs against; commit B points at it.

**Files touched in Phase 6:**

- Create: `src/content/et/*.md` (~20 files, via script)
- Create: `src/content/en/*.md` (~20 files, via script)
- Create: `src/lib/content/manifest.ts` (via script)
- Create: `src/lib/content/baseline-config.ts` (manually written in P6.4)

---

## Task P6.1: Run the bootstrap script

Execute the script locally with real credentials. The script walks the legacy tree, calls the Claude API, and writes the generated files into `src/content/{en,et}/` and `src/lib/content/manifest.ts`. It does not commit anything — that's P6.3 and P6.4.

**Files:**

- Create: `src/content/et/*.md`, `src/content/en/*.md`, `src/lib/content/manifest.ts` (via script)

- [ ] **Step 1: Verify the environment**

Confirm `CLAUDE_API_KEY` is available. It should be in your shell environment or in a local `.env` file that you source into the shell. Never commit the key.

```bash
echo "CLAUDE_API_KEY length: ${#CLAUDE_API_KEY}"
```

Expected: non-zero length. If empty, export it:

```bash
export CLAUDE_API_KEY='<your-key>'
```

The API key is billed per token used. The v1 mock content is roughly 20 chapters × ~30 paragraphs × ~80 tokens ≈ 48,000 input + output tokens total. At `claude-opus-4-6` rates this is a small spend (pennies), well under any token budget.

- [ ] **Step 2: Run the script**

```bash
CONTENT_BOOTSTRAP=1 npm run bootstrap:content
```

Expected output (approximate — actual chapter count varies):

```
processing legacy/peatykid/billi-lugu.md → billi-lugu
  wrote /c/.../src/content/et/billi-lugu.md
  wrote /c/.../src/content/en/billi-lugu.md
processing legacy/peatykid/on-olemas-lahendus.md → on-olemas-lahendus
  ...
wrote /c/.../src/lib/content/manifest.ts
processed 20 chapters
```

Total runtime: **5-15 minutes** (dominated by Claude API calls — one per paragraph, sequential).

- [ ] **Step 3: Inspect a sample**

Open one of the generated Estonian files and its English counterpart side by side:

```bash
cat src/content/et/billi-lugu.md | head -30
cat src/content/en/billi-lugu.md | head -30
```

Expected shape — the two files have the same `para-id`s, the ET side has the transcribed Estonian text, the EN side has the Claude-generated English translation. Both start with the frontmatter block and use `::para[]` directives.

Open `src/lib/content/manifest.ts` and confirm it's a valid TypeScript module with the expected `CHAPTERS` array, bilingual titles, and para-id lists.

- [ ] **Step 4: Note any issues**

Common issues to watch for:

- **Rate limiting** — Claude API may throttle on burst. If you see HTTP 429, add a 1-second sleep between paragraph calls in `translateWithChris`. Commit that fix separately before re-running.
- **Translation quality** — the Claude-generated English is a starting point, not canonical. Mock content quality is acceptable as long as the shape is valid. Real PDF-extracted content replaces the mock in v3.
- **Files with no paragraphs** — the script logs `skip: <file> has no paragraphs after stripping` and moves on. Check the log for skipped files and decide case-by-case whether to manually add content or leave the chapter out.
- **Hard Invariant violations** — the script runs `validatePair` before writing each chapter pair. If any fail, it exits with code 2 and prints the violations. This almost always means a paragraph was split differently between ET and EN — investigate, fix the prompt, re-run.

- [ ] **Step 5: Do not commit yet**

The files are now in the working tree but not staged. Keep them as-is for P6.2.

No commit for this task.

## Task P6.2: Manually validate and test against the generated content

Before committing, verify the generated tree against Phase 1-3 modules + the hard-invariant hook.

- [ ] **Step 1: Run the full test suite**

```bash
npm run test
```

Expected: all tests passing. Tests now run against mock-content fixtures if any tests use real content paths, but the existing tests use inline strings so they should pass regardless.

- [ ] **Step 2: Run the coverage gate**

```bash
npm run test:coverage
```

Expected: `src/lib/content/` (parse, validate, diff) at ≥90% lines/functions/statements.

- [ ] **Step 3: Run typecheck against the new `manifest.ts`**

```bash
npm run typecheck
```

Expected: exit 0. If `manifest.ts` has TypeScript errors (unknown type, unquoted string containing a single quote, etc.), the script's emitter has a bug — investigate in `scripts/bootstrap-mock-content.mjs` emitter and re-run P6.1.

- [ ] **Step 4: Dry-run the hard-invariant hook against the new content**

```bash
# Fake a staged list including one of the generated files
npx tsx scripts/hard-invariant.mjs src/content/et/billi-lugu.md src/content/en/billi-lugu.md
```

Expected: exit 0, no output (or just a summary). If it reports violations, something went wrong in P6.1 — re-run after fixing.

No commit for this task.

## Task P6.3: Commit A — content + manifest

**Files:**

- All generated files under `src/content/{en,et}/` and `src/lib/content/manifest.ts`

- [ ] **Step 1: Stage the content tree**

```bash
git add src/content/et src/content/en src/lib/content/manifest.ts
```

- [ ] **Step 2: Verify only the intended files are staged**

```bash
git status
```

Expected: only new files under `src/content/et/`, `src/content/en/`, and `src/lib/content/manifest.ts`. Nothing else modified.

- [ ] **Step 3: Commit with `CONTENT_BOOTSTRAP=1`**

```bash
CONTENT_BOOTSTRAP=1 git commit -m "$(cat <<'EOF'
content: mock bootstrap from legacy ET + auto-translated EN

Generated by scripts/bootstrap-mock-content.mjs on 2026-04-15.
Estonian text scraped from legacy/{peatykid,kogemuslood,lisad,
front_matter}/, para-ids assigned (<slug>-title, <slug>-pNNN),
English text generated by claude-opus-4-6 per paragraph.

This commit is the baseline for src/lib/content/baseline-config.ts,
which lands in the next commit pointing at this commit's SHA.
The v1 reader fetches current ET from main and baseline ET from
this SHA (SHA-pinned, immutable) to compute the marginalia
baseline-diff annotations.

Mock content quality is a starting point, not canonical. Real
PDF-extracted content replaces it in v3.

CONTENT_BOOTSTRAP=1 in the environment so content-guard allows this
commit per design-spec §3.8.

Part of #3
(*BB:Plantin*)
EOF
)"
```

Expected: lefthook runs. `legacy-guard` passes (no legacy/ staged). `content-guard` passes because `CONTENT_BOOTSTRAP=1` is set. `hard-invariant` runs `validatePair` against every touched chapter and exits 0 (the bootstrap script already validated before writing). `typecheck` + `eslint` + `prettier` all pass. Commit lands on `main`.

- [ ] **Step 4: Record the commit SHA**

```bash
git log -1 --format=%H
```

Copy this SHA — you'll paste it into `baseline-config.ts` in the next task. Also save the short SHA (`git log -1 --format=%h`) for the commit message.

## Task P6.4: Commit B — baseline SHA constant (Closes #3)

**Files:**

- Create: `src/lib/content/baseline-config.ts`

- [ ] **Step 1: Create `src/lib/content/baseline-config.ts`**

Paste the commit A SHA you recorded in the previous task. Replace the `<COMMIT_A_SHA>` placeholder below with the actual 40-character SHA.

New file content:

```ts
// Generated by the v1-foundation plan, Phase 6 task P6.4 — do not edit by hand.
// Regenerate by running the content bootstrap and pointing this constant at
// the resulting content commit's SHA.
//
// This SHA pins the "baseline" content that the reader diffs against at
// runtime. Current ET is fetched from raw.github @ main; EN and baseline ET
// are fetched from raw.github @ this SHA (immutable, CDN-cached forever).
//
// When v3 lands real PDF-extracted content via a new content bootstrap,
// update this constant to the new commit's SHA and the reader transparently
// switches over on the next shell deploy.

export const BASELINE_COMMIT_SHA = '<COMMIT_A_SHA>'
```

Replace `<COMMIT_A_SHA>` with the actual SHA. Example (yours will be different):

```ts
export const BASELINE_COMMIT_SHA = 'a1b2c3d4e5f6789012345678901234567890abcd'
```

- [ ] **Step 2: Verify it typechecks**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 3: Commit with `Closes #3`**

```bash
git add src/lib/content/baseline-config.ts
git commit -m "$(cat <<'EOF'
content: pin baseline SHA to <short-sha>

Pins BASELINE_COMMIT_SHA to the commit that landed the mock content
tree under src/content/{en,et}/ and src/lib/content/manifest.ts.
The reader fetches EN and baseline ET from raw.github at this SHA
(immutable, CDN-cached forever) while current ET is fetched from
main (5-min cache window) so user edits propagate without rebuilds.

Closes the v1-foundation milestone. Plan 2 (v1-reader) picks up
from here.

Closes #3
(*BB:Plantin*)
EOF
)"
```

Replace `<short-sha>` in the first line with the actual short SHA (7 chars). Example: `content: pin baseline SHA to a1b2c3d`.

Expected: lefthook runs. `content-guard` passes (the file is under `src/lib/content/`, not `src/content/`, so the guard doesn't apply). `hard-invariant` passes (no `src/content/` files touched). `typecheck` + `eslint` + `prettier` all pass.

- [ ] **Step 4: Push both commits to origin**

```bash
git push origin main
```

Expected: both commits (A and B) land on `origin/main`. GitHub processes the `Closes #3` trailer and closes the tracking issue automatically. The milestone `v1-foundation` auto-closes when its last open issue (#3) closes.

The `build-and-deploy.yml` workflow runs against the new main. Astro build passes (no shell source changes). Pages deploy is unchanged — the content lives in the git tree but the reader doesn't read it at build time; it's fetched at runtime in Plan 2.

- [ ] **Step 5: Verify the milestone and issue closed**

```bash
gh issue view 3 --json state,closedAt,milestone
gh api repos/mitselek/bigbook/milestones/1 --jq '.state'
```

Expected: `#3 state: CLOSED`, milestone state: `closed`. The `/milestones` page shows v1-foundation at 100% with v1-reader as the next active one.

---

## Phase 6 exit check — v1-foundation complete

- [ ] **Commit A landed on `main` with `CONTENT_BOOTSTRAP=1`**
- [ ] **Commit B landed on `main` with `Closes #3`**
- [ ] **Issue #3 closed**
- [ ] **Milestone v1-foundation closed**
- [ ] **`npm run test` green against the mock content tree**
- [ ] **`npm run test:coverage` green at ≥90% for `src/lib/content/`**
- [ ] **`npm run typecheck` green**
- [ ] **`npm run lint` green**
- [ ] **`npm run build` green (Astro shell still builds; content is runtime-fetched in Plan 2)**
- [ ] **Pages deploy succeeded for the shell (unchanged from P5 state)**

**What exists in the repo now:**

- Full pure-lib foundation: `parse`, `validate`, `diff`, `manifest`, `baseline-config`
- Mock content under `src/content/{en,et}/` with all Hard Invariant checks passing
- Three upgraded lefthook hooks: `legacy-guard`, `content-guard`, `hard-invariant`
- All new dev infrastructure: Svelte 5, a11y lint, Playwright scaffold, size-limit stub
- Two-commit baseline-capture pattern proven end-to-end

**What does NOT exist yet:**

- Any component under `src/components/` (Plan 2)
- Any runtime fetch machinery (Plan 2)
- The reader UI or lazy loading (Plan 2)
- The inline editor (Plan 3)
- The marginalia baseline-diff rendering (Plan 2 puts the scaffold in place; it uses `src/lib/content/diff.ts` from Phase 3)

**Next milestone:** [v1-reader](https://github.com/mitselek/bigbook/milestone/2) — tracked under issue [#4](https://github.com/mitselek/bigbook/issues/4). Its plan file (`v1-reader/README.md` + phase files) is written after this milestone closes, so Plan 2 can reference the actual shape of `parse.ts` / `validate.ts` / `diff.ts` / `manifest.ts` / `baseline-config.ts` as they landed.

(_BB:Plantin_)
