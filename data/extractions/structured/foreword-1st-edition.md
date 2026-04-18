# foreword-1st-edition — extraction report

## Summary

Single-page front-matter section (PDF page 4). Emitted **9 blocks**: 1 heading + 8 paragraphs (1 italic deck + 7 body). Zero list-items, verse, byline, table, blockquote, footnote. No source-code modifications. JSON validated with `json.load()`.

This is the smallest non-copyright front-matter section. The page is a **facsimile** of the original 1939 first-edition foreword — explicitly flagged by its own italic deck: "This is the Foreword as it appeared in the first printing of the first edition in 1939." Because the facsimile is reproduced at reduced scale to fit within one page, the entire page is typeset at ~9pt (much smaller than the typical ~10.98pt front-matter body). This breaks two heuristics from the conventions doc:

1. The heading is size 9.0 (not ≥13), sitting at y=45.52 (< 50pt from top).
2. The body is size 9.0, not ~10.98pt.

Both facts forced content-aware heading detection rather than size-based.

## Method

- **PyMuPDF** only (`page.get_text("dict")`, plus `"rawdict"` for span-level probe).
- Extraction script: `.tmp/extract-foreword-1st.py`.
- Probe scripts: `.tmp/probe-foreword-1st.py`, `.tmp/probe-foreword-1st-raw.py`.

### Heuristics fired

- **Heading detection — content match, not font size.** Convention says headings are `>= 13.0pt`; this page's heading is 9.0pt. Detected instead by uppercase text match on `FOREWORD TO FIRST EDITION`. Required overriding the `y0 < 50 AND size <= 9.5 → drop as running header` rule that otherwise fires here.
- **Italic deck detection** — `"Italic" in font` AND `y0 < 100` (after excluding the heading).
- **Running footer drop** — `y0 > 500` AND text upper-case-equals `ALCOHOLICS ANONYMOUS`. Centered-ish (x=212-335, not flush-left); a genuine running footer.
- **Paragraph split by y-gap on a single page** — within-paragraph line spacing ~11.2pt; between-paragraph gap ~25pt. Threshold set at 18pt. No cross-page merge needed (single page).
- **Drop-cap merge** — first body line is a two-span composite: `'W'` at ParkAvenue 13.98pt (the decorative drop/lead-in cap), then `'E, OF Alcoholics Anonymous, are more than one hundred men and '` at NewCaledonia 9.0pt. PyMuPDF's line-level concatenation already produced `'WE, OF Alcoholics Anonymous, ...'` correctly — no special-case join code was needed. The rest of the word (`E`) immediately follows the drop-cap glyph in the source, so `W` + `E,` → `WE,`.

### Cross-line hyphenation

None fired. Scanned all body lines — no line ended in `-`. This is unsurprising for a compact 9pt facsimile; the text was re-flowed for the narrower facsimile frame but escaped creating hyphenated line-ends.

## Schema decisions

1. **Heading size override.** The conventions doc says headings are ≥13pt. This section violates that (heading is 9pt because the entire facsimile is scaled down). Detected by uppercase text match instead of font size. No convention change proposed — this is a single section-specific exception.

2. **Running-header drop rule override.** Convention `y0 < 50 AND size <= 9.5 → drop` would kill this heading. Reconciled by checking heading detection first (by text) and adding the heading index to the `consumed` set before any drop logic fires. No change to conventions needed — the rule still holds for sections with actual running headers.

3. **Italic deck → single paragraph block.** Per conventions default ("emit as a single paragraph block (join all deck lines)"). The deck is two lines of the same italic run, visually one sentence. Migration output split it into two blocks, which I consider a migration-pipeline bug, not evidence that conventions should be changed.

4. **Drop-cap merge was free.** No two-span join rule had to fire — PyMuPDF concatenates spans within a line into the `line['spans']` list naturally, and the raw text result was already `'WE, OF Alcoholics Anonymous, ...'`. This matches the "front-matter small lead-in caps" pattern from conventions: the first letter is in ParkAvenue at ~14pt, followed by body font at 9pt. Merge outcome: `W` + `E,` = `WE,` — no space inserted, no small-caps flattening needed (the source's "small caps" styling is not a separate case-variant, it's just the 9pt body font continuing at capital case as `E, OF Alcoholics`).

5. **Heading text preserves visual rendering.** Per conventions, `title` metadata is "Foreword to First" (prose-case) while the `heading` block text is "FOREWORD TO FIRST EDITION" (source rendering).

## Flagged blocks

None. Every block is confident.

- `h001` — heading `FOREWORD TO FIRST EDITION` (clean uppercase match).
- `p002` — italic deck, 2 source lines joined with space: `"This is the Foreword as it appeared in the first printing of the first edition in 1939."`
- `p003` — body paragraph 1 with drop-cap merge: `"WE, OF Alcoholics Anonymous, are more than one hundred men and women..."`
- `p004`-`p009` — six further body paragraphs; all terminate with sentence punctuation, all match migration output verbatim.

Cross-check against `data/extractions/migrations/final.json` → `foreword-1st-edition`: 100% text-level match on body paragraphs; migration split the deck into two paragraphs (`p002`/`p003` there) which this extraction correctly emits as one.

## Schema proposals

None. The existing schema and conventions handle this section cleanly, once the heading-size heuristic is treated as a soft rule (which conventions already imply — it's stated under "Heuristics known useful", not as a hard rule).

### Optional note for the conventions doc evolution log

If a future wave touches the conventions doc, consider a short note that **facsimile reproductions** (where the entire page is downscaled to ~9pt) exist in this book and require text-match heading detection rather than size-match. Page 4 is the only known instance. Not worth a formal schema change; a one-line heuristics note would suffice.
