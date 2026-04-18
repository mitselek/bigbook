# EN Book Extraction — Design Spec

**Date:** 2026-04-18
**Status:** Draft — awaiting PO review
**Author:** Plantin

## 1. Problem

The existing English chapter files under `src/content/en/` are not extracted from the authoritative AA Big Book 4th edition PDF. Spot checks against `legacy/assets/AA-BigBook-4th-Edition.pdf` show they are reverse translations from the Estonian edition. Filenames (`ch01-billi-lugu.md`, `arsti-arvamus.md`, `lisad.md`) and wording differences (e.g. ch01-p001 reads "we young officers from Plattsburg" where the authoritative text is "we new, young officers from Plattsburg") confirm this across all 16 current EN files.

Prior extraction attempts (session 11) used one-shot subagents against the PDF and failed. This spec designs a replacement approach: a deterministic extraction pipeline that produces a structured, git-diffable JSON artifact of the full English 4th edition, with EN-keyed IDs and no dependency on the existing ET paragraph grid.

Drift analysis between the newly-extracted EN and the current ET is **out of scope for this spec**. It is the deliberate next step after the extraction artifact lands.

## 2. Scope

### In scope

- Extract the full authoritative English text from `legacy/assets/AA-BigBook-4th-Edition.pdf` (581 PDF pages).
- Cover all book divisions: copyright page, preface, 4 forewords (1st–4th editions), The Doctor's Opinion, the 11 core chapters, all 42 personal stories (10 Pioneers of A.A. / 17 They Stopped in Time / 15 They Lost Nearly All), and the 7 appendices plus the A.A. Pamphlets listing. Total: 68 sections.
- Produce a structured JSON artifact at `data/extractions/en-4th-edition.json`, with EN-keyed section and block IDs that have zero overlap with existing `src/content/en/*` filenames.
- Preserve section structure (chapter / story / appendix / foreword / etc.) and block structure (heading / paragraph / blockquote / verse / list-item / footnote).
- Commit both the extracted JSON and the raw pdftotext output (`en-4th-edition.raw.txt`) for auditability.

### Out of scope

- **Inline formatting preservation** (italics, bold, drop caps, small caps). pdftotext strips these; recovering them is deferred. Plain text per block.
- **Modifying `src/content/en/*` or `src/content/et/*`**. The live app is not touched by this work.
- **Drift analysis against the current ET content collection**. A separate spec will address it after extraction lands.
- **Re-extracting the Estonian book** from `legacy/assets/BIGBOOK EST PRINT + crop marks.pdf`. Deferred.
- **Deciding how to sync EN and ET paragraph grids**. Explicit follow-up after the drift picture is visible.

## 3. Output shape

The extraction emits a single JSON document matching this TypeScript interface (lives at `scripts/extract-en-book/types.ts`):

```typescript
interface BigBookEnglish {
  edition: '4th'
  sourcePdf: string // 'legacy/assets/AA-BigBook-4th-Edition.pdf'
  extractedAt: string // ISO 8601
  sections: BookSection[]
}

interface BookSection {
  id: string // EN-keyed stable slug; see §6
  kind: SectionKind
  title: string // as printed (e.g., "BILL'S STORY")
  parentGroup?: string // for stories: 'personal-stories/pioneers-of-aa' |
  //              'personal-stories/they-stopped-in-time' |
  //              'personal-stories/they-lost-nearly-all'
  pdfPageStart: number // 1-based page in the PDF (traceability)
  pdfPageEnd: number
  bookPageStart: number // as printed on the page
  bookPageEnd: number
  blocks: Block[]
}

type SectionKind =
  | 'front-matter' // copyright, title page, dedication
  | 'preface'
  | 'foreword' // one per edition (1st–4th)
  | 'doctors-opinion'
  | 'chapter' // ch01–ch11
  | 'story' // one per personal story
  | 'appendix' // I–VII plus 'A.A. Pamphlets'

interface Block {
  id: string // section-scoped: <section-id>-p001, -p002, ...
  kind: BlockKind
  text: string // plain text; one paragraph per block
  pdfPage: number // page where the block starts
}

type BlockKind = 'heading' | 'paragraph' | 'blockquote' | 'verse' | 'list-item' | 'footnote'
```

The output is pretty-printed JSON with 2-space indentation and stable key ordering, sized to roughly 2–5 MB. It lives at `data/extractions/en-4th-edition.json` and is committed.

## 4. Architecture & file layout

```
scripts/
  extract-en-book.ts           # entry point; orchestrates the pipeline
  extract-en-book/
    outline.ts                 # parse PDF outline via `mutool show ... outline`
    pdftotext.ts               # wrap `pdftotext -layout -f N -l M`
    normalize.ts               # strip headers/page numbers, rejoin hyphens, page-break fixup
    segment.ts                 # normalized text → Block[], detect kind
    slug.ts                    # deterministic ID generation
    types.ts                   # BigBookEnglish, BookSection, Block, etc.
data/
  extractions/
    en-4th-edition.json        # committed extraction output
    en-4th-edition.raw.txt     # committed raw pdftotext output (auditable)
    sample-review.md           # generated after run: 3 random blocks per section for proofreading
tests/scripts/extract-en-book/
  outline.test.ts
  normalize.test.ts
  segment.test.ts
  slug.test.ts
  integration.test.ts          # end-to-end on a single-section golden fixture
  fixtures/
    *.txt                      # hand-crafted page slices covering edge cases
```

