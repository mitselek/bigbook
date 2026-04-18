# appendix-i-the-aa-tradition — problems report

## Summary

Extracted pages 566..571 of the 4th-edition PDF using PyMuPDF `page.get_text("dict")`. Emitted **32 blocks**: 3 `heading`, 5 `paragraph`, 24 `list-item` (12 short-form Twelve Traditions + 12 long-form Twelve Traditions). JSON parses and conforms to the extended `BookSection` schema. No `verse`, `footnote`, `table`, `byline`, or `blockquote` blocks; none expected in this section.

Both Twelve-Traditions passes land as 12 complete `list-item` blocks with no fragmentation. The cross-page hanging-indent hyphenation on long-form item 7 (`mem-` on p569 y=298.8, `bers` on next line at y=312.1) joined correctly into `members`.

## Method

- `pymupdf` opened the PDF, iterated pages 565..570 (0-indexed).
- For each line: collected `text`, `(x0, y0, x1, y1)` bbox, `font`, `size`.
- Filtered layout artifacts:
  - Lines containing only the running header `APPENDICES` near `y0 < 55`.
  - Digit-only lines (defensive; none actually present on these pages).
  - Whitespace-only lines.
- Body is **10.98pt NewCaledonia** in this appendix (note: smaller than the 12pt body used in chapters; conventions doc says body is 12pt NewCaledonia, which is the chapter body — the appendix is typeset a shade smaller).
- Headings are **13.02pt NewCaledonia** (main) or **10.98pt NewCaledonia-Bold** (subsection titles).
- Short-form traditions set in **NewCaledonia-Italic 10.98pt**; long-form in plain **NewCaledonia 10.98pt**.

### Block-boundary heuristics

1. **Appendix heading merge (two centered lines → one block).** Two separate lines on page 566 — `I` at y=74.8 and `THE A.A. TRADITION` at y=104.5, both 13pt — are joined into a single `heading` block with text `I THE A.A. TRADITION`. Detected by `size >= 12.5` + `y0 < 90` for the roman numeral and `TRADITION` keyword for the title.
2. **Long-form heading merge.** `The Twelve Traditions` (bold, y=45) + `(The Long Form)` (regular, y=58) on page 568 joined into `The Twelve Traditions (The Long Form)` as a single heading block.
3. **Intro prose paragraph boundaries (p566).** y0-to-y0 gap > 20pt marks a new paragraph. Within-paragraph line spacing is 13.3pt; between-paragraph spacing is ~27.6pt. Threshold 20pt cleanly separates the four intro paragraphs.
4. **Short-form list-item boundaries (p567).** New item when the trimmed line text matches `^(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve)\u2014` (em-dash after the word). Continuation lines are those that don't match. All 12 items captured cleanly.
5. **Long-form list-item boundaries (p568..p571).** New item when trimmed text matches `^\d{1,2}\.\u2014`. Items span up to three pages (item 6 starts on p568 y=516.5, continues through p569 y=272.2). All 12 items captured with no fragmentation.
6. **Long-form intro paragraph.** The italic line `Our A.A. experience has taught us that:` (p568 y=85, Italic) is its own `paragraph` block between the heading and the first long-form list-item. Italic styling is carried as a typographic signal for "introducer" rather than a new block kind; per conventions, italic-inline is not sufficient reason to split (consistent with ch05 Third-Step-Prayer precedent).

### Text normalization applied

