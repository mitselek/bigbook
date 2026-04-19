# ch04 — Meie, agnostikud — extraction report

## Summary

Extracted **ch04-meie-agnostikud** (PDF pages 76..89, book pages 44..57) via PyMuPDF. Output contains **51 blocks**: 1 heading, 49 paragraphs, 1 footnote. **Zero verse**, zero blockquote, zero list-item, zero table, zero byline — matching the philosophical/religious-argument character of the chapter and EN ch04 exactly (EN is also 51/1/49/1).

All section-specific concerns called out in the prompt resolved cleanly:

1. **Philosophical/religious argument chapter** — pure body prose, handled with the ch02 extractor skeleton + ET conventions.
2. **Dialogue in paragraph** — two inline direct-speech passages on p88 (`„Kui Jumal ka on olemas…"` and `„On see võimalik…"` in `p044`) kept inside the surrounding paragraph per conventions. The single italic displayed rhetorical question on p88 (`„Kes oled sina ütlema, et Jumalat ei ole olemas?"`) sits at the paragraph-start indent (x=68.03), emitted as its own paragraph block `p045` — mirrors EN ch04 `p045` and ET ch02 `p043` precedents.
3. **Zero verse false-positives** — no quoted verse in this chapter; candidates were italic rhetorical questions and short sentences, but none had the shared-x / blank-surround / 6-line pattern that would trigger verse.
4. **Drop-cap `E`** (BrushScriptStd ~33pt on p76, x=56.69 y=100.65) merged cleanly with body line `'elmistest peatükkidest…'` → `Eelmistest peatükkidest…` (no space).
5. **Chapter label `4. peatükk`** (italic 12.5pt on p76 y=53) dropped per ET convention.
6. **Heading `MEIE, AGNOSTIKUD`** (14pt on p76 y=77) emitted at visual rendering; section `title` stays prose-case `Meie, agnostikud` per metadata/heading divergence.
7. **Soft-hyphen line-breaks** — ET's U+00AD mechanism handled correctly: 75 cross-line joins, 8 intra-line soft hyphens stripped (e.g. `sõprus\u00adkonda` → `sõpruskonda`, `nurga\u00adkivile` → `nurgakivile`, `mitte\u00adolemise` → `mitteolemise`, `mõtte\u00adsähvatus` → `mõttesähvatus`, `lähenemis\u00adviise` → `lähenemisviise`, `kõrge\u00adlennulisi` → `kõrgelennulisi`, `seisu\u00adkohalt` → `seisukohalt`, `mõtlemis\u00adviisi` → `mõtlemisviisi`).
8. **One footnote on p79** (TimesNewRomanPS-ItalicMT 10pt at y=518.4): `"* Palun lugege täiendavat infot „Vaimse kogemuse" kohta – Lisa II."` emitted with leading `*` preserved. Cross-references the body asterisk on p79 y=308.71 in `p012` (`…imetõhusa vaimse ehitise.*`).

## Method

- PyMuPDF `page.get_text("dict")` for per-line spans with font, size, bbox.
- Probe script: `.tmp/probe-ch04-et.py` dumped every content line with y0/x0/x1/size/font metadata.
- Extractor: `.tmp/extract-ch04-et.py` (adapts ch02-et skeleton).

Heuristics fired:

- Body font = NewCaledoniaLTStd ~12.5pt on every page.
- Running-header drop: `y0 < 45` AND (`size ≤ 11.5` OR digit-only). Strips p76-89 headers (`MEIE, AGNOSTIKUD` / `ANONÜÜMSED ALKOHOOLIKUD` / page numbers) at y≈35 size 11. Keeps the p76 section heading at y=77 size 14.
- Bottom page-number drop: digit-only `size ≤ 11.5` AND `y0 > 520` (e.g. `44` at y=530.79 on p76).
- `4. peatükk` italic 12.5pt label on p76 — dropped per conventions (regex `^\d+\.\s*peatükk\s*$`).
- Heading detection: `13.0 ≤ size ≤ 15.0` on p76 with text starting `MEIE`.
- Drop-cap: `BrushScript` font + `size > 20` on p76; merges with first body line at `y ≤ 115.0 AND x ≥ 80.0`.
- Drop-cap wrap-zone on p76: lines at `y ≤ 130.0 AND x ≥ 80.0` stay attached to current paragraph (second wrap line at y=120.30 x=85.53).
- Paragraph-start detector: `64.0 ≤ x0 ≤ 75.0` (body margin ~56.69, indent at x=68.03).
- Footnote detection: Times italic font, `size ≤ 10.5`, `y0 > 500`. One hit on p79.

Soft-hyphen join logic:

- Line ending with U+00AD → strip + no-space join.
- Line ending with `-` (U+002D) + next starts lowercase → strip + no-space.
- Line ending with U+2013 / U+2212 (en-dash / minus) AND original had trailing space before the dash → preserve space on join (space-padded mid-sentence rule).
- Default: single-space join.
- Residual intra-line U+00AD stripped at final join.

## Schema decisions