### Placement rationale

- **`data/extractions/` is a new top-level directory**, not under `src/content/`. This data is staging, not deployable content, so the `CONTENT_BOOTSTRAP=1` gate does not apply and the live app is unaffected.
- **`scripts/` mirrors existing pattern** (`scripts/bootstrap-mock-content.ts`). Plantin owns script files; the ownership matrix puts `scripts/` under Plantin/Granjon depending on content, but implementation can go through the XP triple.
- **`tests/scripts/extract-en-book/` is new**. Montano (RED) owns tests; unit tests on the pure functions are the core of the quality gate since manual proofreading can't catch every regression.

## 5. Data flow

```
AA-BigBook-4th-Edition.pdf (581 pages)
           │
     ┌─────┴─────┐
     ▼           ▼
 mutool       pdftotext -layout
 outline      (whole book → one .txt)
     │           │
     ▼           ▼
 OutlineNode[]  raw-book-text
     │           │
     └─────┬─────┘
           ▼
    slice per section (by page range from outline)
           │
           ▼
    per section:
      normalize (strip headers, rejoin hyphens, page-break fixup)
      segment   (blank-line split → Block[], detect kind)
      assign IDs (slug(title) + sequential p001..pNNN)
           │
           ▼
    BigBookEnglish { sections: BookSection[] }
           │
           ▼
    data/extractions/en-4th-edition.json
    data/extractions/en-4th-edition.raw.txt
    data/extractions/sample-review.md (3 random blocks per section)
```

### Normalize rules (per section)

Applied in this order to the sliced text for each section:

1. **Strip Adobe QXD running header.** Regex `^Alco_\w+_\d+p_\w+_r\d+\.qxd .+Page \d+$` → drop the matched line.
2. **Strip standalone page-number lines.** Lines containing only 1–3 digits, flanked by blank lines → drop.
3. **Strip running section title.** The section's own title in all-caps, alone on a line, appearing anywhere after the opening heading → drop.
4. **Strip running book title.** `^ALCOHOLICS ANONYMOUS$` alone on a line → drop.
5. **Rejoin hyphenation across line breaks.** `(\w+)-\n(\w+)` where `\1-\2` does not appear elsewhere in the surrounding context → collapse to `\1\2`. Conservative: skip if the hyphenated compound is known (e.g., `self-reliance`, `week-end`) — maintain a small allowlist of intentional hyphens seen in the book.
6. **Rejoin paragraphs split across page breaks.** After strips 1–4, consecutive non-blank lines with no intervening blank line are part of one paragraph, even if the original page-break artifacts separated them.

### Segment rules (normalized text → `Block[]`)

Blank lines separate blocks. Each block's kind is detected as follows, checked in order:

1. **Heading** — first block of the section, and its text matches the section title after both are lowercased and stripped of punctuation (`[^\w\s]`) and collapsed whitespace.
2. **Verse** — all lines within the block are short (≤ ~40 chars) and the block is indented or line-starts are quoted. Text joined with `\n`.
3. **Blockquote** — block is uniformly indented deeper than surrounding paragraphs (detectable in `-layout` mode via leading whitespace).
4. **Footnote** — block starts with `*` followed by space, or a digit followed by space, and appears at the end of a page range. Footnotes are rare (~5–10 in the whole book).
5. **List-item** — block starts with a list marker: `\d+\.`, `[a-z]\.`, `\([a-z0-9]+\)`.
6. **Paragraph** — default; everything else.

### ID generation (`slug.ts`)

Section IDs are derived from the outline title:

| Outline title                                                      | Section ID                         |
| ------------------------------------------------------------------ | ---------------------------------- |
| "Copyright Info"                                                   | `copyright-info`                   |
| "Preface"                                                          | `preface`                          |
| "Foreword to First"                                                | `foreword-1st-edition`             |
| "Foreword to Second"                                               | `foreword-2nd-edition`             |
| "Foreword to Third"                                                | `foreword-3rd-edition`             |
| "Foreword to Fourth"                                               | `foreword-4th-edition`             |
| "The Doctors Opinion"                                              | `doctors-opinion`                  |
| "Bill's Story"                                                     | `ch01-bills-story`                 |
| "There is a Solution"                                              | `ch02-there-is-a-solution`         |
| … (chapters continue as `chNN-<kebab>`)                            |                                    |
| "A Vision For You"                                                 | `ch11-a-vision-for-you`            |
| "Dr. Bob's Nightmare"                                              | `story-dr-bobs-nightmare`          |
| "Women Suffer Too"                                                 | `story-women-suffer-too`           |
| … (stories all `story-<kebab>`, with `parentGroup` on the section) |
| "I The A.A. Tradition"                                             | `appendix-i-the-aa-tradition`      |
| "II Spiritual Experience"                                          | `appendix-ii-spiritual-experience` |
| … (appendices all `appendix-<roman>-<kebab>`)                      |
| "A.A. Pamphlets"                                                   | `appendix-aa-pamphlets`            |

