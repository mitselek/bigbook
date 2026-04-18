# story-dr-bobs-nightmare — extraction report

## Summary

First story of Part II (Pioneers of A.A.), pages 186-196 (11 pages). 39 blocks
emitted: 1 heading, 34 paragraphs, 4 list-item. No verse, no footnote, no
byline, no table. JSON parses. Schema conforms to the extended `BookSection`
shape in the conventions doc.

## Method

- PyMuPDF `page.get_text("dict")` per page, iterating pdf pages 186..196.
- Drop filters:
  - `y0 < 50` → drops running headers ("DOCTOR BOB'S NIGHTMARE" at size 9 on
    even verso pages; "ALCOHOLICS ANONYMOUS" at size 9 on odd recto pages;
    page-number small-caps at size 12 top-of-page).
  - digits-only text with `y0 > 500` → drops the bottom-of-first-page SC
    page number ("171" on page 186).
  - defensive drop for `(N)` story-number prefix on the first page —
    **no-op** for this section (see Story-number verdict).
- PyMuPDF bbox reveals first-line paragraph indent reliably — body margin
  alternates by page parity (even 52.28, odd 69.28) and paragraph-indent is
  body margin + 12 pt.
- Drop-cap merge: the `ParkAvenue` 51.65-pt "I" on page 186 at x=54.73 y=270.59
  was merged with the next body line ("was born in a small New England village
  of...") using a space separator ("I was ...").
- List detection on page 196: text pattern `^\s*\d+\.\s` combined with the
  known x-coordinate (69.27 vs body margin 52.28) and the fact this page is
  known to carry the four-reasons list. Hanging-indent continuations at
  x~85.27 were joined into the same list-item.
- Cross-line hyphenation: compound-prefix allowlist per conventions plus the
  narrow extension `one-` (see Schema decisions).

## Schema decisions

### Heading text vs section title

- Section `title` = `"Dr. Bob's Nightmare"` (prose-case, metadata — unchanged
  from the prompt).
- `heading` block text = `"DOCTOR BOB'S NIGHTMARE"` (visual rendering; note
  `Dr.` expanded to `DOCTOR`).

Per conventions: the metadata title and the visual heading text are
intentionally divergent.

### Story-number verdict

**Not present.** Despite the section spec warning that `(1)` might appear as
the first story of Part II, the PDF has no `(N)` prefix line on page 186.
The italic subtitle begins immediately below the heading. Defensive drop-rule
for `(N)` was kept in the script but fires zero times. Nothing to document
downstream.

### Subtitle verdict

The subtitle is typographically one italic "deck" (NewCaledonia-Italic size
11), 11 lines from y=107 to y=246 on page 186, but has **three first-line
indents** (at x=76.28 vs continuation x=64.27), clearly signaling three
distinct paragraphs in the source. Emitted as **three paragraph blocks**
(p002, p003, p004):

1. "A co-founder of Alcoholics Anonymous. The birth of our Society dates from
   his first day of permanent sobriety, June 10, 1935."
2. "To 1950, the year of his death, he carried the A.A. message to more than
   5,000 alcoholic men and women, and to all these he gave his medical
   services without thought of charge."
3. "In this prodigy of service, he was well assisted by Sister Ignatia at St.
   Thomas Hospital in Akron, Ohio, one of the greatest friends our Fellowship
   will ever know."

This is a richer subtitle than, say, story-gratitude-in-action (which has
one italic sentence). The three-paragraph split honors the author's
typographic intent. Alternative would be to collapse into a single paragraph
block — that would lose the visible structure.

### Drop-cap verdict

ParkAvenue 51.65-pt "I" at (x=54.73, y=270.59) on page 186. Merged with the
next line's text ("was born in a small New England village of"). Because
single-letter "I" followed by a complete separate word "was", a **space**
separator is correct: result "I was born...". Conventions guidance applied
verbatim.

The next nine lines on page 186 wrap around the drop-cap glyph at x=76.90
(vs body margin 52.28). They are detected as within the "drop-cap wrap
zone" (y within glyph span, x indented past body margin) and treated as
continuations of the first paragraph, not new paragraphs.

### Byline verdict

**No byline.** The story ends with "Your Heavenly Father will never let you
down!" (a body-paragraph sentence at y=463 on page 196, followed only by
whitespace). No signature, no attribution line. This contrasts with
ch01-bills-story which has a `Bill W., co-founder of A.A., died January 24,
1971.` byline, and with stories like Gratitude in Action whose author block
is inline elsewhere. No `byline` block emitted here — correct for this
section.

### List-items

Four genuine numbered list-items on page 196 (the "four reasons" Dr. Bob
carries the message):

1. `1. Sense of duty.`
2. `2. It is a pleasure.`
3. `3. Because in so doing I am paying my debt to the man who took time to pass it on to me.`
4. `4. Because every time I do it I take out a little more insurance for myself against a possible slip.`

