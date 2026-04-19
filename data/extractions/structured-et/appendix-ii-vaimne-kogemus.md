# appendix-ii-vaimne-kogemus — extraction report

## Summary

ET Wave 5 per-section extraction for Appendix II, "Vaimne kogemus" (pp. 599–600, book pp. 567–568). Emitted **10 blocks**: 1 heading, 8 paragraphs, 1 byline. Block-count matches the EN counterpart `appendix-ii-spiritual-experience` exactly (10 blocks, same shape). Pure prose appendix plus the closing Herbert Spencer epigraph with a right-aligned attribution byline. Cross-page paragraph (pp005) merged from p599 into p600. No running headers. Two page numbers dropped (567 at p599 bottom, 568 at p600 top).

## Method

- PyMuPDF `get_text("dict")` for per-line spans with font/size/bbox.
- No `pdfplumber`.
- Line-ordering: `(pdf_page, y0, x0)` after retaining body lines.
- Drop rules applied:
  - All-digit lines dropped if `y0 < 45` OR `y0 > 520` (catches `567` at y=530.79 on p599 and `568` at y=34.99 on p600).
  - Generic ET running-header rule `y0 < 45 AND size <= 11.5` retained defensively; no non-digit candidates fired.
- Heading detection: two lines on p599 at y≈48.66 and y≈63.66, both at size 14 (≥13.0 gate), both within `y0 <= 90`. Merge with a single space: `II` + ` ` + `VAIMNE KOGEMUS` → `II VAIMNE KOGEMUS`. Matches the convention's canonical pattern.
- Byline detection: short line on p600 at `x0 = 215.03` (well right of body margin 56.69) starting with U+2212 MINUS SIGN. Classified as `byline`.
- Paragraph splitter: first-line indent `x0 >= 64` starts a new paragraph; continuations at body margin `x0 ≈ 56.69` stay with the current paragraph. Works across the page boundary (p599 → p600) because the per-line ordering is `(pdf_page, y0)` and the first line of p600 (`nud endas senitundmatu...` at `x0=56.69`) is a wrap-continuation of p599's last paragraph.
- Line-join: ET `join_lines_et` — soft-hyphen strip-and-join, real hyphen at line-end preserved (Wave 4 ET rule), en-dash/minus-sign space-padding tracked via preceding trailing space, em-dash tight-join.

## Schema decisions

