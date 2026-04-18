# story-the-keys-of-the-kingdom — extraction report

## Summary

Tenth and final Pioneer-era story of Part II, pages 283–291 (9 pages). 32 blocks
emitted: 1 heading, 31 paragraphs. No list-items, no verse, no footnote, no
byline, no table, no blockquote. JSON parses. Schema conforms to the extended
`BookSection` shape in the conventions doc (through Wave 5 revisions).

## Method

- PyMuPDF `page.get_text("dict")` per page, iterating pdf pages 283..291.
- Section-specific fix-up **before** drop-filters: fraction-superscript fold
  (see Schema decisions below).
- Drop filters (post-fold):
  - `y0 < 50 AND size <= 9.5` → drops small running headers ("THE KEYS OF THE
    KINGDOM" size 9 on even verso pages 284/286/288/290; "ALCOHOLICS
    ANONYMOUS" size 9 on odd recto pages 285/287/289/291).
  - `y0 < 50 AND digits-only` → drops top-of-page SC page numbers (size 12
    NewCaledonia-SC digits at y=37.24 — larger than 9.5 so size-only filter
    would miss them; digits-only check catches them).
  - digits-only AND `y0 > 500` → drops bottom-of-first-page SC page number
    ("268" on page 283 at y=540.74).
  - `^\(\d+\)\s*$` at first page → drops the story-number prefix `(9)` at
    y=79.13 size 12.5 on page 283 (above the heading).
- Body margin alternates by parity: odd pages (283, 285, 287, 289, 291) =
  69.28; even pages (284, 286, 288, 290) = 52.28. First-line paragraph indent
  is body-margin + ~12.
- Drop-cap merge: ParkAvenue 51.65-pt `A` at (x=69.14, y=168.85) on page 283,
  merged with the next body line `little more than fifteen years ago, through`
  → `A little more than fifteen years ago, through`. **Space inserted**
  (single-letter standalone drop-cap "A" = article word, next token "little"
  is a complete separate word — same class as the "I" + "believe" Wave 2
  precedent).
- Paragraph boundary detection: first-line indent >= body-margin + 8.
- Cross-page merge: PyMuPDF splits blocks at page boundaries, but the
  paragraph-indent heuristic does not fire when the first line of the next
  page starts at body-margin x, so cross-page continuations merge
  automatically. Verified for boundaries 283→284 (p005 closes; p006 starts),
  284→285 (p010 spans — "...I was being pushed around by a / compulsion to
  drink..."), 285→286 (p013 spans — "...had been taught that the alcoholic
  was incur- / able and should be ignored..."), 287→288 (p019 spans),
  288→289 (p022 starts fresh on 288; p023 starts fresh on 289 — see
  "cross-page carry?" note below), 289→290 (p028 starts on 290), 290→291
  (p029 starts fresh on 290 but continues into 291).
- Cross-line hyphenation: conventions allowlist (Wave 3 final, 18 prefixes).
  32 cross-line hyphen breaks in this section; all resolve correctly under
  the default strip-and-join rule with one flagged exception (see
  Flagged blocks).

## Schema decisions

### Heading text vs section title

- Section `title` = `"The Keys of the Kingdom"` (prose-case, metadata — from
  prompt).
- `heading` block text = `"THE KEYS OF THE KINGDOM"` (visual rendering).

### Story-number verdict

**Present and dropped.** The PDF has `(9) ` at y=79.13 size 12.5 on page 283,
above the heading. Per conventions (structural numbering, not authored
content), dropped and NOT emitted as its own block. Heading block contains
only `THE KEYS OF THE KINGDOM`. The number `(9)` marks this as the ninth
story in the Pioneers section after `(1)` Dr. Bob's Nightmare,
`(2)` Doctor, Alcoholic, Addict (not `(1)` twice — the `(9)` verifies a
consistent 10-story numbering starting from 1 for this Pioneer sequence,
matching "tenth Pioneer" in the prompt if we count from 0, or a known
history-editor deviation — but the PDF shows `(9)`).

### Subtitle verdict

**Single paragraph block.** The italic deck at y=130.71 (indented, x=93.28)
and y=144.48 (continuation, x=81.27) on page 283 has two lines (size 11
NewCaledonia-Italic). Only the first line shows a first-line indent; the
second is at continuation-x. Per conventions (soften "single paragraph
default" only when multiple first-line indents appear), a single paragraph
is correct:

> This worldly lady helped to develop A.A. in Chicago and thus passed her
> keys to many.

### Drop-cap verdict

ParkAvenue 51.65-pt `A` at (x=69.14, y=168.85) on page 283. Followed by
`little more than ﬁfteen years ago, through` in NewCaledonia-SC font at
y=182.06 x=116.78 (indented past the glyph width). The glyph returns as
`A\x00` in PyMuPDF (NUL artifact); `normalize_text` strips the NUL.

Merge decision: **single letter + space + complete word** → `A little`.
Rationale: "A" is the English indefinite article and is a complete
standalone word in the sentence. Per Wave 2 gratitude precedent ("I" +
"believe" → "I believe" with space; "W" + "ar" → "War" no space), the
drop-cap "A" here is the standalone-word class, so insert a space.

Wrap-zone lines (y within dc.y+45 AND x > body-margin + 15) are kept in the
same paragraph block (p003). The drop-cap-relative wrap on page 283 spans
y=182 through y=315 (end of p003).

### Byline verdict

**No byline.** Story closes at page 291 y=390 "…we have been given the Keys
of the / Kingdom." No sign-off phrase, no author attribution, no initialed
signature. No `byline` block emitted — correct for this section. (By
contrast, roughly half of Part II stories sign with "— Jane Q." or similar;
this one does not.)

### Fraction-superscript fold (section-specific)

Page 288 contains a mid-paragraph fraction `2 1⁄2 years` that PyMuPDF
splits across two text-"lines":

- Host line y=390.01: `'that much insight! He had been dry for 2 1⁄ years'`
  — the numerator "1" is size 6 in NewCaledonia-SC, and the `⁄` (U+2044
  Fraction Slash) sits alone between it and the space before "years". The
  denominator is **missing** from this concatenated line text.
- Companion line y=395.49 x=288.36: `'2 '` — size 6 NewCaledonia-SC, a lone
  superscript "2" whose bbox (y=395..402) sits **inside** the host line's
  y-span (y=390..404). This is the fraction's denominator.

A pre-filter `fold_superscripts` walks each page's lines and, for any line
with size <= 7.0 whose bbox y is within the y-span of a larger "host" line
and whose x overlaps the host's x-range, splices the tiny line's text into
the host **right after the `⁄` character** (if present) or appends with a
space (if not). For this story the splice produces `...dry for 2 1⁄2 years
and had been maintaining...`.

No general-purpose rule is proposed — this is a one-off glitch observed so
far only in this section. Documented here for transparency. If other
sections show analogous superscript-detached fractions in later waves, this
fold-pass might be worth promoting into the shared convention.

### Paragraph-level edge cases

- **Em-dash line joins:** p025 ("...some small part of their intriguing
  quality of living—and / sobriety—that would be enough.") and p030
  ("...mutual trust, understanding, and love— / without strings, without
  obligation—we acquire...") are both joined without inserting a space
  after the em-dash, per the Wave 5 em-dash rule. Verified: `"living—and"`,
  `"love—without"` in the output.
- **Cross-page merge (pg 284→285):** p010 starts on page 284 at y=375.42
  ("Between the ages of twenty-five and thirty, I tried / everything...")
  and continues through the page boundary to finish on page 285 at y=141.84
  (`"...I would die if I didn't get that / drink inside."`). The page-285
  first line "compulsion to drink that was completely beyond my" is at
  body-margin x=69.28 (no first-line indent), so the paragraph-start rule
  does not fire and the lines merge automatically.
- **Cross-page merge (pg 285→286):** p013 similarly spans. The page-286
  first line "had tried everything from having me attend daily mass" is at
  body-margin x=52.28.
- **No verse, no blockquote, no footnote, no table, no list-item.** Story is
  pure prose. Zero verse false-positives.

## Flagged blocks

- **p004 (`pseudo-sophistication` → `pseudosophistication`):** source line
  pg 283 y=388.84 ends in `'pseudo-'`, next line y=403.62 starts with
  `'sophistication.'`. The `pseudo-` prefix is NOT in the Wave 3 compound
  allowlist (which has `self-, well-, co-, non-, semi-, anti-, multi-, so-,
  one-..ten-`). The default strip-and-join rule fires, producing
  `pseudosophistication`. This is arguably incorrect — the intended word is
  the hyphenated compound `pseudo-sophistication`. Flagged for Plantin:
  propose adding `pseudo-` to the allowlist? (Risk: false positives in
  words like `pseudosymmetry` are rare in body prose, but the conventions
  already document conservative extensions.) Output kept as-is per
  constraints; rule-change is Plantin's call between waves.

- **p021 (`2 1⁄2 years`):** inline fraction produced by section-specific
  fold-pass. The fraction slash is the Unicode `⁄` (U+2044), preserved as-is.
  Downstream consumers that don't normalize `⁄` might render weirdly; this is
  source-faithful.

- **p027 (`ex-alkie`):** source-line hyphen (NOT a cross-line break) — pg
  290 y=112.63 reads `ship that was given so freely to me by my ex-alkie`
  entirely on one visual line. Preserved exactly, no action taken. Noting
  because `ex-` is not in the current allowlist but it's a same-line hyphen,
  so the allowlist is irrelevant.

## Schema proposals

None blocking. Two optional proposals Plantin may consider between waves:

1. **Detached-superscript fraction fold (section-level fix-up).** Currently
   hand-coded as `fold_superscripts` in this section's extractor. If two or
   more Wave-6/7 sections surface the same glitch, consider lifting the
   heuristic into the shared conventions ("if a tiny-font line's bbox sits
   inside another line's y-span and overlaps its x-range, splice the tiny
   line's text into the host").

2. **Widen compound-hyphen allowlist with `pseudo-`?** Narrow question,
   single flagged case (`pseudo-sophistication`). PO's call. Keeping the
   current conservative allowlist is also defensible — the resulting
   `pseudosophistication` is an unusual spelling but not a genuine content
   loss.

## Uncertainties

- **Story-number `(9)` vs "tenth Pioneer":** prompt labels this the tenth
  (and last) Pioneer story, but the PDF's decorative prefix is `(9)`. The
  discrepancy is consistent with zero-vs-one indexing or a known history
  (the "first Pioneer" Dr. Bob's Nightmare may be counted separately from
  the `(1)`-labeled first prefaced story). No action required — the prompt's
  metadata is the source of truth per conventions; `(9)` is dropped either
  way.

## Block counts by kind

| Kind       | Count |
|------------|-------|
| heading    | 1     |
| paragraph  | 31    |
| **total**  | **32** |

Sanity: heading (1) + subtitle paragraph (1) + body paragraphs (30) = 32.
Paragraph density ~3.6 per page across 9 pages — normal for an AA personal
story (closely matches Women Suffer Too's ~2.75/pg and Dr. Bob's ~4.5/pg).

## Front-matter verdicts summary

| Question | Verdict |
|---|---|
| Story-number `(N)` present? | Yes, `(9)` on page 283 |
| Story-number emitted? | No — dropped per conventions |
| Subtitle present? | Yes, 2 italic lines on page 283 |
| Subtitle kind? | Single `paragraph` block (one first-line indent only) |
| Drop-cap present? | Yes, ParkAvenue 51.65-pt "A" on page 283 |
| Drop-cap merged? | Yes — "A" + " " + "little" → "A little" (space, article word class) |
| Drop-cap NUL artifact? | Yes, `A\x00` — stripped by `normalize_text` |
| Byline present? | No — story closes "…the Keys of the Kingdom." no sign-off |
| Heading text matches visual? | Yes — `THE KEYS OF THE KINGDOM` (all-caps as PDF renders) |
| Running headers/page-numbers dropped? | Yes (8 pages of alternating headers + 9 page numbers) |
