# story-meie-sober-lounast — extraction notes

## Summary

Estonian translation of `story-our-southern-friend`. Eleven-page personal story by a pioneer A.A. farmer and minister's son. PDF pages 240–250 (book pages 208–218). Emitted **65 blocks** = 1 heading + 64 paragraphs (1 italic deck + 63 body). **Exact block-count parity with the EN exemplar (65).** Zero verses, zero list-items, zero blockquotes, zero footnotes, zero bylines, zero tables — pure narrative prose with a single drop-cap opener.

Per the Wave-4 brief: "verse-discipline stress test." Five candidates considered; **zero verses emitted**, matching the EN extraction's discipline.

## Method

- PyMuPDF `get_text("dict")` per-line spans; sorted by `(page, y0, x0)`.
- ET running-header drop gate: `y0 < 50 AND (size <= 11.5 OR isdigit)`.
- Extra drop rule on page 240: line starts with `(` and ends with `)` at `y < 85` — catches the `(4)` story-number prefix (rendered at y≈70.60 below the 35pt running header zone).
- Bottom-of-page numeric-only footer drop: `isdigit AND size <= 11.5 AND y0 > 520` — catches the `208` on page 240 at y=530.79.
- Heading detection: page 240, size 13.5–15.0, text starts with `MEIE`.
- Drop-cap detection: page 240, `BrushScriptStd`, size ≥ 20 → glyph `M` at (x=54.69, y=148.00, size=33.00).
- Italic deck: page 240, `NewCaledoniaLTStd-It`, y-range 100–140. Both visual lines flow as one prose sentence; emitted as one `paragraph` block (matches EN default).
- Body paragraph boundary: `64 <= x0 < 80` (indent at x≈68.03 vs body margin x≈56.69).
- Drop-cap wrap-zone: page 240, `148 <= y0 <= 175` and `95 <= x0 <= 110` — body lines inside this band are wraps around the `M` glyph, not new paragraphs. Wide-glyph `M` uses +35 offset vs body margin → x≈92 → visible wrap at x≈98.
- Cross-page split signal (ET refinement): when a new page starts AND the previous line ends with `.`, `!`, or `?` (terminal punctuation) AND does NOT end with soft hyphen, flush current paragraph. Applied because ET sometimes starts a new paragraph at body margin x=56.69 (not indent) at the top of a page — the indent signal alone is insufficient. Observed at p244→p245.
- Line-join rules (ET): strip trailing `U+00AD`, join no-space; strip trailing `-` + lowercase start, join no-space; en-dash/minus (`–`/`−`) space-padded; em-dash no-space.

## Schema decisions

- **Story-number prefix `(4)`**: **dropped** per ET conventions (structural numbering, not authored content). Filtered by `re.match(r"^\(\d+\)\s*$", stripped)` at `y < 85` on page 240.
- **Heading**: `MEIE SÕBER LÕUNAST` emitted as the visual all-caps rendering, diverging intentionally from the metadata `title` field `Meie sõber lõunast` (prose case) per conventions.
- **Italic deck**: emitted as a **single `paragraph`** block. Both visual lines flow as one sentence: `Üks AA teerajajatest, pastori poeg ja farmer lõunast küsis: ”Kes olen mina ütlema, et Jumalat pole olemas?”`. Matches EN exemplar's single deck paragraph and the Wave-1 `tanulikkus` precedent for two-line decks that are one sentence.
- **Drop-cap `M`**: merged with first body line `u isa on…` → `Mu isa on…` (no space). Wide-glyph wrap-zone `+35` applied; `BrushScriptStd` at 33pt confirmed.
- **No byline**: story ends on body prose `Ma sain aru, et ausus on tõde ja et tõde teeb meid vabaks!` — no author sign-off or italic attribution. Matches EN (p065 last paragraph, no byline).
- **Cross-page split rule**: added a terminal-punctuation cross-page heuristic because p244 ends `…Äi jääb tema juurde.` and p245 starts a topic-change paragraph at body margin x=56.69 (no indent). EN's exemplar has the same boundary as a SPLIT; ET needs the terminal-punctuation signal because its first-line-of-page indentation is not always present for new paragraphs. Four split points triggered by this rule: p240→p241, p243→p244, p244→p245, p245→p246, p248→p249. All verified to match EN structure.

