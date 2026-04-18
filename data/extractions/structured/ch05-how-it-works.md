# ch05-how-it-works — structured extraction report

## Summary

Re-extracted Chapter 5, "How It Works" (PDF pages 79–92, 14 pages), under
current conventions after the Wave 1 pilot output was discarded. Output:
**61 blocks** — 1 `heading`, 44 `paragraph`, 15 `list-item` (12 Steps + 3
(a)(b)(c) sub-items), 1 `table` (the resentment inventory on pp. 86–87).
No blockquotes, verses, footnotes, or bylines. All four wave-7 stress
points (Twelve Steps, (a)(b)(c), resentment table, Third Step Prayer)
extracted cleanly.

## Method

- PyMuPDF `page.get_text("dict")` per page across PDF pages 79..92.
- Standard conventions: ligatures normalized, soft hyphens stripped,
  NUL stripped, curly quotes preserved.
- Body-text margin inferred per page from the min x0 of size-12
  NewCaledonia lines, EXCLUDING lines starting with `\d+\.` or `\([abc]\)`
  (the hanging-indent list markers would pull the min below the real
  body margin on pp. 80–81).
- Paragraph-start detection: `body_margin + 8 <= x0 <= body_margin + 20`.
- Cross-page merge handled implicitly: when the first line of a new page
  starts at the body margin (not a paragraph-start indent), it is
  appended to `current`, which at that point is still the open paragraph
  from the previous page. Verified on p005 (p79→p80, `baf-` + `fling` →
  `baffling`), p038 (p85→p86, `relationships` + `(including sex)`), etc.
- Twelve Steps list-item detection: numeric prefix `\d+\.\s` in
  `NewCaledonia-SC` font with x0 in 60..85 band, on pp. 80–81. The
  font-gate is load-bearing — it prevents false positives on ordinary
  paragraphs that happen to start with `"N."`.
- (a)(b)(c) sub-list detection: `\([abc]\)` prefix with x0 in 79..85 band
  on p. 81.
- List-item continuation: lines whose x0 sits between `marker_x + 5`
  and `marker_x + 50` on the same page as the list-item start.
- Resentment table: all size-11 lines on pp. 86–87, grouped into y-bands
  (within 2pt tolerance) and bucketed into three columns by x0
  (col1 <120, col2 120..229, col3 >=230).
- Script: `.tmp/extract-ch05.py`.

## Schema decisions

1. **Heading text `HOW IT WORKS`** — emitted verbatim from the size-13.5
   centered line on p79. Matches section metadata `title: "How It Works"`
   (intentional divergence per conventions: visual heading renders
   uppercase, prose-case title is metadata).
2. **"Chapter 5" label dropped** — size-12.5 `NewCaledonia-Italic` on
   p79, above the heading. Per conventions.
3. **Drop-cap `R` + small-caps tail `arely have we seen ...`** merged
   into the first paragraph as `Rarely have we seen ...` (no space).
   The small-caps tail is already lowercase in PyMuPDF's extracted text
   so no manual case-flattening was required.
4. **Twelve Steps as 12 `list-item` blocks.** Single-digit prefixes
   `1.`–`9.` on p80 start at x0 ≈ 69-70; two-digit `10.`, `11.` hang
   left to x0 ≈ 63-64 on p80; `12.` sits at x0 ≈ 80.7 on p81 (the odd
   page has a wider body margin and the hanging-indent moves right
   accordingly). All three patterns are recognized by one rule: numeric
   prefix + SC font + x0 in 60..85 + page in {80,81}. Continuation
   lines at x0 ≈ 85-102 (or 102 for step 12) are joined into the same
   list-item. Step 11 spans 4 lines (`prove`, `derstood`, `His will...`)
   and is joined correctly.
5. **(a)(b)(c) sub-list as 3 `list-item` blocks** on p81. Markers at
   x0 ≈ 81-82 with continuations at x0 ≈ 102.
