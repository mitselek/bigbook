# story-he-sold-himself-short — extraction report

## Summary

Ninth story of Part II (Pioneers of A.A.), pages 273-282 (10 pages). 41 blocks
emitted: 1 heading, 34 paragraphs, 6 list-items (the "Six Steps" list on
page 278). No verse, no footnote, no byline, no table, no blockquote. JSON
parses. Schema conforms to the extended `BookSection` shape from the
conventions doc (Wave 5 revision).

## Method

- PyMuPDF `page.get_text("dict")` per page, iterating pdf pages 273..282.
- Drop filters:
  - `y0 < 50 AND size <= 9.5` → drops small running headers ("HE SOLD HIMSELF
    SHORT" size 9 on even verso pages; "ALCOHOLICS ANONYMOUS" size 9 on odd
    recto pages).
  - `y0 < 50 AND digits-only` → drops top-of-page SC page numbers (size 12
    digits at y≈37 — e.g. "259" on page 274, "260" on page 275). The font-size
    gate alone would miss these; the digits-only check catches them.
  - `digits-only AND y0 > 500` → drops bottom-of-page SC page number (e.g.
    "258" on page 273 at y=540).
  - `^\(\d+\)\s*$` at first page → drops the story-number prefix `(8)` at
    y=79 size 12.5 on page 273.
- Body margin alternates by parity: odd pages (273, 275, 277, 279, 281) =
  69.28; even pages (274, 276, 278, 280, 282) = 52.28. First-line paragraph
  indent is body-margin + ~12.
- Drop-cap merge: ParkAvenue 51.65-pt `I\x00` at (x=71.73, y=182.99) on page
  273 merged with the next body line `grew up in a small town outside Akron,
  Ohio,` → `I grew up in a small town outside Akron, Ohio,`. Space inserted
  because `I` is a standalone single-letter word and `grew` is a complete
  separate word (per Wave 2 story drop-cap rule: `W` + `ar` → `War` no-space;
  `I` + `believe` → `I believe` with space).
- List-item detection (restricted to page 278): NewCaledonia-SC font + x near
  69.28 + text matches `^\d+\.\s`. Six items emitted (l021..l026). The
  page-278-only restriction is intentional — other pages have NewCaledonia-SC
  runs that are NOT list items (e.g. page 273 y=196 "grew up in a small town"
  is the drop-cap continuation; page 275 y=190 "1937 to go through..." is a
  year numeral rendered in small-caps at the start of a wrapped line).
