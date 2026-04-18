# story-the-perpetual-quest — extraction report

## Summary

Part II.B story #14 ("The Perpetual Quest"), PDF pages 399-408 (10 pages). Extracted
**29 blocks**: 1 heading + 28 paragraphs. No list-items, no verse, no footnotes, no tables,
no blockquotes, no byline. Standard first-page story layout: story-number `(14)` dropped,
visual heading `THE PERPETUAL QUEST`, italic 4-line subtitle collapsed to one paragraph,
drop-cap `W` + small-caps tail `hen i was…` merged to `When I was…`. Body prose flows
cleanly across the 10 pages with paragraph breaks detected by first-line indent past the
parity-dependent body margin (odd-page margin ≈69.28, even-page margin ≈52.28). Story
closes on p408 with `"…and it couldn't get much better."` — no signed byline.

## Method

- PyMuPDF `page.get_text("dict")` for per-line bbox + font + size.
- Running-header / page-number drops:
  - `y0 < 50` AND (`size <= 9.5` OR `isdigit()`) — catches both the 9pt title line
    (`THE PERPETUAL QUEST` / `ALCOHOLICS ANONYMOUS`) and the 12pt page-number digit.
  - Bottom-of-page digit at `y0 > 500` — catches p399's `388`.
- Story-number `(14)` on p399 at y=79 size=12.5 dropped via `^\(\d+\)\s*$` regex on
  the first page.
- Heading detection: size ≥ 13 AND text contains `PERPETUAL` on first page.
- Subtitle detection: italic ~11pt with `y0 < 190` on first page. All 4 subtitle lines
  (first line x=93.28, continuations x=81.27) belong to a single indent group →
  one paragraph block.
- Drop-cap merge: `ParkAvenue` font + size > 40 → `W` glyph; located at y=197.06.
  First body line at x=112.90 y=210.27 (NewCaledonia-SC) is merged as
  `"W" + "hen i was a newly minted lawyer starting out"`. Post-flatten the pronoun
  `i` → `I` via `\bi\b → I` regex (Wave 6 rule for SC-flattened drop-cap tails).
- Drop-cap wrap-around: body lines with y < dropcap.y0 + 45 AND x > body_margin + 15
  are treated as continuation of the first paragraph rather than starting a new para.
- Paragraph boundary: `x0 >= body_margin + 8` signals a first-line indent and a new
  paragraph. Body margins: odd-page 69.28, even-page 52.28; indent thresholds 77.28 / 60.28.
- Cross-line text normalization:
  - Ligatures normalized (fi, fl, ffi, ffl, ff, st).
  - Em-dash line-end join: no space inserted (`people—was`).
  - Cross-line hyphen resolution: allowlist-gated. 7-prefix prose allowlist
    + `pseudo-` + small-number + ordinal-decade prefixes. Capitalized-stem preservation
    + multi-hyphen compound preservation rules applied. Number-prefix qualification
    (tail must be in a fraction/compound-tail set) applied.

## Schema decisions

- **Heading**: single `heading` block `THE PERPETUAL QUEST` (visual rendering; metadata
  `title` stays prose-case `The Perpetual Quest` per conventions divergence).
- **Subtitle**: single `paragraph` block joining all 4 italic deck lines. One clear
  first-line indent (x=93.28) followed by 3 flush-left continuations (x=81.27) — single
  indent group, emit as one paragraph per Wave 3 rule.
- **Story-number `(14)`**: dropped (structural numbering, not authored content).
- **Drop-cap**: merged into first word of first paragraph (`W` + `hen` → `When`, no space).
  Small-caps tail flattened by PyMuPDF to lowercase codepoints; pronoun `i` promoted to
  `I` via targeted regex.
- **Body prose**: 27 additional paragraph blocks, detected by first-line indent.
- **No byline**: story ends with narrative paragraph `"…it couldn't get much better."`
  at p408. No `—Author Initials` sign-off, no closing attribution. `byline` block not emitted.

## Flagged blocks — cross-line compound hyphens (deferred class)

Four cross-line hyphens in the source split across pages/lines where the joined compound
is a legitimate hyphenated form (per source typography) but the prefix is **not** in the
current Wave-6 allowlist and/or the right-part is **not** in the number-compound tail
set. The current conventions rule strips the hyphen and concatenates. Prior waves made
the same choice for `witchburners` (ch07 was `witch-burners`), `fastthinking` (ch10 was
`fast-thinking`), `payday` (jims-story was `pay-day`). Preserving these as I see them
to stay consistent with prior waves; flagging for PO awareness.

**`story-the-perpetual-quest-p003`** (page 399 → 399):
  Source: `…the new but world-` / `weary litigation lawyer…`
  Current output: `…the new but worldweary litigation lawyer…`
  Intended reading: `world-weary` (compound adjective).

**`story-the-perpetual-quest-p007`** (page 400 → 401):
  Source: `…by age twenty-` / `one I had my first year-long binge…`
  Current output: `…by age twentyone I had my first year-long binge…`
  Intended reading: `twenty-one` (compound number; `one` not in NUMBER_COMPOUND_TAILS).

**`story-the-perpetual-quest-p011`** (page 402 → 402, x2 in same paragraph):
  Source A: `…away from all those hard-` / `drinking criminal lawyers…`
  Current A: `…away from all those harddrinking criminal lawyers…`
  Intended A: `hard-drinking`.

  Source B: `…a new three-story, four-` / `bedroom house.`
  Current B: `…a new three-story, fourbedroom house.`
  Intended B: `four-bedroom` (`bedroom` not in NUMBER_COMPOUND_TAILS).

The intra-line `three-story` survives correctly (no cross-line break).

## Flagged blocks — small-caps continuation

**`story-the-perpetual-quest-p022`** (page 406): this paragraph contains the line
`"8:00 p.m.) Soon, I got into service."` at x=52.28 body margin but rendered in
`NewCaledonia-SC` font rather than plain `NewCaledonia`. Visually this is the
continuation of the previous line `(I would not have made it to` — the SC is cosmetic
(small-caps `p.m.`). Treated as body-continuation (x-coord at body margin, not paragraph
indent); merged into p022 correctly.

## Schema proposals

None. This section exercised all existing rules — drop-cap merge, SC pronoun promotion,
story-number drop, subtitle single-paragraph default, parity-based body margin detection,
Wave-5 em-dash join rule, Wave-6 NUMBER_PREFIX_SET qualification. The deferred hyphen
class flagged above is an instance of the previously-deferred "dictionary-required
compound hyphen" problem; no new schema work needed. If the compound-hyphen
dictionary ever lands as a post-reassembly pass, these four tokens would gain their
hyphens back: `world-weary`, `twenty-one`, `hard-drinking`, `four-bedroom`.
