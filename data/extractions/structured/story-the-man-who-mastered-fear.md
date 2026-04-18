# story-the-man-who-mastered-fear — extraction report

## Summary

Eighth story of Part II (Pioneers of A.A.), pages 261-272 (12 pages). 30 blocks
emitted: 1 heading, 29 paragraphs. No verse, no footnote, no list-item, no
byline, no table, no blockquote. JSON parses and conforms to the extended
`BookSection` schema.

## Method

- PyMuPDF `page.get_text("dict")` per page, iterating PDF pages 261..272.
- Drop filters:
  - `y0 < 50` AND `size <= 9.5` → drops the size-9 running title
    ("THE MAN WHO MASTERED FEAR" on verso, "ALCOHOLICS ANONYMOUS" on recto).
  - `y0 < 50` AND `text.strip().isdigit()` → drops the size-12 small-caps
    page numbers at top of page (e.g. "247" at y=37.24 on page 262).
  - `stripped.isdigit() and y0 > 500` → drops the single "246" page number at
    bottom of page 261 (first page's number is at bottom; all subsequent
    pages have the number at top).
  - `(N)` story-number prefix at top of first page → drops "(7) " at y=55.13
    on page 261 (per conventions — decorative numbering, not authored content).
- PyMuPDF bbox reveals first-line paragraph indents reliably:
  - Odd pages (261, 263, 265, 267, 269, 271): body margin 69.28,
    paragraph indent 81.28.
  - Even pages (262, 264, 266, 268, 270, 272): body margin 52.28,
    paragraph indent 64.28.
- Drop-cap merge: the `ParkAvenue` 51.65-pt "F" on page 261 at
  (x=68.87, y=157.78) was merged with the next body line at y=170.98
  ("or eighteen years, from the time I was") using **no space**
  because the drop-cap continues the first word: "F" + "or" → "For".
- Drop-cap wrap: subsequent lines at y=170.98 and y=185.59 start at x=102.03
  (well past body margin 69.28+15=84); they are treated as continuations of
  the first paragraph, not new paragraph starts. Body returns to body margin
  at y=200.19.
- Cross-line hyphenation: compound-prefix allowlist per conventions, with a
  section-local refinement (see Schema decisions).
- Cross-page paragraph continuation: handled implicitly — when the top of
  the next page starts at body margin (not paragraph indent), the extractor
  does not start a new paragraph. This worked for all 11 cross-page
  continuations in this section. No explicit post-pass merge was needed.

## Schema decisions

### Heading text vs section title

- Section `title` = `"The Man Who Mastered Fear"` (prose-case, metadata —
  from the prompt).
- `heading` block text = `"THE MAN WHO MASTERED FEAR"` (visual rendering).

Per conventions: intentional divergence between metadata title and visual
heading text.

### Story-number verdict

**Dropped.** The story-number prefix `(7) ` appears at y=55.13 x=197.49 on
page 261 at size 12.5 NewCaledonia. Per conventions, decorative story
numbering should not be emitted as its own block and should be dropped
from the title. The drop rule `re.match(r"^\(\d+\)\s*$", stripped)` on the
first page removes it cleanly. No trace of "(7)" appears in the heading
text or any block.

### Subtitle verdict

Three italic lines at y=106.37, 119.96, 133.56 on page 261, font
NewCaledonia-Italic size 11:

- Line 1: x=93.28 "He spent eighteen years in running away, and then "
- Line 2: x=81.27 "found he didn't have to run. So he started A.A. in "
- Line 3: x=81.27 "Detroit. "