- Paragraph boundary detection: first-line indent >= body-margin + 8. Body
  prose resumes at x=64.28 on page 278 line y=200 ("Dr. Bob led me through
  all of these steps.") — that's the paragraph-indent signal after the list.
- Cross-page merge: PyMuPDF splits blocks at page boundaries, but because the
  paragraph-indent heuristic does not fire when the first line of the next
  page is at body-margin x, cross-page continuations merge automatically into
  the same paragraph block. Verified for e.g. the 273→274 boundary ("aided by
  the Depression, I found that I had a great / deal of spare time and that a
  little drink in the morn-ing helped...") joined into p006.
- Cross-line hyphenation: conventions allowlist (Wave 3 final, 18 prefixes).
  Two compound-hyphen allowlist triggers in this section: `self-respect`
  (page 275 same line — no cross-line fire but preserved); `so-called`
  (page 279 cross-line — allowlist fired correctly preserving `so-called`).
- Em-dash line-end join: applied at 277→278 boundary for p020 "Chicago—" +
  "it was" → "Chicago—it was" (no space per Wave 5 rule).

## Schema decisions

### Heading text vs section title

- Section `title` = `"He Sold Himself Short"` (prose-case, metadata —
  unchanged from the prompt).
- `heading` block text = `"HE SOLD HIMSELF SHORT"` (visual rendering).

Per conventions: the metadata title and the visual heading text are
intentionally divergent.

### Story-number verdict

**Present and dropped.** The PDF has a `(8) ` line at y=79.13 size 12.5 on
page 273, above the heading `HE SOLD HIMSELF SHORT`. Per conventions
(structural numbering, not authored content), this is dropped and NOT
emitted as its own block. The heading block contains only `HE SOLD HIMSELF
SHORT` — no `(8)` prefix is included in the heading text.

### Subtitle verdict

**Single paragraph block.** The italic deck at y=130..158 on page 273 has
three lines (size 11 NewCaledonia-Italic). Only the first line shows a
first-line indent (x=93.28); the other two are at continuation-x=81.27. Per
conventions (soften "single paragraph default" only when multiple first-line
indents appear), a single paragraph is correct here:

> But he found there was a Higher Power that had more faith in him than he
> had in himself. Thus, A.A. was born in Chicago.

### Drop-cap verdict

ParkAvenue 51.65-pt `I\x00` at (x=71.73, y=182.99) on page 273. Followed by
`grew up in a small town outside Akron, Ohio,` in NewCaledonia-SC 12pt at
y=196.20 (top-aligned with the drop-cap glyph). Single-letter standalone
word + complete separate word → **insert space** → `I grew up in a small
town outside Akron, Ohio,`. The subsequent wrapped lines (y=211..329 on
page 273) indent around the drop-cap glyph at x=94.53 for the next line,
then at x=69.28 once they clear the glyph height. Drop-cap wrap zone (y
within dc.y+45 AND x > body-margin + 15) detected correctly, keeping all
these lines in the same paragraph block (p003).

Note: the PyMuPDF glyph text for the drop-cap comes back as `I\x00` (the
NUL byte is a rendering artifact from the custom font). `normalize_text`
strips NULs, so the drop-cap text in the final output is simply `I` (merged
into `I grew...`).

### Six Steps list verdict

Page 278 y=112..185 emits six `list-item` blocks. The items are set in
NewCaledonia-SC font at size 12, x=69.28 (between body margin 52.28 and the
paragraph-indent threshold 60.28). The list is introduced by the prose
sentence "The six steps were:" which ends p020 (the paragraph that crosses
from page 277 to page 278). Body prose resumes at page 278 y=200 with "Dr.
Bob led me through all of these steps." at x=64.28 (paragraph indent),
opening p027.

All six items:

| id   | text                                                  |
|------|-------------------------------------------------------|
| l021 | `1. Complete deflation.`                              |
| l022 | `2. Dependence and guidance from a Higher Power.`     |
| l023 | `3. Moral inventory.`                                 |
| l024 | `4. Confession.`                                      |
| l025 | `5. Restitution.`                                     |
| l026 | `6. Continued work with other alcoholics.`            |

### Byline verdict

**No byline.** The story ends with `from showing a little love for others
and from serving them as I can.` at y=287 on page 282, after which there
is only whitespace. No sign-off, no author attribution. No `byline` block
emitted — correct for this section.

### Paragraph-level edge cases

- **Em-dash cross-page join (p020):** "The day before I was due to go back
  to Chicago—" ends page 277 and "it was Dr. Bob's afternoon off—he had me
  to the office..." begins page 278. The em-dash line-end rule (Wave 5
  refinement) correctly joins to "Chicago—it was Dr. Bob's afternoon off—he
  had me..." with no space after the first em-dash. The second em-dash is
  mid-line so no join logic is involved.
- **Suspended compound modifier (p006):** "two- or three-day benders" — the
  "two-" is followed by a space and "or" on the same PDF line (page 274
  y=68.81). This is a suspended-hyphen suffix construct, part of authored
  prose; preserved verbatim.
- **`so-called` compound across lines (p030):** page 279 y=171 ends with
  "so-" and y=185 begins with "called friends". The allowlist preserves
  the hyphen and joins without space → `so-called friends`. Correct.
- **NewCaledonia-SC false-positive avoidance:** two SC-font runs in body
  prose were NOT misidentified as list items —
  (a) page 273 y=196 `grew up in a small town outside Akron, Ohio,` (the
  drop-cap continuation where the SC font tail renders the first word's
  opening letters);
  (b) page 275 y=190 `1937 to go through the usual sobering up routine.`
  (year numeral in small-caps opening a wrapped line).
  The list-item detector restricts to page 278 + numeric prefix + x≈69.28
  so neither false-positive fires.
- **No verse, no blockquote, no footnote, no table.** The story is pure
  narrative prose plus one ordered list.

### Hyphenation — verification

All cross-line hyphen breaks in this section resolve to the correct English
form under the default strip + conventions allowlist. Sampled below (not
exhaustive; all verified against the probe dump):

| Token end | Next word | Action | Correct? |
|---|---|---|---|
| `re-` | `straining` (pg 273) | strip → `restraining` | yes |
| `ex-` | `pense` (pg 273) | strip → `expense` | yes |
| `morn-` | `ing` (pg 274) | strip → `morning` | yes |
| `dura-` | `tion` (pg 274) | strip → `duration` | yes |
| `ﬁve` (ligature pg 274) | — | normalize → `five` | yes |
| `ﬁnding` (ligature pg 274) | — | normalize → `finding` | yes |
| `ﬂannels` (ligature pg 274) | — | normalize → `flannels` | yes |
| `apart-` | `ment` (pg 275) | strip → `apartment` | yes |
| `un-` | `derstand` (pg 275) | strip → `understand` | yes |
| `en-` | `tirely` (pg 275) | strip → `entirely` | yes |
| `atti-` | `tude` (pg 276) | strip → `attitude` | yes |
| `com-` | `pletely` (pg 276) | strip → `completely` | yes |
| `begin-` | `ning` (pg 276) | strip → `beginning` | yes |
| `suc-` | `cessfully` (pg 277) | strip → `successfully` | yes |
| `phi-` | `losophy` (pg 277) | strip → `philosophy` | yes |
| `of-` | `ﬁce` (pg 278) | strip → `office` | yes |
| `selﬁsh-` | `ness` (pg 278) | strip → `selfishness` | yes |
| `ill-` | `temper` (pg 278) | strip → `ill-temper` | no cross-line split — same line had `ill-` at end |
| `ask-` | `ing` (pg 278) | strip → `asking` | yes |
| `im-` | `pressive` (pg 278) | strip → `impressive` | yes |
| `al-` | `ways` (pg 278) | strip → `always` | yes |
| `main-` | `tain` (pg 279) | strip → `maintain` | yes |
| `so-` | `called` (pg 279) | keep (allowlist) → `so-called` | yes |
| `doc-` | `tor` (pg 279) | strip → `doctor` | yes |
| `con-` | `tact` (pg 279) | strip → `contact` | yes |
| `les-` | `son` (pg 279) | strip → `lesson` | yes |
| `valu-` | `able` (pg 280) | strip → `valuable` | yes |
| `some-` | `thing` (pg 280) | strip → `something` | yes |
| `practi-` | `cally` (pg 280) | strip → `practically` | yes |
| `recom-` | `mend` (pg 280) | strip → `recommend` | yes |
| `ﬁfteen-minute` (same line pg 280) | — | preserve compound hyphen | yes |
| `ﬁre` (ligature pg 280) | — | normalize → `fire` | yes |
| `pros-` | `pects` (pg 281) | strip → `prospects` | yes |
| `be-` | `came` (pg 281) | strip → `became` | yes |
| `au-` | `tumn` (pg 281) | strip → `autumn` | yes |
| `ex-` | `pand` (pg 281) | strip → `expand` | yes |
| `contin-` | `ued` (pg 281) | strip → `continued` | yes |
| `Cour-` | `age` (pg 281) | strip → `Courage` | yes |
| `uncer-` | `tainties` (pg 281) | strip → `uncertainties` | yes |
| `ap-` | `praisal` (pg 282) | strip → `appraisal` | yes |

Notable:

- Exactly one allowlist trigger fires for a cross-line split: `so-` +
  `called` on page 279. Preserves the hyphen, no space inserted.
- `self-respect` (page 275) is same-line; the hyphen is preserved as-is, no
  join logic involved.
- `fifteen-minute` (page 280) is same-line; same story.
- `four-block` (page 274) is same-line; same story.
- `fair-weather` (page 282) is same-line; same story.
- `Six-Step` (page 277) is same-line; same story.
- `self-assurance` (page 282) is same-line; same story.
- `ex-` in `ex-doctor` (page 275 same line) and as a cross-line strip
  (`ex-` + `pense` page 273, `ex-` + `pand` page 281) — neither triggers
  the allowlist because `ex-` was removed from the allowlist in Wave 3. The
  strip-to-empty behavior is correct here (`expense`, `expand`).
- All ligatures (`ﬁ`, `ﬂ`, `ﬀ`) normalized to ASCII digraphs.
- NUL byte stripped from drop-cap glyph.

## Flagged blocks

All 41 blocks look clean. The three longest paragraphs:

- `p032` (1348 chars, page 279→280) — the "moral-inventory-every-day" lesson
  paragraph. Starts page 279 y=419.31 indent, spans cross-page boundary at
  279→280 (no indent at top of page 280), ends page 280 y=302 before the
  next indent at y=317. Correct.
- `p008` (1080 chars, page 274→275) — "One time my wife decided to try this
  too..." Starts page 274 y=331.64 indent, spans 274→275, ends page 275
  y=144 before the next indent at y=159. Correct.
- `p009` (1081 chars, page 275) — "After a particularly bad Christmas and
  New Year's holiday..." Starts page 275 y=159.88 indent, ends page 275
  y=461 before next indent at y=476. Correct, single-page block.

## Schema proposals

None. The section extraction uses only mechanisms already accepted into the
conventions doc through Wave 5. No new block kinds needed, no changes to
the hyphenation allowlist, no changes to drop-cap rules, no changes to
running-header filters, no changes to list-item detection heuristic
(beyond page-scoping it to the one page that has a list).

## Uncertainties

None blocking.

## Block counts by kind

| Kind       | Count |
|------------|-------|
| heading    | 1     |
| paragraph  | 34    |
| list-item  | 6     |
| **total**  | **41** |

Sanity-check: heading (1) + subtitle paragraph (1) + drop-cap-opening
paragraph (1) + body paragraphs across pages 273..282 (32) + six list
items = 41. Body-paragraph density ~3.4 per page across 10 pages matches
the cadence of a discursive Pioneers-of-AA story.

## Front-matter verdicts (summary)

| Verdict                 | Decision                                       |
|-------------------------|------------------------------------------------|
| Story-number `(8)`      | Present page 273 y=79 sz=12.5 — DROPPED        |
| Heading text            | `HE SOLD HIMSELF SHORT` (visual rendering)     |
| Subtitle structure      | Single paragraph (one first-line indent group) |
| Drop-cap `I`            | Merged with space → `I grew up...`             |
| Byline                  | None (absent from source)                      |
| Six-Steps list          | 6 `list-item` blocks, page 278                 |
| Page numbers (top)      | Dropped (mix of size 9 and size 12 SC)         |
| Page numbers (bottom)   | Dropped (size 12 SC at y>500 on page 273)      |
| Running headers         | Dropped (size 9, y<50)                         |
