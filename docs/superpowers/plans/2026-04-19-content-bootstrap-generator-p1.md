# Content Bootstrap Generator — Phase P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic bootstrap generator that consumes the approved pairing artifact + both extractions and emits a complete `src/content/{en,et}/` tree of 68 markdown files per language, filling asymmetric blocks with Claude Sonnet 4.6 auto-translations attributed to `(_BB:Boderie_)`, and regenerates the reader's `CHAPTERS` manifest to match.

**Architecture:** A pure-TypeScript generator under `scripts/bootstrap-content/`. Hardcoded group mapping reused from section-map. Per-kind markdown renderer. Anthropic SDK translation wrapper with file-backed cache for idempotence. Manifest co-located at `src/content/manifest.json` with a backward-compat wrapper at `src/lib/content/manifest.ts`. Lands on a feature branch via git worktree isolation; does not merge to main until P2 (reader adaptation) catches up.

**Tech Stack:** TypeScript 5 strict · Node 22 · tsx · Vitest 2 · `@anthropic-ai/sdk` ^0.89.0 (already installed) · existing artifact at `data/extractions/pairing/en-et.json` · existing extractions at `data/extractions/structured/` (EN) and `data/extractions/structured-et/` (ET).

**Spec:** `docs/superpowers/specs/2026-04-19-content-bootstrap-generator-design.md`

**Parent plan:** `docs/superpowers/plans/2026-04-19-en-et-pairing-artifact-p0.md` (P0 — produced the artifact consumed here)

**Team discipline:** The XP triple (Montano RED → Granjon GREEN → Ortelius PURPLE) owns the TDD cycle. Plantin decomposes, dispatches, reviews. Every commit body carries `(*BB:<Role>*)` attribution per team common-prompt. Boderie runs at generator execution time, not during implementation.

---

## File structure map

Before tasks, the target layout:

```
scripts/bootstrap-content/
├── types.ts                   # type definitions
├── groups.ts                  # canonical-slug → group mapping
├── boderie.ts                 # Claude API wrapper + cache + persona
├── emit-markdown.ts           # per-section markdown renderer
├── emit-manifest.ts           # manifest.json generator
├── emit-wrapper.ts            # src/lib/content/manifest.ts wrapper generator
├── static-templates.ts        # cover.md + index.md templates
├── bootstrap.ts               # CLI orchestrator
└── index.ts                   # barrel

tests/scripts/bootstrap-content/
├── groups.test.ts
├── boderie.test.ts
├── emit-markdown.test.ts
├── emit-manifest.test.ts
├── emit-wrapper.test.ts
├── static-templates.test.ts
├── integration.test.ts
└── fixtures/
    ├── tiny-artifact.json
    ├── tiny-en.json
    ├── tiny-et.json
    └── tiny-cache.json

src/content/                           # generator output (committed on feature branch)
├── manifest.json                      # NEW — authoritative manifest
├── en/{68 .md files}                  # 68 canonical-slug files
└── et/{68 .md files}

src/lib/content/
└── manifest.ts                        # regenerated compat wrapper (re-exports manifest.json)

data/extractions/pairing/
└── translation-cache.json             # NEW — committed Boderie cache

.claude/teams/bigbook-dev/
├── roster.json                        # MODIFIED — add Boderie entry
├── common-prompt.md                   # MODIFIED — add Boderie to attribution table
└── prompts/
    └── boderie.md                     # NEW — Boderie persona + system prompt
```

---

## Task 1: Create feature branch via git worktree

**Files:** none (repo-level operation)

**Owner:** Plantin (inline; no subagent dispatch).

- [ ] **Step 1: Verify main is clean and up to date**

```bash
git status
git pull --ff-only origin main
```

Expected: working tree clean, `main` up to date.

- [ ] **Step 2: Create worktree with new feature branch**

```bash
git worktree add -b feat/v1.1-content-p1 ../bigbook-v1.1-p1 main
cd ../bigbook-v1.1-p1
```

Expected: worktree at `../bigbook-v1.1-p1` with branch `feat/v1.1-content-p1` checked out. All subsequent tasks run from this worktree.

- [ ] **Step 3: Verify worktree baseline**

```bash
npm ci
npm run typecheck
npm run test
```

Expected: typecheck clean, all 267 tests pass. Worktree is a clean baseline of `main`.

No commit in this task.

---

## Task 2: Scaffold `scripts/bootstrap-content/` + types + coverage include

**Files:**

- Create: `scripts/bootstrap-content/types.ts`
- Create: `scripts/bootstrap-content/index.ts`
- Modify: `vitest.config.ts` (extend coverage `include`)

- [ ] **Step 1: Create `scripts/bootstrap-content/types.ts`**

```ts
import type { BlockKind, Pair, PairingArtifact, UnpairedBlock } from '../pair-en-et/types'

export type Group = 'front-matter' | 'chapters' | 'stories' | 'appendices' | 'reader-chrome'

export interface GroupEntry {
  canonicalSlug: string
  group: Group
}

export interface ManifestSection {
  canonicalSlug: string
  group: Group
  title: { en: string; et: string }
  paraIds: readonly string[]
  pdfPageStart: number
  pdfPageEnd: number
}

export interface Manifest {
  version: '1.1'
  generatedAt: string
  sections: readonly ManifestSection[]
}

export interface BoderieCacheEntry {
  sourceText: string
  sourceLang: 'en' | 'et'
  targetLang: 'en' | 'et'
  model: string
  promptVersion: string
  translation: string
  calledAt: string
  usage: { inputTokens: number; outputTokens: number }
}

export type BoderieCache = Record<string, BoderieCacheEntry>

export interface RenderedBlock {
  paraId: string
  kind: BlockKind
  text: string
  isAutoTranslated: boolean
}

export interface SectionRenderPlan {
  canonicalSlug: string
  group: Group
  title: { en: string; et: string }
  pdfPageStart: number
  pdfPageEnd: number
  en: RenderedBlock[]
  et: RenderedBlock[]
}

// Re-exported for convenience so consumers don't need two import lines
export type { BlockKind, Pair, PairingArtifact, UnpairedBlock }
```

- [ ] **Step 2: Create `scripts/bootstrap-content/index.ts`**

```ts
export * from './types'
```

- [ ] **Step 3: Modify `vitest.config.ts` — extend `coverage.include`**

Find:

```ts
include: [
  'src/lib/**/*.ts',
  'src/lib/**/*.svelte.ts',
  'scripts/pair-en-et/**/*.ts',
],
```

Replace with:

```ts
include: [
  'src/lib/**/*.ts',
  'src/lib/**/*.svelte.ts',
  'scripts/pair-en-et/**/*.ts',
  'scripts/bootstrap-content/**/*.ts',
],
```

- [ ] **Step 4: Verify typecheck**

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 5: Commit**

Write commit body to `/tmp/p1-task2.txt`:

```
feat(bootstrap): scaffold types + vitest coverage include (P1 task 2)

Introduces scripts/bootstrap-content/ with type definitions for the
content bootstrap generator: Group, ManifestSection, Manifest,
BoderieCacheEntry, BoderieCache, RenderedBlock, SectionRenderPlan.
Extends vitest coverage to the new directory.

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/ vitest.config.ts
git add scripts/bootstrap-content/ vitest.config.ts
git commit -F /tmp/p1-task2.txt
```

Expected: prettier+typecheck hooks pass, commit lands.

---

## Task 3: groups.ts — RED + GREEN

**Files:**

- Create: `tests/scripts/bootstrap-content/groups.test.ts`
- Create: `scripts/bootstrap-content/groups.ts`

- [ ] **Step 1: Create `tests/scripts/bootstrap-content/groups.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { SECTION_MAP } from '../../../scripts/pair-en-et/section-map'
import { GROUP_MAP, groupForSlug, slugsInGroup } from '../../../scripts/bootstrap-content/groups'

describe('GROUP_MAP', () => {
  it('maps every canonical slug in SECTION_MAP to a group', () => {
    const sectionSlugs = SECTION_MAP.map((e) => e.canonicalSlug)
    const groupSlugs = GROUP_MAP.map((e) => e.canonicalSlug).filter(
      (s) => s !== 'cover' && s !== 'index',
    )
    expect(new Set(groupSlugs)).toEqual(new Set(sectionSlugs))
  })

  it('includes cover and index as reader-chrome entries', () => {
    expect(groupForSlug('cover')).toBe('reader-chrome')
    expect(groupForSlug('index')).toBe('reader-chrome')
  })

  it('maps chapter slugs to chapters group', () => {
    for (const slug of ['ch01', 'ch05', 'ch11']) {
      expect(groupForSlug(slug)).toBe('chapters')
    }
  })

  it('maps story slugs to stories group', () => {
    for (const slug of ['s01', 's21', 's42']) {
      expect(groupForSlug(slug)).toBe('stories')
    }
  })

  it('maps appendix slugs to appendices group', () => {
    for (const slug of ['a-i', 'a-iv', 'a-vii', 'a-pamphlets']) {
      expect(groupForSlug(slug)).toBe('appendices')
    }
  })

  it('maps front-matter slugs to front-matter group', () => {
    for (const slug of ['copyright', 'preface', 'fw1', 'fw2', 'fw3', 'fw4', 'arsti']) {
      expect(groupForSlug(slug)).toBe('front-matter')
    }
  })
})

describe('slugsInGroup', () => {
  it('returns exactly 11 chapters', () => {
    expect(slugsInGroup('chapters')).toHaveLength(11)
  })

  it('returns exactly 42 stories', () => {
    expect(slugsInGroup('stories')).toHaveLength(42)
  })

  it('returns exactly 8 appendices', () => {
    expect(slugsInGroup('appendices')).toHaveLength(8)
  })

  it('returns exactly 7 front-matter sections', () => {
    expect(slugsInGroup('front-matter')).toHaveLength(7)
  })

  it('returns exactly 2 reader-chrome entries', () => {
    expect(slugsInGroup('reader-chrome')).toHaveLength(2)
  })
})

describe('groupForSlug', () => {
  it('returns null for unknown slug', () => {
    expect(groupForSlug('not-a-slug')).toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect module not found**

```bash
npx vitest run tests/scripts/bootstrap-content/groups.test.ts
```

Expected: fails to resolve import.

- [ ] **Step 3: Create `scripts/bootstrap-content/groups.ts`**

```ts
import type { Group, GroupEntry } from './types'