Only **one** first-line indent (line 1 at x=93.28 vs continuation lines at
x=81.27). Per the Wave 3 dr-bobs softening ("emit one paragraph per indented
group"), this qualifies as a **single-paragraph** deck. Emitted as one
`paragraph` block (p002):

> "He spent eighteen years in running away, and then found he didn't have to
> run. So he started A.A. in Detroit."

### Drop-cap verdict

ParkAvenue 51.65-pt "F" at (x=68.87, y=157.78) on page 261, followed by a
null glyph ('\x00') stripped by `normalize_text`. Drop-cap is on its own
visual line (unlike vicious-cycle where the drop-cap and body share a line).
Merged with first body line at y=170.98 ("or eighteen years, from the time
I was"), **no space**, because drop-cap continues partial word "For":

> "For eighteen years, from the time I was twenty-one, fear governed my
> life..."

The first-span font of the body line is NewCaledonia-SC (small-caps tail "or
eighteen years, "), flowing into regular NewCaledonia for "from the time I
was". PyMuPDF reports lowercase glyph codes for small-caps; the merge is
lexically identical whether SC or regular.

Drop-cap wrap zone: two lines at y=170.98 (x=102.03) and y=185.59 (x=102.03)
both sit past body-margin+15; the extractor treats them as continuations of
the drop-cap paragraph, not new paragraph starts. The third line at
y=200.19 returns to body margin x=69.28, continuing the same paragraph.

### Byline verdict

**No byline.** The story ends "running away from life." at y=521.54 on page
272 (a complete sentence in the concluding paragraph). The next PDF page
(273) begins with "(8) HE SOLD HIMSELF SHORT" — the next story. No
signature, no attribution line, no author block. Consistent with most Part
II stories (Dr. Bob's Nightmare, Our Southern Friend, Vicious Cycle —
none have bylines; only ch01 Bill's Story and certain later stories do).

### List-item / verse / footnote / table / blockquote verdicts

- **No list-item.** No numbered or lettered list anywhere in the section.
- **No verse.** No centered short-line quoted passage. There is one italic
  sentence inline in a paragraph at y=273.57 page 266 ("Nothing had changed
  and yet everything had changed.") — italic alone is not a verse signal
  per conventions; kept inline with surrounding paragraph (p015).
- **No footnote.** No `*` or `†` markers anywhere.
- **No table.** No tabular content.
- **No blockquote.** No editorial interlude, no inset passage with smaller
  font + different indent. All dialogue and quoted speech is kept inline
  with surrounding paragraphs per conventions.

### Hyphenation — number-prefix allowlist refinement

The conventions allowlist (Wave 3 final) includes `one-`, `two-`, ..., `ten-`
as number-prefix compounds. This fires on page 264 y=185.62/200.22:

```
each day's stupor—and there were eighteen or nine-
teen such days in this man's home—was the thought:
```

The default allowlist behavior would preserve `nine-teen` (because `nine-` is
a prefix), producing "eighteen or nine-teen such days" — incorrect;
"nineteen" is a single word. This is a false-positive of the number-prefix
allowlist.

**Section-local fix:** when a number prefix (`one-`, ..., `ten-`) is
triggered at line end, check whether the next word is a known
**fraction** (`half`, `third`, `fourth`, `quarter`, ...) or a known
**number-compound right-part** (`day`, `fold`, `leaf`, `year`, `sided`,
`footed`, ...). If neither, strip the hyphen (treat as a cross-line
split of a non-compound word like "nineteen", "seventeen", etc.).

Implemented as two small allowlists:

```python
FRACTION_WORDS = ("half", "halves", "third", "thirds", "fourth", ...)
NUMBER_COMPOUND_WORDS = ("day", "days", "fold", "leaf", "year", ...)
```

Only applies when the prefix is one of `one-..ten-`. The general allowlist
prefixes (`self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`,
`so-`) continue to trigger keep-hyphen unconditionally, as before.

Spot-audit of cross-line hyphen breaks in this section (15+ instances):

| Token end | Next word | Action | Correct? |
|---|---|---|---|
| `sociolo-` | `gists` | strip → `sociologists` | yes |
| `con-` | `fidence` (was `ﬁdence`) | strip → `confidence` | yes |
| `at-` | `tended` | strip → `attended` | yes |
| `Vaca-` | `tions` | strip → `Vacations` | yes |
| `count-` | `less` | strip → `countless` | yes |
| `ex-` | `hausted` | strip → `exhausted` | yes (narrow allowlist — `ex-` excluded) |
| `to-` | `ward` | strip → `toward` | yes |
| `re-` | `sembling` | strip → `resembling` | yes (narrow allowlist — `re-` excluded) |
| `down-` | `town` | strip → `downtown` | yes |
| `simul-` | `taneously` | strip → `simultaneously` | yes |
| `pat-` | `tern` | strip → `pattern` | yes |
| `discov-` | `ered` | strip → `discovered` | yes |
| `drawn-out` | — | single-line compound, no cross-line | n/a |
| `nine-` | `teen` | **strip → `nineteen`** | **yes (section-local refinement)** |
| `fif-` | `teen` | strip → `fifteen` | yes (prefix `fif-` not in allowlist) |
| `pur-` | `posefulness` | strip → `purposefulness` | yes |
| `over-` | `powering` | strip → `overpowering` | yes |
| `indebt-` (hypothetical) | — | n/a | n/a |
| `en-` | `rolled` | strip → `enrolled` | yes |
| `emo-` | `tional` | strip → `emotional` | yes |
| `anticipa-` | `tion` | strip → `anticipation` | yes |
| `suf-` | `ficient` (was `ﬁcient`) | strip → `sufficient` | yes |
| `well-` | `rounded` | **keep → `well-rounded`** | **yes (allowlist)** |
| `ac-` | `curate` | strip → `accurate` | yes |
| `cir-` | `cumstances` | strip → `circumstances` | yes |
| `al-` | `most` | strip → `almost` | yes |
| `coopera-` | `tion` | strip → `cooperation` | yes |
| `ad-` | `justments` | strip → `adjustments` | yes |

All cross-line hyphens resolve correctly. The `nine-/teen` case is the
only one that exercised the section-local refinement.

### Em-dash cross-line joining

Per Wave 5 conventions refinement: when a line ends with `—` (em-dash),
join the next line **without inserting a space**. The script handles this
explicitly:

```python
if out.endswith("\u2014"):
    out = out + t.lstrip()
    continue
```

Confirmed correct for:
- p003: "dissolved fear—for a little while" (line ends "fear— ", next
  line starts "for a little while").
- Other em-dash occurrences within single lines (inside the PyMuPDF line
  text) are preserved verbatim.

One observed space-before-em-dash case (p013, page 266 y=98.02/112.63):

```
prayer. You can't lose, and maybe God will help you
—just maybe, mind you. Having no one else to turn
```

Resulting text: `"...help you —just maybe, mind you."` (with space).
This matches the source's typography (trailing space on line 1, em-dash
leads line 2) and precedent set by Wave 5 vicious-cycle
(p017 "traveling —one thing" and p018 "individuals —the whole world").
Not corrected; noting for awareness.

## Flagged blocks

All 30 blocks look clean. Noting a few points:

- **p003** (drop-cap paragraph, page 261, 296 chars): correctly merged
  drop-cap "F" with first body line, em-dash joined without space
  ("dissolved fear—for a little while"), and drop-cap wrap handled.
- **p005** (page 261→262, 525 chars): cross-page continuation without any
  post-pass merge — the page 262 top starts at body margin (x=52.28),
  not paragraph indent (x=64.28), so implicit continuation works.
- **p010** (page 264, 887 chars): contains the `nine-/teen → nineteen`
  resolution; reads cleanly.
- **p013** (page 266, has ` —just maybe` space-em-dash, see em-dash section
  above). Not corrected; matches source typography and precedent.
- **p023** (page 269→270, 388 chars): cross-page continuation reads
  "A.A. living, and a substantial improvement in my health, before I
  could take a full-time office job..." — clean merge.
- **p026** (page 270→271, 554 chars): cross-page continuation reads
  "...utterly banished fear. But this would not be the truth. The most
  accurate answer I can give you is this..." — clean merge. Also includes
  one italic-within-prose word ("can") on page 271 y=83.42 kept inline.
- **p028** (page 271→272, 955 chars): cross-page continuation; includes
  several italic-within-prose words kept inline per conventions.

## Uncertainties

None blocking. The one decision point was the number-prefix false-positive
on `nine-/teen`; the section-local refinement (fraction + number-compound
right-part allowlists) resolved it cleanly without widening the overall
prefix allowlist.

## Schema proposals

**Proposal (optional):** propagate the **number-prefix next-word check** to
conventions. The current allowlist treats `one-` ... `ten-` as
unconditionally hyphen-preserving, but this produces false positives on
`seven-/teen`, `eight-/teen`, `nine-/teen` (and arguably `six-/teen`,
`thir-/teen`, `four-/teen`, though those prefixes don't collide with the
allowlist entries). The conservative fix is:

> For number prefixes (`one-` ... `ten-`) at a cross-line split, keep the
> hyphen only when the next word is a recognized fraction
> (`half`, `third`, `fourth`, `quarter`, ...) or a known number-compound
> right-part (`day`, `fold`, `leaf`, `year`, `sided`, `footed`, ...).
> Otherwise strip the hyphen and join without a space.

This preserves `one-half`, `four-fold`, `ten-year`, etc., while correctly
resolving `nineteen`, `seventeen`, `eighteen` (if ever hyphenated), and
any other `N-teen` construction.

Flagged as a **deferred-decision** rather than a mandate; Plantin/PO can
decide whether to adopt or leave as a per-section refinement.

## Block counts by kind

| Kind       | Count |
|------------|-------|
| heading    | 1     |
| paragraph  | 29    |
| **total**  | **30** |

Sanity-check: heading (1) + subtitle (1) + body paragraphs (28) = 30.
Body-paragraph count reasonable for 12 pages (~2.3 per page; slightly
fewer than dr-bobs's 3/page, consistent with this story's longer paragraphs).
