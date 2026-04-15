# v1-foundation · Phase 2: Validate module

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this phase task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Plan overview:** [v1-foundation/README.md](./README.md)
**Tracking issue:** [#3 — Epic: v1-foundation](https://github.com/mitselek/bigbook/issues/3)
**Design spec:** [Discussion #2](https://github.com/mitselek/bigbook/discussions/2) · [committed spec](../../specs/2026-04-14-bigbook-reader-design.md)
**Prerequisites:** [P1 — Parse module](./p1-parse.md) committed + pushed to `origin/main`
**Commit convention:** every commit in this phase has `Part of #3` in the body.

Build `src/lib/content/validate.ts` — the **shared validator** called by three distinct consumers:

1. Vitest tests (`tests/lib/content/invariant.test.ts`) — catches regressions during development.
2. The **editor pre-flight** inside `InlineEditor.svelte` (Plan 3, Phase C) — rejects a proposed edit before firing `PUT` to the Contents API, so a malformed edit never reaches `main`.
3. The `hard-invariant` lefthook pre-commit hook (Phase 5) — catches the same class of mistakes on dev-team local commits.

One implementation, three call sites: fix a bug in `validate.ts` and all three gates pick up the fix simultaneously.

## What this module validates

The parser (Phase 1) already catches file-level shape errors (missing frontmatter, malformed `::para[]` directives, invalid `lang`). The validator runs against the **output** of parse — a `ParsedChapter` — and enforces the **Hard Invariant** from design-spec §1.4: every `para-id` in the English chapter has exactly one pair in the Estonian chapter, and vice versa. No orphans, no duplicates, no renames.

Two public functions:

- **`validatePair(en, et)`** — given two parsed chapters (one per language), confirm both sides have exactly the same set of `para-id`s. Used by the `hard-invariant` lefthook hook and the bootstrap script's sanity check in Phase 4.
- **`validateProposedContent(proposed, reference?)`** — parse a proposed file content string; if a reference `Set<para-id>` is provided, confirm the parsed result has exactly that set (no ids added, removed, or renamed as a side effect of a text edit). Used by the editor pre-flight in Plan 3.

Why no `validateChapter`? Because `parse()` already produces a `Map<string, string>`, whose keys are unique by construction. Per-chapter "duplicate id" is impossible by the time we reach the validator. Empty ids are impossible too — `DIRECTIVE_RE` in the parser requires at least one character between the brackets. The validator only needs to handle pair-level consistency.

**Files touched in Phase 2:**

- Create: `src/lib/content/validate.ts`
- Create: `tests/lib/content/validate.test.ts`

---

## Task P2.1: Module scaffold + empty-case validatePair

Create the module with its types and the simplest `validatePair` case: two chapters with the same para-id set validate cleanly.

**Files:**

- Create: `src/lib/content/validate.ts`
- Create: `tests/lib/content/validate.test.ts`

- [ ] **Step 1: Create the failing test**

New file `tests/lib/content/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { validatePair } from '../../../src/lib/content/validate'
import type { ParsedChapter } from '../../../src/lib/content/parse'

function chapter(lang: 'en' | 'et', paragraphs: Record<string, string>): ParsedChapter {
  return {
    frontmatter: { chapter: 'ch05', title: 'How It Works', lang },
    paragraphs: new Map(Object.entries(paragraphs)),
  }
}

describe('validatePair()', () => {
  it('returns ok when both chapters share the same para-id set', () => {
    const en = chapter('en', {
      'ch05-title': 'How It Works',
      'ch05-p001': 'Rarely have we seen a person fail.',
    })
    const et = chapter('et', {
      'ch05-title': 'Kuidas see toimib',
      'ch05-p001': 'Oleme harva näinud inimest.',
    })
    expect(validatePair(en, et)).toEqual({ ok: true })
  })
})
```

- [ ] **Step 2: Run and verify it fails**

Run:

```bash
npx vitest run tests/lib/content/validate.test.ts
```

Expected: failure with "Cannot find module `../../../src/lib/content/validate`" (source file doesn't exist yet).

- [ ] **Step 3: Create `src/lib/content/validate.ts`**

New file content:

```ts
import type { ParsedChapter } from './parse'

export type ValidationErrorCategory = 'missing_pair' | 'extra_pair' | 'parse_error'

export type ValidationError = {
  category: ValidationErrorCategory
  paraId: string
  message: string
}

export type ValidationResult = { ok: true } | { ok: false; errors: ValidationError[] }

/**
 * Validate that two chapters have the same set of `para-id`s. Used by the
 * hard-invariant lefthook hook and the content bootstrap script.
 */
export function validatePair(en: ParsedChapter, et: ParsedChapter): ValidationResult {
  const errors: ValidationError[] = []
  const enIds = new Set(en.paragraphs.keys())
  const etIds = new Set(et.paragraphs.keys())

  for (const id of enIds) {
    if (!etIds.has(id)) {
      errors.push({
        category: 'missing_pair',
        paraId: id,
        message: `EN has para-id '${id}' but ET does not`,
      })
    }
  }
  for (const id of etIds) {
    if (!enIds.has(id)) {
      errors.push({
        category: 'extra_pair',
        paraId: id,
        message: `ET has para-id '${id}' but EN does not`,
      })
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run:

```bash
npx vitest run tests/lib/content/validate.test.ts
```

Expected: 1 test passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/validate.ts tests/lib/content/validate.test.ts
git commit -m "$(cat <<'EOF'
feat(validate): module scaffold + validatePair happy path

Exports ValidationError, ValidationErrorCategory, ValidationResult,
and validatePair() which confirms two parsed chapters have the same
set of para-ids. First test covers the happy path (both chapters
identical in structure).

Error categories (missing_pair, extra_pair) are locked in by tests
in P2.2. parse_error is reserved for validateProposedContent() in P2.3.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P2.2: validatePair detects missing_pair and extra_pair

Lock in the two error cases. The implementation from P2.1 already handles both — this task confirms with dedicated tests.

**Files:**

- Modify: `tests/lib/content/validate.test.ts`

- [ ] **Step 1: Add two failing tests**

Append inside the `describe('validatePair()', …)` block:

```ts
it('reports missing_pair when EN has a para-id that ET lacks', () => {
  const en = chapter('en', {
    'ch05-title': 'How It Works',
    'ch05-p001': 'Rarely have we seen a person fail.',
    'ch05-p002': 'Our stories disclose in a general way.',
  })
  const et = chapter('et', {
    'ch05-title': 'Kuidas see toimib',
    'ch05-p001': 'Oleme harva näinud inimest.',
  })
  const result = validatePair(en, et)
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.errors).toHaveLength(1)
  expect(result.errors[0]).toMatchObject({
    category: 'missing_pair',
    paraId: 'ch05-p002',
  })
})

it('reports extra_pair when ET has a para-id that EN lacks', () => {
  const en = chapter('en', {
    'ch05-title': 'How It Works',
    'ch05-p001': 'Rarely have we seen a person fail.',
  })
  const et = chapter('et', {
    'ch05-title': 'Kuidas see toimib',
    'ch05-p001': 'Oleme harva näinud inimest.',
    'ch05-p002': 'Meie lood avaldavad üldjoontes.',
  })
  const result = validatePair(en, et)
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.errors).toHaveLength(1)
  expect(result.errors[0]).toMatchObject({
    category: 'extra_pair',
    paraId: 'ch05-p002',
  })
})

it('reports both missing_pair and extra_pair when ids diverge on both sides', () => {
  const en = chapter('en', {
    'ch05-title': 'How It Works',
    'ch05-p001': 'Text A.',
  })
  const et = chapter('et', {
    'ch05-title': 'Kuidas see toimib',
    'ch05-p002': 'Text B.',
  })
  const result = validatePair(en, et)
  expect(result.ok).toBe(false)
  if (result.ok) return
  const categories = result.errors.map((e) => e.category).sort()
  expect(categories).toEqual(['extra_pair', 'missing_pair'])
})
```

- [ ] **Step 2: Run all validate tests**

Run:

```bash
npx vitest run tests/lib/content/validate.test.ts
```

Expected: 4 tests passing (1 from P2.1 + 3 from P2.2). The implementation from P2.1 already handles all three cases correctly, so no source change is needed.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/content/validate.test.ts
git commit -m "$(cat <<'EOF'
test(validate): lock in missing_pair, extra_pair, and both

No impl change — these cases are covered by the validatePair loop
already. Explicit tests because the Hard Invariant depends on these
being rejected definitively.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P2.3: validateProposedContent — parse success and parse error

Add the second public function, `validateProposedContent`, which wraps `parse()` so the editor pre-flight can validate a raw content string in one call.

**Files:**

- Modify: `src/lib/content/validate.ts`
- Modify: `tests/lib/content/validate.test.ts`

- [ ] **Step 1: Add the failing tests**

Append to `tests/lib/content/validate.test.ts` inside the existing `describe` or in a new `describe('validateProposedContent()', …)` block:

```ts
describe('validateProposedContent()', () => {
  const validContent = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.
`

  it('returns ok when the content parses and no reference set is given', () => {
    const result = validateProposedContent(validContent)
    expect(result).toEqual({ ok: true })
  })

  it('wraps ParseError into ValidationResult with category parse_error', () => {
    const malformed = `::para[ch05-p001]
no frontmatter
`
    const result = validateProposedContent(malformed)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].category).toBe('parse_error')
  })
})
```

And update the import line at the top of `tests/lib/content/validate.test.ts`:

```ts
import { validatePair, validateProposedContent } from '../../../src/lib/content/validate'
```

- [ ] **Step 2: Run and verify both fail**

Run:

```bash
npx vitest run tests/lib/content/validate.test.ts -t 'validateProposedContent'
```

Expected: both new tests fail — `validateProposedContent` is not yet exported.

- [ ] **Step 3: Add `validateProposedContent` to `validate.ts`**

In `src/lib/content/validate.ts`, update the imports:

```ts
import { parse, ParseError } from './parse'
import type { ParsedChapter } from './parse'
```

And add the new function at the bottom of the file:

```ts
/**
 * Parse a proposed content string and optionally confirm it has exactly the
 * same set of para-ids as a reference set. Used by the editor pre-flight
 * gate inside InlineEditor.svelte before firing a PUT to the Contents API.
 */
export function validateProposedContent(
  proposedContent: string,
  referenceParaIds?: Set<string>,
): ValidationResult {
  let parsed: ParsedChapter
  try {
    parsed = parse(proposedContent)
  } catch (err) {
    if (err instanceof ParseError) {
      return {
        ok: false,
        errors: [
          {
            category: 'parse_error',
            paraId: '',
            message: `${err.category}: ${err.message}`,
          },
        ],
      }
    }
    throw err
  }

  if (!referenceParaIds) return { ok: true }

  const errors: ValidationError[] = []
  const actualIds = new Set(parsed.paragraphs.keys())
  for (const id of referenceParaIds) {
    if (!actualIds.has(id)) {
      errors.push({
        category: 'missing_pair',
        paraId: id,
        message: `proposed content is missing para-id '${id}'`,
      })
    }
  }
  for (const id of actualIds) {
    if (!referenceParaIds.has(id)) {
      errors.push({
        category: 'extra_pair',
        paraId: id,
        message: `proposed content has unexpected para-id '${id}'`,
      })
    }
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors }
}
```

- [ ] **Step 4: Run all validate tests**

Run:

```bash
npx vitest run tests/lib/content/validate.test.ts
```

Expected: 6 tests passing (4 from earlier + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/validate.ts tests/lib/content/validate.test.ts
git commit -m "$(cat <<'EOF'
feat(validate): validateProposedContent for editor pre-flight

Wraps parse() so the editor can validate a raw content string in one
call. ParseError is caught and re-emitted as a ValidationError with
category 'parse_error'. The referenceParaIds parameter is optional;
when omitted, the function only verifies the content parses.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P2.4: validateProposedContent — reference para-id mismatch

Add the test cases for when a proposed edit has a missing or unexpected para-id relative to the reference set.

**Files:**

- Modify: `tests/lib/content/validate.test.ts`

The P2.3 implementation already handles reference mismatches. This task locks in the behavior with dedicated tests.

- [ ] **Step 1: Add the tests**

Inside the `describe('validateProposedContent()', …)` block, append:

```ts
it('reports missing_pair when a reference id is missing from the proposed content', () => {
  const proposed = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib
`
  const referenceIds = new Set(['ch05-title', 'ch05-p001'])
  const result = validateProposedContent(proposed, referenceIds)
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.errors).toHaveLength(1)
  expect(result.errors[0]).toMatchObject({
    category: 'missing_pair',
    paraId: 'ch05-p001',
  })
})

it('reports extra_pair when the proposed content adds a new para-id', () => {
  const proposed = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme.

::para[ch05-p002]
Meie.
`
  const referenceIds = new Set(['ch05-title', 'ch05-p001'])
  const result = validateProposedContent(proposed, referenceIds)
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.errors).toHaveLength(1)
  expect(result.errors[0]).toMatchObject({
    category: 'extra_pair',
    paraId: 'ch05-p002',
  })
})

it('returns ok when the proposed content matches the reference id set exactly', () => {
  const proposed = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Edited title

::para[ch05-p001]
Edited paragraph.
`
  const referenceIds = new Set(['ch05-title', 'ch05-p001'])
  expect(validateProposedContent(proposed, referenceIds)).toEqual({ ok: true })
})
```

- [ ] **Step 2: Run all tests and verify coverage**

Run:

```bash
npm run test
npm run test:coverage
```

Expected: all validate tests passing. `src/lib/content/validate.ts` coverage reports ≥90% lines/functions/statements and ≥85% branches. If branch coverage is below 85%, add a test for any uncovered branch.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/content/validate.test.ts
git commit -m "$(cat <<'EOF'
test(validate): lock in reference id set mismatches

Three cases:
- missing reference id (user deleted a paragraph) → missing_pair
- extra id in proposed content (user added a paragraph) → extra_pair
- exact match after text edit → ok

These lock in the editor pre-flight contract: text may change, para-ids
may not.

Part of #3
(*BB:Plantin*)
EOF
)"
```

---

## Phase 2 exit check

- [ ] **`npm run test` green**
- [ ] **`npm run test:coverage` green** (src/lib/content ≥ 90% lines/functions/statements, ≥ 85% branches)
- [ ] **`npm run typecheck` green**
- [ ] **`npm run lint` green**
- [ ] **`npm run format:check` green**
- [ ] **Push to `origin/main`** — Phase 2 commits land on `main`; build workflow passes; Pages deploy is a no-op.

**Next phase:** [P3 — Diff module](./p3-diff.md)

(_BB:Plantin_)
