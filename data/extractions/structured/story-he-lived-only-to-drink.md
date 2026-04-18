# story-he-lived-only-to-drink — extraction report

## Summary

Part III (They Lost Nearly All), story #2. Six pages (452–457). Emitted **16 blocks**:
1 `heading` + 15 `paragraph`. No list-items, verse, footnotes, tables, bylines, or
blockquotes. The story ends on p457 with a continuation of narrative prose ("...bring
the message of hope as it was brought to me.") — no sign-off, no byline.

## Method

- Single library: **PyMuPDF** `page.get_text("dict")`.
- Probe script: `.tmp/probe-he-lived-only-to-drink.py`. Extraction: `.tmp/extract-story-he-lived-only-to-drink.py`.
- Standard Wave-7 pipeline: extract all lines → drop top/bottom running artifacts →
  classify heading / subtitle / drop-cap → build paragraph blocks by first-line-indent
  detection → cross-page right-margin carry-over merge → emit JSON.

Heuristics that fired:

- **Running-title header drop**: `y0 < 50 AND size <= 9.5`. Drops `HE LIVED ONLY TO DRINK`
  at y=39.94 size=9 (pages 453, 455, 457) and `ALCOHOLICS ANONYMOUS` at y=39.94 size=9
  (pages 454, 456).
- **Running page-number drop**: `y0 < 50 AND text.strip().isdigit()` catches the 12pt
  page numbers at y=37.24 on pages 453–457 (size 12 NewCaledonia-SC). Page 452 has its
  number at the bottom (y=540.74 size=9) dropped by the `y > 500 AND digits-only` rule.
- **Story-number drop**: `(2)` at page 452 y=79 size=12.5 dropped per conventions (structural
  numbering, not authored content).
- **Heading detection**: size >= 13.0 AND text contains "HE LIVED" → emit as `heading`
  with exact source text `HE LIVED ONLY TO DRINK`.
- **Subtitle**: 4 italic lines at y=130..172 size=11 on page 452. First line indented
  (x=93.28), continuations at x=81.27 — single indent group → single `paragraph` block
  (conventions default).
- **Drop-cap merge**: `O` (ParkAvenue 51.65) at page 452 y=196.84, first body line is
  small-caps `n looking back at my life, I can't see anything` at y=210.04. Merge:
  `"O" + "n looking..."` → `"On looking..."` (no space; single-letter drop-cap +
  word-remainder). Small-caps pronoun `I` came through as uppercase `I` from PyMuPDF
  already; the defensive `\bi\b → I` regex applied as a no-op.
- **Drop-cap wrap zone**: second body line at x=100.40 y=224.89 (`that would have warned me
  or my family of`) is indented past body-margin (69.28) but is a continuation of the
  drop-cap paragraph. Wrap-zone y_max = dropcap.y0 + 45 = 241.84 absorbs this line.
- **Body margins** (even pages: 69.28 body / 81.28 indent; odd pages: 52.28 body /
  64.28 indent) applied as in all prior story agents.
- **Cross-page paragraph merge**: right-margin carry-over heuristic (last line of earlier
  block's `x1 > 280`, and first line of next page is not at paragraph-indent). Fired
  at page boundaries 452→453, 453→454, 454→455, 456→457. Did NOT fire at 455→456
  (p455 ended with `.` at x1=123 short of margin; p456 starts with an indent at x=81.28
  marking a new paragraph — "The people at the meetings gathered around me").
- **Em-dash join** (Wave 5 end + Wave 7 start, bidirectional): verified on
  `evangelical—literally`, `story—how`, `discriminate—is`, `surroundings—the`,
  `estimate—a`. All joined without inserted space.

## Schema decisions

### Drop-cap letter choice

Drop-cap is `O` (the capital letter glyph from ParkAvenue), merged with the first body
line beginning `n looking back...`. Produced `On looking back...`. No space; the small-caps
tail was delivered as lowercase-continuation of a word, not a standalone word like
`I` in acceptance-was-the-answer.

### Subtitle rendering

Source subtitle is four italic lines with visible first-line indent on line 1 and
continuations on lines 2–4. This is the conventions default ("single paragraph block" when
one indent group). Emitted as `p002`. The nested quotation (inner `'...'`) is preserved
with the source's curly quote glyphs.

### Story-number prefix

`(2)` on page 452 at y=79 is explicit structural numbering, dropped per conventions
("Lean toward DROP"). Not included in the heading text.

### `so-` + `briety` edge case (script-level fix, not a conventions proposal yet)

The cross-line break `so-` (end of p456) + `briety` (start of p457) was initially
preserved as `so-briety` because `so-` is on the conventions compound-prefix allowlist
for `so-called`. The word is actually `sobriety` — a single-morpheme word split mid-line,
not a compound. Added a **section-local qualification** matching the number-prefix
pattern: `so-` keeps the hyphen only when the next line's first word is `called`.
Produces the correct joined form `sobriety` while preserving the `so-called` case for
future sections.

### No byline

The story ends mid-narrative ("...the message of hope as it was brought to me.") with
no signed author attribution — no byline emitted. This is consistent with the Part III
stories convention that some stories end with a signature line (`—Joe M.`) but others
do not.

## Flagged blocks

None. All 16 blocks are structurally unambiguous. Spot-checks:

- `h001` — exact source rendering of the title.
- `p002` — subtitle, 4 source lines joined into one paragraph with preserved inner
  quotation.
- `p003` — drop-cap paragraph, opens `On looking back...` as intended.
- `p014` — the `so-briety` site; post-fix reads `...my sobriety from everything...`.
- `p016` — final paragraph, terminates `...as it was brought to me.` with full stop.

## Schema proposals

**Soft proposal (defer):** the `so-` compound-prefix allowlist entry exists for
`so-called` but triggers a false positive against cross-line splits of `sobriety` and
potentially other `so-`-initial words (e.g. `solemn`, `sober` — any word whose second
syllable starts with a word-like token). The section-local qualification I applied —
`so-` keeps hyphen only when tail starts with `called` — is stricter and I believe
correct. If a future agent hits similar false positives on `so-`, consider adopting the
qualification globally: `so-` is a NUMBER_TAILS-style prefix with a single legitimate
tail (`called`).

This is a narrow enough rule that I wouldn't push for a conventions change from one
datapoint — noting it here for Plantin to weigh against Wave 6+ evidence.
