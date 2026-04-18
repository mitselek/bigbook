# story-jims-story — extraction report

## Summary

Seventh story of Part II (Pioneers of A.A.), pages 247-260 (14 pages). 32 blocks
emitted: 1 heading, 31 paragraphs. No verse, no footnote, no byline, no list-item,
no table, no blockquote. JSON parses. Schema conforms to the extended
`BookSection` shape in the conventions doc.

## Method

- PyMuPDF `page.get_text("dict")` per page, iterating pdf pages 247..260.
- Drop filters:
  - `y0 < 50 AND size <= 9.5` → drops running headers ("JIM'S STORY" at size 9 on
    even verso pages; "ALCOHOLICS ANONYMOUS" at size 9 on odd recto pages).
  - `y0 < 50 AND text is all digits` → drops 12pt small-caps page numbers at
    the top-of-page (e.g. "233" at y=37.24 on page 248, "234" on page 249, etc.).
  - `y0 > 500 AND text is all digits` → drops the bottom-of-first-page SC page
    number ("232" at y=540.74 on page 247).
  - `^\(\d+\)\s*$` on first page → drops the "(6)" story-number prefix at y=79.13.
- Per-page body-margin alternation exploited for paragraph-indent detection:
  - Odd pages (247, 249, 251, 253, 255, 257, 259): body margin 69.28, paragraph
    indent threshold 77.28 (body-margin + 8).
  - Even pages (248, 250, 252, 254, 256, 258, 260): body margin 52.28, paragraph
    indent threshold 60.28.
- Drop-cap merge: standalone-glyph layout. The `ParkAvenue` 51.65pt "I" at
  (x=71.73, y=185.66) on page 247 sits on its own PyMuPDF "line" — the first
  body-text chunk at y=198.86 x=94.53 begins "was born in a little town...". Because
  the drop-cap "I" is itself a complete word (pronoun), merge with a SPACE
  separator: "I was born in a little town in Virginia in an...".
- Drop-cap wrap zone: lines on page 247 with y in (185.66, 230.66) and x > 84.28
  are treated as continuations of the drop-cap paragraph, not new paragraphs.
  This captures the y=198.86 wrap-around line at x=94.53.
- Text normalization: ligatures (U+FB01 etc.) → ASCII digraphs; U+00AD soft
  hyphen stripped; U+0000 NUL byte stripped (observed after drop-cap: 'I\x00').
  Curly quotes preserved.
- Cross-line hyphen handling per conventions, plus Wave 6 section-scoped
  extension for ordinal-decade prefixes (see Schema decisions).

## Schema decisions

### Heading text vs section title

- Section `title` = `"Jim's Story"` (prose-case, metadata — straight ASCII
  apostrophe unchanged from prompt).
- `heading` block text = `"JIM'S STORY"` (visual rendering; the source uses a
  curly apostrophe U+2019, preserved per conventions).

### Story-number verdict

**Present and dropped.** A "(6) " line appears at (x=197.49, y=79.13) on page
247, size 12.5 NewCaledonia. Per conventions, decorative story-numbering is
dropped (structural, not authored content). The defensive drop rule
`^\(\d+\)\s*$` on the first page fires exactly once and removes it.

### Subtitle verdict

Three italic lines on page 247 (NewCaledonia-Italic size 11) at y=131.92..160.67:

```
                  This physician, one of the earliest members of A.A.’s
             first black group, tells of how freedom came as he
             worked among his people.
```

The first line is indented deeper (x=93.28) than the continuations (x=81.27) —
this is the single-paragraph pattern ("first-line indent + continuations"), not
a multi-paragraph deck. Emitted as **one paragraph block** (p002):
"This physician, one of the earliest members of A.A.'s first black group, tells
of how freedom came as he worked among his people."

### Drop-cap verdict

ParkAvenue 51.65pt "I" at (x=71.73, y=185.66) on page 247. Standalone on its own
line (unlike the vicious-cycle layout variant where the drop-cap and the first
body chunk share a single "line"). Next body line at y=198.86 x=94.53 reads
"was born in a little town in Virginia in an...". Because "I" is a standalone
word (pronoun), merged with a **space separator**: "I was born...". Conventions
guidance applied verbatim for the single-letter-pronoun case.

