# ch10-tooandjatele — extraction report

## Summary

Chapter 10 "Tööandjatele" (To Employers), PDF pages 168-182, book pages 136-150.
**52 blocks emitted**: 1 heading, 50 paragraphs, 1 footnote. EN counterpart has
53 blocks (1 heading, 51 paragraphs, 1 footnote). The one-paragraph gap is a
legitimate translator merge, not an extraction defect — see "Flagged blocks"
below. No soft-hyphens, NUL bytes, or running-header artifacts leak into output.

## Method

PyMuPDF `page.get_text("dict")` for all pages. Applied standard ET conventions
as seeded by Wave 4:

- Running-header drop: `y0 < 45 AND (size <= 11.5 OR text.isdigit())`. Catches
  the usual 11.0pt headers on pp. 169-181 AND the unusual 10.0pt header +
  9.5pt page-number on the final page 182.
- Bottom-of-page page-number drop on p168: `isdigit() AND size <= 11.5 AND
  y0 > 520`. Catches the `136` at y=530.8.
- Chapter label `10. peatükk` (12.5pt NewCaledoniaLTStd-It) drop via regex
  `^\d+\.\s*peatükk\s*$`.
- Drop-cap detection: BrushScriptStd font AND size > 20pt on page 168.
- Soft-hyphen (U+00AD) strip-and-join at paragraph-line join time.
- Line-end U+002D preserved when followed by uppercase (ET wave-4 rule for
  authored compounds); stripped when followed by lowercase (defensive — there
  were no such occurrences in this section, ET uses soft-hyphen).
- Footnote detection: `size <= 10.5 AND y0 > 170`. On p182 the footnote spans
  two PyMuPDF lines (one italic `-It` font, one non-italic tail); both match
  the gate and group into one footnote block.

No pdfplumber used; no special heuristics beyond what ET conventions document.

## Schema decisions

- **Heading.** Emitted `TÖÖANDJATELE` as the single heading block (h001). The
  EN counterpart is `TO EMPLOYERS`; ET source does not use an asterisk-decorated
  heading like ch08's `NAISTELE*` — the chapter's footnote marker `*` appears
  at the end of the final body paragraph (p051), not in the heading.
- **Drop-cap.** `P` (BrushScriptStd ~33pt) at (x=56.7, y=102.2) on p168 merges
  with the first body line `aljude tänapäeva…` (x=86.8, y=106.6) to produce
  `Paljude tänapäeva tööandjate seast meenub…`. The drop-cap wrap zone extends
  to y≈130 at x=86.8 (one wrap line); body returns to x=56.7 at y=135.6.
- **Footnote.** Single footnote on p182: `*Vt Lisa VI. Ootame rõõmuga teie
  kirju, kui saame teile kuidagi abiks olla.` The leading `*` marker is
  preserved per EN convention. Visually the first line is italic
  (`TimesNewRomanPS-ItalicMT`) and the tail `abiks olla.` is regular italic
  (`NewCaledoniaLTStd-It`), but both sit under the size ≤ 10.5 gate at
  y > 170, so they cluster into a single footnote block.
- **Running headers on p182.** The final page's running header sits at
  y=35.2 with unusual sizes (10.0pt for the book title, 9.5pt for the page
  number) compared to the standard 11.0pt used on pp. 169-181. The
  `size <= 11.5` branch of the ET drop rule catches both. No gap required.

## Flagged blocks

- **Block count divergence from EN (52 vs 53).** EN's `ch10-to-employers-p003`
  is the short standalone paragraph `But let him tell you:`. The Estonian
  translator merged this sentence into the preceding paragraph as the closing
  clause: `…võiksid olla ärimeestele üle kogu maailma erakordselt kasulikud.
  Kuid laskem tal endal rääkida:`. This is visible in the probe output at
  p168 y=193.6 — the line runs continuously at x=56.7 with no paragraph-start
  indent, and the next line (`Olin kunagi…`, x=68.0 y=208.1) is the new
  paragraph. This is a translator choice, not an extraction defect. Preserved
  verbatim per ET fidelity-over-correction rule.
- **`B` vs `B—`.** EN uses the em-dash-suffixed placeholder `Mr. B—` and
  `Mr. B—'s brother`. The Estonian translator renders these without the
  em-dash suffix: `härra B` (p003), `tema vend` (p004). No extraction concern;
  documented for parity review.
- **Source typo `teveneb`.** Block `p050` reads `…Õige mees, selline, kes
  teveneb, ei tahagi midagi niisugust.` The source PDF renders `teveneb`
  instead of the expected `terveneb` (missing `r`). Preserved verbatim per
  the ET fidelity-over-correction rule (same class as ch01's `o1i` and
  `sõruskonna`).

## Counts

- heading: 1
- paragraph: 50
- footnote: 1
- **total: 52 blocks**

Block-count parity with EN: -1 (translator paragraph merge documented above).

## Schema proposals

None. Existing EN and ET conventions covered every structural feature of this
chapter without requiring new rules.
