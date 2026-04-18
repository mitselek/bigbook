# story-aa-number-three — extraction report

## Summary

Third story of Part II (Pioneers of A.A.), pages 197-207 (11 pages). 41 blocks
emitted: 1 `heading`, 28 `paragraph`, 12 `blockquote`. No verse, no footnote,
no byline, no list-item, no table. JSON parses and conforms to the extended
`BookSection` shape in the conventions doc.

The standout structural feature of this section is an **editorial interlude**
on pages 203-204 (the Editors insert Bill W.'s first-person account of the
same meeting). It is set in 10pt body-font at its own indent column, bracketed
by parenthesized stage directions. Emitted as 12 consecutive `blockquote`
blocks — the first documented use of the `blockquote` kind in Wave 4 output.

## Method

- PyMuPDF `page.get_text("dict")` per page, iterating pdf pages 197..207.
- Drop filters:
  - `y0 < 50` → drops running headers (size-9 "ALCOHOLIC ANONYMOUS NUMBER
    THREE" on verso pages and "ALCOHOLICS ANONYMOUS" on recto pages, plus the
    small-caps page numbers).
  - digits-only text with `y0 > 500` → drops the bottom-of-first-page SC page
    number ("182" on page 197).
  - `(N)` story-number prefix at top of first page — fires on `(1)` at y=79.13
    on page 197. **Dropped per conventions.** (See "Story-number verdict".)
- Heading detection: size ≥ 13.0 at y < 140 on page 197 — catches both
  "ALCOHOLIC ANONYMOUS " (y=102) and "NUMBER THREE " (y=122). Merged into a
  single `heading` block joined by a space.
- Subtitle detection: italic font at size < 11.5 at y < 200 on page 197.
  Three lines, one first-line indent at x=93.28, continuations at x=81.27 →
  one paragraph block.
- Drop-cap: `ParkAvenue 51.65pt` "O" at (x=68.19, y=201.78) on page 197.
  First body line after it is NewCaledonia-SC size 12 at x=97.03 y=214.98
  starting with "ne of ﬁve children...". Partial-word continuation — merged
  without a space: "O" + "ne" = "One".
- Drop-cap wrap zone: lines within y in (dropcap.y0 + 5, dropcap.y0 + 45)
  that sit at x > body_margin + 15 are absorbed into the first body
  paragraph rather than starting new paragraphs.
- Body prose: paragraphs split on first-line indent past body-margin.
  - Odd pages (197, 199, 201, 203, 205, 207): body margin 69.28, paragraph
    indent 81.28.
  - Even pages (198, 200, 202, 204, 206): body margin 52.28, paragraph indent
    64.28.
- Editorial-interlude detection: size 9.5..10.5 on pages 203-204.
  Inset has its own body margin column (p203: base 81.28 / indent 93.28;
  p204: base 64.28 / indent 76.28). Paragraph-split within the inset is
  first-line indent past the inset body-margin + 8.
- Cross-line hyphenation: full Wave-3 compound-prefix allowlist
  (`self-`, `well-`, `co-`, `non-`, `semi-`, `anti-`, `multi-`, `so-`,
  `one-` through `ten-`).

## Schema decisions

### Heading text vs section title

- Section `title` = `"A.A. Number Three"` (prose-case, metadata — unchanged
  from the prompt).
- `heading` block text = `"ALCOHOLIC ANONYMOUS NUMBER THREE"` (visual
  rendering; note `A.A.` expanded to `ALCOHOLIC ANONYMOUS` in the heading, as
  the prompt flagged).

The visual expansion (`A.A.` → `ALCOHOLIC ANONYMOUS`) is intentional and
preserved exactly as rendered.

### Story-number verdict

