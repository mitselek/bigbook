# story-tanulikkus-tegudes — extraction notes

## Summary

Estonian translation of `story-gratitude-in-action` (Dave B., Quebec AA founder, 1944). PDF pages 225–231 (book pages 193–199). Emitted **26 blocks** = 1 heading + 25 paragraphs (1 italic deck + 24 body). Exact block-count parity with the EN exemplar (26 blocks). No list-items, blockquotes, verses, footnotes, bylines, or tables — layout is pure narrative prose with a single drop-cap opener.

## Method

- PyMuPDF `get_text("dict")` per-line spans; sorted by `(page, y0, x0)`.
- ET running-header drop gate: `y0 < 50 AND (size <= 11.5 OR isdigit)`.
- Extra drop rule on page 225: line starts with `(` and ends with `)` at `y < 50` — catches the `(2)` story-number prefix.
- Heading detection: page 225, size 13.5–15.0, text starts with `TÄNULIKKUS`.
- Drop-cap detection: page 225, `BrushScriptStd`, size ≥ 20 → glyph `M`.
- Italic deck: page 225, `NewCaledoniaLTStd-It`, y-range 70–125. Both lines belong to a single flowing sentence; emitted as one `paragraph` block.
- Body paragraph boundary: `64 <= x0 < 80` (indent at x≈68.03).
- Drop-cap wrap-zone: page 225, `127 <= y0 <= 160` and `95 <= x0 <= 110` — body lines inside this band are continuations of the opener, not new paragraphs (wide-glyph `M` uses +35 offset from body margin 56.69 → x≈100).
- Line-join rules (ET): strip trailing `U+00AD`, join no-space; strip trailing `-` + lowercase start, join no-space; en-dash/minus (`–`/`−`) handling per ET conventions (space-padded in body).
- Cross-page paragraph merge: implicit via reading-order walk. Page 227 → 228 continuation (`Siis meenus mulle raamat...hommikul üles`) merged; page 230 → 231 continuation (`Andke heldelt...`) merged. No explicit terminal-punctuation post-pass needed — paragraph-indent signal was sufficient.

## Schema decisions

- **Story-number prefix `(2)`**: **dropped** per ET conventions (structural numbering, not authored content). Filtered in `extract_lines` by y<50 + parenthesis-wrapped text pattern.
- **Italic deck**: emitted as a **single `paragraph`** block. Both visual lines (`y=91.74` and `y=106.24`) start at `x=68.03`; unlike the Dr. Bob deck where 3 clear indents signaled 3 paragraphs, here the second line is a short wrap continuation (`asutajatest.` — 57pt wide) of a single sentence that wrapped to two lines with its own deck-margin at x=68. Hard-coded: emit all `-It` lines on page 225 as one block. Matches EN exemplar's single deck paragraph.
- **Drop-cap `M`**: merged with first body line `a usun` → `Ma usun` (no space). Wide-glyph wrap-zone `+35` applied. `BrushScriptStd` at 33pt confirmed.
- **No byline**: ET last paragraph ends `hoida oma kätt Jumala käes.` No author sign-off, matching EN.
- **No list items**: no enumerated content in the body (unlike Dr. Bob's 4-item list on p212). Confirmed against EN structure.
- **`parentGroup`**: preserved as `personal-stories/pioneers-of-aa` verbatim from metadata.

## Source quirks preserved (not bugs)

- **`Dave B`** (no period) in the deck — ET source diverges from EN `Dave B.`. Preserved verbatim.
- **`„ Andke end jäägitult...`** on page 230 — stray space after the opening curly quote `„`. Source-faithful rendering; per ET conventions (same class as `o1i`, `sõruskonna`, `Bill W,` in Wave 1/2).

## Flagged blocks

- `p002` (italic deck): two visual lines at identical `x0 = 68.03`. The Dr. Bob deck rule (`x0 >= 64 → new paragraph`) would have split this into 2 blocks. Overridden by emitting all page-225 italic lines as a single paragraph. Document for future ET waves: italic deck **may use its own left-margin** (not body margin) so continuation lines share the indent x-coordinate with the start line. Judge by sentence continuity, not indent alone, when the deck is short.
- `p025`: contains the stray space after `„` mentioned above. Verified in probe at page 230 y=469.41: `„ Andke end jäägitult...`. Preserved.

## Schema proposals

None. Existing ET conventions cover every case in this section cleanly. The "italic deck with shared indent for wrap lines" pattern is worth noting in the evolution log as a gotcha, but doesn't require a new schema rule — judgment call documented above suffices.

## Counts

| kind | count |
|------|-------|
| heading | 1 |
| paragraph | 25 |
| **total** | **26** |

EN counterpart (`story-gratitude-in-action`): 26 blocks (1 heading + 1 deck + 24 body). ET matches EN exactly.
