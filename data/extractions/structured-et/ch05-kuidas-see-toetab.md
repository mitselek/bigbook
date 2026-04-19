# ch05-kuidas-see-toetab — extraction report

## Summary

ET Chapter 5 "Kuidas see töötab" (How It Works), PDF pp. 90–103, book pp. 58–71.
Emitted **61 blocks**: 1 heading, 44 paragraphs, 15 list-items (12 Twelve Steps +
3 abc sub-list), 1 table. All Twelve Steps emitted as complete list-items, the
(a)/(b)/(c) sub-list as 3 list-items, and the resentment-inventory table on
PDF page 97 (book page 65) as a single `table` block with `rows: string[][]` and
pipe-serialized `text`.

## Method

- `pymupdf.open()` + `page.get_text("dict")` for lines 90..103.
- Ligature expansion + NUL-strip at extraction; **soft hyphen (U+00AD)
  preserved to join time**, then stripped + tight-joined (ET Wave 1 rule).
- **ET running header drop:** `y0 < 50 AND (size <= 11.5 OR pure digits)`.
  Running header at 11pt on every page except 90 (no header on chapter-opener)
  and 103 (no header on last-text page? actually present). Page numbers both
  top-of-page and bottom-of-page 90 at 11pt, bottom dropped by `y0 > 520`.
- **Chapter label drop:** regex `^\d+\.\s*peatükk\s*$` in italic font on p90.
- **Heading detection:** `size >= 13` on p90 + text starts with "KUIDAS".
  Actual size 14.00 on NewCaledoniaLTStd.
- **Drop-cap detection:** `BrushScriptStd` font + size > 20 on p90. Actual
  glyph 'O' at 33.00pt, x=52.7, y=102.0. Merged with first body line
  'leme harva näinud…' (x=79.4, y=107.4) → 'Oleme harva näinud…'.
  No small-caps tail in ET layout (per ET convention).
- **Drop-cap wrap-zone:** y <= 135 on p90 → treat as body-continuation, not
  new-paragraph. The wrap-line at x=79.4 y=121.9 is the glyph's wrap-indent
  column, NOT a paragraph-start.
- **Twelve Steps detection:** numeric `N.` prefix at x≈65.2 on pages 91–92,
  with hanging-indent continuations at x≈82.2. Steps 1–11 on p91, step 12
  on p92. 12 list-items emitted.
- **(a)(b)(c) sub-list:** markers at x≈70.9 on p92 with continuations at
  x≈92.7. 3 list-items emitted.
- **Table detection:** size-12.5 NewCaledonia lines on p97 with `y >= 168`
  (after the intro "puhul:" line at y=150.4). Column bucketing by x0:
  col1 <110, col2 [110..230), col3 >=230. Italic header row (`Kannan vimma:`
  / `Põhjus:` / `Puudutab minu:`) is set in `NewCaledoniaLTStd-It`; kept as
  the first two rows because "Kannan" (y=170.6) and "vimma:" (y=184.1) are
  on different y-bands in the column-1 header cell.
- **Body paragraph detection:** `x0 in [64, 75]` as paragraph-start indent
  (body margin 56.7, first-line indent 68.0).

## Schema decisions

- **Drop-cap merge:** 'O' + 'leme…' joined without space, yielding `Oleme` —
  per ET convention.
- **Third Step Prayer** on p95 (`"Jumal, ma annan end Sulle…"`) kept inline in
  the surrounding paragraph per EN/ET conventions — italic inline pull-quotes
  stay with their paragraph.
- **Resentment-inventory table on p97 only.** The task prompt said
  "pp. 66-67 (book) ≈ PDF 98-99" but the actual ET table is fully contained on
  PDF page 97 (book page 65) — shorter than the EN version which spans two
  pages. Worth noting as a verified difference vs the English original.