- Ligatures (U+FB00..FB05) expanded (none actually present in this section's text; applied defensively).
- Soft hyphens stripped (none present).
- Curly quotes preserved (e.g. `"12 Traditions"`, `"How can A.A. best function?"`, `A.A.'s`).
- Em-dashes preserved (`—` appears in every tradition prefix).
- Cross-line hyphenation handled. Only one real case: long-form item 7 `mem-` + `bers` → `members` (neither `mem-` nor `bers` is on the compound-word allowlist).

## Schema decisions

- **`I` + `THE A.A. TRADITION` → one heading block with text `I THE A.A. TRADITION`.** Per prompt instructions; also matches the conventions doc's rule for authored headings rendered across two typographic lines. The single-char `I` alone is never a valid heading block.
- **Two separate "The Twelve Traditions" headings.** The short form and long form each have their own centered bold subsection heading. Emitted both as `heading` blocks. Long-form heading additionally carries the `(The Long Form)` subtitle, joined into the same block (`The Twelve Traditions (The Long Form)`). This matches the "subtitles merged into title heading when on successive centered lines" convention.
- **`(The Long Form)` subtitle merge.** Chosen to merge rather than emit a second heading or paragraph — the subtitle is typographically a disambiguator for the same centered title, not a new subsection. Document-level pairing is preserved in a single block.
- **Long-form intro paragraph is italic.** Kept as a `paragraph` block (not a new `blockquote` or `lead-in` kind). Single-line italic inline prose doesn't meet the bar for a new kind.
- **No byline.** Appendices in the Big Book don't have author attributions. No byline block emitted.
- **Preserved `N.—` prefix in long-form items.** Each long-form list-item text begins with `1.—`, `2.—`, ..., `12.—` exactly as printed. These are authored content (the item's ordinal label), not structural artifacts. Consumers wanting the plain body can strip the prefix with a regex.
- **Preserved `One—`, `Two—`, ..., `Twelve—` prefix in short-form items.** Same reasoning.

## Flagged blocks

None. Every block is high-confidence.

The three I double-checked, none problematic:

1. **`l024` / item 7** — spans pages 568 (start, y=516.5) through 569 (body + end). Cross-page join worked; `mem-`/`bers` hyphen merge produced the correct `members`.
2. **`l023` / item 6** — very long item spanning p568 y=516.5 → p569 y=244.6. 14 lines joined into one list-item. Paragraph-internal sentence boundaries look natural.
3. **`p020`** — the tiny italic introducer `Our A.A. experience has taught us that:`. Could alternately be part of item 1 (since it grammatically introduces the numbered list), but treating it as its own paragraph matches the typography and the conventions-doc preference for preserving visible paragraph-level gaps.

## Schema proposals

### Proposal 1: No new block kinds needed.

Existing `heading`, `paragraph`, `list-item` covered everything cleanly. No need for a `subheading` / `section-heading` kind. The only hierarchy signal here is font-size difference (13pt main, 10.98pt bold subsection). Consumers can re-derive a hierarchy from font or from block position; emitting the same `heading` kind for both is consistent with chapter extractions.

### Proposal 2: No list-item nesting needed here.

The 12 short-form and 12 long-form items are two parallel flat lists (not nested). Each list-item is a top-level sibling. Nothing requires a `list-item` with children. Note: appendix-vii (Twelve Concepts, roman I.–XII. numbering) may tell a different story; I've only seen this section.

### Proposal 3 (minor, for the conventions doc): document the "two centered heading lines → one heading block" case explicitly.

The conventions doc mentions "two-line title" cases only in passing (e.g. chapter titles, subtitle merges). For appendices specifically, the roman-numeral prefix (`I`, `II`, ..., `XI`) sits on its own line above the title. Recommend adding a sentence: *"When an appendix or part is titled across two centered lines — roman numeral prefix on line 1, title on line 2 — emit a single `heading` block with the two joined by a single space."*

### Proposal 4 (optional): `(The Long Form)` as an inline subtitle convention.

When a subsection heading has a parenthesized disambiguator on the next centered line, merge into the same `heading` block. Already done here; worth promoting to a documented convention because it's likely to recur (e.g. any "(Short Form)" / "(Long Form)" / "(Revised)" annotations).

## Two-line heading merge verdict

**Clean merge.** `I` + `THE A.A. TRADITION` produced `I THE A.A. TRADITION` as a single heading block (`h001`). No schema flag needed — the visual rendering (roman + title on two centered lines) is preserved in metadata as `title: "I The A.A. Tradition"` (prose case, per conventions' divergence rule) while the heading block text is the all-caps visual rendering. The prompt's request to NOT emit `I` as a separate block was honored.

## Short-form verdict

**12 complete blocks, no fragmentation.** Each contains the full tradition text with the `One—`, `Two—`, ..., `Twelve—` word prefix intact. Multi-line continuations (e.g. Two, Six, Eight, Nine, Eleven, Twelve) joined correctly.

## Long-form verdict

**12 complete blocks, no fragmentation.** Each contains the full expanded explanation with the `N.—` arabic prefix intact. All cross-page continuations joined correctly (items 6, 7, 8, 9, 11 span multiple pages).

Some long-form items are multi-paragraph-feeling in the source (e.g. item 6 reads like several distinct sentences building up; item 9 is a long explanatory paragraph). The PDF typography does **not** break them into multiple paragraphs — there are no intra-item blank-line gaps. Per the prompt's instruction to use judgment, I emitted each long-form tradition as **one big list-item** rather than splitting into list-item + following paragraphs, because (a) the source typography supports that as a single unit, (b) splitting would require semantic-level heuristics that don't generalize, and (c) consumers needing finer granularity can sentence-split downstream.

## Counts

| kind        | count |
| ----------- | ----- |
| heading     | 3     |
| paragraph   | 5     |
| list-item   | 24    |
| **total**   | **32** |

Paragraphs: 4 intro + 1 long-form intro ("Our A.A. experience has taught us that:").

List-items: 12 short-form (p567) + 12 long-form (p568..p571).

Headings: appendix title (`I THE A.A. TRADITION`), short-form subsection title (`The Twelve Traditions`), long-form subsection title (`The Twelve Traditions (The Long Form)`).
