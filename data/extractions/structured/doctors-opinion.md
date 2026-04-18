# Structured extraction — `doctors-opinion`

**PDF pages:** 14–21
**Kind:** `doctors-opinion`
**Blocks emitted:** 42 (1 heading, 39 paragraph, 2 byline, 0 verse, 0 list-item, 0 footnote, 0 table, 0 blockquote)

## Summary

"The Doctors Opinion" is the 8-page front-matter medical endorsement that sits between the forewords and Chapter 1. Structurally it is an introductory narrator paragraph followed by two signed letters from Dr. William D. Silkworth, M.D., bridged by a narrator paragraph that also ends "The doctor writes:" to introduce the second letter. Extraction yielded 42 blocks: one heading, 39 body paragraphs, and two `byline` blocks for the two signatures. No verse, no list-items, no footnotes, no tables.

## Method

- Library: PyMuPDF (`pymupdf.open`, `page.get_text("dict")`). No pdfplumber needed.
- Script: `.tmp/extract-doctors-opinion.py` (gitignored).
- Probes: `.tmp/probe-doctors-opinion.py` (font/size/x/y per line) and `.tmp/analyze-doctors-opinion.py` (intra-page y-gaps).
- Paragraph detection: vertical gap > 20pt (normal line spacing is ~13.3pt; paragraph breaks are ~27.3pt).
- Cross-page paragraph detection: terminal-punctuation heuristic on the last line of the current paragraph — if it ends with `.`, `!`, `?`, or `:`, the new page starts a fresh paragraph; otherwise it continues.
- Byline detection: lines whose `x0 >= 190` (right-indented, well away from the body margin at x≈63).
- Heading detection: `pdf_page == 14 && size >= 12.5` (the only line meeting this is "THE DOCTORS OPINION" at size 13.02).
- Drop-cap detection: first line on p14 whose leading span uses font `ParkAvenue` (size 18). Merge: flatten `WE OF` small-caps prefix to normal case `We of` and join with the remainder of the line.

## Schema decisions

### Heading text preserved as source renders it

The outline `title` field is `"The Doctors Opinion"` (no apostrophe). The PDF renders the heading as `THE DOCTORS OPINION` (also no apostrophe — no curly apostrophe, no ASCII apostrophe). The heading block preserves the visual: `"THE DOCTORS OPINION"`. This is consistent with the convention that `title` is prose-case metadata and the `heading` block preserves the visual rendering.

### Drop-cap treatment

The first body line on p14 is rendered as `WE OF Alcoholics Anonymous believe that the reader will`, where `WE OF` is set in **ParkAvenue 18pt** (small-caps drop-cap style; not the chapter-style 51pt single-letter drop-cap) and the remainder is NewCaledonia body text. I flattened `WE OF` to sentence case `We of` and merged with the body line so the first paragraph reads `We of Alcoholics Anonymous believe…`. This is a compound drop-cap covering two words rather than one letter, but the conventions' drop-cap guidance applies symmetrically: "flatten small-caps tail to regular case" / "merged into the first word of the first paragraph". Result: a clean, natural-reading first paragraph with no trace of the typographic ornament.

### Bylines (signed letters)

This section is the first to exercise the **signed-letter pattern** — plain letter body with a right-indented sign-off. I emitted one `byline` block per signature group:

- **`doctors-opinion-b010` (p15):** `"Very truly yours, William D. Silkworth, M.D."`
  Letter 1 has a two-line sign-off: `Very truly yours,` at `x≈258` and `William D. Silkworth, M.D.` at `x≈207`, separated by a normal paragraph-gap. My builder groups consecutive right-indented lines on the same page into a single byline, and joins them with `", "` when the first part ends with a comma (so the two lines become one semantic sign-off).

- **`doctors-opinion-b042` (p21):** `"William D. Silkworth, M.D."`
  Letter 2 has only the name (no `Very truly yours,` closing) — so the byline is a single line.

**Schema fit.** The `byline` kind (added Wave 1B) describes itself as "author-attribution sign-offs at the end of stories" — examples are `Bill W., co-founder of A.A., died January 24, 1971.` and `-- Joe M.` style sign-offs. The signed-letter pattern here is a **closely related but broader** use: a signature at the end of a quoted letter, not at the end of an authored story. The typographic signal is identical (right-indented, sans-indent, at the end of a prose block), and the semantic intent matches (identifying the author of the preceding prose). I reused `byline` rather than proposing a new `signature` kind; flagging here for review.

### Letter salutation and narrator tags as paragraphs

