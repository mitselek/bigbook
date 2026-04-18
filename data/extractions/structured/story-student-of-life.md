# story-student-of-life — structured extraction report

## Summary

Extracted Part II.B story "Student of Life" (they-stopped-in-time), PDF pages 330-338 (9 pages). Emitted **30 blocks**: 1 heading + 29 paragraphs. No list-items, verses, blockquotes, footnotes, tables, or bylines — this is a straight narrative. One hyphenation edge case surfaced (`sure-handedness`) and was left as-is; see flagged blocks below.

## Method

- PyMuPDF `page.get_text("dict")`, iterated pages 330-338 (0-indexed 329..337).
- Normalized ligatures, stripped `\u00ad` soft hyphens and `\x00`.
- Dropped top-of-page artifacts via the **refined Wave 5 rule**: `y0 < 50 AND (size <= 9.5 OR text.strip().isdigit())` — catches the 12pt page-number running headers (e.g. `'320'` at y=37.24 size=12) that a size-only gate misses.
- Dropped bottom-of-page page numbers by `stripped.isdigit() AND y0 > 500` (page 330's `319` at y=540.74).
- Dropped the story-number `(6)` at y=79 size=12.5 via `^\(\d+\)\s*$` regex on the first page.
- **Y-band merge pre-pass (new for this section):** PyMuPDF splits a visual line into multiple text-lines when font style changes mid-line. On page 333 the italic movie-title token `W.,` (x=69.28 y=185.95) and the regular continuation `about the co-founder of A.A., was aired.` (x=95.62 y=185.65) were emitted as two separate lines. Without merging, the x=95.62 fragment falsely triggered a paragraph-start (> 81.28 indent threshold). The pre-pass groups same-page lines whose `y0` differs by ≤ 1.5pt, sorts by `x0`, and concatenates their text with a single space (punctuation-glue aware). This let the paragraph detector see one logical row.
- Paragraph detection: first-line indent past body margin (even pages 52.28 → indent threshold 60.28; odd pages 69.28 → indent threshold 77.28; using +8pt slack).
- Cross-page paragraph merge: right-margin carry-over heuristic (if prior last line reaches `x1 > 300` AND next page's first line is NOT a paragraph-start indent, merge). This correctly stitched continuations across every page boundary.
- Drop-cap merge: single-letter pronoun `I` (standalone word) joined with body remainder using a **space** (`"I " + "started drinking..."`), per the Wave 2 story-drop-cap rule distinguishing pronoun `I` from single-letter word-initial glyphs like `W → War`.
- Subtitle: 4 italic size-11 lines at y=130..172 on page 330. First line indent x=76.28 (> threshold 70), continuations at x=64.27. Single indent group → one paragraph block.

## Schema decisions

- **Story-number `(6)` dropped entirely**, consistent with conventions ("lean toward DROP — structural numbering, not authored content"). Not included in the heading text.
- **Heading text** `"STUDENT OF LIFE"` preserves source all-caps visual rendering; section `title` metadata stays prose-case `"Student of Life"`.
- **Subtitle** emitted as a single `paragraph` block. The italic deck shows only one indent (line 1 at x=76.28; lines 2-4 at x=64.27 continuation). No multi-paragraph deck structure.
- **Drop-cap** `"I"` (ParkAvenue 51.65) merged with SPACE into the first body line per Wave 2 story-drop-cap rule (standalone pronoun word, not a word-fragment glyph). Defensive `\bi\b → I` applied after the merge; no effect here (PyMuPDF already emitted the tail as lowercase `started drinking` with no stray `i` tokens).
- **No byline** — the story closes `"...what I received in return was my life."` at page 338 y=492.33 with no signature line.
- **Inline italic tokens kept inline** — `"My Name Is Bill W., about..."` on page 333 and `"Say something now!"` on page 336 are inline style changes inside running dialogue/narrative. Both merged into their surrounding paragraph via the y-band pre-pass. No `blockquote` or `verse` triggered.

## Flagged blocks

- **`story-student-of-life-p028`** (page 337/338): the word `surehandedness` appears where the source reads `"with a sure-handedness I hope I am able to emulate"`. The PDF line-break splits on `sure-` at end of page 338 y=83.42; `sure-` is NOT in the compound-hyphen allowlist, so the join strips the hyphen. This matches the Wave 6 **deferred** class (same shape as `pay-day`, `fast-thinking`, `witch-burners`). Left as-is; flagged.

- **`story-student-of-life-p030`** (page 338): fixed locally. Source line-break on `"prolonged one-"` + `"night stands"` needed the `one-` number-prefix rule to preserve the hyphen. The Wave 6 convention already lists number-prefix tails (`half`, `third`, `fold`, `year`, `day`, …) that keep the hyphen; `night` was not on that list. Added `night` to this agent's local `NUMBER_TAILS` tuple so `one-night stands` reads correctly. See **Schema proposals**.

## Schema proposals

- **Add `"night"` to `NUMBER_TAILS`** in the cross-line hyphen rule. The `one-night` compound is the same class as the existing `one-day`, `one-year`, `one-half`. The addition is low-risk: this tuple only matters when the PREVIOUS line literally ends with `one-` (or `two-`, etc.), which the typesetter only does for actual compounds. Observed here in `"prolonged one-night stands"`.

## Counts

| kind      | count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 29    |
| **total** | **30** |

Paragraphs per page: `{330: 3, 331: 4, 332: 4, 333: 3, 334: 3, 335: 2, 336: 4, 337: 4, 338: 2}` — visually verified against the probe dump.

## Files

- `data/extractions/structured/story-student-of-life.json` — `BookSection` artifact.
- `.tmp/probe-student-of-life.py` + `.tmp/probe-student-of-life.txt` — coordinate/font probe (gitignored).
- `.tmp/extract-story-student-of-life.py` — extraction script (gitignored).