1. **Heading two-line merge.** `II` + ` ` + `VAIMNE KOGEMUS` = `II VAIMNE KOGEMUS`. No interior-space collapse needed (PyMuPDF delivered `II` as a single token, unlike appendix-vii's letter-spaced `V I I`). The convention example explicitly names `II SPIRITUAL EXPERIENCE` as the canonical EN form; the ET form mirrors it verbatim in layout.
2. **Herbert Spencer attribution as `byline` (`b010`).** Matches the conventions' Wave 6 extension of `byline` to epigraph attributions (`—Herbert Spencer` in EN). In ET the dash glyph is U+2212 MINUS SIGN (consistent with the ET item-separator and dash conventions), not U+2014 EM DASH. Typographic signature: short (17 chars), small-caps rendering in source (`HERBERT SPENCER` all-caps at body size), right-aligned (`x0 = 215.03`) well away from body margin (56.69).
3. **Quote paragraph `p009` stays a `paragraph`, not `blockquote`.** Same signal pattern as the EN counterpart: the quoted epigraph body sits at the body margin (`x0 = 56.69` at indent-less wrap, `x0 = 68.03` at the indent-start), same 11.0pt body size as adjacent paragraphs, no parenthetical "stage-direction" markers. Conventions reserve `blockquote` for editorial interludes with distinct font-size/indent; this is a standard quoted-paragraph with an attribution byline, not that pattern.
4. **Cross-page merge without terminal-punctuation check needed.** The last line of p599 (`avasta-` — actually `avasta` + soft hyphen) is a clear mid-word cross-line split, not a terminal-punctuation case. The continuation on p600 (`nud endas...`) sits at body margin `x0 = 56.69` with no indent. The indent-based splitter naturally groups them; no terminal-punctuation disambiguation needed here.
5. **`Juma-` + `la-tunnetuse` handled by soft-hyphen rule alone.** Line 283.93 ends with `Juma\xad` (soft hyphen), line 298.43 starts with `la-tunnetuse"`. The ET soft-hyphen rule strips `\xad` and joins without space: `Juma` + `la-tunnetuse` = `Jumala-tunnetuse`. The embedded U+002D hyphen inside `la-tunnetuse` is an authored intra-line compound and is preserved as-is — no allowlist rule triggered. Corresponding EN form on p573 appears intact as `God-consciousness` (hard-joined); ET form is structurally analogous (`Jumala-tunnetuse`) with the compound hyphen authored mid-word.
6. **Italic closing phrase inside `p008` kept inline.** The last two lines of `p008` (`nemise juures esmatähtsad. Kuid neid ei saa millegagi asen-` / `dada.`) render in `NewCaledoniaLTStd-It` while the first two render in upright `NewCaledoniaLTStd`. Same-paragraph same-margin same-size (11.5pt); italics alone is a weak split signal per conventions. Kept inline.
7. **Size variance within paragraphs tolerated.** Observed intra-paragraph size variance of ±0.1pt within what are visually single paragraphs (e.g., p005: sizes 11.42–11.61 all in one paragraph). These are PyMuPDF measurement fluctuations, not authored size-band transitions. No size-band paragraph split applied (the arsti-arvamus multi-size rule does not apply here — this section is single-size body).
8. **Closing quote in `p009` mixes `„` opener with `"` (U+201D) closer.** Source renders `„Leidub...uurimist."` — Estonian low-9 opener pairs with English right-double-quote closer. Preserved verbatim per the "text quirks to preserve verbatim" conventions principle. Parallels the Wave 3 arsti-arvamus `p040` finding (mixed `„`/`"` pairs in the ET typesetting).

## Flagged blocks

- `h001` — heading merge. Straightforward two-line concat. Text: `II VAIMNE KOGEMUS`.
- `p004` — contains `Jumala-tunnetuse` (cross-line soft-hyphen + intra-line U+002D preserved). Snippet: `...omandama vahetu ning kõikehõlmava „Jumala-tunnetuse", millele sedamaid...`.
- `p005` — cross-page paragraph. Spans from p599 (y=327.43) to p600 (y=63.58). `pdfPage` attribute is `599` (starting page, per convention).
- `p008` — italic closing phrase kept inline. Snippet: `...Soov, ausus ja avatud mõistus on tervenemise juures esmatähtsad. Kuid neid ei saa millegagi asendada.` (Second half renders in `NewCaledoniaLTStd-It`.)
- `p009` — quoted epigraph. Mixed ET `„` + EN `"` quote pairing preserved. En-dash `– see` with surrounding spaces preserved. Snippet: `„Leidub üks põhimõte ... teadmatuses – see põhimõte on põlgus enne uurimist."`.
- `b010` — Spencer byline. Dash is U+2212 MINUS SIGN (not em-dash). Text: `− HERBERT SPENCER`.

## Schema proposals

None. All rules in place (ET conventions' running-header gate, soft-hyphen strip-and-join, en-dash space-padding, byline-for-epigraph from EN Wave 6) applied cleanly. This section is an excellent ET-EN parity test case and confirms the ET Wave 4 rule "preserve line-end U+002D" via the analogous `Jumala-tunnetuse` case (soft-hyphen + intra-line real-hyphen; no ambiguity).

## Parity check vs EN

- **Block count:** ET 10, EN 10. Exact match.
- **Kinds:** ET `{heading:1, paragraph:8, byline:1}`, EN `{heading:1, paragraph:8, byline:1}`. Exact match.
- **Heading:** ET `II VAIMNE KOGEMUS` ↔ EN `II SPIRITUAL EXPERIENCE`. Structurally identical (roman numeral + space + ALL-CAPS title).
- **Byline:** ET `− HERBERT SPENCER` ↔ EN `—Herbert Spencer`. Dash glyph differs (U+2212 vs U+2014), case differs (all-caps ET vs title-case EN), but kind/role identical.
- **Quote paragraph:** ET `p009` `„Leidub...enne uurimist."` ↔ EN `p009` `"There is a principle...contempt prior to investigation."`. Same position, same `paragraph` kind.
