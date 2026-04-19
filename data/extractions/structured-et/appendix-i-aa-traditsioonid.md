# appendix-i-aa-traditsioonid extraction report

**Wave 4 fresh re-run.** Cross-run repeatability test — output produced without consulting `backup-wave-1-2/`.

## Summary

Extracted Estonian Appendix I (`AA Traditsioonid`) spanning PDF pages 593–598
(book pages 561–566). 34 blocks emitted:

| Kind        | Count |
| ----------- | ----- |
| heading     | 4     |
| table       | 1     |
| paragraph   | 5     |
| list-item   | 24    |
| **total**   | **34** |

Short-form list-items: 12 (page 594, italic `NewCaledoniaLTStd-It` at size 11,
word-cardinal markers `Üks` … `Kaksteist`).
Long-form list-items: 12 (pages 595–598, regular `NewCaledoniaLTStd` at size 11,
arabic markers `1.` … `12.`).

Both marker families use U+2212 MINUS SIGN (`−`) with surrounding spaces as
the item separator — matches the ET convention documented in the companion
spec's "List-item prefix conventions (ET)" section.

## Method

- PyMuPDF `page.get_text("dict")` only — no pdfplumber needed.
- Single per-line pass per page, sorted by `y0`. Same-y-band lines within
  `|Δy| ≤ 1.5pt` are clustered and concatenated by `x0` (matters on page 593
  row `y=208.7` where `Anonüümsetesse Alkohooliku` and a tail soft-hyphen
  span `­` at `x=327.5` land on the same row).
- ET soft-hyphen join logic applied line-to-line: strip U+00AD and join
  without a space.
- Running-header drop rule: `y0 < 45 AND (size ≤ 11.5 OR digits-only)`.
  On this section the rule only fires against the top-of-page numerical
  folios (`562` … `566` at `y=35.0`) on pages 594–598. On page 593 the
  folio `561` is at page-bottom (`y=530.8`); it was dropped by the
  "digits-only anywhere" branch of the rule.
- Paragraph/list boundary detection: indented first line (`x0 > 62` vs body
  margin `x0 = 56.7`) starts a new block; intra-block wraps land at body
  margin and are appended.

## Heading handling

Four `heading` blocks emitted:

1. **`h001` LISAD** (page 593, `y=28.9`, size 14.0, centered). The
   appendix-opener TOC banner.
2. **`h003` I AA TRADITSIOON** (page 593, size 14.0). Two-line centered
   merge:
     - Line 1: `I` at `y=164.9`
     - Line 2: `AA TRADITSIOON` at `y=179.9`
   Merged with a single space separator per the parent conventions'
   two-line appendix-heading rule. No parenthesized disambiguator.
3. **`h008` AA 12 TRADITSIOONI** (page 594, `y=49.2`, size 11.0). The
   short-form section heading. Note: this text is size 11.0 — the same
   font-size class as body text. It survives the running-header drop
   rule because its `y=49.2 ≥ 45`. Running headers on pages 594–598
   folio lines are at `y=35.0` (below the 45 gate).
4. **`h021` AA 12 TRADITSIOONI (Pikk versioon)** (page 595). Two-line
   centered merge:
     - `AA 12 TRADITSIOONI` at `y=49.2`
     - `(Pikk versioon)` at `y=64.2`
   Merged with a space separator — matches the parent spec's
   parenthesized-disambiguator merge rule.

## LISAD TOC handling

Emitted as:

- `h001` heading `LISAD`
- `t002` table with 7 rows × 2 cells

Column clustering: left column (roman numerals `I`–`VII`) at
`x0` ≈ 90–108, right column (appendix titles) at `x0 = 119.1`.
Sort-then-zip per column (the ET companion spec warns against
y-proximity pairing because column-internal leadings differ).
Serialized `text` field is `" | "` between cells, `"\n"` between rows
for non-table-aware consumers.

## Schema decisions

