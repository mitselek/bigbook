# story-eitamise-joe-uletamine — extraction report

## Summary

Estonian translation of the Part III story "Crossing the River of Denial" (English counterpart: `story-crossing-the-river-of-denial`). Emitted **24 blocks**: 1 `heading` + 23 `paragraph` (italic deck + 22 body paragraphs), spanning PDF pages 360-369 (book pages 328-337). Block count exactly matches the EN counterpart (24), confirming cross-language structural parity. No list items, verses, footnotes, blockquotes, or bylines.

## Method

- PyMuPDF `page.get_text("dict")` → per-line spans with bbox/font/size.
- Sort `(pdf_page, y0, x0)` for reading order.
- Running-header drop: `y0 < 45 AND (size <= 11.5 OR text.isdigit())` (ET Wave 3 rule).
- Bottom-of-page page-number drop: pure-digit + `size <= 11.5 AND y0 > 520`.
- Story-number `(7)` drop on page 360 (y≈54.83, size=13).
- Ligature expansion (`fi`, `fl`, etc.); NUL strip; soft-hyphen preserved until join time.
- Drop-cap (`BrushScriptStd ~33pt`): single-letter `E` at `(x=54.69, y=145.72)` on p360; merged with first body line at `x≈83.53, y≈151.18` → `"Eitamine..."`.
- Italic deck detection: `NewCaledoniaLTStd-It` lines in y-range 90-135 on p360 → single `paragraph` block (3 wrapped lines).
- Heading detection: size 13.5-15.0 + text match `EITAMISE` ∧ `ÜLETAMINE` on p360.
- Paragraph start: `64.0 <= x0 < 78.0` (first-line indent ~68.03 vs body continuation ~56.69).
- Line-join rules (ET): U+00AD → strip + join no-space; U+002D at line-end → preserve + join no-space (ET compound-hyphen convention); U+2013/U+2212 → space-padded join preserved per context.

## Schema decisions

- **Story-number `(7)` dropped** per Wave 5 exemplar precedent (`story-mees-kes-seljatas-hirmu`). Decorative numbering, not authored content.
- **Italic deck** emitted as a single `paragraph` block (one-paragraph default per conventions). 3 wrapped lines, no multi-paragraph indent signal in deck.
- **Drop-cap merge** applied (`E` + `itamine on...` → `Eitamine on...`) with wide-glyph wrap zone `+30` offset from body margin (x ≈ 83.53 for wrapped body lines).
- **No byline**: story closes on p369 with `"...arvan, et proovin seda homme uuesti."` — narrative terminal, no sign-off.
- **No list items / verses / footnotes / blockquotes**: all body text is running prose.
- **ET curly quotes `„...”`** preserved verbatim (15 opening + 15 closing).
- **Mid-sentence minus `−`** (U+2212) with space-padding preserved in 2 places (e.g., p003 `„veel-id”... − „veel”`, p010 `kellega ma joon − kõik`).
- **En-dash `–`** preserved in 5 places (space-padded mid-sentence dashes).
- **Cross-line soft-hyphen joins** applied throughout (e.g., `segadusttekita­vam → segadusttekitavam`, `raseduse`, `kuueteist­aastaselt`, `kihlatud`, `arreteerimisele`, `politseiautosse`, `seitsmekümnendad`, etc.).
- **Authored U+002D intra-word hyphens preserved**: `tööta-õpi`, `60-aastane`, `rock n' rolli-i`, `police-autosse` joined to `politseiautosse` via soft-hyphen, `auto-telefon`, `AA-s`, `AA-d`, `AA-le`, `AAlased` (one compound without explicit hyphen in source).

## Flagged blocks

- **`story-eitamise-joe-uletamine-p006`**: contains the English phrase `"drugs & rock n' rolli-i"` italicised in source (`NewCaledoniaLTStd-It`). Kept inline within the surrounding paragraph per conventions (italics alone is not a split signal).
- **`story-eitamise-joe-uletamine-p009`**: `Ta oli 60-aastane.` — U+002D hyphen-minus preserved intra-line (not at line-break).
- **`story-eitamise-joe-uletamine-p020`**: the pseudo-dialogue `"Kui te olete otsustanud, et tahate ka endale seda, mis meil on..."` (quote from Big Book ch 5) kept inline in p017 as narrative content, not emitted as verse or blockquote — consistent with Wave 5 `our-southern-friend` discipline (quoted passages inside prose remain `paragraph`).
- **Paragraph boundary signals**: all 22 body paragraphs have clear first-line indents at `x0 ≈ 68.03`. Cross-page transitions all continued paragraphs (no page-start paragraph needed terminal-punctuation override).

## Schema proposals

None. ET conventions from Waves 1-4 (soft-hyphen mechanism, U+002D preservation at line-end, ET curly quotes, en-dash/minus space-padding, 11pt running-header at y<45) covered this section cleanly. The Wave 5 exemplar script template was directly applicable.
