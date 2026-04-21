# Bootstrap idempotency implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `CONTENT_BOOTSTRAP=1 npm run bootstrap` idempotent — a second consecutive run on a clean tree produces zero diff.

**Architecture:** Add an in-process Prettier format pass at the end of the generator (`format.ts` helper invoked by `bootstrap.ts`). Drop `generatedAt` from the manifest (the single remaining non-Prettier source of drift, unused by any consumer). Commit the one-shot normalization of 134 markdown files + manifest.json + manifest.ts as the fixed-point tree state. Add a regression test that runs the generator and asserts diff-empty.

**Tech Stack:** Node 22, TypeScript, Vitest, Prettier 3.x, tsx, lefthook.

**Spec:** `docs/superpowers/specs/2026-04-20-bootstrap-idempotency-design.md`

**Team:** Plantin (lead) dispatches one-shot subagents per task. Montano for `tests/`, Granjon for `scripts/` + `src/`, Ortelius for final review. No persistent team.

**Issue:** [#41](https://github.com/mitselek/bigbook/issues/41) — close when merged.

---

## Pre-flight

- [ ] **Step 0.1: Verify clean starting state**

Run:

```bash
git status
git log -1 --oneline
```

Expected: clean tree on `main`, tip at `dbacc7e` (the spec commit) or later.

- [ ] **Step 0.2: Reproduce the non-idempotency once**

Run:

```bash
CONTENT_BOOTSTRAP=1 npm run bootstrap
git diff --stat src/content/ src/lib/content/manifest.ts | tail -3
git checkout -- src/content/ src/lib/content/manifest.ts
git status
```

Expected: 137 files changed after `bootstrap`, clean tree after `checkout`. Confirms the baseline bug and the reset pattern used in the idempotency test later.

---

## Task 1: Add `format.ts` helper + unit test

**Goal:** A standalone, unit-tested module that formats a file in place using Prettier's Node API. Not yet wired into the generator.

**Files:**

- Create: `scripts/bootstrap-content/format.ts`
- Create: `tests/scripts/bootstrap-content/format.test.ts`

### 1.1 RED — Montano

- [ ] **Step 1.1.1: Dispatch Montano to write the failing test**

Create `tests/scripts/bootstrap-content/format.test.ts`:

```ts
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { formatFile } from '../../../scripts/bootstrap-content/format'

describe('formatFile', () => {
  let tmp: string

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'bootstrap-format-'))
  })

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true })
  })

  it('rewrites a markdown file to Prettier-canonical form', async () => {
    const path = join(tmp, 'doc.md')
    // Single quotes in YAML frontmatter are Prettier-non-canonical; should become double.
    const input = `---\ntitle: 'Hello'\nlang: en\n---\n\nBody.\n`
    writeFileSync(path, input, 'utf-8')
    await formatFile(path)
    const after = readFileSync(path, 'utf-8')
    expect(after).toContain('title: "Hello"')
  })

  it('is a no-op when the file is already Prettier-canonical', async () => {
    const path = join(tmp, 'clean.json')
    const canonical = `{\n  "version": "1.1",\n  "value": 1\n}\n`
    writeFileSync(path, canonical, 'utf-8')
    await formatFile(path)
    const after = readFileSync(path, 'utf-8')
    expect(after).toBe(canonical)
  })

  it('runs formatFiles over a list sequentially', async () => {
    const { formatFiles } = await import('../../../scripts/bootstrap-content/format')
    const a = join(tmp, 'a.md')
    const b = join(tmp, 'b.md')
    writeFileSync(a, `---\ntitle: 'A'\n---\n`, 'utf-8')
    writeFileSync(b, `---\ntitle: 'B'\n---\n`, 'utf-8')
    await formatFiles([a, b])
    expect(readFileSync(a, 'utf-8')).toContain('title: "A"')
    expect(readFileSync(b, 'utf-8')).toContain('title: "B"')
  })
})
```

- [ ] **Step 1.1.2: Run to confirm RED**

```bash
npm run test -- tests/scripts/bootstrap-content/format.test.ts
```

Expected: 3 tests FAIL (module does not exist).

- [ ] **Step 1.1.3: Commit**

```bash
git add tests/scripts/bootstrap-content/format.test.ts
git commit -F /tmp/task1-red-msg.txt
```

Where `/tmp/task1-red-msg.txt` contains:

```text
test(bootstrap): RED — format.ts helper (issue #41 task 1)

Three failing tests for formatFile / formatFiles — the Prettier
wrapper that will be invoked by bootstrap.ts at the end of emit
to make the generator output idempotent.

Part of issue #41 (bootstrap non-idempotency).

(*BB:Montano*)
```

### 1.2 GREEN — Granjon

- [ ] **Step 1.2.1: Dispatch Granjon to create the helper**

Create `scripts/bootstrap-content/format.ts`:

```ts
import { readFile, writeFile } from 'node:fs/promises'
import prettier from 'prettier'

export async function formatFile(filepath: string): Promise<void> {
  const source = await readFile(filepath, 'utf-8')
  const config = await prettier.resolveConfig(filepath)
  const formatted = await prettier.format(source, { ...config, filepath })
  if (formatted !== source) {
    await writeFile(filepath, formatted, 'utf-8')
  }
}

export async function formatFiles(filepaths: readonly string[]): Promise<void> {
  for (const path of filepaths) {
    await formatFile(path)
  }
}
```

- [ ] **Step 1.2.2: Run tests to confirm GREEN**

```bash
npm run test -- tests/scripts/bootstrap-content/format.test.ts
```

Expected: all 3 tests PASS.

- [ ] **Step 1.2.3: Typecheck + full suite**

```bash
npm run typecheck
npm run test
```

Expected: typecheck PASS; full suite PASS (no regressions).

- [ ] **Step 1.2.4: Commit**

```bash
git add scripts/bootstrap-content/format.ts
git commit -F /tmp/task1-green-msg.txt
```

Where `/tmp/task1-green-msg.txt` contains:

```text
feat(bootstrap): GREEN — format.ts helper (issue #41 task 1)

Thin wrapper around prettier.format + prettier.resolveConfig.
Used by bootstrap.ts in task 3 to normalize emit output.

Part of issue #41.

(*BB:Granjon*)
```

---

## Task 2: Drop `generatedAt` from the manifest

**Goal:** `Manifest` type no longer has `generatedAt`; the generator stops emitting it; tests stop asserting on it.

**Files:**

- Modify: `scripts/bootstrap-content/types.ts`
- Modify: `scripts/bootstrap-content/emit-manifest.ts`
- Modify: `scripts/bootstrap-content/bootstrap.ts`
- Modify: `tests/scripts/bootstrap-content/emit-manifest.test.ts`
- Modify: `tests/scripts/bootstrap-content/static-templates.test.ts`

### 2.1 RED — Montano

- [ ] **Step 2.1.1: Dispatch Montano to update the tests**

**Edit A** — `tests/scripts/bootstrap-content/emit-manifest.test.ts`:

Delete the test at lines 26–30 (the `records version 1.1 and generatedAt` case). Update the `buildManifest` call signature from `buildManifest(plans, 'ISO-string')` to `buildManifest(plans)` at every call site (lines 21, 27, 45, 61).

After edits, the file's `buildManifest(...)` calls take only `plans` — no second arg.

Also delete the `it('records version 1.1 and generatedAt', ...)` block entirely, and add a replacement single-assertion test:

```ts
it('records version 1.1', () => {
  const m = buildManifest([])
  expect(m.version).toBe('1.1')
})
```

**Edit B** — `tests/scripts/bootstrap-content/static-templates.test.ts`:

Read `tests/scripts/bootstrap-content/static-templates.test.ts:45` and find the fixture object literal that carries `generatedAt: '2026-04-19T00:00:00Z'`. Delete just that property line from the literal. All other fields stay.

- [ ] **Step 2.1.2: Run to confirm RED**

```bash
npm run test -- tests/scripts/bootstrap-content/emit-manifest.test.ts tests/scripts/bootstrap-content/static-templates.test.ts
```

Expected: tests FAIL with compile errors (buildManifest signature mismatch, Manifest type still has generatedAt required). That is the correct RED: a structural mismatch the GREEN step fixes in the type + implementation.

- [ ] **Step 2.1.3: Commit**

```bash
git add tests/scripts/bootstrap-content/emit-manifest.test.ts tests/scripts/bootstrap-content/static-templates.test.ts
git commit -F /tmp/task2-red-msg.txt
```

Where `/tmp/task2-red-msg.txt` contains:

```text
test(bootstrap): RED — drop generatedAt from manifest tests (issue #41 task 2)

Remove the generatedAt assertion from emit-manifest.test.ts;
update all buildManifest() call sites to the new no-arg signature.
Remove generatedAt from the static-templates.test.ts fixture.

Tests fail with type errors until the GREEN step updates the
Manifest type + buildManifest implementation.

Part of issue #41.

(*BB:Montano*)
```

### 2.2 GREEN — Granjon

- [ ] **Step 2.2.1: Dispatch Granjon to update the type + generator**

**Edit A** — `scripts/bootstrap-content/types.ts`:

Remove line 28 (`generatedAt: string`) from the `Manifest` interface. The interface becomes:

```ts
export interface Manifest {
  version: '1.1'
  sections: readonly ManifestSection[]
}
```

**Edit B** — `scripts/bootstrap-content/emit-manifest.ts`:

Rewrite the function signature and body:

```ts
import type { Manifest, ManifestSection, SectionRenderPlan } from './types'

export function buildManifest(plans: readonly SectionRenderPlan[]): Manifest {
  const sections: ManifestSection[] = plans.map((p) => ({
    canonicalSlug: p.canonicalSlug,
    group: p.group,
    title: p.title,
    paraIds: p.en.map((b) => b.paraId),
    pdfPageStart: p.pdfPageStart,
    pdfPageEnd: p.pdfPageEnd,
  }))
  return { version: '1.1', sections }
}
```

**Edit C** — `scripts/bootstrap-content/bootstrap.ts:264`:

Current line 264 reads:

```ts
const manifest = buildManifest(plans, new Date().toISOString())
```

Change to:

```ts
const manifest = buildManifest(plans)
```

- [ ] **Step 2.2.2: Run tests to confirm GREEN**

```bash
npm run test -- tests/scripts/bootstrap-content/emit-manifest.test.ts tests/scripts/bootstrap-content/static-templates.test.ts
```

Expected: all tests in both files PASS.

- [ ] **Step 2.2.3: Typecheck + full suite**

```bash
npm run typecheck
npm run test
```

Expected: typecheck PASS; full suite PASS.

- [ ] **Step 2.2.4: Commit**

```bash
git add scripts/bootstrap-content/types.ts scripts/bootstrap-content/emit-manifest.ts scripts/bootstrap-content/bootstrap.ts
git commit -F /tmp/task2-green-msg.txt
```

Where `/tmp/task2-green-msg.txt` contains:

```text
feat(bootstrap): GREEN — drop generatedAt from manifest (issue #41 task 2)

Remove generatedAt from the Manifest type, buildManifest signature,
and bootstrap.ts caller. Wall-clock timestamps were the single
remaining non-Prettier source of per-run drift; the git commit
that lands regenerated output is the authoritative "when" marker.

Part of issue #41.

(*BB:Granjon*)
```

---

## Task 3: Wire format pass into `bootstrap.ts`

**Goal:** After emit, every written file is normalized to Prettier-canonical.

**Files:**

- Modify: `scripts/bootstrap-content/bootstrap.ts` (the `emit` function, roughly lines 263–293)

### 3.1 GREEN — Granjon

- [ ] **Step 3.1.1: Dispatch Granjon to add the format pass**

Modify `scripts/bootstrap-content/bootstrap.ts`:

**Add an import** near the top with the other `./` imports:

```ts
import { formatFiles } from './format'
```

**Rewrite the `emit` function** (currently lines 263–293) to collect paths and format at the end:

```ts
async function emit(plans: SectionRenderPlan[], repoRoot: string): Promise<void> {
  const manifest = buildManifest(plans)
  const manifestPath = resolve(repoRoot, 'src/content/manifest.json')
  ensureDir(manifestPath)
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  const wrapperPath = resolve(repoRoot, 'src/lib/content/manifest.ts')
  ensureDir(wrapperPath)
  writeFileSync(wrapperPath, renderWrapper())

  const written: string[] = [manifestPath, wrapperPath]

  for (const plan of plans) {
    for (const lang of ['en', 'et'] as const) {
      const path = resolve(repoRoot, `src/content/${lang}/${plan.canonicalSlug}.md`)
      ensureDir(path)
      writeFileSync(path, renderSection(plan, lang))
      written.push(path)
    }
  }

  for (const lang of ['en', 'et'] as const) {
    const path = resolve(repoRoot, `src/content/${lang}/cover.md`)
    ensureDir(path)
    const existing = existsSync(path) ? readFileSync(path, 'utf8') : null
    if (shouldRegenerateCover(existing)) {
      writeFileSync(path, renderCover(lang))
      written.push(path)
    }
  }

  for (const lang of ['en', 'et'] as const) {
    const path = resolve(repoRoot, `src/content/${lang}/index.md`)
    ensureDir(path)
    writeFileSync(path, renderIndex(manifest, lang))
    written.push(path)
  }

  await formatFiles(written)
}
```

Only three changes vs the current code: (a) imported `formatFiles`, (b) removed the `generatedAt` arg from `buildManifest` (already done in Task 2, but make sure it's absent here), (c) accumulate `written` paths and call `formatFiles(written)` at the end. Cover is included in `written` only if it was actually regenerated (matches `shouldRegenerateCover` gate).

- [ ] **Step 3.1.2: Smoke test the format pass by running bootstrap**

```bash
CONTENT_BOOTSTRAP=1 npm run bootstrap
```

Expected: completes without errors. The tree will now be dirty with 137 files — that's the one-shot normalization, committed in Task 4.

- [ ] **Step 3.1.3: Typecheck + full suite**

Do NOT reset the tree yet (Task 4 uses it).

```bash
npm run typecheck
npm run test
```

Expected: typecheck PASS; full suite PASS (format.ts unit tests still pass, emit-manifest.test.ts still passes, etc.).

- [ ] **Step 3.1.4: Commit code change only (NOT the regenerated content)**

Critical: the `git add` must NOT include `src/content/` or `src/lib/content/manifest.ts` — those belong in Task 4's commit.

```bash
git add scripts/bootstrap-content/bootstrap.ts
git commit -F /tmp/task3-msg.txt
```

Verify the commit scope:

```bash
git show --stat HEAD
```

Expected: one file changed (`scripts/bootstrap-content/bootstrap.ts`).

`/tmp/task3-msg.txt`:

```text
feat(bootstrap): wire Prettier format pass into emit (issue #41 task 3)

After all files are written, formatFiles(written) normalizes them
in place via Prettier's Node API. Emit functions stay style-naïve;
Prettier brings them to canonical form.

The regenerated content files are committed separately (task 4)
to isolate the one-shot normalization from the code change.

Part of issue #41.

(*BB:Granjon*)
```

---

## Task 4: One-shot normalization commit

**Goal:** Commit the 134 markdown files + manifest.json + manifest.ts in their Prettier-canonical form. This is a pure-style commit; after this, the tree is a fixed point for `bootstrap`.

**Files:**

- Modify: all of `src/content/en/*.md`, `src/content/et/*.md`, `src/content/manifest.json`, `src/lib/content/manifest.ts`

### 4.1 Plantin runs the regen

This task is Plantin territory (it's just running a script + committing output, no new code). It's split out as a dedicated task for commit isolation.

- [ ] **Step 4.1.1: Confirm the dirty tree from Task 3 is still present**

```bash
git status --porcelain | wc -l
git diff --stat | tail -3
```

Expected: ~137 dirty files; total insertions/deletions roughly balance (pure style churn). If the tree is unexpectedly clean, re-run `CONTENT_BOOTSTRAP=1 npm run bootstrap` to regenerate.

- [ ] **Step 4.1.2: Sanity-check a sample file**

```bash
git diff src/content/et/s36.md
```

Expected: the frontmatter `title: 'Rentsli bravuur'` → `title: "Rentsli bravuur"` flip, nothing else substantive.

```bash
git diff src/content/manifest.json | head -30
```

Expected: `generatedAt` field removed; some short `paraIds` arrays now inline-formatted (Prettier re-wraps based on width).

- [ ] **Step 4.1.3: Stage only content files + the wrapper**

```bash
git add src/content/ src/lib/content/manifest.ts
git status
```

Expected: 134 markdown + `manifest.json` + `manifest.ts` staged.

- [ ] **Step 4.1.4: Commit**

```bash
git commit -F /tmp/task4-msg.txt
```

`/tmp/task4-msg.txt`:

```text
chore(content): one-shot Prettier normalization of generated tree (issue #41 task 4)

Regenerated src/content/ and src/lib/content/manifest.ts via the
format-enabled bootstrap (task 3). Pure style churn:

- YAML frontmatter quote style: single → double
- manifest.json paraIds arrays: some wrap / some inline per Prettier width
- manifest.ts CHAPTERS projection: Prettier line wrapping
- generatedAt field: removed (task 2)

No textual content mutations. After this commit, a clean-tree
`CONTENT_BOOTSTRAP=1 npm run bootstrap` produces zero diff.
The idempotency regression test (task 5) asserts this.

Part of issue #41.

(*BB:Plantin*)
```

- [ ] **Step 4.1.5: Verify the commit lands cleanly**

```bash
git log -1 --stat | head -20
git status
```

Expected: one commit with 136 files changed; clean working tree.

- [ ] **Step 4.1.6: Manual idempotency check**

```bash
CONTENT_BOOTSTRAP=1 npm run bootstrap
git status --porcelain
```

Expected: zero output (tree is clean after a second bootstrap run). This is the success criterion — Task 5 adds the automated regression test.

If output is non-zero: stop, diagnose. The format pass isn't reaching all files, or something in the emit is Prettier-rejecting — diff the remaining dirty files and investigate.

---

## Task 5: Idempotency regression test

**Goal:** A Vitest spec that shells out to `npm run bootstrap` and asserts diff-empty. Prevents regressions if a new emit step forgets to format or Prettier config changes.

**Files:**

- Create: `tests/scripts/bootstrap-content/idempotency.test.ts`

### 5.1 Montano writes the test

- [ ] **Step 5.1.1: Dispatch Montano to write the spec**

Create `tests/scripts/bootstrap-content/idempotency.test.ts`:

```ts
import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = resolve(fileURLToPath(import.meta.url), '..')
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..', '..')

const BOOTSTRAP_OUTPUT_PATHS = ['src/content/', 'src/lib/content/manifest.ts']

function gitDiffStat(): string {
  return execSync(`git diff --stat ${BOOTSTRAP_OUTPUT_PATHS.join(' ')}`, {
    cwd: REPO_ROOT,
  })
    .toString()
    .trim()
}

function gitResetBootstrapOutput(): void {
  execSync(`git checkout -- ${BOOTSTRAP_OUTPUT_PATHS.join(' ')}`, { cwd: REPO_ROOT })
}

describe('bootstrap idempotency', () => {
  beforeAll(() => {
    const dirty = execSync(`git status --porcelain ${BOOTSTRAP_OUTPUT_PATHS.join(' ')}`, {
      cwd: REPO_ROOT,
    })
      .toString()
      .trim()
    if (dirty !== '') {
      throw new Error(
        `bootstrap idempotency test requires a clean tree; aborting.\n${dirty}\n` +
          `Run 'git checkout -- ${BOOTSTRAP_OUTPUT_PATHS.join(' ')}' or commit your changes first.`,
      )
    }
  }, 30_000)

  afterAll(() => {
    // Protective: if the test failed mid-run and left dirty state, reset.
    gitResetBootstrapOutput()
  })

  it('running bootstrap on a clean tree leaves the tree diff-empty', () => {
    execSync('CONTENT_BOOTSTRAP=1 npm run bootstrap', { cwd: REPO_ROOT, stdio: 'pipe' })
    const diff = gitDiffStat()
    expect(diff).toBe('')
  }, 120_000)
})
```

- [ ] **Step 5.1.2: Run the test**

```bash
npm run test -- tests/scripts/bootstrap-content/idempotency.test.ts
```

Expected: test PASSES (Task 4 committed the fixed-point tree; bootstrap is now idempotent).

If it FAILS: something about the fixed-point tree or the format pass is off. Likely causes:

- Uncommitted changes from Task 3/4 (run `git status`, commit or reset).
- The format pass skipped a file (grep the `emit` function in `bootstrap.ts` for every write; every `writeFileSync` must push its path to `written`).

- [ ] **Step 5.1.3: Run the full test suite**

```bash
npm run test
```

Expected: all tests pass (total count = previous baseline + 4 new tests from Task 1 + 1 new test from Task 5).

- [ ] **Step 5.1.4: Commit**

```bash
git add tests/scripts/bootstrap-content/idempotency.test.ts
git commit -F /tmp/task5-msg.txt
```

`/tmp/task5-msg.txt`:

```text
test(bootstrap): idempotency regression test (issue #41 task 5)

Shells out to `npm run bootstrap` on a clean tree and asserts
git diff on src/content/ and src/lib/content/manifest.ts is
empty. Guards against future regressions if a new emit step
forgets the format pass or Prettier config changes.

Pre-run clean-tree guard prevents false green on a pre-dirty tree.
Post-run reset protects subsequent test runs from side effects
if this one fails.

Closes #41 together with tasks 1-4.

(*BB:Montano*)
```

---

## Task 6: Ortelius review

**Goal:** Independent review that the fix meets the spec, the success criteria hold, and no regressions slipped in.

### 6.1 Dispatch Ortelius

- [ ] **Step 6.1.1: Walk the success criteria**

Brief Ortelius with:

- Review commits on `main` since `dbacc7e` (the spec commit, exclusive).
- Walk the five success criteria from the spec:
  1. `CONTENT_BOOTSTRAP=1 npm run bootstrap` on a clean tree leaves `git diff src/content/ src/lib/content/manifest.ts` empty.
  2. `generatedAt` is absent from `src/content/manifest.json`.
  3. `tests/scripts/bootstrap-content/idempotency.test.ts` exists and passes.
  4. No other test regressed; `npm run test` green.
  5. Issue #41 closable.
- Run the full quality gate: `npm run typecheck && npm run lint && npm run test && npm run build`.
- Note structural observations but only apply inline polish if it's a genuine quality issue.

- [ ] **Step 6.1.2: Report format**

Ortelius replies:

```
STATUS: ACCEPT | REJECT

### Success criteria walk
(each criterion with observation)

### Quality gate
- typecheck / lint / vitest / build: PASS | FAIL

### Structural observations
(list with severity OBSERVATION / CONCERN / BLOCKING)

### Inline polish applied
(list; or "none")

### Recommendation
(ACCEPT or REJECT + justification)
```

---

## Task 7: Close #41 and push

### 7.1 Push

- [ ] **Step 7.1.1: Push**

```bash
git push origin main
```

- [ ] **Step 7.1.2: Wait for CI green**

```bash
gh run list --limit 3 --branch main
```

Wait until the latest run's status is `completed success`.

### 7.2 Close the issue

- [ ] **Step 7.2.1: Close issue #41 with a short note**

```bash
gh issue close 41 --comment "Landed via tasks 1-5 of the bootstrap-idempotency plan. $(git log --oneline dbacc7e..HEAD | wc -l) commits on main. Idempotency regression test at tests/scripts/bootstrap-content/idempotency.test.ts gates future regressions. Normalized content tree at the one-shot commit in task 4."
```

- [ ] **Step 7.2.2: Update the Plantin scratchpad**

Add a one-line entry to `.claude/teams/bigbook-dev/memory/plantin.md` under the session-16 block (or a new session-17 block if appropriate) noting #41 closed.

Commit with:

```text
docs(team): plantin scratchpad — #41 closed

(*BB:Plantin*)
```

Push.

---

## Rollback

If any task produces untenable regressions, the cleanest rollback is to `dbacc7e` (the spec commit):

```bash
git reset --hard dbacc7e
```

The fix is small and self-contained; a full retry from the spec is preferable to a partial debug.

## Notes for executors

- **Attribution:** every commit is attributed in its body via `(*BB:<Role>*)`. Do not mix roles in a single commit.
- **Lefthook:** pre-commit hooks run prettier + typecheck + eslint. If Prettier rewrites a staged file, re-stage and re-run the commit. Do not bypass with `--no-verify`.
- **Commit order matters.** Task 3's code change and Task 4's content regen MUST be separate commits for review traceability. Do NOT amend Task 3 with Task 4 content.
- **Test runtime:** the new idempotency test adds ~5s to the vitest run (shells out + one full bootstrap). Acceptable.
- **No push by subagents:** Plantin pushes in Task 7.

(_BB:Plantin_)
