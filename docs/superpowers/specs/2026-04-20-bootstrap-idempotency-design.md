# Bootstrap idempotency design

**Date:** 2026-04-20
**Issue:** [#41](https://github.com/mitselek/bigbook/issues/41)
**Author:** Plantin
**Status:** Approved by PO, pending implementation plan

## Problem

`CONTENT_BOOTSTRAP=1 npm run bootstrap` is not idempotent against its own output. A second consecutive run against an untouched tree mutates 137 files. The mutations are entirely style differences between emit-canonical form and Prettier-canonical form:

- **Markdown frontmatter quotes:** emit writes single quotes (`title: 'Rentsli bravuur'`); Prettier rewrites to double quotes.
- **`manifest.json` array formatting:** emit writes `paraIds` inline; Prettier multi-lines arrays that overflow 80 chars.
- **`manifest.ts` wrapper:** emit writes the `CHAPTERS` projection one way; Prettier rewraps.
- **`generatedAt` timestamp:** current-time wall clock; changes every run by design.

Committed on-disk files are Prettier-canonical because the pre-commit `prettier --check` gates every commit. Emit output is always Prettier-non-canonical. Re-running the generator therefore writes back the emit form, which Prettier would re-correct.

This creates three concrete harms:

1. Any developer regenerating the wrapper sees a noisy working tree (134 markdown files + the manifest) and may stage them wholesale, inadvertently bundling content drift into an unrelated PR.
2. The `BASELINE_COMMIT_SHA` pin in `src/lib/content/baseline-config.ts` depends on a specific content tree commit. Drift-on-regen means the baseline can shift invisibly if bootstrap output is committed without review.
3. Any future contributor who runs `npm run bootstrap` to refresh from source is left wondering whether 137 mutated files are a bug in their data, a bug in the generator, or just Prettier churn.

## Goal

Make `npm run bootstrap` idempotent: running it twice on an untouched tree leaves `git diff` empty.

## Non-goals (explicit)

- **Refactoring the emit step** itself. Emit functions stay style-naïve — any valid TypeScript / JSON / YAML / markdown goes in; Prettier takes it the rest of the way.
- **Changing Prettier config.** The project's `.prettierrc.json` stays as-is. Emit aligns to Prettier, never the reverse.
- **Touching the pairing-artifact generator** (`scripts/pair-en-et/*`). That's a separate pipeline with its own artifact. Its `generatedAt` is a consumer-facing field — used by `review-report.ts:35` — and stays.
- **Re-deriving content.** The 134 markdown file changes produced by the one-shot normalization are pure style; the textual body of each paragraph is preserved byte-for-byte.

## Approach

**In-process Prettier.** After the emit step writes all files, the generator formats them in place using Prettier's Node API. One pass, deterministic, no subprocess.

**Drop `generatedAt`** from the bootstrap manifest. It's the single remaining non-Prettier source of per-run drift, and no consumer uses it. The git commit that lands regenerated output is the authoritative "when was this emitted" marker.

**Add an idempotency regression test.** A Vitest spec that runs the bootstrap, captures a snapshot, runs it again, and asserts the two outputs are byte-identical. Guards against future regressions (e.g., a new emit step forgetting to format, or a Prettier config change).

## Architecture

### Data flow

```
Input:
  data/extractions/pairing/en-et.json
  data/extractions/pairing/translation-cache.json
  data/extractions/pairing/manual-translations.json

Generator (scripts/bootstrap-content/bootstrap.ts):
  1. seeder.ts           → hydrate cache from manual worksheet
  2. emit-markdown.ts    → render 68 sections × 2 langs + cover + index = 70 files per lang
  3. emit-manifest.ts    → render src/content/manifest.json
  4. emit-wrapper.ts     → render src/lib/content/manifest.ts
  5. format.ts (NEW)     → prettier.format() every written file in place

Output:
  src/content/{en,et}/*.md      (prettier-canonical)
  src/content/manifest.json     (prettier-canonical; no generatedAt)
  src/lib/content/manifest.ts   (prettier-canonical)
```

### Module: `scripts/bootstrap-content/format.ts`

New module, ~15 lines. Exposes:

```ts
export async function formatFile(filepath: string): Promise<void>
export async function formatFiles(filepaths: readonly string[]): Promise<void>
```

Implementation:

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

Sequential, not parallel — file I/O on 137 files is fast (<2s locally) and a rare operation; parallelism adds complexity for no measurable gain.

### Hook into `bootstrap.ts`

Current end-of-bootstrap is: write files → return. New end is: write files → collect all written paths → `await formatFiles(paths)` → return.

Every emit step already returns the file path(s) it wrote (or can trivially surface it). `bootstrap.ts` accumulates the list and formats in one pass.

### Drop `generatedAt`

- `scripts/bootstrap-content/types.ts` — remove `generatedAt: string` from the `Manifest` type.
- `scripts/bootstrap-content/emit-manifest.ts` — remove `generatedAt` param from `buildManifest`; stop emitting the field.
- `bootstrap.ts` — stop passing `generatedAt` to `buildManifest`.
- `tests/scripts/bootstrap-content/emit-manifest.test.ts` — drop the "records version 1.1 and generatedAt" test (the version-only assertion stays).
- `tests/scripts/bootstrap-content/static-templates.test.ts:45` — drop `generatedAt` from the fixture object.

**Out of scope:** `tests/scripts/bootstrap-content/fixtures/tiny-artifact.json` — this is a _pairing artifact_ (input to bootstrap-content), not a _manifest_ (output). Its `generatedAt` is part of the pairing artifact contract, which is unchanged.

### Idempotency test

New file: `tests/scripts/bootstrap-content/idempotency.test.ts`.

```ts
import { describe, it, expect, beforeAll } from 'vitest'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../../..')

describe('bootstrap idempotency', () => {
  beforeAll(() => {
    const dirty = execSync('git status --porcelain src/content/ src/lib/content/manifest.ts', {
      cwd: REPO_ROOT,
    }).toString()
    if (dirty.trim() !== '') {
      throw new Error(`tree not clean before test; aborting.\n${dirty}`)
    }
  }, 30_000)

  it('running bootstrap once leaves the tree diff-empty', () => {
    execSync('CONTENT_BOOTSTRAP=1 npm run bootstrap', { cwd: REPO_ROOT, stdio: 'pipe' })
    const diff = execSync('git diff --stat src/content/ src/lib/content/manifest.ts', {
      cwd: REPO_ROOT,
    }).toString()
    expect(diff).toBe('')
  }, 60_000)
})
```

Two guards: (a) tree must be clean before the test starts (prevents false green on a pre-dirty tree); (b) after one run the tree must still be diff-empty (which is what idempotency means when the starting state is committed emit-canonical form).

**Test runtime:** ~5s locally. Acceptable for a CI-gated spec.

## Error handling

- **Prettier rejects malformed emit output.** If emit writes invalid TS or JSON, `prettier.format` throws. Let it — the error points at the offending generator step, which is the correct place to fix. No catch-and-continue.
- **Prettier config missing.** `prettier.resolveConfig` returns `null` if no config is found, and `format()` falls back to defaults. The repo has `.prettierrc.json` so this path is never hit; don't code around it.
- **File write race.** Bootstrap is synchronous at the orchestration level (even though steps are async). No concurrent writers. No file-locking needed.

## Testing strategy

- **Unit (Vitest):** existing `emit-manifest.test.ts` minus the `generatedAt` assertion continues to guard the emit shape. No new unit tests needed for the formatter — it's a 4-line wrapper around Prettier's public API.
- **Integration (Vitest):** the new `idempotency.test.ts` is the key guard.
- **Pre-commit:** lefthook's `prettier --check` remains. The generator's in-process format step makes that check into a trivial no-op for bootstrap output, but retain it for all other files.
- **Manual:** PO runs `CONTENT_BOOTSTRAP=1 npm run bootstrap` against a clean tree post-fix and confirms `git status` is clean.

## One-shot normalization

The first commit after landing the fix regenerates **all** 134 markdown files + `manifest.json` + `manifest.ts` to Prettier-canonical. This is a large but boring diff (pure style). Review by eyeballing a handful of files rather than the full change.

After that commit, every subsequent bootstrap run is a no-op on a clean tree.

## Success criteria

1. `CONTENT_BOOTSTRAP=1 npm run bootstrap` on a clean tree leaves `git diff src/content/ src/lib/content/manifest.ts` empty.
2. `generatedAt` is absent from `src/content/manifest.json`.
3. `tests/scripts/bootstrap-content/idempotency.test.ts` exists and passes.
4. No other test regressed; `npm run test` green.
5. Issue #41 closable.

## References

- Issue #41: https://github.com/mitselek/bigbook/issues/41
- Related: v1.1-content P1 design at `docs/superpowers/specs/2026-04-19-content-bootstrap-generator-design.md`
- Related: v1.1-content P2 Task 1 commit `cae239f` (where Granjon first flagged the concern)

(_BB:Plantin_)