6. **Third Step Prayer** (`"God, I offer myself to Thee..."` on p84)
   kept inline within its surrounding paragraph (`p033`) per the
   Wave 1 precedent. Same treatment for the tiny quoted
   `"This is a sick man. How can I be helpful to him? God save me from
   being angry. Thy will be done."` on p88.
7. **Resentment-inventory table as one `table` block with
   `rows: string[][]`.** Y-band grouping produces 23 rows (1 header +
   22 content bands). Each row has 3 cells; cells are empty strings
   when a y-band has no glyphs in that column. The `text` field
   serializes rows as `" | "` between cells and `"\n"` between rows
   for fallback readability per conventions.
8. **Table granularity decision.** The table's 22 content bands are
   one-line-per-band rather than one-logical-row-per-"person". This
   preserves the visual structure of the PDF (e.g. "Mr. Brown"
   appears in col1 only on the first band of his cause list, with
   subsequent bands having col1 empty) and lets downstream consumers
   re-group as they prefer. Given the table is decorative example
   content, not a data table, this faithful representation seems
   preferable to synthesizing logical rows. See "Flagged blocks" for
   one edge case.

## Flagged blocks

- **`t041` / row 13 ("My employer")** — source line at y=356 on p86
  spans both col2 and col3 in a single PyMuPDF line span
  (`"Unreasonable—Unjust Self-esteem (fear)"` at x0=127.67, extending
  to x1=323.56). Because x0 is in the col2 band, the whole text went
  into col2, leaving col3 empty for that band. The adjacent band
  (y=369) has proper 3-column split. This is a minor fidelity issue
  — the data is present in the row, just in col2 rather than split —
  and I opted not to split it heuristically to avoid introducing
  regex-based "guess the column break" logic for a one-off cell. A
  downstream consumer that renders the table will see the merged cell;
  a consumer that parses it semantically should tolerate cells of
  variable width.

## Schema proposals

No new proposals. All wave-7 conventions (number-prefix qualification,
capitalized-stem preservation, multi-hyphen compound preservation,
em-dash no-space join, NUL strip, page-number isdigit fallback at
y0<50) applied as-is.

The only stress point worth a design note for future waves: the
`table` kind's `rows` schema doesn't represent multi-line cells well.
In the resentment table, what the human eye reads as "Mr. Brown's
first cause: 'His attention to my wife.'" is in the extraction split
across two rows (`wife.` on its own band in col2). Consumers can
reassemble by grouping consecutive rows where col1 is empty, but a
future schema revision could explicitly encode multi-line cells
(e.g. `cells: {text, rowspan?}[][]`). Deferred — the current shape is
faithful to the source layout and the pipe-text fallback is readable.

## Verse / drop-cap / table / Twelve Steps verdicts

- **Twelve Steps:** 12 complete `list-item` blocks, no fragmentation.
  Step 11 joined across 4 source lines; Step 12 correctly recognized
  at the top of p81 (x0 ≈ 80.7) despite the different hang-indent.
  Sub-list `(a)`, `(b)`, `(c)` all 3 emitted as separate
  `list-item` blocks.
- **Resentment table:** present as `table` kind with `rows` field (23
  rows × 3 cols) and pipe-and-newline `text` serialization. One
  edge-case merged cell documented above.
- **Drop-cap:** `R` (ParkAvenue 51.65pt) merged cleanly with SC-tail.
  First paragraph opens `"Rarely have we seen a person fail..."`. No
  leading space, no "Chapter 5" label bleed.
- **Third Step Prayer (p84):** inline with `p033` paragraph per
  convention (italics alone is not a split signal).
- **Verse:** none detected; none present.
- **Cross-page merges:** p005 (p79→p80 `baf-`+`fling`), p029 (p82→p83),
  p038 (p85→p86), p046 (p87→p88), p049 (p88→p89), p053 (p89→p90),
  p057 (p90→p91), p060 (p91→p92) — all joined by the
  "next-page-first-line-at-body-margin is continuation" heuristic.
