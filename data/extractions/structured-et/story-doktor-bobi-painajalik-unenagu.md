# story-doktor-bobi-painajalik-unenagu

Wave 2 Estonian per-section extraction.

## Summary

Extracted the first personal story of Part I (Pioneers of AA / "AA Teerajajad"),
the Estonian counterpart of "Dr. Bob's Nightmare". Pages 203–213 in the PDF,
book pages 171–181. Emitted **39 blocks** total:

- 1 heading
- 34 paragraphs
- 4 list-items
- 0 bylines, 0 verses, 0 footnotes, 0 blockquotes

The EN counterpart emits 39 blocks with the same kind distribution, so ET
matches EN exactly on block-structure granularity.

## Method

Single-pass PyMuPDF `get_text("dict")` over pages 203..213 (1-indexed). Lines
were sorted by `(pdf_page, y0, x0)` for reading-order. Running headers/page
numbers dropped with the ET-refined rule `y0 < 50 AND (size <= 11.5 OR pure
digits)`; bottom page numbers dropped with `text.isdigit() AND size <= 11.5 AND
y0 > 520`.

ET soft-hyphen (U+00AD) handling uses the Wave 1 join-time rule: strip the soft
hyphen when joining prev+curr, no space inserted. No U+002D cross-line splits
observed in this section.

Paragraph-start detection: `x0 >= 64.0` (body margin ~56.7, first-line indent
~68.0).

Drop-cap merge: 'S' (BrushScriptStd, size 33, at x=56.7 y=229) merged with the
first body line 'ündisin väikeses...' at (x=83, y=233.7) to form 'Sündisin
väikeses...'. Drop-cap wrap-zone: y ∈ [229, 262] stays in the first paragraph
regardless of x0 (handles the ~2 wrap-indent lines at x=83).

Italic-deck split: the 10 italic lines on p203 (y=78..223) grouped into 3
paragraphs by first-line indent (x0 ≈ 68).

List-item detection: page 212, lines with `x0 ∈ [75, 80]` matching
`^\d+\.\s+` → list-item starts. Continuation lines at `x0 ∈ [90, 96]` merged
into the same list-item. Items 3 and 4 had one continuation line each.

## Schema decisions

1. **Heading visual form**: `DOKTOR BOBI PAINAJALIK UNENÄGU` — preserved the
   PDF's visual all-caps rendering. The Estonian source does NOT abbreviate
   "Doktor" to "Dr.", so there's no expansion needed (unlike the EN counterpart
   where `Dr. Bob's Nightmare` → `DOCTOR BOB'S NIGHTMARE`). The heading's
   all-caps glyph is `NEWCALEDONIALTSTD` 14pt at y=48. Estonian diacritic
   `Ä` preserved correctly.

2. **parentGroup**: `personal-stories/pioneers-of-aa` preserved from section
   metadata. First story under the Pioneers of AA group.

3. **Italic deck → 3 paragraphs**: the italic descriptive deck (pg 203 y=78..223)
   shows clear first-line indents at y=78, y=121, y=179 (x0=68) separated by
   body-margin lines (x0=56.7). Per Wave-3 convention ("italic deck with
   multiple clear first-line indents → one paragraph per indent group"), emit
   as 3 separate paragraphs. EN counterpart also emits 3 deck paragraphs
   (`p002`, `p003`, `p004`).

4. **Drop-cap**: BrushScriptStd 33pt 'S', merged with first body line to form
   `Sündisin`. The body first line's x0=83 (wrap-indent past the drop-cap),
   subsequent 2 lines also at x=83, then body returns to x=56.7 at y=262. Wrap
   window y ∈ [229, 262] — within this window, paragraph-start detection is
   suppressed.

5. **No byline**: neither the EN nor ET version of this Doctor Bob story has an
   author sign-off. The story ends with the climactic sentence "Sinu Taevane
   Isa ei vea sind iial alt!" ("Your Heavenly Father will never let you down!")
   as the final paragraph block (`p039`).

6. **No footnotes, verses, or blockquotes** observed in this section.

7. **List-items**: 4 numbered items. Text emitted with the numeric marker
   preserved (`1. Kohusetundest.`). The internal `\t` between marker and text
   is flattened to a single space via the `raw.replace("\t", " ")` +
   `collapse-double-space` pass.

## Flagged blocks

**None flagged as uncertain.** A few items to document:

- **`p020`** is very long (~1500 chars). This is correct: it covers Doctor
  Bob's "phobias" paragraph that spans the full bottom of p207 into the top of
  p208 (17-line stretch) until the indent-marker at "Kui mu naine kavatses"
  (p021) — same paragraph-shape as EN's `p020` (which is also ~1500 chars).

- **`p030`** contains an inline italic run on p212 (y=92..136: `olu, et tema
  oli esimene inimene, kes teadis oma isikliku / kogemuse põhjal täpselt, mida
  ta alkoholismi kohta ütles. / Teiste sõnadega – ta kõneles minu keeles. Tema
  teadis`). Per conventions, inline italics within a paragraph are kept inline,
  so this is correctly one paragraph block.

## Dash verification

All mid-sentence dashes in this section are U+2013 EN-DASH, space-padded:

- `p002`: "pideva kainuse esimene päev – 10. juuni 1935."
- `p023`: "üks kohutav painajalik unenägu – kogu see rahateenimine…"
- `p025`: "Veelgi enam – nad tundusid…"
- `p030`: "ehk teisisõnu – vaimse lähenemise kaudu"

No U+2014 em-dashes, no U+00AD soft hyphens, no U+2212 minus signs leaked into
output.

## Running-header drop audit

No `ANONÜÜMSED ALKOHOOLIKUD` (even-page) or `DOKTOR BOBI PAINAJALIK UNENÄGU`
(odd-page) running-header text leaked into body blocks. Both surface at size
11.0 at y=35, well inside the `y0 < 50 AND size <= 11.5` drop gate.

No page numbers (171..181) leaked into body blocks.

## Schema proposals

**None.** Existing ET Wave 1 conventions + EN baseline covered this section
cleanly. The drop-cap layout, en-dash punctuation, running-header gate, and
soft-hyphen join rules all behaved exactly as documented.

One minor confirmation: the rule "no byline expected for this story" matches
both the EN counterpart's absence of a byline and the ET PDF's absence of a
sign-off. This is not a new proposal — it's consistent with the principle that
byline presence is section-dependent, not a structural requirement.
