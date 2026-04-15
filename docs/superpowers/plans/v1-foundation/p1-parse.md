# v1-foundation · Phase 1: Parse module

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this phase task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Plan overview:** [v1-foundation/README.md](./README.md)
**Tracking issue:** [#3 — Epic: v1-foundation](https://github.com/mitselek/bigbook/issues/3)
**Design spec:** [Discussion #2](https://github.com/mitselek/bigbook/discussions/2) · [committed spec](../../specs/2026-04-14-bigbook-reader-design.md)
**Prerequisites:** [P0 — Infrastructure](./p0-infrastructure.md) committed + pushed to `origin/main`
**Commit convention:** every commit in this phase has `Part of #3` in the body.

Build `src/lib/content/parse.ts` — a pure TypeScript parser that takes a content-markdown file string and returns a structured `ParsedChapter` with YAML frontmatter and a `Map<para-id, text>`. This is the first real code-writing phase; the TDD discipline from design-spec §3.7 starts here.

**What the parser handles:**

- The file's YAML frontmatter (three flat string fields: `chapter`, `title`, `lang`)
- A body of paragraphs, each introduced by a `::para[<id>]` directive on its own line
- Multi-line paragraph bodies (lines between one directive and the next)
- Specific structured errors for missing frontmatter, malformed YAML, and malformed directives

**What the parser does NOT handle:** Hard Invariant checks (unique ids, EN/ET pairing) — that's Phase 2's `validate.ts`. The parser is deliberately permissive so it can be used by the validator, the editor pre-flight, and lefthook hooks without each caller re-doing upstream work.

**File format reference.** From design-spec §3.2:

```markdown
---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest, kes oleks läbi kukkunud, kui ta oleks põhjalikult järginud meie teed.
Need, kes ei parane, on inimesed, kes ei saa või ei taha end täielikult pühendada sellele lihtsale programmile.

::para[ch05-p002]
Meie lood avaldavad üldjoontes, millised me olime.
```

**YAML parsing approach:** hand-rolled regex over the three flat string fields. No new dependency — the schema is trivial (three `key: value` lines), and a hand-rolled parser keeps the tree leaner and failure modes predictable. If the schema ever grows to need real YAML features (lists, nested objects, quoted scalars with escape sequences), swap in the `yaml` library then.

**Files touched in Phase 1:**

- Create: `src/lib/content/parse.ts`
- Create: `tests/lib/content/parse.test.ts`

---

## Task P1.1: Module scaffold + first test (frontmatter-only file parses)

Create the module with its exported types and a stub `parse()` function, then TDD the first real behavior — a file containing only valid frontmatter parses to `{ frontmatter, paragraphs: new Map() }`.

**Files:**

- Create: `src/lib/content/parse.ts`
- Create: `tests/lib/content/parse.test.ts`

- [ ] **Step 1: Create the test file with the first failing test**

New file `tests/lib/content/parse.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parse } from '../../../src/lib/content/parse'

describe('parse()', () => {
  it('parses a file with only frontmatter', () => {
    const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---
`
    const result = parse(input)
    expect(result.frontmatter).toEqual({
      chapter: 'ch05',
      title: 'Kuidas see toimib',
      lang: 'et',
    })
    expect(result.paragraphs.size).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts
```

Expected: failure with "Cannot find module `../../../src/lib/content/parse`" (the source file doesn't exist yet).

- [ ] **Step 3: Create the minimal implementation**

New file `src/lib/content/parse.ts`:

```ts
export type ChapterFrontmatter = {
  chapter: string
  title: string
  lang: 'en' | 'et'
}

export type ParsedChapter = {
  frontmatter: ChapterFrontmatter
  paragraphs: Map<string, string>
}

export type ParseErrorCategory =
  | 'frontmatter_missing'
  | 'frontmatter_malformed'
  | 'directive_malformed'

export class ParseError extends Error {
  constructor(
    public readonly category: ParseErrorCategory,
    message: string,
    public readonly line?: number,
  ) {
    super(message)
    this.name = 'ParseError'
  }
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/

export function parse(content: string): ParsedChapter {
  const match = content.match(FRONTMATTER_RE)
  if (!match) {
    throw new ParseError('frontmatter_missing', 'file must begin with a YAML frontmatter block')
  }
  const [, frontmatterBlock] = match
  const frontmatter = parseFrontmatter(frontmatterBlock)
  return {
    frontmatter,
    paragraphs: new Map(),
  }
}

function parseFrontmatter(block: string): ChapterFrontmatter {
  const entries = new Map<string, string>()
  for (const line of block.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    entries.set(m[1], m[2].trim())
  }
  const chapter = entries.get('chapter') ?? ''
  const title = entries.get('title') ?? ''
  const lang = entries.get('lang') ?? ''
  if (lang !== 'en' && lang !== 'et') {
    throw new ParseError('frontmatter_malformed', `lang must be 'en' or 'et', got '${lang}'`)
  }
  return { chapter, title, lang }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts
```

Expected: 1 test passing, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/parse.ts tests/lib/content/parse.test.ts
git commit -m "$(cat <<'EOF'
feat(parse): module scaffold + frontmatter-only parsing

Exports ChapterFrontmatter, ParsedChapter, ParseError, ParseErrorCategory,
and a parse() function that handles the frontmatter-only case.
Body parsing lands in P1.2.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P1.2: Parse a single paragraph directive

Extend `parse()` to recognize `::para[<id>]\n<body>` and produce one entry in the `paragraphs` Map.

**Files:**

- Modify: `src/lib/content/parse.ts`
- Modify: `tests/lib/content/parse.test.ts`

- [ ] **Step 1: Add the failing test**

Append to `tests/lib/content/parse.test.ts` inside the existing `describe('parse()', …)` block:

```ts
it('parses a file with one paragraph directive', () => {
  const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib
`
  const result = parse(input)
  expect(result.paragraphs.size).toBe(1)
  expect(result.paragraphs.get('ch05-title')).toBe('Kuidas see toimib')
})
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts -t 'one paragraph directive'
```

Expected: 1 test failing — `paragraphs.size` is 0 (current impl returns an empty Map regardless of body).

- [ ] **Step 3: Extend `parse()` to handle body directives**

In `src/lib/content/parse.ts`, replace the return statement at the bottom of `parse()`:

```ts
return {
  frontmatter,
  paragraphs: new Map(),
}
```

with:

```ts
const [, , body] = match
return {
  frontmatter,
  paragraphs: parseBody(body),
}
```

And add a new `parseBody` helper at the bottom of the file:

```ts
const DIRECTIVE_RE = /^::para\[([^\]]+)\]$/

function parseBody(body: string): Map<string, string> {
  const paragraphs = new Map<string, string>()
  const lines = body.split('\n')
  let currentId: string | null = null
  let currentLines: string[] = []

  const flush = () => {
    if (currentId !== null) {
      paragraphs.set(currentId, currentLines.join('\n').trim())
    }
  }

  for (const line of lines) {
    const directive = line.match(DIRECTIVE_RE)
    if (directive) {
      flush()
      currentId = directive[1]
      currentLines = []
    } else if (currentId !== null) {
      currentLines.push(line)
    }
  }
  flush()

  return paragraphs
}
```

- [ ] **Step 4: Run all parse tests and verify they pass**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts
```

Expected: 2 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/parse.ts tests/lib/content/parse.test.ts
git commit -m "$(cat <<'EOF'
feat(parse): recognize ::para[id] directives

Accumulates lines between directives, flushes on the next directive
or EOF. Trims whitespace on flush. Returns paragraphs as a
Map<para-id, text>.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P1.3: Parse multiple paragraphs in order

Verify the parser handles multiple directives correctly and preserves order.

**Files:**

- Modify: `tests/lib/content/parse.test.ts`

No source change needed — the current implementation already loops. This task confirms that with a dedicated test.

- [ ] **Step 1: Add the test**

Append inside the `describe('parse()', …)`:

```ts
it('parses multiple paragraphs preserving order', () => {
  const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.

::para[ch05-p002]
Meie lood avaldavad üldjoontes.
`
  const result = parse(input)
  expect([...result.paragraphs.keys()]).toEqual(['ch05-title', 'ch05-p001', 'ch05-p002'])
  expect(result.paragraphs.get('ch05-p001')).toBe('Oleme harva näinud inimest.')
  expect(result.paragraphs.get('ch05-p002')).toBe('Meie lood avaldavad üldjoontes.')
})
```

- [ ] **Step 2: Run and verify it passes immediately**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts -t 'multiple paragraphs'
```

Expected: 1 test passing on the first run. If it fails, the loop in `parseBody` has a bug — investigate. No implementation change should be needed. JavaScript `Map` preserves insertion order by spec, so iteration order matches directive order.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/content/parse.test.ts
git commit -m "$(cat <<'EOF'
test(parse): confirm multi-paragraph order preservation

No impl change — verifies Map insertion order matches directive order.
Explicit test because the Hard Invariant operations (pairing, diff)
downstream depend on stable iteration order.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P1.4: Multi-line paragraph body

Test that paragraph text spanning multiple lines is captured with a single `\n` between lines, no trailing or leading blanks.

**Files:**

- Modify: `tests/lib/content/parse.test.ts`

- [ ] **Step 1: Add the failing test**

Append:

```ts
it('joins multi-line paragraph bodies with a single newline', () => {
  const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-p001]
Oleme harva näinud inimest, kes oleks läbi kukkunud,
kui ta oleks põhjalikult järginud meie teed.
Need, kes ei parane, on inimesed, kes ei saa või ei taha.
`
  const result = parse(input)
  expect(result.paragraphs.get('ch05-p001')).toBe(
    'Oleme harva näinud inimest, kes oleks läbi kukkunud,\n' +
      'kui ta oleks põhjalikult järginud meie teed.\n' +
      'Need, kes ei parane, on inimesed, kes ei saa või ei taha.',
  )
})
```

- [ ] **Step 2: Run and verify behavior**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts -t 'multi-line'
```

Expected outcome: the test passes immediately — the `parseBody` from P1.2 already handles this correctly (lines push into `currentLines`, are joined with `\n`, then trimmed on flush). If it fails, investigate the accumulator.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/content/parse.test.ts
git commit -m "$(cat <<'EOF'
test(parse): confirm multi-line paragraph body is joined correctly

Verifies that lines between one directive and the next are joined
with a single newline and surrounding whitespace is trimmed.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P1.5: Error — missing frontmatter

Verify that a file without a `---`-wrapped frontmatter block throws `ParseError` with category `frontmatter_missing`.

**Files:**

- Modify: `tests/lib/content/parse.test.ts`

- [ ] **Step 1: Add the failing test**

Append:

```ts
it('throws ParseError when frontmatter is missing', () => {
  const input = `::para[ch05-title]
Kuidas see toimib
`
  expect(() => parse(input)).toThrow(ParseError)
  try {
    parse(input)
  } catch (err) {
    expect(err).toBeInstanceOf(ParseError)
    expect((err as ParseError).category).toBe('frontmatter_missing')
  }
})
```

And update the import line at the top of the test file to pull in the `ParseError` class:

```ts
import { parse, ParseError } from '../../../src/lib/content/parse'
```

- [ ] **Step 2: Run and verify it passes**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts -t 'frontmatter is missing'
```

Expected: 1 test passing. The current implementation already throws `ParseError('frontmatter_missing', …)` when the regex doesn't match, so this should pass on the first run.

- [ ] **Step 3: Commit**

```bash
git add tests/lib/content/parse.test.ts
git commit -m "$(cat <<'EOF'
test(parse): confirm missing frontmatter throws ParseError

Locks in the structured error category 'frontmatter_missing'.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P1.6: Error — malformed directive

Verify that a directive line that doesn't match `::para[<id>]` exactly throws a `ParseError` with category `directive_malformed`.

**Files:**

- Modify: `src/lib/content/parse.ts`
- Modify: `tests/lib/content/parse.test.ts`

The current `parseBody` doesn't validate directive shape — any line that doesn't match `DIRECTIVE_RE` is just treated as body text if a directive was seen, or silently ignored if not. We need to flag lines that **look like** a directive but are malformed (e.g., `::para[` unterminated, `::para[]` empty id, `::para[ch05-p001` missing closing bracket).

- [ ] **Step 1: Add the failing test**

Append:

```ts
it('throws ParseError when a directive line is malformed', () => {
  const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-p001
Oleme harva näinud inimest.
`
  expect(() => parse(input)).toThrow(ParseError)
  try {
    parse(input)
  } catch (err) {
    expect((err as ParseError).category).toBe('directive_malformed')
  }
})

it('throws ParseError when a directive has an empty id', () => {
  const input = `---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[]
text
`
  expect(() => parse(input)).toThrow(ParseError)
  try {
    parse(input)
  } catch (err) {
    expect((err as ParseError).category).toBe('directive_malformed')
  }
})
```

- [ ] **Step 2: Run and verify it fails**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts -t 'directive'
```

Expected: both new tests fail. The first because `::para[ch05-p001` (missing `]`) is silently treated as body text. The second because `::para[]` matches a greedy regex variant but has an empty id.

- [ ] **Step 3: Add directive malformation detection**

In `src/lib/content/parse.ts`, replace the existing `DIRECTIVE_RE` constant and the `parseBody` function with:

```ts
const DIRECTIVE_RE = /^::para\[([^\]]+)\]$/
const DIRECTIVE_PREFIX_RE = /^::para\[/

function parseBody(body: string): Map<string, string> {
  const paragraphs = new Map<string, string>()
  const lines = body.split('\n')
  let currentId: string | null = null
  let currentLines: string[] = []

  const flush = () => {
    if (currentId !== null) {
      paragraphs.set(currentId, currentLines.join('\n').trim())
    }
  }

  lines.forEach((line, index) => {
    const directive = line.match(DIRECTIVE_RE)
    if (directive) {
      flush()
      currentId = directive[1]
      currentLines = []
      return
    }
    // If the line starts with ::para[ but doesn't match the full directive,
    // it's a malformed directive line, not body text.
    if (DIRECTIVE_PREFIX_RE.test(line)) {
      throw new ParseError(
        'directive_malformed',
        `malformed ::para[] directive: ${JSON.stringify(line)}`,
        index + 1,
      )
    }
    if (currentId !== null) {
      currentLines.push(line)
    }
  })
  flush()

  return paragraphs
}
```

Changes:

- `DIRECTIVE_PREFIX_RE` detects lines that look like they're trying to be directives.
- If a line matches the prefix but not the full shape, throw `directive_malformed`.
- The `[^\]]+` in `DIRECTIVE_RE` requires at least one character between brackets, so `::para[]` fails `DIRECTIVE_RE` but matches `DIRECTIVE_PREFIX_RE`, correctly raising the error.

- [ ] **Step 4: Run all tests and verify green**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts
```

Expected: all tests passing (including the two new malformed-directive tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/parse.ts tests/lib/content/parse.test.ts
git commit -m "$(cat <<'EOF'
feat(parse): detect malformed ::para[] directives

Lines that look like directives (match ::para[) but don't parse
as a complete ::para[<id>] throw ParseError('directive_malformed')
with the offending line and 1-based line number. Catches both
unterminated directives and empty-id directives.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P1.7: Error — malformed YAML frontmatter

Verify that a `---`-wrapped block whose content doesn't parse as our three expected fields throws `ParseError` with category `frontmatter_malformed`.

**Files:**

- Modify: `src/lib/content/parse.ts`
- Modify: `tests/lib/content/parse.test.ts`

The current `parseFrontmatter` already throws `frontmatter_malformed` if `lang` is not `'en'` or `'et'`. Here we add explicit validation for missing `chapter`, missing `title`, and unknown extra fields — and lock it in with tests.

- [ ] **Step 1: Add the failing tests**

Append:

```ts
it('throws when frontmatter is missing the chapter field', () => {
  const input = `---
title: Kuidas see toimib
lang: et
---
`
  expect(() => parse(input)).toThrow(ParseError)
  try {
    parse(input)
  } catch (err) {
    expect((err as ParseError).category).toBe('frontmatter_malformed')
  }
})

it('throws when lang is not en or et', () => {
  const input = `---
chapter: ch05
title: Kuidas see toimib
lang: de
---
`
  expect(() => parse(input)).toThrow(ParseError)
  try {
    parse(input)
  } catch (err) {
    expect((err as ParseError).category).toBe('frontmatter_malformed')
  }
})
```

- [ ] **Step 2: Run and verify — `lang: de` already fails, the missing-chapter case passes silently**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts -t 'frontmatter'
```

Expected: the `lang: de` test passes (the existing implementation already rejects it); the missing-chapter test fails (the current implementation defaults missing fields to empty string and returns them).

- [ ] **Step 3: Tighten `parseFrontmatter`**

In `src/lib/content/parse.ts`, replace the `parseFrontmatter` function with:

```ts
function parseFrontmatter(block: string): ChapterFrontmatter {
  const entries = new Map<string, string>()
  for (const line of block.split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (!m) continue
    entries.set(m[1], m[2].trim())
  }

  const chapter = entries.get('chapter')
  const title = entries.get('title')
  const lang = entries.get('lang')

  if (!chapter) {
    throw new ParseError('frontmatter_malformed', 'frontmatter is missing required field: chapter')
  }
  if (!title) {
    throw new ParseError('frontmatter_malformed', 'frontmatter is missing required field: title')
  }
  if (lang !== 'en' && lang !== 'et') {
    throw new ParseError(
      'frontmatter_malformed',
      `frontmatter.lang must be 'en' or 'et', got '${lang ?? '(missing)'}'`,
    )
  }

  return { chapter, title, lang }
}
```

- [ ] **Step 4: Run all tests**

Run:

```bash
npx vitest run tests/lib/content/parse.test.ts
```

Expected: all tests passing. The suite now covers: frontmatter-only file, one paragraph, multiple paragraphs in order, multi-line body, missing frontmatter, malformed directive (unterminated), malformed directive (empty id), missing chapter field, unknown lang.

- [ ] **Step 5: Verify coverage**

Run:

```bash
npm run test:coverage
```

Expected: `src/lib/content/parse.ts` at 100% lines, 100% functions, 100% statements, ≥85% branches. If branch coverage is below 85%, add a test for any uncovered conditional.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/parse.ts tests/lib/content/parse.test.ts
git commit -m "$(cat <<'EOF'
feat(parse): strict frontmatter field validation

Required fields (chapter, title, lang) throw ParseError(
'frontmatter_malformed') when missing or invalid. lang must be
literal 'en' or 'et'. Closes the Phase 1 behavior set.

Coverage for src/lib/content/parse.ts: 100% lines/functions/
statements with the suite in tests/lib/content/parse.test.ts.

Part of #3
(*BB:Plantin*)
EOF
)"
```

---

## Phase 1 exit check

Before moving to Phase 2:

- [ ] **`npm run test` green**
- [ ] **`npm run test:coverage` green** (src/lib/content coverage ≥ 90%)
- [ ] **`npm run typecheck` green**
- [ ] **`npm run lint` green**
- [ ] **`npm run format:check` green**
- [ ] **Push to `origin/main`** — Phase 1 commits land on main; the build workflow passes (no Astro-facing changes); Pages deploy is a no-op (no `dist/` content changed).

**Next phase:** [P2 — Validate module](./p2-validate.md) — to be written after Phase 1 is reviewed and green.

(_BB:Plantin_)
