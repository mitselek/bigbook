# ch07-working-with-others — structured extraction report

## Summary

Chapter 7 "Working with Others" (PDF pages 110–124). Output: **49 blocks** — 1 heading + 48 paragraphs. No verse, no footnotes, no tables, no lists, no bylines. Pure advice prose with a drop-cap opener and a closing italic paragraph that remains inline with prose per conventions.

## Method

- `pymupdf.open(PDF)` then `page.get_text("dict")` per convention.
- Lines sorted by `(pdf_page, y0, x0)`.
- Running-header drop: `y0 < 50 AND (size <= 9.5 OR text.isdigit())` — catches both the 9pt running title ("WORKING WITH OTHERS" / "ALCOHOLICS ANONYMOUS") and the 12pt NewCaledonia-SC page-number digit that sits next to it at `y ~ 34`.
- Bottom-of-page page numbers: `text.isdigit() AND y0 > 525` (page 110 chapter-opener only — bottom page number at y ~ 538).
- "Chapter 7" italic label at size 12.5 on page 110: matched by regex + font-has-"Italic" and dropped.
- Paragraph-start indent detection: `body_margin + 8 <= x0 <= body_margin + 20`. Body margins auto-derived per page; even pages ≈ 55, odd pages ≈ 72.
- Cross-page paragraph merge: when the previous block's last line has `x1 >= 320` (near right margin) AND the next page's first line is at the body margin (not indented), merge.
- Em-dash line-end: do NOT insert a space when joining (per Wave 5 rule). The source chapter does not have cross-line em-dash joins (all em-dashes are mid-line in single-line form), so this rule is latent but correctly armed.
- Cross-line hyphen handling: compound-prefix allowlist (`self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`, `one-`…`ten-`); multi-hyphen compound regex `-[A-Za-z]+-$`; otherwise strip.
- Ligature normalization: `ﬁ/ﬂ/ﬀ/ﬃ/ﬄ/ﬅ` → `fi/fl/ff/ffi/ffl/st`. Soft hyphen and NUL stripped.
- No `pdfplumber` use — PyMuPDF `get_text("dict")` block info sufficed.

## Schema decisions

### Drop-cap

- Chapter-opener drop-cap `P` in ParkAvenue ~51.65pt on page 110, followed by small-caps tail `ractical experience shows that nothing will` at the wrap-around x ≈ 91. Merged as `P` + tail with no space → `Practical experience shows that nothing will...`. Case was already lowercase in PyMuPDF output (SC glyphs render as lowercase), so flattening was a no-op.
- The two wrap-around lines (y ≈ 140 and 155) at x ≈ 91 sit `body_margin + 36` past body margin 55, so they fall outside the paragraph-start indent zone (`+8..+20`). An explicit drop-cap-wrap rule (`pdf_page==110 AND y0<175 AND x0 > body_margin+30`) treats them as continuations instead of paragraph starts.

### Dialogue

The chapter contains rhetorical dialogue (p043): `"Have I any good social, business, or personal reason for going to this place? Or am I expecting to steal a little vicarious pleasure from the atmosphere of such places?"` — opening and closing curly quotes on a single paragraph. **Kept inside the surrounding `paragraph`** per conventions (dialogue is not verse or blockquote).

### Italicized closing paragraph

The last paragraph on page 124 (`After all, our problems were of our own making. Bottles were only a symbol. Besides, we have stopped fighting anybody or anything. We have to!`) is set entirely in NewCaledonia-Italic. **Kept as a regular `paragraph` block** — italics alone is not a split signal per Wave 1 precedent (Third-Step-Prayer handling).

### Heading

- `heading` block text: `"WORKING WITH OTHERS"` (visual rendering preserved).
- Section metadata `title` in JSON: `"Working with Others"` (prose-case, canonical).
- This is the documented intentional divergence.

### Blocks not found

- No verse candidates surfaced. No short, shared-x, blank-surrounded text runs.
- No footnotes (no `*` or `†` markers).
- No tables.
- No bylines (chapter, not a signed story).
- No lists (no numbered/lettered items, no hanging indents other than normal paragraph indents).
- No blockquotes (no editorial interludes, no smaller-font inset passages).

## Flagged blocks

- **`ch07-working-with-others-p030`** — contains `Non-sense.` where the source hyphenated at line-end: `Non-` (y=241) + `sense` (y=255). `non-` is in the compound-prefix allowlist, so the hyphen is preserved → `Non-sense`. This matches the authored hyphenation exactly (it reads as a compound, almost exclamatory: "*Non*-sense").
- **`ch07-working-with-others-p047`** — contains `witchburners`. Source line `witch-` (y=139 p124) + `burners`. `witch-` is not in the allowlist, so hyphen stripped → `witchburners`. Per the convention's current prefix allowlist this is the expected behavior (no genuine cross-line need for `witch-`). Flag: reader may prefer `witch-burners`. Conventions rule is exactly applied.

## Block-count summary

| kind      | count |
|-----------|-------|
| heading   | 1     |
| paragraph | 48    |
| **total** | **49**|

## Verdicts

- **Verse:** none. No candidates surfaced.
- **Drop-cap:** handled — `P` merged with the small-caps tail, no space, case preserved.
- **Footnote:** none.
- **Dialogue:** kept inline within surrounding `paragraph` (block p043) per conventions.

## Schema proposals

None. The existing conventions covered every observed case in this chapter.

## Uncertainties

- `witchburners` (p047) — see flagged blocks. Behavior matches convention; flagging for visibility.
- Cross-page merge heuristic worked cleanly here because every carry-over line is near the right margin (`x1 >= 320`). If a future section has a short last line on a carry-over, the rule would fail closed (not merge); that's fine.
