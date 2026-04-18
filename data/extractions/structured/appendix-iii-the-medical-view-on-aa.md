# appendix-iii-the-medical-view-on-aa — extraction report

## Summary

Short two-page appendix (pp. 574-575). Ten blocks emitted: 1 heading, 8 paragraphs, 1 footnote. Zero verse / list-item / blockquote / byline, as expected for this section. Clean extraction, no fragmentation, no merge issues.

## Method

- **Library:** PyMuPDF `page.get_text("dict")` only. No `pdfplumber` needed.
- **Heuristics fired:**
  - Running-header guard (size ≤ 9.5 AND y0 < 55 AND text == "APPENDICES") — did not fire on these two pages; neither p574 nor p575 has the "APPENDICES" header (the Roman numeral III and the body text occupy those y-positions instead).
  - Page-number drop (pure-digit lines) — did not fire (no page numbers in the extracted spans).
  - Footnote-rule drop (`set(text) == {"_"}`) — fired once on p575 y=500 "`_________`".
  - Paragraph split: y0-to-y0 gap > 20pt OR page change. Within-paragraph line spacing ~13.3pt; between-paragraph ~27.6pt.
  - Two-line heading merge: roman "III" (p574 y=45.1 size 13.02) + "THE MEDICAL VIEW ON A.A." (p574 y=74.8 size 13.02) → joined with single space.
  - Footnote detection: line on p575 with y0 > 480 starting with `*` → emitted as `footnote` block with leading `*` preserved.

## Schema decisions

### Heading: two-line merge

Emitted as a single `heading` block with text `"III THE MEDICAL VIEW ON A.A."` per the conventions doc ("appendix titles span two centered lines ... merge into a single heading block, joined by a space").

### Italic parenthetical on p575 (y=407..473) → `paragraph`, not `blockquote`

The closing paragraph `"(This address is now available in pamphlet form...)"` is typographically distinctive:
- Font: `NewCaledonia-Italic` (with one `Arial-ItalicMT` span where curly quotes render) vs the rest of the body in upright `NewCaledonia`.
- Wrapped in parentheses like an editor's note.
- However **same font size (10.98 pt)** and **same x0 (63.0)** as the surrounding paragraphs — no separate indent column, no size reduction.

Per the conventions doc: `blockquote` requires "smaller font, a different indent column, and often bracketed by parenthetical stage-direction text." Two of the three signals are missing (no smaller font, no distinct indent). Only the parenthetical wrapping is present, along with italic font. Conventions also note "italics alone is a weak split signal" and caution to keep italic pull-quotes inline.

**Decision:** Emit as `paragraph` (block `p009`). Italic formatting is not preserved in the extended schema's `text` field, so the paragraph reads as plain prose. This is consistent with the conventions' precedent (ch05 Third Step Prayer kept inline with its surrounding paragraph despite italics).

### Footnote marker

Footnote `"* 1944"` emitted as `footnote` kind (block `f010`, page 575). Leading `*` preserved as the first character, per conventions. The in-paragraph reference site is in `p002`: `"…the annual meeting* of the Medical Society of the State of New York…"` — the `*` is carried in the body text as-is.

The horizontal rule `"_________"` on p575 y=500 (immediately preceding the footnote) is a footnote divider and was dropped in `extract_lines` via the `set(text) == {"_"}` guard.

### Cross-page merge

Not needed. Tiebout's paragraph on p574 ends with `"...program."` (closing curly quote + terminal period), and Bauer's paragraph starts fresh at the top of p575 with a new speaker attribution. The page boundary aligns with a paragraph boundary.

### Body-paragraph style uniformity

All five doctor excerpts (Kennedy, Collier, Tiebout, Bauer, Stouffer) use the same font (NewCaledonia), same size (10.98), same x-indent (63.0) as the framing prose. They are not typographically set apart as quotes — the quoted speech appears inside double curly quotes as ordinary inline dialogue. Emitted as `paragraph` blocks, one per doctor, with the attribution phrase (`"Dr. Foster Kennedy, neurologist:"`) inline as the opening clause. This matches the conventions guidance: "Dialogue passages in prose — keep them inside their surrounding paragraph block."

## Flagged blocks

None requiring escalation. One decision worth noting for the PO's awareness (already documented above):

- **`p009`** — italic parenthetical. Could plausibly be rendered as `blockquote` if future convention refinements accept italic+parentheses as a sufficient signal. Emitted as `paragraph` under current rules.

## Schema proposals

None. The extended `BlockKind` enum and id scheme handled this section cleanly.

## Block inventory

| id                                              | kind      | page | first 60 chars                                                |
| ----------------------------------------------- | --------- | ---- | ------------------------------------------------------------- |
| appendix-iii-the-medical-view-on-aa-h001        | heading   | 574  | III THE MEDICAL VIEW ON A.A.                                  |
| appendix-iii-the-medical-view-on-aa-p002        | paragraph | 574  | Since Dr. Silkworth's first endorsement of Alcoholics Anonymo |
| appendix-iii-the-medical-view-on-aa-p003        | paragraph | 574  | Dr. Foster Kennedy, neurologist: "This organization of Alcoho |
| appendix-iii-the-medical-view-on-aa-p004        | paragraph | 574  | Dr. G. Kirby Collier, psychiatrist: "I have felt that A.A. is |
| appendix-iii-the-medical-view-on-aa-p005        | paragraph | 574  | Dr. Harry M. Tiebout, psychiatrist: "As a psychiatrist, I hav |
| appendix-iii-the-medical-view-on-aa-p006        | paragraph | 575  | Dr. W. W. Bauer, broadcasting under the auspices of The Ameri |
| appendix-iii-the-medical-view-on-aa-p007        | paragraph | 575  | Dr. John F. Stouffer, Chief Psychiatrist, Philadelphia Genera |
| appendix-iii-the-medical-view-on-aa-p008        | paragraph | 575  | The American Psychiatric Association requested, in 1949, that |
| appendix-iii-the-medical-view-on-aa-p009        | paragraph | 575  | (This address is now available in pamphlet form at nominal co |
| appendix-iii-the-medical-view-on-aa-f010        | footnote  | 575  | * 1944                                                        |

Kind counts: `{heading: 1, paragraph: 8, footnote: 1}`. Total 10.
