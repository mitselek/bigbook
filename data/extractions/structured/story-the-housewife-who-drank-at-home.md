# story-the-housewife-who-drank-at-home — extraction report

## Summary

Structured extraction of "The Housewife Who Drank at Home" (PDF pages 306–311,
1-indexed). Third story (story-number `(3)`) in Part II.B / **They Stopped in
Time** (`parentGroup: personal-stories/they-stopped-in-time`).

Emitted **18 blocks**: 1 heading + 17 paragraphs. No list-items, verse,
footnotes, tables, blockquotes, or bylines.

**Headline feature:** first multi-line story heading in the structured path.
Visual rendering spans two centered lines (`THE HOUSEWIFE WHO DRANK` /
`AT HOME`); merged into a single `heading` block with `" "` separator →
`"THE HOUSEWIFE WHO DRANK AT HOME"`. This extends the Wave 3 appendix
two-line-heading pattern to stories.

## Method

- **Library:** PyMuPDF (`pymupdf`); `page.get_text("dict")`. No `pdfplumber`.
- **Heuristics fired:**
  - Two-line heading detection: size ≥ 13 on first page, font `NewCaledonia`
    (not italic), `y0 < 140`. Both matching lines merged with a space.
  - Running headers dropped at `y0 < 50` AND (`size <= 9.5` OR digit-only).
  - Bottom-of-page page-number drop: digit-only AND `y0 > 500`.
  - Story-number `(3)` at y=79 size=12.5 on page 306 dropped as structural
    numbering (per Wave 1B / Wave 3 conventions; numbering resets at the start
    of Part II.B).
  - Italic subtitle detection: `"Italic"` in font, size < 11.5, `y < 200`.
  - Drop-cap detection: `font == "ParkAvenue"` AND `size > 40`.
  - Body-margin alternation: even pages 306/308/310 at x≈52.28; odd pages
    307/309/311 at x≈69.28. Paragraph indent threshold = margin + 8.
  - Drop-cap wrap-window: lines with `y0 < dropcap_y + 45` and
    `x0 > body_margin + 15` on page 306 are treated as continuation of the
    drop-cap's first paragraph.
  - Cross-line hyphenation with full Wave 6 allowlist (prose prefixes +
    small-number + ordinal-decade prefixes + number-tail qualification).
  - Em-dash line-join: no space inserted after line-end `—` (Wave 5 rule).
  - Multi-hyphen compound preservation (`-[A-Za-z]+-$`): preserved
    `Jekyll-and-Hyde` and `merry-go-round` at line-end split points.
  - **Capitalized-stem hyphen preservation refinement** — see Schema decisions.

## Schema decisions

- **Two-line heading merge (`h001`):** the story title occupies two centered
  lines on page 306 — `THE HOUSEWIFE WHO DRANK` (y=102.22, x=82.96) and
  `AT HOME` (y=122.22, x=155.83). Both at size 13.5 NewCaledonia. Merged into
  a single `heading` block joined with `" "`:
  `"THE HOUSEWIFE WHO DRANK AT HOME"`. Follows the Wave 3 appendix
  two-line-heading pattern (e.g. `I THE A.A. TRADITION`) extended to a STORY
  heading. The section metadata `title` remains prose-case
  `"The Housewife Who Drank at Home"`.
- **Subtitle (`p002`):** 3 italic lines on page 306 at y=150, 164, 178 (size
  11.0, NewCaledonia-Italic). First line indented at x=76.28; lines 2–3 at
  x=64.27 (continuation). Single indent group → one `paragraph` block per the
  Wave 3 rule.
- **Drop-cap merge (`p003`):** `M` (ParkAvenue, 51.65pt) + first body
  fragment `y story happens to be a particular kind of` (NewCaledonia-SC, 12pt)
  → `My story happens to be a particular kind of` (no space between `M` and
  `y`). The SC tail's only standalone lowercase `i` pronouns are caught by
  the Wave 6 `\bi\b → I` localized rule (the merged first line has `I had`
  later in the same paragraph, but those come from a subsequent non-SC line
  and do not trigger the pronoun regex). Applied regex is a no-op here but
  retained for consistency.
- **Story-number `(3)`:** dropped per conventions. Confirms Part II.B reset
  numbering is holding: Missing Link was (1), and this is (3), so there's an
  intervening (2) — which is `story-young-stopped-drinking` or a similar
  Part II.B entry between them.
- **No byline:** story ends on page 311 at y=477.73 with
  `"...in everything I do."` followed only by the page-footer running header
  and page-number. Checked page 312 — it starts the next story
  `(4) PHYSICIAN, HEAL THYSELF!`. No author sign-off.
