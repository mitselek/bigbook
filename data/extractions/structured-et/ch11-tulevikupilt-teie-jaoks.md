# ch11-tulevikupilt-teie-jaoks extraction report

## Summary

Extracted the Estonian final chapter of Part I, "Tulevikupilt teie jaoks" (A
Vision For You), PDF pages 183-202 (book pages 151-170). Total **77 blocks**:
1 chapter heading + 5 part-opener headings + 66 paragraphs + 5 footnotes.
**Zero verse**, as expected. Body-only counts (pp183-196) are **1 heading +
57 paragraphs + 5 footnotes = 63 blocks**, closely matching the EN counterpart
(ch11-a-vision-for-you: 1 + 56 + 5 = 62). The `+1` paragraph delta is a
translation-level split, not an extraction bug.

## Method

PyMuPDF `page.get_text("dict")` only. No `pdfplumber` needed.

Heuristics applied:

- **ET running-header drop**: `y0 < 50 AND (size <= 11.5 OR text.isdigit())`.
  Catches "ANONÜÜMSED ALKOHOOLIKUD" (even) / "TULEVIKUPILT TEIE JAOKS" (odd)
  at size 11.0.
- **Bottom page-number drop** on p183: `y0 > 520 AND size <= 11.5 AND
  text.isdigit()` catches the `151` at the foot.
- **Chapter label drop**: `11. peatükk` at italic 12.5pt on p183 dropped.
- **Drop-cap merge**: 'E' (BrushScriptStd 33pt) on p183 + first body line at
  `x≈84.8 y≈122.0` ("namiku normaalsete inimeste…") → "Enamiku normaalsete…".
  Drop-cap wrap-zone extends to `y <= 150` (second wrap line at y=136.5 also
  at x=84.8).
- **Paragraph-start**: `64 <= x0 <= 80` (body margin 56.7, first-line indent 68.0).
- **Cross-page paragraph merge**: first line on a new page is a continuation
  when it is NOT indented (x0 < 64). Verified p059 spanning pp195-196.
- **Footnote detection**: small font (`size <= 10.5`) with `y0 > 500`. Grouped
  per-page, inserted after the last body paragraph of the same page.
- **Part-opener headings** (pp197, 199, 201): `size >= 13.5` at non-body x;
  consecutive heading lines within 30pt vertical distance merged into one
  heading block (joined with " ").

## Schema decisions

1. **Drop-cap flattening** — no small-caps tail in ET; single-glyph 'E' +
   immediate body text → merged with no space. First word rendered "Enamiku"
   (the small lead-in is preserved as authored).
2. **Footnote `*` marker preservation** — p187/p188/p193/p195 footnotes have
   the `*` inline at line-start (preserved verbatim). **p194 footnote is
   atypical: the source omits the `*` marker on the footnote text itself**
   (the marker `*` appears only in body text). Per conventions ("Preserve the
   marker as the first character of the footnote text so it cross-references
   the paragraph it annotates"), I prepended `*` to the p194 footnote body so
   the cross-reference is recoverable. Output:
   `"*Kirja pandud 1939. aastal. Aastaks 2017…"`.
3. **Part-opener heading merging** — applied the appendix rule ("roman numeral
   on line 1 + title on line 2 → merge with space") to the `N. osa / TITLE`
   pairs on pp199 and p201. Output: `"1. osa AA TEERAJAJAD"`,
   `"2. osa NAD LÕPETASID AEGSASTI"`, `"3. osa NAD KAOTASID PEAAEGU KÕIK"`.
4. **Italic decks as paragraphs** — the 13pt italic deck on p197 ("Kuidas
   nelikümmend kaks alkohoolikut / tervenesid oma tõvest") emitted as a single
   `paragraph` block joining both lines. Same rule applied to the 12.5pt intro
   sentences below each part heading on pp199/201.
5. **Zero verse** — no centered short-line tombstone-style quotations in this
   chapter. Dialogue kept in surrounding paragraphs per convention.
6. **Zero blockquote / verse / byline / table / list-item** — none present
   in this chapter.

## Flagged blocks

- **`ch11-tulevikupilt-teie-jaoks-p062`** (p196) contains the source-level
  duplication `"… Me oleme teiega Vaimses Sõpruskonnas Me ühineme teiega
  Vaimses Sõpruskonnas ja te kohtute kindlasti…"`. The Estonian PDF literally
  prints this repeated clause (layout bug / translation artifact). Per ET
  fidelity-over-correction rule, preserved verbatim.
- **`ch11-tulevikupilt-teie-jaoks-f055`** (p194) — footnote marker absent in
  source (see Schema decision 2); `*` prepended at emit time.
- **`ch11-tulevikupilt-teie-jaoks-f050`** (p193) — single-line footnote at
  **size 8.0** (unusual; other footnotes are size 10). The `size <= 10.5`
  gate captured it correctly; no special handling needed.
- **`ch11-tulevikupilt-teie-jaoks-h073`** (p201) — duplicates
  `"1. osa AA TEERAJAJAD"` from p199 (h067). This is intentional: p199 is the
  TOC overview of all three parts; p201 is the actual opener for Part I. Both
  emit as headings to preserve document structure.

## Schema proposals

None. All observed patterns already covered by existing EN + ET conventions:

- Multi-line heading merge (appendix roman-numeral rule, Wave 3) applied to
  `N. osa / TITLE`.
- Italic deck → paragraph (Wave 3 Dr-Bob precedent) applied to the p197 deck.
- Footnote `*` preservation rule covers the unusual p194 missing-marker case
  as a defensible interpretation.

## Notable ET-specific behavior

- All 30+ cross-line hyphenations used U+00AD soft hyphen (per ET Wave 1
  finding). No U+002D hyphen splits at line-end observed in body.
- Intra-line real hyphens in Estonian compounds preserved: `alkoholismi- ja
  narkomaaniaraviga`, `edasi-tagasi`, `õlg õla`.
- Estonian curly quotes `„…”` preserved throughout dialogue.
- Final benediction emitted as a single paragraph:
  `"Jumal õnnistagu ja hoidku teid – kuni selle ajani!"` (en-dash with padded
  spaces per ET rule).
