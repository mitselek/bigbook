# appendix-vi-how-to-get-in-touch-with-aa — extraction report

## Summary

Single-page appendix (p578). Extraction emitted **6 blocks**: 1 `heading`, 5
`paragraph`. No list-items, no footnotes, no tables, no bylines, no verse, no
blockquotes. No cross-page concerns. No drop-caps (standard body-prose
opening). The section is short prose describing how to contact A.A.

Block counts by kind:

- `heading`: 1
- `paragraph`: 5
- **total: 6**

## Method

- **Library:** PyMuPDF (`pymupdf`) only. Called `page.get_text("dict")` on
  page index 577 (PDF page 578), plus `page.get_text("rawdict")` for a
  one-time character-level inspection of the heading span.
- **Scripts:** `.tmp/probe-appendix-vi.py` (full-page line dump),
  `.tmp/probe-appendix-vi-spans.py` (heading char-level verification), and
  `.tmp/extract-appendix-vi.py` (extractor). All run via the repo venv.
- **Cross-check:** `pdftotext -layout -f 578 -l 578` confirmed the visual
  reading order and the exact heading glyphs — no trailing period on the
  source's rendered title line.
- **Heuristics fired:**
  - Heading detection: `size >= 13.0` AND `y0 < 100`. Matched two
    centered lines at y=45.10 and y=74.86, both at size=13.02.
  - Letter-spaced roman-numeral collapse: the numeral line reads
    `V I  ` (letter-spaced). Collapsed via
    `re.sub(r"\s+", "", "V I  ")` → `VI`. Same rule as Wave 6's
    appendix-vii `V I I ` → `VII` and Wave 7's appendix-iv `I V ` → `IV`.
  - Paragraph splitting: **terminal-punctuation heuristic** (Wave 4,
    front-matter variant). All body lines on this page start at
    x0 ≈ 63.00 — no first-line indent signal — so short-line x1 alone
    is unreliable (see "Schema decisions"). A line terminates a paragraph
    when its text ends with `.`, `!`, or `?`. Verified to fire exactly on
    L8, L13, L21, L26, L31 — five paragraph ends matching visual reading.
  - Running-header / page-number drop: not applicable. Page 578 has no
    running header or page-number in the y0 < 50 band. (The heading
    numeral sits at y0 = 45.10, which is why the rule needs the
    `size <= 9.5 OR digits-only` qualifier — here the numeral is
    13.02pt and not digits-only, so it's correctly kept as heading.)

## Heading verification

Two centered source lines:

- y=45.10, size=13.02, font NewCaledonia, text `V I  ` (letter-spaced
  roman numeral, centered at x=189.72–212.71, page width ≈ 396).
- y=74.86, size=13.02, font NewCaledonia, text
  `HOW TO GET IN TOUCH WITH A.A ` (centered at x=89.70–309.48).

Character-level `rawdict` dump of the title line confirms the exact
glyph sequence ends at `...A . A` (space) — **no trailing period glyph**
in the source rendering. This is a source-typography divergence from
the metadata `title` ("VI How to get in Touch with A.A.") which does
include the trailing period. Per conventions, the `heading` block's text
preserves the source's visual rendering, so the block text is:

**`VI HOW TO GET IN TOUCH WITH A.A`** (no trailing period)

The metadata `title` field remains "VI How to get in Touch with A.A."
unchanged. This is the same kind of intentional divergence documented
for "Bill's Story" vs "BILL'S STORY" elsewhere in the extraction.

## Schema decisions

- **Paragraph splitting via terminal-punctuation, not short-last-line.**
  This page has no first-line paragraph indent — all body lines start
  at x0 = 63.00. The short-last-line heuristic (common elsewhere) fails
  here because line 15 (`www.aa.org; or a letter addressed to Alcoholics`)
  ends at x1 = 277.36 — visibly short — but is actually a continuation
  line: the wrap happened because "Anonymous" couldn't fit, not because
  the paragraph ended. Real para ends all finish with `.` on this page
  (directories. / Grapevine. / isolated you are. / USA. / special problems.),
  so the terminal-punctuation heuristic (Wave 4, front-matter variant)
  is the correct signal. Used `TERMINAL_CHARS = (".", "!", "?")` — `:`
  is **excluded** because L14 ends `visit our Web site:` as a
  mid-paragraph lead-in to the URL on L15, and `\u201d` is **excluded**
  because L7 ends with an intra-sentence quoted phrase
  `"Alcoholics Anonymous"` before the paragraph wraps into L8's
  `in telephone directories.`
- **No trailing period in heading text.** Source does not render one;
  block preserves the visual (see "Heading verification" above).
- **Curly quotes preserved.** The quoted listing `"A.A."` and
  `"Alcoholics Anonymous"` render with U+201C / U+201D in the source;
  retained as-is per conventions.
- **Apostrophe preserved.** `A.A.'s` uses U+2019; retained as-is.
- **No cross-line hyphenation cases.** Both `so-called` (mid-L6) and
  `Al-Anon` (mid-L24, mid-L27) land entirely within single source
  lines, so the cross-line compound-word rules don't fire. No manual
  fix-up needed.
- **No drop-cap.** This appendix opens with plain body text
  (`In the United States and Canada,…`) at normal body size. No
  ParkAvenue glyph, no small-caps lead-in. The chapter/story
  drop-cap-merge logic is not invoked.

## Flagged blocks

None. Every block is unambiguous.

- `appendix-vi-how-to-get-in-touch-with-aa-h001` (heading):
  `VI HOW TO GET IN TOUCH WITH A.A` — see verification above.
- `appendix-vi-how-to-get-in-touch-with-aa-p002` (paragraph):
  intro on finding A.A. in cities, ends "in telephone directories."
- `appendix-vi-how-to-get-in-touch-with-aa-p003` (paragraph): NY
  service center, ends "the A.A. Grapevine."
- `appendix-vi-how-to-get-in-touch-with-aa-p004` (paragraph): write-in
  instructions, ends "no matter how isolated you are."
- `appendix-vi-how-to-get-in-touch-with-aa-p005` (paragraph): Al-Anon
  address paragraph, ends "Virginia Beach, VA 23456, USA."
- `appendix-vi-how-to-get-in-touch-with-aa-p006` (paragraph): Al-Anon
  clearing-house description, ends "about your special problems."

## Schema proposals

None. The conventions (as of Wave 7) cover this section entirely without
modification. The only minor note: the "closing curly-quote `\u201d` as
a paragraph terminator" mentioned in the cross-page-paragraph-merge
conventions section turns out to be an unreliable signal for *within*-page
paragraph splitting — intra-sentence closing quotes end some mid-para
lines here. If a later wave starts codifying the within-page
terminal-punctuation splitter, consider dropping `\u201d` from the
default set and leaning on `.`, `!`, `?` plus a short-line confidence
cross-check.