Items 3 and 4 span two lines each in the source with hanging-indent
continuation at x~85.27; the join logic collapses them into single
list-item text strings. Items 1 and 2 are single-line. All four items start
in NewCaledonia-SC font (the small-caps rendering of "1." through "4."),
which was a helpful secondary signal but the primary detector was the
`^\d+\.\s` regex on a known page. A weaker extractor might mis-fire this
regex on body prose (the spec warned of "single list-item block containing
mid-story narrative text that trails from a `(N)` marker — false-fire from
the list-item regex"); our constraint `L.pdf_page == 196 and bm+10 < x <
bm+25` avoids that. No body-prose "(N)" prefixes were classified as
list-items.

### Hyphenation — compound-word allowlist extension

Per the conventions (Wave 2 narrowing) the allowlist is:
`self-`, `well-`, `co-`, `non-`, `ex-`, `semi-`, `anti-`, `multi-`.

This section contains a cross-line break `one-` / `half` on page 196:

```
craving for liquor much during the first two and one-
half years of abstinence.
```

Default stripping would produce `onehalf`, which is malformed. `one-half` is
a genuine English compound (fraction). I added `one-` as a narrow section-
scoped extension of the allowlist. See Schema proposals below.

Spot-audit of all 26 cross-line hyphen breaks in this section:

| Token end | Next word | Action | Correct? |
|---|---|---|---|
| `Charyb-` | `dis` | strip → `Charybdis` | yes |
| `con-` | `tainer.` | strip → `container.` | yes |
| `dis-` | `covered` | strip → `discovered` | yes |
| `drink-` | `ing,` | strip → `drinking,` | yes |
| `eve-` | `ning` | strip → `evening` | yes |
| `examina-` | `tions,` | strip → `examinations,` | yes |
| `incar-` | `cerated` | strip → `incarcerated` | yes |
| `inter-` | `ruptions` | strip → `interruptions` | yes |
| `morn-` | `ing` | strip → `morning` | yes |
| `morn-` | `ing-after` | strip → `morning-after` | yes |
| `noti-` | `fied` (was `ﬁed`) | strip → `notified` | yes |
| **`one-`** | **`half`** | **keep** → `one-half` | **yes (via extension)** |
| `ostra-` | `cized` | strip → `ostracized` | yes |
| `pain-` | `ful` | strip → `painful` | yes |
| `per-` | `mitted,` | strip → `permitted,` | yes |
| `pos-` | `sible` | strip → `possible` | yes |
| `privi-` | `leges` | strip → `privileges` | yes |
| `prob-` | `lem.` | strip → `problem.` | yes |
| `re-` | `main` | strip → `remain` | yes (narrow allowlist — `re-` excluded) |
| `remem-` | `ber` | strip → `remember` | yes |
| `re-` | `spect` | strip → `respect` | yes |
| `Satur-` | `day` | strip → `Saturday` | yes |
| `smug-` | `gling` | strip → `smuggling` | yes |
| `sup-` | `plied` | strip → `supplied` | yes |
| `un-` | `certain` | strip → `uncertain` | yes |
| `yield-` | `ing.` | strip → `yielding.` | yes |

All 26 cross-line hyphens are resolved correctly.

### Bugfix note: compound-hyphen join should NOT insert a space

While implementing the `one-` allowlist I noticed the upstream template
(`extract-story-gratitude.py`'s `join_paragraph_lines`) falls through to
`out += " " + t.lstrip()` when `keep_hyphen` is true. That produces
`one- half` (stray space) instead of `one-half`. Fixed in the script by
adding an explicit `if keep_hyphen: out = out + nxt` branch that joins
without inserting a space, consistent with how a compound like `self-respect`
is rendered. The Gratitude exemplar is unaffected because it has no
cross-line compound-hyphens in the first place. The Bills-Story exemplar has
none either. But a future section may; worth propagating the fix upstream
when conventions consolidate.

## Flagged blocks

All 39 blocks look clean. Noting the three long paragraphs in case they
bear a second look:

- `p020` (1158 chars, page 190-191) — "During the next few years, I developed
  two distinct phobias..." Single-paragraph in source; body prose with no
  first-line indent between them. Correctly bounded (ends at "...scolded.").
- `p021` (1015 chars, page 191-192) — "If my wife was planning to go out in
  the afternoon...Tugboat Annie...stocking racket were out!" Single
  paragraph, bounded by first-line indent at both ends. No split needed.
- `p028` (1117 chars, page 194-195) — "We entered her house at exactly five
  o'clock..." ends at "...one bottle of beer the next morning." Single
  paragraph in source. Correct.

## Schema proposals

1. **Add `one-` (and ideally `two-`, `three-`, `four-`, etc.) to the
   compound-word prefix allowlist** in the conventions doc. Rationale:
   number-word fractions ("one-half", "two-thirds") are genuine English
   compounds that appear in the source; stripping the line-end hyphen
   produces malformed joins (`onehalf`, `twothirds`). They are a distinct
   category from prose prefixes (self-, co-, etc.) — propose listing them as
   a separate "number-word fraction compounds" entry in the allowlist. For
   this section I applied only `one-` (the only one encountered); the
   broader list is proposed for Wave 4+.

2. **Document the "compound-hyphen join: no space" bugfix** in the
   conventions doc (or in a shared extraction-helper pattern). The current
   Wave 2 exemplars happen not to exercise this path; the first section
   that does (this one) exposed the bug. Proposed text for the conventions
   doc, under Text normalization → cross-line hyphenation:

   > When the compound-word allowlist triggers (keep the hyphen), **join the
   > two halves without inserting a space**. The result should be the
   > compound form (`self-respect`, `one-half`), not a space-separated
   > rendering (`self- respect`, `one- half`).

3. **Richer italic-deck subtitles**: this section has a three-paragraph
   italic deck. Current conventions say "emit as a single `paragraph` block
   when structurally a prose description". I deviated and emitted three
   paragraph blocks (because the source typography has three first-line
   indents). Consider softening the convention to "emit as one or more
   paragraph blocks, honoring first-line indents within the deck." No schema
   change required, only guidance.

## Uncertainties

- None blocking. The extraction is, by my reading, clean. The three schema
  proposals above are refinements; none affect the JSON shape of this
  section's output.

## Block counts by kind

| Kind       | Count |
|------------|-------|
| heading    | 1     |
| paragraph  | 34    |
| list-item  | 4     |
| **total**  | **39** |

Sanity-check: heading (1) + subtitle paragraphs (3) + body paragraphs (31) +
list-items (4) = 39. Body-paragraph count reasonable for 11 pages (~3 per
page).
