# preface — extraction report

## Summary

Extracted the **Preface** (pages 2-3, 2 pages) of the Big Book 4th edition. Emitted **7 blocks**: 1 heading + 6 paragraphs. No verse, list-items, footnotes, bylines, or drop-cap-as-own-block edge cases (though a small in-line drop-cap was present and merged). The minimum-size-extraction test surfaced one behavior not explicitly in the conventions doc (see **Schema proposals** below): **cross-page paragraph continuation merging**.

## Method

- **Library:** PyMuPDF only (`page.get_text("dict")`). No `pdfplumber` needed for this section.
- **Pipeline:**
  1. Iterate PDF pages 2..3, collect lines with spans (font, size, bbox).
  2. Group lines by PyMuPDF's internal block index — this gave natural paragraph grouping because the preface uses vertical-gap-separated paragraphs (no first-line indent), which PyMuPDF's block-segmenter already respects.
  3. Identify the heading: single line `Preface` at size 14.0pt at the top of page 2.
  4. Identify the drop-cap on the first body paragraph: first line's first span is `ParkAvenue` 18pt containing a single uppercase letter (`T`), followed by a `NewCaledonia` 10pt span starting with a small-caps-tail uppercase run (`HIS IS `).
  5. Merge the drop-cap letter with the flattened small-caps tail (`T` + `his is the fourth edition...` = `This is the fourth edition...`).
  6. Detect cross-page paragraph continuation and merge (see schema proposal).
  7. Apply normalization (ligatures, soft hyphens) and cross-line hyphenation with the current compound-word allowlist.
- **Heuristics that fired:**
  - Heading font size ≥ 13.5pt at top of first page.
  - Drop-cap detection: first span is ParkAvenue, larger than the next span, matches `^[A-Z]$`.
  - Small-caps tail flattening: regex `^((?:[A-Z]+\s+)+)(?=[a-z])` matches `HIS IS ` and lowercases it.
  - Cross-page paragraph merge: last-line x1 > 280 (on a 396-pt page width) indicates a wrapped-not-ended line; merge with the next page's first block.

## Schema decisions

1. **Drop-cap merge with small-caps tail.** The conventions doc says "the surrounding small-caps tail, if any, is flattened to regular case" and gives the `War` example. The preface's drop-cap `T` is rendered much smaller than chapter drop-caps (18pt vs 51pt) and its small-caps tail is encoded as literal uppercase letters in a regular NewCaledonia font (not a `-SC` font variant). Decision: same rule — flatten `HIS IS ` → `his is `, merge `T` + `his is the fourth...` = `This is the fourth...`. The heading text in the emitted JSON shows this worked (`preface-p002`).

2. **Heading y-coordinate.** The `Preface` title line sits at `y0=45.1`, which is just below the conventions' `y0 < 50` "drop running-headers" threshold. Decision: do NOT drop it — the preface page has **no** running header above the title, so the title occupies the top-of-page slot. Detected instead via font size (14.0pt, which is heading-sized) and the group being a single-line block with text matching the section title. The y-threshold rule is sound for running-header drops when there IS a running header; it is not a reliable heading-vs-running-header discriminator in front-matter.

3. **Heading text casing.** The source renders the title as literal `Preface ` (prose case, not ALL-CAPS like chapter titles `BILL'S STORY`). Emitted as `Preface` in the heading block. This matches the conventions' intentional-divergence rule: `title` (metadata) and `heading.text` (visual rendering) agree here because the source itself is prose-case.

4. **No byline.** No author attribution at end; the preface is uncredited editorial matter.

5. **No footnote, no verse, no list-item.** Zero false positives for these kinds.

6. **Cross-page paragraph continuation.** See schema proposal below.

## Flagged blocks

None are uncertain. All 7 blocks have clean, expected text. Quick spot-checks:

- `preface-h001` — `"Preface"` — straightforward.
- `preface-p002` — starts with `"This is the fourth edition of the book "Alcoholics Anonymous.""` — drop-cap merge correct.
- `preface-p005` — spans pages 2-3, merged across the page boundary where page 2 ended with `"...eight new "` (no sentence terminator, wraps near right margin) and page 3 began with `"stories were added..."`. Result reads cleanly: `"...were carried over from the second edition; eight new stories were added. In Part III..."`.
- `preface-p007` — last paragraph, ends with closing curly quote `too."` (U+201D preserved per conventions).

## Schema proposals

### New heuristic: cross-page paragraph continuation merge

**Observation.** PyMuPDF's block-grouping respects paragraph gaps within a page but naturally starts a new block on every new page, even when the logical paragraph continues. In the preface, this split paragraph 4 (on the page-2/page-3 boundary) into two PyMuPDF blocks.

**Proposal.** Add a post-grouping merge pass:

> When two adjacent `paragraph` prelim-blocks come from different PDF pages (`prev.pdfPage < curr.pdfPage`) AND the last line of `prev` has `x1` reaching near the right margin (e.g. `x1 > 280` on a 396-pt-wide page, or roughly `pageWidth - rightMargin - 16`), merge them into a single block. Keep the earlier block's `pdfPage` — the paragraph "belongs" to where it started.

**Why `x1` near right margin is the right signal.** A paragraph-terminal line is naturally short (ends at a sentence, x1 well short of right margin). A mid-wrap line reaches near the right margin because the typesetter broke on a word boundary. This is robust and unambiguous for a single-column book layout.

**Why this matters.** Without this rule, every chapter/section that spans multiple pages will have a spurious block boundary at every page break where a paragraph continues. ch01-bills-story and ch02 agents presumably already handled this implicitly (their approaches aren't block-based), but future section agents using a block-based approach should share this logic.

**Risk.** If the threshold `280` is too loose, short lines that happen to wrap close to margin could be spuriously merged with the next page. Mitigation: set the threshold slightly below the typical wrap point (probing showed wrap x1 values of 301-334; paragraph-final x1 values of 84-180). `280` gives a safe gap.

**Suggested addition to conventions doc (evolution log):**

> - **2026-04-18 (Wave 4 preface, accepted/proposed)** — cross-page paragraph continuation merge. When two adjacent paragraph prelim-blocks come from different PDF pages AND the last line of the earlier block reaches near the page's right margin (x1 > ~280pt on a 396pt-wide page), merge into a single paragraph. Relevant for any block-based extractor; bypassed by line-walker extractors.

### Minor: handling the 14pt section-level heading

The preface uses a **14.0pt** heading size, distinct from the chapter-level 13.5pt documented in the heuristics section. A section-agent building a heading detector on exact-size matching would miss this. Consider relaxing the conventions' heuristic to `size >= 13.0 AND < 18.0` (excluding drop-caps), rather than `== 13.5`. Not critical — each agent writes its own script — but worth noting.

### No new `BlockKind` needed

The preface fits entirely within `heading` + `paragraph`. No structural hierarchy, no byline, no table.

## Hard-constraint check

- JSON parses. Verified with `json.load()`.
- Wrote only to `data/extractions/structured/preface.json`, `data/extractions/structured/preface.md`, and `.tmp/*`.
- No source-code changes, no commits, no pushes, no npm.
