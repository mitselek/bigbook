# story-anonuumne-alkohoolik-number-kolm — extraction report

**Section:** Anonüümne alkohoolik number kolm (Pioneer story #1, Bill D.)
**PDF pages:** 214–224
**Book pages:** 182–192
**EN counterpart:** `story-aa-number-three`

## Summary

Extracted 41 blocks (1 heading + 29 paragraphs + 11 blockquotes). Matches EN
counterpart's total block count (41) exactly, though with a +1/−1 trade between
kinds due to one source-level typography difference (see "Schema decisions").

No byline at end of story (matches EN). No list items, no verses, no footnotes,
no tables.

## Method

- PyMuPDF `page.get_text("dict")` for per-line bboxes/fonts/sizes over pages
  214–224.
- Custom paragraph builder with size-band tracking: body prose ≈ 12.5pt,
  editorial-interlude blockquote ≈ 11.5pt. Size-band transition flushes the
  current paragraph (the ET `arsti-arvamus` pattern).
- Drop rules applied:
  - Running headers at `y0 < 45` AND (`size <= 11.5` OR pure-digit).
  - Bottom-of-page numeric footers (`y0 > 520`, size ≤ 11.5, digit-only).
  - Story-number `(1)` on page 214 at `y ≈ 52.12` (matches the ET/EN
    "drop story-number entirely" convention).
- ET cross-line join rules (soft-hyphen strip-and-join, U+2013/U+2212 dash
  space-padding heuristic).

## Schema decisions

### Heading merge (two centered lines)

Page 214 renders the heading as two centered 14pt lines:

- `ANONÜÜMNE ALKOHOOLIK` at y=71.21
- `NUMBER KOLM` at y=86.21

Merged with a space into a single heading block: `ANONÜÜMNE ALKOHOOLIK NUMBER KOLM`.
EN counterpart does the same (`ALCOHOLIC ANONYMOUS NUMBER THREE`). Note the ET
heading uses `ANONÜÜMNE` (singular) while the running-page header on even pages
reads `ANONÜÜMSED ALKOHOOLIKUD` (plural, the book title) — both preserved as
typeset.

### Italic deck (subtitle)

Three wrapped italic lines on p214 (y=111.33–140.33, x=68.03/x=56.69) — a
single sentence split across 3 visual lines. Emitted as one `paragraph` block
per ET convention default.

### Drop-cap merge

Narrow-glyph `S` (BrushScriptStd, 33pt) at y=159.19. The two following body
lines at x=83.02 (y=164.65, y=179.15) are drop-cap wrap-zone continuations, not
new paragraphs. Merged: `S` + `ündisin Carlyle'i maakonnas...` → `Sündisin
Carlyle'i maakonnas...`. Subsequent body lines at x=56.69 are the normal
paragraph continuation (no space inserted, mid-paragraph wrap).

The wrap-zone x-band for this narrow `S` is x ≈ 83pt (per the ET-conventions
+20pt narrow-glyph offset rule; `S` glyph ends at x=80.19, wrap at x≈83).

### Editorial interlude (blockquote emission — confirmed per task note)

**Yes, ET has the editorial interlude.** Spans pp220–221 at smaller font size
(~11.5pt, body is ~12.5pt) with a right-shifted margin column (body=x=68.03
vs body-prose x=56.69; indent=x=79.37 vs body-prose x=68.03).

Opens with `(Siinkohal sekkuvad toimetajad nii palju, et täiendada voodis
lebava mehe, Bill D, jutustust Bill W vaatenurgaga ehk jutuga mehelt, kes
istus voodi kõrval). Jutustab Bill W:` at p220 y=116.35.

Closes with `Esimene AA Rühm sündis selsamal päeval. (Bill D jätkab nüüd oma
lugu.)` at p221 y=292.08–305.58.

**11 blockquote paragraphs emitted**, vs EN's **12**. The difference is that in
this ET edition the final two EN blockquote paragraphs (EN `q033` = "A.A.'s
Number One Group dates from that very day." + `q034` = "(Bill D. now continues
his story.)") are set as a single continuous paragraph in the ET source. The
ET sentence reads `Esimene AA Rühm sündis selsamal päeval. (Bill D jätkab nüüd
oma lugu.)` with no paragraph break between the two clauses. Preserved verbatim
per the ET fidelity-over-correction principle.

Post-interlude body prose resumes at p221 y=340.04 at size 12.55pt, cleanly
detected by the size-band transition flush rule.

### Story-number `(1)` drop

Dropped per ET/EN conventions. Pioneer-story numbering is structural, not
authored content.

### No byline

Neither ET nor EN has a byline. Story ends with:

> Ma arvan, et see on üks kõige imepärasemaid asju, mida inimene juhtuda teha.

Matches EN `p041` = "I feel that is about the most wonderful thing that a
person can do."

## Front-matter verdicts

- **Heading:** Emitted. `ANONÜÜMNE ALKOHOOLIK NUMBER KOLM` (two-line merge).
- **Story-number `(1)`:** Dropped.
- **Italic subtitle/deck:** Emitted as one `paragraph` block.
- **Drop-cap `S`:** Merged into first word of first body paragraph (`Sündisin`).
- **Running headers on even pages:** Dropped (`ANONÜÜMSED ALKOHOOLIKUD`).
- **Running headers on odd pages:** Dropped (`ANONÜÜMNE ALKOHOOLIK NUMBER KOLM`).
- **Running page numbers:** Dropped (both top and bottom placements).
- **Editorial interlude:** Emitted as 11 `blockquote` blocks per Wave 4
  conventions.
- **Byline:** None present; none emitted.

## Block counts

| kind       | count |
| ---------- | ----- |
| heading    | 1     |
| paragraph  | 29    |
| blockquote | 11    |
| **total**  | 41    |

EN counterpart totals: 1 / 28 / 12 = 41. Same total; 1-paragraph trade from the
merged final blockquote pair.

## Flagged blocks

- **`q033`** (`Esimene AA Rühm sündis selsamal päeval. (Bill D jätkab nüüd oma
  lugu.)`): confirmed as single paragraph in the ET source (starts at indent
  x=79.37 at y=292.08, wraps to x=68.03 at y=305.58; one mid-sentence full stop
  before the parenthetical closer). Differs from EN which splits the two
  clauses into separate `q033` + `q034` blockquote paragraphs. Preserved as
  typeset per ET fidelity principle.
- **`p040`** (ends p224): contains `"jätkata Ilmselt"` — the source reads
  `...mistõttu tahan käimist jätkata Ilmselt kõige imepärasem asi...` with a
  missing sentence-boundary full-stop between `jätkata` and `Ilmselt`. Source
  typo; preserved verbatim per the ET fidelity-over-correction convention.
  (Source also has a double-space `tänulik  programmi` between two words;
  collapsed by the line-join pass's `re.sub(r"[ \t]{2,}", " ", ...)` whitespace
  normalization. Noted here for transparency but not a fidelity concern —
  whitespace collapse is a baseline rule.)

## Schema proposals

None. The extraction fits cleanly within existing ET + parent conventions.
The size-band-transition rule (Wave 3 `arsti-arvamus`) handled the editorial
interlude cleanly without needing any new heuristic. The Wave 4 `blockquote`
kind and "emit one blockquote per in-deck paragraph" rule applied directly.

## Validation

- JSON parses.
- No stray U+00AD or NUL bytes.
- No leaked running-page-number digits mid-text.
- No trailing whitespace in any block.
- Drop-cap correctly merged (narrow-glyph wrap-zone handled).
