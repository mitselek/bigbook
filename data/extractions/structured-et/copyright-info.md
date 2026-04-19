# copyright-info (ET) — extraction report

## Summary

Estonian front-matter section spanning **PDF pages 4-10**. Emitted **25 blocks** total: 6 headings, 14 paragraphs, 5 tables. The ET `copyright-info` is broader than its EN counterpart: EN covers a single copyright page (14 `paragraph` blocks, no heading); ET covers the copyright page (p4) AND the SISUKORD (table of contents) spanning pp5-10. The 14 page-4 paragraphs mirror EN's 14-block content exactly. The TOC is represented as 5 `table` blocks with interspersed `heading` blocks marking part divisions. JSON validated with `json.load()`.

## Method

- **Library:** PyMuPDF only (`page.get_text("dict")`). No `pdfplumber` needed.
- **Scripts:**
  - Probe: `.tmp/probe-copyright-info-et.py` → `.tmp/probe-copyright-info-et.txt`
  - Extractor: `.tmp/extract-copyright-info-et.py`
- **Pipeline:**
  1. Collect all non-blank lines from pp4-10 with font/size/bbox info.
  2. Normalize text (ligatures, NUL) — soft hyphens preserved until join time per ET convention.
  3. Drop running headers: `y0 < 45 AND (size <= 11.5 OR isdigit OR roman)`. Drops SISUKORD+roman-page-number running headers on pp6-10 (y≈35, size=11).
  4. **Page 4 (copyright body):** emit "COPYRIGHT" label as heading; build 14 paragraph blocks using a three-signal paragraph-break rule (parallel-entry cue, y-gap > 18pt, terminal punctuation).
  5. **Pages 5-10 (SISUKORD):** emit SISUKORD heading; classify each body line by role (`title`, `deck`, `page`, `part`, `heading`, `col-hdr`); cluster into y-bands (tol 2.0pt); emit TOC table rows by pairing `title + page` on the same band with optional `deck` (italic subtitle) accumulation under the pending row; flush tables on encountering `part` or `heading` bands.

### Heuristics fired

- **Y-gap paragraph-break** on p4 — cleanly separated the 2-line copyright notice, the 3-line Grapevine reprint sentence, the 2-line italic Conference-approved statement, and the 2-line trademarks statement.
- **Parallel-entry cue** on p4 — split the edition list (First/Second/Third/Fourth Edition), the printing list, and the bibliographic trio (LoC/ISBN/Printed).
- **Sentence-terminator split** — closed the Grapevine sentence at `"...with permission."`.
- **ET running-header drop** — `y < 45, size ≤ 11.5` gate correctly dropped the SISUKORD + roman-page-number on pp6-10.
- **ET soft-hyphen join** — applied to the deck of Part II story 6 (`"tahte\u00ad-"` + `"jõudu"` → `"tahte-jõudu"`). The soft hyphen was stripped at join time; the adjacent U+002D was preserved per the Wave 4 ET rule ("preserve line-end U+002D in ET").
- **Y-band pairing tol 2.0pt** — needed because Part II story 7 (`"7 Eitamise jõe ületamine"` at y=409.76, size=12) and its page number (`"328"` at y=411.58) differ by 1.82pt — just over the default 1.5pt tol.

### Heuristics NOT needed

- **Heading detection by size** — SISUKORD is at size 15 (bold, >= 14) so caught directly; the "Lisad" mini-heading on p10 and the "COPYRIGHT" label on p4 are both size-10 but emitted as headings via text match (see Schema decisions).
- **Drop-cap merge** — no drop-caps in this section.
- **Cross-page paragraph merge** — no paragraphs span pages in this section (pp5-10 are pure TOC tables).
- **Cross-line hyphenation allowlist** — irrelevant for ET (soft-hyphen is the mechanism).

## Schema decisions

1. **`COPYRIGHT` label on p4 emitted as `heading`.** The label is centered at top of page (y=49.33) but is size=10 — below the usual heading threshold. I emit it as a heading because (a) it functions as a page label, (b) its position above the copyright body is structurally heading-like, and (c) EN's extraction dropped everything prior but the ET side has this explicit centered label on the copyright page. This keeps the first block something navigable. If a downstream consumer prefers no heading, it can ignore this block.

2. **`SISUKORD` emitted as `heading` on p5.** Standard — size 15 Bold, centered.

3. **TOC emitted as **multiple** `table` blocks with interspersed part-`heading` blocks.** A single giant table would lose the logical divisions (front matter → Part I stories → Part II stories → Part III stories → Lisad appendix TOC). Instead:
   - `t017` — main chapter TOC (17 rows: 6 front-matter entries + 11 chapter entries)
   - `h018` — `ISIKLIKUD KOGEMUSLOOD — I OSA — AA teerajajad` (Part I super-heading)
   - `t019` — Part I stories (10 rows incl. the unnumbered Doktor Bobi founder story)
   - `h020` — `II OSA — Nad lõpetasid aegsasti`
   - `t021` — Part II stories (17 rows)
   - `h022` — `III OSA — Nad kaotasid peaaegu kõik`
   - `t023` — Part III stories (15 rows)
   - `h024` — `Lisad` (appendix TOC super-heading)
   - `t025` — Appendix TOC (7 rows: I-VII)