- `"To Whom It May Concern:"` (p14, p003) — the letter salutation, emitted as a `paragraph` block. It sits at the body margin, has a paragraph-gap above and below, and is a one-line paragraph. Conventions don't call out a special kind for salutations and the text is brief enough that a standalone paragraph is accurate.
- `"The doctor writes:"` (p16, p014) — narrator tag introducing the second letter. Same treatment (standalone paragraph).

### Body font is 10.98 (not 12.0)

Front-matter body type in this PDF is 10.98pt (vs. 12.0pt for chapter body). My heuristics adapt to this (paragraph-gap threshold, heading size threshold).

### No running headers in this section

Pages 15-21 have no running-header band. Body text starts at `y≈45` on every page. The conventions' guidance "headers at `y0 < 50`" is a chapter-body heuristic that does not apply here. I narrowed the top-of-page filter to also require `size <= 9.5` (running headers are 9pt) so that body lines at `y≈45` are not dropped.

### Cross-page paragraph heuristic

Because there is no first-line indent (paragraphs are indicated by vertical gap only) and no running header to reset the y-coordinate, I needed a way to decide whether the top of a new page is a new paragraph or a continuation of the previous page's final paragraph. The heuristic: look at the last line of the current paragraph (on the previous page); if it ends with `.`, `!`, `?`, or `:`, start a new paragraph; otherwise continue. Verified manually against all 7 page transitions in this section; all six transitions resolve correctly (p14→p15 continuation, p15→p16 continuation, p16→p17 continuation, p17→p18 new, p18→p19 new, p19→p20 continuation, p20→p21 continuation).

## Flagged blocks

- **`doctors-opinion-p002`** (first body paragraph with drop-cap). Drop-cap rendered as two small-cap words `WE OF`, merged to sentence-case `We of`. Worth a human eyeball to confirm the merged text reads naturally.

- **`doctors-opinion-b010`** (`"Very truly yours, William D. Silkworth, M.D."`). I joined the two-line sign-off into one byline with a `, ` separator. An alternative encoding would be two separate byline blocks (one for the closing, one for the name) or a single byline with a newline between. Flagged for PO preference.

- **`doctors-opinion-p012`** ends with `but as exproblem drinkers, we`. The word appears unhyphenated in the source on a single line (visible in probe output). The intended reading is almost certainly `ex-problem drinkers`; the typographic hyphen was elided by the typesetter. This is a **source defect**, not an extraction artifact — no fix applied. Flagging for downstream normalize to consider.

## Schema proposals

### Signed-letter pattern — reuse `byline`, no new kind

I propose **no new kind**; the existing `byline` kind fits the signed-letter pattern semantically and typographically. The conventions doc description should be lightly broadened in a future revision to reflect this generalization:

> `byline` — author attribution sign-offs. Typographically distinct (short, right-indented or italic, no body indent). Used at the end of stories (e.g. `Bill W., co-founder of A.A., died January 24, 1971.`, `-- Joe M.`) AND at the end of signed letters or other attributed quoted prose (e.g. `Very truly yours, William D. Silkworth, M.D.` at the end of the Doctor's Opinion letters).

### Multi-line byline joining convention

When a signature spans multiple right-indented lines (closing + name), I joined them with `", "` when the leading line ends with a comma, else `" "`. This preserved semantic unity in one block. If the PO prefers one-block-per-line, the extractor change is trivial. Flagged as a deferred decision for the conventions doc.

### Cross-page paragraph detection for gap-delimited sections

The terminal-punctuation heuristic for cross-page paragraph boundaries worked cleanly here. Front-matter sections like Preface / Foreword / Doctor's Opinion likely share the gap-delimited (non-indented) paragraph pattern. Later wave agents working on front matter can reuse the same heuristic; worth a line in the conventions doc under "Heuristics known useful".

### Running-header absence in front matter

Running headers are absent from the front matter of this edition. The conventions-doc header rule ("at `y0 < 50`") needs to be qualified to "at `y0 < 50` AND font size `<= 9`" for sections that have content starting at the top of the page. Worth documenting.

## Verification

- JSON parses: ✓ (`python -c "import json; json.load(...)"`).
- Schema: ✓ (all blocks have `id`, `kind`, `text`, `pdfPage`; kinds within allowed enum).
- Id continuity: ✓ (ordinals 001..042, no restarts per kind).
- All 8 pages represented (p14–p21).
- No verse / list-item / table / blockquote / footnote blocks emitted (expected).
- Heading present: `THE DOCTORS OPINION` at pdfPage 14.
- Two bylines at the two signature locations (pdfPage 15, pdfPage 21).
