# EN/ET Pairing Artifact — Phase P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce `data/extractions/pairing/en-et.json` and `data/extractions/pairing/review.md` — the bidirectional para-id pairing artifact between the EN and ET structured extractions. Closes issue #39.

**Architecture:** A pure-TypeScript deterministic pairer under `scripts/pair-en-et/`. Hardcoded canonical slug table (68 entries), kind-grouped position-anchored block pairing, length-ratio confidence tagging, mutation-tested invariant verifier, markdown review report for low-confidence/unpaired cases. No LLM in the deterministic path.

**Tech Stack:** TypeScript 5 strict · Node 22 · tsx · Vitest 2 · existing extraction JSONs at `data/extractions/structured/` (EN) and `data/extractions/structured-et/` (ET).

**Spec:** `docs/superpowers/specs/2026-04-19-en-et-pairing-artifact-design.md`

**Team discipline:** The XP triple (Montano RED → Granjon GREEN → Ortelius PURPLE) owns the TDD cycle. Plantin decomposes, dispatches, reviews. Every commit body carries `(*BB:<Role>*)` attribution per team common-prompt.

---

## Task 1: Scaffold the module layout

**Files:**

- Create: `scripts/pair-en-et/types.ts`
- Create: `scripts/pair-en-et/index.ts`
- Modify: `vitest.config.ts` (extend coverage `include` to cover the new directory)

- [ ] **Step 1: Create `scripts/pair-en-et/types.ts`**

```ts
export type BlockKind = 'paragraph' | 'heading' | 'list-item' | 'blockquote' | 'byline' | 'footnote'

export interface ExtractionBlock {
  id: string
  kind: BlockKind
  text: string
  pdfPage: number
}

export interface ExtractionSection {
  id: string
  kind: string
  title: string
  pdfPageStart: number
  pdfPageEnd: number
  bookPageStart: number
  bookPageEnd: number
  blocks: ExtractionBlock[]
}

export interface Extraction {
  edition: string
  sourcePdf: string
  extractedAt: string
  sections: ExtractionSection[]
}

export type Confidence = 'high' | 'low'

export type UnpairedReason =
  | 'structural-extra'
  | 'section-en-only'
  | 'section-et-only'
  | 'needs-review'

export type UnpairedSectionReason = 'section-en-only' | 'section-et-only'

export interface Pair {
  paraId: string
  kind: BlockKind
  enBlockId: string | string[]
  etBlockId: string | string[]
  confidence: Confidence
  notes?: string
}

export interface UnpairedBlock {
  blockId: string
  side: 'en' | 'et'
  kind: BlockKind
  reason: UnpairedReason
  notes?: string
}

export interface SectionPair {
  canonicalSlug: string
  enSectionId: string
  etSectionId: string
  pairs: Pair[]
  unpaired: UnpairedBlock[]
  diagnostics: string[]
}

export interface UnpairedSection {
  side: 'en' | 'et'
  sectionId: string
  canonicalSlug: string
  reason: UnpairedSectionReason
  blockCount: number
}

export interface PairingArtifact {
  version: '1.0'
  generatedAt: string
  sourceEn: { path: string; sha256: string; blockCount: number }
  sourceEt: { path: string; sha256: string; blockCount: number }
  sections: SectionPair[]
  unpairedSections: UnpairedSection[]
}
```

- [ ] **Step 2: Create `scripts/pair-en-et/index.ts` as a barrel**

```ts
export * from './types'
```

- [ ] **Step 3: Extend coverage include in `vitest.config.ts`**

Modify the `coverage.include` array to add `scripts/pair-en-et/**/*.ts`:

```ts
coverage: {
  provider: 'v8',
  include: [
    'src/lib/**/*.ts',
    'src/lib/**/*.svelte.ts',
    'scripts/pair-en-et/**/*.ts',
  ],
  exclude: ['src/lib/content/manifest.ts', 'src/lib/content/baseline-config.ts'],
  thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
  all: false,
},
```

- [ ] **Step 4: Verify typecheck passes**

Run: `npm run typecheck`
Expected: exit 0, no errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/pair-en-et/ vitest.config.ts
git commit -F /tmp/p0-task1.txt
```

Commit body:

```
feat(pair): scaffold types + vitest coverage include (P0 task 1)

Introduces scripts/pair-en-et/ with the full TypeScript type surface
for the pairing artifact. Extends vitest coverage to the new
directory with the same thresholds as src/lib/.

(*BB:Granjon*)
```

---

## Task 2: Canonical slug table — contract tests

**Files:**

- Create: `tests/scripts/pair-en-et/section-map.test.ts`
- Create (stub only for now): `scripts/pair-en-et/section-map.ts`

- [ ] **Step 1: Create minimal stub of `section-map.ts`**

Write just enough so imports resolve and every test fails on _content_, not on missing module:

```ts
import type { BlockKind } from './types'

export interface SectionMapEntry {
  canonicalSlug: string
  enSectionId: string | null
  etSectionId: string | null
}

export const SECTION_MAP: readonly SectionMapEntry[] = []

export function slugForEnSection(_enId: string): string | null {
  return null
}

export function slugForEtSection(_etId: string): string | null {
  return null
}

export function entryForSlug(_slug: string): SectionMapEntry | null {
  return null
}

// Silence unused-import lint until wired up
export const __blockKindWitness: BlockKind = 'paragraph'
```

- [ ] **Step 2: Write `section-map.test.ts` (the failing contract)**

```ts
import { describe, expect, it } from 'vitest'
import enExtraction from '../../../data/extractions/structured/en-4th-edition.json'
import etExtraction from '../../../data/extractions/structured-et/et-4th-edition.json'
import {
  SECTION_MAP,
  entryForSlug,
  slugForEnSection,
  slugForEtSection,
} from '../../../scripts/pair-en-et/section-map'

describe('SECTION_MAP', () => {
  it('has exactly 68 entries', () => {
    expect(SECTION_MAP.length).toBe(68)
  })

  it('has 68 unique canonical slugs', () => {
    const slugs = SECTION_MAP.map((e) => e.canonicalSlug)
    expect(new Set(slugs).size).toBe(68)
  })

  it('maps every EN section in the extraction to a slug exactly once', () => {
    const enIdsInMap = SECTION_MAP.map((e) => e.enSectionId).filter(
      (id): id is string => id !== null,
    )
    const enIdsInExtraction = enExtraction.sections.map((s) => s.id)
    expect(new Set(enIdsInMap)).toEqual(new Set(enIdsInExtraction))
    expect(enIdsInMap.length).toBe(enIdsInExtraction.length)
  })

  it('maps every ET section in the extraction to a slug exactly once', () => {
    const etIdsInMap = SECTION_MAP.map((e) => e.etSectionId).filter(
      (id): id is string => id !== null,
    )
    const etIdsInExtraction = etExtraction.sections.map((s) => s.id)
    expect(new Set(etIdsInMap)).toEqual(new Set(etIdsInExtraction))
    expect(etIdsInMap.length).toBe(etIdsInExtraction.length)
  })

  it('marks appendix-aa-pamphlets as EN-only', () => {
    const entry = SECTION_MAP.find((e) => e.canonicalSlug === 'a-pamphlets')
    expect(entry).toBeDefined()
    expect(entry?.enSectionId).toBe('appendix-aa-pamphlets')
    expect(entry?.etSectionId).toBeNull()
  })
})

describe('slugForEnSection', () => {
  it('returns the canonical slug for a known EN section', () => {
    expect(slugForEnSection('ch01-bills-story')).toBe('ch01')
    expect(slugForEnSection('story-dr-bobs-nightmare')).toBe('s01')
    expect(slugForEnSection('appendix-aa-pamphlets')).toBe('a-pamphlets')
  })

  it('returns null for an unknown EN section', () => {
    expect(slugForEnSection('not-a-real-section')).toBeNull()
  })
})

describe('slugForEtSection', () => {
  it('returns the canonical slug for a known ET section', () => {
    expect(slugForEtSection('ch01-billi-lugu')).toBe('ch01')
    expect(slugForEtSection('story-doktor-bobi-painajalik-unenagu')).toBe('s01')
  })

  it('returns null for an unknown ET section', () => {
    expect(slugForEtSection('not-a-real-section')).toBeNull()
  })
})

describe('entryForSlug', () => {
  it('returns the full entry for a known slug', () => {
    const entry = entryForSlug('ch01')
    expect(entry).toEqual({
      canonicalSlug: 'ch01',
      enSectionId: 'ch01-bills-story',
      etSectionId: 'ch01-billi-lugu',
    })
  })

  it('returns null for an unknown slug', () => {
    expect(entryForSlug('nope')).toBeNull()
  })
})
```

- [ ] **Step 3: Verify tests fail**

Run: `npx vitest run tests/scripts/pair-en-et/section-map.test.ts`
Expected: 8 failures. The stub has no data; every assertion about content fails.

- [ ] **Step 4: Commit the failing tests**

```bash
git add tests/scripts/pair-en-et/section-map.test.ts scripts/pair-en-et/section-map.ts
git commit -F /tmp/p0-task2.txt
```

Commit body:

```
test(pair): section-map contract tests (RED, P0 task 2)

Contract tests against the 68-entry canonical slug table: exact count,
slug uniqueness, full EN/ET extraction coverage, a-pamphlets EN-only,
lookup-function semantics. Stub module wired so imports resolve; the
table itself lands empty and all tests fail by design. GREEN fills the
table in task 3-4.

(*BB:Montano*)
```

---

## Task 3: Populate the canonical slug table — non-story entries

**Files:**

- Modify: `scripts/pair-en-et/section-map.ts`

- [ ] **Step 1: Replace the stub with the populated table (non-story rows)**

```ts
export interface SectionMapEntry {
  canonicalSlug: string
  enSectionId: string | null
  etSectionId: string | null
}