Block IDs are `<section-id>-p001`, `-p002`, ... numbered sequentially over **all** blocks in the section (including the heading, so the heading is always `-p001` when present).

Slug function rules: lowercase, strip punctuation except hyphens and digits, collapse whitespace to `-`, strip leading/trailing hyphens.

## 6. Error handling

- **Outline parse fails** (bad pointers — `mutool` already warns on this PDF): rerun `mutool show ... outline` with stderr suppressed, parse the tree from stdout. If the resulting tree is empty or missing top-level anchors, hard-fail with a clear message that points the operator at a hand-written fallback outline in `scripts/extract-en-book/outline.ts` (a hardcoded `OutlineNode[]` constant the script can fall back to).
- **pdftotext returns empty or exits non-zero** for a page range: hard-fail, log the section name and page range, exit the script with a non-zero code. No partial writes.
- **Section has zero blocks after segmentation**: hard-fail. Allow-list genuinely short sections (`copyright-info`, `appendix-aa-pamphlets`) to expect as few as 1 block.
- **Duplicate block ID** within a section: hard-fail. Means the numbering loop is broken; do not attempt silent recovery.
- **Duplicate section ID** across the outline: append a numeric suffix to the later one and emit a warning. (Defensive; the outline appears clean.)
- **Overlapping page ranges** between adjacent outline entries: warn; use the earlier entry's `pdfPageEnd` as the later entry's `pdfPageStart`.

Exit codes: `0` on full success, `1` on any hard-fail, `2` on validation failure (duplicate IDs, empty sections).

## 7. Validation & testing

### Unit tests (Vitest)

- `outline.test.ts` — parses `mutool` output with known-bad-pointer warnings, recovers a clean tree.
- `normalize.test.ts` — fixture-based: each fixture is a short `.txt` slice exhibiting one edge case (QXD header, page-number line, mid-paragraph page break with running header, hyphenation at line end, hyphenation at page break, running section title mid-text). Asserts normalized output.
- `segment.test.ts` — fixture-based: input is normalized text; assert block boundaries and kind detection. Includes verse, blockquote, footnote, list-item, and a negative case (all-caps line that is NOT a heading because it appears mid-chapter).
- `slug.test.ts` — table-driven: every outline title mapped to its expected section ID.

### Integration test

`integration.test.ts` runs the end-to-end pipeline on a single, short section — Foreword to Fourth Edition (pages 12–13). Asserts the full `BookSection` output against a golden JSON fixture. Tiny, fast, and catches whole-pipeline regressions cheaply.

### Acceptance sampling

After the full run, the script writes `data/extractions/sample-review.md` containing 3 random blocks per section (so ~204 blocks across 68 sections). Plantin / PO spot-check against the PDF and note any failures. Iterate on parser rules until the sample is clean.

### Runtime invariants (hard-failed in the script, not just tests)

- Every section in the outline produces at least 1 block (with the short-section allowlist).
- Every block has non-empty `text`.
- Every block ID is unique within its section.
- Every section ID is unique across the document.
- `pdfPageStart ≤ pdfPageEnd`; every block's `pdfPage` is within `[section.pdfPageStart, section.pdfPageEnd]`.
- Total section count equals the outline's section count (no sections lost silently).

## 8. Post-extraction handoff

On script success:

- `data/extractions/en-4th-edition.json` — committed.
- `data/extractions/en-4th-edition.raw.txt` — committed (raw pdftotext output, auditable).
- `data/extractions/sample-review.md` — committed; used for acceptance review.
- **No changes to `src/content/`, `src/lib/`, or `src/components/`.** The live app is unaffected.

Next steps (separate spec, explicitly **not** this one):

1. **Drift analysis.** Compare the extracted EN structure against the current `src/content/et/*.md` paragraph grid. Produce a drift report (block count per section, paragraph-pairing mismatches, structural differences).
2. **Sync strategy decision.** Based on the drift report, PO decides how to reconcile EN and ET into the live bilingual reader (a new para-id scheme, a mapping table, a staged migration, etc.).

## 9. Non-functional

- **Runtime**: the script completes in under 30 seconds on a modern laptop. `pdftotext` is the slow step (~5–10s for 581 pages); everything else is in-memory JS.
- **Determinism**: same PDF in, same JSON out, byte-for-byte. No timestamps embedded outside of `extractedAt` (which is optionally overridable via env var for reproducible builds).
- **No network**. The script runs fully offline; all inputs are in-repo.
- **No secrets**. Reads only the committed PDF.

## 10. Open questions

None at spec time. Implementation-time decisions (exact block-kind heuristic thresholds, hyphenation allowlist entries) are refined as fixtures surface edge cases, not locked in here.

---

Ready for PO review.
