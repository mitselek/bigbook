# appendix-v-the-religious-view-on-aa — structured extraction report

## Summary

Single page (577). Emitted 7 blocks: 1 `heading`, 5 `paragraph`, 1 `footnote`.
No list-items, no byline, no verse, no blockquote.
Extraction straightforward; no schema proposals.

## Method

- PyMuPDF `page.get_text("dict")` — single API call per page.
- Two-line centered heading merge (roman numeral line + title line, whitespace collapsed in numeral per conventions).
- Paragraph segmentation via **short-line + terminal-punctuation heuristic** (no y-gap between paragraphs on this page; no first-line indents).
- Body vs footnote classification by font size (body 10.98pt, footnote 10.02pt).
- Cross-line hyphenation handler preserved `self-insurance` and `self-respect` (but both of those are intra-line on this page — no cross-line hyphens actually fire).

## Schema decisions

### Heading merge

- Line 1: `'V '` at y=45.10, size 13.02 (NewCaledonia).
- Line 2: `'THE RELIGIOUS VIEW ON A.A. '` at y=74.80, size 13.02.
- Merged to `"V THE RELIGIOUS VIEW ON A.A."` (leading numeral with a single intervening space, trailing space trimmed). Follows the Wave 3 convention.

### Paragraph segmentation

All body lines share x0=63 (no first-line indents) and uniform line-height ~13.26 (no y-gaps). Detecting paragraph breaks required a different signal than the standard "first-line indent" rule. I used:

- **Short line + terminal punctuation** — if a line's right-edge x1 < 280 (content width ~335) AND the line ends with `.`, `!`, `?`, `:`, or a closing curly quote, the paragraph ends at this line.

This yielded 5 paragraphs:

1. `p002` (l0-l1): single short opening sentence, "Clergymen... their blessing." — l1 x1=151.63.
2. `p003` (l2-l10): Edward Dowling quote, "Edward Dowling, S.J.,* of the Queen's Work staff, says, 'Alcoholics... better Catholics.'" — l10 x1=191.92. Introducer + quote joined (comma after "says," keeps them one paragraph).
3. `p004` (l11-l20): Episcopal/Living Church quote, "The Episcopal magazine... therapy.'" — l20 x1=106.55.
4. `p005` (l21-l23): Fosdick introducer, "Speaking at a dinner... remarked:" — l23 x1=243.13. This one IS split from the subsequent quote because the colon sits at the end of its own line here (unlike appendix-iii where the colon is followed inline by the opening quote on the same line).
5. `p006` (l24-l29): Fosdick quote, "'I think that psychologically... to imagine.'"

### Structural artifact: trailing `_____` on l29

Line 29 is `that may surpass our capacities to imagine."_____` — PyMuPDF preserved what appears to be a footnote-separator horizontal rule rendered as underscore glyphs (span 2, NewCaledonia 10.98pt `_____ `). Stripped at paragraph-join time via `re.sub(r"_+\s*$", "", ...)`. Clean result: `"...to imagine."`.

### Footnote

l30-l31 at size 10.02pt (slightly smaller than 10.98pt body). Starts with `* `. Classified as `footnote` by size, marker preserved at front per Wave 1B convention. Text: `* Father Ed, an early and wonderful friend of A.A., died in the spring of 1960.`

### Cross-paragraph font quirks (noted, not an issue)

Two lines start with `ArialMT` font on their first span because their opening glyph is a curly quote `"`:

- l3 `'"Alcoholics Anonymous is natural...'` (continuation of Dowling paragraph)
- l24 `'"I think that psychologically speaking...'` (Fosdick quote paragraph opening)

These are font-per-glyph variations for the curly-quote character; they don't affect paragraph segmentation in this implementation.

### Compound hyphens

Page contains `self-insurance`, `self-insurance`, and `self-respect` — all intra-line (no cross-line hyphenation splits on this page). The hyphens are preserved verbatim in the text.

## Flagged blocks

None. All 7 blocks are confident.

Minor observation on `p005` / `p006` split (Fosdick): I split them because the source layout visually places `"remarked:"` alone on its own short line, with a line break before `"I think..."`. Appendix-iii's analogous pattern has the colon inline with the quote, so it stays a single paragraph — the difference here is purely a source-layout choice. Could be argued either way, but the visual paragraph break (short line + terminal colon) is the rule I followed.

## Schema proposals

None — existing conventions handled this section cleanly.
