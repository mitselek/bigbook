# arsti-arvamus — extraction report

**Section:** Arsti arvamus (Doctor's Opinion, Estonian)
**PDF pages:** 25–32 (8 pages; roman-numeral book pages xxv–xxxii)
**Blocks emitted:** 42 — `heading` × 1, `paragraph` × 39, `byline` × 2
**EN counterpart:** `doctors-opinion.json` — 42 blocks (1 heading + 39 paragraphs + 2 bylines). **Exact parity.**

## Summary

The ET Doctor's Opinion is the front-matter medical endorsement letter(s) from Dr. William D. Silkworth. It has a single 14pt heading (`ARSTI ARVAMUS`), a BrushScriptStd 33pt drop-cap `M` opening the narrator's introduction, two Silkworth signatures (one multi-line with closing phrase + name, one single-line), and zero footnotes / verse / tables / list-items.

Block-count matches EN exactly at 42, which validates the shared structured-extraction schema across languages for this section.

## Method

- PyMuPDF `page.get_text("dict")` on 0-indexed pages 24..31.
- Per-line sort by `(pdf_page, y0, x0)` for reading order.
- Running-header/page-number drop: `y0 < 45 AND (size <= 11.5 OR isdigit())`. **Tightened from the ET convention's `y0 < 50`** because the letter/statement body (11.5pt) has lines at y=49.1, which false-triggered the original gate and caused the entire first body line on subsequent pages to be dropped (symptom: the text "tekiks iseäralik tung alkoholi järele. Nagu me oleme tähel-" was missing between p30-last and p31-second-line on my first pass). Running headers actually sit at y=35, so y<45 is a safe tighter gate here. **Also added** a roman-numeral bottom-of-page number drop (`[ivxlcdm]+` at y>520 size<=11.5) for `xxv` on p25 — no digit-only page numbers in this section.
- Line normalization: ligature expansion (U+FB00–FB05), NUL strip. Soft hyphens preserved until paragraph-join.
- Paragraph-join (ET rules from conventions):
  - U+00AD soft hyphen at line-end → strip, join no-space. (Used heavily: p25–32 each have 4–8.)
  - U+002D hyphen + next lowercase → strip, join no-space (ET has no compound allowlist). Rare here.
  - U+2013 en-dash space-padded at line-end/start → preserve spacing. One per p25, p26; three on p29.
  - Default: join with single space.

## Schema decisions

1. **Size-band transitions as implicit paragraph boundary.** The section has two body font-sizes:
   - **Narrator framing** (~12.5pt) with body-margin x=56.7 and paragraph-indent x=68.
   - **Letter body and doctor's statement** (~11.5pt) with body-margin x=68 and paragraph-indent x=79.4.
   Where the narrator hands over to the letter (p25 y=275 "Kõigile asjaosalistele:") and vice-versa (p26 y=158, p27 y=158), the salutation/return-to-narrator line sits **at the letter's body-margin, not indented**, so x-based paragraph-start detection alone would merge it with the surrounding text. I added a `prev_band != cur_band` size check that forces a paragraph flush whenever the size crosses 12.0 in either direction. This cleanly separates:
   - `p002` narrator intro → `p003` salutation `Kõigile asjaosalistele:` → `p004` letter body start
   - `p009` letter body → `b010` Silkworth byline → `p011` narrator returns
   - `p013` narrator bridge → `p014` `Arst kirjutab:` → `p015` doctor's statement begins

2. **Dual paragraph-indent thresholds** (`paragraph_indent_x`). For size >= 12.0 (narrator), indent starts at x>=64; for size < 12.0 (letter), indent starts at x>=76. The upper bound (x<96) on the narrator indent excludes drop-cap wrap-zone lines.

3. **Drop-cap merge.** BrushScriptStd 33pt `M` at p25 y=130.9 x=53.7, merged with the first body line `eie, Anonüümsete Alkohoolikute liikmed,` at y=135.4 x=97.1. Result: `Meie, Anonüümsete...`. Subsequent wrap-zone lines on p25 (y=135..251) at body-margin x=56.7 are regular paragraph continuations of the narrator body — no extra handling needed, since the `paragraph_indent_x` threshold (x>=64 for 12pt) excludes them from being false paragraph-starts.

4. **First byline (multi-line).** Layout on p26 y=103.1: four tab-only spans (`\t` / `\t` / `\t` / `\t` as alignment glue) and then `  Lugupidamisega teie` (with leading double-space) at x=228; on the next line y=116.6 at x=201, `William D. Silkworth, M.D.`. Tab-only lines are dropped via `stripped == ""`. The remaining two lines are joined via ET convention into one `byline`: `"Lugupidamisega teie, William D. Silkworth, M.D."` — closing phrase + name, separator `", "` (not `"\n"`, not two blocks).

5. **Second byline (single line).** p32 y=339.1: `Doktor William D Silkworth`. Emitted as a single `byline` block. **Note:** source has `Doktor William D Silkworth` with no period after `D`, diverging from the first byline's `William D. Silkworth, M.D.` — preserved verbatim per ET fidelity-over-correction convention.

6. **Cross-page paragraph merges.** Used the terminal-punctuation heuristic implicitly: since my approach doesn't flush blocks on page boundaries, and the letter/statement body doesn't use first-line indents at x<76, cross-page continuation lines merge naturally into the still-open paragraph. Verified merges:
   - p25-last `...uue epohhi algust alkoholismi` + p26-first `ajaloos. Neil inimestel võib olla rohi` → `p008`
   - p27-last `...surma väravatelt tagasi.` (ends with period) + p28-first `Mõistagi tuleb alkohoolik` → separate blocks `p020` / `p021` (period signals paragraph end, next line is paragraph-indented anyway)
   - p30-last `...ilma et neil` + p31-first `tekiks iseäralik tung...` + p31-second `danud, võib see...` → `p034` (single cohesive paragraph)

## Flagged blocks

- **`arsti-arvamus-p040`**: source has `„kaubaks"` with ASCII `"` (U+0022) as the closing quote instead of the Estonian `”` (U+201D). Verified in raw PyMuPDF output — this is a genuine source typo/inconsistency. Preserved verbatim per ET convention.

  > `Ometi läksid raamatus sisalduvad põhimõtted tema puhul „kaubaks".`

- **`arsti-arvamus-b042`**: `Doktor William D Silkworth` — no period after middle initial `D`. Source-faithful; contrast with `b010`'s `William D. Silkworth, M.D.` which includes both periods.

- **`arsti-arvamus-p002`**: the narrator intro ends with `järgmise kirja:` (colon, introducing the letter). The salutation `Kõigile asjaosalistele:` becomes `p003`. In EN (`doctors-opinion.json`), these are also separate (`p002` and `p003`), so the split matches.

## Schema proposals

None. The section fit cleanly into existing ET conventions. The one novel element — **size-band transitions as implicit paragraph boundaries** — is specific to sections with mixed-font-size content (embedded letters/statements within narrator framing). It could be generalized as a convention if other front-matter sections have similar embedded-letter patterns, but for now it's a section-local heuristic.

## Key counts

| Item | Count |
|------|-------|
| Blocks total | 42 |
| `heading` | 1 |
| `paragraph` | 39 |
| `byline` | 2 |
| `footnote` | 0 |
| `verse` | 0 |
| `table` | 0 |
| `list-item` | 0 |
| Silkworth signatures | 2 (1 multi-line, 1 single-line) |
| Drop-cap | 1 (`M`, BrushScriptStd 33pt) |
| Soft-hyphen joins | ~35 across 8 pages (all stripped-and-joined no-space at join time) |
| En-dash space-padded joins | 5 mid-sentence dashes on p25, p26, p29 (×3) |
