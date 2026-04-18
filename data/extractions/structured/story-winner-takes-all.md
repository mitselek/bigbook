# story-winner-takes-all — extraction report

## Summary

Part II.B "They Stopped In Time" story #(12), "Winner Takes All", pages 386–392
(7 pages). Emitted **24 blocks**: 1 `heading` + 23 `paragraph`. No list-items,
verses, footnotes, tables, blockquotes, or bylines. Structure closely mirrors the
`story-the-missing-link` template (same `parentGroup`, same layout conventions).

## Method

- `pymupdf.open` + `page.get_text("dict")` on pages 385..391 (0-indexed).
- Probe script `.tmp/probe-winner-takes-all.py` — dumped per-line bbox, font, size
  to plan heading/subtitle/drop-cap/body segmentation.
- Extraction script `.tmp/extract-story-winner-takes-all.py` implements:
  - **Running-header drop**: `y0 < 50` AND (`size <= 9.5` OR `text.isdigit()`).
  - **Bottom-of-page page-number drop**: `text.isdigit()` AND `y0 > 500` (hits
    page 386's `375` at y=540.74 size 9pt).
  - **Story-number drop**: `(12)` on first page at y=79 size 12.5 via regex.
  - **Heading detection**: first size≥13 line on first page whose text contains
    "WINNER".
  - **Subtitle detection**: italic ~11pt lines at y<180 on first page. Single
    indent group (one line at x=76.28, two at x=64.27) → single `paragraph`.
  - **Drop-cap merge**: `M` (ParkAvenue 51.65) + first body line fragment
    `y parents...` → `My parents...` (no space). Drop-cap wrap-around: subsequent
    lines at y<dc.y0+45 and x>body_margin+15 stay in the same paragraph (the
    line at y=215.09 x=101.65 is the wrap-line for drop-cap row 2).
  - **Body paragraph split**: `x0 >= body_margin + 8` marks first-line indent.
    Even pages body-margin 52.28, odd pages 69.28.
  - **Line join**: cross-line hyphen strip with Wave 6 allowlist; multi-hyphen
    compound preservation; capitalized-stem preservation; number-prefix
    qualification (none of these fired in this story — no cross-line compound
    splits observed).
  - **Em-dash join**: no space inserted when prior line ends with `—`.
- No `pdfplumber` used.

## Schema decisions

- **Story-number `(12)`** — dropped entirely per conventions ("structural
  numbering, not authored content").
- **Section `title` vs heading text** — metadata `"Winner Takes All"` kept
  prose-case; heading block emits visual `"WINNER TAKES ALL"`.
- **Subtitle** — 3 italic lines emitted as a single `paragraph` (one indent
  group at x=76.28; continuations at x=64.27). Per conventions default.
- **Drop-cap** — single-letter `M` + partial first word `y parents` merged with
  no space → `My parents`. Small-caps tail from NewCaledonia-SC renders as real
  lowercase in pymupdf output; the first-line text is already correctly cased
  for sentence start. The `\bi\b → I` pronoun-I safeguard was applied but had
  no effect here (no standalone `i` in the merged text).
- **Drop-cap wrap-line 2** — the second SC line at y=215.09 x=101.65 (still
  inside drop-cap x-shift) was correctly absorbed into the drop-cap paragraph
  via the `dropcap_wrap_y_max` gate.
- **No byline** — story closes with narrative sentence; no "— Signatory" line.
  No byline block emitted.

## Flagged blocks

None. All block assignments are unambiguous; hyphenation rewelds produced the
expected word forms. Sample verifications:

- Cross-line `un-` + `wanted` → `unwanted` (p387 → `p005`).
- Cross-line `re-` + `tarded` → `retarded` (`re-` intentionally not in
  allowlist; correctly strips).
- Cross-line `teach-` + `ers` → `teachers`.
- In-line compound hyphens preserved: `third-grade`, `large-print`,
  `four-letter`, `self-pity`, `self-employed`.
- Em-dash joins: `perfect—until`, `see—oh`, `killed—but`, `bad—that`,
  `“Great—if`, `got—I`, `get—I` — all joined without an inserted space.

Minor source oddity (preserved as-written): p010 contains
`say,”Mom, why do you have to drink so much?”` — the opening quote is
typographically the closing-quote glyph `”` rather than the expected `“`.
This is a source-PDF artifact and not an extraction error; preserved verbatim.

## Schema proposals

None. Conventions (Waves 1–6) cover every construct seen in this story.
