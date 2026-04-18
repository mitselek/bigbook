# appendix-vii-the-twelve-concepts — extraction report

## Summary

Extracted pages 579-580 of the PDF. Emitted **14 blocks**: 1 heading + 1 intro paragraph + 12 list-items (Concepts I through XII). No uncertainties at block-boundary level; all content accounted for, JSON validates. This is the final appendix in the book, a short spread (2 pages) with a single section (no long-form companion, unlike appendix-i).

## Method

- PyMuPDF `page.get_text("dict")` for per-line spans, reading order by `(pdf_page, y0, x0)`.
- Per-line font and size used to:
  - Identify heading lines (NewCaledonia-Bold at `y0 < 100`, specific y-zones).
  - Identify list-item **marker** lines (NewCaledonia-Bold, text starts with roman numeral + `.`).
  - Treat non-bold lines as continuations of the current item (or intro prose).
- Ligature normalization (`fi`/`fl`/`ffi`/`ffl`/`ff`/`st` digraph expansion), soft-hyphen strip, NUL strip — all per conventions. (None actually fired on this pair of pages.)
- Cross-line hyphenation and em-dash join rules per conventions — no compound splits or em-dash line-ends actually occurred in the body text, so the rules were latent here.

### Page-artifact drops (defensive)

- No running `APPENDICES` header is rendered on pages 579-580 — verified by raw-block dump. (Earlier appendix pages render that header at `y0 ≈ 45`; the final spread omits it.)
- No page numbers appear on either page (neither at `y0 < 50` nor at page bottom). The book's final two pages carry only content.
- Still kept `APPENDICES`-drop and digit-only-drop guards in the extractor for safety.

## Schema decisions

### 1. Three-line heading merge (non-trivial)

The appendix heading occupies **three** centered lines at the top of p579, not two:

| y0     | font                  | text                    |
| ------ | --------------------- | ----------------------- |
| 45.17  | NewCaledonia-Bold     | `V I I ` (!)            |
| 72.47  | NewCaledonia-Bold     | `THE TWELVE CONCEPTS `  |
| 85.90  | NewCaledonia-Bold     | `(Short Form) `         |

**Line 1 is letter-spaced** — PyMuPDF reports `V I I` with real spaces between the glyphs. Collapsed to `VII` via `re.sub(r"\s+", "", stripped)` before merging.

**Line 3** is a parenthesized disambiguator. Per conventions: "Any parenthesized disambiguator (e.g. `(The Long Form)`) on a following centered line at heading font-size merges into the same heading text." Applied here.

Final heading: `VII THE TWELVE CONCEPTS (Short Form)`.

This parallels appendix-i's `The Twelve Traditions (The Long Form)` handling, though here the disambiguator is on the *first* heading of the section rather than on a subsection heading.

### 2. Intro prose — single paragraph, not multiple

The intro text on p579 spans 9 source lines (y=113.55 … y=220.42), but there are **no paragraph-break signals**:

- Line-to-line y-gaps are uniformly ~13.3 pt (range 13.26–13.61 pt). No gap exceeds the within-paragraph spacing.
- `x0` is constant at 63.00 for every line. No first-line indent.
- The text contains a sentence-final period mid-span ("…those they serve.  "), followed by a new sentence ("The "short form" of the Concepts, which follows, …"), but no typographic paragraph break separates them.

**Decision**: emit as a single `paragraph` block. A human editor might prefer to split after "those they serve." for readability, but per conventions I follow the typography, not the semantics.

Reference: appendix-i's intro prose DOES have y-gap-based paragraph breaks (~27.6pt between, 13.3pt within), so it correctly fragments into 4 paragraphs. This section's intro is typographically a single paragraph.

### 3. List-item kind and marker preservation

All 12 Concepts are emitted as `list-item` blocks, consistent with appendix-i's traditions and ch05's steps. The roman-numeral marker (`I.`, `II.`, …, `XII.`) is preserved as the opening of each item's `text`, exactly as appendix-i preserves `One—`, `1.—`, etc.

Marker-detection strategy: two-gate — line starts with roman-numeral + `.` AND font is `NewCaledonia-Bold`. Both gates are necessary because Concept continuation lines contain words like `I` / `V` / `X` (e.g. "I. The trustees are the principal planners") that shouldn't match. Bold-font gate rules out all continuations.

### 4. Cross-page item merge

Item VI spans the 579→580 boundary. On p580, line `y=45.16` ("acting as the General Service Board.") is non-bold and does not match the roman-numeral marker regex, so the extractor continues the current (in-progress) item VI. No special cross-page heuristic was needed — the bold-font marker gate handles this naturally.

`pdfPage` for item VI is set to the starting page (579), matching the convention used elsewhere.

### 5. No other block kinds

- No `blockquote` — no editorial interludes.
- No `verse` — no short-line quoted passages.
- No `footnote` — no `*`/`†` markers.
- No `byline` — no author attribution.
- No `table`.

## Flagged blocks

None with uncertainty. If the PO disagrees with the single-paragraph intro (§ 2 above), the simplest split would be after "those they serve." — i.e. at line y=193/207 in the source — producing two paragraphs. But there's no typographic evidence for it and the conventions say to follow typography.

## Schema proposals

None. The existing `BlockKind` enum handled this section cleanly. The "parenthesized disambiguator merges into heading" rule from Wave 3 covered the `(Short Form)` case. The bold-marker list-item detection is section-specific but didn't require new schema machinery.

Minor observation for future waves: **letter-spaced letters** (`V I I` with spaces between glyphs in PyMuPDF's output) is worth noting in conventions. It shows up on appendix-vii's roman-numeral heading line. Easy workaround (collapse whitespace before merging) but worth a sentence in the heading-detection notes.
