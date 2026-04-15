# v1-foundation · Phase 4: Bootstrap script

> **For agentic workers:** MIXED EXECUTION MODE — see the README's "Execution mode per phase" table. P4.2–P4.6 (pure helpers) run via the XP triple (`TeamCreate(team_name: "bigbook-dev")` + Montano/Granjon/Ortelius). P4.1 (scaffold + stub file) and P4.7 (`main()` orchestrator) run inline by Plantin because neither has a failing test to write. Steps use checkbox (`- [ ]`) syntax for tracking.

**Plan overview:** [v1-foundation/README.md](./README.md)
**Tracking issue:** [#3 — Epic: v1-foundation](https://github.com/mitselek/bigbook/issues/3)
**Design spec:** [Discussion #2](https://github.com/mitselek/bigbook/discussions/2) · [committed spec](../../specs/2026-04-14-bigbook-reader-design.md)
**Prerequisites:** [P3 — Diff module](./p3-diff.md) committed + pushed to `origin/main`
**Commit convention:** every commit in this phase has `Part of #3` in the body.

Build `scripts/bootstrap-mock-content.ts` — a one-shot Node script that scrapes the legacy Jekyll Estonian markdown under `legacy/peatykid/`, `legacy/kogemuslood/`, `legacy/lisad/`, and `legacy/front_matter/`, strips Jekyll frontmatter + liquid tags, splits into paragraphs, assigns `para-id`s, writes the ET files under `src/content/et/`, calls the Claude API to translate each paragraph to English, writes the EN files under `src/content/en/`, validates the result against the Hard Invariant, and emits `src/lib/content/manifest.ts` (`src/lib/content/baseline-config.ts` is written in Phase 6 after the content commit lands).

**This phase builds the script only — it does not run it.** Phase 6 runs the script and commits the generated content. This separation lets us TDD the pure helper functions without needing network access to the Claude API or a clean `src/content/` tree.

> **Language + scope note (session 7):** The script is **TypeScript** (`scripts/bootstrap-mock-content.ts`), not JavaScript (`.mjs`). `tsconfig.json` `include` covers `scripts/**/*`, so the typecheck and lint gates apply the same way they do to `src/lib/content/`. Code blocks below are written in TS with explicit type annotations. When implementing via the XP triple: under `noUncheckedIndexedAccess`, prefer **`for..of` over indexed loops**, **string slicing over regex capture groups**, and **destructure-and-check over `match[i]` access** — this is the session-5 LESSON #1 discipline from P1.7, applied preemptively so we don't re-derive it via escalation. P4 helpers are not in `coverage.include` (`vitest.config.ts` covers only `src/lib/content/`), so the 90%/85% gates don't apply — but the strict typecheck does.

## Design

The script is structured as a file of exported helper functions plus a `main()` orchestrator. Each helper is a pure function where possible; the I/O functions (file read/write, network) are isolated so tests can mock them.

**Exports (all tested):**

- `stripJekyllPreamble(content: string): string` — removes Jekyll YAML frontmatter + liquid templates (`{{ ... }}`, `{% ... %}`)
- `splitIntoParagraphs(stripped: string): string[]` — splits on blank lines, trims, drops empty
- `assignParaIds(paragraphs: string[], chapterSlug: string, titleAtTop: boolean): Array<{ id: string; text: string }>` — produces `<slug>-title` for the first if `titleAtTop`, then `<slug>-p001`, `<slug>-p002`, …
- `formatContentFile(frontmatter: { chapter: string; title: string; lang: 'en' | 'et' }, paragraphs: Array<{ id: string; text: string }>): string` — renders the `::para[]`-directive format that `parse.ts` reads
- `translateWithClaude(text: string, client: ClaudeClient): Promise<string>` — calls the Claude API with a translation prompt; `client` is an object with `.complete(prompt)` so tests can inject a fake
- `emitManifest(chapters: Array<{ slug: string; paraIds: string[] }>): string` — returns the string content of `src/lib/content/manifest.ts`

**Main orchestrator (not unit-tested, exercised by Phase 6's integration run):**

- `main(argv: string[])` — reads env vars, checks `CONTENT_BOOTSTRAP=1`, walks legacy/, invokes the helpers, writes files, runs `validatePair` from Phase 2 on each chapter.

**Why `.ts` (resolved session 7):** The script runs under `tsx` (no build step) and imports directly from `../src/lib/content/parse` and `../src/lib/content/validate`. Writing it as `.ts` with the repo's strict TypeScript config:

1. Puts the helpers under the same type discipline as `src/lib/content/` — catches the session-5 LESSON #1 regex-capture-group trap at plan-review time instead of via a P1.7-style escalation.
2. Lets tests import from `../../scripts/bootstrap-mock-content` without `allowJs` (unset in our tsconfig) or the TS2307 resolution error a `.mjs` import would hit.
3. Removes the `.mjs`-plus-tsx interop hedge the earlier draft worried about.

`scripts/**/*` is in `tsconfig.json` `include` as of session 7, so the script participates in `tsc --noEmit` and in ESLint / Prettier. Type errors block commits the same way they do in `src/`.

**Files touched in Phase 4:**

- Create: `scripts/bootstrap-mock-content.ts`
- Create: `tests/scripts/bootstrap-mock-content.test.ts`
- Create: `tests/fixtures/legacy-sample.md` — a small fake Jekyll file for tests
- Modify: `package.json` — add `"bootstrap:content": "CONTENT_BOOTSTRAP=1 tsx scripts/bootstrap-mock-content.ts"` and install `tsx` + `@anthropic-ai/sdk`

---

## Task P4.1: Install tsx + Anthropic SDK, scaffold script entry point

> **Execution mode: Plantin-inline (not XP triple).** P4.1 is `npm install` + add an npm script + create a stub file with an env-guard. There is no failing test to write — same shape as P0 tasks. Plantin completes this before spawning the XP triple for P4.2–P4.6.

**Files:**

- Modify: `package.json`, `package-lock.json`
- Create: `scripts/bootstrap-mock-content.ts`

- [ ] **Step 1: Install dependencies**

Run:

```bash
npm install --save-dev tsx @anthropic-ai/sdk
```

`tsx` is a TypeScript-aware Node runner. `@anthropic-ai/sdk` is Anthropic's official SDK for the Claude API. Both are dev-only; the built Astro site does not ship them.

- [ ] **Step 2: Add an npm script**

Edit `package.json` and add this line to the `scripts` block (between `e2e:all-browsers` and the closing brace):

```json
    "bootstrap:content": "CONTENT_BOOTSTRAP=1 tsx scripts/bootstrap-mock-content.ts"
```

- [ ] **Step 3: Create the script entry point**

New file `scripts/bootstrap-mock-content.ts`:

```ts
#!/usr/bin/env node
/**
 * One-shot bootstrap script for bigbook v1 mock content.
 *
 * Reads legacy Jekyll markdown under legacy/peatykid/, legacy/kogemuslood/,
 * legacy/lisad/, legacy/front_matter/; strips Jekyll preamble and liquid;
 * assigns para-ids; writes src/content/et/<slug>.md; calls the Claude API
 * for each paragraph's translation; writes src/content/en/<slug>.md;
 * validates each pair against the Hard Invariant; emits
 * src/lib/content/manifest.ts.
 *
 * Run: CONTENT_BOOTSTRAP=1 npm run bootstrap:content
 *
 * Requires: CLAUDE_API_KEY env var, CONTENT_BOOTSTRAP=1 env var.
 *
 * This script is NOT part of the Astro build. It is run manually by
 * Plantin, once per content generation, and the output is then committed
 * in two commits (content + baseline-config) per Phase 6.
 */

import { pathToFileURL } from 'node:url'

export function main(_argv: string[]): void {
  if (process.env['CONTENT_BOOTSTRAP'] !== '1') {
    console.error('error: CONTENT_BOOTSTRAP=1 must be set in the environment')
    process.exit(1)
  }
  if (process.env['CLAUDE_API_KEY'] === undefined || process.env['CLAUDE_API_KEY'] === '') {
    console.error('error: CLAUDE_API_KEY must be set in the environment')
    process.exit(1)
  }
  console.log('bootstrap: not yet implemented — see P4.2 onward')
}

// Only run main() when this file is executed directly, not when imported.
// pathToFileURL handles Windows (file:///C:/...) vs POSIX (file:///home/...)
// differences that a manual `file://` concat gets wrong on Windows.
const invokedPath = process.argv[1]
if (invokedPath !== undefined && import.meta.url === pathToFileURL(invokedPath).href) {
  main(process.argv.slice(2))
}
```

- [ ] **Step 4: Verify the scaffold runs**

Run:

```bash
CONTENT_BOOTSTRAP=1 CLAUDE_API_KEY=dummy npx tsx scripts/bootstrap-mock-content.ts
```

Expected: prints `bootstrap: not yet implemented — see P4.2 onward`, exits 0.

Then verify the env checks:

```bash
CONTENT_BOOTSTRAP=0 CLAUDE_API_KEY=dummy npx tsx scripts/bootstrap-mock-content.ts
```

Expected: prints the `CONTENT_BOOTSTRAP=1 must be set` error and exits non-zero.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json scripts/bootstrap-mock-content.ts
git commit -m "$(cat <<'EOF'
feat(bootstrap): scaffold content bootstrap script

Adds the entry point for scripts/bootstrap-mock-content.ts with env
var gating (CONTENT_BOOTSTRAP=1, CLAUDE_API_KEY). Installs tsx (to
run TS scripts without a build step) and @anthropic-ai/sdk. Adds
npm run bootstrap:content.

No content logic yet — P4.2 starts the pure helper functions.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P4.2: stripJekyllPreamble helper

**Files:**

- Modify: `scripts/bootstrap-mock-content.ts`
- Create: `tests/scripts/bootstrap-mock-content.test.ts`

- [ ] **Step 1: Create the failing test**

New file `tests/scripts/bootstrap-mock-content.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { stripJekyllPreamble } from '../../scripts/bootstrap-mock-content'

describe('stripJekyllPreamble()', () => {
  it('removes Jekyll YAML frontmatter', () => {
    const input = `---
layout: default
title: Bill's Story
---

Body text here.
Another line.
`
    expect(stripJekyllPreamble(input)).toBe(`Body text here.\nAnother line.`)
  })

  it('removes {{ liquid }} expressions', () => {
    const input = `Visit {{ site.url }}{{ site.baseurl }}/about.`
    expect(stripJekyllPreamble(input)).toBe(`Visit /about.`)
  })

  it('removes {% liquid %} tags (include, for, etc.)', () => {
    const input = `{% include header.html %}
Chapter body.
{% for item in site.pages %}{{ item.title }}{% endfor %}
`
    expect(stripJekyllPreamble(input)).toBe(`Chapter body.`)
  })

  it('handles files with no frontmatter and no liquid (passthrough)', () => {
    const input = `Just plain text.\nSecond line.`
    expect(stripJekyllPreamble(input)).toBe(`Just plain text.\nSecond line.`)
  })
})
```

Also update `vitest.config.ts` to include `tests/scripts/` in the test glob. Edit the `test.include` array:

```ts
    include: ['tests/**/*.test.ts'],
```

This already matches — no change needed. The existing glob covers `tests/scripts/*.test.ts` automatically.

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
npx vitest run tests/scripts/bootstrap-mock-content.test.ts
```

Expected: failures because `stripJekyllPreamble` is not yet exported.

- [ ] **Step 3: Implement `stripJekyllPreamble`**

Add to `scripts/bootstrap-mock-content.ts`, above the `main` function:

```ts
/**
 * Strip Jekyll-style preamble from a legacy markdown file:
 * - Remove the leading YAML frontmatter block (between `---` fences).
 * - Remove liquid expressions like `{{ site.url }}`.
 * - Remove liquid tags like `{% include ... %}` or `{% for %}...{% endfor %}`.
 * Returns the body with surrounding whitespace trimmed.
 *
 * The frontmatter strip uses string slicing (indexOf) rather than a regex
 * capture group, which dodges the session-5 LESSON #1 trap: regex captures
 * typed as `string | undefined` under `noUncheckedIndexedAccess` force
 * defensive branches that v8 coverage flags as dead.
 */
export function stripJekyllPreamble(content: string): string {
  let body = content

  // Strip a leading YAML frontmatter block if present. `---\n` opens, a
  // later `\n---\n` closes (we search from past the opener).
  if (body.startsWith('---\n')) {
    const endFence = body.indexOf('\n---\n', 4)
    if (endFence !== -1) {
      body = body.slice(endFence + 5)
    }
  }

  // Strip {% ... %} tags including block tags with matching {% endfoo %}.
  // Block removal first (greedy match between opener and its matching endtag).
  body = body.replace(/\{%\s*(\w+)[\s\S]*?\{%\s*end\1\s*%\}/g, '')
  // Then strip any remaining standalone {% ... %} tags (include, assign, etc.).
  body = body.replace(/\{%[\s\S]*?%\}/g, '')
  // Then strip {{ ... }} expressions.
  body = body.replace(/\{\{[\s\S]*?\}\}/g, '')

  return body.trim()
}
```

- [ ] **Step 4: Run tests and verify green**

Run:

```bash
npx vitest run tests/scripts/bootstrap-mock-content.test.ts
```

Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add scripts/bootstrap-mock-content.ts tests/scripts/bootstrap-mock-content.test.ts
git commit -m "$(cat <<'EOF'
feat(bootstrap): stripJekyllPreamble helper

Removes Jekyll frontmatter, liquid block tags (with matching endtag),
standalone liquid tags, and {{ expression }} forms from legacy
markdown. Returns the trimmed body.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P4.3: splitIntoParagraphs + assignParaIds helpers

**Files:**

- Modify: `scripts/bootstrap-mock-content.ts`
- Modify: `tests/scripts/bootstrap-mock-content.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `tests/scripts/bootstrap-mock-content.test.ts`:

```ts
import { splitIntoParagraphs, assignParaIds } from '../../scripts/bootstrap-mock-content'

describe('splitIntoParagraphs()', () => {
  it('splits on blank lines and trims', () => {
    const input = `First paragraph.

Second paragraph.

  Third paragraph.  

Fourth.`
    expect(splitIntoParagraphs(input)).toEqual([
      'First paragraph.',
      'Second paragraph.',
      'Third paragraph.',
      'Fourth.',
    ])
  })

  it('drops empty chunks from consecutive blank lines', () => {
    const input = `First.



Second.`
    expect(splitIntoParagraphs(input)).toEqual(['First.', 'Second.'])
  })

  it('preserves internal line breaks inside a single paragraph', () => {
    const input = `Line one
line two.

Next paragraph.`
    expect(splitIntoParagraphs(input)).toEqual(['Line one\nline two.', 'Next paragraph.'])
  })
})

describe('assignParaIds()', () => {
  it('assigns <slug>-title to the first paragraph when titleAtTop is true', () => {
    const result = assignParaIds(['Kuidas see toimib', 'Body.', 'More body.'], 'ch05', true)
    expect(result).toEqual([
      { id: 'ch05-title', text: 'Kuidas see toimib' },
      { id: 'ch05-p001', text: 'Body.' },
      { id: 'ch05-p002', text: 'More body.' },
    ])
  })

  it('uses p001 onwards when titleAtTop is false', () => {
    const result = assignParaIds(['Body.', 'More body.'], 'bili', false)
    expect(result).toEqual([
      { id: 'bili-p001', text: 'Body.' },
      { id: 'bili-p002', text: 'More body.' },
    ])
  })

  it('pads ordinals to three digits', () => {
    const result = assignParaIds(Array(12).fill('p'), 'ch05', false)
    expect(result[0].id).toBe('ch05-p001')
    expect(result[11].id).toBe('ch05-p012')
  })
})
```

- [ ] **Step 2: Run and verify they fail**

Run:

```bash
npx vitest run tests/scripts/bootstrap-mock-content.test.ts
```

Expected: new tests fail — functions not yet exported.

- [ ] **Step 3: Add the implementations**

In `scripts/bootstrap-mock-content.ts`, above `main`:

```ts
export interface IdentifiedParagraph {
  id: string
  text: string
}

/**
 * Split a stripped markdown body into paragraphs on blank-line boundaries.
 * Trims each paragraph. Drops empty chunks from consecutive blank lines.
 */
export function splitIntoParagraphs(stripped: string): string[] {
  return stripped
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
}

/**
 * Assign para-ids of form `<slug>-title` (if titleAtTop) or `<slug>-p<nnn>`
 * with three-digit zero-padded ordinal. Ordinals start at 001 regardless
 * of whether the first paragraph is a title.
 *
 * Uses `for..of` rather than indexed iteration — under
 * `noUncheckedIndexedAccess`, `paragraphs[i]` is `string | undefined`, but
 * `for..of` yields `string` directly.
 */
export function assignParaIds(
  paragraphs: string[],
  chapterSlug: string,
  titleAtTop: boolean,
): IdentifiedParagraph[] {
  const out: IdentifiedParagraph[] = []
  let ordinal = 1
  let isFirst = true
  for (const text of paragraphs) {
    if (titleAtTop && isFirst) {
      out.push({ id: `${chapterSlug}-title`, text })
    } else {
      const paddedOrdinal = String(ordinal).padStart(3, '0')
      out.push({ id: `${chapterSlug}-p${paddedOrdinal}`, text })
      ordinal++
    }
    isFirst = false
  }
  return out
}
```

- [ ] **Step 4: Run tests and verify green**

Run:

```bash
npx vitest run tests/scripts/bootstrap-mock-content.test.ts
```

Expected: all 10 tests passing.

- [ ] **Step 5: Commit**

```bash
git add scripts/bootstrap-mock-content.ts tests/scripts/bootstrap-mock-content.test.ts
git commit -m "$(cat <<'EOF'
feat(bootstrap): splitIntoParagraphs + assignParaIds helpers

Pure functions that turn a stripped markdown body into a list of
(id, text) pairs. Para-ids follow the <slug>-title / <slug>-p<nnn>
convention with three-digit zero-padded ordinals.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P4.4: formatContentFile helper

Renders the `::para[]`-directive format that `parse.ts` reads.

**Files:**

- Modify: `scripts/bootstrap-mock-content.ts`
- Modify: `tests/scripts/bootstrap-mock-content.test.ts`

- [ ] **Step 1: Add the failing test**

Append:

```ts
import { formatContentFile } from '../../scripts/bootstrap-mock-content'

describe('formatContentFile()', () => {
  it('produces a file that parse() can round-trip', () => {
    const paragraphs = [
      { id: 'ch05-title', text: 'Kuidas see toimib' },
      { id: 'ch05-p001', text: 'Oleme harva näinud inimest.' },
      { id: 'ch05-p002', text: 'Meie lood\navaldavad üldjoontes.' },
    ]
    const output = formatContentFile(
      { chapter: 'ch05', title: 'Kuidas see toimib', lang: 'et' },
      paragraphs,
    )
    expect(output).toBe(`---
chapter: ch05
title: Kuidas see toimib
lang: et
---

::para[ch05-title]
Kuidas see toimib

::para[ch05-p001]
Oleme harva näinud inimest.

::para[ch05-p002]
Meie lood
avaldavad üldjoontes.
`)
  })
})
```

- [ ] **Step 2: Verify the output round-trips through `parse()`**

Also add a test that the formatted output parses correctly via the Phase 1 parser:

```ts
import { parse } from '../../src/lib/content/parse'

describe('formatContentFile() + parse() round-trip', () => {
  it('formatContentFile output parses back to the same para-id map', () => {
    const paragraphs = [
      { id: 'ch05-title', text: 'Kuidas see toimib' },
      { id: 'ch05-p001', text: 'Oleme harva näinud inimest.' },
    ]
    const content = formatContentFile(
      { chapter: 'ch05', title: 'Kuidas see toimib', lang: 'et' },
      paragraphs,
    )
    const parsed = parse(content)
    expect(parsed.frontmatter.chapter).toBe('ch05')
    expect(parsed.frontmatter.lang).toBe('et')
    expect(parsed.paragraphs.get('ch05-title')).toBe('Kuidas see toimib')
    expect(parsed.paragraphs.get('ch05-p001')).toBe('Oleme harva näinud inimest.')
  })
})
```

- [ ] **Step 3: Run and verify both fail**

Run:

```bash
npx vitest run tests/scripts/bootstrap-mock-content.test.ts -t formatContentFile
```

Expected: tests fail — function not yet exported.

- [ ] **Step 4: Implement `formatContentFile`**

In `scripts/bootstrap-mock-content.ts`:

```ts
export interface ContentFrontmatter {
  chapter: string
  title: string
  lang: 'en' | 'et'
}

/**
 * Render a ParsedChapter-shaped input to the ::para[]-directive format
 * that src/lib/content/parse.ts reads. Produces:
 *
 *   ---
 *   chapter: <chapter>
 *   title: <title>
 *   lang: <lang>
 *   ---
 *
 *   ::para[<id1>]
 *   <text1>
 *
 *   ::para[<id2>]
 *   <text2>
 *   ...
 */
export function formatContentFile(
  frontmatter: ContentFrontmatter,
  paragraphs: IdentifiedParagraph[],
): string {
  const lines: string[] = [
    '---',
    `chapter: ${frontmatter.chapter}`,
    `title: ${frontmatter.title}`,
    `lang: ${frontmatter.lang}`,
    '---',
    '',
  ]
  for (const { id, text } of paragraphs) {
    lines.push(`::para[${id}]`)
    lines.push(text)
    lines.push('')
  }
  return lines.join('\n')
}
```

- [ ] **Step 5: Run tests and verify green**

Run:

```bash
npx vitest run tests/scripts/bootstrap-mock-content.test.ts
```

Expected: all tests green. The round-trip test is especially important — it verifies that `formatContentFile` produces a file `parse()` can consume, closing the loop between Phase 1 and Phase 4.

- [ ] **Step 6: Commit**

```bash
git add scripts/bootstrap-mock-content.ts tests/scripts/bootstrap-mock-content.test.ts
git commit -m "$(cat <<'EOF'
feat(bootstrap): formatContentFile + round-trip with parse()

Renders the ::para[]-directive format. Includes a round-trip test
that asserts parse(formatContentFile(...)) produces the same
para-id map — closing the loop between Phase 1 and Phase 4.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P4.5: translateWithClaude helper (with injectable client)

**Files:**

- Modify: `scripts/bootstrap-mock-content.ts`
- Modify: `tests/scripts/bootstrap-mock-content.test.ts`

- [ ] **Step 1: Add the failing test**

Append:

```ts
import { translateWithClaude } from '../../scripts/bootstrap-mock-content'

describe('translateWithClaude()', () => {
  it('calls the client with a translation prompt and returns the response text', async () => {
    const calls = []
    const fakeClient = {
      complete: async (prompt) => {
        calls.push(prompt)
        return 'Rarely have we seen a person fail.'
      },
    }
    const result = await translateWithClaude('Oleme harva näinud inimest.', fakeClient)
    expect(result).toBe('Rarely have we seen a person fail.')
    expect(calls).toHaveLength(1)
    expect(calls[0]).toContain('Estonian')
    expect(calls[0]).toContain('English')
    expect(calls[0]).toContain('Oleme harva näinud inimest.')
  })

  it('trims whitespace from the client response', async () => {
    const fakeClient = {
      complete: async () => '  Trimmed.  \n',
    }
    const result = await translateWithClaude('Input.', fakeClient)
    expect(result).toBe('Trimmed.')
  })
})
```

- [ ] **Step 2: Run and verify it fails**

Run:

```bash
npx vitest run tests/scripts/bootstrap-mock-content.test.ts -t translateWithClaude
```

Expected: failure — function not exported.

- [ ] **Step 3: Implement `translateWithClaude` with the Anthropic SDK bridge**

In `scripts/bootstrap-mock-content.ts`:

```ts
export interface ClaudeClient {
  complete(prompt: string): Promise<string>
}

/**
 * Translate a single Estonian paragraph to English using the Claude API.
 *
 * The `client` parameter is an object with `.complete(prompt): Promise<string>`.
 * A real client is built by `buildRealClaudeClient()` below; tests inject a fake.
 */
export async function translateWithClaude(
  estonianText: string,
  client: ClaudeClient,
): Promise<string> {
  const prompt = `Translate the following Estonian text to English. Preserve the meaning exactly. Return only the translated English text, no commentary, no quotation marks.

Estonian: ${estonianText}

English:`
  const response = await client.complete(prompt)
  return response.trim()
}

/**
 * Build a real Claude client using the Anthropic SDK. Returns an object
 * compatible with translateWithClaude's `client` parameter.
 *
 * The `message.content[0]` access is guarded — under
 * `noUncheckedIndexedAccess` it is `ContentBlock | undefined` and we
 * need an explicit narrowing before reading `.type`/`.text`.
 */
export function buildRealClaudeClient(): ClaudeClient {
  return {
    complete: async (prompt: string): Promise<string> => {
      // Lazy import so tests that don't use the real client don't pay the cost.
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const apiKey = process.env['CLAUDE_API_KEY']
      if (apiKey === undefined || apiKey === '') {
        throw new Error('CLAUDE_API_KEY not set in environment')
      }
      const client = new Anthropic({ apiKey })
      const message = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      })
      const block = message.content[0]
      if (block === undefined || block.type !== 'text') {
        throw new Error(`unexpected Claude response: ${block?.type ?? 'empty content array'}`)
      }
      return block.text
    },
  }
}
```

- [ ] **Step 4: Run tests and verify**

Run:

```bash
npx vitest run tests/scripts/bootstrap-mock-content.test.ts
```

Expected: all tests passing. The real client is not exercised by tests — it's only called during the actual Phase 6 run.

- [ ] **Step 5: Commit**

```bash
git add scripts/bootstrap-mock-content.ts tests/scripts/bootstrap-mock-content.test.ts
git commit -m "$(cat <<'EOF'
feat(bootstrap): translateWithClaude + injectable Claude client

translateWithClaude accepts a client object with .complete(prompt)
so tests can inject a fake. buildRealClaudeClient() wraps the
Anthropic SDK (claude-opus-4-6) and is called only at Phase 6 run
time, not during tests.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P4.6: emitManifest helper

**Files:**

- Modify: `scripts/bootstrap-mock-content.ts`
- Modify: `tests/scripts/bootstrap-mock-content.test.ts`

- [ ] **Step 1: Add the failing test**

Append:

```ts
import { emitManifest } from '../../scripts/bootstrap-mock-content'

describe('emitManifest()', () => {
  it('emits valid TypeScript source with chapters and para-ids', () => {
    const chapters = [
      {
        slug: 'ch05',
        title: { en: 'How It Works', et: 'Kuidas see toimib' },
        paraIds: ['ch05-title', 'ch05-p001', 'ch05-p002'],
      },
      {
        slug: 'ch06',
        title: { en: 'Into Action', et: 'Tegutsemisse' },
        paraIds: ['ch06-title', 'ch06-p001'],
      },
    ]
    const output = emitManifest(chapters)

    expect(output).toContain('export type ChapterManifest = {')
    expect(output).toContain("slug: 'ch05'")
    expect(output).toContain("en: 'How It Works'")
    expect(output).toContain("et: 'Kuidas see toimib'")
    expect(output).toContain("'ch05-title'")
    expect(output).toContain("'ch05-p001'")
    expect(output).toContain("'ch06-p001'")
    expect(output).toContain('ESTIMATED_HEIGHT_TITLE')
    expect(output).toContain('ESTIMATED_HEIGHT_BODY')
  })
})
```

- [ ] **Step 2: Implement `emitManifest`**

In `scripts/bootstrap-mock-content.ts`:

```ts
export interface ManifestChapter {
  slug: string
  title: { en: string; et: string }
  paraIds: string[]
}

/**
 * Emit the contents of src/lib/content/manifest.ts as a TypeScript string.
 * Produces a typed list of chapters with para-ids and bilingual titles.
 * Row height estimates are exported as constants for src/lib/reader to
 * consume when rendering the skeleton.
 */
export function emitManifest(chapters: ManifestChapter[]): string {
  const lines: string[] = [
    '// Generated by scripts/bootstrap-mock-content.ts — do not edit by hand.',
    '// Regenerate with: CONTENT_BOOTSTRAP=1 npm run bootstrap:content',
    '',
    'export type ChapterManifest = {',
    '  slug: string',
    '  title: { en: string; et: string }',
    '  paraIds: readonly string[]',
    '}',
    '',
    'export const ESTIMATED_HEIGHT_TITLE = 60',
    'export const ESTIMATED_HEIGHT_BODY = 110',
    '',
    'export const CHAPTERS: readonly ChapterManifest[] = [',
  ]
  for (const ch of chapters) {
    lines.push('  {')
    lines.push(`    slug: '${ch.slug}',`)
    lines.push(
      `    title: { en: ${JSON.stringify(ch.title.en)}, et: ${JSON.stringify(ch.title.et)} },`,
    )
    lines.push('    paraIds: [')
    for (const id of ch.paraIds) {
      lines.push(`      '${id}',`)
    }
    lines.push('    ],')
    lines.push('  },')
  }
  lines.push(']')
  lines.push('')
  return lines.join('\n')
}
```

- [ ] **Step 3: Run tests and verify green**

Run:

```bash
npx vitest run tests/scripts/bootstrap-mock-content.test.ts
```

Expected: all tests passing.

- [ ] **Step 4: Commit**

```bash
git add scripts/bootstrap-mock-content.ts tests/scripts/bootstrap-mock-content.test.ts
git commit -m "$(cat <<'EOF'
feat(bootstrap): emitManifest helper

Generates src/lib/content/manifest.ts with typed ChapterManifest[]
and the ESTIMATED_HEIGHT_TITLE / ESTIMATED_HEIGHT_BODY constants
the reader skeleton uses.

Part of #3
(*BB:Plantin*)
EOF
)"
```

## Task P4.7: main() orchestrator

> **Execution mode: Plantin-inline (not XP triple).** P4.7 has no failing test to write — `main()` is ~130 lines of `fs` walk + sequential helper calls, exercised end-to-end during Phase 6's live run, not in unit tests. Running it through the triple is the same RED-style theatre P0 and P4.1 are inline to avoid. Plantin runs this after the triple closes P4.2–P4.6 and commits the orchestrator as a single Plantin-inline commit.

Tie the helpers together. `main()` reads legacy markdown directories, runs each file through the pipeline, writes outputs, calls `validatePair` from Phase 2 on each chapter, emits the manifest. Failures are surfaced as a non-zero exit code.

**Files:**

- Modify: `scripts/bootstrap-mock-content.ts`

This task does **not** add new unit tests — `main()` is the orchestrator and is exercised end-to-end during Phase 6's run, not in a test. The pure helpers are already fully tested in P4.2-P4.6.

- [ ] **Step 1: Implement `main()` in `scripts/bootstrap-mock-content.ts`**

Replace the current `main` function with:

```ts
import { promises as fs } from 'node:fs'
import { join, basename, extname, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseContent } from '../src/lib/content/parse'
import { validatePair } from '../src/lib/content/validate'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = resolve(__dirname, '..')

const LEGACY_DIRS = [
  'legacy/peatykid',
  'legacy/kogemuslood',
  'legacy/lisad',
  'legacy/front_matter',
] as const

export async function main(_argv: string[]): Promise<void> {
  if (process.env['CONTENT_BOOTSTRAP'] !== '1') {
    console.error('error: CONTENT_BOOTSTRAP=1 must be set in the environment')
    process.exit(1)
  }
  if (process.env['CLAUDE_API_KEY'] === undefined || process.env['CLAUDE_API_KEY'] === '') {
    console.error('error: CLAUDE_API_KEY must be set in the environment')
    process.exit(1)
  }

  const client = buildRealClaudeClient()
  const chapters: ManifestChapter[] = []

  for (const relDir of LEGACY_DIRS) {
    const absDir = join(REPO_ROOT, relDir)
    const entries = await fs.readdir(absDir).catch((): string[] => [])
    for (const entry of entries) {
      if (extname(entry) !== '.md') continue
      const absPath = join(absDir, entry)
      const slug = slugify(basename(entry, '.md'))
      const raw = await fs.readFile(absPath, 'utf8')
      console.log(`processing ${relDir}/${entry} → ${slug}`)

      const stripped = stripJekyllPreamble(raw)
      const paragraphTexts = splitIntoParagraphs(stripped)
      // Narrow the first paragraph before passing to looksLikeTitle — under
      // noUncheckedIndexedAccess, paragraphTexts[0] is string | undefined.
      const firstText = paragraphTexts[0]
      if (firstText === undefined) {
        console.warn(`  skip: ${entry} has no paragraphs after stripping`)
        continue
      }

      const titleAtTop = looksLikeTitle(firstText)
      const etParagraphs = assignParaIds(paragraphTexts, slug, titleAtTop)

      // Translate each Estonian paragraph to English, preserving para-ids.
      const enParagraphs: IdentifiedParagraph[] = []
      for (const { id, text } of etParagraphs) {
        const en = await translateWithClaude(text, client)
        enParagraphs.push({ id, text: en })
      }

      // Titles: if titleAtTop, the first paragraph IS the title; narrow it
      // again because TS doesn't carry through that etParagraphs is non-empty.
      const etTitle = titleAtTop ? (etParagraphs[0]?.text ?? slug) : slug
      const enTitle = titleAtTop ? (enParagraphs[0]?.text ?? slug) : slug

      const etContent = formatContentFile(
        { chapter: slug, title: etTitle, lang: 'et' },
        etParagraphs,
      )
      const enContent = formatContentFile(
        { chapter: slug, title: enTitle, lang: 'en' },
        enParagraphs,
      )

      // Validate the pair before writing.
      const etParsed = parseContent(etContent)
      const enParsed = parseContent(enContent)
      const validation = validatePair(enParsed, etParsed)
      if (!validation.ok) {
        console.error(`  invariant violation on ${slug}:`)
        for (const err of validation.errors) {
          console.error(`    - [${err.category}] ${err.paraId}: ${err.message}`)
        }
        process.exit(2)
      }

      const etOut = join(REPO_ROOT, 'src/content/et', `${slug}.md`)
      const enOut = join(REPO_ROOT, 'src/content/en', `${slug}.md`)
      await fs.mkdir(dirname(etOut), { recursive: true })
      await fs.mkdir(dirname(enOut), { recursive: true })
      await fs.writeFile(etOut, etContent, 'utf8')
      await fs.writeFile(enOut, enContent, 'utf8')
      console.log(`  wrote ${etOut}`)
      console.log(`  wrote ${enOut}`)

      chapters.push({
        slug,
        title: { en: enTitle, et: etTitle },
        paraIds: etParagraphs.map((p) => p.id),
      })
    }
  }

  // Emit manifest.ts.
  const manifest = emitManifest(chapters)
  const manifestPath = join(REPO_ROOT, 'src/lib/content/manifest.ts')
  await fs.mkdir(dirname(manifestPath), { recursive: true })
  await fs.writeFile(manifestPath, manifest, 'utf8')
  console.log(`wrote ${manifestPath}`)
  console.log(`processed ${chapters.length} chapters`)
}

/**
 * Slugify a legacy filename stem into a chapter slug.
 * Lowercase, Estonian/English diacritics folded, non-alphanumeric → dashes.
 */
function slugify(stem: string): string {
  return stem
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)
}

/**
 * Heuristic: a paragraph looks like a title if it's short (< 80 chars)
 * and doesn't end with sentence punctuation.
 */
function looksLikeTitle(paragraph: string): boolean {
  return paragraph.length < 80 && !/[.!?]$/.test(paragraph.trim())
}
```

Note: the imports at the top import from `../src/lib/content/parse` and `../src/lib/content/validate` **without** a `.ts` extension — that's the TS convention (no `allowImportingTsExtensions` in our tsconfig). `tsx` resolves the `.ts` files at runtime when invoked via `npx tsx scripts/bootstrap-mock-content.ts`, and `tsc --noEmit` resolves them via the package's module resolution.

- [ ] **Step 2: Verify the script still type-runs (even though main() is not being invoked yet)**

Run:

```bash
CONTENT_BOOTSTRAP=0 npx tsx scripts/bootstrap-mock-content.ts
```

Expected: the CONTENT_BOOTSTRAP guard fires immediately with the error message; the script never reaches the legacy-directory walk.

Then run the full Vitest suite:

```bash
npm run test
```

Expected: all tests still green. The orchestrator is not exercised by tests; the helpers remain covered.

- [ ] **Step 3: Commit**

```bash
git add scripts/bootstrap-mock-content.ts
git commit -m "$(cat <<'EOF'
feat(bootstrap): main() orchestrator

Ties all helpers together: walks LEGACY_DIRS, strips, splits, assigns
ids, translates with Claude, formats, validates the pair, writes
src/content/{et,en}/<slug>.md, and emits src/lib/content/manifest.ts.
Validation failures abort with exit code 2 and a printed error list.

main() is not covered by unit tests — it's exercised end-to-end in
Phase 6.

Part of #3
(*BB:Plantin*)
EOF
)"
```

---

## Phase 4 exit check

- [ ] **`npm run test` green** (parse + validate + diff + bootstrap helpers all passing)
- [ ] **`npm run test:coverage` green** (src/lib/content ≥ 90%; scripts/ is not under the coverage include)
- [ ] **`npm run typecheck` green**
- [ ] **`npm run lint` green**
- [ ] **`npm run format:check` green**
- [ ] **The script runs cleanly with the env-gate error when `CONTENT_BOOTSTRAP=0`**
- [ ] **Push to `origin/main`**

The script is fully built but has not been _run_ against real legacy content. Phase 6 runs it.

**Next phase:** [P5 — Pre-commit hooks](./p5-hooks.md)

(_BB:Plantin_)