- **Capitalized-stem hyphen rule refinement:** the Wave 6 "capitalized-stem
  preserves hyphen" rule triggered a false positive in this story: the phrase
  `But not happy. Be-` / `cause I found that everything I turned to…` (page
  310→310 internal split) would have emitted `Be-cause` rather than
  `Because`. I tightened the capitalized-stem check to require BOTH
  `stem_chars[0].isupper()` AND `len(stem_chars) >= 3` AND the stem is NOT
  sentence-initial (preceded by `.`/`!`/`?` + whitespace in the out-buffer).
  This preserves the rule's intended win for proper-noun compounds
  (`God-consciousness`, `Anglo-Saxon`, `Judeo-Christian`) while rejecting
  sentence-initial ordinary words that happen to be hyphenated across a line
  break. See **Schema proposals** below.
- **Cross-page paragraph merges** — right-margin carry-over heuristic applied:
  - 307→308 (within p008): page 307 last body line `"I needed it,"` ends
    near right margin (x1=340.30), next page indent-less continuation
    `"and I knew I was drinking too much,"` merged.
  - 308→309 (within p011): `"But there came a"` (x1=323.23 near right
    margin), next page continuation `"point when I could no longer live…"`.
  - 309→310 (within p014): `"I was off on"` (x1=323.27), continuation
    `"the usual merry-go-round."` merged.
  - 310→311 (within p017): page 310 last body line ends in `.` (fresh
    paragraph starts on 311 at indent x=81.28).
  All resolved correctly by first-line indent detection.

## Flagged blocks

- **`story-the-housewife-who-drank-at-home-p007`** — contains `halfempty`
  which should read `half-empty`. Source: line-end `a half-` (page 307) +
  line-start `empty bottle wasn't worth keeping` (page 307). The current
  compound-hyphen allowlist does NOT include `half-`, so the cross-line
  rule strips the hyphen and concatenates → `halfempty`. This is the same
  class of defect as `pay-day→payday` (jims-story), `fast-thinking→fastthinking`
  (ch10), `witch-burners→witchburners` (ch07), all deferred in Wave 6 as
  requiring a lexical dictionary rather than a narrow prefix allowlist.
  Flagging here for consistency; not attempting a unilateral fix.

## Schema proposals

- **Capitalized-stem hyphen — sentence-initial disqualification.** Propose
  extending the Wave 6 "capitalized-stem preserves hyphen" rule:

  > If the string preceding the line-end `-` starts with an uppercase letter,
  > keep the hyphen **when** (a) the stem is ≥ 3 characters AND (b) the stem
  > is not sentence-initial (the out-buffer immediately before the stem does
  > not end with `.`/`!`/`?` followed by whitespace).

  Rationale: the observed false positive in this story
  (`Be-` + `cause` → `Be-cause` instead of `Because`) comes from an ordinary
  word hyphenated at a sentence start. The proper-noun cases the rule was
  designed for (`God-`, `Anglo-`, `Franco-`, `Judeo-`) are all ≥ 3 chars AND
  typically mid-sentence, so the tightening has zero known cost. I applied
  this refinement locally in the extraction script; proposing it for the
  conventions doc so future agents get the same behavior for free.

  If adopted, the conventions entry at line 132 of the conventions doc would
  read:

  > **Capitalized-stem hyphen preservation** — orthogonal to the lowercase
  > allowlist. If the string preceding the line-end `-` starts with an
  > uppercase letter (e.g. `God-`, `Anglo-`, `Franco-`, `Judeo-`), keep the
  > hyphen **when** (a) the stem is at least 3 characters long, AND (b) the
  > stem is not sentence-initial (the out-buffer does not end with `.`, `!`,
  > or `?` followed by whitespace immediately before the stem). The length
  > check excludes 2-letter false positives like `Be-` (Because) at the
  > start of a new sentence. Capitalized stems are proper-noun halves of
  > compounds; the false-positive risk is low because most capitalized
  > words appear at sentence starts and don't end in `-`. Observed:
  > `God-consciousness` (appendix-ii). False positive caught and fixed:
  > `Be-cause` at a sentence start (story-the-housewife-who-drank-at-home).

- **Two-line story heading pattern** — the conventions doc already documents
  appendix two-line headings (`I THE A.A. TRADITION`) and notes the rule
  extends to parenthesized disambiguators. This is the first *story* to need
  the same treatment, and the current rule phrasing works cleanly without
  modification. Proposing no text change — just noting that this story is a
  precedent for "story headings may span two centered lines too; merge the
  same way." The evolution log could note:

  > Wave 7 story-the-housewife-who-drank-at-home: first multi-line STORY
  > heading in the structured path. Two-line title
  > (`THE HOUSEWIFE WHO DRANK` / `AT HOME`) merged to a single heading
  > block joined with `" "`. Same pattern as appendix two-line headings.

## Uncertainties

- **`halfempty` vs `half-empty`:** as noted in Flagged Blocks, this is a
  known deferred lexical issue. Current output preserves the
  no-allowlist-match behavior (strip hyphen, join).
- **No heading-size variation within the merged heading:** both lines are
  13.5pt. If future two-line story headings mix sizes (e.g. a roman-numeral
  story-number at one size and a title at another), the current merge
  heuristic (any `size >= 13.0` line on page 1 above y=140) may need refinement.
  Not a concern for this section.