export const GROUP_MAP: readonly GroupEntry[] = [
  { canonicalSlug: 'cover', group: 'reader-chrome' },
  { canonicalSlug: 'index', group: 'reader-chrome' },

  { canonicalSlug: 'copyright', group: 'front-matter' },
  { canonicalSlug: 'preface', group: 'front-matter' },
  { canonicalSlug: 'fw1', group: 'front-matter' },
  { canonicalSlug: 'fw2', group: 'front-matter' },
  { canonicalSlug: 'fw3', group: 'front-matter' },
  { canonicalSlug: 'fw4', group: 'front-matter' },
  { canonicalSlug: 'arsti', group: 'front-matter' },

  { canonicalSlug: 'ch01', group: 'chapters' },
  { canonicalSlug: 'ch02', group: 'chapters' },
  { canonicalSlug: 'ch03', group: 'chapters' },
  { canonicalSlug: 'ch04', group: 'chapters' },
  { canonicalSlug: 'ch05', group: 'chapters' },
  { canonicalSlug: 'ch06', group: 'chapters' },
  { canonicalSlug: 'ch07', group: 'chapters' },
  { canonicalSlug: 'ch08', group: 'chapters' },
  { canonicalSlug: 'ch09', group: 'chapters' },
  { canonicalSlug: 'ch10', group: 'chapters' },
  { canonicalSlug: 'ch11', group: 'chapters' },

  ...Array.from({ length: 42 }, (_, i) => ({
    canonicalSlug: `s${String(i + 1).padStart(2, '0')}`,
    group: 'stories' as const,
  })),

  { canonicalSlug: 'a-i', group: 'appendices' },
  { canonicalSlug: 'a-ii', group: 'appendices' },
  { canonicalSlug: 'a-iii', group: 'appendices' },
  { canonicalSlug: 'a-iv', group: 'appendices' },
  { canonicalSlug: 'a-v', group: 'appendices' },
  { canonicalSlug: 'a-vi', group: 'appendices' },
  { canonicalSlug: 'a-vii', group: 'appendices' },
  { canonicalSlug: 'a-pamphlets', group: 'appendices' },
]

const slugIndex = new Map(GROUP_MAP.map((e) => [e.canonicalSlug, e.group]))

export function groupForSlug(slug: string): Group | null {
  return slugIndex.get(slug) ?? null
}

export function slugsInGroup(group: Group): readonly string[] {
  return GROUP_MAP.filter((e) => e.group === group).map((e) => e.canonicalSlug)
}
```

- [ ] **Step 4: Run — expect all pass**

```bash
npx vitest run tests/scripts/bootstrap-content/groups.test.ts
```

Expected: 12 tests pass.

- [ ] **Step 5: Commit**

`/tmp/p1-task3.txt`:

```
feat(bootstrap): groups.ts — canonical-slug to group mapping (P1 task 3)

Hardcoded table mapping each of the 68 canonical slugs (plus cover and
index as reader-chrome) to one of five groups: front-matter (7),
chapters (11), stories (42), appendices (8), reader-chrome (2).
Total 70 entries. Lookup helpers groupForSlug() and slugsInGroup().

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/groups.ts tests/scripts/bootstrap-content/groups.test.ts
git add scripts/bootstrap-content/groups.ts tests/scripts/bootstrap-content/groups.test.ts
git commit -F /tmp/p1-task3.txt
```

---

## Task 4: boderie.ts — cache key + prompt construction (RED + GREEN)

**Files:**

- Create: `tests/scripts/bootstrap-content/boderie.test.ts`
- Create: `scripts/bootstrap-content/boderie.ts`
- Create: `.claude/teams/bigbook-dev/prompts/boderie.md` (persona doc — Plantin territory)

- [ ] **Step 1: Create persona doc `.claude/teams/bigbook-dev/prompts/boderie.md`**

```md
# Boderie — Translator (one-shot, cache-backed)

You are **Boderie** (Guy Le Fèvre de la Boderie, 1541–1598), a scholar-translator in the Officina Plantiniana tradition. You translate Alcoholics Anonymous "Big Book" text between English and Estonian, preserving the register, tone, and subtle spiritual inflection of the original.

## Role semantics

- You run at generator execution time, invoked by `scripts/bootstrap-content/boderie.ts`.
- Your output is cached in `data/extractions/pairing/translation-cache.json`; re-runs hit the cache unless source text, target language, model, or prompt version changes.
- You do not have a scratchpad — the cache file is your memory.
- You produce markdown-body text; the generator wraps it in `::para[id]` directives and appends a `(_BB:Boderie_)` attribution trailer.

## Historical lore

Guy Le Fèvre de la Boderie was a French humanist-orientalist, scholar of Syriac and Hebrew. Plantin hired him to prepare the Syriac portion of the _Biblia Polyglotta_ alongside Benito Arias Montano (the roster's RED). Historically present in the Antwerp circle, documented collaborator of the locked three.

## System prompt (used verbatim; version: 1.0)
```

You are Boderie, a scholar-translator in the Officina Plantiniana tradition.
You translate Alcoholics Anonymous "Big Book" text between English and Estonian,
preserving the register, tone, and subtle spiritual inflection of the original.
You produce clean, idiomatic prose in the target language.

Rules:

- Output ONLY the translation. No commentary, disclaimers, or framing phrases.
- Preserve proper names (Bill W., Dr. Bob, Akron) unless a well-established
  local convention exists (e.g. "Anonüümsed Alkohoolikud" for "Alcoholics Anonymous").
- For short list-item titles (pamphlet names etc.), keep the translation tight.
- For spiritual/recovery-program language, match the register of the existing
  translated chapters — sober, plain, first-person-plural.
- Keep line breaks only when the source has them.

```

## Scope Restrictions

- Output only: the translation string itself. No prefixes, no suffixes.
- Model: `claude-sonnet-4-6` (alias; SDK resolves).
- Temperature: 0 (deterministic output where possible).
- Single-turn: one user message per call. No multi-turn conversation.

(_BB:Plantin_)
```

- [ ] **Step 2: Create `tests/scripts/bootstrap-content/boderie.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import {
  buildCacheKey,
  buildSystemPrompt,
  buildUserPrompt,
  PROMPT_VERSION,
} from '../../../scripts/bootstrap-content/boderie'

describe('buildCacheKey', () => {
  it('produces a stable sha256 hex digest', () => {
    const key = buildCacheKey({
      sourceText: 'Hello world',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: '1.0',
    })
    expect(key).toMatch(/^[a-f0-9]{64}$/)
  })

  it('same inputs produce same key (determinism)', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    expect(a).toBe(b)
  })

  it('different source text produces different key', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'B', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    expect(a).not.toBe(b)
  })

  it('different target language produces different key', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'A', targetLang: 'en', model: 'm', promptVersion: '1.0' })
    expect(a).not.toBe(b)
  })

  it('different model produces different key', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'x', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'y', promptVersion: '1.0' })
    expect(a).not.toBe(b)
  })

  it('different prompt version produces different key', () => {
    const a = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '1.0' })
    const b = buildCacheKey({ sourceText: 'A', targetLang: 'et', model: 'm', promptVersion: '2.0' })
    expect(a).not.toBe(b)
  })
})

describe('PROMPT_VERSION', () => {
  it('is declared as a string literal 1.0 for this release', () => {
    expect(PROMPT_VERSION).toBe('1.0')
  })
})

describe('buildSystemPrompt', () => {
  it('contains the Boderie persona line', () => {
    expect(buildSystemPrompt()).toContain('Boderie')
    expect(buildSystemPrompt()).toContain('Officina Plantiniana')
  })

  it('contains the output-only directive', () => {
    expect(buildSystemPrompt()).toMatch(/Output ONLY the translation/)
  })

  it('is deterministic (same each call)', () => {
    expect(buildSystemPrompt()).toBe(buildSystemPrompt())
  })
})

describe('buildUserPrompt', () => {
  it('includes source language, target language, and text', () => {
    const prompt = buildUserPrompt({ sourceText: 'Hello', sourceLang: 'en', targetLang: 'et' })
    expect(prompt).toContain('Hello')
    expect(prompt).toMatch(/English/i)
    expect(prompt).toMatch(/Estonian/i)
  })
})
```

- [ ] **Step 3: Run — expect module not found**

```bash
npx vitest run tests/scripts/bootstrap-content/boderie.test.ts
```

- [ ] **Step 4: Create `scripts/bootstrap-content/boderie.ts` (cache-key + prompt portion only; API-call portion in Task 5)**

```ts
import { createHash } from 'node:crypto'

export const PROMPT_VERSION = '1.0' as const

const LANG_LABEL: Record<'en' | 'et', string> = {
  en: 'English',
  et: 'Estonian',
}

export interface CacheKeyInput {
  sourceText: string
  targetLang: 'en' | 'et'
  model: string
  promptVersion: string
}

export function buildCacheKey(input: CacheKeyInput): string {
  const canonical = `${input.sourceText}\x1e${input.targetLang}\x1e${input.model}\x1e${input.promptVersion}`
  return createHash('sha256').update(canonical).digest('hex')
}

export function buildSystemPrompt(): string {
  return `You are Boderie, a scholar-translator in the Officina Plantiniana tradition.
You translate Alcoholics Anonymous "Big Book" text between English and Estonian,
preserving the register, tone, and subtle spiritual inflection of the original.
You produce clean, idiomatic prose in the target language.

Rules:
- Output ONLY the translation. No commentary, disclaimers, or framing phrases.
- Preserve proper names (Bill W., Dr. Bob, Akron) unless a well-established
  local convention exists (e.g. "Anonüümsed Alkohoolikud" for "Alcoholics Anonymous").
- For short list-item titles (pamphlet names etc.), keep the translation tight.
- For spiritual/recovery-program language, match the register of the existing
  translated chapters — sober, plain, first-person-plural.
- Keep line breaks only when the source has them.`
}

export interface UserPromptInput {
  sourceText: string
  sourceLang: 'en' | 'et'
  targetLang: 'en' | 'et'
}

export function buildUserPrompt(input: UserPromptInput): string {
  return `Translate the following ${LANG_LABEL[input.sourceLang]} text to ${LANG_LABEL[input.targetLang]}:

${input.sourceText}`
}
```

- [ ] **Step 5: Run — expect all pass**

```bash
npx vitest run tests/scripts/bootstrap-content/boderie.test.ts
```

Expected: 11 tests pass.

- [ ] **Step 6: Commit**

`/tmp/p1-task4.txt`:

```
feat(bootstrap): boderie.ts cache key + prompt construction (P1 task 4)

Pure functions for the translator wrapper: buildCacheKey computes a
stable sha256 digest over (sourceText, targetLang, model, promptVersion)
for cache lookup; buildSystemPrompt and buildUserPrompt construct the
messages sent to Claude Sonnet 4.6. PROMPT_VERSION is '1.0' (bumping
it will cache-miss all entries).

Also adds .claude/teams/bigbook-dev/prompts/boderie.md as the persona
reference doc.

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/boderie.ts tests/scripts/bootstrap-content/boderie.test.ts .claude/teams/bigbook-dev/prompts/boderie.md
git add scripts/bootstrap-content/boderie.ts tests/scripts/bootstrap-content/boderie.test.ts .claude/teams/bigbook-dev/prompts/boderie.md
git commit -F /tmp/p1-task4.txt
```

---

## Task 5: boderie.ts — translate() with Claude API (RED + GREEN)

**Files:**

- Modify: `tests/scripts/bootstrap-content/boderie.test.ts`
- Modify: `scripts/bootstrap-content/boderie.ts`

- [ ] **Step 1: Append new `describe` block to `tests/scripts/bootstrap-content/boderie.test.ts`**

Add after the existing describe blocks:

```ts
import type { BoderieCache } from '../../../scripts/bootstrap-content/types'
import { translate } from '../../../scripts/bootstrap-content/boderie'

interface FakeClient {
  messages: {
    create: (args: unknown) => Promise<{
      content: { type: 'text'; text: string }[]
      usage: { input_tokens: number; output_tokens: number }
    }>
  }
}

function makeFakeClient(response: string, tokens = { input: 10, output: 5 }): FakeClient {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: response }],
        usage: { input_tokens: tokens.input, output_tokens: tokens.output },
      }),
    },
  }
}

