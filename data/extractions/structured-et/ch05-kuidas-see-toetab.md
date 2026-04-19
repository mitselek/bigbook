# ch05-kuidas-see-toetab — extraction report

## Summary

Estonian chapter 5 "Kuidas see töötab" (How It Works), PDF pages 90–103, book pages 58–71. Emitted **61 blocks** total: 1 heading, 44 paragraphs, 15 list-items (12 Twelve-Steps + 3 (a)(b)(c) sub-list), 1 table. Structural parity with EN counterpart (`ch05-how-it-works.json`, 61 blocks). No footnotes in this chapter. No verse. Extraction was clean — no ambiguous cases required judgment.

This is a fresh re-run (cross-run repeatability test). I did not consult `data/extractions/structured-et/backup-wave-1-2/`.

## Method

- **Library:** PyMuPDF, `page.get_text("dict")`. No pdfplumber.
- **Script:** `.tmp/extract-ch05-kuidas-see-toetab-rerun.py`.
- **Probe:** `.tmp/ch05-et-rerun-probe.txt` (532 lines, all pages dumped with font/size/bbox).

### Heuristics fired

- ET running-header drop (`y0 < 45 AND (size <= 11.5 OR isdigit)`) removed "KUIDAS SEE TÖÖTAB" on pp93,95,97,99,101,103 and "ANONÜÜMSED ALKOHOOLIKUD" on pp92,94,96,98,100,102. Page 91's running header renders as "KUIDAS SEE TOIMIB" (different word — source quirk); dropped identically.
- Bottom-of-page number drop (`y0 > 520 AND size <= 11.5 AND isdigit`) removed `58` on page 90 (first page, centered at y=530).
- Chapter-label drop for "5. peatükk" at size 12.5 italic on page 90 y=54.
- Drop-cap "O" BrushScriptStd 33pt on page 90 merged with first body line `leme harva näinud...` → `Oleme harva näinud...` (no space). No small-caps tail in ET.
- Drop-cap wrap-zone: 2 wrap-lines at x=79.45 (y=107, 121) folded into paragraph 1; body resumes at x=56.69 on y=136.
- Soft-hyphen join: all cross-line word splits encoded via U+00AD SOFT HYPHEN; stripped at join time. ~70+ instances across the chapter.
- En-dash / minus-sign preserved with surrounding spaces per ET convention (e.g. `"See pole nende süü – näib..."`, `"alkoholi ees − et meie elud..."`).
- Estonian curly quotes `„"` preserved throughout (p020: `„Küll on kord!"`, p033 Third-Step Prayer, etc.).

### Paragraph / list detection

- Paragraph-start: `x0` between ~65 and ~75 at body size.
- List-item (Twelve Steps): `^\d{1,2}\.\s` at line-start with `x0 ≈ 65.2`. Continuation lines at `x0 ≈ 82.2` merged into same list-item.
- Sub-list (a)(b)(c): `^\([a-z]\)\s` at line-start with `x0 ≈ 70.87`. Continuation at `x0 ≈ 92.69`.

### Table detection (page 97, resentment inventory)

Three columns at `x0 ≈ 56.69, 116.67, 244.21`, spanning `y=170..510`. Each PDF "line" in the table's y-band was bucketed into its column by `|x0 - COL_X| <= 10`. Lines sharing `|Δy| ≤ 5` collapsed into a single row. Emitted 25 rows matching PDF line-layout — same per-line row granularity as the EN exemplar's resentment table (23 rows in EN; ET has +2 because Estonian phrasing wraps slightly differently across cells). Serialized to `text` with ` | ` between cells and `\n` between rows; also preserved structured `rows: string[][]`.

## Schema decisions

- **Drop-cap merge:** `O` (font `BrushScriptStd`, size 33) + body continuation `leme harva näinud…` → `Oleme harva näinud…`. No space inserted (ET convention — no small-caps tail).
- **Twelve Steps as 12 list-items:** per spec + EN exemplar. Item text retains the leading `N.` marker for cross-reference.
- **(a)(b)(c) as 3 list-items:** per spec + EN exemplar. Marker kept at start of text.
- **Third Step Prayer** (p033 "„Jumal, ma annan end Sulle…") **kept inline** with surrounding paragraph per EN precedent (italic pull-quote alone is not sufficient split signal). The Estonian translation here doesn't actually render in italic in this PDF — it's body-style inside plain quotes, so the decision is even cleaner than in EN.
- **Table as `kind: table`** with both `text` (pipe-serialized) and `rows` (2-d array). 25 rows including the header. Column-1 header "Kannan vimma:" wraps onto two lines in the source and appears as rows[0..1] in the structured output — same per-line pattern as the EN output's split `"I'm resentful at:"` header.
- **Italic "Neljas Samm."** mid-prose on page 96 (line at y=150 x=56.69) detected as body-margin continuation of the preceding paragraph, NOT a paragraph-start. Kept inline with p036 (the italic phrase is a mid-sentence stylistic emphasis, not a structural heading).

## Flagged blocks

None with serious doubt. Noted items:

- **`ch05-kuidas-see-toetab-p033`** (page 95, Third Step Prayer): the prayer opens with an ASCII-quote-ish mix (`:"Jumal, ma annan...` is actually `:"` where the closing-quote code U+201D is used as opening — matches a known ET source-quirk pattern seen in `arsti-arvamus`. Preserved verbatim. The closing quote is correct `"` at `igavesti!"`.
- **Table cell row 22** (`['Oma', 'Ei mõista mind ja', 'Eneseuhkust,']`) and row 23 (`['naise', 'näägutab.', 'isiklikke sek']`): column-3 cell row 23 shows `'isiklikke sek'` — that's because the source renders the word as `isiklikke sek-` (soft hyphen) on that line and `suaalsuhteid,` on the next row. Per the per-line row policy (matching EN), the soft-hyphen-split word appears across two rows. This is acceptable fidelity-to-source; merging cell continuations is deferred in EN too (documented in Wave 7 "Table multi-line cell reassembly" deferred).
- **Page 91 running header variant** "KUIDAS SEE TOIMIB" vs rest "KUIDAS SEE TÖÖTAB": source typesetter quirk; both dropped identically (no content change). Noted as a source-quirk-to-preserve if ever kept, but running headers are always dropped.

## Schema proposals

None. All rules in the parent + ET-companion conventions applied cleanly. No new heuristic or schema extension needed.

## Verdicts (requested)

- **Twelve Steps verdict:** 12 list-items emitted (`l008`–`l019`), each preserving the `N.` marker. Step 12 correctly straddles the page 91/92 boundary (continuation lines at x=82.20 on page 92 y=48..92 merged into `l019`). ✅
- **(a)(b)(c) verdict:** 3 list-items emitted (`l022`–`l024`), markers preserved. ✅
- **Table verdict:** 1 `kind: table` block emitted (`t041`), 3 columns, 25 rows (vs 23 in EN — small delta due to Estonian line-wrap differences, not missing content). Both `text` and `rows` populated. ✅
- **Drop-cap verdict:** Drop-cap `O` (BrushScriptStd, 33pt) correctly merged with body remainder `leme` → `Oleme` at start of `p002`. Drop-cap wrap-lines at x=79 folded into paragraph 1. ✅
