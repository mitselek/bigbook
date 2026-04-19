# ch11-tulevikupilt-teie-jaoks — extraction report

## Summary

Estonian structural extraction of chapter 11, **"Tulevikupilt teie jaoks"**
(A Vision For You) — the closing chapter of Part I. PDF pages **183–196**
(book pages 151–164) after the outline boundary-fix. Emitted **63 blocks**:
1 heading, 57 paragraphs, 5 footnotes. Zero verse, zero list-item, zero
blockquote, zero byline, zero table. Near-exact block-count parity with the
EN counterpart `ch11-a-vision-for-you` (62 blocks — ET is +1 paragraph due
to translator-introduced paragraph splits that net to +1 across the chapter).

**Outline boundary fix applied:** the earlier extraction used pdfPageEnd=202
which pulled in 6 pages (197–202) of Part I opener / transitional material
that does not belong to ch11. The corrected outline has pdfPageEnd=196.
This run honors the fix. No content from pages 197+ appears in the output.

## Method

- PyMuPDF `page.get_text("dict")` for per-line spans (font, size, bbox).
- Running-header drop gate: **`y0 < 45 AND (size <= 11.5 OR text.isdigit())`**
  — tightened per Wave 3 ET convention (was `y0 < 50` in the pre-boundary-fix
  script; the Wave 3 fix applies here too).
- Bottom-of-page page-number drop: `y0 > 520 AND size <= 11.5 AND digit`
  (catches the `151` at page-bottom on opening page 183).
- Chapter label drop: regex `^\d+\.\s*peatükk\s*$` on italic 12.5pt → removes
  `11. peatükk` on page 183.
- Heading detection: `size in [13.0, 15.0] AND text.upper().startswith("TULEVIKUPILT")`
  on page 183 at y≈70.
- Drop-cap: BrushScriptStd `E` at 33pt on page 183, merged with first body
  line `namiku normaalsete inimeste jaoks…` → `Enamiku…`. Wrap-indent body
  line (y=136.5, x=84.8) kept in the same paragraph.
- Paragraph-start detector: `x0 in [64.0, 80.0]` (body margin 56.7; first-line
  indent ≈ 68).
- Cross-page continuation: first line on a new page at body margin (no indent)
  appends to the open paragraph.
- ET paragraph-line join rules (from companion conventions):
  - U+00AD soft hyphen → strip + join no-space (ET's sole cross-line
    hyphenation mechanism; verified clean throughout this chapter).
  - U+002D at line-end → preserve + no-space join (Wave 4 ET rule for
    authored compound hyphens like `Võib-olla`, `Aeg-ajalt`).
  - U+2013 / U+2212 (en-dash / minus) → preserve + join with leading
    space if the raw line had a trailing space before the dash (space-padded
    Estonian mid-sentence dash convention).
  - Em-dash (U+2014) at line-end or line-start → join without space.
- Footnote detection: `size <= 10.5 AND y0 > 500`, grouped per page. All 5
  footnotes start with `*` marker in the emitted text (synthesized prepend
  for page 194 where the marker is authored on the body line, not on the
  footnote text itself — per conventions, preserve the `*` cross-reference).

## Schema decisions

- **Heading text `"TULEVIKUPILT TEIE JAOKS"`** (uppercase, as visually
  rendered). Metadata `title` stays prose-case (`"Tulevikupilt teie jaoks"`).
- **Drop-cap `E` merged** into `Enamiku`, no space. No small-caps tail
  (ET drop-caps don't have one per ET conventions).
- **5 footnotes, 1:1 with EN**:
  - `f022` p187 — `*Siin viidatakse Billi esimesele külaskäigule…`
  - `f029` p188 — `*Siin viidatakse Billi ja doktor Bobi…`
  - `f050` p193 — `*Kirja pandud 1939. aastal.` (size-8 footnote)
  - `f055` p194 — `*Kirja pandud 1939. aastal. Aastaks 2017…` (marker
    prepended — source footnote text lacks the `*` at start; preserved
    per conventions to maintain cross-reference contract)
  - `f060` p195 — `* Anonüümsetel Alkohoolikutel on hea meel…`
- **Authored compound hyphens preserved**: `Võib-olla`, `Aeg-ajalt`,
  `alkoholismi- ja narkomaaniaraviga` (suspended-hyphen construction —
  the hyphen-plus-space is the authored orthography, not a cross-line
  join artifact; the hyphen means `alkoholismi-[ravi] ja narkomaaniaravi`).
- **Em-dash / en-dash discipline**: en-dash with space-padding preserved in
  `Jumal õnnistagu ja hoidku teid – kuni selle ajani!` (closing sentence of
  the chapter).
- **Block-count parity with EN** is ±1 (ET 63 vs EN 62). The delta is
  distributed: ET is +1 on pp183, 187, 188, 194; −1 on pp189, 192, 196;
  net +1. These are translator-introduced paragraph-boundary shifts, not
  structural splits. No hanging indent or dialogue was misread as a new
  paragraph.

## Flagged blocks

None blocking. Notes:

- **`p049`** contains `alkoholismi- ja narkomaaniaraviga` — suspended-hyphen
  Estonian orthography. **Not a join bug**; the space after `-` is authored.
  Verified against source PDF page 192 (book page 160).
- **`f055`** marker was synthesized (prepended `*`) because the source
  footnote line starts `Kirja pandud 1939.` with no asterisk; the body
  reference on p194 body text does carry the `*`. Per conventions, the
  footnote text must begin with `*` for cross-reference integrity.

## Flagged concepts (verdicts requested in report)

- **Verse verdict**: 0 blocks. Chapter is dialogue-driven prose; no verse
  candidates appeared. Matches EN ch11 (also 0 verse).
- **Footnote count**: 5 (matches EN ch11 exactly, 1:1 on page of origin).
- **Drop-cap verdict**: BrushScriptStd `E` at 33pt on page 183, merged
  cleanly with `namiku…` → `Enamiku normaalsete inimeste jaoks…`. No
  small-caps tail to flatten (per ET conventions).

## Schema proposals

None from this section. The ET and EN conventions cover ch11 cleanly. The
boundary-fix exercise highlights the value of outline audits — the
transitional pages 197–202 were originally attached to ch11 by the outline,
but semantically belong to the Part I opener / Part II entry, which now
has its own section allocation.

## Block-count comparison with EN

- EN `ch11-a-vision-for-you`: 62 blocks (1 heading, 56 paragraphs, 5 footnotes)
- ET `ch11-tulevikupilt-teie-jaoks`: 63 blocks (1 heading, 57 paragraphs, 5 footnotes)
- Delta: +1 paragraph, net of ±1 per-page distribution. Strong structural
  alignment confirmed.
