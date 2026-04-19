# story-sest-ma-olen-alkohoolik — extraction report

## Summary

Structured extraction of the Estonian story "Sest ma olen alkohoolik" (Part III
"They Stopped in Time", story #8; EN counterpart: "Because I'm an Alcoholic"),
PDF pages 370–379 (book pages 338–347). Produced **35 blocks**: 1 `heading` +
34 `paragraph`. No list-items, no verses, no blockquotes, no footnotes, no
byline. All ET conventions applied (soft-hyphen cross-line joins, ET
running-header drop gate, ET en-dash / minus space-padding, BrushScriptStd
drop-cap, Wave 4 U+002D preservation). JSON validates.

## Method

- PyMuPDF `page.get_text("dict")` per page, spans flattened to lines with bbox
  + font + size. Sorted by `(page, y0, x0)`.
- Line-level drops:
  - Running header / top page-number: `y0 < 45 AND (size <= 11.5 OR digits)`.
    ET running headers sit at y≈35, size 11.0.
  - Story-number `(8)` on p370 at y≈56.83 size=13 → matched by the explicit
    `y0 < 65 AND ^\(\d+\)\s*$` guard. Mirrors the pioneer-story exemplar.
  - Bottom-of-page numeric footer: `stripped.isdigit() AND size <= 11.5 AND y0 > 520`
    (drops "338"/"339"/... on each page at y≈530.79).
- Block assembly:
  - Heading detected by text-match (`SEST…ALKOHOOLIK`) at size ≥ 14, p370.
    **Note:** heading uses **TimesNewRomanPSMT at 16pt**, not the usual
    NewCaledoniaLTStd at ~14pt seen in other ET stories. Using text-match +
    wide size gate (≥14) instead of narrower size-band detection.
  - Italic deck: `NewCaledoniaLTStd-It` at p370 in y ∈ [90, 128] (2 lines) →
    single paragraph (ET default). The deck reads as one continuous sentence
    ending in a rhetorical question with curly quotes: `„Miks?"`.
  - Drop-cap `K` (BrushScriptStd, size 33, y≈130.22, x=56.69, p370) merged with
    the first body line (`üllap olen ma…`) → `Küllap olen ma…`.
  - Drop-cap wrap-zone: body lines on p370 with `82 ≤ x ≤ 95` and
    `130 ≤ y ≤ 160` are continuations of the merged paragraph, not new
    paragraphs. `K` is a wide glyph; wrap-zone starts at x≈90.08.
  - Paragraph-start detection: `64 ≤ x0 < 80` (indent column ≈ 68.03).
  - Continuation column: x ≈ 56.69.
- Line-join rules (ET):
  - U+00AD soft hyphen → strip, join no-space (104+ occurrences; primary
    ET cross-line mechanism).
  - **U+002D at line-end → preserve and join no-space (Wave 4 ET rule).**
    Observed once in this section: p375 `Vana-` + `aasta­õhtul` →
    `Vana-aastaõhtul`.
  - U+2013 / U+2212 at line-end with trailing-space signal → keep the space.
  - U+2014 em-dash: join tight (not observed in this section).
  - Default: single space.
- Ligatures normalized (`ﬁ` → `fi`, etc.), NULs stripped. No NULs found.

## Cross-page paragraph merges

Applied implicitly by the body-line loop (indent-based paragraph-start rule).

| Transition | Last-line end (p) | Next first line (p+1) | Decision |
| --- | --- | --- | --- |
| p370 → p371 | `suurlinna naise kuvandi. See kahandas minu tunnet, nagu oleksin ma mahajäänud ` | `maaplika. Õppisin…` | Merge |
| p371 → p372 | `…söögi kõrvale veini juua. Pärast õhtusööki ja veini ootasid juba muidugi liköörid. Minu päevikud ja kirjad annavad tun­` (soft hyphen) | `nistust minu õhtu…` | Merge (soft-hyphen join) |
| p372 → p373 | `…olid õhtut nau­` (soft hyphen) | `tinud.` | Merge (soft-hyphen join → `nautinud`) |
| p373 → p374 | `…seinte värvimiseks, vanniminekuks. ` | `Ära vajudes…` at x=68.03 (indent) | **New paragraph** |
| p374 → p375 | `…Kõrvalt vaadates tundus, et pidasin enam-vähem vastu, ` | `ent sügaval sisimas närbusin…` | Merge |
| p375 → p376 | `…See, mida tol õhtul kõige ` | `rohkem tunnistada kartsin…` | Merge |
| p376 → p377 | `…armastust võis sealt alati leida, ja kui ` | `ma suutsin lõpuks armastuse…` | Merge |
| p377 → p378 | `…seda jõudu endaga kaasas kandes.` | `Avastasin, et suutsin…` at x=68.03 (indent) | **New paragraph** |
| p378 → p379 | `…See aitas mul AA-sse jõudmiseni ellu jääda. ` | `Programmi hoole all hakkas see osa minus kasvama…` | Merge |

All merges and the two paragraph breaks are driven by the indent-based
paragraph-start rule — no special-case code needed.

## Schema decisions

- **Story-number `(8)` dropped entirely.** Per ET conventions + EN convention
  ("lean toward DROP"). Decorative structural numbering, not authored content.
- **Italic deck → single paragraph.** Two wrapped italic lines on p370 form
  one logical sentence (a rhetorical framing: "See jooja leidis viimaks ometi
  vastuse oma piinavale küsimusele: „Miks?""). No multi-indent structure that
  would warrant splitting.
- **Heading font divergence.** Unlike most ET sections where headings are
  NewCaledoniaLTStd at ~14pt, this section renders the heading in
  **TimesNewRomanPSMT at 16pt** (probably a typesetting accident in the
  Estonian edition). Detection gate widened to `size ≥ 14` and text-match
  `SEST…ALKOHOOLIK`. No other line in the section matches both predicates,
  so the gate is unambiguous. **No schema change** — heading text emitted as
  `SEST MA OLEN ALKOHOOLIK` (visual rendering); metadata `title` keeps the
  prose form "Sest ma olen alkohoolik" (intentional metadata/heading
  divergence).
- **Drop-cap merge for `K`.** Treated as the first letter of `Küllap` (no
  space inserted). Wrap-zone (x ∈ [82, 95], y ∈ [130, 160]) correctly absorbs
  two wrapped lines (y≈135.68, y≈150.18) before body flow resumes at body
  margin x≈56.69.
- **Dialog stays inline.** Eight passages with ET curly-quote dialog
  (`„…"`) are kept in their surrounding paragraphs (p021 `„Ma olen
  alkohoolik."`, p023 `„Helista talle kohe."`, p019 quoted psychologist's
  line, p028 series of slogans on wall — `„Üks päev korraga."` etc.).
  Italic/quoted alone is a weak split signal; kept inline per parent
  conventions.
- **Slogan list on p377 kept as paragraph.** Six quoted AA slogans on the
  meeting-room wall (`„Üks päev korraga." „Tasa ja targu." „Hoia asjad
  lihtsana." „Ela ise ja lase teistel elada." „Lase lahti ja las Jumal
  juhtib." „Meelerahupalve."`) are run-on within two body lines with no
  typographic separator. Kept as a single paragraph's closing content.
  Not list-items — they render inline like prose, not one-per-line.
- **No byline.** Story ends with `…ma ei tunne end enam üksinda.` on p379.
  No signature or attribution line.
- **Heading text.** `SEST MA OLEN ALKOHOOLIK` — visual all-caps preserved
  as rendered.

## Counts

- Blocks: 35 total.
- By kind: 1 heading, 34 paragraphs.
- Pages with content (after drops): p370 (heading + deck + 3 body paragraphs),
  p371..p379.
- Soft-hyphen joins observed: many (ET norm).
- Hyphen-preserved intra-line compound hyphens (authored `-` inside a line):
  `enam-vähem`, `poiss-sõbrale`, `Vana-aastaõhtul`, `AA-sse`, `AA-lasi`,
  `AA-s`, `AA-d`, `Alliance Française'i`, `Cambridge'is`, `Guadaloupe'ist`,
  `kolledži-` (in a suspended list `kolledži- ja magistriõpingute`) — all
  preserved verbatim. The curly right-single-quote `U+2019` used as apostrophe
  in foreign names is also preserved.

## Front-matter verdicts

- `id` = `story-sest-ma-olen-alkohoolik` ✓
- `kind` = `story` ✓
- `title` = `Sest ma olen alkohoolik` ✓
- `parentGroup` = `personal-stories/they-stopped-in-time` ✓
- `pdfPageStart`/`pdfPageEnd` = 370 / 379 ✓
- `bookPageStart`/`bookPageEnd` = 338 / 347 ✓
- Heading text: `SEST MA OLEN ALKOHOOLIK` (visual rendering, all caps).

## Flagged blocks

None — low uncertainty throughout. Two notes for the wave log:

1. **Heading font anomaly.** This is the first ET story I've extracted where
   the section heading is set in `TimesNewRomanPSMT` at 16pt instead of
   `NewCaledoniaLTStd` at ~14pt. The text-match gate made detection trivial.
   If further ET sections show this pattern, a size-tolerant heading detector
   that falls back to text-match could be factored into a shared helper.

2. **Line-end U+002D observed and preserved** (Wave 4 ET rule). Single
   occurrence: p375 `Vana-` (line-end U+002D) + `aasta­õhtul` (soft-hyphen
   internal) → `Vana-aastaõhtul`. Correct per Wave 4 — the exemplar's older
   "strip if next lowercase" rule would have produced the wrong
   `Vanaaastaõhtul`. Updated extraction script uses the preserve branch.

## Schema proposals

None. All Wave 1–4 ET conventions fit this section cleanly. Extraction script
was adapted from `extract-mees-hirmu.py` (another pioneer/personal story).
Parameters adjusted for heading text + font, drop-cap letter, italic-deck
y-band, and the line-end U+002D join rule (corrected from the exemplar's
lowercase-strip to Wave 4's preserve).