The single wrap line at y=198.86 x=94.53 is absorbed into the drop-cap paragraph
via the wrap-zone rule (y < 230.66 AND x > body-margin + 15). Subsequent lines
on page 247 return to x=69.28 (body margin) and continue the paragraph normally.

### Byline verdict

**No byline.** The story ends at y=287.88 on page 260 with "That's my story of
what A.A. has done for me." This is a short, terminal sentence with a period —
BUT it also begins with a first-line paragraph indent (x=64.28, paragraph
indent on an even page) and reads as narrative prose rather than author
attribution. Not typographically distinct from body paragraphs (same font, same
indent, no italic, no signature). Emitted as an ordinary `paragraph` block
(p032), not a byline.

### Verse verdict

**No verse.** No quoted poetry, no short-line centered blocks, no scripture
excerpts. The story is continuous narrative prose throughout.

### Footnote, list-item, table, blockquote verdicts

**None present.** No asterisk/dagger markers; no numbered or bulleted lists; no
tabular data; no editorial interlude passages in a distinct font/indent column.

### Hyphenation — compound-word allowlist extension

Per the Wave 3 conventions, the allowlist is:
`self-, well-, co-, non-, semi-, anti-, multi-, so-,
one-, two-, three-, four-, five-, six-, seven-, eight-, nine-, ten-`.

This section contains a cross-line break `twenty-` / `third` on page 255:

```
drinking all day on the twenty-
third, I must have decided
```

Default stripping would produce `twentythird`, which is malformed. `twenty-third`
is a genuine English compound (ordinal); the same paragraph also contains
`twenty-fourth` and `twenty-fifth` in their correct hyphenated forms. I added
the ordinal-decade prefixes (`twenty-`, `thirty-`, `forty-`, `fifty-`, `sixty-`,
`seventy-`, `eighty-`, `ninety-`) as a narrow section-scoped extension of the
allowlist. See Schema proposals below.

Full audit of cross-line hyphens in this section (36 total):

| Token end | Next word | Action | Correct? |
|---|---|---|---|
| `inhibi-` | `tions.` | strip → `inhibitions.` | yes |
| `Bap-` | `tist` | strip → `Baptist` | yes |
| `actu-` | `ally,` | strip → `actually,` | yes |
| `posses-` | `sive` | strip → `possessive` | yes |
| `associ-` | `ated.` | strip → `associated.` | yes |
| `acci-` | `dentally` | strip → `accidentally` | yes |
| `any-` | `one` | strip → `anyone` | yes |
| `cer-` | `tificate` | strip → `certificate` | yes |
| `mar-` | `ried` | strip → `married` | yes |
| `suf-` | `fered` | strip → `suffered` | yes |
| `remem-` | `ber` | strip → `remember` | yes |
| `Vir-` | `ginia` | strip → `Virginia` | yes |
| `Washing-` | `ton,` | strip → `Washington,` | yes |
| `intern-` | `ship` | strip → `internship` | yes |
| `trou-` | `bles` | strip → `troubles` | yes |
| `pathologi-` | `cally` | strip → `pathologically` | yes |
| `bot-` | `tles."` | strip → `bottles."` | yes |
| `week-` | `ends.` | strip → `weekends.` | yes |
| `decen-` | `tralized.` | strip → `decentralized.` | yes |
| `ser-` | `vice.` | strip → `service.` | yes |
| `Wash-` | `ington.` | strip → `Washington.` | yes |
| `drink-` | `ing.` | strip → `drinking.` | yes |
| `carry-` | `ing` | strip → `carrying` | yes |
| `pat-` | `tern.` | strip → `pattern.` | yes |
| **`twenty-`** | **`third,`** | **keep** → `twenty-third,` | **yes (via extension)** |
| `street-` | `car,` | strip → `streetcar,` | yes |
| `ba-` | `sically` | strip → `basically` | yes |
| `psychia-` | `trist` | strip → `psychiatrist` | yes |
| `pay-` | `day.` | strip → `payday.` | yes (see flagged blocks) |
| `elec-` | `trical` | strip → `electrical` | yes |
| `busi-` | `ness` | strip → `business` | yes |
| `some-` | `thing` | strip → `something` | yes |
| `him-` | `self.` | strip → `himself.` | yes |
| `Fi-` | `nally,` | strip → `Finally,` | yes |
| `con-` | `tinued` | strip → `continued` | yes |
| `in-` | `dividuals.` | strip → `individuals.` | yes |