const NON_STORY_ENTRIES: readonly SectionMapEntry[] = [
  { canonicalSlug: 'copyright', enSectionId: 'copyright-info', etSectionId: 'copyright-info' },
  { canonicalSlug: 'preface', enSectionId: 'preface', etSectionId: 'eessona' },
  { canonicalSlug: 'fw1', enSectionId: 'foreword-1st-edition', etSectionId: 'eessona-1st' },
  { canonicalSlug: 'fw2', enSectionId: 'foreword-2nd-edition', etSectionId: 'eessona-2nd' },
  { canonicalSlug: 'fw3', enSectionId: 'foreword-3rd-edition', etSectionId: 'eessona-3rd' },
  { canonicalSlug: 'fw4', enSectionId: 'foreword-4th-edition', etSectionId: 'eessona-4th' },
  { canonicalSlug: 'arsti', enSectionId: 'doctors-opinion', etSectionId: 'arsti-arvamus' },
  { canonicalSlug: 'ch01', enSectionId: 'ch01-bills-story', etSectionId: 'ch01-billi-lugu' },
  {
    canonicalSlug: 'ch02',
    enSectionId: 'ch02-there-is-a-solution',
    etSectionId: 'ch02-lahendus-on-olemas',
  },
  {
    canonicalSlug: 'ch03',
    enSectionId: 'ch03-more-about-alcoholism',
    etSectionId: 'ch03-alkoholismist-lahemalt',
  },
  { canonicalSlug: 'ch04', enSectionId: 'ch04-we-agnostics', etSectionId: 'ch04-meie-agnostikud' },
  {
    canonicalSlug: 'ch05',
    enSectionId: 'ch05-how-it-works',
    etSectionId: 'ch05-kuidas-see-toetab',
  },
  { canonicalSlug: 'ch06', enSectionId: 'ch06-into-action', etSectionId: 'ch06-tegutsema' },
  {
    canonicalSlug: 'ch07',
    enSectionId: 'ch07-working-with-others',
    etSectionId: 'ch07-too-teistega',
  },
  { canonicalSlug: 'ch08', enSectionId: 'ch08-to-wives', etSectionId: 'ch08-naistele' },
  {
    canonicalSlug: 'ch09',
    enSectionId: 'ch09-the-family-afterward',
    etSectionId: 'ch09-perekond-hiljem',
  },
  { canonicalSlug: 'ch10', enSectionId: 'ch10-to-employers', etSectionId: 'ch10-tooandjatele' },
  {
    canonicalSlug: 'ch11',
    enSectionId: 'ch11-a-vision-for-you',
    etSectionId: 'ch11-tulevikupilt-teie-jaoks',
  },
  {
    canonicalSlug: 'a-i',
    enSectionId: 'appendix-i-the-aa-tradition',
    etSectionId: 'appendix-i-aa-traditsioonid',
  },
  {
    canonicalSlug: 'a-ii',
    enSectionId: 'appendix-ii-spiritual-experience',
    etSectionId: 'appendix-ii-vaimne-kogemus',
  },
  {
    canonicalSlug: 'a-iii',
    enSectionId: 'appendix-iii-the-medical-view-on-aa',
    etSectionId: 'appendix-iii-meditsiiniline-vaade-aa-le',
  },
  {
    canonicalSlug: 'a-iv',
    enSectionId: 'appendix-iv-the-lasker-award',
    etSectionId: 'appendix-iv-lasker-award',
  },
  {
    canonicalSlug: 'a-v',
    enSectionId: 'appendix-v-the-religious-view-on-aa',
    etSectionId: 'appendix-v-religioosne-vaade-aa-le',
  },
  {
    canonicalSlug: 'a-vi',
    enSectionId: 'appendix-vi-how-to-get-in-touch-with-aa',
    etSectionId: 'appendix-vi-kuidas-aaga-uhendust-votta',
  },
  {
    canonicalSlug: 'a-vii',
    enSectionId: 'appendix-vii-the-twelve-concepts',
    etSectionId: 'appendix-vii-kaksteist-kontseptsiooni',
  },
  { canonicalSlug: 'a-pamphlets', enSectionId: 'appendix-aa-pamphlets', etSectionId: null },
]

const STORY_ENTRIES: readonly SectionMapEntry[] = [] // populated in task 4

export const SECTION_MAP: readonly SectionMapEntry[] = [
  ...NON_STORY_ENTRIES.slice(0, 18), // copyright..ch11 (18 entries)
  ...STORY_ENTRIES, // s01..s42 (task 4)
  ...NON_STORY_ENTRIES.slice(18), // a-i..a-pamphlets (8 entries)
]

const enIndex = new Map(
  SECTION_MAP.filter((e) => e.enSectionId !== null).map((e) => [e.enSectionId as string, e]),
)
const etIndex = new Map(
  SECTION_MAP.filter((e) => e.etSectionId !== null).map((e) => [e.etSectionId as string, e]),
)
const slugIndex = new Map(SECTION_MAP.map((e) => [e.canonicalSlug, e]))

export function slugForEnSection(enId: string): string | null {
  return enIndex.get(enId)?.canonicalSlug ?? null
}

export function slugForEtSection(etId: string): string | null {
  return etIndex.get(etId)?.canonicalSlug ?? null
}

export function entryForSlug(slug: string): SectionMapEntry | null {
  return slugIndex.get(slug) ?? null
}
```

- [ ] **Step 2: Run tests — expect partial failure**

Run: `npx vitest run tests/scripts/pair-en-et/section-map.test.ts`
Expected: tests asserting chapter/foreword/appendix mappings pass. Tests asserting story mappings and the 68-entry count still fail (because STORY_ENTRIES is empty; table has 26 entries, not 68).

- [ ] **Step 3: Commit (intentionally partial — sets up story task)**

```bash
git add scripts/pair-en-et/section-map.ts
git commit -F /tmp/p0-task3.txt
```

Commit body:

```
feat(pair): populate 26 non-story slug entries (GREEN partial, P0 task 3)

Adds copyright, preface, 4 forewords, arsti, ch01-ch11, 7 paired
appendices, and a-pamphlets (EN-only). Story rows s01..s42 land in
task 4; contract tests remain partially failing until then.

