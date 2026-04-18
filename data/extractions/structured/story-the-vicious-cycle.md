# story-the-vicious-cycle — extraction report

## Summary

Sixth story of Part II (Pioneers of A.A.), pages 234-246 (13 pages). 28 blocks
emitted: 1 `heading`, 27 `paragraph`. No verse, no footnote, no byline, no
list-item, no blockquote, no table. JSON parses and conforms to the extended
`BookSection` shape in the conventions doc.

A straightforward pioneer-story shape: title + italic-deck subtitle + drop-cap
+ 26 body paragraphs, ending without a signature. No editorial interlude
(contrasts with story-aa-number-three).

## Method

- PyMuPDF `page.get_text("dict")` per page, iterating pdf pages 234..246.
- Drop filters:
  - `y0 < 50 AND size <= 9.5` → drops size-9 running titles ("THE VICIOUS
    CYCLE" on verso pages 236/238/240/242/244/246 and "ALCOHOLICS ANONYMOUS"
    on recto pages 235/237/239/241/243/245).
  - `y0 < 50 AND digits-only` → drops the size-12 small-caps page numbers at
    top-of-page (`220`, `221`, `222`, ..., `231`).
  - digits-only text with `y0 > 500` → drops the bottom-of-first-page SC page
    number `219` on page 234.
  - `(N)` story-number prefix at top of first page — fires on `(5)` at y=79.13
    on page 234 (size 12.5 NewCaledonia). Dropped per conventions.
- Heading detection: size ≥ 13.0 at y < 130 on page 234 — catches the single
  line "THE VICIOUS CYCLE " at y=102.42 (size 13.5 NewCaledonia).
- Subtitle detection: italic font at size < 11.5 at y < 160 on page 234.
  Two lines (y=130.78 and y=144.59, both size 11 NewCaledonia-Italic), one
  first-line indent at x=76.28 and continuation at x=64.27 → one paragraph
  block (`p002`).
- Drop-cap detection: ParkAvenue font at size > 40 on page 234.
  **Unusual layout observed:** the "line" PyMuPDF reports at y=162.85 x=54.73
  contains BOTH the drop-cap glyph "J" AND the first body-text chunk on the
  same line ("anuary 8, 1938—that was my D-Day; the place,") — the drop-cap
  glyph is only 1 line tall in this story (contrast with most stories where
  the drop-cap spans ~3 body lines and the first body line wraps below it).
  Extraction strips the intervening null-char glyph (via `normalize_text`),
  keeps the concatenated text as-is: `"January 8, 1938—that was my D-Day;
  the place,"`, and merges it into the first body paragraph.
- Drop-cap wrap zone: lines at y within (dropcap.y0 + 5, dropcap.y0 + 45)
  that sit at x > body_margin + 15 are absorbed into the first body
  paragraph rather than starting new paragraphs. On page 234 the line at
  y=197.01 x=78.65 ("Washington, D.C. This last real merry-go-round") is
  such a line — correctly treated as continuation.
- Body prose: paragraphs split on first-line indent past body-margin.
  - Even pages (234, 236, 238, 240, 242, 244, 246): body margin 52.28,
    paragraph indent 64.28.
  - Odd pages (235, 237, 239, 241, 243, 245): body margin 69.28, paragraph
    indent 81.28.
- Cross-line hyphenation: full Wave-3 compound-prefix allowlist (`self-`,
  `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`, `one-` through
  `ten-`). Compound join inserts no space (per the Wave 3 dr-bobs fix).

## Schema decisions

### Heading text vs section title

- Section `title` = `"The Vicious Cycle"` (prose-case, metadata — unchanged
  from the prompt).
- `heading` block text = `"THE VICIOUS CYCLE"` (visual rendering, all caps).

Per conventions: intentional divergence.

### Story-number verdict

