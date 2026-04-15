# v1-foundation · Phase 3: Diff module

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this phase task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Plan overview:** [v1-foundation/README.md](./README.md)
**Tracking issue:** [#3 — Epic: v1-foundation](https://github.com/mitselek/bigbook/issues/3)
**Design spec:** [Discussion #2](https://github.com/mitselek/bigbook/discussions/2) · [committed spec](../../specs/2026-04-14-bigbook-reader-design.md)
**Prerequisites:** [P2 — Validate module](./p2-validate.md) committed + pushed to `origin/main`
**Commit convention:** every commit in this phase has `Part of #3` in the body.

Build `src/lib/content/diff.ts` — a pure function that compares a **current** chapter to a **baseline** chapter and returns the set of `para-id`s whose text has changed. This is what the reader uses at render time (Plan 2) to decide which paragraphs get a baseline-diff annotation in the marginalia column.

## Behavior

- **Input:** two `ParsedChapter` values — current ET and baseline ET for the same chapter.
- **Output:** a `Set<string>` of `para-id`s where `current.paragraphs.get(id) !== baseline.paragraphs.get(id)`.
- **Permissive about shape:** the diff function does **not** verify that both sides have the same `para-id` set (that's the validator's job in Phase 2). If a `para-id` is in current but not baseline, it is not reported — baseline-diff annotations are only meaningful when a paragraph has a baseline to compare against. Likewise, `para-id`s present only in baseline are ignored.
- **String comparison:** exact byte comparison after parsing (no whitespace normalization, no case folding). The parser already trims leading/trailing whitespace per paragraph, so "current text exactly equals baseline text" is a meaningful equality.

## Why it's small

The `ParsedChapter` type from Phase 1 makes this trivial: iterate the intersection of the two Maps' keys, compare values, collect the differing ids. Three tasks, all simple.

**Files touched in Phase 3:**

- Create: `src/lib/content/diff.ts`
- Create: `tests/lib/content/diff.test.ts`

---

## Task P3.1: Module scaffold + identical chapters return empty Set

**Files:**

- Create: `src/lib/content/diff.ts`
- Create: `tests/lib/content/diff.test.ts`

- [ ] **Step 1: Create the failing test**

New file `tests/lib/content/diff.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { diffCurrentVsBaseline } from '../../../src/lib/content/diff'
import type { ParsedChapter } from '../../../src/lib/content/parse'

function chapter(paragraphs: Record<string, string>): ParsedChapter {
  return {
    frontmatter: { chapter: 'ch05', title: 'Kuidas see toimib', lang: 'et' },
    paragraphs: new Map(Object.entries(paragraphs)),
  }
}

describe('diffCurrentVsBaseline()', () => {
  it('returns an empty Set when current and baseline are identical', () => {
    const current = chapter({
      'ch05-title': 'Kuidas see toimib',
      'ch05-p001': 'Oleme harva näinud inimest.',
    })
    const baseline = chapter({
      'ch05-title': 'Kuidas see toimib',
      'ch05-p001': 'Oleme harva näinud inimest.',
    })
    expect(diffCurrentVsBaseline(current, baseline)).toEqual(new Set())
  })
})
```

- [ ] **Step 2: Run and verify it fails**

Run:

```bash
npx vitest run tests/lib/content/diff.test.ts
```

Expected: failure with "Cannot find module `../../../src/lib/content/diff`".

- [ ] **Step 3: Create `src/lib/content/diff.ts`**

New file content:

```ts
import type { ParsedChapter } from './parse'

/**
 * Return the set of `para-id`s whose text differs between current and
 * baseline. Permissive about mismatched id sets — para-ids that exist in
 * only one side are not reported (the validator in validate.ts handles
 * the Hard Invariant at commit time).
 */
export function diffCurrentVsBaseline(
  current: ParsedChapter,
  baseline: ParsedChapter,
): Set<string> {
  const diverged = new Set<string>()
  for (const [id, currentText] of current.paragraphs) {
    const baselineText = baseline.paragraphs.get(id)
    if (baselineText === undefined) continue
    if (currentText !== baselineText) {
      diverged.add(id)
    }
  }
  return diverged
}
```

- [ ] **Step 4: Run and verify it passes**

Run:

```bash
npx vitest run tests/lib/content/diff.test.ts
```

Expected: 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/diff.ts tests/lib/content/diff.test.ts
git commit -m "$(cat <<'EOF'
feat(diff): module scaffold + identical-chapters empty result

diffCurrentVsBaseline() iterates current's para-ids, looks up the
matching id in baseline, and reports any where the text differs.
Permissive about mismatched id sets — validate.ts catches those.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P3.2: Detect a single diverged paragraph

**Files:**

- Modify: `tests/lib/content/diff.test.ts`

- [ ] **Step 1: Add the test**

Append inside `describe('diffCurrentVsBaseline()', …)`:

```ts
it('detects a single paragraph whose text has changed', () => {
  const current = chapter({
    'ch05-title': 'Kuidas see toimib',
    'ch05-p001': 'EDITED: Oleme harva näinud inimest.',
    'ch05-p002': 'Meie lood avaldavad üldjoontes.',
  })
  const baseline = chapter({
    'ch05-title': 'Kuidas see toimib',
    'ch05-p001': 'Oleme harva näinud inimest.',
    'ch05-p002': 'Meie lood avaldavad üldjoontes.',
  })
  expect(diffCurrentVsBaseline(current, baseline)).toEqual(new Set(['ch05-p001']))
})
```

- [ ] **Step 2: Run and verify it passes immediately**

Run:

```bash
npx vitest run tests/lib/content/diff.test.ts -t 'single paragraph'
```

Expected: 1 test passing. No source change needed.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/content/diff.test.ts
git commit -m "$(cat <<'EOF'
test(diff): confirm single-paragraph divergence detection

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P3.3: Multiple diverged paragraphs + permissive behavior on mismatched id sets

**Files:**

- Modify: `tests/lib/content/diff.test.ts`

- [ ] **Step 1: Add the tests**

Append:

```ts
it('detects multiple diverged paragraphs', () => {
  const current = chapter({
    'ch05-title': 'EDITED: Kuidas see toimib',
    'ch05-p001': 'EDITED: Oleme harva näinud inimest.',
    'ch05-p002': 'Meie lood avaldavad üldjoontes.',
  })
  const baseline = chapter({
    'ch05-title': 'Kuidas see toimib',
    'ch05-p001': 'Oleme harva näinud inimest.',
    'ch05-p002': 'Meie lood avaldavad üldjoontes.',
  })
  expect(diffCurrentVsBaseline(current, baseline)).toEqual(new Set(['ch05-title', 'ch05-p001']))
})

it('ignores para-ids present only in current (permissive — validator catches this)', () => {
  const current = chapter({
    'ch05-title': 'Kuidas see toimib',
    'ch05-p001': 'Oleme harva näinud inimest.',
    'ch05-p999': 'A new paragraph.',
  })
  const baseline = chapter({
    'ch05-title': 'Kuidas see toimib',
    'ch05-p001': 'Oleme harva näinud inimest.',
  })
  expect(diffCurrentVsBaseline(current, baseline)).toEqual(new Set())
})

it('ignores para-ids present only in baseline (permissive)', () => {
  const current = chapter({
    'ch05-title': 'Kuidas see toimib',
    'ch05-p001': 'Oleme harva näinud inimest.',
  })
  const baseline = chapter({
    'ch05-title': 'Kuidas see toimib',
    'ch05-p001': 'Oleme harva näinud inimest.',
    'ch05-p999': 'A paragraph that existed in baseline but was removed.',
  })
  expect(diffCurrentVsBaseline(current, baseline)).toEqual(new Set())
})
```

- [ ] **Step 2: Run all diff tests and verify coverage**

Run:

```bash
npx vitest run tests/lib/content/diff.test.ts
npm run test:coverage
```

Expected: 4 tests passing; `src/lib/content/diff.ts` coverage at 100% lines/functions/statements and ≥85% branches.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/content/diff.test.ts
git commit -m "$(cat <<'EOF'
test(diff): lock in multiple-change and permissive-id-set behavior

Three tests:
- Multiple diverged paragraphs in one call → full set returned
- Para-id present only in current → ignored
- Para-id present only in baseline → ignored

The permissive behavior is intentional and documented in the module
header — the validator owns Hard Invariant enforcement at commit time,
not diff at render time.

Part of #3
(*BB:Plantin*)
EOF
)"
```

---

## Phase 3 exit check

- [ ] **`npm run test` green** (parse + validate + diff all passing)
- [ ] **`npm run test:coverage` green** (src/lib/content ≥ 90% lines/functions/statements, ≥ 85% branches)
- [ ] **`npm run typecheck` green**
- [ ] **`npm run lint` green**
- [ ] **`npm run format:check` green**
- [ ] **Push to `origin/main`**

**Next phase:** [P4 — Bootstrap script](./p4-bootstrap.md)

(_BB:Plantin_)