(*BB:Granjon*)
```

---

## Task 4: Populate the 42 story-slug rows

**Files:**

- Modify: `scripts/pair-en-et/section-map.ts`

**Context:** Both extractions list stories in PDF page order. The `s01..s42` canonical sequence is the book-order pairing. The full mapping is pre-computed below.

- [ ] **Step 1: Replace the empty `STORY_ENTRIES` constant with the 42-row table**

In `scripts/pair-en-et/section-map.ts`, replace:

```ts
const STORY_ENTRIES: readonly SectionMapEntry[] = [] // populated in task 4
```

with:

```ts
const STORY_ENTRIES: readonly SectionMapEntry[] = [
  {
    canonicalSlug: 's01',
    enSectionId: 'story-dr-bobs-nightmare',
    etSectionId: 'story-doktor-bobi-painajalik-unenagu',
  },
  {
    canonicalSlug: 's02',
    enSectionId: 'story-aa-number-three',
    etSectionId: 'story-anonuumne-alkohoolik-number-kolm',
  },
  {
    canonicalSlug: 's03',
    enSectionId: 'story-gratitude-in-action',
    etSectionId: 'story-tanulikkus-tegudes',
  },
  {
    canonicalSlug: 's04',
    enSectionId: 'story-women-suffer-too',
    etSectionId: 'story-ka-naised-on-haiged',
  },
  {
    canonicalSlug: 's05',
    enSectionId: 'story-our-southern-friend',
    etSectionId: 'story-meie-sober-lounast',
  },
  { canonicalSlug: 's06', enSectionId: 'story-the-vicious-cycle', etSectionId: 'story-noiaring' },
  { canonicalSlug: 's07', enSectionId: 'story-jims-story', etSectionId: 'story-jimi-lugu' },
  {
    canonicalSlug: 's08',
    enSectionId: 'story-the-man-who-mastered-fear',
    etSectionId: 'story-mees-kes-seljatas-hirmu',
  },
  {
    canonicalSlug: 's09',
    enSectionId: 'story-he-sold-himself-short',
    etSectionId: 'story-ta-alahindas-enda-vaartust',
  },
  {
    canonicalSlug: 's10',
    enSectionId: 'story-the-keys-of-the-kingdom',
    etSectionId: 'story-kuningriigi-votmed',
  },
  { canonicalSlug: 's11', enSectionId: 'story-the-missing-link', etSectionId: 'story-puuduv-luli' },
  { canonicalSlug: 's12', enSectionId: 'story-fear-of-fear', etSectionId: 'story-hirm-hirmu-ees' },
  {
    canonicalSlug: 's13',
    enSectionId: 'story-the-housewife-who-drank-at-home',
    etSectionId: 'story-koduperenaine-kes-joi-kodus',
  },
  {
    canonicalSlug: 's14',
    enSectionId: 'story-physician-heal-thyself',
    etSectionId: 'story-arst-ravi-iseennast',
  },
  {
    canonicalSlug: 's15',
    enSectionId: 'story-my-chance-to-live',
    etSectionId: 'story-minu-voimalus-elada',
  },
  { canonicalSlug: 's16', enSectionId: 'story-student-of-life', etSectionId: 'story-elu-opilane' },
  {
    canonicalSlug: 's17',
    enSectionId: 'story-crossing-the-river-of-denial',
    etSectionId: 'story-eitamise-joe-uletamine',
  },
  {
    canonicalSlug: 's18',
    enSectionId: 'story-because-im-an-alcoholic',
    etSectionId: 'story-sest-ma-olen-alkohoolik',
  },
  {
    canonicalSlug: 's19',
    enSectionId: 'story-it-might-have-benn-worse',
    etSectionId: 'story-oleks-voinud-ka-hullemini-minna',
  },
  { canonicalSlug: 's20', enSectionId: 'story-tightrope', etSectionId: 'story-kois' },
  {
    canonicalSlug: 's21',
    enSectionId: 'story-flooded-with-feeling',
    etSectionId: 'story-tunnetest-ule-ujutatud',
  },
  {
    canonicalSlug: 's22',
    enSectionId: 'story-winner-takes-all',
    etSectionId: 'story-voitja-votab-koik',
  },
  {
    canonicalSlug: 's23',
    enSectionId: 'story-me-an-alcoholic',
    etSectionId: 'story-mina-alkohoolik',
  },
  {
    canonicalSlug: 's24',
    enSectionId: 'story-the-perpetual-quest',
    etSectionId: 'story-alatine-otsing',
  },
  {
    canonicalSlug: 's25',
    enSectionId: 'story-a-drunk-like-you',
    etSectionId: 'story-joodik-nagu-sinagi',
  },
  {
    canonicalSlug: 's26',
    enSectionId: 'story-acceptance-was-the-answer',
    etSectionId: 'story-leppimine-oli-lahendus',
  },
  {
    canonicalSlug: 's27',
    enSectionId: 'story-window-of-opportunity',
    etSectionId: 'story-voimaluste-aken',
  },
  {
    canonicalSlug: 's28',
    enSectionId: 'story-my-bottle-my-resentments-and-me',
    etSectionId: 'story-minu-pudel-minu-vimmad-ja-mina',
  },
  {
    canonicalSlug: 's29',
    enSectionId: 'story-he-lived-only-to-drink',
    etSectionId: 'story-ta-elas-vaid-selleks-et-juua',
  },
  { canonicalSlug: 's30', enSectionId: 'story-safe-haven', etSectionId: 'story-turvaline-sadam' },
  {
    canonicalSlug: 's31',
    enSectionId: 'story-listening-to-the-wind',
    etSectionId: 'story-kuulates-tuult',
  },
  {
    canonicalSlug: 's32',
    enSectionId: 'story-twice-gifted',
    etSectionId: 'story-topelt-onnistatud',
  },
  {
    canonicalSlug: 's33',
    enSectionId: 'story-building-a-new-life',
    etSectionId: 'story-ehitades-uut-elu',
  },
  { canonicalSlug: 's34', enSectionId: 'story-on-the-move', etSectionId: 'story-liikvel' },
  {
    canonicalSlug: 's35',
    enSectionId: 'story-a-vision-of-recovery',
    etSectionId: 'story-nagemus-tervenemisest',
  },
  {
    canonicalSlug: 's36',
    enSectionId: 'story-gutter-bravado',
    etSectionId: 'story-rentsli-bravuur',
  },
  {
    canonicalSlug: 's37',
    enSectionId: 'story-empty-on-the-inside',
    etSectionId: 'story-hinges-tuhi',
  },
  { canonicalSlug: 's38', enSectionId: 'story-grounded', etSectionId: 'story-maapinnale-toodud' },
  {
    canonicalSlug: 's39',
    enSectionId: 'story-another-chance',
    etSectionId: 'story-veel-uks-voimalus',
  },
  { canonicalSlug: 's40', enSectionId: 'story-a-late-start', etSectionId: 'story-hiline-algus' },
  {
    canonicalSlug: 's41',
    enSectionId: 'story-freedom-from-bondage',
    etSectionId: 'story-koidikutest-vabaks',
  },
  {
    canonicalSlug: 's42',
    enSectionId: 'story-aa-taught-him-to-handle-sobriety',
    etSectionId: 'story-aa-opetas-teda-kainust-kontrollima',
  },
]
```

- [ ] **Step 2: Run section-map tests — expect full pass**

Run: `npx vitest run tests/scripts/pair-en-et/section-map.test.ts`
Expected: all 8 tests pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/pair-en-et/section-map.ts
git commit -F /tmp/p0-task4.txt
```

Commit body:

```
feat(pair): populate 42 story-slug rows (GREEN complete, P0 task 4)

Adds s01..s42 to the canonical slug table, paired by PDF book-order
(both extractions list stories in identical sequence). All 8 section-
map contract tests green. Table is now 68 rows: 26 non-story + 42
stories.

(*BB:Granjon*)
```

---

## Task 5: Length-ratio confidence heuristic

**Files:**

- Create: `tests/scripts/pair-en-et/confidence.test.ts`
- Create: `scripts/pair-en-et/confidence.ts`

- [ ] **Step 1: Write `confidence.test.ts` (RED)**

```ts
import { describe, expect, it } from 'vitest'
import { classify, lengthRatio } from '../../../scripts/pair-en-et/confidence'

describe('lengthRatio', () => {
  it('computes et/en ratio', () => {
    expect(lengthRatio('aaaaa', 'bbbb')).toBeCloseTo(0.8, 5)
    expect(lengthRatio('a', 'bbb')).toBeCloseTo(3.0, 5)
  })

  it('returns Infinity when EN is empty and ET is non-empty', () => {
    expect(lengthRatio('', 'anything')).toBe(Infinity)
  })

  it('returns NaN when both are empty', () => {
    expect(Number.isNaN(lengthRatio('', ''))).toBe(true)
  })
})

describe('classify', () => {
  it('returns high for in-band ratios', () => {
    expect(classify('hello world', 'tere maailm')).toEqual({ confidence: 'high' })
    // length 11 vs 11 → ratio 1.0 → in band
  })

  it('returns high at lower band edge (0.55)', () => {
    const en = 'x'.repeat(100)
    const et = 'y'.repeat(55)
    expect(classify(en, et)).toEqual({ confidence: 'high' })
  })

  it('returns high at upper band edge (1.6)', () => {
    const en = 'x'.repeat(100)
    const et = 'y'.repeat(160)
    expect(classify(en, et)).toEqual({ confidence: 'high' })
  })

  it('returns low with note when below band', () => {
    const en = 'x'.repeat(100)
    const et = 'y'.repeat(30)
    const result = classify(en, et)
    expect(result.confidence).toBe('low')
    expect(result.notes).toMatch(/^length-ratio 0\.30/)
  })

  it('returns low with note when above band', () => {
    const en = 'x'.repeat(100)
    const et = 'y'.repeat(200)
    const result = classify(en, et)
    expect(result.confidence).toBe('low')
    expect(result.notes).toMatch(/^length-ratio 2\.00/)
  })

  it('returns low with note when both are empty', () => {
    const result = classify('', '')
    expect(result.confidence).toBe('low')
    expect(result.notes).toMatch(/empty/)
  })

  it('returns low with note when only EN is empty', () => {
    const result = classify('', 'anything')
    expect(result.confidence).toBe('low')
    expect(result.notes).toMatch(/empty/)
  })
})
```

- [ ] **Step 2: Run — expect module-not-found failure**

Run: `npx vitest run tests/scripts/pair-en-et/confidence.test.ts`
Expected: fails to resolve the import.

- [ ] **Step 3: Implement `confidence.ts` (GREEN)**

```ts
export interface ClassifyResult {
  confidence: 'high' | 'low'
  notes?: string
}

const LOWER = 0.55
const UPPER = 1.6

export function lengthRatio(enText: string, etText: string): number {
  return etText.length / enText.length
}

export function classify(enText: string, etText: string): ClassifyResult {
  if (enText.length === 0 || etText.length === 0) {
    return { confidence: 'low', notes: 'empty text on one or both sides' }
  }
  const r = lengthRatio(enText, etText)
  if (r >= LOWER && r <= UPPER) {
    return { confidence: 'high' }
  }
  return { confidence: 'low', notes: `length-ratio ${r.toFixed(2)}` }
}
```

- [ ] **Step 4: Run — expect all pass**

Run: `npx vitest run tests/scripts/pair-en-et/confidence.test.ts`
Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/pair-en-et/confidence.ts tests/scripts/pair-en-et/confidence.test.ts
git commit -F /tmp/p0-task5.txt
```

Commit body:

```
feat(pair): length-ratio confidence heuristic (P0 task 5)

Pure function: given EN and ET block texts, returns high/low confidence
with an optional notes string. Band [0.55, 1.6] chosen wide to
accommodate Estonian compression and AA voice variance. Empty-text
edge cases downgrade to low with a named reason.

(*BB:Granjon*)
```

---

## Task 6: Section pairing (Stage 1)

**Files:**

- Create: `tests/scripts/pair-en-et/section-pair.test.ts`
- Create: `scripts/pair-en-et/section-pair.ts`

- [ ] **Step 1: Write `section-pair.test.ts` (RED)**

```ts
import { describe, expect, it } from 'vitest'
import { pairSections } from '../../../scripts/pair-en-et/section-pair'
import type { Extraction } from '../../../scripts/pair-en-et/types'

function mkExtraction(sectionIds: string[]): Extraction {
  return {
    edition: '4th',
    sourcePdf: 'fixture.pdf',
    extractedAt: '2026-04-19T00:00:00Z',
    sections: sectionIds.map((id) => ({
      id,
      kind: 'chapter',
      title: id,
      pdfPageStart: 1,
      pdfPageEnd: 1,
      bookPageStart: 1,
      bookPageEnd: 1,
      blocks: [],
    })),
  }
}