35 of 36 resolved cleanly under the default rule; the 36th (`twenty-third`)
needs the Wave 6 extension. The `pay-`/`day.` → `payday.` join is documented
as ambiguous in flagged blocks.

## Flagged blocks

- **p003 (first body paragraph, page 247)** — 706-char opening paragraph. The
  drop-cap "I" is merged with the following body line at a space separator.
  Spot-check: the first sentence reads "I was born in a little town in Virginia
  in an average religious home." Correct.

- **p024 (page 257)** — contains the token `payday.` formed from the cross-line
  break `pay-` / `day.`. The same paragraph two sentences earlier has
  `"the twenty-fourth"` and the surrounding sentences mention `pay day` as two
  words elsewhere in the section ("took a few days off after pay day to celebrate"
  on page 255). The author's usage is inconsistent — both `pay day` (two words)
  and `pay-day` (hyphenated) appear in the source. Stripping the cross-line
  hyphen yields `payday` (one word), which is a valid compound spelling in
  modern English but may diverge from the author's intended `pay-day` here.
  Per conventions default (strip hyphen unless allowlist triggers), I left it as
  `payday.` This is a soft-edge case; noted but not changed.

- **p032 (final paragraph, page 260)** — "That's my story of what A.A. has done
  for me." A short, terminal, period-ending sentence. Not emitted as a byline
  because it has a first-line indent at the body-paragraph column (x=64.28 on an
  even page), appears in NewCaledonia body font (not italic/small-caps), and
  reads as the narrator's own closing line rather than an attribution. Compare
  ch01 `Bill W., co-founder of A.A., died January 24, 1971.` which is
  unambiguously a biographical metadata line in a distinct layout.

## Schema proposals

1. **Extend the compound-word prefix allowlist with ordinal-decade prefixes**
   (`twenty-`, `thirty-`, `forty-`, `fifty-`, `sixty-`, `seventy-`, `eighty-`,
   `ninety-`). Rationale: ordinal-decade compounds (`twenty-third`,
   `thirty-fifth`, `forty-first`, etc.) are genuine English compounds that
   appear in the source at cross-line breaks. They are parallel in structure to
   the small-number prefixes (`one-` through `ten-`) already in the allowlist
   (Wave 3 accepted). Without the extension, the default strip rule produces
   `twentythird` / `thirtyfifth` / etc. — malformed joins.

   Proposed addition to the conventions doc final allowlist:

   > `self-, well-, co-, non-, semi-, anti-, multi-, so-,
   > one-, two-, three-, four-, five-, six-, seven-, eight-, nine-, ten-,
   > twenty-, thirty-, forty-, fifty-, sixty-, seventy-, eighty-, ninety-`

   Spot-check: the ordinal-decade prefixes are unlikely to false-fire because
   they only appear as standalone tokens in number-compound contexts; they are
   not common English word prefixes the way `re-` / `pre-` are.

2. **Document the drop-cap "standalone pronoun `I`" rule more explicitly.** The
   conventions say to merge the drop-cap with the first body line and insert
   a space when the drop-cap is a standalone single-letter word. The dr-bobs
   exemplar hit this exact case (drop-cap "I" + "was born..."). Jim's Story is
   the second section with this pattern. Noting the pattern here for future
   agents: when the drop-cap glyph is on its own PyMuPDF "line" AND the next
   line starts with a lowercase letter that is NOT a word continuation
   (i.e., `was`, `is`, `will`, etc. — any English word that can stand alone
   after the pronoun `I`), insert a space. The conventions already cover this
   case ("When it's a standalone single-letter word like `I` followed by a
   complete separate word (`I believe`), insert a space"), Wave 3 evolution
   log — just flagging that the pattern recurs.

## Uncertainties

- **`payday.` vs `pay-day.`** (p024) — the source is ambiguous because the
  author uses both forms elsewhere in the section. Per conventions default,
  stripped. Could be fixed post-hoc via a section-level override if the
  canonical form ever becomes important.

## Block counts by kind

| Kind       | Count |
|------------|-------|
| heading    | 1     |
| paragraph  | 31    |
| **total**  | **32** |

Sanity-check: heading (1) + subtitle paragraph (1) + body paragraphs (30) = 32.
Body-paragraph count reasonable for 14 pages (~2.1 per page).