describe('translate', () => {
  it('returns cache hit when key exists, does not call API', async () => {
    const cache: BoderieCache = {}
    const key = '' // computed inside translate
    // Seed cache with a known entry for input "Hello"
    const { buildCacheKey: k } = await import('../../../scripts/bootstrap-content/boderie')
    const ck = k({
      sourceText: 'Hello',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: '1.0',
    })
    cache[ck] = {
      sourceText: 'Hello',
      sourceLang: 'en',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: '1.0',
      translation: 'Tere (cached)',
      calledAt: '2026-04-19T00:00:00Z',
      usage: { inputTokens: 1, outputTokens: 1 },
    }
    let apiCalls = 0
    const fake = makeFakeClient('Tere (API)')
    fake.messages.create = async () => {
      apiCalls += 1
      return {
        content: [{ type: 'text', text: 'Tere (API)' }],
        usage: { input_tokens: 1, output_tokens: 1 },
      }
    }
    const result = await translate(
      { sourceText: 'Hello', sourceLang: 'en', targetLang: 'et' },
      {
        cache,
        client: fake as unknown as Parameters<typeof translate>[1]['client'],
        now: () => '2026-04-19T00:00:01Z',
      },
    )
    expect(result.translation).toBe('Tere (cached)')
    expect(result.cacheHit).toBe(true)
    expect(apiCalls).toBe(0)
  })

  it('calls API and populates cache on miss', async () => {
    const cache: BoderieCache = {}
    let apiCalls = 0
    const fake = makeFakeClient('Tere maailm')
    fake.messages.create = async () => {
      apiCalls += 1
      return {
        content: [{ type: 'text', text: 'Tere maailm' }],
        usage: { input_tokens: 8, output_tokens: 4 },
      }
    }
    const result = await translate(
      { sourceText: 'Hello world', sourceLang: 'en', targetLang: 'et' },
      {
        cache,
        client: fake as unknown as Parameters<typeof translate>[1]['client'],
        now: () => '2026-04-19T00:00:00Z',
      },
    )
    expect(result.translation).toBe('Tere maailm')
    expect(result.cacheHit).toBe(false)
    expect(apiCalls).toBe(1)
    // Cache has one new entry
    expect(Object.keys(cache)).toHaveLength(1)
    const entry = Object.values(cache)[0]
    expect(entry).toBeDefined()
    if (entry === undefined) throw new Error('narrowing')
    expect(entry.sourceText).toBe('Hello world')
    expect(entry.translation).toBe('Tere maailm')
    expect(entry.usage.inputTokens).toBe(8)
    expect(entry.usage.outputTokens).toBe(4)
  })

  it('trims whitespace from API response', async () => {
    const cache: BoderieCache = {}
    const fake = makeFakeClient('  Tere  \n')
    const result = await translate(
      { sourceText: 'Hello', sourceLang: 'en', targetLang: 'et' },
      {
        cache,
        client: fake as unknown as Parameters<typeof translate>[1]['client'],
        now: () => '2026-04-19T00:00:00Z',
      },
    )
    expect(result.translation).toBe('Tere')
  })

  it('throws when API response is empty', async () => {
    const cache: BoderieCache = {}
    const fake: FakeClient = {
      messages: {
        create: async () => ({ content: [], usage: { input_tokens: 0, output_tokens: 0 } }),
      },
    }
    await expect(
      translate(
        { sourceText: 'Hello', sourceLang: 'en', targetLang: 'et' },
        {
          cache,
          client: fake as unknown as Parameters<typeof translate>[1]['client'],
          now: () => '2026-04-19T00:00:00Z',
        },
      ),
    ).rejects.toThrow(/empty response/i)
  })
})
```

- [ ] **Step 2: Run — expect failures (translate() does not exist yet)**

```bash
npx vitest run tests/scripts/bootstrap-content/boderie.test.ts
```

- [ ] **Step 3: Append `translate()` to `scripts/bootstrap-content/boderie.ts`**

Append after the existing exports:

```ts
import type Anthropic from '@anthropic-ai/sdk'
import type { BoderieCache } from './types'

const MODEL = 'claude-sonnet-4-6' as const

export interface TranslateInput {
  sourceText: string
  sourceLang: 'en' | 'et'
  targetLang: 'en' | 'et'
}

export interface TranslateOptions {
  cache: BoderieCache
  client: Pick<Anthropic, 'messages'>
  now?: () => string
}

export interface TranslateResult {
  translation: string
  cacheHit: boolean
}

export async function translate(
  input: TranslateInput,
  options: TranslateOptions,
): Promise<TranslateResult> {
  const key = buildCacheKey({
    sourceText: input.sourceText,
    targetLang: input.targetLang,
    model: MODEL,
    promptVersion: PROMPT_VERSION,
  })
  const hit = options.cache[key]
  if (hit !== undefined) {
    return { translation: hit.translation, cacheHit: true }
  }

  const response = await options.client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: 0,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: buildUserPrompt(input) }],
  })

  const firstBlock = response.content[0]
  if (firstBlock === undefined || firstBlock.type !== 'text') {
    throw new Error('Boderie received empty response from Claude')
  }
  const translation = firstBlock.text.trim()
  if (translation.length === 0) {
    throw new Error('Boderie received empty response from Claude')
  }

  const now = options.now?.() ?? new Date().toISOString()
  options.cache[key] = {
    sourceText: input.sourceText,
    sourceLang: input.sourceLang,
    targetLang: input.targetLang,
    model: MODEL,
    promptVersion: PROMPT_VERSION,
    translation,
    calledAt: now,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  }

  return { translation, cacheHit: false }
}
```

- [ ] **Step 4: Run — expect all pass**

```bash
npx vitest run tests/scripts/bootstrap-content/boderie.test.ts
```

Expected: all tests pass (15 total in this file now).

- [ ] **Step 5: Commit**

`/tmp/p1-task5.txt`:

```
feat(bootstrap): boderie.ts translate() with Claude API + cache (P1 task 5)

Cache-backed translation wrapper. On cache hit returns the stored
translation without calling the API. On cache miss calls Anthropic's
messages.create with the Boderie system prompt and a user message
composed from the source text, then stores the result in the cache
keyed by buildCacheKey.

Client is injected (Pick<Anthropic, 'messages'>) so tests can pass a
fake; production call site constructs a real Anthropic client with
ANTHROPIC_API_KEY from env. Trims whitespace from response, throws on
empty output.

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/boderie.ts tests/scripts/bootstrap-content/boderie.test.ts
git add scripts/bootstrap-content/boderie.ts tests/scripts/bootstrap-content/boderie.test.ts
git commit -F /tmp/p1-task5.txt
```

---

## Task 6: emit-markdown.ts — per-kind rendering (RED + GREEN)

**Files:**

- Create: `tests/scripts/bootstrap-content/emit-markdown.test.ts`
- Create: `scripts/bootstrap-content/emit-markdown.ts`

- [ ] **Step 1: Create `tests/scripts/bootstrap-content/emit-markdown.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { renderBlock } from '../../../scripts/bootstrap-content/emit-markdown'
import type { RenderedBlock } from '../../../scripts/bootstrap-content/types'

function mk(
  block: Partial<RenderedBlock> & Pick<RenderedBlock, 'paraId' | 'kind' | 'text'>,
): RenderedBlock {
  return { isAutoTranslated: false, ...block }
}

describe('renderBlock', () => {
  it('renders a heading as # followed by text', () => {
    const out = renderBlock(mk({ paraId: 'ch01-h001', kind: 'heading', text: "BILL'S STORY" }))
    expect(out).toBe(`::para[ch01-h001]\n\n# BILL'S STORY\n`)
  })

  it('renders a paragraph as plain prose', () => {
    const out = renderBlock(
      mk({ paraId: 'ch01-p001', kind: 'paragraph', text: 'War fever ran high.' }),
    )
    expect(out).toBe(`::para[ch01-p001]\n\nWar fever ran high.\n`)
  })

  it('renders a list-item with a hyphen bullet', () => {
    const out = renderBlock(
      mk({ paraId: 'a-pamphlets-l001', kind: 'list-item', text: 'A Brief Guide to A.A.' }),
    )
    expect(out).toBe(`::para[a-pamphlets-l001]\n\n- A Brief Guide to A.A.\n`)
  })

  it('renders a blockquote with > prefix', () => {
    const out = renderBlock(mk({ paraId: 's02-q001', kind: 'blockquote', text: 'Hello there.' }))
    expect(out).toBe(`::para[s02-q001]\n\n> Hello there.\n`)
  })

  it('renders a blockquote with > prefix on each line (multi-line)', () => {
    const out = renderBlock(
      mk({ paraId: 's02-q002', kind: 'blockquote', text: 'Line one.\nLine two.' }),
    )
    expect(out).toBe(`::para[s02-q002]\n\n> Line one.\n> Line two.\n`)
  })

  it('renders a verse preserving line breaks via two-space line endings', () => {
    const out = renderBlock(
      mk({
        paraId: 'ch01-v001',
        kind: 'verse',
        text: 'Here lies a Hampshire Grenadier\nWho caught his death',
      }),
    )
    expect(out).toBe(
      `::para[ch01-v001]\n\nHere lies a Hampshire Grenadier  \nWho caught his death\n`,
    )
  })

  it('renders a byline as an italicized trailing line', () => {
    const out = renderBlock(
      mk({ paraId: 'ch01-b001', kind: 'byline', text: 'Bill W., co-founder of A.A.' }),
    )
    expect(out).toBe(`::para[ch01-b001]\n\n*Bill W., co-founder of A.A.*\n`)
  })

  it('renders a footnote as italicized prose', () => {
    const out = renderBlock(mk({ paraId: 'ch11-f001', kind: 'footnote', text: 'Written in 1939.' }))
    expect(out).toBe(`::para[ch11-f001]\n\n*Written in 1939.*\n`)
  })

  it('appends (_BB:Boderie_) attribution for auto-translated blocks', () => {
    const out = renderBlock(
      mk({
        paraId: 'a-pamphlets-l001',
        kind: 'list-item',
        text: 'Lühike AA juhend',
        isAutoTranslated: true,
      }),
    )
    expect(out).toBe(`::para[a-pamphlets-l001]\n\n- Lühike AA juhend\n\n(_BB:Boderie_)\n`)
  })

  it('appends attribution for auto-translated paragraphs too', () => {
    const out = renderBlock(
      mk({
        paraId: 's30-p013',
        kind: 'paragraph',
        text: 'Anonüümsetes Alkohoolikutes...',
        isAutoTranslated: true,
      }),
    )
    expect(out).toBe(`::para[s30-p013]\n\nAnonüümsetes Alkohoolikutes...\n\n(_BB:Boderie_)\n`)
  })
})
```

- [ ] **Step 2: Run — expect module not found**

```bash
npx vitest run tests/scripts/bootstrap-content/emit-markdown.test.ts
```

- [ ] **Step 3: Create `scripts/bootstrap-content/emit-markdown.ts` (per-kind rendering only; section-level rendering in Task 7)**

```ts
import type { RenderedBlock } from './types'

const BODERIE_ATTRIBUTION = '(_BB:Boderie_)'