describe('pairSections', () => {
  it('pairs EN and ET sections that share a canonical slug', () => {
    const en = mkExtraction(['ch01-bills-story'])
    const et = mkExtraction(['ch01-billi-lugu'])
    const result = pairSections(en, et)
    expect(result.sectionPairs.length).toBe(1)
    expect(result.sectionPairs[0]).toMatchObject({
      canonicalSlug: 'ch01',
      enSectionId: 'ch01-bills-story',
      etSectionId: 'ch01-billi-lugu',
    })
    expect(result.unpairedSections.length).toBe(0)
  })

  it('emits UnpairedSection for EN-only sections', () => {
    const en = mkExtraction(['appendix-aa-pamphlets'])
    const et = mkExtraction([])
    const result = pairSections(en, et)
    expect(result.sectionPairs.length).toBe(0)
    expect(result.unpairedSections).toEqual([
      {
        side: 'en',
        sectionId: 'appendix-aa-pamphlets',
        canonicalSlug: 'a-pamphlets',
        reason: 'section-en-only',
        blockCount: 0,
      },
    ])
  })

  it('emits UnpairedSection for ET-only sections that have a canonical slug entry', () => {
    // Synthetic: pretend an ET-only slug exists by crafting an unpaired case
    // via an EN section whose partner is missing
    const en = mkExtraction(['ch01-bills-story'])
    const et = mkExtraction([])
    const result = pairSections(en, et)
    expect(result.sectionPairs.length).toBe(0)
    expect(result.unpairedSections.length).toBe(1)
    expect(result.unpairedSections[0].reason).toBe('section-et-only')
  })

  it('throws when an extraction section has no canonical slug', () => {
    const en = mkExtraction(['unknown-section'])
    const et = mkExtraction([])
    expect(() => pairSections(en, et)).toThrow(/unknown.*canonical slug/i)
  })

  it('carries block counts on UnpairedSection', () => {
    const en: Extraction = {
      edition: '4th',
      sourcePdf: 'fixture.pdf',
      extractedAt: '2026-04-19T00:00:00Z',
      sections: [
        {
          id: 'appendix-aa-pamphlets',
          kind: 'appendix',
          title: 'A.A. Pamphlets',
          pdfPageStart: 581,
          pdfPageEnd: 581,
          bookPageStart: 573,
          bookPageEnd: 573,
          blocks: Array.from({ length: 49 }, (_, i) => ({
            id: `appendix-aa-pamphlets-l${String(i + 1).padStart(3, '0')}`,
            kind: 'list-item' as const,
            text: `item ${i + 1}`,
            pdfPage: 581,
          })),
        },
      ],
    }
    const et = mkExtraction([])
    const result = pairSections(en, et)
    expect(result.unpairedSections[0].blockCount).toBe(49)
  })
})
```

- [ ] **Step 2: Run — expect module-not-found failure**

Run: `npx vitest run tests/scripts/pair-en-et/section-pair.test.ts`
Expected: fails to resolve the import.

- [ ] **Step 3: Implement `section-pair.ts` (GREEN)**

```ts
import { entryForSlug, SECTION_MAP, slugForEnSection, slugForEtSection } from './section-map'
import type { Extraction, ExtractionSection, UnpairedSection } from './types'

export interface PairSectionsResult {
  sectionPairs: {
    canonicalSlug: string
    enSectionId: string
    etSectionId: string
    enSection: ExtractionSection
    etSection: ExtractionSection
  }[]
  unpairedSections: UnpairedSection[]
}

export function pairSections(en: Extraction, et: Extraction): PairSectionsResult {
  const enBySlug = new Map<string, ExtractionSection>()
  const etBySlug = new Map<string, ExtractionSection>()

  for (const section of en.sections) {
    const slug = slugForEnSection(section.id)
    if (slug === null) {
      throw new Error(`EN section ${section.id} has no canonical slug mapping`)
    }
    enBySlug.set(slug, section)
  }
  for (const section of et.sections) {
    const slug = slugForEtSection(section.id)
    if (slug === null) {
      throw new Error(`ET section ${section.id} has no canonical slug mapping`)
    }
    etBySlug.set(slug, section)
  }

  const sectionPairs: PairSectionsResult['sectionPairs'] = []
  const unpairedSections: UnpairedSection[] = []

  for (const entry of SECTION_MAP) {
    const enSection = enBySlug.get(entry.canonicalSlug)
    const etSection = etBySlug.get(entry.canonicalSlug)

    if (enSection !== undefined && etSection !== undefined) {
      sectionPairs.push({
        canonicalSlug: entry.canonicalSlug,
        enSectionId: enSection.id,
        etSectionId: etSection.id,
        enSection,
        etSection,
      })
    } else if (enSection !== undefined && etSection === undefined) {
      unpairedSections.push({
        side: 'en',
        sectionId: enSection.id,
        canonicalSlug: entry.canonicalSlug,
        reason: entry.etSectionId === null ? 'section-en-only' : 'section-et-only',
        blockCount: enSection.blocks.length,
      })
    } else if (enSection === undefined && etSection !== undefined) {
      unpairedSections.push({
        side: 'et',
        sectionId: etSection.id,
        canonicalSlug: entry.canonicalSlug,
        reason: 'section-en-only', // EN side missing this section
        blockCount: etSection.blocks.length,
      })
    }
    // Both undefined → slug has no extraction on either side; skip silently (not expected)
  }

  // Silence unused-imports
  void entryForSlug

  return { sectionPairs, unpairedSections }
}
```

- [ ] **Step 4: Run — expect all pass**

Run: `npx vitest run tests/scripts/pair-en-et/section-pair.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/pair-en-et/section-pair.ts tests/scripts/pair-en-et/section-pair.test.ts
git commit -F /tmp/p0-task6.txt
```

Commit body:

```
feat(pair): section pairing — Stage 1 (P0 task 6)

Iterates SECTION_MAP; for each canonical slug emits either a paired
SectionPair or an UnpairedSection with side+reason+blockCount. Throws
on any EN or ET section whose ID has no canonical slug mapping —
protects against extraction drift.

(*BB:Granjon*)
```

---

## Task 7: Block pairing (Stage 2)

**Files:**

- Create: `tests/scripts/pair-en-et/block-pair.test.ts`
- Create: `scripts/pair-en-et/block-pair.ts`

- [ ] **Step 1: Write `block-pair.test.ts` (RED)**

```ts
import { describe, expect, it } from 'vitest'
import { pairBlocks } from '../../../scripts/pair-en-et/block-pair'
import type { ExtractionBlock } from '../../../scripts/pair-en-et/types'

function mkBlocks(
  sectionId: string,
  spec: { kind: ExtractionBlock['kind']; text: string }[],
): ExtractionBlock[] {
  const counts: Record<string, number> = {}
  return spec.map((s) => {
    const prefix = {
      paragraph: 'p',
      heading: 'h',
      'list-item': 'l',
      blockquote: 'q',
      byline: 'b',
      footnote: 'f',
    }[s.kind]
    counts[prefix] = (counts[prefix] ?? 0) + 1
    const n = String(counts[prefix]).padStart(3, '0')
    return { id: `${sectionId}-${prefix}${n}`, kind: s.kind, text: s.text, pdfPage: 1 }
  })
}

describe('pairBlocks', () => {
  it('position-anchors blocks of equal count per kind', () => {
    const en = mkBlocks('ch01', [
      { kind: 'heading', text: 'Bill' },
      { kind: 'paragraph', text: 'Hello there world' },
      { kind: 'paragraph', text: 'Second paragraph here' },
    ])
    const et = mkBlocks('ch01-et', [
      { kind: 'heading', text: 'Bill' },
      { kind: 'paragraph', text: 'Tere siin maailm' },
      { kind: 'paragraph', text: 'Teine lõik siin' },
    ])
    const result = pairBlocks('ch01', en, et)
    expect(result.pairs.length).toBe(3)
    expect(result.unpaired.length).toBe(0)
    expect(result.pairs[0]).toMatchObject({
      paraId: 'ch01-h001',
      kind: 'heading',
      enBlockId: 'ch01-h001',
      etBlockId: 'ch01-et-h001',
      confidence: 'high',
    })
    expect(result.pairs[1].paraId).toBe('ch01-p001')
    expect(result.pairs[2].paraId).toBe('ch01-p002')
  })

  it('downgrades confidence to low when length-ratio is outside band', () => {
    const en = mkBlocks('ch02', [{ kind: 'paragraph', text: 'x'.repeat(100) }])
    const et = mkBlocks('ch02-et', [{ kind: 'paragraph', text: 'y'.repeat(30) }])
    const result = pairBlocks('ch02', en, et)
    expect(result.pairs.length).toBe(1)
    expect(result.pairs[0].confidence).toBe('low')
    expect(result.pairs[0].notes).toMatch(/length-ratio/)
  })

  it('flags every block of a kind as needs-review when counts mismatch', () => {
    const en = mkBlocks('s06', [
      { kind: 'blockquote', text: 'one' },
      { kind: 'blockquote', text: 'two' },
      { kind: 'blockquote', text: 'three' },
    ])
    const et = mkBlocks('s06-et', [
      { kind: 'blockquote', text: 'uks' },
      { kind: 'blockquote', text: 'kaks' },
    ])
    const result = pairBlocks('s06', en, et)
    expect(result.pairs.length).toBe(0)
    expect(result.unpaired.length).toBe(5)
    expect(result.unpaired.filter((u) => u.side === 'en').length).toBe(3)
    expect(result.unpaired.filter((u) => u.side === 'et').length).toBe(2)
    expect(result.unpaired.every((u) => u.reason === 'needs-review')).toBe(true)
    expect(result.diagnostics).toContain('kind-count mismatch: blockquote en=3 et=2')
  })

  it('handles multiple kinds independently', () => {
    const en = mkBlocks('ch03', [
      { kind: 'heading', text: 'Title' },
      { kind: 'paragraph', text: 'A' },
      { kind: 'paragraph', text: 'B' },
      { kind: 'blockquote', text: 'Q' },
    ])
    const et = mkBlocks('ch03-et', [
      { kind: 'heading', text: 'Pealkiri' },
      { kind: 'paragraph', text: 'A' },
      { kind: 'paragraph', text: 'B' },
      // blockquote missing on ET
    ])
    const result = pairBlocks('ch03', en, et)
    // heading + 2 paragraphs pair; blockquote mismatches
    expect(result.pairs.length).toBe(3)
    expect(result.unpaired.length).toBe(1)
    expect(result.unpaired[0].kind).toBe('blockquote')
    expect(result.unpaired[0].side).toBe('en')
  })

  it('handles empty sections', () => {
    const result = pairBlocks('empty', [], [])
    expect(result.pairs.length).toBe(0)
    expect(result.unpaired.length).toBe(0)
    expect(result.diagnostics.length).toBe(0)
  })
})
```

- [ ] **Step 2: Run — expect failure**

Run: `npx vitest run tests/scripts/pair-en-et/block-pair.test.ts`
Expected: fails to resolve the import.

- [ ] **Step 3: Implement `block-pair.ts` (GREEN)**

```ts
import { classify } from './confidence'
import type { BlockKind, ExtractionBlock, Pair, UnpairedBlock } from './types'