- **Table cell wrap within columns:** column-3 entries like `isiklikke sek-
  /suaalsuhteid,` span two visual rows. Serialized as two separate rows in
  `rows[]` (matching EN exemplar precedent — one y-band per row). The
  soft-hyphen inside a cell is normalized out via `.replace(SOFT_HYPHEN, "")`
  inside `build_table_block`.
- **Opening quote variant in Third Step Prayer:** PyMuPDF renders the opening
  quote of the Estonian prayer as U+201D (RIGHT DOUBLE QUOTATION MARK, `”`)
  rather than U+201E (`„`) used elsewhere in the book. Per ET rule "preserve as
  authored, fidelity to source beats grammatical correctness", kept verbatim.
  Consistent with the way closing quotes are typeset — note that the closing
  of the same prayer uses `”` too.

## Flagged blocks

- **`ch05-kuidas-see-toetab-t041`** (table, p97): the italic header row is
  split across two y-bands for the col-1 cell (`Kannan` at y=170.6, `vimma:`
  at y=184.1) because col-2 and col-3 only have one header line each. This
  matches the EN exemplar's treatment where a single cell's wrapped lines
  become separate rows. Cosmetic quirk; serialized text remains readable.
- **`ch05-kuidas-see-toetab-p033`** (p95): Third Step Prayer kept inline;
  opening quote rendered `”` (U+201D) rather than `„` (U+201E). Preserved as
  authored.
- **`ch05-kuidas-see-toetab-l018`** (step 11): very long (197 chars) because
  steps 11 text runs eight lines in source. All continuation lines joined
  correctly via hanging-indent detection (x≈82.2 > marker_x + 5 = 70.2).

## Verdicts

- **Twelve Steps verdict**: all 12 emitted as complete list-items with full
  text, one block per step (l008 through l019).
- **(a)(b)(c) sub-list verdict**: all 3 emitted as list-items (l022/l023/l024).
- **Resentment table verdict**: emitted as single `table` block (t041)
  with 26 rows, pipe-serialized `text`, and structured `rows: string[][]`.
- **Drop-cap verdict**: 'O' + 'leme…' merged to 'Oleme…' — clean, no
  artifacts. BrushScriptStd 33pt detection worked on first pass.

## ET conventions refinements proposed

None. All existing rules from the Wave-1 ET pilot applied cleanly:

- Soft-hyphen-at-join-time: fired ~60+ times without producing broken splits.
- 11pt running-header drop: fired on all pages 91–103 (not on p90 because p90
  is the chapter-opener, no header).
- En-dash (U+2013) / minus (U+2212) with space-padding: present in body
  (e.g. `alkoholiga – salakavala`, `kõigeks valmis −`) — both joined with
  appropriate spacing via the `prev_had_trailing_space` check.
- Chapter label regex `^\d+\.\s*peatükk\s*$` — matched `5. peatükk` on p90.
- No ET compound-word allowlist needed — no U+002D line-break splits in this
  section. Every mid-word hyphen (`võib-olla`) is authored compound, not a
  line-break artifact.

## Uncertainties flagged

- **Italicized text within paragraphs.** Two paragraphs contain italic
  fragments that PyMuPDF emits as their own "line" because the font style
  changes mid-row:
  - p91 step 3: continuation line `nii nagu meie Teda mõistsime.` is in
    `NewCaledoniaLTStd-It` — not a separate paragraph; correctly joined
    into step 3.
  - p96 p-block (p036 after join): `See oli Neljas Samm.` is italic — part of
    the surrounding paragraph, correctly joined.
  Both preserved as inline text per the EN/ET "italic alone is a weak split
  signal" rule.
- **Soft-hyphen artifact inside table cells.** Column-3 entry at band y=467.3
  (`isiklikke sek-`) uses a soft hyphen at the end, and the wrap continuation
  at y=480.8 (`suaalsuhteid,`) is the joined form. In the table's pipe-
  serialized `text`, these appear on separate rows per the one-band-per-row
  convention; a prose-aware consumer should stitch them. No action taken — this
  matches the EN exemplar's treatment (e.g., `Personal relation-` / `ship.`).