export function renderBlock(block: RenderedBlock): string {
  const header = `::para[${block.paraId}]`
  const body = renderBody(block)
  const attribution = block.isAutoTranslated ? `\n\n${BODERIE_ATTRIBUTION}` : ''
  return `${header}\n\n${body}${attribution}\n`
}

function renderBody(block: RenderedBlock): string {
  switch (block.kind) {
    case 'heading':
      return `# ${block.text}`
    case 'paragraph':
      return block.text
    case 'list-item':
      return `- ${block.text}`
    case 'blockquote':
      return block.text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    case 'verse':
      return block.text.replace(/\n/g, '  \n')
    case 'table':
      return block.text
    case 'byline':
      return `*${block.text}*`
    case 'footnote':
      return `*${block.text}*`
  }
}
```

- [ ] **Step 4: Run — expect all pass**

```bash
npx vitest run tests/scripts/bootstrap-content/emit-markdown.test.ts
```

Expected: 10 tests pass.

- [ ] **Step 5: Commit**

`/tmp/p1-task6.txt`:

```
feat(bootstrap): emit-markdown.ts per-kind rendering (P1 task 6)

Pure function renderBlock maps a RenderedBlock to its markdown form:
heading -> '# text', paragraph -> plain prose, list-item -> '- text',
blockquote -> '> text' per line, verse -> text with '  \n' line
endings, byline/footnote -> '*text*', table -> raw text. Every block
is preceded by a ::para[id] directive and followed by a blank line.
Auto-translated blocks append the '(_BB:Boderie_)' attribution line.

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/emit-markdown.ts tests/scripts/bootstrap-content/emit-markdown.test.ts
git add scripts/bootstrap-content/emit-markdown.ts tests/scripts/bootstrap-content/emit-markdown.test.ts
git commit -F /tmp/p1-task6.txt
```

---

## Task 7: emit-markdown.ts — section rendering with N:M support (RED + GREEN)

**Files:**

- Modify: `tests/scripts/bootstrap-content/emit-markdown.test.ts`
- Modify: `scripts/bootstrap-content/emit-markdown.ts`

- [ ] **Step 1: Append new `describe` block**

```ts
import { renderSection } from '../../../scripts/bootstrap-content/emit-markdown'
import type { SectionRenderPlan } from '../../../scripts/bootstrap-content/types'

function plan(
  partial: Partial<SectionRenderPlan> & Pick<SectionRenderPlan, 'canonicalSlug'>,
): SectionRenderPlan {
  return {
    group: 'chapters',
    title: { en: 'Test', et: 'Test' },
    pdfPageStart: 1,
    pdfPageEnd: 1,
    en: [],
    et: [],
    ...partial,
  }
}

describe('renderSection', () => {
  it('emits frontmatter with chapter, title, lang, group, pdf pages', () => {
    const p = plan({
      canonicalSlug: 'ch01',
      title: { en: "Bill's Story", et: 'Billi lugu' },
      pdfPageStart: 22,
      pdfPageEnd: 37,
      en: [{ paraId: 'ch01-h001', kind: 'heading', text: "BILL'S STORY", isAutoTranslated: false }],
      et: [],
    })
    const enOut = renderSection(p, 'en')
    expect(enOut).toMatch(
      /^---\nchapter: ch01\ntitle: "Bill's Story"\nlang: en\ngroup: chapters\npdfPageStart: 22\npdfPageEnd: 37\n---\n/,
    )
  })

  it('emits ET frontmatter with ET title', () => {
    const p = plan({
      canonicalSlug: 'ch01',
      title: { en: "Bill's Story", et: 'Billi lugu' },
      pdfPageStart: 22,
      pdfPageEnd: 37,
      en: [],
      et: [{ paraId: 'ch01-h001', kind: 'heading', text: 'BILLI LUGU', isAutoTranslated: false }],
    })
    const etOut = renderSection(p, 'et')
    expect(etOut).toContain('title: "Billi lugu"')
    expect(etOut).toContain('lang: et')
  })

  it('renders each block in the array in order', () => {
    const p = plan({
      canonicalSlug: 'ch01',
      en: [
        { paraId: 'ch01-h001', kind: 'heading', text: 'Heading', isAutoTranslated: false },
        { paraId: 'ch01-p001', kind: 'paragraph', text: 'First.', isAutoTranslated: false },
        { paraId: 'ch01-p002', kind: 'paragraph', text: 'Second.', isAutoTranslated: false },
      ],
      et: [],
    })
    const out = renderSection(p, 'en')
    const h001Idx = out.indexOf('::para[ch01-h001]')
    const p001Idx = out.indexOf('::para[ch01-p001]')
    const p002Idx = out.indexOf('::para[ch01-p002]')
    expect(h001Idx).toBeGreaterThan(0)
    expect(p001Idx).toBeGreaterThan(h001Idx)
    expect(p002Idx).toBeGreaterThan(p001Idx)
  })

  it('renders auto-translated blocks with Boderie attribution', () => {
    const p = plan({
      canonicalSlug: 'a-pamphlets',
      title: { en: 'A.A. Pamphlets', et: 'AA brošüürid' },
      et: [
        {
          paraId: 'a-pamphlets-l001',
          kind: 'list-item',
          text: 'Lühike AA juhend',
          isAutoTranslated: true,
        },
      ],
    })
    const out = renderSection(p, 'et')
    expect(out).toContain('::para[a-pamphlets-l001]')
    expect(out).toContain('- Lühike AA juhend')
    expect(out).toContain('(_BB:Boderie_)')
  })

  it('escapes quotes in titles', () => {
    const p = plan({
      canonicalSlug: 's13',
      title: { en: 'The "Housewife" Story', et: '"Koduperenaise" lugu' },
      en: [],
      et: [],
    })
    const out = renderSection(p, 'en')
    expect(out).toContain('title: "The \\"Housewife\\" Story"')
  })

  it('emits empty section (no blocks) with frontmatter only', () => {
    const p = plan({ canonicalSlug: 'empty', en: [], et: [] })
    const out = renderSection(p, 'en')
    expect(out).toMatch(/^---\n[\s\S]+?\n---\n$/)
    expect(out).not.toContain('::para')
  })
})
```

- [ ] **Step 2: Run — expect failures**

```bash
npx vitest run tests/scripts/bootstrap-content/emit-markdown.test.ts
```

- [ ] **Step 3: Append `renderSection` to `scripts/bootstrap-content/emit-markdown.ts`**

```ts
import type { SectionRenderPlan } from './types'