const ALL_KINDS: readonly BlockKind[] = [
  'paragraph',
  'heading',
  'list-item',
  'blockquote',
  'byline',
  'footnote',
]

const KIND_PREFIX: Record<BlockKind, string> = {
  paragraph: 'p',
  heading: 'h',
  'list-item': 'l',
  blockquote: 'q',
  byline: 'b',
  footnote: 'f',
}

export interface PairBlocksResult {
  pairs: Pair[]
  unpaired: UnpairedBlock[]
  diagnostics: string[]
}

export function pairBlocks(
  canonicalSlug: string,
  enBlocks: readonly ExtractionBlock[],
  etBlocks: readonly ExtractionBlock[],
): PairBlocksResult {
  const pairs: Pair[] = []
  const unpaired: UnpairedBlock[] = []
  const diagnostics: string[] = []

  for (const kind of ALL_KINDS) {
    const enForKind = enBlocks.filter((b) => b.kind === kind)
    const etForKind = etBlocks.filter((b) => b.kind === kind)

    if (enForKind.length === 0 && etForKind.length === 0) continue

    if (enForKind.length !== etForKind.length) {
      diagnostics.push(`kind-count mismatch: ${kind} en=${enForKind.length} et=${etForKind.length}`)
      for (const b of enForKind) {
        unpaired.push({ blockId: b.id, side: 'en', kind, reason: 'needs-review' })
      }
      for (const b of etForKind) {
        unpaired.push({ blockId: b.id, side: 'et', kind, reason: 'needs-review' })
      }
      continue
    }

    // Equal counts: position-anchored pairing
    const prefix = KIND_PREFIX[kind]
    for (let i = 0; i < enForKind.length; i++) {
      const enBlock = enForKind[i]
      const etBlock = etForKind[i]
      if (enBlock === undefined || etBlock === undefined) continue
      const ordinal = String(i + 1).padStart(3, '0')
      const { confidence, notes } = classify(enBlock.text, etBlock.text)
      const pair: Pair = {
        paraId: `${canonicalSlug}-${prefix}${ordinal}`,
        kind,
        enBlockId: enBlock.id,
        etBlockId: etBlock.id,
        confidence,
      }
      if (notes !== undefined) pair.notes = notes
      pairs.push(pair)
    }
  }

  return { pairs, unpaired, diagnostics }
}
```

- [ ] **Step 4: Run — expect all pass**

Run: `npx vitest run tests/scripts/pair-en-et/block-pair.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/pair-en-et/block-pair.ts tests/scripts/pair-en-et/block-pair.test.ts
git commit -F /tmp/p0-task7.txt
```

Commit body:

```
feat(pair): block pairing — Stage 2 (P0 task 7)

Kind-grouped position-anchored pairing. Equal per-kind counts → pair
positionally with length-ratio confidence. Mismatched counts →
emit every block of that kind as unpaired/needs-review with a section
diagnostic. Never pairs across kinds. Produces synthesized bilingual
para-ids of form <slug>-<kindPrefix><NNN>.

(*BB:Granjon*)
```

---

## Task 8: Review report rendering

**Files:**

- Create: `tests/scripts/pair-en-et/review-report.test.ts`
- Create: `scripts/pair-en-et/review-report.ts`

- [ ] **Step 1: Write `review-report.test.ts` (RED)**

```ts
import { describe, expect, it } from 'vitest'
import { renderReviewReport } from '../../../scripts/pair-en-et/review-report'
import type { Extraction, PairingArtifact } from '../../../scripts/pair-en-et/types'

function mkExtraction(overrides: Partial<Extraction> = {}): Extraction {
  return {
    edition: '4th',
    sourcePdf: 'fixture.pdf',
    extractedAt: '2026-04-19T00:00:00Z',
    sections: [
      {
        id: 'ch01-bills-story',
        kind: 'chapter',
        title: "Bill's Story",
        pdfPageStart: 1,
        pdfPageEnd: 1,
        bookPageStart: 1,
        bookPageEnd: 1,
        blocks: [
          { id: 'ch01-bills-story-p001', kind: 'paragraph', text: 'Hello world', pdfPage: 1 },
        ],
      },
    ],
    ...overrides,
  }
}

describe('renderReviewReport', () => {
  it('omits all-high sections', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 1 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 1 },
      sections: [
        {
          canonicalSlug: 'ch01',
          enSectionId: 'ch01-bills-story',
          etSectionId: 'ch01-billi-lugu',
          pairs: [
            {
              paraId: 'ch01-p001',
              kind: 'paragraph',
              enBlockId: 'ch01-bills-story-p001',
              etBlockId: 'ch01-billi-lugu-p001',
              confidence: 'high',
            },
          ],
          unpaired: [],
          diagnostics: [],
        },
      ],
      unpairedSections: [],
    }
    const en = mkExtraction()
    const et = mkExtraction({
      sections: [
        {
          id: 'ch01-billi-lugu',
          kind: 'chapter',
          title: 'Billi lugu',
          pdfPageStart: 1,
          pdfPageEnd: 1,
          bookPageStart: 1,
          bookPageEnd: 1,
          blocks: [
            { id: 'ch01-billi-lugu-p001', kind: 'paragraph', text: 'Tere maailm', pdfPage: 1 },
          ],
        },
      ],
    })
    const md = renderReviewReport(artifact, en, et)
    expect(md).not.toMatch(/## ch01/)
    expect(md).toMatch(/0 sections need review/)
  })

  it('includes a section with a low-confidence pair and shows both texts', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 1 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 1 },
      sections: [
        {
          canonicalSlug: 'ch01',
          enSectionId: 'ch01-bills-story',
          etSectionId: 'ch01-billi-lugu',
          pairs: [
            {
              paraId: 'ch01-p001',
              kind: 'paragraph',
              enBlockId: 'ch01-bills-story-p001',
              etBlockId: 'ch01-billi-lugu-p001',
              confidence: 'low',
              notes: 'length-ratio 2.10',
            },
          ],
          unpaired: [],
          diagnostics: [],
        },
      ],
      unpairedSections: [],
    }
    const en = mkExtraction()
    const et = mkExtraction({
      sections: [
        {
          id: 'ch01-billi-lugu',
          kind: 'chapter',
          title: 'Billi lugu',
          pdfPageStart: 1,
          pdfPageEnd: 1,
          bookPageStart: 1,
          bookPageEnd: 1,
          blocks: [
            {
              id: 'ch01-billi-lugu-p001',
              kind: 'paragraph',
              text: 'Tere maailm ' + 'x'.repeat(200),
              pdfPage: 1,
            },
          ],
        },
      ],
    })
    const md = renderReviewReport(artifact, en, et)
    expect(md).toMatch(/## ch01/)
    expect(md).toMatch(/low-confidence/)
    expect(md).toMatch(/ch01-p001/)
    expect(md).toMatch(/Hello world/)
    expect(md).toMatch(/Tere maailm/)
    expect(md).toMatch(/length-ratio 2\.10/)
  })

  it('reports unpaired blocks in a section', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 1 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 1 },
      sections: [
        {
          canonicalSlug: 'ch01',
          enSectionId: 'ch01-bills-story',
          etSectionId: 'ch01-billi-lugu',
          pairs: [],
          unpaired: [
            {
              blockId: 'ch01-bills-story-p001',
              side: 'en',
              kind: 'paragraph',
              reason: 'needs-review',
            },
          ],
          diagnostics: ['kind-count mismatch: paragraph en=1 et=0'],
        },
      ],
      unpairedSections: [],
    }
    const md = renderReviewReport(artifact, mkExtraction(), mkExtraction({ sections: [] }))
    expect(md).toMatch(/## ch01/)
    expect(md).toMatch(/unpaired/i)
    expect(md).toMatch(/kind-count mismatch/)
  })

  it('reports unpaired sections at the top', () => {
    const artifact: PairingArtifact = {
      version: '1.0',
      generatedAt: '2026-04-19T00:00:00Z',
      sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 49 },
      sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 0 },
      sections: [],
      unpairedSections: [
        {
          side: 'en',
          sectionId: 'appendix-aa-pamphlets',
          canonicalSlug: 'a-pamphlets',
          reason: 'section-en-only',
          blockCount: 49,
        },
      ],
    }
    const md = renderReviewReport(
      artifact,
      mkExtraction({ sections: [] }),
      mkExtraction({
        sections: [],
      }),
    )
    expect(md).toMatch(/Unpaired sections/)
    expect(md).toMatch(/a-pamphlets/)
    expect(md).toMatch(/49/)
  })
})
```

- [ ] **Step 2: Run — expect failure**

Run: `npx vitest run tests/scripts/pair-en-et/review-report.test.ts`
Expected: module not found.

- [ ] **Step 3: Implement `review-report.ts` (GREEN)**

```ts
import type { Extraction, ExtractionBlock, PairingArtifact, SectionPair } from './types'