- **Heading text** is the visual rendering `MEIE, AGNOSTIKUD` (upper-case). Metadata `title` stays prose-case `Meie, agnostikud`.
- **Drop-cap merge** — `E` + `elmistest peatükkidest olete alkoholismi` → `Eelmistest peatükkidest olete alkoholismi` (no intervening space). The first two body lines wrap around the drop-cap glyph at x=85.53; they are kept in the same paragraph as the drop-cap merge line.
- **Italic displayed rhetorical question** on p88 y=440.72 x=68.03 emitted as standalone `p045` — sits at the paragraph-start indent, mirrors EN ch04 p045 and ET ch02 p043 precedents. Italics alone did not drive this; the indent did.
- **Inline italic phrase `Jõud. Ilmselgelt. Ent kust ja kuidas pidime selle Jõu`** on p77 y=179.41 (NewCaledoniaLTStd-It) is kept inline with `p006`. It sits at body margin x=56.69 (not indent), so no paragraph split per the "italics alone is a weak split signal" rule.
- **Asterisk cross-reference marker** `nurgakivile võib rajada imetõhusa vaimse ehitise.*` preserved in `p012` body text; the footnote block carries a leading `*` so the cross-reference survives at both ends — matches ch02 precedent.
- **Footnote placement** — emitted at the tail of the block list (`f051`) rather than inline at its visual page position, matching ch02 and EN ch04 convention.

## Flagged blocks

### Italic displayed rhetorical question

- **`ch04-meie-agnostikud-p045`** (p88): `„Kes oled sina ütlema, et Jumalat ei ole olemas?"`. Single-line italic paragraph at paragraph-start indent (x=68.03, y=440.72). See Schema decisions above for rationale. Same structure as EN ch04 p045.

### Minister's son anecdote (pp88-89)

- **`ch04-meie-agnostikud-p042`** through **`ch04-meie-agnostikud-p050`** (pp88-89): the third-person anecdote about the minister's son who has a spiritual experience in a hospital room. Nine paragraph blocks of ordinary prose (matches EN count exactly). No verse, no blockquote, no byline — body narrative, not an editorial interlude or story closing.

### Source quirks preserved verbatim

Per ET convention ("if the PDF renders a character, preserve it"):

- `"üksteise umber tiirutavatest"` in `p018` (likely should be `ümber`) — preserved.
- `"tähenda eimidagi"` in `p018` (could read as `tähenda eimidagi` or grammatical `tähendab eimidagi`) — preserved.
- `Eimidagi`/`eimillestki`/`eikuhugi` triple-negation compound words in `p018` — preserved.

None of these rise to an extractor bug; they are source-text characteristics.

### No cosmetic em-dash spacing issues in ET

Unlike EN ch04 which had 4 flagged em-dash line-break spacing artifacts (e.g. `life —or else.`), the ET text uses U+2013 en-dash / U+2212 minus with the explicit space-padded convention. The `prev_had_trailing_space` tracking in `join_paragraph_lines` yields clean output. Spot-checked all en-dash / minus occurrences (9 total in body); all produce `word – word` with correct single spaces.

## Block-count parity

- EN ch04: 51 blocks (1 heading + 49 paragraphs + 1 footnote).
- ET ch04: 51 blocks (1 heading + 49 paragraphs + 1 footnote).

Exact match — strong cross-language structural alignment, consistent with Wave 1-3 parity findings.

## Schema proposals

None. All conventions applied cleanly. The parent and ET-addition conventions documents fully covered this chapter. No new rules surfaced.

## Verse verdict

**Zero verse blocks emitted.** Scanned signals that could have mis-fired:

- Line-length < 50 chars: present at paragraph tails but at body margin, not shared-x center column, no blank-line grouping.
- Leading `„` quotes on lines: multiple rhetorical quoted speech passages (`„Kas ma nüüd usun…"`, `„Jumal"`, `„Kui Jumal ka on olemas…"`, `„On see võimalik…"`, `„Kes oled sina ütlema…"`, `„Me ei tea."`). All are inline dialogue within surrounding prose (or, in p045, a displayed rhetorical sentence at para-indent). None trigger verse.
- Italic displayed sentence (`p045`): at para-indent, not shared-x center column, not surrounded by blank lines. Paragraph, not verse.

## Drop-cap verdict

**Clean merge.** Drop-cap `E` (BrushScriptStd 33pt at x=56.69, y=100.65 on p76) merged into the first body line's text `elmistest peatükkidest olete alkoholismi` producing `Eelmistest peatükkidest olete alkoholismi` with no intervening space. Second wrap line at y=120.30 x=85.53 (`kohta üht-teist teada saanud. Loodetavasti `) kept attached via the drop-cap-wrap exception on p76 (`y ≤ 130` AND `x ≥ 80`). Third line at y=134.80 x=56.69 (body margin — drop-cap glyph has ended) continues the paragraph naturally.

## Footnote verdict

**One footnote (f051).** `* Palun lugege täiendavat infot „Vaimse kogemuse" kohta – Lisa II.` — references `p012`'s `…imetõhusa vaimse ehitise.*` on p79. Matches the EN ch04 footnote structure (`* Please be sure to read Appendix II on "Spiritual Experience."`), including cross-reference precedent.

## Artifact files

- `/home/michelek/Documents/github/bigbook/data/extractions/structured-et/ch04-meie-agnostikud.json`
- `/home/michelek/Documents/github/bigbook/data/extractions/structured-et/ch04-meie-agnostikud.md`
- `.tmp/extract-ch04-et.py` — extractor script (disposable)
- `.tmp/probe-ch04-et.py`, `.tmp/ch04-et-probe.txt` — debug probe