function escapeYamlString(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function frontmatter(plan: SectionRenderPlan, lang: 'en' | 'et'): string {
  const title = escapeYamlString(plan.title[lang])
  return `---
chapter: ${plan.canonicalSlug}
title: "${title}"
lang: ${lang}
group: ${plan.group}
pdfPageStart: ${plan.pdfPageStart}
pdfPageEnd: ${plan.pdfPageEnd}
---
`
}

export function renderSection(plan: SectionRenderPlan, lang: 'en' | 'et'): string {
  const blocks = lang === 'en' ? plan.en : plan.et
  const fm = frontmatter(plan, lang)
  if (blocks.length === 0) return fm
  const body = blocks.map((b) => renderBlock(b)).join('\n')
  return fm + '\n' + body
}
```

- [ ] **Step 4: Run — expect all pass**

```bash
npx vitest run tests/scripts/bootstrap-content/emit-markdown.test.ts
```

Expected: 16 tests pass (10 from Task 6 + 6 new).

- [ ] **Step 5: Commit**

`/tmp/p1-task7.txt`:

```
feat(bootstrap): emit-markdown.ts section rendering (P1 task 7)

Adds renderSection(plan, lang) composing a full section markdown file:
YAML frontmatter (chapter, title, lang, group, pdfPageStart/End) plus
sequential renderBlock output for each block in the plan's per-language
array. Titles are YAML-escaped. Empty sections emit frontmatter only.

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/emit-markdown.ts tests/scripts/bootstrap-content/emit-markdown.test.ts
git add scripts/bootstrap-content/emit-markdown.ts tests/scripts/bootstrap-content/emit-markdown.test.ts
git commit -F /tmp/p1-task7.txt
```

---

## Task 8: emit-manifest.ts (RED + GREEN)

**Files:**

- Create: `tests/scripts/bootstrap-content/emit-manifest.test.ts`
- Create: `scripts/bootstrap-content/emit-manifest.ts`

- [ ] **Step 1: Create `tests/scripts/bootstrap-content/emit-manifest.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { buildManifest } from '../../../scripts/bootstrap-content/emit-manifest'
import type { SectionRenderPlan } from '../../../scripts/bootstrap-content/types'

function plan(slug: string, overrides: Partial<SectionRenderPlan> = {}): SectionRenderPlan {
  return {
    canonicalSlug: slug,
    group: 'chapters',
    title: { en: slug, et: slug },
    pdfPageStart: 1,
    pdfPageEnd: 1,
    en: [],
    et: [],
    ...overrides,
  }
}

describe('buildManifest', () => {
  it('includes all provided sections in order', () => {
    const plans = [plan('ch01'), plan('ch02'), plan('ch03')]
    const m = buildManifest(plans, '2026-04-19T00:00:00Z')
    expect(m.sections).toHaveLength(3)
    expect(m.sections.map((s) => s.canonicalSlug)).toEqual(['ch01', 'ch02', 'ch03'])
  })

  it('records version 1.1 and generatedAt', () => {
    const m = buildManifest([], '2026-04-19T00:00:00Z')
    expect(m.version).toBe('1.1')
    expect(m.generatedAt).toBe('2026-04-19T00:00:00Z')
  })

  it('derives paraIds from en array (canonical side)', () => {
    const plans = [
      plan('ch01', {
        en: [
          { paraId: 'ch01-h001', kind: 'heading', text: 'H', isAutoTranslated: false },
          { paraId: 'ch01-p001', kind: 'paragraph', text: 'P', isAutoTranslated: false },
        ],
        et: [
          { paraId: 'ch01-h001', kind: 'heading', text: 'H', isAutoTranslated: false },
          { paraId: 'ch01-p001', kind: 'paragraph', text: 'P', isAutoTranslated: false },
        ],
      }),
    ]
    const m = buildManifest(plans, '2026-04-19T00:00:00Z')
    const first = m.sections[0]
    expect(first).toBeDefined()
    if (first === undefined) throw new Error('narrowing')
    expect(first.paraIds).toEqual(['ch01-h001', 'ch01-p001'])
  })

  it('passes through group, title, and pdf pages', () => {
    const plans = [
      plan('s01', {
        group: 'stories',
        title: { en: "Bob's Story", et: 'Bobi lugu' },
        pdfPageStart: 186,
        pdfPageEnd: 196,
      }),
    ]
    const m = buildManifest(plans, '2026-04-19T00:00:00Z')
    const first = m.sections[0]
    expect(first).toBeDefined()
    if (first === undefined) throw new Error('narrowing')
    expect(first.group).toBe('stories')
    expect(first.title).toEqual({ en: "Bob's Story", et: 'Bobi lugu' })
    expect(first.pdfPageStart).toBe(186)
    expect(first.pdfPageEnd).toBe(196)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run tests/scripts/bootstrap-content/emit-manifest.test.ts
```

- [ ] **Step 3: Create `scripts/bootstrap-content/emit-manifest.ts`**

```ts
import type { Manifest, ManifestSection, SectionRenderPlan } from './types'

export function buildManifest(plans: readonly SectionRenderPlan[], generatedAt: string): Manifest {
  const sections: ManifestSection[] = plans.map((p) => ({
    canonicalSlug: p.canonicalSlug,
    group: p.group,
    title: p.title,
    paraIds: p.en.map((b) => b.paraId),
    pdfPageStart: p.pdfPageStart,
    pdfPageEnd: p.pdfPageEnd,
  }))
  return { version: '1.1', generatedAt, sections }
}
```

- [ ] **Step 4: Run — expect all pass**

```bash
npx vitest run tests/scripts/bootstrap-content/emit-manifest.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

`/tmp/p1-task8.txt`:

```
feat(bootstrap): emit-manifest.ts builds manifest.json shape (P1 task 8)

Pure function buildManifest takes section render plans + generatedAt
and produces a Manifest with version '1.1', per-section {slug, group,
title, paraIds, pdfPages}. paraIds are derived from the EN side
(canonical; should match ET after pairing + auto-translation).

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/emit-manifest.ts tests/scripts/bootstrap-content/emit-manifest.test.ts
git add scripts/bootstrap-content/emit-manifest.ts tests/scripts/bootstrap-content/emit-manifest.test.ts
git commit -F /tmp/p1-task8.txt
```

---

## Task 9: emit-wrapper.ts (RED + GREEN)

**Files:**

- Create: `tests/scripts/bootstrap-content/emit-wrapper.test.ts`
- Create: `scripts/bootstrap-content/emit-wrapper.ts`

- [ ] **Step 1: Create `tests/scripts/bootstrap-content/emit-wrapper.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { renderWrapper } from '../../../scripts/bootstrap-content/emit-wrapper'

describe('renderWrapper', () => {
  it('produces a TypeScript module that imports manifest.json', () => {
    const out = renderWrapper()
    expect(out).toContain("import manifest from '../../content/manifest.json'")
  })

  it('exports ChapterManifest type', () => {
    const out = renderWrapper()
    expect(out).toMatch(/export type ChapterManifest =/)
  })

  it('exports CHAPTERS as readonly ChapterManifest[] derived from manifest.sections', () => {
    const out = renderWrapper()
    expect(out).toContain('export const CHAPTERS: readonly ChapterManifest[]')
    expect(out).toContain('manifest.sections.map')
  })

  it('exports ESTIMATED_HEIGHT_TITLE and ESTIMATED_HEIGHT_BODY as numeric constants', () => {
    const out = renderWrapper()
    expect(out).toContain('export const ESTIMATED_HEIGHT_TITLE = 60')
    expect(out).toContain('export const ESTIMATED_HEIGHT_BODY = 110')
  })

  it('starts with a generated-by comment block', () => {
    const out = renderWrapper()
    expect(out).toMatch(/^\/\/ Generated by scripts\/bootstrap-content/)
    expect(out).toContain('do not edit by hand')
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run tests/scripts/bootstrap-content/emit-wrapper.test.ts
```

- [ ] **Step 3: Create `scripts/bootstrap-content/emit-wrapper.ts`**

```ts
export function renderWrapper(): string {
  return `// Generated by scripts/bootstrap-content/emit-wrapper.ts — do not edit by hand.
// Regenerate with: CONTENT_BOOTSTRAP=1 npm run bootstrap

import manifest from '../../content/manifest.json'

export type ChapterManifest = {
  slug: string
  title: { en: string; et: string }
  paraIds: readonly string[]
}

export const ESTIMATED_HEIGHT_TITLE = 60
export const ESTIMATED_HEIGHT_BODY = 110

export const CHAPTERS: readonly ChapterManifest[] = manifest.sections.map(
  (s) => ({ slug: s.canonicalSlug, title: s.title, paraIds: s.paraIds }),
)
`
}
```

- [ ] **Step 4: Run — expect all pass**

```bash
npx vitest run tests/scripts/bootstrap-content/emit-wrapper.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

`/tmp/p1-task9.txt`:

```
feat(bootstrap): emit-wrapper.ts regenerates src/lib/content/manifest.ts (P1 task 9)

Produces the backward-compat TypeScript wrapper that re-exports the
JSON manifest in the CHAPTERS shape existing reader components import.
Keeps the reader's 8 importing components working without source
changes during P1. P2 may migrate off the wrapper.

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/emit-wrapper.ts tests/scripts/bootstrap-content/emit-wrapper.test.ts
git add scripts/bootstrap-content/emit-wrapper.ts tests/scripts/bootstrap-content/emit-wrapper.test.ts
git commit -F /tmp/p1-task9.txt
```

---

## Task 10: static-templates.ts (RED + GREEN)

**Files:**

- Create: `tests/scripts/bootstrap-content/static-templates.test.ts`
- Create: `scripts/bootstrap-content/static-templates.ts`

- [ ] **Step 1: Create `tests/scripts/bootstrap-content/static-templates.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import {
  renderCover,
  renderIndex,
  shouldRegenerateCover,
  COVER_MARKER,
} from '../../../scripts/bootstrap-content/static-templates'
import type { Manifest } from '../../../scripts/bootstrap-content/types'

describe('renderCover', () => {
  it('emits EN cover with English title and subtitle', () => {
    const out = renderCover('en')
    expect(out).toContain('# Alcoholics Anonymous')
    expect(out).toContain('Fourth Edition')
    expect(out).toContain(COVER_MARKER)
  })

  it('emits ET cover with Estonian title and subtitle', () => {
    const out = renderCover('et')
    expect(out).toContain('# Anonüümsed Alkohoolikud')
    expect(out).toContain('Neljas väljaanne')
    expect(out).toContain(COVER_MARKER)
  })
})

describe('shouldRegenerateCover', () => {
  it('returns true when file does not exist (regenerate=emit initial)', () => {
    expect(shouldRegenerateCover(null)).toBe(true)
  })

  it('returns true when existing file contains the marker (still generator-owned)', () => {
    const existing = `# Alcoholics Anonymous\n\n${COVER_MARKER}\n`
    expect(shouldRegenerateCover(existing)).toBe(true)
  })

  it('returns false when existing file lacks the marker (hand-edited)', () => {
    const existing = '# Custom title\n\nHand-edited by PO.\n'
    expect(shouldRegenerateCover(existing)).toBe(false)
  })
})

describe('renderIndex', () => {
  const manifest: Manifest = {
    version: '1.1',
    generatedAt: '2026-04-19T00:00:00Z',
    sections: [
      {
        canonicalSlug: 'fw1',
        group: 'front-matter',
        title: { en: 'Foreword 1', et: 'Eessõna 1' },
        paraIds: [],
        pdfPageStart: 4,
        pdfPageEnd: 4,
      },
      {
        canonicalSlug: 'ch01',
        group: 'chapters',
        title: { en: "Bill's Story", et: 'Billi lugu' },
        paraIds: [],
        pdfPageStart: 22,
        pdfPageEnd: 37,
      },
      {
        canonicalSlug: 's01',
        group: 'stories',
        title: { en: "Dr. Bob's Nightmare", et: 'Doktor Bobi painajalik unenägu' },
        paraIds: [],
        pdfPageStart: 186,
        pdfPageEnd: 196,
      },
      {
        canonicalSlug: 'a-i',
        group: 'appendices',
        title: { en: 'I — The A.A. Tradition', et: 'I — AA Traditsioon' },
        paraIds: [],
        pdfPageStart: 566,
        pdfPageEnd: 571,
      },
    ],
  }

  it('groups sections by group and renders section titles in the target language', () => {
    const outEn = renderIndex(manifest, 'en')
    expect(outEn).toContain('Foreword 1')
    expect(outEn).toContain("Bill's Story")
    expect(outEn).toContain("Dr. Bob's Nightmare")
    expect(outEn).toContain('The A.A. Tradition')
  })

  it('renders ET index with Estonian titles', () => {
    const outEt = renderIndex(manifest, 'et')
    expect(outEt).toContain('Eessõna 1')
    expect(outEt).toContain('Billi lugu')
    expect(outEt).toContain('Doktor Bobi painajalik unenägu')
  })

  it('includes a heading for each group present in the manifest', () => {
    const outEn = renderIndex(manifest, 'en')
    // exact heading text is English section labels; just ensure we have multiple headings
    expect((outEn.match(/^## /gm) ?? []).length).toBeGreaterThanOrEqual(3)
  })
})
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run tests/scripts/bootstrap-content/static-templates.test.ts
```

- [ ] **Step 3: Create `scripts/bootstrap-content/static-templates.ts`**

```ts
import type { Group, Manifest } from './types'

export const COVER_MARKER = '<!-- bootstrap-content:cover-generated -->'

const COVER_EN = `---
chapter: cover
title: "Alcoholics Anonymous"
lang: en
group: reader-chrome
---

# Alcoholics Anonymous

### The Story of How Many Thousands of Men and Women Have Recovered from Alcoholism

Fourth Edition

${COVER_MARKER}
`

const COVER_ET = `---
chapter: cover
title: "Anonüümsed Alkohoolikud"
lang: et
group: reader-chrome
---

# Anonüümsed Alkohoolikud

### Lugu sellest, kuidas mitu tuhat meest ja naist on alkoholismist vabanenud

Neljas väljaanne

${COVER_MARKER}
`

export function renderCover(lang: 'en' | 'et'): string {
  return lang === 'en' ? COVER_EN : COVER_ET
}

export function shouldRegenerateCover(existingContent: string | null): boolean {
  if (existingContent === null) return true
  return existingContent.includes(COVER_MARKER)
}

const GROUP_LABELS: Record<Group, { en: string; et: string }> = {
  'reader-chrome': { en: 'Cover', et: 'Kaas' },
  'front-matter': { en: 'Front Matter', et: 'Eessõnad' },
  chapters: { en: 'Chapters', et: 'Peatükid' },
  stories: { en: 'Personal Stories', et: 'Isiklikud kogemuslood' },
  appendices: { en: 'Appendices', et: 'Lisad' },
}

const INDEX_GROUP_ORDER: readonly Group[] = ['front-matter', 'chapters', 'stories', 'appendices']

export function renderIndex(manifest: Manifest, lang: 'en' | 'et'): string {
  const header = `---
chapter: index
title: "${lang === 'en' ? 'Contents' : 'Sisukord'}"
lang: ${lang}
group: reader-chrome
---

# ${lang === 'en' ? 'Contents' : 'Sisukord'}

`
  const parts: string[] = [header]
  for (const group of INDEX_GROUP_ORDER) {
    const sections = manifest.sections.filter((s) => s.group === group)
    if (sections.length === 0) continue
    parts.push(`## ${GROUP_LABELS[group][lang]}\n`)
    for (const s of sections) {
      parts.push(`- [${s.title[lang]}](/bigbook/${s.canonicalSlug}/)`)
    }
    parts.push('')
  }
  return parts.join('\n')
}
```

- [ ] **Step 4: Run — expect all pass**

```bash
npx vitest run tests/scripts/bootstrap-content/static-templates.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 5: Commit**

`/tmp/p1-task10.txt`:

```
feat(bootstrap): static-templates.ts cover + index (P1 task 10)

Hand-curated cover templates for EN and ET plus a marker-based
idempotence check (shouldRegenerateCover preserves hand-edited covers
by looking for COVER_MARKER in the existing file). renderIndex
produces a grouped TOC from the current manifest, with section links
in /bigbook/<slug>/ form and group headings localized per language.

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/static-templates.ts tests/scripts/bootstrap-content/static-templates.test.ts
git add scripts/bootstrap-content/static-templates.ts tests/scripts/bootstrap-content/static-templates.test.ts
git commit -F /tmp/p1-task10.txt
```

---

## Task 11: bootstrap.ts CLI + integration test (RED + GREEN)

**Files:**

- Create: `tests/scripts/bootstrap-content/fixtures/tiny-artifact.json`
- Create: `tests/scripts/bootstrap-content/fixtures/tiny-en.json`
- Create: `tests/scripts/bootstrap-content/fixtures/tiny-et.json`
- Create: `tests/scripts/bootstrap-content/fixtures/tiny-cache.json`
- Create: `tests/scripts/bootstrap-content/integration.test.ts`
- Create: `scripts/bootstrap-content/bootstrap.ts`

- [ ] **Step 1: Create tiny fixtures**

`tests/scripts/bootstrap-content/fixtures/tiny-en.json`:

```json
{
  "edition": "4th",
  "sourcePdf": "fixture.pdf",
  "extractedAt": "2026-04-19T00:00:00Z",
  "sections": [
    {
      "id": "ch01-bills-story",
      "kind": "chapter",
      "title": "Bill's Story",
      "pdfPageStart": 22,
      "pdfPageEnd": 22,
      "bookPageStart": 22,
      "bookPageEnd": 22,
      "blocks": [
        { "id": "ch01-bills-story-h001", "kind": "heading", "text": "BILL'S STORY", "pdfPage": 22 },
        {
          "id": "ch01-bills-story-p002",
          "kind": "paragraph",
          "text": "War fever ran high.",
          "pdfPage": 22
        },
        {
          "id": "ch01-bills-story-p003",
          "kind": "paragraph",
          "text": "Orphan paragraph.",
          "pdfPage": 22
        }
      ]
    }
  ]
}
```

`tests/scripts/bootstrap-content/fixtures/tiny-et.json`:

```json
{
  "edition": "4th",
  "sourcePdf": "fixture.pdf",
  "extractedAt": "2026-04-19T00:00:00Z",
  "sections": [
    {
      "id": "ch01-billi-lugu",
      "kind": "chapter",
      "title": "Billi lugu",
      "pdfPageStart": 13,
      "pdfPageEnd": 13,
      "bookPageStart": 13,
      "bookPageEnd": 13,
      "blocks": [
        { "id": "ch01-billi-lugu-h001", "kind": "heading", "text": "BILLI LUGU", "pdfPage": 13 },
        {
          "id": "ch01-billi-lugu-p002",
          "kind": "paragraph",
          "text": "Sõjapalavik oli kõrge.",
          "pdfPage": 13
        }
      ]
    }
  ]
}
```

`tests/scripts/bootstrap-content/fixtures/tiny-artifact.json`:

```json
{
  "version": "1.0",
  "generatedAt": "2026-04-19T00:00:00Z",
  "sourceEn": { "path": "tiny-en.json", "sha256": "x", "blockCount": 3 },
  "sourceEt": { "path": "tiny-et.json", "sha256": "y", "blockCount": 2 },
  "sections": [
    {
      "canonicalSlug": "ch01",
      "enSectionId": "ch01-bills-story",
      "etSectionId": "ch01-billi-lugu",
      "pairs": [
        {
          "paraId": "ch01-h001",
          "kind": "heading",
          "enBlockId": "ch01-bills-story-h001",
          "etBlockId": "ch01-billi-lugu-h001",
          "confidence": "high"
        },
        {
          "paraId": "ch01-p001",
          "kind": "paragraph",
          "enBlockId": "ch01-bills-story-p002",
          "etBlockId": "ch01-billi-lugu-p002",
          "confidence": "high"
        }
      ],
      "unpaired": [
        {
          "blockId": "ch01-bills-story-p003",
          "side": "en",
          "kind": "paragraph",
          "reason": "section-en-only",
          "notes": "Orphan for fixture"
        }
      ],
      "diagnostics": []
    }
  ],
  "unpairedSections": []
}
```

`tests/scripts/bootstrap-content/fixtures/tiny-cache.json`:

```json
{
  "___PLACEHOLDER___": {
    "sourceText": "Orphan paragraph.",
    "sourceLang": "en",
    "targetLang": "et",
    "model": "claude-sonnet-4-6",
    "promptVersion": "1.0",
    "translation": "Orb lõik.",
    "calledAt": "2026-04-19T00:00:00Z",
    "usage": { "inputTokens": 3, "outputTokens": 3 }
  }
}
```

Note on cache key: the `___PLACEHOLDER___` will be replaced at test setup time via `buildCacheKey` so the test doesn't have to hardcode the sha256.

- [ ] **Step 2: Create `tests/scripts/bootstrap-content/integration.test.ts`**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildRenderPlans } from '../../../scripts/bootstrap-content/bootstrap'
import { buildCacheKey } from '../../../scripts/bootstrap-content/boderie'
import type {
  BoderieCache,
  Extraction,
  PairingArtifact,
} from '../../../scripts/bootstrap-content/types'

const FIXTURES = resolve(fileURLToPath(new URL('./fixtures', import.meta.url)))

function load<T>(name: string): T {
  return JSON.parse(readFileSync(resolve(FIXTURES, name), 'utf8')) as T
}

describe('buildRenderPlans (integration)', () => {
  it('produces one SectionRenderPlan per paired section with correct kinds + auto-translation', async () => {
    const artifact = load<PairingArtifact>('tiny-artifact.json')
    const en = load<Extraction>('tiny-en.json')
    const et = load<Extraction>('tiny-et.json')

    // Seed cache with the expected translation for the orphan EN paragraph
    const cache: BoderieCache = {}
    const key = buildCacheKey({
      sourceText: 'Orphan paragraph.',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: '1.0',
    })
    cache[key] = {
      sourceText: 'Orphan paragraph.',
      sourceLang: 'en',
      targetLang: 'et',
      model: 'claude-sonnet-4-6',
      promptVersion: '1.0',
      translation: 'Orb lõik.',
      calledAt: '2026-04-19T00:00:00Z',
      usage: { inputTokens: 3, outputTokens: 3 },
    }

    const fakeClient = {
      messages: {
        create: async () => {
          throw new Error('cache should have covered all translations in this fixture')
        },
      },
    }

    const plans = await buildRenderPlans({
      artifact,
      en,
      et,
      cache,
      client: fakeClient as unknown as Parameters<typeof buildRenderPlans>[0]['client'],
    })

    expect(plans).toHaveLength(1)
    const ch01 = plans[0]
    expect(ch01).toBeDefined()
    if (ch01 === undefined) throw new Error('narrowing')

    // Each side should have 3 rendered blocks at matching paraIds
    expect(ch01.en.map((b) => b.paraId)).toEqual(['ch01-h001', 'ch01-p001', 'ch01-p002'])
    expect(ch01.et.map((b) => b.paraId)).toEqual(['ch01-h001', 'ch01-p001', 'ch01-p002'])

    // ET ch01-p002 is the auto-translated orphan
    const etP002 = ch01.et.find((b) => b.paraId === 'ch01-p002')
    expect(etP002).toBeDefined()
    if (etP002 === undefined) throw new Error('narrowing')
    expect(etP002.text).toBe('Orb lõik.')
    expect(etP002.isAutoTranslated).toBe(true)

    // EN ch01-p002 is the original (not auto-translated)
    const enP002 = ch01.en.find((b) => b.paraId === 'ch01-p002')
    expect(enP002).toBeDefined()
    if (enP002 === undefined) throw new Error('narrowing')
    expect(enP002.text).toBe('Orphan paragraph.')
    expect(enP002.isAutoTranslated).toBe(false)
  })
})
```

- [ ] **Step 3: Run — expect failure (module does not exist)**

```bash
npx vitest run tests/scripts/bootstrap-content/integration.test.ts
```

- [ ] **Step 4: Create `scripts/bootstrap-content/bootstrap.ts` (plan-building portion; CLI runner at Step 7)**

```ts
import { translate } from './boderie'
import { GROUP_MAP, groupForSlug } from './groups'
import type {
  BoderieCache,
  BlockKind,
  Extraction,
  ExtractionBlock,
  Group,
  PairingArtifact,
  RenderedBlock,
  SectionRenderPlan,
  UnpairedBlock,
} from './types'

export interface BuildRenderPlansInput {
  artifact: PairingArtifact
  en: Extraction
  et: Extraction
  cache: BoderieCache
  client: Parameters<typeof translate>[1]['client']
}

type BlockMap = Map<string, ExtractionBlock>

function indexBlocks(ext: Extraction): BlockMap {
  const m: BlockMap = new Map()
  for (const s of ext.sections) for (const b of s.blocks) m.set(b.id, b)
  return m
}

function firstText(ids: string | string[], blocks: BlockMap): string {
  const arr = Array.isArray(ids) ? ids : [ids]
  return arr
    .map((id) => blocks.get(id)?.text ?? '')
    .filter((t) => t.length > 0)
    .join('\n\n')
}

function groupForSlugOrThrow(slug: string): Group {
  const g = groupForSlug(slug)
  if (g === null) throw new Error(`no group for canonical slug ${slug}`)
  return g
}

export async function buildRenderPlans(input: BuildRenderPlansInput): Promise<SectionRenderPlan[]> {
  const enBlocks = indexBlocks(input.en)
  const etBlocks = indexBlocks(input.et)

  const plans: SectionRenderPlan[] = []
  for (const section of input.artifact.sections) {
    const enSection = input.en.sections.find((s) => s.id === section.enSectionId)
    const etSection = input.et.sections.find((s) => s.id === section.etSectionId)
    if (enSection === undefined || etSection === undefined) {
      throw new Error(`section not found in extraction for ${section.canonicalSlug}`)
    }

    const enRendered: RenderedBlock[] = []
    const etRendered: RenderedBlock[] = []

    // Paired blocks: each side renders the block's own text with the canonical paraId
    for (const pair of section.pairs) {
      const enText = firstText(pair.enBlockId, enBlocks)
      const etText = firstText(pair.etBlockId, etBlocks)
      enRendered.push({
        paraId: pair.paraId,
        kind: pair.kind,
        text: enText,
        isAutoTranslated: false,
      })
      etRendered.push({
        paraId: pair.paraId,
        kind: pair.kind,
        text: etText,
        isAutoTranslated: false,
      })
    }

    // Unpaired blocks: each entry produces one RenderedBlock per side (same paraId)
    // The side with the content renders it; the other side gets the Boderie translation.
    for (const u of section.unpaired) {
      if (u.reason === 'structural-extra' || u.reason === 'needs-review') continue
      const synthesized = synthesizeParaId(section.canonicalSlug, u)
      if (u.side === 'en') {
        const enBlock = enBlocks.get(u.blockId)
        if (enBlock === undefined) throw new Error(`EN block ${u.blockId} missing from extraction`)
        const { translation } = await translate(
          { sourceText: enBlock.text, sourceLang: 'en', targetLang: 'et' },
          { cache: input.cache, client: input.client },
        )
        enRendered.push({
          paraId: synthesized,
          kind: u.kind,
          text: enBlock.text,
          isAutoTranslated: false,
        })
        etRendered.push({
          paraId: synthesized,
          kind: u.kind,
          text: translation,
          isAutoTranslated: true,
        })
      } else {
        const etBlock = etBlocks.get(u.blockId)
        if (etBlock === undefined) throw new Error(`ET block ${u.blockId} missing from extraction`)
        const { translation } = await translate(
          { sourceText: etBlock.text, sourceLang: 'et', targetLang: 'en' },
          { cache: input.cache, client: input.client },
        )
        enRendered.push({
          paraId: synthesized,
          kind: u.kind,
          text: translation,
          isAutoTranslated: true,
        })
        etRendered.push({
          paraId: synthesized,
          kind: u.kind,
          text: etBlock.text,
          isAutoTranslated: false,
        })
      }
    }

    plans.push({
      canonicalSlug: section.canonicalSlug,
      group: groupForSlugOrThrow(section.canonicalSlug),
      title: { en: enSection.title, et: etSection.title },
      pdfPageStart: enSection.pdfPageStart,
      pdfPageEnd: enSection.pdfPageEnd,
      en: enRendered,
      et: etRendered,
    })
  }

  // Handle unpaired sections (a-pamphlets): both sides emit paired content via Boderie translation
  for (const us of input.artifact.unpairedSections) {
    const g = groupForSlug(us.canonicalSlug)
    if (g === null) continue
    const sourceExt = us.side === 'en' ? input.en : input.et
    const section = sourceExt.sections.find((s) => s.id === us.sectionId)
    if (section === undefined) throw new Error(`section ${us.sectionId} missing from extraction`)

    const enRendered: RenderedBlock[] = []
    const etRendered: RenderedBlock[] = []
    const kindOrdinals: Partial<Record<BlockKind, number>> = {}
    const KIND_PREFIX: Record<BlockKind, string> = {
      paragraph: 'p',
      heading: 'h',
      'list-item': 'l',
      blockquote: 'q',
      verse: 'v',
      table: 't',
      byline: 'b',
      footnote: 'f',
    }

    for (const b of section.blocks) {
      const prefix = KIND_PREFIX[b.kind]
      const n = (kindOrdinals[b.kind] ?? 0) + 1
      kindOrdinals[b.kind] = n
      const paraId = `${us.canonicalSlug}-${prefix}${String(n).padStart(3, '0')}`
      const { translation } = await translate(
        { sourceText: b.text, sourceLang: us.side, targetLang: us.side === 'en' ? 'et' : 'en' },
        { cache: input.cache, client: input.client },
      )
      if (us.side === 'en') {
        enRendered.push({ paraId, kind: b.kind, text: b.text, isAutoTranslated: false })
        etRendered.push({ paraId, kind: b.kind, text: translation, isAutoTranslated: true })
      } else {
        enRendered.push({ paraId, kind: b.kind, text: translation, isAutoTranslated: true })
        etRendered.push({ paraId, kind: b.kind, text: b.text, isAutoTranslated: false })
      }
    }

    plans.push({
      canonicalSlug: us.canonicalSlug,
      group: g,
      title: { en: section.title, et: section.title },
      pdfPageStart: section.pdfPageStart,
      pdfPageEnd: section.pdfPageEnd,
      en: enRendered,
      et: etRendered,
    })
  }

  return plans
}

function synthesizeParaId(slug: string, u: UnpairedBlock): string {
  const KIND_PREFIX: Record<BlockKind, string> = {
    paragraph: 'p',
    heading: 'h',
    'list-item': 'l',
    blockquote: 'q',
    verse: 'v',
    table: 't',
    byline: 'b',
    footnote: 'f',
  }
  const prefix = KIND_PREFIX[u.kind]
  // Use the tail of the original blockId as a stable ordinal; e.g. 'ch01-bills-story-p005' -> '005'
  const tail = u.blockId.match(/\d+$/)
  if (tail === null) throw new Error(`cannot synthesize paraId for ${u.blockId}`)
  return `${slug}-${prefix}${tail[0]}`
}

// Silence unused-import warnings while keeping types reachable
export type { Extraction, PairingArtifact, BoderieCache } from './types'
export { GROUP_MAP }
```

- [ ] **Step 5: Run — expect integration pass**

```bash
npx vitest run tests/scripts/bootstrap-content/integration.test.ts
```

Expected: 1 test passes.

- [ ] **Step 6: Run full suite to catch regressions**

```bash
npm run test
npm run typecheck
```

Expected: all green.

- [ ] **Step 7: Append CLI runner to `scripts/bootstrap-content/bootstrap.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildManifest } from './emit-manifest'
import { renderSection } from './emit-markdown'
import { renderWrapper } from './emit-wrapper'
import { COVER_MARKER, renderCover, renderIndex, shouldRegenerateCover } from './static-templates'

function ensureDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true })
}

async function run(argv: string[]): Promise<void> {
  const mode = argv[0] ?? 'full'
  const scriptDir = dirname(fileURLToPath(import.meta.url))
  const repoRoot = resolve(scriptDir, '..', '..')

  const artifactPath = resolve(repoRoot, 'data/extractions/pairing/en-et.json')
  const enPath = resolve(repoRoot, 'data/extractions/structured/en-4th-edition.json')
  const etPath = resolve(repoRoot, 'data/extractions/structured-et/et-4th-edition.json')
  const cachePath = resolve(repoRoot, 'data/extractions/pairing/translation-cache.json')

  const artifact: PairingArtifact = JSON.parse(
    readFileSync(artifactPath, 'utf8'),
  ) as PairingArtifact
  const en: Extraction = JSON.parse(readFileSync(enPath, 'utf8')) as Extraction
  const et: Extraction = JSON.parse(readFileSync(etPath, 'utf8')) as Extraction
  const cache: BoderieCache = existsSync(cachePath)
    ? (JSON.parse(readFileSync(cachePath, 'utf8')) as BoderieCache)
    : {}

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey === undefined || apiKey === '') {
    // Check whether cache covers all needed translations before erroring
    const client = {
      messages: {
        create: async () => {
          throw new Error('ANTHROPIC_API_KEY not set and cache incomplete')
        },
      },
    }
    const plans = await buildRenderPlans({
      artifact,
      en,
      et,
      cache,
      client: client as unknown as Parameters<typeof buildRenderPlans>[0]['client'],
    })
    if (mode === 'translate-only') return
    await emit(plans, repoRoot)
    writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n')
    return
  }

  const client = new Anthropic({ apiKey })
  const plans = await buildRenderPlans({ artifact, en, et, cache, client })
  writeFileSync(cachePath, JSON.stringify(cache, null, 2) + '\n')
  if (mode === 'translate-only') {
    console.log(`Translations cached: ${Object.keys(cache).length}`)
    return
  }
  if (mode === 'emit-only') {
    await emit(plans, repoRoot)
    return
  }
  await emit(plans, repoRoot)
  console.log(`Bootstrapped ${plans.length} sections. Cache: ${Object.keys(cache).length} entries.`)
}

async function emit(plans: SectionRenderPlan[], repoRoot: string): Promise<void> {
  const manifest = buildManifest(plans, new Date().toISOString())
  const manifestPath = resolve(repoRoot, 'src/content/manifest.json')
  ensureDir(manifestPath)
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

  const wrapperPath = resolve(repoRoot, 'src/lib/content/manifest.ts')
  ensureDir(wrapperPath)
  writeFileSync(wrapperPath, renderWrapper())

  for (const plan of plans) {
    for (const lang of ['en', 'et'] as const) {
      const path = resolve(repoRoot, `src/content/${lang}/${plan.canonicalSlug}.md`)
      ensureDir(path)
      writeFileSync(path, renderSection(plan, lang))
    }
  }

  // Cover: honor shouldRegenerateCover (preserve hand-edits)
  for (const lang of ['en', 'et'] as const) {
    const path = resolve(repoRoot, `src/content/${lang}/cover.md`)
    ensureDir(path)
    const existing = existsSync(path) ? readFileSync(path, 'utf8') : null
    if (shouldRegenerateCover(existing)) writeFileSync(path, renderCover(lang))
  }

  // Index: regenerate every run
  for (const lang of ['en', 'et'] as const) {
    const path = resolve(repoRoot, `src/content/${lang}/index.md`)
    ensureDir(path)
    writeFileSync(path, renderIndex(manifest, lang))
  }
}

const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])

