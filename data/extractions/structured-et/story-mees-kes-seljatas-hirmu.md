# story-mees-kes-seljatas-hirmu — extraction report

## Summary

Structured extraction of the Estonian story "Mees, kes seljatas hirmu" (pioneer #7;
EN counterpart: "The Man Who Mastered Fear"), PDF pages 278–289 (book pages
246–257). Produced **30 blocks**: 1 `heading` + 29 `paragraph`. No list-items, no
verses, no blockquotes, no footnotes, no byline. All ET conventions applied
(soft-hyphen cross-line joins, ET running-header drop gate, ET en-dash / minus
space-padding preserved, BrushScriptStd drop-cap). JSON validates.

## Method

- PyMuPDF `page.get_text("dict")` per page, spans flattened to lines with bbox +
  font + size. Sorted by `(page, y0, x0)`.
- Line-level drops:
  - Running header / top page-number: `y0 < 45 AND (size <= 11.5 OR digits)`.
    Matches ET convention (p279's header is size 10, p281+ headers size 11.0).
  - Story-number `(7)` on p278 at y≈53.53 size=13 → matched by the explicit
    `y0 < 65 AND ^\(\d+\)\s*$` guard. The generic y<45 gate would miss this
    because the numeral sits BELOW 45 (at y≈53.53) and at size 13 is above the
    ≤11.5 clause.
  - Bottom-of-page numeric footer: `stripped.isdigit() AND size <= 11.5 AND y0 > 520`
    (drops "246" on p278 at y≈530.79).
- Block assembly:
  - Heading detected by text-match (`MEES…HIRMU`) at size ≥ 13.5, p278.
  - Italic deck: `NewCaledoniaLTStd-It` at p278 in y ∈ [90, 135] (3 lines) → single
    paragraph per the default ET rule (the deck reads as one continuous
    description).
  - Drop-cap `K` (BrushScriptStd, size 33, y≈146.37, p278) merged with the first
    body line (`aheksateist aastat…`) → `Kaheksateist aastat…`.
  - Drop-cap wrap-zone: body lines on p278 with `82 ≤ x ≤ 95` and
    `146 ≤ y ≤ 170` are continuations of the merged paragraph, not new
    paragraphs. `K` is a wide glyph; wrap-zone starts at x≈88.43.
  - Paragraph-start detection: `64 ≤ x0 < 80` (indent column ≈ 68.03).
  - Continuation column: x ≈ 56.69 (odd pages) and x ≈ 56.69 (even pages too —
    Estonian layout uses a single column x here).
- Line-join rules (ET):
  - U+00AD soft hyphen → strip, join no-space.
  - U+002D at line-end before lowercase → strip, join no-space (no ET allowlist).
  - U+2013 / U+2212 at line-end with trailing-space signal → keep the space
    (mid-sentence space-padded dash); tight → no space.
  - U+2014 em-dash: join tight (not observed in this section).
  - Default: single space.
- Ligatures normalized (`ﬁ` → `fi`, etc.), NULs stripped. No NULs found.

## Cross-page paragraph merges

Applied implicitly by the body-line loop (no explicit post-pass needed once
paragraph-start indent detection is correct):

| Transition | Last-line end | Next first line | Decision |
| --- | --- | --- | --- |
| p278 → p279 | `ei paljasta-` (soft hyphen) | `nud midagi.` | Merge (soft-hyphen join) |
| p279 → p280 | `Avastasin ` (continuation x=56.69) | `kiiresti, et…` | Merge |
| p280 → p281 | `Igapäevases udus ` | `kummitas mind mõte…` | Merge |
| p281 → p282 | `polnud ` | `kedagi teist…` | Merge |
| p282 → p283 | `…hooleks anda".` (period + closing quote, end of sentence) | `Koheselt…` at x=68.03 (indent) | **New paragraph** |
| p283 → p284 | `Seal oleks ` | `mind tabanud…` | Merge |
| p284 → p285 | `…hakkama ` | `saama, oli pall…` | Merge |
| p285 → p286 | `…ja kes ` | `ma oleksin…` | Merge |
| p286 → p287 | `…vaba-kutselisele ` (soft hyphen) | `äriharidusele…` | Merge (soft-hyphen join → `vabakutselisele`) |
| p287 → p288 | `Päev või kaks enne ` | `starti kipun…` | Merge |
| p288 → p289 | `…neli täiskasvanud last, ` | `kellele olen pühendunud,…` | Merge |

All merges and the single paragraph break (p282→p283) are driven by the
indent-based paragraph-start rule — no special-case code needed.

## Schema decisions

- **Story-number `(7)` dropped entirely.** Per ET conventions + EN convention
  ("lean toward DROP"). It is decorative numbering, not authored content.
- **Italic deck → single paragraph.** Three wrapped italic lines on p278 form
  one logical description ("Ta veetis kaheksateist aastat põgenedes ja leidis
  siis, et põgeneda pole tarvis. Niisiis pani ta aluse AA-le Detroitis."). No
  clear multi-indent structure that would warrant splitting.
- **Drop-cap merge for `K`.** Treated as the first letter of `Kaheksateist` (no
  space inserted). Wrap-zone extended through the first paragraph (the drop-cap
  occupies roughly y=146..170 at x=54.69). One wrap-zone body line
  (y≈150.82/165.32 at x≈88.43) is correctly absorbed.
- **Italic mid-paragraph emphasis kept inline.** Two occurrences of lone
  `NewCaledoniaLTStd-It` lines in body columns (p283 y=92.41 "Miski polnud
  muutunud…" and p285 y=179.41 "kasvõi ainult üks inimene sureb…"). Both are
  single italicized sentences inside surrounding regular-style paragraphs —
  italics alone is a weak split signal; kept inline per parent conventions.
- **No byline.** Story ends with `…elu eest põgenes.` on p289. No signature,
  closing phrase, or attribution.
- **Heading text.** `MEES, KES SELJATAS HIRMU` — visual all-caps with comma
  preserved exactly as rendered. Matches metadata `title` "Mees, kes seljatas
  hirmu" in prose case (intentional metadata-vs-heading divergence).

## Counts

- Blocks: 30 total.
- By kind: 1 heading, 29 paragraphs.
- Pages with content (after drops): p278 (heading + deck + 3 body paragraphs),
  p279..p289.
- Soft-hyphen joins observed across lines/pages: many (ET norm).
- Hyphen-preserved intra-line compound hyphens (authored `-` inside a line):
  `Kesk-Läände`, `AA-le`, `dr Bobi`, `Bill W`, `ots-otsaga`, `koostöö-` (inside a
  compound phrase), `AA-lane`, `AA-st`, `AA-d`, `AA-elu` — all preserved
  verbatim.

## Front-matter verdicts

- `id` = `story-mees-kes-seljatas-hirmu` ✓
- `kind` = `story` ✓
- `title` = `Mees, kes seljatas hirmu` (comma in authored title preserved) ✓
- `parentGroup` = `personal-stories/pioneers-of-aa` ✓
- `pdfPageStart`/`pdfPageEnd` = 278 / 289 ✓
- `bookPageStart`/`bookPageEnd` = 246 / 257 ✓
- Heading text: `MEES, KES SELJATAS HIRMU` (visual rendering, caps + comma).

## Flagged blocks

None — low uncertainty throughout. One item worth noting for the wave log: the
story's `(7)` story-number sits at y≈53.53 on p278, which is BELOW the ET
running-header y-gate (< 45). The `y0 < 65 AND parenthesized-digit` guard
catches it cleanly and is unambiguous (no other line in the section matches
both). If a cross-wave story-number helper is ever factored, this widened
y-range should be the default for numbered stories.

## Schema proposals

None. All Wave 1–3 ET conventions fit this section cleanly. The earlier
pioneer-story template (`extract-tanulikkus-tegudes.py`) transferred
straightforwardly — parameters adjusted for heading text, drop-cap letter,
y-band for the italic deck, and the story-number y-threshold.