## Verse verdict — **zero verses emitted**

Per the section-specific brief, this was a verse-discipline stress test. EN exemplar emitted **0** verses. ET extraction also emitted **0**. Five candidates considered:

### Candidate 1 — p240, scripture quote

Source (p240, y=456.95–500.45, at paragraph-start x=68.03, indented): `„Lase oma valgusel selliselt inimeste ees kiirata, et nad sinu väärt tööd näha võiksid.”`

This is the Matthew 5:16 citation, spoken by Father during a childhood memory. Rendered as **prose at the standard paragraph-indent**, not centered, not at a distinct x-column. The quotation **flows directly into** the narrator's continuation `Otsin viiesendist, et see annetustaldrikule poetada nii, et mu annetus nähtav oleks.` on the same line (y=471.45) — a single authored paragraph.

**Verdict: paragraph (p006).** Opening `„` is not a verse signal. No consistent short-line form. Text flows into narrative prose.

### Candidate 2 — p241, song titles `"Hail, hail, the gang's all here"` / `"Sweet Adeline"`

Source (p241, y=498.41, at body margin x=56.69, inline): `”Hail, hail, the gang’s all here” ja ”Sweet Adeline” ning…`

Two English-language song titles quoted inline as parenthetical references in the John Barleycorn paragraph. Not set off visually, not line-broken at verse-like positions, wrapped at standard body width.

**Verdict: paragraph (p012).** Titles quoted inline, not song-lyric verse.

### Candidate 3 — p245–p247, dialogue exchanges between narrator and "the man"

Multiple short turns like `„Ma tean seda,” vastan.`, `„Jah,” vastan ma.`, `„Ma olen kõigeks valmis,” vastan ma.` rendered at paragraph-indent x=68.03. Short lines, but typographically identical to surrounding paragraphs — not centered, not bracketed, no blank-line setoff.

**Verdict: paragraph (p036, p042, p047).** Short line length alone is not verse. Shared x-coord is the paragraph-indent, not a distinct verse column. These are dialogue turns.

### Candidate 4 — p247, inner-voice thought (italic)

Source (p247, y=77.91–106.91): `Korraga tabas mind mõttesähvatus nagu piksenool. See oli hääl: „Kes oled sina ütlema, et Jumalat ei ole olemas?” See heliseb mu peas, ma ei saa sellest lahti.`

The line at y=106.91 (`olemas?” See heliseb mu peas, ma ei saa sellest lahti.`) is rendered in **NewCaledoniaLTStd-It** — italic. The preceding quote and lead-in are regular. Only the trailing clause is italicized — opposite of the EN layout (where the quote itself is italic), but the semantic structure is identical: an inner-voice thought set within narrator prose.

**Verdict: paragraph (p044).** Italic alone is a weak split signal (conventions). Same x-coord as surrounding prose. No blank-line bracketing. Part of a single authored paragraph in the source.

### Candidate 5 — p247, prayer text inside dialogue

Source (p247, y=266.41–324.41): `„Nii see ei käi,” jätkas ta. „Mina ütlen seda nii: „Jumal, siin ma olen koos kõigi oma jamadega. Olen asjad kihva keeranud ja ei suuda midagi muuta. Võta mind, koos kõigi mu muredega ja tee minuga, mida iganes soovid.” Kas see vastab su küsimusele?”`

The "man" quotes a model prayer inside his own dialogue turn. Rendered inline across the standard body-width lines, no centered form, no blank-line bracketing.

**Verdict: paragraph (p048).** A dialogue turn containing a model prayer, not standalone verse.

### Summary

- **Verse blocks emitted: 0.**
- **Verse signals checked per conventions:** short-line length, shared centered x-coord, blank-line or quote bracketing. **No candidate met all three.**
- Every prior "verse" in this story is either dialogue, italicized inner thought, or an inline scripture/song citation — all of which ET conventions direct to keep in `paragraph`.

