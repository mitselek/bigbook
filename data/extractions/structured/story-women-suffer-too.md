# story-women-suffer-too — extraction report

## Summary

Fourth story of Part II (Pioneers of A.A.), pages 215-222 (8 pages). 22 blocks
emitted: 1 heading, 21 paragraphs. No list-items, no verse, no footnote, no
byline, no table, no blockquote. JSON parses. Schema conforms to the extended
`BookSection` shape in the conventions doc (Wave 3 revision).

## Method

- PyMuPDF `page.get_text("dict")` per page, iterating pdf pages 215..222.
- Drop filters:
  - `y0 < 50 AND size <= 9.5` → drops small running headers ("WOMEN SUFFER TOO"
    size 9 on even verso pages; "ALCOHOLICS ANONYMOUS" size 9 on odd recto
    pages).
  - `y0 < 50 AND digits-only` → drops top-of-page SC page numbers (size 12
    digits at y=37.24 — these are larger than 9.5 so the font-size filter
    wouldn't catch them; the digits-only check does).
  - digits-only text at `y0 > 500` → drops bottom-of-first-page SC page
    number ("200" on page 215).
  - `^\(\d+\)\s*$` at first page → drops the story-number prefix `(3)`
    (y=79.13 size 12.5 on page 215 — above the heading).
- Body margin alternates by parity: odd pages (215, 217, 219, 221) = 69.28;
  even pages (216, 218, 220, 222) = 52.28. First-line paragraph indent is
  body-margin + ~12.
- Drop-cap merge: ParkAvenue 51.65-pt `W` at (x=68.73, y=182.81) on page 215
  merged with the next body line `hat was I saying . . .` → `What was I
  saying . . .`. No space inserted (single letter + word-fragment).
- Paragraph boundary detection: first-line indent >= body-margin + 8.
- Cross-page merge: PyMuPDF splits blocks at page boundaries, but because the
  paragraph-indent heuristic simply does not fire when the first line of the
  next page is at body-margin x, the cross-page continuations merge
  automatically into the same paragraph block. Verified for the 215→216
  boundary ("My fright was real enough, but it / didn't account for these
  violent reactions..." joined as one paragraph).
- Cross-line hyphenation: conventions allowlist (Wave 3 final, 18 prefixes).
  Zero compound-hyphen false fires in this section. See verification table
  below.

## Schema decisions

### Heading text vs section title

- Section `title` = `"Women Suffer Too"` (prose-case, metadata — unchanged
  from the prompt).
- `heading` block text = `"WOMEN SUFFER TOO"` (visual rendering).

Per conventions: the metadata title and the visual heading text are
intentionally divergent.

### Story-number verdict

**Present and dropped.** The PDF has a `(3) ` line at y=79.13 size 12.5 on
page 215, above the heading `WOMEN SUFFER TOO`. Per conventions (structural
numbering, not authored content), this is dropped and NOT emitted as its
own block. The heading block contains only `WOMEN SUFFER TOO` — no `(3)`
prefix is included in the heading text.

### Subtitle verdict

**Single paragraph block.** The italic deck at y=130..158 on page 215 has
three lines (size 11 NewCaledonia-Italic). Only the first line shows a
first-line indent (x=93.28); the other two are at continuation-x=81.27.
Per conventions (soften "single paragraph default" only when multiple
first-line indents appear), a single paragraph is correct here:

> Despite great opportunities, alcohol nearly ended her life. An early
> member, she spread the word among women in our pioneering period.

### Drop-cap verdict

ParkAvenue 51.65-pt `W` at (x=68.73, y=182.81) on page 215. Followed by
`hat was I saying . . . from far away...` in NewCaledonia-SC font at y=196.01
(top-aligned with the drop-cap glyph). Single letter + word-fragment → **no
space** → `What was I saying...`. The subsequent wrapped lines (y=210..299
on page 215) indent around the drop-cap glyph at x=112.90 then at x=69.27 once
they clear the glyph height. Drop-cap wrap zone (y within dc.y+45 AND x >
body-margin + 15) detected correctly, keeping all these lines in the same
paragraph block (p003).

Note: the PyMuPDF glyph text for the drop-cap comes back as `W\x00` (the NUL
byte is a rendering artifact from the custom font). `normalize_text` strips
NULs, so the drop-cap text in the final output is simply `W` (merged into
`What`).

### Byline verdict

**No byline.** The story ends with
`"Thy will be done, not mine" . . . and mean it.` at y=492 on page 222, after
which there is only whitespace. No sign-off, no author attribution. No
`byline` block emitted — correct for this section.

### Paragraph-level edge cases

- **Italic inline pull-quote (page 220 y=214.84):** one line is set in
  NewCaledonia-Italic font — `"any kind of people without drinking. I never
  had been."`. This is the tail of a paragraph that begins in regular
  NewCaledonia font earlier on page 220. Per conventions ("italicized
  pull-quotes within prose ... kept inline with the surrounding paragraph is
  the current precedent"), this is kept inline with p015. Not emitted as a
  separate block, not as verse, not as blockquote. The italic styling is
  flattened in our plain-text output.

- **No verse, no blockquote, no footnote, no table, no list-item.** The
  story is pure prose throughout. Zero verse false-positives — the
  ellipsis-heavy opening paragraph (`. . . from far away, as if in / a
  delirium ...`) was at one point a risk for a naive verse detector, but the
  indent-only paragraph rule handles it correctly.

### Hyphenation — verification

All cross-line hyphen breaks in this section (24 of them) resolve to the
correct English form under the default strip + conventions allowlist:

| Token end | Next word | Action | Correct? |
|---|---|---|---|
| `sud-` | `denly,` | strip → `suddenly,` | yes |
| `con-` | `versation` | strip → `conversation` | yes |
| `re-` | `membered` | strip → `remembered` (×3, pg 216 + 217) | yes |
| `sec-` | `tion.` | strip → `section.` | yes |
| `any-` | `thing` | strip → `anything` | yes |
| `Sea-` | `brook's` | strip → `Seabrook's` | yes |
| `some-` | `thing` | strip → `something` | yes |
| `con-` | `stant` | strip → `constant` | yes |
| `shatter-` | `ing.` | strip → `shattering.` | yes |
| `remember-` | `ing,` | strip → `remembering,` | yes |
| `con-` | `ventional` | strip → `conventional` | yes |
| `immor-` | `talized` | strip → `immortalized` | yes |
| `ﬁnishing` (ligature) | — | normalize → `finishing` | yes |
| `amaz-` | `ing` | strip → `amazing` | yes |
| `mon-` | `strous` | strip → `monstrous` | yes |
| `im-` | `portant` | strip → `important` | yes |
| `straight-` | `ened` | strip → `straightened` | yes |
| `teeto-` | `talers` | strip → `teetotalers` | yes |
| `in-` | `tellectual` | strip → `intellectual` | yes |
| `hope-` | `less` | strip → `hopeless` | yes |
| `cri-` | `sis` | strip → `crisis` | yes |
| `re-` | `treat` | strip → `retreat` | yes |
| `willing-` | `ness` | strip → `willingness` | yes |
| `con-` | `crete` | strip → `concrete` | yes |

All 24 cross-line hyphens resolve correctly. Zero compound-prefix triggers
fired (no `self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`,
or `one-`..`ten-` at line-end in this section). Same-line compound hyphens
are naturally preserved: `three-quarters`, `thirty-two`, `self-will`,
`long-time`, `fellow-sufferer`.

Ligatures normalized: `ﬁ` → `fi` throughout (e.g. `Terrified`, `fix`, `fifteen`,
`finding`, `find`, `fight`, `filling`, `filled`, `fight`, `first`, `finally`,
`qualified`, `basement flat` has `ﬂ` → `fl`).

## Flagged blocks

All 22 blocks look clean. The three longest paragraphs are flagged here for
second-look awareness:

- `p006` (1184 chars, page 216) — "The shakes grew worse..." to
  "...I wouldn't even know it!". Single paragraph in source (no first-line
  indent from y=171 to y=448 on page 216). Starts with indent at y=171.04
  x=64.28; ends at y=448.47 before next indent at y=463.07 x=64.28. Correct.
- `p011` (1042 chars, page 218) — "My family had money..." to
  "...exactly what I wanted to do.". Starts at y=185 page 218 indent, ends at
  y=433 page 218 before next indent y=448.
- `p017` (1072 chars, page 220, bleeds into 221) — "That was the point at
  which my doctor gave me the book Alcoholics Anonymous..." ends at "...more
  and more hopeless about myself." on page 221 y=68. Cross-page merge via
  the "no new indent on next page" rule. Correct.

## Schema proposals

None. The section extraction uses only mechanisms already accepted into the
conventions doc through Wave 4. No new block kinds needed, no changes to
the hyphenation allowlist, no changes to drop-cap rules, no changes to
running-header filters.

## Uncertainties

- None blocking.

## Block counts by kind

| Kind       | Count |
|------------|-------|
| heading    | 1     |
| paragraph  | 21    |
| **total**  | **22** |

Sanity-check: heading (1) + subtitle paragraph (1) + body paragraphs (20) = 22.
Body-paragraph density ~2.5 per page across 8 pages is plausible for a
prose-heavy story.
