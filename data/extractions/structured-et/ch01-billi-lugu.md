# ch01-billi-lugu — Billi lugu (Bill's Story) — fresh ET extraction

## Summary

Fresh-run extraction (ET Wave 4 cross-run repeatability test). PDF pages 33–48,
book pages 1–16. Produced **71 blocks**: 1 heading, 67 paragraphs, 1 verse
(Hampshire Grenadier tombstone), 1 byline (Bill W,), 1 footnote (`*2001.
aastal...` on p48). No verse false positives; no soft-hyphen leakage; no NULs;
ligatures clean.

Block counts by kind:

| kind      | count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 67    |
| verse     | 1     |
| byline    | 1     |
| footnote  | 1     |
| **total** | **71** |

## Method

- Python: `/home/michelek/Documents/github/bigbook/.venv/bin/python`.
- Library: PyMuPDF (`pymupdf`) via `page.get_text("dict")` only. No pdfplumber.
- Script: `/home/michelek/Documents/github/bigbook/.tmp/extract-ch01-et-fresh.py`.
- Heuristics fired:
  - ET running-header drop: `y0 < 45 AND (size <= 11.5 OR text.isdigit())`.
  - Bottom page-number drop: `digit-only AND size <= 11.5 AND y0 > 520`.
  - Chapter-label drop: `"1. peatükk"` regex at page 33, italic 12.5pt.
  - Heading detection: page 33, size 13–15, starts with `BILLI`.
  - Drop-cap merge: page 33 `BrushScriptStd` glyph `S` at size 33 merged with
    first body line starting at `x ∈ [78, 95], y ∈ [100, 115]` → `Sõjapalavik`.
  - Verse detection: page 33 lines with `y ∈ [315, 400]` AND `x0 >= 95` (6 lines,
    centered at x≈102 + last line at x≈128).
  - Footnote detection: `Times*-Italic*` size ≤ 10.5 at y > 500.
  - Byline detection: page 48 `NewCaledoniaLTStd-It` size ≤ 10.5, `y ∈ [500, 525]`.
  - Paragraph-start: `x0 ∈ [64, 75]` (body indent ~68 past margin ~57).
  - Soft-hyphen cross-line join: strip `U+00AD` and join without space at join
    time (per ET convention). Zero U+002D cross-line splits observed.

## Schema decisions

- **Heading text** preserved as visual rendering `BILLI LUGU` (all-caps), not
  metadata form `Billi lugu` — per conventions divergence clause.
- **Drop-cap merge**: treated `S` + `õjapalavik...` as `Sõjapalavik...` with no
  separating space. No small-caps tail in ET, so no flattening needed.
- **Hampshire Grenadier verse** (p33 y=322–395): 6 lines emitted as one `verse`
  block, newlines preserved between lines. Estonian curly quotes `„…"`
  preserved. Verse lines sit at x≈102 (lines 1–5) and x≈128 (line 6 `või
  kannust."`) — centered alignment. Bracketed by ~29pt blank-y gaps above
  (paragraph ends y=293) and below (next para starts y=424).
- **Byline** (p48): two-line NewCaledoniaLTStd-It block at y=507.46 and
  y=518.46. First line `Bill W, AA üks asutajaliikmeid,` has trailing comma;
  second line `suri 24. jaan. 1971.`. Joined with `", "` per EN/ET convention
  (stripped the trailing comma from line 1 before joining to avoid `,, `).
  Final text: `Bill W, AA üks asutajaliikmeid, suri 24. jaan. 1971.`.
  - ET quirk preserved: `Bill W,` (no period after `W`) as documented in ET
    conventions.
- **Footnote** (p48 y=534.62): Times-Italic 10pt line
  `*2001. aastal o1i AA-l üle 100 000 rühma.`. Asterisk preserved as first
  character (per EN convention). The `o1i` OCR artifact is preserved verbatim
  per ET conventions.
  - The in-text asterisk reference appears on p48 inside paragraph p069 at end
    of `kasvame nii arvukuselt kui jõult.*` — preserved as authored.
- **Source typo preserved**: `sõruskonna` (should be `sõpruskonna`) on p48
  inside p067 — left verbatim per ET conventions "Fidelity to source beats
  grammatical correctness".