## Front-matter verdicts

- **Heading block**: emitted. Text `MEIE SÕBER LÕUNAST` (all-caps visual). Size 14pt, NewCaledoniaLTStd, page 240.
- **Deck / subtitle block**: emitted as a single `paragraph`. Text `Üks AA teerajajatest, pastori poeg ja farmer lõunast küsis: ”Kes olen mina ütlema, et Jumalat pole olemas?”` — two visual lines of 12.5pt italic deck (NewCaledoniaLTStd-It) joined into one sentence.
- **Story-number `(4)`**: dropped. Filtered from page 240 at `y=70.60` (below the running-header zone but above the heading) via parenthesis-number regex.
- **Running title `MEIE SÕBER LÕUNAST` (top of odd pages 241/243/245/247/249)**: dropped via running-header gate (y<50 + size≤11.5).
- **Running title `ANONÜÜMSED ALKOHOOLIKUD` (top of even pages 242/244/246/248/250)**: dropped via same gate.
- **Running page numbers (209–218 at top, `208` at bottom of p240)**: dropped via running-header gate or bottom-footer gate.
- **Drop-cap**: merged with first body line. `M` + `u isa` = `Mu isa` (no space). BrushScriptStd 33pt on page 240, consistent with ET convention (not ParkAvenue 51pt EN pattern).
- **No byline**: last paragraph is body prose, no author attribution.

## Source quirks preserved (not bugs)

- **p004 `ulub ümber. maja.`** — stray `.` between `ümber` and `maja` on page 240 (source: y=369.95 `ja ulub ümber. maja. Mul on soe ja turvaline.`). Appears to be a source typo; preserved verbatim per ET fidelity-over-correction convention.
- **Opening curly quotes `”Hail, hail…”` / `”Sweet Adeline”`** (p012) — the translator used right-quote `”` (U+201D) as opening on both sides for the English song titles rather than the ET standard opening `„` (U+201E). Source-faithful rendering.
- **Likewise in p002 deck**: `”Kes olen mina…”` uses `”` opener (U+201D) rather than `„`. Preserved verbatim.

## Flagged blocks

- **p044 (italic inner-voice thought)** — the continuation clause `See heliseb mu peas, ma ei saa sellest lahti.` is italic (NewCaledoniaLTStd-It) while the preceding quote and lead-in are regular. Kept inline per conventions (italic alone is not a split signal). Block boundary aligns with EN's p044.
- **p006 (scripture + nickel continuation)** — scripture quote and the narrator's following action (`Otsin viiesendist…`) are joined in one paragraph because the PDF flows them on the same y=471.45 line. Matches EN's decision to keep them together.

## Schema proposals

None. Existing ET conventions cover every case:

- Running-header gate (`y < 50 AND size ≤ 11.5 OR isdigit`) worked cleanly.
- Story-number `(N)` drop worked via parenthesis regex.
- ET drop-cap (BrushScriptStd 33pt + wide-glyph wrap zone) worked unchanged.
- Italic-deck-as-single-paragraph default held.
- Cross-page terminal-punctuation heuristic (from parent EN conventions) handled ET's lack-of-indent-at-page-top cases correctly.
- Soft-hyphen join, en-dash space-pad, real-hyphen + lowercase merge — all fired as expected.

One observation worth noting: **ET does not always show first-line indent at the top of a new page** (observed at p245, where a narratively-new paragraph starts at body margin x=56.69). The terminal-punctuation cross-page signal was required to catch this. Consider documenting in ET conventions that ET cross-page paragraph boundaries need the terminal-punctuation heuristic as a supplement to indent, not just right-margin-carry-over. (The parent EN conventions already list terminal-punctuation as an alternative; documenting for ET that it is often REQUIRED, not optional.)

## Counts

| kind | count |
|------|-------|
| heading | 1 |
| paragraph | 64 |
| **total** | **65** |

EN counterpart (`story-our-southern-friend`): 65 blocks (1 heading + 64 paragraphs). ET matches EN exactly. Zero verses in both.