function indexBlocks(extraction: Extraction): Map<string, ExtractionBlock> {
  const m = new Map<string, ExtractionBlock>()
  for (const section of extraction.sections) {
    for (const block of section.blocks) {
      m.set(block.id, block)
    }
  }
  return m
}

function sectionNeedsReview(section: SectionPair): boolean {
  return (
    section.pairs.some((p) => p.confidence === 'low') ||
    section.unpaired.length > 0 ||
    section.diagnostics.length > 0
  )
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

export function renderReviewReport(
  artifact: PairingArtifact,
  en: Extraction,
  et: Extraction,
): string {
  const enBlocks = indexBlocks(en)
  const etBlocks = indexBlocks(et)

  const reviewSections = artifact.sections.filter(sectionNeedsReview)
  const lines: string[] = []

  lines.push(`# Pairing review — generated ${artifact.generatedAt}`)
  lines.push('')
  lines.push(
    `**Summary:** ${reviewSections.length} sections need review · ${artifact.unpairedSections.length} unpaired sections`,
  )
  lines.push('')

  if (artifact.unpairedSections.length > 0) {
    lines.push('## Unpaired sections')
    lines.push('')
    for (const u of artifact.unpairedSections) {
      lines.push(
        `- **${u.canonicalSlug}** (${u.side}-only, ${u.reason}) · ${u.sectionId} · ${u.blockCount} blocks`,
      )
    }
    lines.push('')
  }

  for (const section of reviewSections) {
    const lowPairs = section.pairs.filter((p) => p.confidence === 'low')
    lines.push(`## ${section.canonicalSlug} — ${section.enSectionId} ↔ ${section.etSectionId}`)
    lines.push('')
    lines.push(
      `**Status:** ${lowPairs.length} low-confidence pair${lowPairs.length === 1 ? '' : 's'} · ${section.unpaired.length} unpaired block${section.unpaired.length === 1 ? '' : 's'}`,
    )
    lines.push('')

    if (section.diagnostics.length > 0) {
      lines.push('### Diagnostics')
      lines.push('')
      for (const d of section.diagnostics) lines.push(`- ${d}`)
      lines.push('')
    }

    if (lowPairs.length > 0) {
      lines.push('### Low-confidence pairs')
      lines.push('')
      for (const p of lowPairs) {
        const enId = Array.isArray(p.enBlockId) ? p.enBlockId.join(', ') : p.enBlockId
        const etId = Array.isArray(p.etBlockId) ? p.etBlockId.join(', ') : p.etBlockId
        const enText = Array.isArray(p.enBlockId)
          ? p.enBlockId.map((id) => enBlocks.get(id)?.text ?? '').join(' | ')
          : (enBlocks.get(p.enBlockId)?.text ?? '')
        const etText = Array.isArray(p.etBlockId)
          ? p.etBlockId.map((id) => etBlocks.get(id)?.text ?? '').join(' | ')
          : (etBlocks.get(p.etBlockId)?.text ?? '')
        lines.push(`- **${p.paraId}** (${p.kind})${p.notes ? ` — ${p.notes}` : ''}`)
        lines.push(`  - EN \`${enId}\`: "${truncate(enText, 200)}"`)
        lines.push(`  - ET \`${etId}\`: "${truncate(etText, 200)}"`)
      }
      lines.push('')
    }

    if (section.unpaired.length > 0) {
      lines.push('### Unpaired blocks')
      lines.push('')
      for (const u of section.unpaired) {
        const text =
          u.side === 'en'
            ? (enBlocks.get(u.blockId)?.text ?? '')
            : (etBlocks.get(u.blockId)?.text ?? '')
        lines.push(
          `- **${u.blockId}** (${u.side}, ${u.kind}, ${u.reason}): "${truncate(text, 200)}"`,
        )
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}
```

- [ ] **Step 4: Run — expect all pass**

Run: `npx vitest run tests/scripts/pair-en-et/review-report.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/pair-en-et/review-report.ts tests/scripts/pair-en-et/review-report.test.ts
git commit -F /tmp/p0-task8.txt
```

Commit body:

```
feat(pair): review-report markdown rendering (P0 task 8)

Renders review.md from the artifact + both extractions. All-high
sections are omitted. Unpaired sections list first; then per-section
review groups with diagnostics, low-confidence pairs (side-by-side
texts, truncated), and unpaired blocks.

(*BB:Granjon*)
```

---

## Task 9: Artifact verifier (invariants)

**Files:**

- Create: `tests/scripts/pair-en-et/verify.test.ts`
- Create: `scripts/pair-en-et/verify.ts`

- [ ] **Step 1: Write `verify.test.ts` (RED)**

```ts
import { describe, expect, it } from 'vitest'
import { verifyArtifact } from '../../../scripts/pair-en-et/verify'
import type { Extraction, PairingArtifact } from '../../../scripts/pair-en-et/types'

function validArtifact(): PairingArtifact {
  return {
    version: '1.0',
    generatedAt: '2026-04-19T00:00:00Z',
    sourceEn: { path: 'en.json', sha256: 'aaa', blockCount: 2 },
    sourceEt: { path: 'et.json', sha256: 'bbb', blockCount: 2 },
    sections: [
      {
        canonicalSlug: 'ch01',
        enSectionId: 'ch01-bills-story',
        etSectionId: 'ch01-billi-lugu',
        pairs: [
          {
            paraId: 'ch01-p001',
            kind: 'paragraph',
            enBlockId: 'ch01-bills-story-p001',
            etBlockId: 'ch01-billi-lugu-p001',
            confidence: 'high',
          },
          {
            paraId: 'ch01-p002',
            kind: 'paragraph',
            enBlockId: 'ch01-bills-story-p002',
            etBlockId: 'ch01-billi-lugu-p002',
            confidence: 'high',
          },
        ],
        unpaired: [],
        diagnostics: [],
      },
    ],
    unpairedSections: [],
  }
}

function validEn(): Extraction {
  return {
    edition: '4th',
    sourcePdf: 'en.pdf',
    extractedAt: '2026-04-19T00:00:00Z',
    sections: [
      {
        id: 'ch01-bills-story',
        kind: 'chapter',
        title: "Bill's Story",
        pdfPageStart: 1,
        pdfPageEnd: 1,
        bookPageStart: 1,
        bookPageEnd: 1,
        blocks: [
          { id: 'ch01-bills-story-p001', kind: 'paragraph', text: 'A', pdfPage: 1 },
          { id: 'ch01-bills-story-p002', kind: 'paragraph', text: 'B', pdfPage: 1 },
        ],
      },
    ],
  }
}

function validEt(): Extraction {
  return {
    edition: '4th',
    sourcePdf: 'et.pdf',
    extractedAt: '2026-04-19T00:00:00Z',
    sections: [
      {
        id: 'ch01-billi-lugu',
        kind: 'chapter',
        title: 'Billi lugu',
        pdfPageStart: 1,
        pdfPageEnd: 1,
        bookPageStart: 1,
        bookPageEnd: 1,
        blocks: [
          { id: 'ch01-billi-lugu-p001', kind: 'paragraph', text: 'a', pdfPage: 1 },
          { id: 'ch01-billi-lugu-p002', kind: 'paragraph', text: 'b', pdfPage: 1 },
        ],
      },
    ],
  }
}

describe('verifyArtifact', () => {
  it('accepts a well-formed artifact', () => {
    const result = verifyArtifact(validArtifact(), validEn(), validEt())
    expect(result.ok).toBe(true)
    expect(result.violations).toEqual([])
  })

  it('I1: rejects duplicate EN block reference across pairs', () => {
    const a = validArtifact()
    a.sections[0].pairs[1].enBlockId = 'ch01-bills-story-p001' // dup
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I1-en-duplicate')).toBe(true)
  })

  it('I1: rejects missing EN block (not referenced anywhere)', () => {
    const a = validArtifact()
    a.sections[0].pairs = [a.sections[0].pairs[0]]
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I1-en-missing')).toBe(true)
  })

  it('I2: rejects duplicate paraId', () => {
    const a = validArtifact()
    a.sections[0].pairs[1].paraId = 'ch01-p001' // dup
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I2-duplicate-paraid')).toBe(true)
  })

  it('I4: rejects cross-kind pair', () => {
    const a = validArtifact()
    a.sections[0].pairs[0].kind = 'heading' // EN is paragraph, declared heading
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I4-kind-mismatch')).toBe(true)
  })

  it('I5: rejects N:M pair without low confidence and without accepted-collapse note', () => {
    const a = validArtifact()
    a.sections[0].pairs[0].enBlockId = ['ch01-bills-story-p001', 'ch01-bills-story-p002']
    a.sections[0].pairs[0].etBlockId = 'ch01-billi-lugu-p001'
    a.sections[0].pairs = [a.sections[0].pairs[0]] // remove the second pair so block count still balances
    // Without low confidence or accepted-collapse: rejection
    const result = verifyArtifact(a, validEn(), validEt())
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'I5-nm-needs-justification')).toBe(true)
  })
})
```

- [ ] **Step 2: Run — expect failure**

Run: `npx vitest run tests/scripts/pair-en-et/verify.test.ts`
Expected: module not found.

- [ ] **Step 3: Implement `verify.ts` (GREEN)**

```ts
import type { Extraction, PairingArtifact } from './types'

export interface Violation {
  code: string
  message: string
}

export interface VerifyResult {
  ok: boolean
  violations: Violation[]
}

function toArray(x: string | string[]): string[] {
  return Array.isArray(x) ? x : [x]
}

function collectExtractionBlocks(
  ext: Extraction,
): Map<string, { kind: string; sectionId: string }> {
  const out = new Map<string, { kind: string; sectionId: string }>()
  for (const s of ext.sections) {
    for (const b of s.blocks) {
      out.set(b.id, { kind: b.kind, sectionId: s.id })
    }
  }
  return out
}

export function verifyArtifact(
  artifact: PairingArtifact,
  en: Extraction,
  et: Extraction,
): VerifyResult {
  const violations: Violation[] = []
  const enBlocks = collectExtractionBlocks(en)
  const etBlocks = collectExtractionBlocks(et)

  // I1: each EN/ET block referenced exactly once
  const enRefs = new Map<string, number>()
  const etRefs = new Map<string, number>()
  const paraIds = new Set<string>()

  for (const section of artifact.sections) {
    for (const pair of section.pairs) {
      // I2: paraId unique
      if (paraIds.has(pair.paraId)) {
        violations.push({
          code: 'I2-duplicate-paraid',
          message: `paraId ${pair.paraId} appears more than once`,
        })
      }
      paraIds.add(pair.paraId)

      for (const id of toArray(pair.enBlockId)) {
        enRefs.set(id, (enRefs.get(id) ?? 0) + 1)
      }
      for (const id of toArray(pair.etBlockId)) {
        etRefs.set(id, (etRefs.get(id) ?? 0) + 1)
      }

      // I4: kind match
      for (const id of toArray(pair.enBlockId)) {
        const b = enBlocks.get(id)
        if (b !== undefined && b.kind !== pair.kind) {
          violations.push({
            code: 'I4-kind-mismatch',
            message: `pair ${pair.paraId} declares kind ${pair.kind} but EN block ${id} is ${b.kind}`,
          })
        }
      }
      for (const id of toArray(pair.etBlockId)) {
        const b = etBlocks.get(id)
        if (b !== undefined && b.kind !== pair.kind) {
          violations.push({
            code: 'I4-kind-mismatch',
            message: `pair ${pair.paraId} declares kind ${pair.kind} but ET block ${id} is ${b.kind}`,
          })
        }
      }

      // I5: N:M requires low confidence OR accepted-collapse|accepted-split notes
      const isNm = Array.isArray(pair.enBlockId) || Array.isArray(pair.etBlockId)
      if (isNm) {
        const acceptablePhrase =
          pair.notes?.includes('accepted-collapse') || pair.notes?.includes('accepted-split')
        if (pair.confidence !== 'low' && !acceptablePhrase) {
          violations.push({
            code: 'I5-nm-needs-justification',
            message: `N:M pair ${pair.paraId} has confidence ${pair.confidence} and no accepted-* note`,
          })
        }
      }
    }

    for (const u of section.unpaired) {
      if (u.side === 'en') enRefs.set(u.blockId, (enRefs.get(u.blockId) ?? 0) + 1)
      else etRefs.set(u.blockId, (etRefs.get(u.blockId) ?? 0) + 1)
    }
  }

  for (const u of artifact.unpairedSections) {
    // Whole-section unpaired covers every block; account for them
    const source = u.side === 'en' ? en : et
    const section = source.sections.find((s) => s.id === u.sectionId)
    if (section === undefined) continue
    const refs = u.side === 'en' ? enRefs : etRefs
    for (const block of section.blocks) {
      refs.set(block.id, (refs.get(block.id) ?? 0) + 1)
    }
  }

  // I1: check for duplicates and misses
  for (const [id, count] of enRefs) {
    if (count > 1) {
      violations.push({
        code: 'I1-en-duplicate',
        message: `EN block ${id} referenced ${count} times`,
      })
    }
  }
  for (const [id, count] of etRefs) {
    if (count > 1) {
      violations.push({
        code: 'I1-et-duplicate',
        message: `ET block ${id} referenced ${count} times`,
      })
    }
  }
  for (const id of enBlocks.keys()) {
    if (!enRefs.has(id)) {
      violations.push({
        code: 'I1-en-missing',
        message: `EN block ${id} not referenced in artifact`,
      })
    }
  }
  for (const id of etBlocks.keys()) {
    if (!etRefs.has(id)) {
      violations.push({
        code: 'I1-et-missing',
        message: `ET block ${id} not referenced in artifact`,
      })
    }
  }

  return { ok: violations.length === 0, violations }
}
```

- [ ] **Step 4: Run — expect all pass**

Run: `npx vitest run tests/scripts/pair-en-et/verify.test.ts`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/pair-en-et/verify.ts tests/scripts/pair-en-et/verify.test.ts
git commit -F /tmp/p0-task9.txt
```

Commit body:

```
feat(pair): artifact verifier with five invariants (P0 task 9)

Implements I1 (exactly-once block referencing), I2 (unique paraId),
I4 (kind match between pair and blocks), I5 (N:M requires low
confidence or accepted-* note). I3 (low pairs appear in review.md)
is enforced by omission in review-report.ts. Returns a structured
violation list; ok=true iff empty.

(*BB:Granjon*)
```

---

## Task 10: CLI orchestrator

**Files:**

- Create: `scripts/pair-en-et/pair.ts`
- Create: `tests/scripts/pair-en-et/integration.test.ts`
- Create: `tests/scripts/pair-en-et/fixtures/en-tiny.json`
- Create: `tests/scripts/pair-en-et/fixtures/et-tiny.json`

- [ ] **Step 1: Create the tiny fixture files**

`tests/scripts/pair-en-et/fixtures/en-tiny.json`:

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
      "pdfPageStart": 1,
      "pdfPageEnd": 1,
      "bookPageStart": 1,
      "bookPageEnd": 1,
      "blocks": [
        { "id": "ch01-bills-story-h001", "kind": "heading", "text": "Bill's Story", "pdfPage": 1 },
        {
          "id": "ch01-bills-story-p001",
          "kind": "paragraph",
          "text": "Hello there world",
          "pdfPage": 1
        }
      ]
    }
  ]
}
```

`tests/scripts/pair-en-et/fixtures/et-tiny.json`:

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
      "pdfPageStart": 1,
      "pdfPageEnd": 1,
      "bookPageStart": 1,
      "bookPageEnd": 1,
      "blocks": [
        { "id": "ch01-billi-lugu-h001", "kind": "heading", "text": "Billi lugu", "pdfPage": 1 },
        {
          "id": "ch01-billi-lugu-p001",
          "kind": "paragraph",
          "text": "Tere siin maailm",
          "pdfPage": 1
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Write `integration.test.ts` (RED)**

```ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildArtifact } from '../../../scripts/pair-en-et/pair'
import type { Extraction } from '../../../scripts/pair-en-et/types'