4. **Part super-headings joined with ` — ` separator.** The three lines "ISIKLIKUD KOGEMUSLOOD" / "I OSA" / "AA teerajajad" are logically distinct captions (part designation, part number, italic deck). Joining with em-dash preserves the structure as a single heading block while retaining the distinct labels. An alternative was three separate heading blocks, but that would fragment the heading awkwardly.

5. **TOC row structure: 2 columns `[title-with-marker, page-number]`.** Matches the Wave-4 ET appendix-i LISAD TOC pattern and is the natural visual shape of a TOC. The story-subtitle italic deck (multi-line "description" below each numbered story title) is **attached to the title cell**, joined with ` — `. This captures the complete visible TOC entry in a single row rather than duplicating story titles with orphan deck rows.

6. **`Peatükk` / `Lehekülg` column-header dropped.** The italic `"Peatükk"` + `"Lehekülg"` line on p5 is table chrome (column labels), not authored content. Dropped like running headers. Conventions do not mandate a "table-header row" mechanism, and including it would add a row that doesn't follow the `[title, page]` shape.

7. **TOC row markers kept in `text` cell.** Story rows keep their marker (`"1 Puuduv lüli"`, `"2 Hirm hirmu ees"`, etc.) inside the title cell. Matches the Wave-4 ET convention ("Keep the marker inside the `text` field"). The marker gives ordinal context to parsers.

8. **Non-breaking text preservation.** Estonian curly quotes `„` `”` preserved as-is. Em-dashes from source preserved as U+2014; en-dashes `–` preserved. The "20 years AA-ga" / "AA-le" / "AA-sse" compound hyphens are all intra-line and survive unchanged.

9. **Story "." and ".." preserved verbatim.** Rows like `"...Nii sündis AA Chicagos.."` and `"...Kolmanda Sammuni.."` have a stray trailing double-dot in source; preserved per ET fidelity-over-correction principle.

10. **"7 Eitamise jõe ületamine" at size=12 (vs usual 11).** Source anomaly — this one TOC entry has its title line set at 12pt instead of 11pt. Classify/pairing logic accepts sizes 10.9-12.0 so it was captured correctly.

## Flagged blocks

None are critically uncertain. A few minor calls to document:

- `copyright-info-h001` — `"COPYRIGHT"` — size-10 centered label. Defensible emit; see Schema decision 1.
- `copyright-info-h018` — three-line Part I super-heading joined with ` — `. Alternative: three separate heading blocks.
- `copyright-info-t021` row 6 — `"tahte-jõudu"` — the source has `\u00AD-` at the line-end (soft hyphen adjacent to an explicit hyphen). Join rule stripped the soft hyphen and preserved the `-`. The Estonian word is normally written as `tahtejõudu` (single word, no hyphen), but the source PDF glyphs include the `-`, so preserving it is faithful-to-source.
- `copyright-info-t023` row 2 — nested Estonian curly-quote pair `„Mulle oli loetud moraali, ... „Ma tean, mida sa läbi elad ..." — the inner opening `„` has no matching closing quote in this TOC excerpt (the deck is a partial quote). Preserved as-is from source.

## Schema proposals

None. Existing block kinds (`heading`, `paragraph`, `table`) handle this section cleanly. The EN/ET divergence on pdfPageStart/pdfPageEnd (EN: page 1 only; ET: pages 4-10) reflects a genuine structural difference between the two editions — the Estonian edition bundles the SISUKORD under the `copyright-info` outline entry whereas the English edition separates them.

## Hard-constraint check

- JSON parses (`json.load()` verified).
- Wrote only to `data/extractions/structured-et/copyright-info.json`, `data/extractions/structured-et/copyright-info.md`, and `.tmp/*`.
- No source-code changes, no commits, no pushes, no npm.

## Kind counts

| Kind         | Count  |
| ------------ | ------ |
| `heading`    | 6      |
| `paragraph`  | 14     |
| `table`      | 5      |
| `list-item`  | 0      |
| `verse`      | 0      |
| `blockquote` | 0      |
| `footnote`   | 0      |
| `byline`     | 0      |
| **Total**    | **25** |

TOC row counts across the 5 tables (sanity check for TOC completeness):
| Table | Rows | Content                                                     |
| ----- | ---- | ----------------------------------------------------------- |
| t017  | 17   | 6 front matter + 11 chapters                                |
| t019  | 10   | Part I: 1 unnumbered founder story + 9 numbered stories     |
| t021  | 17   | Part II: 17 numbered stories                                |
| t023  | 15   | Part III: 15 numbered stories                               |
| t025  | 7    | Appendices I–VII                                            |
| Total | 66   | All 66 TOC entries captured                                 |
