# story-hirm-hirmu-ees — extraction report

## Summary

Structured extraction of the Estonian Part II/B (They Stopped in Time / ET
`personal-stories/they-stopped-in-time`) story "Hirm hirmu ees" (EN counterpart:
"Fear of Fear", the "(2)" story on the opening page). Pages 321–326 in the PDF,
book pages 289–294. **18 blocks** emitted: **1 heading**, **17 paragraphs**. No
byline, no list items, no verse, no footnote, no table. Block counts match the
English counterpart exactly (1 heading + 17 paragraphs).

## Method

- PyMuPDF `page.get_text("dict")` on pages 321–326.
- Lines sorted by `(pdf_page, y0, x0)`.
- Running-header / top-of-page page-number drop: `y0 < 45 AND (size <= 11.5 OR
  digit-only)` (ET Wave 3 gate).
- Bottom-of-page page-number drop: `digit-only AND size <= 11.5 AND y0 > 520`
  (page 321 has `289` at y≈530).
- Story-number `(2)` drop: page 321, `y0 < 95`, matches `^\(\d+\)\s*$`.
- Heading detection: page 321, `13.5 <= size <= 15.0`, text contains `HIRM`
  and `HIRMU`. Found at y≈102 size=14 → single `heading` block.
- Drop-cap detection: BrushScriptStd size≥20 on page 321 → `M` at y≈175
  size=33. Merged as the first letter of the first word: `M` + `a ei
  arvanud…` → `Ma ei arvanud…` (no space, per the "first letter of word"
  drop-cap rule).
- Drop-cap wrap-zone: y in [175..200] AND x in [95..110]. The second wrap
  line (y≈194) at x=99.08 is absorbed into the first paragraph and NOT
  treated as a paragraph-start.
- Italic deck on page 321: 3 wrapped lines in y range [120..170], size≈12.5.
  Source alternates italic → regular → italic spans per line (italic at y=126
  and y=155, regular at y=141). Single indent group → one `paragraph` block.
- Body-paragraph split on first-line indent: `64 <= x0 < 80` (paragraph-start
  at x≈68.03; body continuation at x≈56.69). Both odd and even pages share
  these coordinates in this section.
- Cross-page merges: handled organically by the "new paragraph iff first-line
  indented" rule. All five page transitions (321→322, 322→323, 323→324,
  324→325, 325→326) are mid-paragraph and merge cleanly — in every case the
  previous page ends with a soft-hyphen split (`tugi-`, `joomi-`, `ei vas-`,
  `joomi-`, `kelle-`) and the next page opens at the body-margin x≈56.69, so
  no indent triggers a flush. No terminal-punctuation heuristic needed.
- Join rules (ET): U+00AD at line-end → strip and join no-space; U+002D at
  line-end (rare here — appears only as in-line authored compounds like
  `AA-s`, `Greenwich Village’i`, `pudeli-karjääri`) — preserved as-is since
  body-level; U+2013 en-dash with surrounding spaces → preserved as
  space-padded.

## Schema decisions

- **Story-number `(2)` dropped** per ET convention (decorative numbering, not
  authored content). No room to keep it: it sits on its own line at y≈82
  size=13, above the heading.
- **Italic deck emitted as a single paragraph** (one visible indent group,
  three wrapped lines, size 12.5) following the Wave 3 default for stories
  and matching the EN fear-of-fear choice.
- **Drop-cap `M`** is the first letter of "Ma" — merged without a space, matches
  the wide-glyph drop-cap pattern. No small-caps tail in ET (per ET
  conventions), so the merged text needs no case-fix.
- **No blockquote, verse, list-item, footnote, table, byline.** Story closes on
  page 326 y=396 with `Loodan, et ma ei unusta kunagi olla tänulik.` — same
  "no byline" structure as the EN counterpart.
- **No cross-section block types.** Dialogue (including quoted conversation at
  pp321–322 and 324–326) stays inline in the surrounding paragraphs per the
  "dialogue is not verse/blockquote" rule.

## Flagged blocks

- **`story-hirm-hirmu-ees-p011`**: contains source typo `välja arvatu juhul`
  (should be `välja arvatud juhul`, past participle suffix dropped). Preserved
  verbatim per ET conventions (fidelity over correction). Quoted snippet:
  `"…ei läinud kellelegi külla, välja arvatu juhul kui ma teadsin…"`
- **`story-hirm-hirmu-ees-p015`**: contains the slightly awkward `Mu oli
  endast ja teistest täiesti kama kaks.` — looks like source missed `meel`
  (probably `Mul oli endast…` or `Mul meel oli…`). Preserved verbatim.
  Appears on page 325 y=338.91–353.41 in the PDF.

## Schema proposals

None. All decisions handled by existing ET conventions (soft-hyphen mechanism,
`y < 45` running-header gate, BrushScriptStd drop-cap detection, en-dash
space-padding, story-number drop). Block-count parity with the EN counterpart
(18 ≙ 18) continues the cross-language structural alignment observed across
Waves 1–4.