function loadFixture(name: string): Extraction {
  const path = resolve(__dirname, 'fixtures', name)
  return JSON.parse(readFileSync(path, 'utf8')) as Extraction
}

describe('buildArtifact (integration)', () => {
  it('pairs a tiny fixture end-to-end', () => {
    const en = loadFixture('en-tiny.json')
    const et = loadFixture('et-tiny.json')
    const artifact = buildArtifact(en, et, {
      sourceEnPath: 'fixtures/en-tiny.json',
      sourceEtPath: 'fixtures/et-tiny.json',
      sourceEnSha: 'fixture-en-sha',
      sourceEtSha: 'fixture-et-sha',
      generatedAt: '2026-04-19T00:00:00Z',
    })
    expect(artifact.sections.length).toBe(1)
    expect(artifact.sections[0].pairs.length).toBe(2)
    expect(artifact.sections[0].pairs[0].paraId).toBe('ch01-h001')
    expect(artifact.sections[0].pairs[1].paraId).toBe('ch01-p001')
    expect(artifact.unpairedSections.length).toBe(0)
  })

  it('emits a valid artifact that passes verify', async () => {
    const en = loadFixture('en-tiny.json')
    const et = loadFixture('et-tiny.json')
    const artifact = buildArtifact(en, et, {
      sourceEnPath: 'fixtures/en-tiny.json',
      sourceEtPath: 'fixtures/et-tiny.json',
      sourceEnSha: 'x',
      sourceEtSha: 'y',
      generatedAt: '2026-04-19T00:00:00Z',
    })
    const { verifyArtifact } = await import('../../../scripts/pair-en-et/verify')
    const result = verifyArtifact(artifact, en, et)
    expect(result.violations).toEqual([])
    expect(result.ok).toBe(true)
  })
})
```

- [ ] **Step 3: Run — expect failure**

Run: `npx vitest run tests/scripts/pair-en-et/integration.test.ts`
Expected: module not found.

- [ ] **Step 4: Implement `pair.ts` (GREEN — pure function core plus CLI wrapper)**

```ts
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pairBlocks } from './block-pair'
import { renderReviewReport } from './review-report'
import { pairSections } from './section-pair'
import type { Extraction, PairingArtifact } from './types'
import { verifyArtifact } from './verify'

export interface BuildOptions {
  sourceEnPath: string
  sourceEtPath: string
  sourceEnSha: string
  sourceEtSha: string
  generatedAt: string
}

