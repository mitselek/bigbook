# EN Book Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the authoritative AA Big Book 4th edition PDF into a structured JSON artifact at `data/extractions/en-4th-edition.json`, covering all 68 sections with EN-keyed IDs and zero dependency on the existing ET paragraph grid.

**Architecture:** Pipeline of small pure functions. `mutool show ... outline` provides the section tree (with hardcoded fallback); `pdftotext -layout` extracts raw text per page range; `normalize.ts` strips running headers and rejoins hyphens; `segment.ts` splits into typed blocks; orchestrator in `scripts/extract-en-book.ts` stitches it together, enforces runtime invariants, and emits JSON + raw text + sample-review.md.

**Tech Stack:** TypeScript 5 strict, Node 22+, tsx (script runner), Vitest (tests), `pdftotext`/`mutool` (already on host).

**Spec:** `docs/superpowers/specs/2026-04-18-en-book-extraction-design.md`

---

## Task 1: Scaffold directory structure, types, npm script

**Files:**

- Create: `scripts/extract-en-book.ts` (stub)
- Create: `scripts/extract-en-book/types.ts`
- Create: `tests/scripts/extract-en-book/.gitkeep`
- Create: `data/extractions/.gitkeep`
- Modify: `package.json` (add `extract:en` script)

- [ ] **Step 1: Create type definitions**

Write `scripts/extract-en-book/types.ts`:

```typescript
export type SectionKind =
  | 'front-matter'
  | 'preface'
  | 'foreword'
  | 'doctors-opinion'
  | 'chapter'
  | 'story'
  | 'appendix'

export type BlockKind = 'heading' | 'paragraph' | 'blockquote' | 'verse' | 'list-item' | 'footnote'

export interface Block {
  id: string
  kind: BlockKind
  text: string
  pdfPage: number
}

export interface BookSection {
  id: string
  kind: SectionKind
  title: string
  parentGroup?: string
  pdfPageStart: number
  pdfPageEnd: number
  bookPageStart: number
  bookPageEnd: number
  blocks: Block[]
}

export interface BigBookEnglish {
  edition: '4th'
  sourcePdf: string
  extractedAt: string
  sections: BookSection[]
}

export interface OutlineNode {
  title: string
  kind: SectionKind
  parentGroup?: string
  pdfPageStart: number
}
```

- [ ] **Step 2: Create stub entry script**

Write `scripts/extract-en-book.ts`:

```typescript
#!/usr/bin/env node
/**
 * Extract the AA Big Book 4th edition PDF into a structured JSON artifact.
 *
 * Run: npm run extract:en
 *
 * Output:
 *   data/extractions/en-4th-edition.json
 *   data/extractions/en-4th-edition.raw.txt
 *   data/extractions/sample-review.md
 *
 * See docs/superpowers/specs/2026-04-18-en-book-extraction-design.md
 */

async function main(): Promise<void> {
  throw new Error('not yet implemented')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 3: Create placeholders for directories**

```bash
mkdir -p tests/scripts/extract-en-book/fixtures data/extractions
touch tests/scripts/extract-en-book/.gitkeep data/extractions/.gitkeep
```

- [ ] **Step 4: Add npm script**

Edit `package.json`, add under `"scripts"`:

```json
"extract:en": "tsx scripts/extract-en-book.ts"
```

- [ ] **Step 5: Typecheck passes**

Run: `npm run typecheck`
Expected: exit 0, zero errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/extract-en-book.ts scripts/extract-en-book/types.ts \
        tests/scripts/extract-en-book/.gitkeep data/extractions/.gitkeep \
        package.json
git commit -m "chore(extract): scaffold EN book extraction (types, script, npm)

Scaffolding per docs/superpowers/specs/2026-04-18-en-book-extraction-design.md.
Types-only commit; extraction logic lands in follow-up tasks.

(*BB:Plantin*)"
```

---

## Task 2: Basic kebab-case slug function

**Files:**

- Create: `scripts/extract-en-book/slug.ts`
- Create: `tests/scripts/extract-en-book/slug.test.ts`

- [ ] **Step 1: Write the failing test**

Write `tests/scripts/extract-en-book/slug.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { kebabCase } from '../../../scripts/extract-en-book/slug'

describe('kebabCase', () => {
  it('lowercases ASCII words', () => {
    expect(kebabCase('Preface')).toBe('preface')
  })

  it('joins whitespace-separated words with hyphens', () => {
    expect(kebabCase('A Vision For You')).toBe('a-vision-for-you')
  })

  it('strips punctuation except digits and hyphens', () => {
    expect(kebabCase("Bill's Story")).toBe('bills-story')
    expect(kebabCase('Physician, Heal Thyself!')).toBe('physician-heal-thyself')
  })

  it('collapses internal whitespace runs', () => {
    expect(kebabCase('Dr.   Bob\u2019s  Nightmare')).toBe('dr-bobs-nightmare')
  })

  it('strips leading and trailing hyphens', () => {
    expect(kebabCase('- hello -')).toBe('hello')
  })

  it('preserves digits', () => {
    expect(kebabCase('A.A. Number Three')).toBe('aa-number-three')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scripts/extract-en-book/slug.test.ts`
Expected: FAIL — "Cannot find module" or "kebabCase is not exported".

- [ ] **Step 3: Write minimal implementation**

Write `scripts/extract-en-book/slug.ts`:

```typescript
/**
 * Deterministic ID generation for extracted book sections.
 */

export function kebabCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scripts/extract-en-book/slug.test.ts`
Expected: PASS, 6/6.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/slug.ts tests/scripts/extract-en-book/slug.test.ts
git commit -m "feat(extract): kebab-case slug helper

(*BB:Granjon*)"
```

---

## Task 3: Section-ID mapping (kind-aware)

**Files:**

- Modify: `scripts/extract-en-book/slug.ts`
- Modify: `tests/scripts/extract-en-book/slug.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/scripts/extract-en-book/slug.test.ts`:

```typescript
import { sectionIdFor } from '../../../scripts/extract-en-book/slug'
import type { OutlineNode } from '../../../scripts/extract-en-book/types'