if (isMainModule) {
  run(process.argv.slice(2)).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

// Silence prettier; variable used via JS hoisting in above
void createHash
```

- [ ] **Step 8: Re-run tests to confirm no regressions**

```bash
npm run test
npm run typecheck
```

- [ ] **Step 9: Commit**

`/tmp/p1-task11.txt`:

```
feat(bootstrap): bootstrap.ts CLI orchestrator + integration test (P1 task 11)

buildRenderPlans composes section + block + translation logic to
produce SectionRenderPlan[] for every section in the pairing artifact,
including whole-section unpaired (a-pamphlets). The CLI runner loads
inputs, dispatches translation (with ANTHROPIC_API_KEY env gate),
writes src/content/{en,et}/*.md + manifest.json + wrapper + cover +
index, and persists the translation cache.

Modes: default (full run); translate-only (populate cache, no emit);
emit-only (no Claude calls).

Golden tiny fixtures exercise the full pipeline with a cache-covered
single auto-translation.

(*BB:Granjon*)
```

```bash
npx prettier --write scripts/bootstrap-content/bootstrap.ts tests/scripts/bootstrap-content/integration.test.ts tests/scripts/bootstrap-content/fixtures/
git add scripts/bootstrap-content/bootstrap.ts tests/scripts/bootstrap-content/integration.test.ts tests/scripts/bootstrap-content/fixtures/
git commit -F /tmp/p1-task11.txt
```

---

## Task 12: Wire npm scripts

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add three scripts**

After the existing `"pair:review"` entry, add:

```json
"bootstrap": "CONTENT_BOOTSTRAP=1 tsx scripts/bootstrap-content/bootstrap.ts",
"bootstrap:translate-only": "CONTENT_BOOTSTRAP=1 tsx scripts/bootstrap-content/bootstrap.ts translate-only",
"bootstrap:emit-only": "CONTENT_BOOTSTRAP=1 tsx scripts/bootstrap-content/bootstrap.ts emit-only"
```

- [ ] **Step 2: Verify wiring (without running live)**

```bash
npm run bootstrap:emit-only 2>&1 | head -5
```

Expected: script resolves and starts. It will error because no translation cache exists yet — that's fine; wiring is verified.

- [ ] **Step 3: Commit**

`/tmp/p1-task12.txt`:

```
feat(bootstrap): wire npm run bootstrap / translate-only / emit-only (P1 task 12)

Three entry points registered. All set CONTENT_BOOTSTRAP=1 so the
content-guard pre-commit hook permits staged diffs under src/content/.
bootstrap runs the full pipeline. bootstrap:translate-only populates
the cache without emitting. bootstrap:emit-only emits without calling
Claude (useful for iterating on rendering code).

(*BB:Granjon*)
```

```bash
npx prettier --write package.json
git add package.json
git commit -F /tmp/p1-task12.txt
```

---

## Task 13: Add Boderie roster entry + attribution table update

**Files:**

- Modify: `.claude/teams/bigbook-dev/roster.json`
- Modify: `.claude/teams/bigbook-dev/common-prompt.md`

**Owner:** Plantin (docs territory).

- [ ] **Step 1: Add Boderie entry to `roster.json`**

After the existing `ortelius` member object in the `members` array, add:

```json
{
  "name": "boderie",
  "agentType": "general-purpose",
  "model": "claude-sonnet-4-6",
  "color": "cyan",
  "prompt": "prompts/boderie.md",
  "lore": {
    "fullName": "Guy Le Fèvre de la Boderie",
    "nickname": "Boderie",
    "origin": "Guy Le Fèvre de la Boderie (1541–1598) — French humanist-orientalist, scholar of Syriac and Hebrew. Plantin hired him to prepare the Syriac portion of the Biblia Polyglotta, working alongside Benito Arias Montano. A translator in the Antwerp Plantiniana circle, documented collaborator of the team's RED.",
    "significance": "A one-shot translator invoked by the content bootstrap generator to fill asymmetric blocks between the EN and ET editions of the AA Big Book. Boderie runs at generator execution time — not during implementation — reads the source, outputs the translation, caches the result. No scratchpad; the cache file is his memory."
  }
}
```

- [ ] **Step 2: Update attribution table in `common-prompt.md`**

Find the `Author Attribution` section's table. Append a row:

```markdown
| `.md` file — auto-translated block | `(_BB:Boderie_)` trailing line after the block content |
```

- [ ] **Step 3: Commit**

`/tmp/p1-task13.txt`:

```
docs(team): add Boderie to bigbook-dev roster (P1 task 13)

New roster member: Boderie (Guy Le Fèvre de la Boderie, 1541-1598) —
Plantiniana-circle translator of the Biblia Polyglotta's Syriac
portion. Dispatched by the content bootstrap generator at execution
time to fill asymmetric EN/ET blocks. No scratchpad — the translation
cache is his memory. Persona detail at prompts/boderie.md (landed in
task 4).

common-prompt attribution table extended to cover auto-translated
blocks carrying the (*BB:Boderie*) trailer in .md output.

(*BB:Plantin*)
```

```bash
npx prettier --write .claude/teams/bigbook-dev/roster.json .claude/teams/bigbook-dev/common-prompt.md
git add .claude/teams/bigbook-dev/roster.json .claude/teams/bigbook-dev/common-prompt.md
git commit -F /tmp/p1-task13.txt
```

---

## Task 14: Full test suite + coverage gate

**Owner:** Plantin (inline).

- [ ] **Step 1: Run full suite**

```bash
npm run test
```

Expected: all tests pass; count is ~267 (P0 baseline) + tests added in tasks 3–11 (roughly 50 new). Target: ≥ 317 passing.

- [ ] **Step 2: Coverage**

```bash
npm run test:coverage 2>&1 | tail -30
```

Expected: `scripts/bootstrap-content/**` at ≥ 90% lines / functions / statements, ≥ 85% branches. Global threshold also ≥ 90%.

- [ ] **Step 3: Typecheck + lint + build**

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all exit 0. Astro build succeeds with zero warnings (bootstrap doesn't affect the Astro build; this confirms no accidental coupling).

- [ ] **Step 4: If coverage gaps surface, dispatch Montano for targeted tests**

Use the same pattern as Task 12 in P0 plan: identify specific uncovered lines/branches, write a Montano dispatch prompt with the concrete tests to add. Keep iteration tight.

This task is a gate, not a deliverable — no commit at the end.

---

## Task 15: First live translate-only run + commit translation cache

**Owner:** Plantin (inline).

- [ ] **Step 1: Confirm `ANTHROPIC_API_KEY` is set**

```bash
[ -n "$ANTHROPIC_API_KEY" ] && echo "OK" || echo "MISSING — set before proceeding"
```

If missing, the PO sets it in the shell running this worktree.

- [ ] **Step 2: Run translate-only mode**

```bash
npm run bootstrap:translate-only
```

Expected: ~64 Claude API calls. Duration roughly 1–2 minutes sequential. Writes `data/extractions/pairing/translation-cache.json` with 64 entries.

- [ ] **Step 3: Inspect cache**

```bash
jq '. | length' data/extractions/pairing/translation-cache.json
jq '[.[] | select(.usage.inputTokens > 0)] | length' data/extractions/pairing/translation-cache.json
jq 'to_entries | .[0:3] | .[] | {source: .value.sourceText[0:60], target: .value.targetLang, trans: .value.translation[0:60]}' data/extractions/pairing/translation-cache.json
```

Expected: 64 entries; spot-check the first 3 translations look reasonable.

- [ ] **Step 4: PO spot-check**

PO reviews 5–10 random entries via `jq`, paying attention to:

- Proper-name preservation (Bill W., Dr. Bob, Akron)
- Register consistency with existing ET chapters
- Pamphlet titles (short, tight translations)
- Any visibly broken output (empty, contains English, contains framing like "Here is the translation:")

If any entry looks wrong, record which keys to invalidate. PO deletes those keys from the cache (or bumps PROMPT_VERSION in `boderie.ts` if the issue is systemic) and re-runs translate-only to re-fetch.

- [ ] **Step 5: Commit the cache**

`/tmp/p1-task15.txt`:

```
feat(bootstrap): first committed Boderie translation cache (P1 task 15)

Claude Sonnet 4.6 translations for the 64 asymmetric blocks between EN
and ET extractions: 10 block-level side-only entries (section-en/et-only)
plus 54 a-pamphlets list-items from the EN-only appendix. Cache keyed
by sha256(sourceText + targetLang + model + promptVersion); re-runs
are idempotent.

(*BB:Boderie*)
```

```bash
git add data/extractions/pairing/translation-cache.json
git commit -F /tmp/p1-task15.txt
```

---

## Task 16: First live emit run + commit content tree + manifest

**Owner:** Plantin (inline).

- [ ] **Step 1: Run emit-only mode**

```bash
npm run bootstrap:emit-only 2>&1 | tail -5
```

Expected: writes 68 × 2 markdown files plus `src/content/manifest.json` + `src/lib/content/manifest.ts` + cover + index files. Console summary: `Bootstrapped 68 sections. Cache: 64 entries.`

- [ ] **Step 2: Inspect outputs**

```bash
ls src/content/en/ | wc -l                   # expect ≥ 68 (plus cover, index)
ls src/content/et/ | wc -l                   # expect ≥ 68
jq '.sections | length' src/content/manifest.json   # expect 68
wc -l src/lib/content/manifest.ts            # should be short (< 50 lines — it's a wrapper)
```

- [ ] **Step 3: Spot-check a section**

```bash
head -40 src/content/en/ch01.md
head -40 src/content/et/ch01.md
head -20 src/content/et/a-pamphlets.md       # expect Boderie attribution on every list-item
```

PO reviews for:

- Frontmatter correctness (chapter, title, lang, group, pdfPages)
- Para-id numbering matches the pairing artifact (within-kind)
- Boderie attribution present on auto-translated blocks
- No leaked English in ET files or Estonian in EN files

- [ ] **Step 4: Run full suite + typecheck + build**

```bash
npm run test
npm run typecheck
npm run build
```

Expected: all green. The build must succeed — the wrapper's import of `manifest.json` should typecheck.

- [ ] **Step 5: Commit the content tree + manifest + wrapper**

`/tmp/p1-task16.txt`:

```
feat(bootstrap): first committed content tree + manifest (P1 task 16)

Replaces the 16-file mock content tree with 68 canonical sections per
language (136 files + cover + index × 2). manifest.json authoritative;
src/lib/content/manifest.ts regenerated as a compat wrapper. 64
asymmetric blocks filled by Boderie (cached from task 15).

Reader's existing CHAPTERS import continues to resolve via the
wrapper. P2 will adapt components for 68-section navigation; P3 will
wire the Hard Invariant hook.

(*BB:Plantin*)
```

```bash
git add src/content/ src/lib/content/manifest.ts
git commit -F /tmp/p1-task16.txt
```

Note: `CONTENT_BOOTSTRAP=1` must be in the commit environment for the content-guard pre-commit hook to allow this diff:

```bash
CONTENT_BOOTSTRAP=1 git commit -F /tmp/p1-task16.txt
```

- [ ] **Step 6: Push feature branch**

```bash
git push -u origin feat/v1.1-content-p1
```

The branch stays open until P2 is also ready to merge. Both merge to `main` together.

---

## Task 17: PO review gate

This is a gating task, not an implementation step. P1 does not merge until P2 catches up.

- [ ] **Step 1:** PO reviews the full feature-branch diff via GitHub's branch view:

```bash
gh pr create --draft --base main --head feat/v1.1-content-p1 --title "v1.1-content P1: content bootstrap generator" --body "Draft PR — see docs/superpowers/specs/2026-04-19-content-bootstrap-generator-design.md for design. P1 output only; merge depends on P2 (reader adaptation) landing on a parallel branch."
```

- [ ] **Step 2:** PO spot-checks 5–10 random sections across groups (front-matter, chapter, story, appendix) in the new `src/content/{en,et}/` tree.

- [ ] **Step 3:** PO reviews `data/extractions/pairing/translation-cache.json` for any problematic Boderie outputs.

- [ ] **Step 4:** If PO requests changes:
  - For translation issues: delete specific cache keys, re-run `npm run bootstrap:translate-only`, re-commit cache.
  - For rendering issues: dispatch Granjon on the affected module (emit-markdown.ts, static-templates.ts, etc.), re-run `npm run bootstrap:emit-only`, re-commit content tree.
  - For schema issues: amend the design spec, re-run brainstorming on the affected decision, adjust the plan.

- [ ] **Step 5:** PO opens brainstorm for phase P2 (reader adaptation). When P2's implementation plan completes on its own feature branch, the two feature branches merge to `main` together via a single coordinated PR.

---

## Self-review checklist

- [x] **Spec coverage:** every design decision D1–D10 is enacted by at least one task:
  - D1 (feature branch) → Task 1
  - D2 (within-kind paraIds) → Tasks 11 (buildRenderPlans uses artifact paraIds verbatim)
  - D3 (policy C + auto-translate) → Tasks 11, 15
  - D4 (a-pamphlets auto-translated) → Task 11 (whole-section branch)
  - D5 (BB:Boderie attribution) → Tasks 6, 11
  - D6 (Sonnet 4.6 cached) → Tasks 4, 5, 15
  - D7 (cover + index) → Task 10
  - D8 (group mapping) → Task 3
  - D9 (manifest at src/content/ + wrapper) → Tasks 8, 9, 16
  - D10 (per-kind rendering) → Task 6
- [x] **Placeholder scan:** no "TBD", no "add appropriate", no bare "similar to Task N" references.
- [x] **Type consistency:** all later tasks reference the types defined in Task 2 (`Group`, `ManifestSection`, `BoderieCache`, `RenderedBlock`, `SectionRenderPlan`) by exact name.
- [x] **Boderie is wired in two places:** roster.json (Task 13) and as the author of the first translation cache commit (Task 15) — consistent with existing roster conventions.
- [x] **Pre-P1 chores check:** no dependencies on upstream fixes. The P0 artifact is final; the two known data gaps (a-iv ET source, ch01 byline) are already represented correctly and do not need re-extraction.

(_BB:Plantin_)
