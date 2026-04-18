# story-fear-of-fear extraction report

## Summary

Second story in Part II.B ("They Stopped In Time"), same `parentGroup` as
story-the-missing-link. Pages 300..305 (PDF and book). Extraction produced **18
blocks**: 1 `heading` + 17 `paragraph`. No lists, no verse, no footnotes, no
table, no byline. Straightforward story body with the canonical Part II
front-matter signature (story number `(2)`, ALL-CAPS heading, 3-line italic
subtitle, `I`-pronoun drop-cap).

## Method

- PyMuPDF `page.get_text("dict")` per page 300..305. Line-level walk over spans,
  sorted by `(pdf_page, y0, x0)`.
- Heuristics fired:
  - **Running-header drop**: `y0 < 50 AND size <= 9.5` (odd-page title
    `ALCOHOLICS ANONYMOUS`, even-page title `FEAR OF FEAR`).
  - **Page-number drop**: `y0 < 50 AND text.isdigit()` (top-of-page 290..294 at
    12pt), `text.isdigit() AND y0 > 500` (bottom-of-page 289 on page 300).
  - **Story-number drop**: `(2)` at y=79 on page 300 — regex
    `^\(\d+\)\s*$` on first-page only.
  - **Heading match**: size ≥ 13 + `"FEAR" in text.upper()` → single `heading`
    block "FEAR OF FEAR".
  - **Subtitle detection**: italic font ≤ 11.5pt on first page above the
    drop-cap (y < 170). Three lines, single indent group (one line at x=76.28,
    two continuations at x=64.27) → ONE `paragraph` block per conventions
    default.
  - **Drop-cap detection**: `font == "ParkAvenue" AND size > 40` on first page.
    Found "I" at y=182.99 x=54.73 size=51.65.
  - **Drop-cap wrap zone**: lines within y of drop-cap + 45, x > body_margin+15
    stay in the drop-cap paragraph even if indented.
  - **Paragraph split**: `x0 >= body_margin + 8`. Even pages bm=52.28, odd
    pages bm=69.28.
  - **Cross-line hyphen joins**: Wave 6 allowlist (self-/well-/co-/non-/semi-/
    anti-/multi-/so-/pseudo- + one-..ten-/twenty-..ninety-), with capitalized-
    stem and multi-hyphen preservation. All compound-hyphen cases in this story
    stayed on single source lines (`twenty-seven`, `self-possessed`, `self-
    respect`, `build-up`, `merry-go-round`, `one day at a time`), so the
    cross-line allowlist never fired on a genuine compound.
  - **Em-dash join**: no space inserted after line-end `—` (Wave 5 rule). No
    line in this story ends with an em-dash, so the rule never fired in
    practice.

## Schema decisions

- **Story number `(2)`**: dropped (structural numbering, not authored
  content). Per conventions "lean toward DROP".
- **Subtitle**: single `paragraph` block (default). The 3 italic lines form
  one continuous sentence with a single first-line indent — no multi-paragraph
  structure.
- **Drop-cap**: `I` is a standalone single-letter WORD (pronoun), followed by a
  separate complete word `didn't`. Per Wave 2 rule ("When it's a standalone
  single-letter word like I followed by a complete separate word, insert a
  space"), the merge is `"I" + " " + "didn't think..."` = `"I didn't think..."`.
- **Small-caps pronoun fold (Wave 6)**: the NewCaledonia-SC first body line
  renders the small-caps `I` in "I thought" as lowercase `i` after
  flattening. Applied `\bi\b → I` regex to the merged drop-cap-line text
  (localized, does not touch other paragraphs). Result: `"I didn't think I was
  an alcoholic. I thought my"` — all three `I`s are uppercase.
- **No heading block for running titles**: even-page running title
  `FEAR OF FEAR` at size 9 is correctly dropped by the size-gate; the content
  heading at size 13.5 on page 300 is the only `heading` block.
- **No byline**: story ends with `...I hope that I never forget to be
  grateful.` — no author attribution, no sign-off, no right-aligned italic
  credit. Matches story-the-missing-link (this author/narrator is anonymous
  "Jane" — first-name only in the prose).

## Front-matter verdicts

- **Story-number (`(2)`)**: DROPPED.
- **Subtitle**: KEPT as single paragraph block `p002`.
- **Drop-cap**: MERGED with space (standalone `I` pronoun + body word).
- **Byline**: ABSENT — none emitted, none expected.

## Flagged blocks

None — all 18 blocks produced clean output. Hyphenation, ligature
normalization (`ﬁrst` → `first`, `ﬁve` → `five`, `ﬂoor` → `floor`, `selﬁsh` →
`selfish`), em-dash preservation (`wonderful—for him`, `nearly thirty years
ago—right`, `life—a sober husband`, `contented home—I`, `thing—the rugs`,
`wrong—and off`, `drinking: “Dear God`, `react`, `“think”—that`,
`volunteer—even`) all rendered correctly.

Cross-line hyphen audit (lines that ended with `-` in source):

| Source page:line end | Joined form | Decision |
| --- | --- | --- |
| p300 `peo-` + `ple?` | `people?` | strip (no prefix match) |
| p301 `to-` + `gether` | `together` | strip |
| p301 `al-` + `ways` | `always` | strip |
| p302 `ac-` + `cused` | `accused` | strip |
| p302 `to-` + `gether` | `together` | strip |
| p302 `self-` + `possessed` | `self-possessed` | keep (allowlist `self-`) |
| p303 `heav-` + `ily` | `heavily` | strip |
| p303 `some-` + `thing` | `something` | strip |
| p303 `chil-` + `dren` | `children` | strip |
| p303 `sur-` + `prising` | `surprising` | strip |
| p303 `apart-` + `ment` | `apartment` | strip |
| p303 `atten-` + `tion` | `attention` | strip |
| p304 `partic-` + `ular` | `particular` | strip |
| p304 `won-` + `der` | `wonder` | strip |
| p304 `an-` + `other` | `another` | strip |
| p304 `under-` + `standing` | `understanding` | strip |
| p304 `to-` + `morrow` | `tomorrow` | strip |
| p304 `any-` + `one` (p017 note: `any- one` joined `anyone`) | `anyone` | strip |
| p305 `sim-` + `ple` | `simple` | strip |

All strip/keep decisions verified against the conventions allowlist and
produce natural English words. No false positives observed (no accidental
compound preservation, no genuine compound incorrectly stripped).

## Schema proposals

None. The story uses only mechanics already specified in the conventions doc
(Waves 1B-6). Drop-cap handling for single-letter pronoun words, small-caps
`I` fold, ligature normalization, running-header drop, page-number drop,
story-number drop — all patterns exercised, all behaved as documented.
