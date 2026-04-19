# story-arst-ravi-iseennast — extraction report

## Summary

Estonian "Arst, ravi iseennast!" (English counterpart: "Physician, Heal Thyself!", story #4 in "They Stopped in Time"). PDF pages 333–340 (book pages 301–308). Emitted **24 blocks**: 1 heading + 1 italic-deck paragraph + 22 body paragraphs. Block-count parity with the EN exemplar (`story-physician-heal-thyself` = 24 blocks). No bylines, no list items, no verses, no footnotes, no blockquotes. Clean extraction; no unresolved warnings.

## Method

- **Library**: PyMuPDF (`pymupdf`) only. Single pass `page.get_text("dict")` over pages 333–340.
- **Reading order**: lines sorted by `(pdf_page, y0, x0)`.
- **Heuristics fired**:
  - ET running-header drop (`y0 < 45` AND (`size <= 11.5` OR digits)) — removed the 11pt `ANONÜÜMSED ALKOHOOLIKUD` and `ARST, AITA ISEENNAST!` top-of-page running headers and the `302`/`304`/`306`/`308` top page-numbers.
  - Story-number `(4)` drop on page 333 (y≈53.83, size 13).
  - Bottom-of-page numeric footer drop — page 333 `301` at y≈530 was dropped; pages 334–340 had no bottom numbers.
  - Heading detection on page 333 (NewCaledoniaLTStd, size 14, x≈114): `ARST, RAVI ISEENNAST!`.
  - Italic deck detection (NewCaledoniaLTStd-It, y 98–127, 3 wrapped lines) → single `paragraph` block.
  - Drop-cap detection: `O` in BrushScriptStd at 33pt, page 333, x≈56.69, y≈146 → merged with body line `len arst...` starting at x≈83.45 → `Olen arst...`.
  - Drop-cap wrap-zone (band y 145–175, x 78–95) kept the second wrap-around line (`Olen ka alkohoolik...` at y=164.68 x=83.45) inside the first body paragraph rather than triggering a new paragraph-start.
  - Paragraph-start indent detection at `64 <= x0 < 80` (`x=68.03` in this section).
  - Soft-hyphen (U+00AD) cross-line join — 30+ occurrences stripped and joined without space at merge time (per ET Wave 1 convention).
- **No special PyMuPDF APIs beyond `get_text("dict")`**. No `pdfplumber` needed.

## Schema decisions

1. **Italic deck**: 3 italic lines (`Elukutselt psühhiaater ja kirurg...` / `kuni ta ükskord mõistis...` / `tema, vaid Jumal.`) joined into a single `paragraph` block — all at uniform indent, no multi-paragraph structural hint, matching the ET pilot default and the EN exemplar.
2. **Drop-cap merge**: ET-standard pattern — single-letter BrushScriptStd glyph joined directly to the next body line's text with no space. `O` + `len arst ja oman tegevusluba...` → `Olen arst...`.
3. **Story number `(4)`**: dropped entirely (per ET/EN convention — decorative structural numbering, not authored content).
4. **Heading text `ARST, RAVI ISEENNAST!`**: emits the page's actual heading (size-14 line on p333). Note that the running header on odd pages reads `ARST, AITA ISEENNAST!` (different verb — `aita` = "help" vs `ravi` = "heal/cure"). This is a **source quirk** in the Estonian edition — the running header and the section title use different translations of the English imperative "Heal". Running header is dropped by the size/y-gate; heading text preserves the title-page form verbatim.
5. **Inline italic spans inside body**: page 336 y=77.91 has a short italic span `Sammu ja Kaksteist Traditsiooni” haigla kappi, soetasin` — this is the ET book title `„Kaksteist Sammu ja Kaksteist Traditsiooni”` appearing mid-paragraph. Kept inline inside the surrounding paragraph per convention (italics alone is not a split signal).
6. **Superscript fraction `5 1/2`** on page 337: PyMuPDF emitted the entire line (size-12.52 prefix + size-7 digit `1` + size-11 `/` + size-7 digit `2` + size-12.52 suffix) as a single `line` with a merged bbox. Text concatenation across spans yielded `Kulutasin psühhoanalüüsi seanssidele 51/2 aastat, kuid` — no separate post-pass needed. EN exemplar uses `5 1⁄2` (with U+2044 FRACTION SLASH); the ET PDF uses plain ASCII `/` with superscript sizing, so the extracted text reads `51/2` (no space between `5` and `1`). This is faithful to the ET source.
7. **Cross-page paragraph merges**: all seven page transitions (333→334, 334→335, 335→336, 336→337, 337→338, 338→339, 339→340) were mid-paragraph. All continuation lines on the new page start at body margin x=56.69 (no first-line indent), and paragraph-start detection at `x >= 64` correctly treats them as continuations.
8. **Source quirks preserved**:
   - Running-header translation divergence (`AITA` vs `RAVI`) — header dropped, title preserved.
   - `Nevada City’st` — curly right single quote (U+2019) used as apostrophe for Estonian case ending. Preserved as-is.
   - `lauauks` (page 340, y=164.91) — likely typo for `lausuks` ("would say"). Preserved verbatim.
   - `ARST, AITA ISEENNAST!` running header itself — not emitted (correctly dropped); noted here for archival record.

## Flagged blocks

- **`story-arst-ravi-iseennast-p015`** — contains `51/2 aastat` (two pages earlier EN uses `5 1⁄2`). This is the ET rendering with superscript-sized digits and ASCII slash, pre-joined by PyMuPDF. Faithful to source; no conventions-level issue, but flagged because a superscript-fraction reader would expect `5 1⁄2`. Decision: preserve as PyMuPDF delivers it.
- **`story-arst-ravi-iseennast-p023`** — contains `Psühhiaater lauauks arvatavasti` on page 340. `lauauks` is almost certainly a typo for `lausuks` ("would say"). Preserved verbatim per the fidelity-over-correction rule.

## Schema proposals

None. The section was a clean fit for the existing ET conventions:

- Soft-hyphen cross-line join (ET Wave 1) handled all 30+ word splits.
- ET running-header gate (`y0 < 45` AND `size <= 11.5` OR digits) caught all header/page-number artifacts cleanly.
- ET drop-cap pattern (BrushScriptStd ≥ 20pt, no small-caps tail) matched the page-333 `O` drop-cap.
- Story-number drop and title-vs-heading divergence followed existing precedent.

Block-count parity with EN (24 blocks each) reinforces the conclusion that the ET edition follows the same paragraph structure as the EN source for this story, with no structural deviations.
