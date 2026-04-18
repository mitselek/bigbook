# story-a-vision-of-recovery — extraction report

## Summary

Personal story "A Vision of Recovery" (Part III, They Lost Nearly All, story
#8), pages 500-506 of the PDF (same book pages), 7 pages. Extracted **22
blocks** total: 1 heading, 1 subtitle paragraph, 20 body paragraphs. No
verses, no lists, no footnotes, no tables, no byline.

The extraction was clean — all standard conventions rules (Wave 1-7) applied
without requiring section-specific schema extensions. One minor script
extension was necessary for a case not explicitly covered in the conventions
doc (cross-line hyphen where the next line starts uppercase — e.g.
`Mic-`/`Mac`); see "Schema decisions" below.

## Method

- **Library:** PyMuPDF only (`page.get_text("dict")`). No pdfplumber
  needed for structural decisions. One pdfplumber cross-check with
  `page.chars` was run to confirm the missing opening quotation mark on
  page 500 is a genuine source-PDF artifact (no `"` glyph exists in the
  text stream before the drop-cap), not a PyMuPDF extraction issue.
- **Per-line tuples:** text, x0, y0, x1, y1, font, size, pdf_page.
  Normalized text (ligatures → ASCII, soft hyphens stripped, NUL stripped,
  curly quotes preserved).
- **Drop rules applied:** running headers (`y0 < 50` AND `size <= 9.5`),
  top-of-page page numbers (`y0 < 50` AND digits-only), bottom-of-page page
  numbers (`y0 > 500` AND digits-only), story-number `(8)` on page 500.
- **Heading detection:** size 13.5 NewCaledonia, title match "VISION".
- **Subtitle detection:** italic ~11pt lines on first page, above drop-cap
  (`y0 < 165`). Single indent group → single paragraph.
- **Drop-cap merge:** ParkAvenue 51.65pt "I" at y=168.85 + first body line
  in NewCaledonia-SC starting at x=96.28 y=182.06 ("thought i was
  different because I'm an"). Drop-cap is a standalone pronoun-word,
  followed by a separate word `thought` → merge with a space
  (`"I " + "thought..."`). Post-flatten `\bi\b → I` applied to fix the
  small-caps `i` in `"I was different"`.
- **Narrow-glyph `I` wrap zone:** used +20pt wrap x-offset (Wave 7 rule
  for narrow glyphs) to correctly classify the SC-continuation line at
  x=96.28 y=196.83 as in-wrap (not a new paragraph-start).
- **Body margins:** even pages (500, 502, 504, 506) ~69.28; odd pages
  (501, 503, 505) ~52.28. First-line paragraph indent = body_margin + 12.
- **Cross-page paragraph merge:** right-margin carry-over heuristic
  (`x1 > 280` on the last line of the prior page block). Verified on
  four cross-page paragraphs (p006, p010, p013, p016, p019).

## Schema decisions

### Drop-cap handling
Single-letter drop-cap `I` followed by a separate word `thought` — inserted
a space on merge (`"I thought i was different..."`). Consistent with
`story-gratitude-in-action` precedent (`"I believe..."`). Post-flatten
`\bi\b → I` additionally converted the small-caps `i` in
`"because i was different"` → `"because I was different"`.

### Subtitle → single paragraph
Two italic 11pt lines with a single indent group (first line x=93.28,
continuation x=81.27). Per Wave 3 rule, a single-indent-group italic deck
becomes one paragraph block. Emitted as `p002`: `"A feeble prayer forged a
lasting connection with a Higher Power for this Mic-Mac Indian."`

### Story-number `(8)` dropped
Per Wave 1 convention, the structural story-numbering `(N)` is not authored
content and is dropped (not emitted).

### Cross-line hyphen with uppercase continuation
Source has `Mic-` (line-end p500) + `Mac` (line-start p501) → should
render `Mic-Mac`. The conventions doc's cross-line hyphenation rules only
describe lowercase continuations; they don't explicitly cover a
proper-noun compound where the second half starts uppercase. Without a
rule, the default "next char is not lowercase, so do not strip hyphen"
branch fell through to "insert a space between lines", producing
`Mic- Mac` (wrong).

**Script extension (section-specific):** when the previous line ends with
`-` AND the next line starts with an uppercase letter, preserve the
hyphen AND join without inserting a space (treat as a proper-noun
compound). Produces `Mic-Mac` ✓.

This is a narrow rule — no false-positive risk in this section (the only
uppercase-continuation after line-end `-` here is the proper-noun `Mac`).
See "Schema proposals" below for a conventions-level proposal.

## Flagged blocks

### `story-a-vision-of-recovery-p003` — missing opening curly quote
```
I thought I was different because I'm an Indian." I heard that statement...
```
The source PDF has a closing `"` (`.\u201d`) after `Indian.` but **no
opening `"` glyph** before `I thought`. Confirmed via both PyMuPDF's
`get_text("dict")` and pdfplumber's `page.chars` — no `U+201C` (left
double quote) character exists in the text stream at that position.

This appears to be a decorative choice in the book's typography: the
drop-cap `I` serves as both the opening letter AND visually substitutes
for an opening quotation mark in the running dialog `"I thought i was
different because I'm an Indian."`. The balancing closing `"` remains in
the body text.

**Kept as-is per `story-winner-takes-all` precedent** (preserve source
rendering even when it violates typographic symmetry; flag in `.md`). No
synthesized `"` inserted.

## Schema proposals

### Cross-line hyphen with uppercase continuation (proper-noun compounds)

The conventions doc (text normalization section) describes cross-line
hyphenation for lowercase continuations but does not explicitly handle
the case where the continuation starts uppercase. Recommended rule:

> When a line ends with `-` AND the next line begins with an uppercase
> letter, treat as a proper-noun compound (e.g. `Mic-Mac`, `Anglo-Saxon`,
> `Judeo-Christian`): preserve the hyphen AND join without inserting a
> space.

Rationale: the vast majority of cross-line `-` + uppercase-start joins
in the Big Book are proper-noun compounds. A narrow rule (preserve +
no-space) matches source rendering for every case seen in this section
(`Mic-` + `Mac` → `Mic-Mac`). No false-positives observed — an
uppercase-start continuation after a mid-word hyphen is rare in
Big Book typography.

Current Wave 7 capitalized-stem rule (proper-noun allowlist + skip
sentence-initial) handles the case where the STEM starts with uppercase
and is followed by lowercase (e.g. `God-`/`consciousness`,
`Anony-`/`mous`). It does NOT handle the symmetric case where the stem
is lowercase and the continuation is uppercase (e.g. `Mic-`/`Mac`). The
proposed rule closes that gap.

## Counts

- heading: 1 (`h001`)
- paragraph: 21 (`p002` subtitle + `p003`..`p022` body)
- total: 22 blocks

## Cross-line hyphenation fired (verified)

- `fa-`/`ther's` → `father's` (p005, page 500)
- `occa-`/`sions` → `occasions` (p006, page 500)
- `Mic-`/`Mac` → `Mic-Mac` (p006, cross-page 500→501; see Schema decisions)
- `re-`/`solved` → `resolved` (p007, page 501)
- `ﬁf-`/`teen` → `fifteen` (p008, page 501)
- `birth-`/`day` → `birthday` (p009, page 501)
- `re-`/`fused` → `refused` (p010, cross-page 501→502)
- `re-`/`morse` → `remorse` (p011, page 502)
- `ex-`/`citedly` → `excitedly` (p013, cross-page 502→503)
- `psy-`/`chiatric` → `psychiatric` (p014, page 503)
- `argu-`/`ment` → `argument` (p016, page 503)
- `know-`/`ing` → `knowing` (p017, cross-page 503→504)
- `reser-`/`vation` → `reservation` (p018, page 504)
- `laugh-`/`ter` → `laughter` (p019, cross-page 504→505)
- `pro-`/`gram` → `program` (p020, page 505)
- `drink-`/`ing` → `drinking` (p022, page 506)
- `oth-`/`ers` → `others` (p022, page 506)
- `Anony-`/`mous` → `Anonymous` (p022, page 506 — capitalized-stem with
  `Anony-` NOT on the proper-noun allowlist; correctly strips)

## In-line hyphens preserved

`Mic-Mac` (multiple occurrences), `red-headed`, `Self-pity`,
`break-and-enter`, `hung-over`, `co-founder`, `twenty-eight-day`.

## Em-dash joins verified

- `change—you'll` (p015)
- `what—they` (p020)
- `answer—Alcoholics` (p022)

All three join without an inserted space.