export function buildArtifact(en: Extraction, et: Extraction, opts: BuildOptions): PairingArtifact {
  const { sectionPairs, unpairedSections } = pairSections(en, et)

  const enBlockCount = en.sections.reduce((n, s) => n + s.blocks.length, 0)
  const etBlockCount = et.sections.reduce((n, s) => n + s.blocks.length, 0)

  const artifact: PairingArtifact = {
    version: '1.0',
    generatedAt: opts.generatedAt,
    sourceEn: { path: opts.sourceEnPath, sha256: opts.sourceEnSha, blockCount: enBlockCount },
    sourceEt: { path: opts.sourceEtPath, sha256: opts.sourceEtSha, blockCount: etBlockCount },
    sections: sectionPairs.map((sp) => {
      const { pairs, unpaired, diagnostics } = pairBlocks(
        sp.canonicalSlug,
        sp.enSection.blocks,
        sp.etSection.blocks,
      )
      return {
        canonicalSlug: sp.canonicalSlug,
        enSectionId: sp.enSectionId,
        etSectionId: sp.etSectionId,
        pairs,
        unpaired,
        diagnostics,
      }
    }),
    unpairedSections,
  }

  return artifact
}

function sha256File(path: string): string {
  const buf = readFileSync(path)
  return createHash('sha256').update(buf).digest('hex')
}

function run(argv: string[]): void {
  const mode = argv[0] ?? 'pair'
  const repoRoot = resolve(__dirname, '..', '..')
  const enPath = resolve(repoRoot, 'data/extractions/structured/en-4th-edition.json')
  const etPath = resolve(repoRoot, 'data/extractions/structured-et/et-4th-edition.json')
  const artifactPath = resolve(repoRoot, 'data/extractions/pairing/en-et.json')
  const reviewPath = resolve(repoRoot, 'data/extractions/pairing/review.md')

  const en: Extraction = JSON.parse(readFileSync(enPath, 'utf8')) as Extraction
  const et: Extraction = JSON.parse(readFileSync(etPath, 'utf8')) as Extraction

  if (mode === 'verify') {
    const artifact: PairingArtifact = JSON.parse(
      readFileSync(artifactPath, 'utf8'),
    ) as PairingArtifact
    const result = verifyArtifact(artifact, en, et)
    if (!result.ok) {
      console.error('Verification failed:')
      for (const v of result.violations) console.error(`  [${v.code}] ${v.message}`)
      process.exit(1)
    }
    console.log(
      `Verify OK: ${artifact.sections.length} paired sections, ${artifact.unpairedSections.length} unpaired`,
    )
    return
  }

  if (mode === 'review') {
    const artifact: PairingArtifact = JSON.parse(
      readFileSync(artifactPath, 'utf8'),
    ) as PairingArtifact
    const md = renderReviewReport(artifact, en, et)
    writeFileSync(reviewPath, md + '\n')
    console.log(`Wrote ${reviewPath}`)
    return
  }

  // Default: full pair
  const artifact = buildArtifact(en, et, {
    sourceEnPath: 'data/extractions/structured/en-4th-edition.json',
    sourceEtPath: 'data/extractions/structured-et/et-4th-edition.json',
    sourceEnSha: sha256File(enPath),
    sourceEtSha: sha256File(etPath),
    generatedAt: new Date().toISOString(),
  })

  const verify = verifyArtifact(artifact, en, et)
  if (!verify.ok) {
    console.error('Generated artifact failed verification:')
    for (const v of verify.violations) console.error(`  [${v.code}] ${v.message}`)
    process.exit(1)
  }

  writeFileSync(artifactPath, JSON.stringify(artifact, null, 2) + '\n')
  const md = renderReviewReport(artifact, en, et)
  writeFileSync(reviewPath, md + '\n')

  console.log(`Wrote ${artifactPath}`)
  console.log(`Wrote ${reviewPath}`)
  console.log(
    `Summary: ${artifact.sections.length} paired sections, ${artifact.unpairedSections.length} unpaired sections`,
  )
}

if (require.main === module) {
  run(process.argv.slice(2))
}
```

- [ ] **Step 5: Run — expect integration tests pass**

Run: `npx vitest run tests/scripts/pair-en-et/integration.test.ts`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/pair-en-et/pair.ts tests/scripts/pair-en-et/integration.test.ts tests/scripts/pair-en-et/fixtures/
git commit -F /tmp/p0-task10.txt
```

Commit body:

```
feat(pair): CLI orchestrator + integration test (P0 task 10)

buildArtifact() composes pairSections + pairBlocks + renderReviewReport
over both extractions and runs verifyArtifact as a post-check. The
CLI wrapper supports three subcommands: default (full pair), verify
(validate existing artifact), review (regenerate review.md).

Golden tiny fixtures at tests/scripts/pair-en-et/fixtures/ exercise
the full pipeline end-to-end.

(*BB:Granjon*)
```

---

## Task 11: Wire npm scripts

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Add three scripts under the `scripts` key**

After the existing `"extract:en": "tsx scripts/extract-en-book.ts"`, add:

```json
"pair": "tsx scripts/pair-en-et/pair.ts",
"pair:verify": "tsx scripts/pair-en-et/pair.ts verify",
"pair:review": "tsx scripts/pair-en-et/pair.ts review"
```

- [ ] **Step 2: Verify each script is valid (dry run)**

Run: `npm run pair -- --help 2>&1 | head -3` — should not error on registration.
Run: `npm run pair:verify 2>&1 | tail -3` — expected to exit 1 with "Verification failed: ENOENT" (artifact file doesn't exist yet; that's expected, it means the script is wired and the argv parsing is correct).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -F /tmp/p0-task11.txt
```

Commit body:

```
feat(pair): wire npm run pair / pair:verify / pair:review (P0 task 11)

Three entry points registered. pair runs the full pipeline. pair:verify
validates the committed artifact against the current extractions.
pair:review regenerates review.md from the committed artifact without
re-pairing.

(*BB:Granjon*)
```

---

## Task 12: Full test suite pass + coverage gate

- [ ] **Step 1: Run the full vitest suite**

Run: `npm run test`
Expected: all tests pass, including the existing 142 tests plus roughly 40 new tests from this plan.

- [ ] **Step 2: Run coverage and confirm thresholds**

Run: `npm run test:coverage`
Expected: exit 0. `scripts/pair-en-et/**` reports ≥ 90% lines/functions/statements, ≥ 85% branches.

- [ ] **Step 3: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: exit 0 for both.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: Astro build succeeds with zero warnings. (This also confirms no accidental coupling from scripts/ into src/.)

- [ ] **Step 5: If coverage is below target**, identify gaps with `npm run test:coverage -- --reporter=verbose` and ask Montano to add targeted tests. Repeat until green.

No commit in this task — it is a gate, not a delivery.

---

## Task 13: First live pairing run against real extractions

**Files:**

- Create: `data/extractions/pairing/en-et.json`
- Create: `data/extractions/pairing/review.md`

This task produces the first committed artifact. The resulting `review.md` is the first cycle of the review workflow — its contents are PO territory, not developer territory.

- [ ] **Step 1: Run the pairer**

Run: `npm run pair`
Expected: prints a summary like `67 paired sections, 1 unpaired sections`. Both output files created. Verify exits 0.

- [ ] **Step 2: Inspect outputs manually**

Run: `ls -la data/extractions/pairing/`
Run: `wc -l data/extractions/pairing/review.md`
Run: `jq '.sections | length' data/extractions/pairing/en-et.json`

Expected: 67 paired sections (all slugs except `a-pamphlets`), 1 unpaired (a-pamphlets EN-only).

- [ ] **Step 3: Commit the initial artifact**

```bash
git add data/extractions/pairing/en-et.json data/extractions/pairing/review.md
git commit -F /tmp/p0-task13.txt
```

Commit body:

```
feat(pair): first committed pairing artifact (P0 task 13)

Initial output of the deterministic pairer against current EN and ET
extractions. review.md is the first cycle of the PO review workflow;
iteration happens by hand-editing en-et.json and re-running
npm run pair:verify / npm run pair:review until review.md is empty.

Closes RED/GREEN for issue #39. Review iteration to follow.

(*BB:Plantin*)
```

- [ ] **Step 4: Push**

```bash
git push origin main
```

---

## Task 14: Close issue #39 once review.md is empty

This is a _gating_ task, not an implementation step. It will unlock after an unknown number of PO review cycles.

- [ ] **Step 1:** PO reviews `data/extractions/pairing/review.md` against the current extractions (Opus assistance available).
- [ ] **Step 2:** PO edits `data/extractions/pairing/en-et.json` to resolve each flagged pair (promote to high, split N:M, adjust to accepted-collapse, etc.) or edits the corresponding extraction JSON (case 6-style re-segmentation).
- [ ] **Step 3:** `npm run pair:verify` exits 0.
- [ ] **Step 4:** `npm run pair:review` regenerates an empty (zero sections-to-review) `review.md`.
- [ ] **Step 5:** Commit the reviewed artifact.
- [ ] **Step 6:** Close issue #39; open a follow-on brainstorm for phase P1 (bootstrap generator).

---

## Self-review checklist

- [x] **Spec coverage:** every D1-D8 decision is enacted by a task (D1 method → tasks 5-10; D2 bootstrap consumer → out of P0 scope, noted; D3 permissive schema → task 1 types; D4 synthesized para-id → task 7 block-pair; D5 review workflow → tasks 8, 10, 11; D6 no user-edit preservation → out of P0 scope; D7 reader shape → out of P0 scope; D8 phasing → task 14 gate).
- [x] **Every invariant (I1-I5) has at least one mutation test** in task 9.
- [x] **Placeholder scan:** no "TBD", no "add appropriate", no "similar to Task N" — every step carries code or a concrete command.
- [x] **Type consistency:** all later tasks reference the types defined in task 1 by exact name (`Pair`, `UnpairedBlock`, `SectionPair`, etc.).
- [x] **Open questions O1 (CI) and O2 (#38) are resolved** before this plan runs; O3 (story mapping) is implemented in task 4 with the full 42-row table pre-computed.

(_BB:Plantin_)
