# foreword-2nd-edition — extraction report

## Summary

Front-matter foreword, 6 pages (PDF pp. 5-10). Emitted **20 blocks**: 1 heading + 19 paragraphs. No verse, list-items, tables, footnotes, or bylines (as expected for a committee-authored foreword). Extraction is clean; structural detection is straightforward once two section-specific quirks are handled (body font size, lack of first-line indents).

## Method

- PyMuPDF (`pymupdf`) only. `page.get_text("dict")` per page, span-level text with font/size/bbox.
- Running-element filter: drop footer page-number digit-only lines at `y0 > 500` (none observed on these pages, but guard is in place).
- Heading detection: page 5 size-≥12.5 line containing "FOREWORD".
- Italic-deck detection: page 5 lines with `Italic` in font name at `y0 < 140`.
- Paragraph segmentation: combined y-gap heuristic + short-last-line page-boundary heuristic (see Schema decisions below).
- Cross-line hyphenation handled inside `join_paragraph_lines` using the current 18-prefix compound allowlist (`self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`, `one-` through `ten-`).

## Key font/layout observations (differ from chapter defaults)

- **Body font size is 10.98 pt** (not 12.0 as in chapters). Headings are 13.02 pt NewCaledonia. Italic deck is 10.98 pt NewCaledonia-Italic. The opening lead-in line is ParkAvenue at 18 pt (see drop-cap verdict below).
- **Left margin is constant `x0 = 63.00`** on all 6 pages — no odd/even parity (chapters alternate 52/69).
- **No first-line paragraph indent**. All body lines start at `x0 = 63.00`. Paragraph boundaries must be detected by vertical gap or short-last-line, not by indent.
- Intra-paragraph line spacing ≈ 13.3 pt; inter-paragraph gap ≈ 27 pt. Threshold `gap > 20` reliably splits paragraphs within a page.
- Right margin ≈ 335 pt. Lines ending a paragraph have `x1 < 290`; lines that continue have `x1 > 300`.
- No running headers or footers on any of these 6 pages (page numbers absent on front-matter pages in this PDF).

## Drop-cap verdict

**Not a traditional drop-cap.** Page 5 y=170.84 carries an 18 pt ParkAvenue line reading `SINCE the original Foreword to this book was written in ` — i.e. the entire first sentence-opener is set in the decorative face, not a single oversized letter with wrap-around body text. Subsequent lines drop back to NewCaledonia 10.98 pt. I emitted the ParkAvenue line as the first line of paragraph `p003`, preserving the source's `SINCE` (all-caps small-caps rendering). No merge with a following letter is needed because the ParkAvenue line is a complete word-group ending mid-sentence, and the next body line (`1939, a wholesale miracle has taken place. ...`) picks up exactly where the line ends.

This differs from the `W` + `ar` → `War` chapter-style drop-cap handling. Documenting in case the schema/convention doc wants to distinguish "line-level lead-in caps" from "single-letter drop caps".

## Schema decisions

1. **Italic deck emitted as a single `paragraph` block.** Per conventions, short editorial notes go as paragraph. The deck here is a 2-line italic note ("Figures given in this foreword describe the Fellowship as it was in 1955.") — no obvious multi-paragraph typography, so one block with both lines joined. ID `p002`.

2. **Page-boundary paragraph detection using short-last-line heuristic.** Since this section has no first-line indent, the only paragraph-start signal is a vertical gap. But page transitions hide the gap. To compensate: if the last body line on the previous page has `x1 < 290` (well short of the right margin), treat the first line on the next page as a NEW paragraph; otherwise continue. This correctly split 3 paragraph breaks at page boundaries (p6→p7, p8→p9, p9→p10) and correctly kept 2 continuations (p5→p6, p7→p8).

3. **Title divergence preserved.** Section metadata `title` = `Foreword to Second` (prose-case). Heading block text = `FOREWORD TO SECOND EDITION` (visual rendering from the PDF). Per conventions' explicit intentional divergence rule.

## Flagged blocks — cross-line hyphenation artifacts

Three paragraphs contain mid-line hyphenated words that ARE artifacts of the original typesetter's line breaks, but PyMuPDF has reassembled them into a single visual line, so my line-end hyphen rule doesn't fire:

- **p006**: `...but he had suc-ceeded only in keeping sober himself.` (should read `succeeded`)
- **p007**: `This work at Akron contin-ued through the summer of 1935.` (should read `continued`)
- **p016**: `...we include Catho-lics, Protestants, Jews, Hindus, ...` (should read `Catholics`)

These are left as-is because: (a) they are present in the PDF's text layer as mid-line characters, not line-end hyphens; (b) precedent from prior waves (ch02 has `ex-periences`, `ex-planation`, `pre-sent`, `pre-sents`, `pre-vented`, `re-covering`, `re-lated`, `re-mind`, `re-turned` — all the same class of artifact left un-joined). Flagging for consistency.

### Schema proposal (deferred)

Consider a post-extraction normalization pass that detects intra-line hyphens of the form `<CVC>-<letter>(letter)(letter)` where the joined word is in an English word list. This is distinct from the cross-line hyphenation rule (which operates on adjacent Line objects) and would need to run after `get_text("dict")` reassembly. Not in scope for this section; raising as a candidate convention to discuss between waves.

## Block counts by kind

| kind | count |
| --- | --- |
| heading | 1 |
| paragraph | 19 |
| list-item | 0 |
| verse | 0 |
| footnote | 0 |
| byline | 0 |
| table | 0 |
| **total** | **20** |

## Heading text emitted

`FOREWORD TO SECOND EDITION`

## Other notes

- **Italic mid-paragraph title** `Saturday Evening Post` on page 8 (y=272.23 in NewCaledonia-Italic) is a book/magazine title kept inline with its paragraph `p012` — italic mid-paragraph spans do not trigger a block split, per conventions.
- **Em-dash** appears in `p017` (`—friends in medicine, religion, and the press`) and `p017` (`two out of three—began to return`). Preserved as `—` per conventions.
- **Curly quotes** preserved throughout (`"..."`, `"..."`, `'s`).
- **No ligatures** observed in the raw spans of this section (all `ff`/`fi`/`fl` appeared as plain ASCII).