**Present as `(5)` at y=79.13 on page 234** (size 12.5 NewCaledonia). Dropped
per conventions ("Do NOT emit as its own block ... Lean toward DROP — it is
structural numbering, not authored content"). This matches the prompt's
guidance.

### Subtitle verdict

Two italic lines (NewCaledonia-Italic size 11) on page 234 at y=130..145:

- `How it finally broke a Southerner's obstinacy and ` (x=76.28 — paragraph
  indent within the italic deck)
- `destined this salesman to start A.A. in Philadelphia. ` (x=64.27 —
  continuation)

Single first-line indent → **one paragraph block** (`p002`). Per conventions
("Default: emit as a single paragraph block"). Contrasts with
dr-bobs-nightmare which had three indents → three paragraph blocks. This
section's shorter deck is a natural one-paragraph description.

### Drop-cap verdict

ParkAvenue 51.65pt "J" at (x=54.73, y=162.85) on page 234. The drop-cap sits
at column 54.73 (just past even-page body margin 52.28). What is unusual:

PyMuPDF reports the drop-cap and the first body-text chunk as a SINGLE
text-"line" at y=162.85 with multiple spans:

- span 1: `"J"` at x=54.73 size 51.65 font ParkAvenue (the drop-cap)
- span 2: `"\x00"` at x=75.39 size 51.65 font ParkAvenue (null glyph)
- span 3: `"anuary 8"` at x=78.65 size 12.00 font NewCaledonia-SC
- span 4: `", "` at x=128.80 size 12.00 font NewCaledonia
- span 5: `"1938"` at x=135.29 size 12.00 font NewCaledonia-SC
- span 6: `"—that was my D-Day; the place, "` at x=159.29 size 12.00 font
  NewCaledonia

After `normalize_text` (ligature map + null-char strip), the concatenated
line text is: `"January 8, 1938—that was my D-Day; the place, "`. This
**already contains the drop-cap letter "J"** as the first character — no
separate merge step is needed. The safety check `if not merged_text.
startswith("J"): merged_text = "J" + merged_text` is a no-op for this
section, but kept for defensive symmetry with other extraction scripts.

Merge result: the line above becomes the first line of `p003`, with
subsequent body lines (y=197.01 onwards) absorbed via the drop-cap wrap
zone. Final first-paragraph text begins: "January 8, 1938—that was my
D-Day; the place, Washington, D.C. This last real merry-go-round had
started the day before Christmas..." — reading cleanly and correctly.

This layout pattern (drop-cap glyph + first body chunk on same PyMuPDF
"line") differs from all prior exemplars I checked (dr-bobs-nightmare:
drop-cap alone on its line, first body line below; aa-number-three: same).
Noted as a pattern variant for future agents; extraction handled it
without an issue.

### Byline verdict

**No byline.** The story ends at y=258.63 on page 246 with `"sobriety."`
(the final word of a body-prose sentence: "And I still say that as long as
I remember that January 8 in Washington, that is how long, by the grace of
God as I understand Him, I will retain a happy sobriety."). No signature,
no attribution line, no "—Joe M." style sign-off. No `byline` block
emitted.

(The author is implicitly Jim B., the Southerner who started A.A. in
Philadelphia — this is well-known A.A. history — but the source text does
not render an author byline here.)

### Blockquote verdict

**No blockquote.** I checked specifically for the editorial-interlude
pattern (smaller font, own indent column, parenthetical stage directions)
per the prompt's note about the story-aa-number-three pattern. This story
has no such interlude. One parenthetical aside exists on page 241-242
("(This is very useful knowledge in places where matches are prohibited.)")
but it is ordinary size-12 body prose inside a paragraph, not a structural
inset. Correctly kept inline within `p019`.

### Font-anomaly notes (not structural)

PyMuPDF reports some mid-paragraph body-prose lines as `NewCaledonia-Italic`
or `NewCaledonia-SC` based on the first-span font. These are not
semantically italic or small-caps; they are body prose whose first token
happens to render in those fonts:

- Page 244 y=185.63 x=52.28 size 12 font `NewCaledonia-Italic`: `"had to
  make it tough; if they hadn't, I don't think I "` — mid-paragraph
  continuation of `p023`.
- Page 245 y=98.02 x=69.28 size 12 font `NewCaledonia-SC`: `"1940. Then I
  got a very good position in Philadelphia "` — the first span is the
  small-caps year `"1940"`.

These did not produce spurious structural blocks because subtitle/heading
detection is scoped to page 234 (first page) and paragraph-boundary
detection is based on x-coordinate alone (not font). Body prose correctly
absorbs these lines as continuation.

### Hyphenation — spot audit of all cross-line hyphens

46 cross-line hyphen splits detected. Full audit:

| Page | Left | Right | Action | Correct? |
|---|---|---|---|---|
| 234 | `an-` | `other` | strip → `another` | yes |
| 235 | `laugh-` | `ing` | strip → `laughing` | yes |
| 235 | `Alco-` | `holics` | strip → `Alcoholics` | yes |
| 235 | `tremen-` | `dous` | strip → `tremendous` | yes |
| 236 | `physi-` | `cian` | strip → `physician` | yes |
| 236 | `demand-` | `ing,` | strip → `demanding,` | yes |
| 236 | `alco-` | `holism—my` | strip → `alcoholism—my` | yes |
| 236 | `inti-` | `mate` | strip → `intimate` | yes |
| 236 | `aver-` | `sion` | strip → `aversion` | yes |
| 237 | `after-` | `wards` | strip → `afterwards` | yes |
| 237 | `sud-` | `den,` | strip → `sudden,` | yes |
| 238 | `em-` | `ployees` | strip → `employees` | yes |
| 238 | `oper-` | `ated` | strip → `operated` | yes |
| 238 | `irre-` | `sponsible` | strip → `irresponsible` | yes |
| 239 | `conven-` | `tion,"` | strip → `convention,"` | yes |
| 239 | `chal-` | `lenge,` | strip → `challenge,` | yes |
| 239 | `puz-` | `zle` | strip → `puzzle` | yes |
| 240 | `"re-` | `ward"` | strip → `"reward"` | yes |
| 240 | `worth-` | `while."` | strip → `worthwhile."` | yes |
| 240 | `al-` | `coholics` | strip → `alcoholics` | yes |
| 240 | `uncon-` | `scious` | strip → `unconscious` | yes |
| 241 | `busi-` | `ness?` | strip → `business?` | yes |
| 241 | `sud-` | `denly` | strip → `suddenly` | yes |
| **241** | **`so-`** | **`called`** | **keep** → `so-called` | **yes (allowlist)** |
| 241 | `peri-` | `odic` | strip → `periodic` | yes |
| 242 | `prohib-` | `ited.)` | strip → `prohibited.)` | yes |
| 242 | `direc-` | `tion,` | strip → `direction,` | yes |
| 242 | `automo-` | `bile` | strip → `automobile` | yes |
| 242 | `prin-` | `ciple` | strip → `principle` | yes |
| 242 | `for-` | `mula` | strip → `formula` | yes |
| 242 | `an-` | `other's` | strip → `another's` | yes |
| 242 | `meet-` | `ing` | strip → `meeting` | yes |
| 243 | `thou-` | `sand` | strip → `thousand` | yes |
| 243 | `inde-` | `pendent` | strip → `independent` | yes |
| 243 | `or-` | `dered` | strip → `ordered` | yes |
| 243 | `or-` | `dered,` | strip → `ordered,` | yes |
| **243** | **`ten-`** | **`dollar-a-week`** | **keep** → `ten-dollar-a-week` | **yes (allowlist)** |
| 243 | `see-` | `ing` | strip → `seeing` | yes |
| 243 | `bot-` | `tle.` | strip → `bottle.` | yes |
| 243 | `loneli-` | `ness` | strip → `loneliness` | yes |
| 244 | `deter-` | `mined` | strip → `determined` | yes |
| 244 | `recog-` | `nized` | strip → `recognized` | yes |
| 244 | `writ-` | `ten,` | strip → `written,` | yes |
| 244 | `com-` | `pletely` | strip → `completely` | yes |
| 245 | `alco-` | `holics` | strip → `alcoholics` | yes |
| 245 | `alco-` | `holic,` | strip → `alcoholic,` | yes |
| 246 | `Janu-` | `ary` | strip → `January` | yes |

All 46 cross-line hyphens resolved correctly. Two compound-keep cases fire
via the Wave-3-final allowlist (`so-` and `ten-`), producing `so-called` and
`ten-dollar-a-week` respectively.

## Flagged blocks

All 28 blocks look clean. Noting a few longer paragraphs for a second
look, all verified single-paragraph in source:

- `p006` (1029 chars, page 235) — "Jackie arrived about seven in the
  evening..." through "while before I had never known what a real night's
  sleep was." Single paragraph in source, bounded by first-line indents at
  both ends (page 235 y=98.02 starts `p006`; page 235 y=390.10 starts
  `p007`). Correct.

- `p011` (1184 chars, page 237) — "At seventeen I entered the university..."
  through "...nearly kicked out for scholastic failure." Single paragraph.

- `p012` (1295 chars, page 237-238) — "In the spring of 1917, in order to
  beat being fired from school, I became 'patriotic' and joined the army..."
  through "...I was a confirmed alcoholic at nineteen." Spans pages 237-238;
  single paragraph in source, correctly merged via the normal body-prose
  logic (no page-boundary split because the next line on page 238 at
  y=54.22 x=52.28 is continuation-column, not first-line-indent).

- `p017` (1308 chars, page 240) — "After the tire job came the thirties..."
  through "...with no recollection of what had happened." Single paragraph;
  the embedded inline quoted phrases (`"reward"`, `"What's the use—nothing
  is worthwhile."`, `"What did I do this time?"`) stay inline per
  dialogue-handling convention.

- `p019` (1996 chars, page 241-242) — the longest block. "This was the
  background that made me willing to listen on January 8..." through
  "...sobered up my sponsor all by myself!" Single paragraph in source
  (bounded by first-line indent at y=156.44 on p241 and next-para indent
  at p242 y=244.06). Contains the inline parenthetical "(This is very
  useful knowledge in places where matches are prohibited.)" — correctly
  inline, not a blockquote.

- `p021` (1911 chars, page 242-243) — "At that time the group in New York
  was composed of about twelve men..." through "...I never saw either of
  them again." Single paragraph including direct-speech turns ("Three
  beers.", "I'll be seeing you, boys,"). Dialogue stays inline per
  conventions.

- `p025` (1248 chars, page 244-245) — "After the book appeared..." through
  "...the dividends have been tremendous." Single paragraph; bridges
  page 244/245 correctly.

## Schema proposals

No new proposals. Every structural element in this section is covered by
the current conventions doc:

- Standard story shape (heading + italic-deck subtitle + drop-cap body +
  26 paragraphs + no byline).
- Story-number drop per conventions.
- Drop-cap merge per conventions (the drop-cap-letter-continues-partial-word
  case — "J" + "anuary" → "January", no space).
- Cross-line hyphenation handled by Wave-3-final allowlist with no new
  additions needed.

One observation worth noting for future agents, if Plantin thinks it useful:

- **Drop-cap layout variant** — PyMuPDF occasionally reports the drop-cap
  glyph and the first body-text chunk as a single text-"line" (shared y0
  bbox, multiple spans with different sizes and fonts). This happens when
  the drop-cap is only ~1 body-line tall in height, rather than the ~3
  body-lines-tall drop-caps in prior exemplars. Extraction scripts that
  assumed "drop-cap is alone on its line and first body starts on the
  NEXT y" would miss the embedded first-body-chunk. The fix is to treat
  the drop-cap line's own text (after null-char strip + ligature normalize)
  as the first chunk of the first body paragraph — which is what this
  script does. Not a schema issue; a heuristic note.

## Uncertainties

None blocking. The extraction is clean. The one judgment call — treating
the drop-cap PyMuPDF "line" as the first body-text source because it
contains both the glyph and the first body chunk — has been verified by
comparing the output `p003` text against the source: it reads cleanly
starting with "January 8, 1938—that was my D-Day; the place, Washington,
D.C. This last real merry-go-round had started..." with correct word
boundaries and punctuation.

## Block counts by kind

| Kind       | Count |
|------------|-------|
| heading    | 1     |
| paragraph  | 27    |
| **total**  | **28** |

Sanity-check: heading (1) + subtitle paragraph (1) + body paragraphs (26)
= 28. Body-paragraph count reasonable for 13 pages (~2 per page for a
longer pioneer story).