- **Running header treatment on p594/p595**: the text `AA 12 TRADITSIOONI`
  at `y=49.2` is NOT a running header on these pages — it is the actual
  section heading for short-form (p594) and long-form (p595, merged with
  the `(Pikk versioon)` disambiguator). On pages 596–598 no `AA 12
  TRADITSIOONI` appears at top; only the folio number at `y=35.0`.
  Decision: emit both as heading blocks; they are not duplicates across
  pages in the sense the running-header rule targets.
- **Intro paragraph indent threshold**: at 12.5pt body size the intro
  paragraphs use `x0 = 68` for first line, `x0 = 56.7` for wraps. Same
  threshold works for both 12.5pt and 11.0pt bodies in this section,
  so a single gate (`x0 > 62`) was used for both.
- **List-item continuation inside the same block**: no size-transition
  flush applied — list-items continue across pages (items 6, 7, 9, 12
  all span a page boundary). The paragraph "Meie AA kogemus on meile
  õpetanud, et:" at `y=92.9` on p595 is size 11.0 italic but at `x0=68`
  (indented first-line) — correctly emitted as its own `paragraph` block
  before the long-form list starts.

## Source quirks preserved verbatim (per ET fidelity rule)

1. **Duplicated word `heaolu, heaolu,`** in item 4 (`l026`, p595):
   ```
   heaolu, heaolu, siis tuleks nende rühmadega nõu pidada.
   ```
   Wave 2 already documented this. Preserved.
2. **Truncated continuation fragment `simustes on meie ühine heaolu
   esmatähtis.`** at tail of item 5 (`l027`, p595 `y=456.7`):
   ```
   … peamine eesmärk – kanda oma sõnum veel kannatava alkohoolikuni.
   simustes on meie ühine heaolu esmatähtis.
   ```
   This fragment appears to be a leftover from item 4's last line (which
   ends with "Sellistes küsimustes on meie ühine heaolu esmatähtis.")
   that the typesetter failed to delete. Wave 2 documented it. Preserved.
3. **Heading singular `I AA TRADITSIOON`** (not plural `TRADITSIOONID`).
   The outline metadata uses plural `AA Traditsioonid`, but the page 593
   heading is singular. Preserved as source typography intends.
4. **Mixed quote glyphs** in `l031`: `„AA Grapevine'i"` uses ET opener
   `„` (U+201E) and ASCII closer `"` instead of matching `"` (U+201D).
   Matches source; preserved.
5. **Comma splice in `l032`**: `kunagi, väljendada` (odd comma). Preserved.
6. **Double space** in item 4 source between `võib` and `olulisel` was
   normalized to a single space during the multi-space collapse step
   (`re.sub(r"[ \t]+", " ", text)`). Non-semantic whitespace cleanup;
   acceptable under the ET spec's "authored content vs typographic
   artifact" distinction.

## Flagged blocks

- **`l027` (item 5)** — contains the truncated `simustes…` fragment. If
  downstream consumers want it dropped, this is the block to filter.
  Kept per fidelity-over-correction rule.
- **`h008` vs `h021`** — same lead-in text `AA 12 TRADITSIOONI`. If a
  consumer deduplicates headings by text, it will lose short-form /
  long-form separation. Distinction lives in the parenthetical suffix
  on `h021`.

## Schema proposals

None. Existing ET conventions (Wave 2's "List-item prefix conventions"
and "TOC-on-appendix-opening pattern", Wave 1's soft-hyphen join and
11.5pt running-header refinement) covered every case encountered.

## Cross-run repeatability notes

- Block count 34. The Wave 2 Brilliant note referenced "ET 33 blocks
  (+1 for LISAD TOC)". The +1 extra in this run (34 vs 33) is because
  the TOC is emitted as two blocks (`heading` `LISAD` + `table`) rather
  than a single combined block. Both are consistent with the parent and
  ET conventions, but the exact cut differs. No content loss either way.
- Short-form list-items: 12 (matches EN exemplar).
- Long-form list-items: 12 (matches EN exemplar).
- Heading count differs from EN (EN has 3: main + short-heading +
  long-heading; ET has 4: LISAD + main + short + long, because ET
  adds the TOC opener).
