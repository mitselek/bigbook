# Structured extraction — Estonian edition

**Date:** 2026-04-18
**Status:** Design approved
**Parent:** `2026-04-18-structured-extraction-design.md` (English baseline)
**Conventions:** `2026-04-18-structured-extraction-conventions.md` (English, used as ET baseline)
**ET-specific conventions:** `2026-04-18-structured-extraction-et-conventions.md` (this branch's additions)

## Scope

Apply the structured-extraction method (per-section subagents using PyMuPDF) to the Estonian translation of the Big Book at `legacy/_source/BIGBOOK layout.pdf`. Produce per-section JSON + markdown report following the same `BookSection` schema, output to `data/extractions/structured-et/`.

**No para-id pairing with English in this cycle.** Pairing is a separate future work stream; this pass produces the Estonian artifact standalone.

## PDF summary

- **File:** `legacy/_source/BIGBOOK layout.pdf`
- **Pages:** 608 (EN was 581)
- **Built-in outline:** none (unlike EN's 68 `mutool` outline entries)
- **Printed TOC:** pages 5-10 (SISUKORD)
- **Book-page to PDF-page offset:** Roman numerals (xi-xxv) map directly to PDF pages 11-25; Arabic book pages (1-574) map to PDF pages 33-606 (offset +32).

## Section outline

67 sections in document order (vs EN's 68) — ET is missing only the `appendix-aa-pamphlets` that closes the English book.

- 1 front-matter (copyright-info)
- 1 preface (Eessõna, xi-xii)
- 4 forewords (1st-4th editions)
- 1 doctor's opinion (Arsti arvamus)
- 11 chapters (ch01-ch11, matching EN structure)
- 42 personal stories (10 Pioneers + 17 Stopped-in-Time + 15 Lost-Nearly-All — matches EN)
- 7 appendices (I-VII, missing VIII which was the A.A. Pamphlets catalog in EN)

Section metadata pre-built at `data/extractions/structured-et/outline.json` — each section has `id`, `kind`, `title`, `parentGroup?`, `pdfPageStart`, `pdfPageEnd`, `bookPageStart`, `bookPageEnd`.

## Approach

Same as the English structured extraction:

1. Per-section subagent invocation with explicit metadata.
2. PyMuPDF primary, pdfplumber secondary.
3. Output: `<section-id>.json` (valid `BookSection`) + `<section-id>.md` (freeform report).
4. Fibonacci-adjacent waves with PO sanity review between.
5. Conventions doc as living shared prompt baseline.

**Baseline conventions:** the English conventions doc. Agents read it first. **ET-specific additions go into a separate companion conventions doc** (`2026-04-18-structured-extraction-et-conventions.md`) — language-specific rules only. If an ET agent finds a rule refinement that applies to both languages, it goes in the English conventions (which becomes the shared canonical one) and the ET companion documents only truly ET-only deviations.

## Known ET-specific concerns (predictions to verify)

1. **Compound-word allowlist** — Estonian forms compound words differently. English allowlist (`self-`, `well-`, `co-`, `non-`, ordinal decades, etc.) likely does not apply. ET may have its own compound-prefix patterns; expect the first chapter pilot to surface them.
2. **Diacritics (õ ä ö ü)** — should pass through PyMuPDF cleanly as Latin-Extended characters. Verify no ligature-like encoding issues.
3. **Drop-caps** — likely same typographic convention (ParkAvenue or similar, ~51pt, first paragraph). Verify per section.
4. **Running headers** — Estonian chapter titles appear at page tops; drop rule `y0 < 50 AND (size <= 9.5 OR isdigit)` should apply. Verify on a real page.
5. **Section-number prefixes on stories** — ET TOC shows `(1)`, `(2)`, ... on stories similar to EN. Drop per existing rule.
6. **Letter-spaced heading numerals** — saw `V I I` style in EN's appendix-vii. ET has 7 roman-numbered appendices; same issue likely.
7. **Two-line appendix headings** — EN pattern: roman numeral on line 1 + title on line 2. ET appendices will likely use the same layout.
8. **Two-line story titles** — EN had 2 cases (housewife, my-bottle). ET's `story-koduperenaine-kes-joi-kodus` ("The Housewife Who Drank at Home") likely has same layout.

## Wave plan

Compressed compared to EN because the conventions doc is mature. 67 sections across 6 waves:

| Wave | Count | Cumulative | Purpose                                                       |
| ---- | ----- | ---------- | ------------------------------------------------------------- |
| 1    | 1     | 1          | Pilot: `ch01-billi-lugu` — stress-test drop-cap, dialogue, ET |
| 2    | 3     | 4          | Surface ET-specific rules across chapter + story + appendix   |
| 3    | 6     | 10         | Scale out; mix of all kinds                                   |
| 4    | 12    | 22         | Stories + chapters                                            |
| 5    | 22    | 44         | Bulk stories                                                  |
| 6    | 23    | 67         | Remaining stories + appendices                                |

Between every wave: PO reviews output + decides on proposed ET-specific convention additions.

## Hard constraints (unchanged from EN)

- Agents only write to `data/extractions/structured-et/` and `.tmp/`.
- No source-code modification.
- No commits, no pushes.
- One section per subagent.
- JSON must parse.