**Present as `(1)` at y=79.13 on page 197** (size 12.5 NewCaledonia). Dropped
per conventions ("Do NOT emit as its own block ... Lean toward DROP — it is
structural numbering, not authored content").

Note: the prompt's section-spec said `(2)` but the PDF renders `(1)`. Either
value is dropped by the `re.match(r"^\(\d+\)\s*$", ...)` filter. The actual
number probably reflects position within a sub-ordering of Part II stories
that excludes Dr. Bob's Nightmare (which has no `(N)` prefix at all). Not
material — dropped either way.

### Subtitle verdict

Three italic lines (NewCaledonia-Italic size 11) on page 197 at y=150..177:

- `Pioneer member of Akron's Group No. 1, the ﬁrst ` (x=93.28 — paragraph
  indent within the italic deck)
- `A.A. group in the world. He kept the faith; therefore,` (x=81.27 —
  continuation)
- `he and countless others found a new life. ` (x=81.27 — continuation)

Single first-line indent → **one paragraph block** (`p002`). Per conventions
("Default: emit as a single paragraph block"). Contrasts with dr-bobs-nightmare
which had three indents → three paragraph blocks.

### Drop-cap verdict

ParkAvenue 51.65pt "O" at (x=68.19, y=201.78) on page 197. The glyph sits at
column 68 (past even-page body margin 52.28, before odd-page body margin
69.28 — note page 197 is odd so the drop-cap sits AT body margin per the
Wave 2 observation). Next body line is `ne of ﬁve children, I was born on a
Kentucky ` at x=97.03 y=214.98 (shifted right to wrap around the glyph).

Merge: "O" (single letter, continues the partial word "One") + "ne of ﬁve
children..." = `"One of ﬁve children..."` — no space, because the drop-cap
letter completes a single word. Per conventions guidance.

The following lines at y=229..288 on page 197 also indent past body-margin
(some at x=97.03, some at x=69.27) to wrap around the glyph shape; treated
as continuations of the first paragraph via the drop-cap wrap zone.

### Editorial interlude (blockquote)

**First-time use of `blockquote` kind in Wave-4 output.**

From y=244.37 on page 203 ("(At this point, the Editors intrude...") to
y=333.77 on page 204 ("(Bill D. now continues his story.)"), a size-10 inset
passage interrupts Bill D.'s first-person narrative to supply Bill W.'s
first-person account of the same meeting. The inset is typographically
distinct:

- Smaller font (10pt vs body 12pt).
- Its own indent column (inset bm 81.28 on odd page 203, 64.28 on even page
  204 — i.e. the inset is indented roughly 12pt inside the page body margin).
- Bracketed by Editor-voice parenthetical stage directions.

This is the textbook case for `blockquote`: content voiced by a different
speaker/source, set apart typographically. Emitted as 12 blockquote blocks
(one per in-deck paragraph):

- `q023` — Editor stage direction opening the interlude (`(At this point...) Says Bill W.:`)
- `q024` — Bill W.: "Nineteen years ago last summer..."
- `q025` — Bill W.: "Two days before this..." (dialogue with Dr. Bob)
- `q026` — Bill W.: "Yes, she did have a customer—a dandy..."
- `q027` — Bill W.: "Bill didn't seem too impressed..." (Bill D.'s skepticism)
- `q028` — Bill W.: "Then Dr. Bob said, 'Well, Bill, maybe you'll feel better tomorrow...'"
- `q029` — Bill W.: "'Sure I would,' replied Bill..."
- `q030` — Bill W.: "Looking in later, we found Bill with his wife, Henrietta..."
- `q031` — Bill W.: "Bill then related how he had lain awake nearly all night..."
- `q032` — Bill W.: "Before our visit was over..."
- `q033` — Bill W.: "A.A.'s Number One Group dates from that very day."
- `q034` — Editor stage direction closing the interlude (`(Bill D. now continues his story.)`)

Defensible alternatives considered:

- **All as paragraph** — loses the typographic distinction, mis-presents
  Bill W.'s voice as Bill D.'s narrative, incorrect.
- **One single blockquote block containing all 12 paragraphs** — loses the
  paragraph structure visible in the source; the reader would experience a
  single wall of text. Conventions say "one block per paragraph" is the
  default; no reason to deviate.
- **Separate `editorial-note` or `interlude` kind for the stage directions
  q023 and q034** — technically Editor-voice vs Bill-W-voice, but both are
  typographically identical within the inset (same font, same size, same
  indent column). Not worth a new schema kind; they are all contents of the
  same editorial aside. Kept uniform as blockquote.

### Byline verdict

**No byline.** The story ends with "I feel that is about the most wonderful
thing that a person can do." at y=287.88 on page 207, followed only by
whitespace. No sign-off, no attribution line. (Bill D. is the author; the
subtitle already attributes authorship via "Pioneer member of Akron's Group
No. 1".) No `byline` block emitted.

### Hyphenation

24 cross-line hyphen splits in this section. Full spot-check:

| Token end | Next word | Action | Correct? |
|---|---|---|---|
| **`well-`** (p197) | **`to-do`** | **keep** → `well-to-do` | **yes (allowlist)** |
| `entertain-` | `ment,` | strip → `entertainment,` | yes |
| `univer-` | `sity,` | strip → `university,` | yes |
| `be-` | `cause` | strip → `because` | yes |
| `out-` | `side.` | strip → `outside.` | yes |
| `hospital-` | `ized` | strip → `hospitalized` | yes |
| `after-` | `wards` | strip → `afterwards` | yes |
| `talk-` | `ing` | strip → `talking` | yes |
| `talk-` | `ing` | strip → `talking` | yes |
| `appre-` | `ciate` | strip → `appreciate` | yes |
| `bot-` | `tom,` | strip → `bottom,` | yes |
| `with-` | `out` | strip → `without` | yes |
| `com-` | `pletely` | strip → `completely` | yes |
| `hos-` | `pital` | strip → `hospital` | yes |
| `cer-` | `tainly` | strip → `certainly` | yes |
| `any-` | `body` | strip → `anybody` | yes |
| `hav-` | `ing` | strip → `having` | yes |
| `reluc-` | `tantly,` | strip → `reluctantly,` | yes |
| `aw-` | `ful` | strip → `awful` | yes |
| `some-` | `thing` | strip → `something` | yes |
| `hospi-` | `tal,` | strip → `hospital,` | yes |
| `terri-` | `ble` | strip → `terrible` | yes |
| `peo-` | `ple` | strip → `people` | yes |
| `pur-` | `pose` | strip → `purpose` | yes |

The `well-` / `to-do` case is the only compound-hyphen split in this section,
and the Wave-3-final allowlist handles it correctly via the existing `well-`
entry. No further allowlist extensions needed. (The `one-half` / `two-thirds`
style fractions noted in dr-bobs-nightmare do not appear here; those rules
already in the allowlist remain valid but do not fire.)

## Flagged blocks

All 41 blocks look clean. Noting a few for a second look:

- `p017` (page 200, 773 chars) — "After a while, Bill said, 'Well, now,
  you've been talking a good long time, let me talk a minute or two.'" ...
  A long paragraph spanning most of the lower half of page 200 and top of
  page 201. Multiple embedded direct-speech turns. Bounded by first-line
  indents; no split needed. Embedded quotes do NOT trigger verse or
  blockquote — correct per ch02 precedent.

- `p021` (page 202, 1013 chars) — "One of the fellows, I think it was Doc,
  said, 'Well, you want to quit?' ..." long dialogue paragraph. Single
  first-line indent in the source; emitted as one paragraph. The embedded
  `“You are an alcoholic.”` stays inline.

- `q023` (blockquote, page 203) — "(At this point, the Editors intrude just
  long enough to supplement Bill D.'s account, that of the man on the bed,
  with that of Bill W., the man who sat by the side of the bed.) Says Bill
  W.:". This is the Editor's stage-direction opening. Included in the
  blockquote run (same font/size/indent column as the rest of the inset).
  Defensible choice; see "Editorial interlude" above.

- `q033` (blockquote, page 204) — "A.A.'s Number One Group dates from that
  very day." A single-line paragraph within the inset (the closing thesis
  of Bill W.'s account). Stand-alone paragraph in the source (first-line
  indent at x=76.28, continuation nothing). Correct as its own blockquote
  block.

## Schema proposals

No new proposals in this section. The `blockquote` kind and the extended
allowlist already in conventions cover every structural element here.

Two minor observations for the evolution log, if Plantin thinks they're
worth codifying:

1. **Editorial-interlude pattern** — recording the specific typographic
   signature used here (smaller font, own indent column, bracketed by
   parenthetical stage directions) as a known case where `blockquote` is
   appropriate. This is the first Wave-4 use of the kind; documenting the
   signature may help later waves recognize similar patterns quickly.

2. **Drop-cap letter forming a complete word** — the Wave-2 Gratitude guidance
   said: "When it's the first letter of a word continued on the next line
   (`W` + `ar` → `War`), no space." This story's "O" + "ne" → "One" is the
   same pattern (partial-word continuation, no space), confirming the
   guidance works cleanly. No change; noting consistency.

## Uncertainties

None blocking. The extraction is clean. The only judgment call — the 12-way
split of the editorial interlude into blockquote blocks vs collapsing into
one or coalescing Editor-voice stage directions separately — was made to
honor the source's paragraph structure and the conventions doc's default of
"one block per paragraph".

## Block counts by kind

| Kind       | Count |
|------------|-------|
| heading    | 1     |
| paragraph  | 28    |
| blockquote | 12    |
| **total**  | **41** |

Sanity-check: heading (1) + subtitle paragraph (1) + body paragraphs (27) +
blockquote paragraphs (12) = 41. Body-paragraph count reasonable for ~9 pages
of main narrative (the inset takes ~1.5 pages out of the 11-page section).
