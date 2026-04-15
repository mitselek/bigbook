# v1-foundation · Phase 5: Pre-commit hooks

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this phase task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Plan overview:** [v1-foundation/README.md](./README.md)
**Tracking issue:** [#3 — Epic: v1-foundation](https://github.com/mitselek/bigbook/issues/3)
**Design spec:** [Discussion #2](https://github.com/mitselek/bigbook/discussions/2) · [committed spec](../../specs/2026-04-14-bigbook-reader-design.md)
**Prerequisites:** [P4 — Bootstrap script](./p4-bootstrap.md) committed + pushed to `origin/main`
**Commit convention:** every commit in this phase has `Part of #3` in the body.

Wire three new pre-commit hooks into `lefthook.yml`:

1. **`legacy-guard`** — block staged diffs under `legacy/` unless `LEGACY_OVERRIDE=1` is set in the commit environment and PO approval is recorded in the commit body. Restored from the session-2 deferral via a shell script that sidesteps the Windows Git Bash escaping bug.
2. **`content-guard`** — block staged diffs under `src/content/` unless `CONTENT_BOOTSTRAP=1` is set. New in v1.
3. **`hard-invariant`** — parse every staged file under `src/content/` and `src/lib/content/` via the shared `validate.ts` module. Fail the commit if any chapter's EN/ET pair violates the Hard Invariant.

Each hook is a standalone shell or Node script under `scripts/`, so the lefthook invocation is trivial and can't trip over shell escaping.

**Files touched in Phase 5:**

- Create: `scripts/legacy-guard.sh`
- Create: `scripts/content-guard.sh`
- Create: `scripts/hard-invariant.mjs`
- Create: `tests/scripts/hard-invariant.test.ts`
- Modify: `lefthook.yml`

---

## Task P5.1: Restore legacy-guard as a shell script

**Files:**

- Create: `scripts/legacy-guard.sh`
- Modify: `lefthook.yml`

- [ ] **Step 1: Create `scripts/legacy-guard.sh`**

New file content:

```bash
#!/usr/bin/env bash
# legacy-guard — block staged diffs under legacy/ unless LEGACY_OVERRIDE=1.
#
# Lefthook passes the list of staged files as "$@". We check whether any of
# them are under the legacy/ prefix. If yes, we require the LEGACY_OVERRIDE=1
# environment variable AND a line in the commit message containing
# "legacy-override:" (enforced via a subsequent commit-msg hook — for now
# just document the expectation).
#
# Exit 0 = allow commit, exit 1 = block.

set -euo pipefail

legacy_files=()
for file in "$@"; do
  if [[ "$file" == legacy/* ]]; then
    legacy_files+=("$file")
  fi
done

if [[ ${#legacy_files[@]} -eq 0 ]]; then
  exit 0
fi

if [[ "${LEGACY_OVERRIDE:-0}" == "1" ]]; then
  echo "legacy-guard: LEGACY_OVERRIDE=1 set, allowing ${#legacy_files[@]} staged file(s) under legacy/"
  for file in "${legacy_files[@]}"; do
    echo "  $file"
  done
  echo "legacy-guard: reminder — record PO approval in the commit body."
  exit 0
fi

echo "legacy-guard: refusing to commit staged files under legacy/ without LEGACY_OVERRIDE=1" >&2
echo "Staged files under legacy/:" >&2
for file in "${legacy_files[@]}"; do
  echo "  $file" >&2
done
echo "" >&2
echo "If this change is PO-approved, re-run with:" >&2
echo "  LEGACY_OVERRIDE=1 git commit ..." >&2
echo "and record PO approval in the commit body." >&2
exit 1
```

Make it executable:

```bash
chmod +x scripts/legacy-guard.sh
```

On Windows Git Bash, `chmod +x` sets the executable bit in git's index (tracked as mode 755). Verify with `git update-index --chmod=+x scripts/legacy-guard.sh` if needed.

- [ ] **Step 2: Wire it into `lefthook.yml`**

Current `lefthook.yml`:

```yaml
pre-commit:
  parallel: false
  commands:
    # TODO: legacy-guard hook to block staged diffs under legacy/ unless
    # LEGACY_OVERRIDE=1 is set in the commit body. Deferred after hitting
    # a shell-escaping issue when running a multi-step guard through
    # lefthook -> sh -c on Windows Git Bash (staged: -c: line N: syntax
    # error: unexpected end of file). Options to revisit:
    #   1. Move the guard to scripts/legacy-guard.sh and invoke via
    #      `run: bash scripts/legacy-guard.sh`.
    #   2. Keep it as a local hook but invoke via `bash -c` explicitly.
    #   3. Implement as a GitHub Actions check instead of a local hook.
    # Until then, treat legacy/ as off-limits by convention, not by hook.
    typecheck:
      glob: '*.{ts,tsx,astro}'
      run: npx tsc --noEmit
    eslint:
      glob: '*.{ts,tsx,astro}'
      run: npx eslint {staged_files}
    prettier:
      glob: '*.{ts,tsx,astro,md,json,yml,yaml}'
      run: npx prettier --check {staged_files}
```

Replace with (remove the TODO block, add the `legacy-guard` hook):

```yaml
pre-commit:
  parallel: false
  commands:
    legacy-guard:
      run: bash scripts/legacy-guard.sh {staged_files}
    typecheck:
      glob: '*.{ts,tsx,astro}'
      run: npx tsc --noEmit
    eslint:
      glob: '*.{ts,tsx,astro}'
      run: npx eslint {staged_files}
    prettier:
      glob: '*.{ts,tsx,astro,md,json,yml,yaml}'
      run: npx prettier --check {staged_files}
```

- [ ] **Step 3: Test the hook manually**

```bash
# Happy path — no legacy/ files staged, should be a no-op
echo "test" > test-allowed.md
git add test-allowed.md
lefthook run pre-commit
# Expected: legacy-guard exits 0; other hooks run normally
git reset HEAD test-allowed.md
rm test-allowed.md
```

Then try to stage a legacy/ file and confirm it's blocked:

```bash
echo "test" >> legacy/README-test.md
git add legacy/README-test.md
lefthook run pre-commit
# Expected: legacy-guard exits 1 with the "refusing to commit" error
git reset HEAD legacy/README-test.md
rm legacy/README-test.md
```

Then with the override:

```bash
echo "test" >> legacy/README-test.md
git add legacy/README-test.md
LEGACY_OVERRIDE=1 lefthook run pre-commit
# Expected: legacy-guard passes with the "allowing" message
git reset HEAD legacy/README-test.md
rm legacy/README-test.md
```

- [ ] **Step 4: Commit**

```bash
git add scripts/legacy-guard.sh lefthook.yml
git commit -m "$(cat <<'EOF'
feat(lefthook): restore legacy-guard pre-commit hook

Moves the logic into scripts/legacy-guard.sh and invokes via
`bash scripts/legacy-guard.sh {staged_files}`, sidestepping the
Git Bash escaping bug that caused the original inline-in-YAML
version to deferred in session 2.

Blocks any staged file under legacy/ unless LEGACY_OVERRIDE=1 is
set in the environment. Prints the offending file list and a
recovery hint when blocked.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P5.2: Add content-guard shell script

**Files:**

- Create: `scripts/content-guard.sh`
- Modify: `lefthook.yml`

- [ ] **Step 1: Create `scripts/content-guard.sh`**

New file content (near-identical shape to `legacy-guard.sh`):

```bash
#!/usr/bin/env bash
# content-guard — block staged diffs under src/content/ unless
# CONTENT_BOOTSTRAP=1 is set.
#
# Rationale: src/content/ is populated by the one-shot bootstrap script
# (scripts/bootstrap-mock-content.mjs) and by end users via the web app.
# The dev team never commits content directly. This hook catches
# accidental dev-team commits that would clobber user data.
#
# Exit 0 = allow commit, exit 1 = block.

set -euo pipefail

content_files=()
for file in "$@"; do
  if [[ "$file" == src/content/* ]]; then
    content_files+=("$file")
  fi
done

if [[ ${#content_files[@]} -eq 0 ]]; then
  exit 0
fi

if [[ "${CONTENT_BOOTSTRAP:-0}" == "1" ]]; then
  echo "content-guard: CONTENT_BOOTSTRAP=1 set, allowing ${#content_files[@]} staged file(s) under src/content/"
  for file in "${content_files[@]}"; do
    echo "  $file"
  done
  exit 0
fi

echo "content-guard: refusing to commit staged files under src/content/ without CONTENT_BOOTSTRAP=1" >&2
echo "Staged files under src/content/:" >&2
for file in "${content_files[@]}"; do
  echo "  $file" >&2
done
echo "" >&2
echo "src/content/ is owned by the bootstrap script and end users, not the dev team." >&2
echo "If this is a legitimate content-bootstrap commit, re-run with:" >&2
echo "  CONTENT_BOOTSTRAP=1 git commit ..." >&2
exit 1
```

Make executable:

```bash
chmod +x scripts/content-guard.sh
```

- [ ] **Step 2: Wire into `lefthook.yml`**

Add a new command entry directly below `legacy-guard`:

```yaml
content-guard:
  run: bash scripts/content-guard.sh {staged_files}
```

Full `pre-commit.commands` block after this edit:

```yaml
pre-commit:
  parallel: false
  commands:
    legacy-guard:
      run: bash scripts/legacy-guard.sh {staged_files}
    content-guard:
      run: bash scripts/content-guard.sh {staged_files}
    typecheck:
      glob: '*.{ts,tsx,astro}'
      run: npx tsc --noEmit
    eslint:
      glob: '*.{ts,tsx,astro}'
      run: npx eslint {staged_files}
    prettier:
      glob: '*.{ts,tsx,astro,md,json,yml,yaml}'
      run: npx prettier --check {staged_files}
```

- [ ] **Step 3: Test the hook manually**

```bash
# Try to stage a file under src/content/ (create the dir if it doesn't exist)
mkdir -p src/content/et
echo "::para[test-p001]" > src/content/et/test.md
echo "test" >> src/content/et/test.md
git add src/content/et/test.md

# Expect content-guard to block
lefthook run pre-commit || echo "blocked as expected"

# With the override, should pass (but other hooks like parse-invariance may
# trip — that's fine, we're only testing content-guard here)
CONTENT_BOOTSTRAP=1 lefthook run pre-commit --commands content-guard

# Clean up
git reset HEAD src/content/et/test.md
rm -r src/content/et/test.md
```

- [ ] **Step 4: Commit**

```bash
git add scripts/content-guard.sh lefthook.yml
git commit -m "$(cat <<'EOF'
feat(lefthook): add content-guard pre-commit hook

Blocks staged diffs under src/content/ unless CONTENT_BOOTSTRAP=1
is set in the environment. The guard only affects dev-team local
commits; user-edit commits created via the GitHub Contents API
bypass lefthook entirely (they have no local checkout).

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P5.3: Add hard-invariant Node hook

**Files:**

- Create: `scripts/hard-invariant.mjs`
- Create: `tests/scripts/hard-invariant.test.ts`
- Modify: `lefthook.yml`

- [ ] **Step 1: Create the failing test**

New file `tests/scripts/hard-invariant.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { checkStagedContent } from '../../scripts/hard-invariant.mjs'

describe('hard-invariant checkStagedContent()', () => {
  it('returns ok when staged files list is empty', async () => {
    const result = await checkStagedContent([], async () => '')
    expect(result.ok).toBe(true)
  })

  it('returns ok when only unrelated files are staged', async () => {
    const result = await checkStagedContent(
      ['src/lib/auth/config.ts', 'docs/readme.md'],
      async () => '',
    )
    expect(result.ok).toBe(true)
  })

  it('validates a pair of files under src/content/ via the reader', async () => {
    const valid = async (path: string) => {
      if (path === 'src/content/en/ch05.md') {
        return `---
chapter: ch05
title: How It Works
lang: en
---

::para[ch05-title]
How It Works

::para[ch05-p001]
Rarely have we seen a person fail.
`
      }
      return `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.
`
    }
    const result = await checkStagedContent(
      ['src/content/en/ch05.md', 'src/content/et/ch05.md'],
      valid,
    )
    expect(result.ok).toBe(true)
  })

  it('reports a Hard Invariant violation', async () => {
    const invalid = async (path: string) => {
      if (path === 'src/content/en/ch05.md') {
        return `---
chapter: ch05
title: How It Works
lang: en
---

::para[ch05-title]
How It Works

::para[ch05-p001]
Rarely have we seen a person fail.

::para[ch05-p002]
Our stories disclose.
`
      }
      return `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.
`
    }
    const result = await checkStagedContent(
      ['src/content/en/ch05.md', 'src/content/et/ch05.md'],
      invalid,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.violations).toContain('ch05')
  })
})
```

- [ ] **Step 2: Run and verify it fails**

```bash
npx vitest run tests/scripts/hard-invariant.test.ts
```

Expected: fail — module not yet exported.

- [ ] **Step 3: Create `scripts/hard-invariant.mjs`**

New file:

```js
#!/usr/bin/env node
/**
 * hard-invariant pre-commit hook.
 *
 * Receives the list of staged files as argv. For each chapter whose
 * EN or ET side is staged, loads both sides and runs validatePair().
 * Fails the commit if any pair violates the Hard Invariant.
 *
 * Exit 0 = allow commit, exit 1 = block.
 */

import { promises as fs } from 'node:fs'
import { join, basename, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '../src/lib/content/parse.ts'
import { validatePair } from '../src/lib/content/validate.ts'

const __filename = fileURLToPath(import.meta.url)
const REPO_ROOT = resolve(dirname(__filename), '..')

/**
 * Core logic, extracted for testability. The `readFile` parameter is
 * async and defaults to fs.readFile with the repo root prepended.
 */
export async function checkStagedContent(stagedFiles, readFile) {
  const read = readFile ?? (async (path) => fs.readFile(join(REPO_ROOT, path), 'utf8'))

  // Find chapter slugs that have staged content (on either side).
  const touchedChapters = new Set()
  for (const file of stagedFiles) {
    const match = file.match(/^src\/content\/(en|et)\/(.+)\.md$/)
    if (match) {
      touchedChapters.add(match[2])
    }
  }

  if (touchedChapters.size === 0) {
    return { ok: true }
  }

  const violations = []
  for (const slug of touchedChapters) {
    try {
      const enContent = await read(`src/content/en/${slug}.md`)
      const etContent = await read(`src/content/et/${slug}.md`)
      const en = parse(enContent)
      const et = parse(etContent)
      const result = validatePair(en, et)
      if (!result.ok) {
        violations.push(slug)
        console.error(`hard-invariant: violation in chapter '${slug}':`)
        for (const err of result.errors) {
          console.error(`  - [${err.category}] ${err.paraId}: ${err.message}`)
        }
      }
    } catch (err) {
      violations.push(slug)
      console.error(`hard-invariant: error reading/parsing '${slug}': ${err.message}`)
    }
  }

  return violations.length === 0 ? { ok: true } : { ok: false, violations }
}

async function main() {
  const stagedFiles = process.argv.slice(2)
  const result = await checkStagedContent(stagedFiles)
  process.exit(result.ok ? 0 : 1)
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main()
}
```

- [ ] **Step 4: Run tests and verify**

```bash
npx vitest run tests/scripts/hard-invariant.test.ts
```

Expected: all 4 tests passing.

- [ ] **Step 5: Wire the hook into `lefthook.yml`**

Add below `content-guard`:

```yaml
hard-invariant:
  run: npx tsx scripts/hard-invariant.mjs {staged_files}
```

Full `pre-commit.commands` block after this edit:

```yaml
pre-commit:
  parallel: false
  commands:
    legacy-guard:
      run: bash scripts/legacy-guard.sh {staged_files}
    content-guard:
      run: bash scripts/content-guard.sh {staged_files}
    hard-invariant:
      run: npx tsx scripts/hard-invariant.mjs {staged_files}
    typecheck:
      glob: '*.{ts,tsx,astro}'
      run: npx tsc --noEmit
    eslint:
      glob: '*.{ts,tsx,astro}'
      run: npx eslint {staged_files}
    prettier:
      glob: '*.{ts,tsx,astro,md,json,yml,yaml}'
      run: npx prettier --check {staged_files}
```

- [ ] **Step 6: Commit**

```bash
git add scripts/hard-invariant.mjs tests/scripts/hard-invariant.test.ts lefthook.yml
git commit -m "$(cat <<'EOF'
feat(lefthook): add hard-invariant pre-commit hook

Wires src/lib/content/validate.ts into lefthook. When a commit stages
files under src/content/, the hook loads both language sides of each
touched chapter and runs validatePair() from the shared validator.
Violations print each error and block the commit.

checkStagedContent() is extracted for testability; tests inject a
fake file reader.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P5.4: Integration test — all three hooks fire correctly on a full pre-commit run

**Files:**

- No new files. This task is a manual verification that all three new hooks co-exist cleanly with the existing typecheck/eslint/prettier hooks.

- [ ] **Step 1: Run `lefthook run pre-commit` on a clean tree**

```bash
lefthook run pre-commit
```

Expected: every hook reports "skip" (no staged files match their globs). Exit 0.

- [ ] **Step 2: Stage an innocuous change (e.g., this plan file edit) and re-run**

```bash
git add docs/superpowers/plans/v1-foundation/p5-hooks.md
lefthook run pre-commit
```

Expected: legacy-guard skips (no legacy/), content-guard skips (no src/content/), hard-invariant skips (no touched chapters), prettier runs against the staged markdown. All exit 0.

- [ ] **Step 3: Record the verification in the commit body**

No separate commit needed for P5.4 — the hooks are already on `main` from P5.1-P5.3. Optionally, create an empty commit:

```bash
git commit --allow-empty -m "$(cat <<'EOF'
chore: verify lefthook hooks after P5

Empty commit to confirm the three new hooks (legacy-guard,
content-guard, hard-invariant) co-exist cleanly with typecheck,
eslint, and prettier. Exit 0 on a clean tree.

Part of #3
(*BB:Plantin*)
EOF
)"
```

---

## Phase 5 exit check

- [ ] **`lefthook run pre-commit` exits 0 on a clean tree**
- [ ] **`bash scripts/legacy-guard.sh` blocks staged legacy/ files without `LEGACY_OVERRIDE=1`**
- [ ] **`bash scripts/content-guard.sh` blocks staged src/content/ files without `CONTENT_BOOTSTRAP=1`**
- [ ] **`hard-invariant` catches a manufactured EN/ET pair mismatch (unit tested in `tests/scripts/hard-invariant.test.ts`)**
- [ ] **`npm run test` green**
- [ ] **Push to `origin/main`**

**Next phase:** [P6 — Land the content](./p6-land-content.md)

(_BB:Plantin_)
