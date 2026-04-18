# appendix-iv-the-lasker-award — extraction report

## Summary

Single-page appendix (p576) — the smallest appendix in the book. Extraction
emitted **3 blocks**: 1 `heading`, 2 `paragraph`. No list-items, no byline, no
footnote. No cross-page issues (single page). No uncertainty — the page has a
clean, minimal layout.

Block counts by kind:

- `heading`: 1
- `paragraph`: 2
- **total: 3**

## Method

- **Library:** PyMuPDF (`pymupdf`) only. Called `page.get_text("dict")` on page
  index 575 (PDF page 576).
- **Scripts:** `.tmp/probe-appendix-iv.py` (one-off probe) and
  `.tmp/extract-appendix-iv.py` (extractor). Both run via repo venv.
- **Heuristics fired:**
  - Heading: size `>= 13.0` at `y0 < 100`, matched in two stages (roman
    numeral then title).
  - Letter-spaced numeral collapse: `re.sub(r"\s+", "", "I V ") → "IV"`
    (conventions, Wave 6 rule; verified same pattern as appendix-vii's
    `V I I ` → `VII`).
  - Paragraph split: PyMuPDF's own block index (b2 vs b3) separated the
    intro and the citation cleanly. Y-gap 117.82 → 145.43 = ~27.6pt
    confirms (> 20pt threshold).
  - Running header: not applicable (no "APPENDICES" header at `y0 < 55`
    on this page).
  - Page number: not applicable (no digits-only line in the drop zone).

## Heading verification

Source lines:

- `y=45.10, size=13.02, text='I V '` (letter-spaced, NewCaledonia)
- `y=74.80, size=13.02, text='THE LASKER AWARD '` (NewCaledonia)

Merged heading block text: **`IV THE LASKER AWARD`** ✓

This follows the Wave 3 "roman-numeral on line 1 + title on line 2"
convention, joined by a single space. The letter-spacing in the numeral
line is collapsed per the Wave 6 "letter-spaced heading numerals" rule.

## Schema decisions

- **No byline.** The citation is from the American Public Health Association
  and is quoted in full; there is no signature / attribution block below it.
  Convention is to emit `byline` for "right-aligned author credits after a
  quoted epigraph" (appendix-ii / Spencer pattern) — but here no such credit
  line exists on the page. The attributor ("American Public Health
  Association") is embedded inside the quoted text itself.
- **Citation kept as `paragraph`, not `blockquote`.** The citation body is
  rendered in the same font size (10.98) and same left margin (x=63) as the
  intro paragraph — no smaller font, no different indent column, no
  parenthetical stage-direction brackets. Per the Wave 4 rule, `blockquote`
  is reserved for editorial-interlude typography. Quoted content alone
  (opening/closing curly-quote) is not a `blockquote` signal.
- **Curly quotes preserved.** The citation opens and closes with U+201C /
  U+201D; both retained as-is per conventions.
- **Spaced ellipses preserved.** The source text has `. . . ` (three periods
  separated by spaces, with trailing space) in two places. Line-join
  normalization collapses double spaces via `re.sub(r"[ \t]{2,}", " ", out)`
  which leaves single-spaced ellipses intact. Output has `alcoholism . . . In`
  and `blotted out . . . Historians`. This matches the source visual; no
  normalization to U+2026 was applied (conventions don't mandate it).
- **Mixed-font opening span preserved transparently.** PyMuPDF reports the
  opening curly-quote of the citation in `ArialMT` while the remaining text
  is `NewCaledonia`. This is a font-substitution artifact for the quote
  glyph and has no semantic meaning — joined into the paragraph normally.

## Flagged blocks

None. Every block is unambiguous:

- `appendix-iv-the-lasker-award-h001` (heading): `IV THE LASKER AWARD`
- `appendix-iv-the-lasker-award-p002` (paragraph): intro, 2 source lines,
  ends with colon — standard lead-in before a quotation.
- `appendix-iv-the-lasker-award-p003` (paragraph): the citation, 11 source
  lines, opens `"The American Public Health Association presents...`,
  closes `...myriad other ills of mankind."` No mid-word hyphenation
  splits, no em-dashes, no list structure. Clean prose join.

## Schema proposals

None. The conventions cover this section entirely without modification.
