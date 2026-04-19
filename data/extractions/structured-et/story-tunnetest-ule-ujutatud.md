# story-tunnetest-ule-ujutatud — extraction report

## Summary

Estonian personal story, PDF pages 401–406 (book pages 369–374). One heading + 25 paragraphs = **26 blocks total**. No bylines, list-items, footnotes, verses, blockquotes, or tables. Section is straightforward narrative prose with a story-number, italic deck, drop-cap, and five body-paragraph cross-page transitions (two new-paragraph starts, three continuation merges). No extraction anomalies.

## Method

- `pymupdf.open()` + `page.get_text("dict")` per page.
- Sort lines by `(pdf_page, y0, x0)`.
- Drop rules applied:
  - Running headers at `y0 < 45` AND (`size ≤ 11.5` OR pure digits). Catches the 11pt `ANONÜÜMSED ALKOHOOLIKUD` (even pages) / `TUNNETEST ÜHE UJUTATUD` (odd pages) + 11pt page numbers at `y = 34.99`.
  - Bottom-of-page numeric footer `369` at `y ≈ 530.79` on page 401 (`y > 520 AND size ≤ 11.5 AND digits`). Page 401 is the story opener — it has no running header but does have a bottom page-number.
  - Story-number `(11)` at `y ≈ 108` on page 401 (via `STORY_NUMBER_RE`). Dropped per ET conventions (decorative, not authored).
- Heading detection: page 401, size ∈ [13.5, 15.0], contains `TUNNETEST` + `UJUTATUD`. Matched at `y = 127.44, x = 94.99, size = 14.0`.
- Italic deck detection: page 401, font contains `-It`, y ∈ [145, 190]. Three lines at `y ≈ 152 / 167 / 181` → single paragraph.
- Drop-cap detection: page 401, font contains `BrushScript`, size ≥ 20. Matched `E` at `y = 200.86, x = 54.69, size = 33`.
- Drop-cap merge: first body line at `y = 204.71, x = 83.53` (`smakordselt AA-sse jõudes…`) → `E` + `smakordselt` → `Esmakordselt`.
- Drop-cap wrap-zone: `y ∈ [200, 235]`, `x ∈ [80, 95]` (two body lines continue alongside the drop-cap glyph).
- Paragraph boundary: `is_paragraph_start` = `64.0 ≤ x0 < 80.0` (body-column indent ≈ 68.03 vs continuation ≈ 56.69).
- Line-join rules (ET): strip soft hyphens at join time; preserve line-end `-` (authored compound fallback); en-dash/minus join rules per ET conventions.

## Schema decisions

- **Heading renders `TUNNETEST ÜHE UJUTATUD`** but the metadata `title` is `Tunnetest üle ujutatud`. Per ET conventions (section "Text quirks to preserve verbatim"), emit exactly what the source renders — `ÜHE` not `ÜLE`. This is either an OCR/typesetter artifact or a deliberate rendering divergence; fidelity-to-source wins. The section-title metadata stays unchanged because it's the canonical prose-case form handed to the agent. Downstream consumers have both values.
- **Italic deck as single paragraph.** The 3 italic lines form one sentence: `Kui tamm tema ja Jumala vahelt minema uhuti, jõudis see end agnostikuks nimetav inimene Kolmanda Sammuni.` No multiple indented groups → default rule (one paragraph).
- **Story-number `(11)` dropped** — not emitted as a block (decorative numbering).
- **No byline.** The story ends with `Ma tulen ikka tagasi, sest see toimib.` as a plain body paragraph at indent x=68.03. No sign-off pattern, no italic, no author attribution.
- **Cross-page paragraph merges** (5 page boundaries, 3 continuations + 2 new paragraphs):
  - p401 → p402: NEW (p401 ends `Sain auto napilt enne kokkupõrget pidama.`; p402 starts at x=68.03).
  - p402 → p403: MERGE (p402 ends mid-sentence on `Seitsme`; p403 starts at x=56.69 continuation `kuu pärast…`).
  - p403 → p404: MERGE (p403 ends `Hiljem küsis mu sõber,`; p404 starts at x=56.69 continuation `mida ma…`).
  - p404 → p405: NEW (p404 ends `puhkesin alati uuesti jooma.`; p405 starts at x=68.03).
  - p405 → p406: MERGE (p405 ends mid-sentence on `kahtlemine`; p406 starts at x=56.69 continuation `ei olnud…`).
- **Authored hyphens preserved**: `AA-sse`, `AA-s`, `poiss-sõbra`, `Aeg-ajalt`. No soft hyphens leaked into output.
- **Curly quotes preserved**: 6 × `„` (U+201E), 6 × `”` (U+201D). All balanced.
- **En-dash preserved**: 2 instances (`Viina joomine oli ulme – võisin…`, `lihtsalt veidi ebamugavalt – `). Space-padded per ET convention.

## Flagged blocks

- **h001** — heading text is `TUNNETEST ÜHE UJUTATUD` vs metadata title `Tunnetest üle ujutatud`. Preserved the source spelling `ÜHE` verbatim. If PO flags this as wrong rather than a source artifact, the fix is a 1-line change to `make_text` for this section.
- No other flags. All 25 paragraphs read cleanly; cross-page merges verified by spot-check.

## Schema proposals

None. Conventions covered everything this section required. The minor "source says ÜHE, metadata says ÜLE" divergence is already addressed by the existing fidelity-over-correction rule and the intentional title/heading divergence rule — no new convention needed.

## Verdict

- **Heading**: PASS (1 block, faithful to source spelling).
- **Front-matter (deck + drop-cap)**: PASS (italic deck emitted as single paragraph; drop-cap `E` merged into `Esmakordselt`; wrap-zone correctly consumed).
- **Body paragraphs**: PASS (24 paragraphs, 5 page boundaries handled, all authored hyphens preserved).
- **Byline/list/footnote/verse/table/blockquote**: N/A (none present).
- **JSON validity**: PASS.