describe('sectionIdFor', () => {
  function node(
    partial: Partial<OutlineNode> & { title: string; kind: OutlineNode['kind'] },
  ): OutlineNode {
    return { pdfPageStart: 1, ...partial }
  }

  it('maps front-matter titles directly', () => {
    expect(
      sectionIdFor(node({ title: 'Copyright Info', kind: 'front-matter' }), { chapterOrdinal: 0 }),
    ).toBe('copyright-info')
  })

  it('maps the preface', () => {
    expect(sectionIdFor(node({ title: 'Preface', kind: 'preface' }), { chapterOrdinal: 0 })).toBe(
      'preface',
    )
  })

  it('maps forewords by edition ordinal', () => {
    expect(
      sectionIdFor(node({ title: 'Foreword to First', kind: 'foreword' }), { chapterOrdinal: 0 }),
    ).toBe('foreword-1st-edition')
    expect(
      sectionIdFor(node({ title: 'Foreword to Second', kind: 'foreword' }), { chapterOrdinal: 0 }),
    ).toBe('foreword-2nd-edition')
    expect(
      sectionIdFor(node({ title: 'Foreword to Third', kind: 'foreword' }), { chapterOrdinal: 0 }),
    ).toBe('foreword-3rd-edition')
    expect(
      sectionIdFor(node({ title: 'Foreword to Fourth', kind: 'foreword' }), { chapterOrdinal: 0 }),
    ).toBe('foreword-4th-edition')
  })

  it('maps doctors opinion', () => {
    expect(
      sectionIdFor(node({ title: 'The Doctors Opinion', kind: 'doctors-opinion' }), {
        chapterOrdinal: 0,
      }),
    ).toBe('doctors-opinion')
  })

  it('prefixes chapters with chNN-', () => {
    expect(
      sectionIdFor(node({ title: "Bill's Story", kind: 'chapter' }), { chapterOrdinal: 1 }),
    ).toBe('ch01-bills-story')
    expect(
      sectionIdFor(node({ title: 'A Vision For You', kind: 'chapter' }), { chapterOrdinal: 11 }),
    ).toBe('ch11-a-vision-for-you')
  })

  it('prefixes stories with story-', () => {
    expect(
      sectionIdFor(node({ title: "Dr. Bob's Nightmare", kind: 'story' }), { chapterOrdinal: 0 }),
    ).toBe('story-dr-bobs-nightmare')
  })

  it('prefixes appendices with roman numeral', () => {
    expect(
      sectionIdFor(node({ title: 'I The A.A. Tradition', kind: 'appendix' }), {
        chapterOrdinal: 0,
      }),
    ).toBe('appendix-i-the-aa-tradition')
    expect(
      sectionIdFor(node({ title: 'VII The Twelve Concepts', kind: 'appendix' }), {
        chapterOrdinal: 0,
      }),
    ).toBe('appendix-vii-the-twelve-concepts')
  })

  it('special-cases A.A. Pamphlets', () => {
    expect(
      sectionIdFor(node({ title: 'A.A. Pamphlets', kind: 'appendix' }), { chapterOrdinal: 0 }),
    ).toBe('appendix-aa-pamphlets')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/slug.test.ts`
Expected: FAIL — `sectionIdFor` not exported.

- [ ] **Step 3: Implement**

Append to `scripts/extract-en-book/slug.ts`:

```typescript
import type { OutlineNode } from './types'

const FOREWORD_EDITION: Record<string, string> = {
  first: '1st',
  second: '2nd',
  third: '3rd',
  fourth: '4th',
}

export interface SlugContext {
  chapterOrdinal: number
}

export function sectionIdFor(node: OutlineNode, ctx: SlugContext): string {
  const title = node.title.trim()
  const slug = kebabCase(title)

  switch (node.kind) {
    case 'front-matter':
    case 'preface':
    case 'doctors-opinion':
      return slug
    case 'foreword': {
      const match = title.match(/Foreword to (\w+)/i)
      const word = match?.[1]?.toLowerCase() ?? ''
      const edition = FOREWORD_EDITION[word]
      if (!edition) {
        throw new Error(`Unrecognized foreword title: ${title}`)
      }
      return `foreword-${edition}-edition`
    }
    case 'chapter': {
      const n = String(ctx.chapterOrdinal).padStart(2, '0')
      return `ch${n}-${slug}`
    }
    case 'story':
      return `story-${slug}`
    case 'appendix': {
      if (/^a\.?a\.?\s+pamphlets$/i.test(title)) {
        return 'appendix-aa-pamphlets'
      }
      const match = title.match(/^([IVX]+)\s+(.*)$/i)
      if (!match) {
        throw new Error(`Unrecognized appendix title: ${title}`)
      }
      const roman = match[1].toLowerCase()
      const rest = kebabCase(match[2])
      return `appendix-${roman}-${rest}`
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scripts/extract-en-book/slug.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/slug.ts tests/scripts/extract-en-book/slug.test.ts
git commit -m "feat(extract): section-id mapping (foreword/chapter/story/appendix)

(*BB:Granjon*)"
```

---

## Task 4: Parse mutool outline output

**Files:**

- Create: `scripts/extract-en-book/outline.ts`
- Create: `tests/scripts/extract-en-book/outline.test.ts`
- Create: `tests/scripts/extract-en-book/fixtures/outline-sample.txt`

- [ ] **Step 1: Create fixture**

Write `tests/scripts/extract-en-book/fixtures/outline-sample.txt`:

```
+	"Pre Chapters"	#page=1&view=FitH,-1
|		"Copyright Info"	#page=1&view=FitH,-4
|		"Preface"	#page=2&view=FitH,-4
|		"Foreword to First"	#page=4&view=FitH,-4
|		"Foreword to Fourth"	#page=12&view=FitH,-4
|		"The Doctors Opinion"	#page=14&view=FitH,-4
+	"Chapters"	#page=22&view=FitH,-5
|		"Bill's Story"	#page=22&view=FitH,-4
|		"A Vision For You"	#page=172&view=FitH,-102.640018
+	"Pioneers of A.A."	#page=186&view=FitH,-4.76001
|		"Dr. Bob's Nightmare"	#page=186&view=FitH,-99.76001
+	"They Stopped in Time"	#page=292&view=FitH,-4.76001
|		"The Missing Link"	#page=292&view=FitH,-99.76001
+	"They Lost Nearly All"	#page=443&view=FitH,-4.76001
|		"My Bottle, My Resentments, and Me"	#page=443&view=FitH,-99.76001
+	"Appendices"	#page=566&view=FitH,-5
|		"I The A.A. Tradition"	#page=566&view=FitH,-4
|		"A.A. Pamphlets"	#page=581&view=FitH,-4.76001
```

- [ ] **Step 2: Write failing test**

Write `tests/scripts/extract-en-book/outline.test.ts`:

```typescript
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseOutlineText } from '../../../scripts/extract-en-book/outline'

const FIXTURE = readFileSync(resolve(__dirname, 'fixtures/outline-sample.txt'), 'utf8')

describe('parseOutlineText', () => {
  it('extracts all leaf sections with correct kind', () => {
    const nodes = parseOutlineText(FIXTURE)
    const titles = nodes.map((n) => n.title)
    expect(titles).toEqual([
      'Copyright Info',
      'Preface',
      'Foreword to First',
      'Foreword to Fourth',
      'The Doctors Opinion',
      "Bill's Story",
      'A Vision For You',
      "Dr. Bob's Nightmare",
      'The Missing Link',
      'My Bottle, My Resentments, and Me',
      'I The A.A. Tradition',
      'A.A. Pamphlets',
    ])
  })

  it('assigns kind based on parent group', () => {
    const nodes = parseOutlineText(FIXTURE)
    const byTitle = new Map(nodes.map((n) => [n.title, n]))
    expect(byTitle.get('Copyright Info')!.kind).toBe('front-matter')
    expect(byTitle.get('Preface')!.kind).toBe('preface')
    expect(byTitle.get('Foreword to First')!.kind).toBe('foreword')
    expect(byTitle.get('The Doctors Opinion')!.kind).toBe('doctors-opinion')
    expect(byTitle.get("Bill's Story")!.kind).toBe('chapter')
    expect(byTitle.get("Dr. Bob's Nightmare")!.kind).toBe('story')
    expect(byTitle.get('I The A.A. Tradition')!.kind).toBe('appendix')
    expect(byTitle.get('A.A. Pamphlets')!.kind).toBe('appendix')
  })

  it('assigns parentGroup only to stories', () => {
    const nodes = parseOutlineText(FIXTURE)
    const byTitle = new Map(nodes.map((n) => [n.title, n]))
    expect(byTitle.get("Dr. Bob's Nightmare")!.parentGroup).toBe('personal-stories/pioneers-of-aa')
    expect(byTitle.get('The Missing Link')!.parentGroup).toBe(
      'personal-stories/they-stopped-in-time',
    )
    expect(byTitle.get('My Bottle, My Resentments, and Me')!.parentGroup).toBe(
      'personal-stories/they-lost-nearly-all',
    )
    expect(byTitle.get("Bill's Story")!.parentGroup).toBeUndefined()
    expect(byTitle.get('I The A.A. Tradition')!.parentGroup).toBeUndefined()
  })

  it('extracts pdfPageStart from page anchor', () => {
    const nodes = parseOutlineText(FIXTURE)
    const byTitle = new Map(nodes.map((n) => [n.title, n]))
    expect(byTitle.get('Copyright Info')!.pdfPageStart).toBe(1)
    expect(byTitle.get("Bill's Story")!.pdfPageStart).toBe(22)
    expect(byTitle.get('A.A. Pamphlets')!.pdfPageStart).toBe(581)
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/outline.test.ts`
Expected: FAIL — `parseOutlineText` not exported.

- [ ] **Step 4: Implement**

Write `scripts/extract-en-book/outline.ts`:

```typescript
/**
 * Parse the output of `mutool show <pdf> outline` into a flat list of
 * leaf OutlineNodes. Intermediate grouping nodes (Pre Chapters, Chapters,
 * Pioneers of A.A., etc.) are consumed to assign `kind` and `parentGroup`
 * to the leaves.
 */

import type { OutlineNode, SectionKind } from './types'

interface GroupState {
  name: string
  kind: SectionKind
  parentGroup?: string
}

const GROUP_RULES: Record<string, GroupState> = {
  'Pre Chapters': { name: 'Pre Chapters', kind: 'front-matter' },
  Chapters: { name: 'Chapters', kind: 'chapter' },
  'Pioneers of A.A.': {
    name: 'Pioneers of A.A.',
    kind: 'story',
    parentGroup: 'personal-stories/pioneers-of-aa',
  },
  'They Stopped in Time': {
    name: 'They Stopped in Time',
    kind: 'story',
    parentGroup: 'personal-stories/they-stopped-in-time',
  },
  'They Lost Nearly All': {
    name: 'They Lost Nearly All',
    kind: 'story',
    parentGroup: 'personal-stories/they-lost-nearly-all',
  },
  Appendices: { name: 'Appendices', kind: 'appendix' },
}

const PRE_CHAPTER_KIND_BY_TITLE: Record<string, SectionKind> = {
  'Copyright Info': 'front-matter',
  Preface: 'preface',
  'Foreword to First': 'foreword',
  'Foreword to Second': 'foreword',
  'Foreword to Third': 'foreword',
  'Foreword to Fourth': 'foreword',
  'The Doctors Opinion': 'doctors-opinion',
}

export function parseOutlineText(raw: string): OutlineNode[] {
  const nodes: OutlineNode[] = []
  let currentGroup: GroupState | null = null

  for (const line of raw.split('\n')) {
    const match = line.match(/^([+|])\s*(\t*)"([^"]+)"\s*#page=(\d+)/)
    if (!match) continue
    const [, marker, tabs, title, pageStr] = match
    const pdfPageStart = Number(pageStr)
    const depth = tabs.length

    if (marker === '+' && depth === 0) {
      // top-level group node
      currentGroup = GROUP_RULES[title] ?? null
      continue
    }

    if (!currentGroup) {
      throw new Error(`Leaf outline node seen before any group header: "${title}"`)
    }

    let kind: SectionKind = currentGroup.kind
    if (currentGroup.name === 'Pre Chapters') {
      kind = PRE_CHAPTER_KIND_BY_TITLE[title] ?? 'front-matter'
    }

    const leaf: OutlineNode = { title, kind, pdfPageStart }
    if (currentGroup.parentGroup) {
      leaf.parentGroup = currentGroup.parentGroup
    }
    nodes.push(leaf)
  }

  return nodes
}
```

- [ ] **Step 5: Run test**

Run: `npx vitest run tests/scripts/extract-en-book/outline.test.ts`
Expected: PASS, 4/4.

- [ ] **Step 6: Commit**

```bash
git add scripts/extract-en-book/outline.ts \
        tests/scripts/extract-en-book/outline.test.ts \
        tests/scripts/extract-en-book/fixtures/outline-sample.txt
git commit -m "feat(extract): parse mutool outline into typed OutlineNodes

(*BB:Granjon*)"
```

---

## Task 5: Hardcoded fallback outline + fetchOutline glue

**Files:**

- Modify: `scripts/extract-en-book/outline.ts`
- Modify: `tests/scripts/extract-en-book/outline.test.ts`
- Create: `tests/scripts/extract-en-book/fixtures/outline-full.txt` (full mutool output for regression)

- [ ] **Step 1: Capture real mutool output**

Run:

```bash
mutool show legacy/assets/AA-BigBook-4th-Edition.pdf outline 2>/dev/null \
  > tests/scripts/extract-en-book/fixtures/outline-full.txt
```

- [ ] **Step 2: Write failing test**

Append to `tests/scripts/extract-en-book/outline.test.ts`:

```typescript
import { FALLBACK_OUTLINE, fetchOutline } from '../../../scripts/extract-en-book/outline'

const FULL_FIXTURE = readFileSync(resolve(__dirname, 'fixtures/outline-full.txt'), 'utf8')

describe('FALLBACK_OUTLINE', () => {
  it('has exactly 68 leaf sections', () => {
    expect(FALLBACK_OUTLINE).toHaveLength(68)
  })

  it('matches parseOutlineText on the real mutool output', () => {
    const parsed = parseOutlineText(FULL_FIXTURE)
    expect(parsed.map((n) => n.title)).toEqual(FALLBACK_OUTLINE.map((n) => n.title))
    expect(parsed.map((n) => n.kind)).toEqual(FALLBACK_OUTLINE.map((n) => n.kind))
    expect(parsed.map((n) => n.pdfPageStart)).toEqual(FALLBACK_OUTLINE.map((n) => n.pdfPageStart))
  })
})

describe('fetchOutline', () => {
  it('returns FALLBACK_OUTLINE when parse returns empty', () => {
    const result = fetchOutline(() => '')
    expect(result).toEqual(FALLBACK_OUTLINE)
  })

  it('returns parsed nodes when mutool output is valid', () => {
    const result = fetchOutline(() => FULL_FIXTURE)
    expect(result).toHaveLength(68)
    expect(result[0].title).toBe('Copyright Info')
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/outline.test.ts`
Expected: FAIL — `FALLBACK_OUTLINE` and `fetchOutline` not exported.

- [ ] **Step 4: Generate the fallback constant from real mutool output**

Run this one-liner to produce the constant (or transcribe manually if preferred):

```bash
node -e "
const fs = require('fs');
const { parseOutlineText } = require('./scripts/extract-en-book/outline.ts');
" 2>/dev/null || true
```

Since the above can't run `.ts` directly, instead: open the captured `outline-full.txt` fixture, and transcribe each leaf into a hardcoded array. Alternatively, run a tsx one-shot to emit the array:

```bash
npx tsx -e "
import { readFileSync } from 'node:fs'
import { parseOutlineText } from './scripts/extract-en-book/outline'
const raw = readFileSync('tests/scripts/extract-en-book/fixtures/outline-full.txt', 'utf8')
const nodes = parseOutlineText(raw)
console.log('export const FALLBACK_OUTLINE: OutlineNode[] = ' + JSON.stringify(nodes, null, 2))
"
```

Copy the emitted array into `scripts/extract-en-book/outline.ts` as `FALLBACK_OUTLINE`.

- [ ] **Step 5: Add fetchOutline and FALLBACK_OUTLINE to outline.ts**

Append to `scripts/extract-en-book/outline.ts`:

```typescript
export const FALLBACK_OUTLINE: OutlineNode[] = [
  // paste the output from Step 4 here
]

export function fetchOutline(reader: () => string): OutlineNode[] {
  const raw = reader()
  const parsed = parseOutlineText(raw)
  if (parsed.length === 0) {
    console.warn('mutool outline empty or unparseable — using FALLBACK_OUTLINE')
    return FALLBACK_OUTLINE
  }
  return parsed
}
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/outline.test.ts`
Expected: PASS, all tests green. Notably the "68 leaf sections" assertion must hold.

- [ ] **Step 7: Commit**

```bash
git add scripts/extract-en-book/outline.ts \
        tests/scripts/extract-en-book/outline.test.ts \
        tests/scripts/extract-en-book/fixtures/outline-full.txt
git commit -m "feat(extract): FALLBACK_OUTLINE constant + fetchOutline() glue

Defensive fallback in case mutool output shape changes or parsing fails.
Parity-checked against real mutool output (68 leaf sections).

(*BB:Granjon*)"
```

---

## Task 6: pdftotext wrapper

**Files:**

- Create: `scripts/extract-en-book/pdftotext.ts`
- Create: `tests/scripts/extract-en-book/pdftotext.test.ts`

- [ ] **Step 1: Write failing test**

Write `tests/scripts/extract-en-book/pdftotext.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { extractPages } from '../../../scripts/extract-en-book/pdftotext'

const PDF = 'legacy/assets/AA-BigBook-4th-Edition.pdf'

describe('extractPages', () => {
  it('returns text for a page range', () => {
    const text = extractPages(PDF, 12, 13)
    expect(text).toContain('FOREWORD TO FOURTH EDITION')
    expect(text).toContain('November 2001')
  })

  it('preserves blank-line paragraph separators', () => {
    const text = extractPages(PDF, 12, 13)
    expect(text).toMatch(/FOREWORD TO FOURTH EDITION\n\n.*THIS fourth edition/s)
  })

  it('throws on pdftotext non-zero exit', () => {
    expect(() => extractPages('/nonexistent.pdf', 1, 1)).toThrow()
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/pdftotext.test.ts`
Expected: FAIL — `extractPages` not exported.

- [ ] **Step 3: Implement**

Write `scripts/extract-en-book/pdftotext.ts`:

```typescript
/**
 * Thin wrapper around the `pdftotext` binary (from poppler-utils).
 * Always uses -layout mode for consistent spacing and paragraph breaks.
 */

import { spawnSync } from 'node:child_process'

export function extractPages(pdfPath: string, pageStart: number, pageEnd: number): string {
  const result = spawnSync(
    'pdftotext',
    ['-layout', '-f', String(pageStart), '-l', String(pageEnd), pdfPath, '-'],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(
      `pdftotext failed for ${pdfPath} pages ${pageStart}-${pageEnd}: ` +
        `status=${result.status}, stderr=${result.stderr}`,
    )
  }
  return result.stdout
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/pdftotext.test.ts`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/pdftotext.ts tests/scripts/extract-en-book/pdftotext.test.ts
git commit -m "feat(extract): pdftotext wrapper (extractPages)

(*BB:Granjon*)"
```

---

## Task 7: Normalize — strip QXD header and page-number lines

**Files:**

- Create: `scripts/extract-en-book/normalize.ts`
- Create: `tests/scripts/extract-en-book/normalize.test.ts`

- [ ] **Step 1: Write failing test**

Write `tests/scripts/extract-en-book/normalize.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { normalize } from '../../../scripts/extract-en-book/normalize'

describe('normalize', () => {
  it('strips Adobe QXD running header', () => {
    const input = [
      'Alco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page 154',
      '',
      'real content here',
    ].join('\n')
    const out = normalize(input, { sectionTitle: 'A Vision For You' })
    expect(out).not.toMatch(/\.qxd/)
    expect(out).toContain('real content here')
  })

  it('strips standalone page-number lines', () => {
    const input = ['real content', '', '154', '', 'more content'].join('\n')
    const out = normalize(input, { sectionTitle: 'Any' })
    expect(out).not.toMatch(/^154$/m)
    expect(out).toContain('real content')
    expect(out).toContain('more content')
  })

  it('strips combined page-number + section title line (layout mode artifact)', () => {
    const input = ['              154             ALCOHOLICS ANONYMOUS', 'real content here'].join(
      '\n',
    )
    const out = normalize(input, { sectionTitle: 'A Vision For You' })
    expect(out).not.toMatch(/ALCOHOLICS ANONYMOUS/)
    expect(out).not.toMatch(/154/)
    expect(out).toContain('real content here')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/normalize.test.ts`
Expected: FAIL — `normalize` not exported.

- [ ] **Step 3: Implement (partial — strips only)**

Write `scripts/extract-en-book/normalize.ts`:

```typescript
/**
 * Clean raw pdftotext output: strip running headers, page numbers,
 * running titles, and cross-page paragraph splits.
 */

export interface NormalizeContext {
  sectionTitle: string
}

const QXD_HEADER = /^Alco_\w+_\d+p_\w+_r\d+\.qxd .+Page \d+$/
const PAGE_NUMBER_LINE = /^\s*\d{1,3}\s*$/
const PAGE_AND_TITLE = /^\s*\d{1,3}\s+[A-Z][A-Z .'\u2019-]+\s*$/
const BOOK_TITLE_LINE = /^\s*ALCOHOLICS ANONYMOUS\s*$/

export function normalize(raw: string, ctx: NormalizeContext): string {
  const lines = raw.split('\n')
  const sectionTitleUpper = ctx.sectionTitle.toUpperCase()
  const kept: string[] = []

  for (const line of lines) {
    if (QXD_HEADER.test(line)) continue
    if (PAGE_NUMBER_LINE.test(line)) continue
    if (BOOK_TITLE_LINE.test(line)) continue
    if (PAGE_AND_TITLE.test(line)) continue
    if (line.trim().toUpperCase() === sectionTitleUpper) continue
    kept.push(line)
  }

  return kept.join('\n')
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/normalize.test.ts`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/normalize.ts tests/scripts/extract-en-book/normalize.test.ts
git commit -m "feat(extract): normalize — strip QXD headers and page-number lines

(*BB:Granjon*)"
```

---

## Task 8: Normalize — rejoin hyphenation across line breaks

**Files:**

- Modify: `scripts/extract-en-book/normalize.ts`
- Modify: `tests/scripts/extract-en-book/normalize.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/scripts/extract-en-book/normalize.test.ts`:

```typescript
describe('normalize — hyphen rejoin', () => {
  it('rejoins a word broken across lines', () => {
    const input = 'suc-\ncessful in his'
    const out = normalize(input, { sectionTitle: 'Any' })
    expect(out).toContain('successful in his')
    expect(out).not.toContain('suc-')
  })

  it('preserves intentional hyphen compounds', () => {
    const input = 'self-reliance and contentment'
    const out = normalize(input, { sectionTitle: 'Any' })
    expect(out).toContain('self-reliance')
  })

  it('rejoins across stripped page-break artifacts', () => {
    const input = [
      'suc-',
      'Alco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page 155',
      '',
      '              155             ALCOHOLICS ANONYMOUS',
      'cessful in his enterprise',
    ].join('\n')
    const out = normalize(input, { sectionTitle: 'A Vision For You' })
    expect(out).toContain('successful in his enterprise')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/normalize.test.ts`
Expected: FAIL — new tests fail, old ones still pass.

- [ ] **Step 3: Extend normalize() to rejoin hyphens after strip**

Replace the body of `normalize()` in `scripts/extract-en-book/normalize.ts`:

```typescript
export function normalize(raw: string, ctx: NormalizeContext): string {
  const lines = raw.split('\n')
  const sectionTitleUpper = ctx.sectionTitle.toUpperCase()
  const kept: string[] = []

  for (const line of lines) {
    if (QXD_HEADER.test(line)) continue
    if (PAGE_NUMBER_LINE.test(line)) continue
    if (BOOK_TITLE_LINE.test(line)) continue
    if (PAGE_AND_TITLE.test(line)) continue
    if (line.trim().toUpperCase() === sectionTitleUpper) continue
    kept.push(line)
  }

  return rejoinHyphens(kept.join('\n'))
}

function rejoinHyphens(text: string): string {
  // Rejoin a trailing "word-" on one line with "word" starting the next
  // non-blank line. Conservative: only rejoin lowercase-lowercase pairs,
  // which covers the pdftotext artifact without touching compounds like
  // "self-reliance" that appear on the same line.
  return text.replace(/([a-z]+)-\n\s*\n?\s*([a-z]+)/g, (_, a: string, b: string) => `${a}${b}`)
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/normalize.test.ts`
Expected: PASS, all 6 tests (3 from Task 7 + 3 new).

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/normalize.ts tests/scripts/extract-en-book/normalize.test.ts
git commit -m "feat(extract): normalize — rejoin hyphenation across line breaks

(*BB:Granjon*)"
```

---

## Task 9: Normalize — rejoin paragraphs split across page breaks

**Files:**

- Modify: `scripts/extract-en-book/normalize.ts`
- Modify: `tests/scripts/extract-en-book/normalize.test.ts`

- [ ] **Step 1: Write failing test**

Append to `tests/scripts/extract-en-book/normalize.test.ts`:

```typescript
describe('normalize — paragraph rejoin across page breaks', () => {
  it('rejoins a paragraph split by a page-break artifact', () => {
    const input = [
      'First half of paragraph ending',
      'Alco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page 155',
      '',
      '              155             ALCOHOLICS ANONYMOUS',
      'second half continues here.',
    ].join('\n')
    const out = normalize(input, { sectionTitle: 'A Vision For You' })
    // Expect one blank-line-free paragraph block, not two separate ones
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim())
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0]).toContain('First half of paragraph ending')
    expect(paragraphs[0]).toContain('second half continues here.')
  })

  it('preserves legitimate paragraph breaks', () => {
    const input = ['First paragraph.', '', 'Second paragraph.'].join('\n')
    const out = normalize(input, { sectionTitle: 'Any' })
    const paragraphs = out.split(/\n\s*\n/).filter((p) => p.trim())
    expect(paragraphs).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/normalize.test.ts`
Expected: the rejoin test fails; others still pass.

- [ ] **Step 3: Improve normalize — after strip, merge consecutive text lines not separated by blank lines into one; preserve blank-line paragraph breaks**

Replace `normalize()` in `scripts/extract-en-book/normalize.ts`:

```typescript
export function normalize(raw: string, ctx: NormalizeContext): string {
  const lines = raw.split('\n')
  const sectionTitleUpper = ctx.sectionTitle.toUpperCase()
  const kept: string[] = []

  for (const line of lines) {
    if (QXD_HEADER.test(line)) continue
    if (PAGE_NUMBER_LINE.test(line)) continue
    if (BOOK_TITLE_LINE.test(line)) continue
    if (PAGE_AND_TITLE.test(line)) continue
    if (line.trim().toUpperCase() === sectionTitleUpper) continue
    kept.push(line)
  }

  // Collapse runs of blank lines to a single blank separator — this merges
  // the "extra" blank lines left behind after stripping page-break artifacts.
  const collapsed: string[] = []
  let prevBlank = false
  for (const line of kept) {
    const isBlank = line.trim() === ''
    if (isBlank && prevBlank) continue
    collapsed.push(line)
    prevBlank = isBlank
  }
  return rejoinHyphens(collapsed.join('\n'))
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/normalize.test.ts`
Expected: PASS, 8/8.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/normalize.ts tests/scripts/extract-en-book/normalize.test.ts
git commit -m "feat(extract): normalize — rejoin paragraphs across page breaks

(*BB:Granjon*)"
```

---

## Task 10: Segment — split into raw blocks, detect paragraph by default

**Files:**

- Create: `scripts/extract-en-book/segment.ts`
- Create: `tests/scripts/extract-en-book/segment.test.ts`

- [ ] **Step 1: Write failing test**

Write `tests/scripts/extract-en-book/segment.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { segmentBlocks } from '../../../scripts/extract-en-book/segment'

describe('segmentBlocks — paragraph default', () => {
  it('splits on blank lines', () => {
    const input = ['First paragraph.', '', 'Second paragraph.'].join('\n')
    const blocks = segmentBlocks(input, { sectionTitle: 'Any', sectionId: 'sec', pdfPageStart: 10 })
    expect(blocks).toHaveLength(2)
    expect(blocks[0].kind).toBe('paragraph')
    expect(blocks[0].text).toBe('First paragraph.')
    expect(blocks[1].kind).toBe('paragraph')
    expect(blocks[1].text).toBe('Second paragraph.')
  })

  it('joins multi-line paragraphs with spaces', () => {
    const input = ['First line', 'continues here', 'and here.'].join('\n')
    const blocks = segmentBlocks(input, { sectionTitle: 'Any', sectionId: 'sec', pdfPageStart: 10 })
    expect(blocks).toHaveLength(1)
    expect(blocks[0].text).toBe('First line continues here and here.')
  })

  it('trims leading and trailing whitespace in each block', () => {
    const input = '   padded   '
    const blocks = segmentBlocks(input, { sectionTitle: 'Any', sectionId: 'sec', pdfPageStart: 10 })
    expect(blocks[0].text).toBe('padded')
  })

  it('skips empty input', () => {
    const blocks = segmentBlocks('', { sectionTitle: 'Any', sectionId: 'sec', pdfPageStart: 10 })
    expect(blocks).toEqual([])
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/segment.test.ts`
Expected: FAIL — `segmentBlocks` not exported.

- [ ] **Step 3: Implement**

Write `scripts/extract-en-book/segment.ts`:

```typescript
/**
 * Turn normalized section text into a typed Block[].
 */

import type { Block, BlockKind } from './types'

export interface SegmentContext {
  sectionTitle: string
  sectionId: string
  pdfPageStart: number
}

export function segmentBlocks(text: string, ctx: SegmentContext): Block[] {
  const rawGroups = text.split(/\n\s*\n/)
  const blocks: Block[] = []
  let ordinal = 1
  for (const group of rawGroups) {
    const cleaned = collapseLines(group).trim()
    if (!cleaned) continue
    const kind: BlockKind = 'paragraph'
    const id = `${ctx.sectionId}-p${String(ordinal).padStart(3, '0')}`
    blocks.push({ id, kind, text: cleaned, pdfPage: ctx.pdfPageStart })
    ordinal += 1
  }
  return blocks
}

function collapseLines(group: string): string {
  return group
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join(' ')
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/segment.test.ts`
Expected: PASS, 4/4.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/segment.ts tests/scripts/extract-en-book/segment.test.ts
git commit -m "feat(extract): segment — split into paragraph blocks

(*BB:Granjon*)"
```

---

## Task 11: Segment — heading detection

**Files:**

- Modify: `scripts/extract-en-book/segment.ts`
- Modify: `tests/scripts/extract-en-book/segment.test.ts`

- [ ] **Step 1: Write failing test**

Append to `tests/scripts/extract-en-book/segment.test.ts`:

```typescript
describe('segmentBlocks — heading detection', () => {
  it("marks the first block as 'heading' when it matches the section title", () => {
    const input = ['FOREWORD TO FOURTH EDITION', '', 'THIS fourth edition...'].join('\n')
    const blocks = segmentBlocks(input, {
      sectionTitle: 'Foreword to Fourth',
      sectionId: 'foreword-4th-edition',
      pdfPageStart: 12,
    })
    expect(blocks[0].kind).toBe('heading')
    expect(blocks[0].text).toBe('FOREWORD TO FOURTH EDITION')
    expect(blocks[1].kind).toBe('paragraph')
  })

  it('title-match is case and punctuation tolerant', () => {
    const input = ["BILL'S STORY", '', 'War fever ran high...'].join('\n')
    const blocks = segmentBlocks(input, {
      sectionTitle: "Bill's Story",
      sectionId: 'ch01-bills-story',
      pdfPageStart: 22,
    })
    expect(blocks[0].kind).toBe('heading')
  })

  it("does not mark mid-text all-caps lines as 'heading'", () => {
    const input = [
      'FOREWORD TO FOURTH EDITION',
      '',
      'A paragraph',
      '',
      'A STANDALONE SHOUT',
      '',
      'Another paragraph',
    ].join('\n')
    const blocks = segmentBlocks(input, {
      sectionTitle: 'Foreword to Fourth',
      sectionId: 'foreword-4th-edition',
      pdfPageStart: 12,
    })
    expect(blocks[0].kind).toBe('heading')
    expect(blocks[1].kind).toBe('paragraph')
    expect(blocks[2].kind).toBe('paragraph')
    expect(blocks[3].kind).toBe('paragraph')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/segment.test.ts`
Expected: heading tests FAIL (still defaults to paragraph).

- [ ] **Step 3: Extend segmentBlocks — detect heading on first block**

Modify `segmentBlocks` in `scripts/extract-en-book/segment.ts` to set `kind = 'heading'` only for the first block when its normalized text matches the normalized section title:

```typescript
export function segmentBlocks(text: string, ctx: SegmentContext): Block[] {
  const rawGroups = text.split(/\n\s*\n/)
  const blocks: Block[] = []
  const normalizedTitle = normalizeForMatch(ctx.sectionTitle)
  let ordinal = 1
  let headingEmitted = false

  for (const group of rawGroups) {
    const cleaned = collapseLines(group).trim()
    if (!cleaned) continue

    let kind: BlockKind = 'paragraph'
    if (!headingEmitted && normalizeForMatch(cleaned) === normalizedTitle) {
      kind = 'heading'
      headingEmitted = true
    }

    const id = `${ctx.sectionId}-p${String(ordinal).padStart(3, '0')}`
    blocks.push({ id, kind, text: cleaned, pdfPage: ctx.pdfPageStart })
    ordinal += 1
  }
  return blocks
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/segment.test.ts`
Expected: PASS, 7/7.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/segment.ts tests/scripts/extract-en-book/segment.test.ts
git commit -m "feat(extract): segment — detect heading via section-title match

(*BB:Granjon*)"
```

---

## Task 12: Segment — verse, blockquote, list-item, footnote detection

**Files:**

- Modify: `scripts/extract-en-book/segment.ts`
- Modify: `tests/scripts/extract-en-book/segment.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `tests/scripts/extract-en-book/segment.test.ts`:

```typescript
describe('segmentBlocks — block-kind detection', () => {
  it('marks short indented quoted lines as verse', () => {
    const input = [
      '"Here lies a Hampshire Grenadier,',
      'who caught his death',
      'drinking cold small beer."',
    ].join('\n')
    const blocks = segmentBlocks(input, {
      sectionTitle: "Bill's Story",
      sectionId: 'ch01-bills-story',
      pdfPageStart: 22,
    })
    expect(blocks[0].kind).toBe('verse')
    expect(blocks[0].text).toContain('\n')
  })

  it('marks numbered list items', () => {
    const input = '1. First step in the program.'
    const blocks = segmentBlocks(input, {
      sectionTitle: 'How It Works',
      sectionId: 'ch05-how-it-works',
      pdfPageStart: 79,
    })
    expect(blocks[0].kind).toBe('list-item')
  })

  it('marks footnote (asterisk-prefixed, short)', () => {
    const input = '* This refers to Bill\u2019s first visit with Dr. Bob.'
    const blocks = segmentBlocks(input, {
      sectionTitle: 'A Vision For You',
      sectionId: 'ch11-a-vision-for-you',
      pdfPageStart: 155,
    })
    expect(blocks[0].kind).toBe('footnote')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/segment.test.ts`
Expected: new tests FAIL.

- [ ] **Step 3: Extend segment.ts with detectKind()**

Replace the block-building loop in `segmentBlocks`:

```typescript
export function segmentBlocks(text: string, ctx: SegmentContext): Block[] {
  const rawGroups = text.split(/\n\s*\n/)
  const blocks: Block[] = []
  const normalizedTitle = normalizeForMatch(ctx.sectionTitle)
  let ordinal = 1
  let headingEmitted = false

  for (const group of rawGroups) {
    const lines = group
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    if (lines.length === 0) continue

    const collapsed = lines.join(' ')
    let kind: BlockKind
    let text: string

    if (!headingEmitted && normalizeForMatch(collapsed) === normalizedTitle) {
      kind = 'heading'
      text = collapsed
      headingEmitted = true
    } else {
      kind = detectKind(lines, group)
      text = kind === 'verse' ? lines.join('\n') : collapsed
    }

    const id = `${ctx.sectionId}-p${String(ordinal).padStart(3, '0')}`
    blocks.push({ id, kind, text, pdfPage: ctx.pdfPageStart })
    ordinal += 1
  }
  return blocks
}

function detectKind(lines: string[], _rawGroup: string): BlockKind {
  if (
    lines.length >= 2 &&
    lines.every((l) => l.length <= 60) &&
    linesStartWithQuoteOrIndent(lines)
  ) {
    return 'verse'
  }
  const first = lines[0]
  if (/^\*\s+/.test(first) || /^\u2020\s+/.test(first)) {
    return 'footnote'
  }
  if (/^(\d+\.|[a-z]\.|\([a-z0-9]+\))\s/i.test(first)) {
    return 'list-item'
  }
  return 'paragraph'
}

function linesStartWithQuoteOrIndent(lines: string[]): boolean {
  const quoted = lines.filter((l) => /^["\u201C]/.test(l)).length
  return quoted >= 1
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/segment.test.ts`
Expected: PASS, 10/10.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/segment.ts tests/scripts/extract-en-book/segment.test.ts
git commit -m "feat(extract): segment — detect verse, list-item, footnote

Blockquote detection (indent-based) deferred until real-PDF samples surface.

(*BB:Granjon*)"
```

---

## Task 13: Orchestrator — wire pipeline, enforce runtime invariants

**Files:**

- Modify: `scripts/extract-en-book.ts`
- Create: `scripts/extract-en-book/pipeline.ts`
- Create: `tests/scripts/extract-en-book/pipeline.test.ts`

- [ ] **Step 1: Write failing integration test**

Write `tests/scripts/extract-en-book/pipeline.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { buildBookSection } from '../../../scripts/extract-en-book/pipeline'
import type { OutlineNode } from '../../../scripts/extract-en-book/types'

const PDF = 'legacy/assets/AA-BigBook-4th-Edition.pdf'

describe('buildBookSection — integration on Foreword to Fourth', () => {
  const node: OutlineNode = {
    title: 'Foreword to Fourth',
    kind: 'foreword',
    pdfPageStart: 12,
  }

  it('produces a well-formed BookSection', () => {
    const section = buildBookSection({
      node,
      chapterOrdinal: 0,
      pdfPath: PDF,
      pdfPageEnd: 13,
      bookPageStart: 12,
      bookPageEnd: 13,
    })
    expect(section.id).toBe('foreword-4th-edition')
    expect(section.kind).toBe('foreword')
    expect(section.title).toBe('Foreword to Fourth')
    expect(section.pdfPageStart).toBe(12)
    expect(section.pdfPageEnd).toBe(13)
    expect(section.blocks.length).toBeGreaterThan(2)
    expect(section.blocks[0].kind).toBe('heading')
    expect(section.blocks[0].id).toBe('foreword-4th-edition-p001')
    expect(section.blocks[1].kind).toBe('paragraph')
    expect(section.blocks[1].text).toContain('THIS fourth edition')
  })

  it('every block has a unique ID within the section', () => {
    const section = buildBookSection({
      node,
      chapterOrdinal: 0,
      pdfPath: PDF,
      pdfPageEnd: 13,
      bookPageStart: 12,
      bookPageEnd: 13,
    })
    const ids = new Set(section.blocks.map((b) => b.id))
    expect(ids.size).toBe(section.blocks.length)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/pipeline.test.ts`
Expected: FAIL — `buildBookSection` not exported.

- [ ] **Step 3: Implement pipeline.ts**

Write `scripts/extract-en-book/pipeline.ts`:

```typescript
import type { BookSection, OutlineNode } from './types'
import { sectionIdFor } from './slug'
import { extractPages } from './pdftotext'
import { normalize } from './normalize'
import { segmentBlocks } from './segment'

export interface BuildSectionInput {
  node: OutlineNode
  chapterOrdinal: number
  pdfPath: string
  pdfPageEnd: number
  bookPageStart: number
  bookPageEnd: number
}

export function buildBookSection(input: BuildSectionInput): BookSection {
  const { node, chapterOrdinal, pdfPath, pdfPageEnd, bookPageStart, bookPageEnd } = input
  const id = sectionIdFor(node, { chapterOrdinal })
  const raw = extractPages(pdfPath, node.pdfPageStart, pdfPageEnd)
  const normalized = normalize(raw, { sectionTitle: node.title })
  const blocks = segmentBlocks(normalized, {
    sectionTitle: node.title,
    sectionId: id,
    pdfPageStart: node.pdfPageStart,
  })

  const section: BookSection = {
    id,
    kind: node.kind,
    title: node.title,
    pdfPageStart: node.pdfPageStart,
    pdfPageEnd,
    bookPageStart,
    bookPageEnd,
    blocks,
  }
  if (node.parentGroup) section.parentGroup = node.parentGroup
  return section
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/pipeline.test.ts`
Expected: PASS, 2/2.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-en-book/pipeline.ts tests/scripts/extract-en-book/pipeline.test.ts
git commit -m "feat(extract): pipeline — buildBookSection() end-to-end

(*BB:Granjon*)"
```

---

## Task 14: Orchestrator main — whole-book run, runtime invariants, JSON output

**Files:**

- Modify: `scripts/extract-en-book.ts`
- Create: `scripts/extract-en-book/invariants.ts`
- Create: `tests/scripts/extract-en-book/invariants.test.ts`

- [ ] **Step 1: Write failing test for invariants**

Write `tests/scripts/extract-en-book/invariants.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { validateExtraction } from '../../../scripts/extract-en-book/invariants'
import type { BigBookEnglish } from '../../../scripts/extract-en-book/types'

function sampleDoc(overrides: Partial<BigBookEnglish> = {}): BigBookEnglish {
  return {
    edition: '4th',
    sourcePdf: 'legacy/assets/AA-BigBook-4th-Edition.pdf',
    extractedAt: '2026-04-18T00:00:00Z',
    sections: [
      {
        id: 'preface',
        kind: 'preface',
        title: 'Preface',
        pdfPageStart: 2,
        pdfPageEnd: 3,
        bookPageStart: 2,
        bookPageEnd: 3,
        blocks: [
          { id: 'preface-p001', kind: 'heading', text: 'Preface', pdfPage: 2 },
          { id: 'preface-p002', kind: 'paragraph', text: 'Hello.', pdfPage: 2 },
        ],
      },
    ],
    ...overrides,
  }
}

describe('validateExtraction', () => {
  it('passes a well-formed document', () => {
    expect(() => validateExtraction(sampleDoc())).not.toThrow()
  })

  it('rejects duplicate section IDs', () => {
    const doc = sampleDoc()
    doc.sections.push({ ...doc.sections[0] })
    expect(() => validateExtraction(doc)).toThrow(/duplicate section id/i)
  })

  it('rejects duplicate block IDs within a section', () => {
    const doc = sampleDoc()
    doc.sections[0].blocks.push({ ...doc.sections[0].blocks[0] })
    expect(() => validateExtraction(doc)).toThrow(/duplicate block id/i)
  })

  it('rejects empty block text', () => {
    const doc = sampleDoc()
    doc.sections[0].blocks[0].text = '   '
    expect(() => validateExtraction(doc)).toThrow(/empty text/i)
  })

  it('rejects section with zero blocks (unless allowlisted)', () => {
    const doc = sampleDoc()
    doc.sections[0].blocks = []
    expect(() => validateExtraction(doc)).toThrow(/zero blocks/i)
  })

  it('allows allowlisted short sections', () => {
    const doc = sampleDoc()
    doc.sections[0] = {
      ...doc.sections[0],
      id: 'appendix-aa-pamphlets',
      kind: 'appendix',
      title: 'A.A. Pamphlets',
      blocks: [{ id: 'appendix-aa-pamphlets-p001', kind: 'paragraph', text: 'list', pdfPage: 581 }],
    }
    expect(() => validateExtraction(doc)).not.toThrow()
  })

  it('rejects pdfPageStart > pdfPageEnd', () => {
    const doc = sampleDoc()
    doc.sections[0].pdfPageStart = 10
    doc.sections[0].pdfPageEnd = 5
    expect(() => validateExtraction(doc)).toThrow(/page range/i)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/scripts/extract-en-book/invariants.test.ts`
Expected: FAIL — `validateExtraction` not exported.

- [ ] **Step 3: Implement**

Write `scripts/extract-en-book/invariants.ts`:

```typescript
import type { BigBookEnglish } from './types'

const SHORT_SECTION_ALLOWLIST = new Set(['copyright-info', 'appendix-aa-pamphlets'])

export function validateExtraction(doc: BigBookEnglish): void {
  const seenSectionIds = new Set<string>()

  for (const section of doc.sections) {
    if (seenSectionIds.has(section.id)) {
      throw new Error(`duplicate section id: ${section.id}`)
    }
    seenSectionIds.add(section.id)

    if (section.pdfPageStart > section.pdfPageEnd) {
      throw new Error(
        `invalid page range for ${section.id}: ${section.pdfPageStart} > ${section.pdfPageEnd}`,
      )
    }

    if (section.blocks.length === 0 && !SHORT_SECTION_ALLOWLIST.has(section.id)) {
      throw new Error(`zero blocks in section ${section.id}`)
    }

    const seenBlockIds = new Set<string>()
    for (const block of section.blocks) {
      if (seenBlockIds.has(block.id)) {
        throw new Error(`duplicate block id: ${block.id}`)
      }
      seenBlockIds.add(block.id)

      if (!block.text.trim()) {
        throw new Error(`empty text in block ${block.id}`)
      }

      if (block.pdfPage < section.pdfPageStart || block.pdfPage > section.pdfPageEnd) {
        throw new Error(
          `block ${block.id} pdfPage ${block.pdfPage} outside section range ` +
            `${section.pdfPageStart}-${section.pdfPageEnd}`,
        )
      }
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/scripts/extract-en-book/invariants.test.ts`
Expected: PASS, 7/7.

**Known approximation:** the orchestrator below sets `bookPageStart = pdfPageStart` and `bookPageEnd = pdfPageEnd` verbatim. The printed page numbers differ from PDF pages (the PDF has front matter with roman-numeral pagination before body page 1), but the outline does not provide the offset and parsing the combined `154 ALCOHOLICS ANONYMOUS` line is a normalize concern. Flagged as a follow-up in Task 17's iteration checklist.

- [ ] **Step 5: Wire orchestrator in `scripts/extract-en-book.ts`**

Replace the contents of `scripts/extract-en-book.ts`:

```typescript
#!/usr/bin/env node
/**
 * Extract the AA Big Book 4th edition PDF into data/extractions/en-4th-edition.json.
 *
 * Run: npm run extract:en
 * See: docs/superpowers/specs/2026-04-18-en-book-extraction-design.md
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchOutline } from './extract-en-book/outline'
import { extractPages } from './extract-en-book/pdftotext'
import { validateExtraction } from './extract-en-book/invariants'
import { buildBookSection } from './extract-en-book/pipeline'
import type { BigBookEnglish, BookSection } from './extract-en-book/types'

const SCRIPT_FILE = fileURLToPath(import.meta.url)
const REPO_ROOT = resolve(dirname(SCRIPT_FILE), '..')
const PDF_PATH = 'legacy/assets/AA-BigBook-4th-Edition.pdf'
const OUT_DIR = 'data/extractions'
const JSON_OUT = `${OUT_DIR}/en-4th-edition.json`
const RAW_OUT = `${OUT_DIR}/en-4th-edition.raw.txt`

function readMutoolOutline(): string {
  const result = spawnSync('mutool', ['show', PDF_PATH, 'outline'], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
  })
  if (result.status !== 0) {
    console.warn(`mutool exited ${result.status}; will rely on FALLBACK_OUTLINE`)
    return ''
  }
  return result.stdout
}

async function main(): Promise<void> {
  const nodes = fetchOutline(readMutoolOutline)
  console.log(`outline: ${nodes.length} leaf sections`)

  // Compute pdfPageEnd as (next node's pdfPageStart - 1); the last node ends at the PDF total page count.
  const PDF_TOTAL_PAGES = 581
  const pageEnds = nodes.map((_, i) =>
    i < nodes.length - 1 ? nodes[i + 1].pdfPageStart - 1 : PDF_TOTAL_PAGES,
  )

  // Assign chapter ordinals.
  let chapterCount = 0
  const sections: BookSection[] = []
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i]
    const chapterOrdinal = node.kind === 'chapter' ? ++chapterCount : 0
    const section = buildBookSection({
      node,
      chapterOrdinal,
      pdfPath: resolve(REPO_ROOT, PDF_PATH),
      pdfPageEnd: pageEnds[i],
      bookPageStart: node.pdfPageStart,
      bookPageEnd: pageEnds[i],
    })
    sections.push(section)
    console.log(`${section.id}: ${section.blocks.length} blocks`)
  }

  const doc: BigBookEnglish = {
    edition: '4th',
    sourcePdf: PDF_PATH,
    extractedAt: process.env.EXTRACTED_AT ?? new Date().toISOString(),
    sections,
  }

  validateExtraction(doc)

  const rawFullBook = extractPages(resolve(REPO_ROOT, PDF_PATH), 1, PDF_TOTAL_PAGES)

  mkdirSync(resolve(REPO_ROOT, OUT_DIR), { recursive: true })
  writeFileSync(resolve(REPO_ROOT, JSON_OUT), JSON.stringify(doc, null, 2) + '\n', 'utf8')
  writeFileSync(resolve(REPO_ROOT, RAW_OUT), rawFullBook, 'utf8')

  console.log(`wrote ${JSON_OUT} (${sections.length} sections)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add scripts/extract-en-book.ts scripts/extract-en-book/invariants.ts \
        tests/scripts/extract-en-book/invariants.test.ts
git commit -m "feat(extract): orchestrator + runtime invariants

Wires outline → pipeline → JSON output, enforces invariants before write.

(*BB:Granjon*)"
```

---

## Task 15: Sample-review.md generator

**Files:**

- Create: `scripts/extract-en-book/sample-review.ts`
- Modify: `scripts/extract-en-book.ts` (invoke after validate)

- [ ] **Step 1: Implement sample-review writer**

Write `scripts/extract-en-book/sample-review.ts`:

```typescript
/**
 * Produce a markdown report with 3 random blocks per section for PO proofreading.
 */

import type { BigBookEnglish } from './types'

export function buildSampleReview(doc: BigBookEnglish, seed = 42): string {
  const rng = mulberry32(seed)
  const lines: string[] = []
  lines.push('# EN extraction — sample review')
  lines.push('')
  lines.push(`Seed: ${seed} · Sections: ${doc.sections.length}`)
  lines.push('')

  for (const section of doc.sections) {
    lines.push(`## ${section.id} — ${section.title} (p. ${section.bookPageStart})`)
    lines.push('')
    const samples = pickN(section.blocks, 3, rng)
    for (const block of samples) {
      lines.push(`- **\`${block.id}\`** (kind: ${block.kind}, pdfPage ${block.pdfPage})`)
      lines.push('')
      lines.push(`  > ${block.text.replace(/\n/g, '\n  > ')}`)
      lines.push('')
    }
  }
  return lines.join('\n')
}

function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  if (arr.length <= n) return arr
  const indices = new Set<number>()
  while (indices.size < n) {
    indices.add(Math.floor(rng() * arr.length))
  }
  return [...indices].sort((a, b) => a - b).map((i) => arr[i])
}
```

- [ ] **Step 2: Wire into orchestrator**

In `scripts/extract-en-book.ts`, after `validateExtraction(doc)`, add:

```typescript
import { buildSampleReview } from './extract-en-book/sample-review'

// ...inside main(), after validateExtraction:
const REVIEW_OUT = `${OUT_DIR}/sample-review.md`
writeFileSync(resolve(REPO_ROOT, REVIEW_OUT), buildSampleReview(doc), 'utf8')
console.log(`wrote ${REVIEW_OUT}`)
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-en-book/sample-review.ts scripts/extract-en-book.ts
git commit -m "feat(extract): sample-review.md generator

Deterministic 3-random-blocks-per-section report for PO proofreading.

(*BB:Granjon*)"
```

---

## Task 16: First full run — commit artifacts

**Files:**

- Create (generated): `data/extractions/en-4th-edition.json`
- Create (generated): `data/extractions/en-4th-edition.raw.txt`
- Create (generated): `data/extractions/sample-review.md`
- Modify: `scripts/extract-en-book/.gitignore` (none — we commit these)

- [ ] **Step 1: Run the full extraction**

```bash
EXTRACTED_AT=2026-04-18T00:00:00Z npm run extract:en
```

Expected console output: 68 lines like `<section-id>: <N> blocks`, then `wrote data/extractions/en-4th-edition.json (68 sections)` and `wrote data/extractions/sample-review.md`.

Expected files present:

- `data/extractions/en-4th-edition.json` (2–5 MB)
- `data/extractions/en-4th-edition.raw.txt` (~1 MB)
- `data/extractions/sample-review.md` (~50–100 KB)

- [ ] **Step 2: Sanity-check the output**

Run:

```bash
node -e "
const doc = require('./data/extractions/en-4th-edition.json');
console.log('sections:', doc.sections.length);
console.log('total blocks:', doc.sections.reduce((s, sec) => s + sec.blocks.length, 0));
console.log('first section:', doc.sections[0].id, doc.sections[0].blocks.length, 'blocks');
console.log('ch01 first block text:');
console.log(doc.sections.find(s => s.id === 'ch01-bills-story').blocks[1].text.slice(0, 200));
"
```

Expected: sections = 68; total blocks in the low thousands; `ch01-bills-story` paragraph 002 text begins "War fever ran high in the New England town..." with the authoritative "new, young officers from Plattsburg" wording.

- [ ] **Step 3: Remove old content-guard entries if any mismatch**

Run: `git status`. Should show only new files under `data/extractions/`.

- [ ] **Step 4: Commit artifacts**

```bash
git add data/extractions/en-4th-edition.json \
        data/extractions/en-4th-edition.raw.txt \
        data/extractions/sample-review.md
git commit -m "feat(extract): first full EN extraction artifact

Run on $(date -u +%Y-%m-%dT%H:%MZ). 68 sections from the authoritative
AA Big Book 4th edition PDF; EN-keyed IDs; plaintext blocks.

(*BB:Plantin*)"
```

---

## Task 17: Proofread sample-review.md, iterate on parser

**Files:**

- Read: `data/extractions/sample-review.md`
- Cross-reference: `legacy/assets/AA-BigBook-4th-Edition.pdf`
- Iterate: any file under `scripts/extract-en-book/` as issues surface

- [ ] **Step 1: Open the sample review**

Open `data/extractions/sample-review.md` in an editor. Scan each section's three sampled blocks and cross-check against the PDF page noted.

- [ ] **Step 2: Categorize each failure**

For every block that doesn't match the PDF verbatim, tag the root cause:

- **Normalize miss** — header/page-number/running-title leaked through → add to `normalize.ts`, write a unit test first.
- **Segment miss** — wrong `kind` (e.g., verse detected as paragraph) → extend `detectKind()` in `segment.ts`, test first.
- **Hyphen miss** — compound rejoined that shouldn't have been, or vice versa → refine `rejoinHyphens()` with a targeted test case.
- **Outline issue** — wrong page range or missing section → check `FALLBACK_OUTLINE` vs PDF.
- **bookPage approximation** — if PO wants accurate printed page numbers, extract them from the stripped `PAGE## BOOK TITLE` lines before they are dropped in normalize. Capture in a separate pre-normalize pass and thread through into `BookSection.bookPageStart`/`bookPageEnd`.

- [ ] **Step 3: For each unique category, add a failing fixture test, then fix**

Example — if `ch01-bills-story-p005` has trailing `154` that slipped past the page-number strip:

1. Write a fixture in `tests/scripts/extract-en-book/fixtures/<edge>.txt` with the exact symptom.
2. Add a failing test in the corresponding `*.test.ts` file asserting the expected cleaned output.
3. Run the test, confirm it fails.
4. Extend the relevant module.
5. Run the test, confirm it passes.
6. Re-run the full extraction: `EXTRACTED_AT=2026-04-18T00:00:00Z npm run extract:en`
7. Confirm the affected block in the updated sample-review is now clean.

- [ ] **Step 4: Commit iteratively — one fix per commit**

For each category fixed:

```bash
git add scripts/extract-en-book/<module>.ts \
        tests/scripts/extract-en-book/<module>.test.ts \
        tests/scripts/extract-en-book/fixtures/<edge>.txt \
        data/extractions/en-4th-edition.json \
        data/extractions/en-4th-edition.raw.txt \
        data/extractions/sample-review.md
git commit -m "fix(extract): <one-line what the fix addresses>

(*BB:Granjon*)"
```

- [ ] **Step 5: Final sign-off**

When a complete pass of the sample-review reveals no remaining issues, hand to PO with:

- Path to the live sample-review file.
- Short summary of classes of fixes applied (e.g., "Normalize miss ×3, segment miss ×1, hyphen miss ×0").
- Explicit note that drift analysis against ET is a separate spec.

---

## Task 18: Full quality-gate pass

**Files:** none

- [ ] **Step 1: Run the full Layer-3 gate**

Run in order, fix any failures:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
```

Expected: all four pass, exit 0. Test count should be ~160+ (prior 142 + new tests from this plan).

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: Astro build succeeds. No new size-limit violations (the data/ directory isn't bundled).

- [ ] **Step 3: Optional — push**

```bash
git push origin main
```

Only after PO approval.

---

## Plan Complete

On green-light from PO:

- `data/extractions/en-4th-edition.json` is the committed extraction artifact.
- All unit + integration tests are green.
- A separate spec will propose how to fold the extracted EN into the live `src/content/en/` collection, analyze drift against `src/content/et/`, and decide the sync strategy.

(_BB:Plantin_)