- **Dialogue** on p41: the one-line quoted utterances `„Kuule, mida see peab
  tähendama?"` and `„Ma olen leidnud religiooni."` sit at x=68 paragraph indent
  on their own source lines — emitted as standalone `paragraph` blocks (p033,
  p034). Per EN convention "Dialogue passages in prose — keep them inside their
  surrounding paragraph" is ambiguous here because the source typesetter gave
  each a new paragraph indent. Following the visual layout, each becomes its
  own paragraph. No change in conventions needed.
- **Italic pull-quote on p44** (y=411.72–440.41 `Küsimus oli ainult
  valmisolekus uskuda Jõudu...`): kept inline within the surrounding paragraph
  p051, which continues in regular weight from y=454.91 without a paragraph
  indent. Per EN convention — italics alone is a weak split signal.
- **Block ordering**: applied a final sort by `(pdfPage, firstLineY,
  heading-bumper)` so the verse on page 33 lands between paragraphs p002 and
  p003 correctly.

## Flagged blocks

- **p033 `„Kuule, mida see peab tähendama?", pärisin ma.`** — single-sentence
  paragraph dialogue. Some downstream consumers may prefer this merged with the
  preceding paragraph p032. Kept split here to match source paragraph-indent
  signal.
- **p049 `Mu sõber tegi ettepaneku, mis näis siis uudsena. Ta ütles: „Miks ei
  loo sa ise endale oma kontseptsiooni Jumalast?"."`** — the italic segment
  `Jumalast?"` on p44 y=353.72 is a mid-sentence style change; body resumes
  regular weight at y=367.91. Kept inline since the italic doesn't straddle a
  full paragraph. Note the trailing `."` is the source's punctuation order
  (period after closing quote) — preserved verbatim.
- **p066 `sõruskonna` typo** — preserved, documented above.
- **p071 `o1i` OCR artifact** — preserved, documented above.

## Schema proposals

**None.** ET Wave 3 accepted conventions handle this section cleanly:

- Soft-hyphen cross-line join: zero leaks, zero mis-joins.
- BrushScriptStd drop-cap detection and merge: straightforward single-glyph
  case.
- `y0 < 45` running-header gate: correctly excludes p33's `1` at y=530 (caught
  by the separate bottom-of-page rule) and every page's top-of-page running
  headers.
- Hampshire Grenadier verse: clean x/y detection, 6 lines, no false positives
  elsewhere.
- ET curly-quote preservation (`„` / `"`): clean.
- Byline ", " join rule: applied correctly, ET quirk `Bill W,` preserved.
- Footnote `*` marker preservation: applied correctly.

No additions or refinements proposed from this re-run.

## Verdicts per ET conventions

| Convention | Verdict |
| ---------- | ------- |
| U+00AD soft-hyphen strip-and-join at join time | Applied; no leaks in output. |
| U+2013 en-dash / U+2212 minus-sign space-preserving join | Applied; surrounding-space detection preserved spaces correctly (e.g. p004's `mis siis?`). |
| Running headers at y<45 AND (size≤11.5 OR digit) | Applied; all 16 pages' running headers dropped cleanly. |
| Chapter label `N. peatükk` drop | Applied on p33 (`1. peatükk`). |
| BrushScriptStd drop-cap ≥20pt, no small-caps tail | Detected on p33 (`S` at size 33); merged with `õjapalavik` → `Sõjapalavik`. |
| Narrow-glyph wrap-zone offset | Not triggered (`S` is a wide glyph; default +35 suffices). |
| ET curly quotes `„` `"` preserved | Preserved in verse, dialogue, and body. |
| Ligature expansion (fi/fl/etc.) | Applied via normalize_text. No artifacts in output. |
| NUL-byte strip | Applied. No leaks. |
| Source quirks preserved | `Bill W,` (no period), `o1i` (OCR), `sõruskonna` (typo) all verbatim. |
| Byline multi-line ", " join | Applied. |
| Footnote `*` marker as first char | Applied. |
| Hampshire Grenadier verse | Emitted as single verse block, 6 lines, newlines preserved. |
| No ET-specific compound allowlist needed | Confirmed — zero U+002D cross-line splits in section. |
