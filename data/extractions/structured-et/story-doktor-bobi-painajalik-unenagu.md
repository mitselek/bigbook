# story-doktor-bobi-painajalik-unenagu — extraction notes

## Summary

Estonian translation of `story-dr-bobs-nightmare` (Dr. Bob, co-founder of A.A.,
first Pioneer story in Part II). PDF pages 203–213 (book pages 171–181). This is
a fresh re-run extraction for the cross-run repeatability test.

Emitted **39 blocks** = 1 heading + 34 paragraphs + 4 list-items. No
blockquotes, verses, footnotes, bylines, or tables. Structure matches the
Wave 3 dr-bob pattern: 3-paragraph italic deck + narrative body + 4-item
motivation list at end of p212.

## Method

- PyMuPDF `get_text("dict")` per-line spans; sorted by `(page, y0, x0)`.
- ET running-header drop gate: `y0 < 45 AND (size <= 11.5 OR isdigit)`.
- Bottom page-number drop: `y0 > 520 AND size <= 11.5 AND isdigit` (page 203
  has `171` at y≈530).
- Heading detection: page 203, size 13.5–15.0, text starts with `DOKTOR`.
- Drop-cap detection: page 203, `BrushScriptStd`, size ≥ 20 → glyph `S`.
- Italic deck: page 203, `NewCaledoniaLTStd-It`, y-range 70–225. **Three
  paragraph groups** separated by first-line indent at `x >= 64`.
- Body paragraph boundary: first-line indent at `64 <= x0 < 74` (body margin
  x=56.7, indent x=68.0, list-items sit at x=76.5 which is excluded).
- Drop-cap wrap-zone: page 203, `233 <= y0 <= 268` and `80 <= x0 <= 95` —
  body lines wrap around the narrow `S` glyph at x=83, not the wide-glyph
  x=100 band used for the `M`-drop-cap in `story-tanulikkus-tegudes`. Wrap
  ends when body returns to x=56.7 below the drop-cap's y-extent.
- List-item detection: page 212, x~76.5, regex `^\d+\.\s`. Continuations at
  x~92.7 join the current list-item.
- Line-join rules (ET): strip trailing `U+00AD`, join no-space; strip trailing
  `-` + lowercase start, join no-space; en-dash/minus `–`/`−` handled per ET
  conventions (space-padded).

## Schema decisions

- **First Pioneer story — no `(N)` prefix expected**. Confirmed: probe shows
  no parenthesized numbering line on page 203. Matches metadata note.
- **Italic deck → 3 paragraphs** (p002, p003, p004). Matches the Wave 3
  dr-bob pattern (11-line, 3-indented-group italic deck). Three clear
  first-line indents at `x=68` versus wrap-continuations at `x=56.7`.
- **Drop-cap `S`** (narrow-ish glyph): merged with first body line
  `ündisin...` → `Sündisin...` (no space). Wrap-zone x-band is 80–95
  (narrower than the `M`-drop-cap's 95–110 band) because the `S` glyph is
  narrower — body text wraps closer to the drop-cap's right edge.
- **4 list-items on p212** (l033–l036): "Kohusetundest.", "See valmistab...",
  "Sest niiviisi...", "Sest seda tehes...". Item 3 and item 4 each have a
  hanging-indent continuation at x=92.7 that is joined into the item. The
  `N.\t` prefix is stripped from each list-item's final text.
- **No byline**: story ends with `Sinu Taevane Isa ei vea sind iial alt!`
  (paragraph p039, starts at x=68 indent). No author sign-off line.
- **parentGroup** preserved verbatim as `personal-stories/pioneers-of-aa`.
- **Heading visual form preserved**: `DOKTOR BOBI PAINAJALIK UNENÄGU`
  (ALL-CAPS rendering). Section metadata `title` is prose-case
  `Doktor Bobi painajalik unenägu` per conventions.

## Source quirks preserved (not bugs)

- **`sõndest`** on page 207 (`Olin juhtunust, arsti sõndest või ilmselt
  mõlemast...`). Likely typo for `sõnadest` (words-of). Preserved verbatim
  — same class as Wave 1's `o1i` / `sõruskonna`.
- **`nn eksperimenti`** on page 209 — `nn` is the Estonian abbreviation for
  "nõnda nimetatud" (so-called). Source-faithful rendering.
- **`St Thomase haiglast`** (italic deck p004) — no period after `St`.
  Matches Wave 3 `arsti-arvamus` quirk class (`Doktor William D Silkworth`
  no period after `D`).
- **`„Puksiirlaev Annie” etendusele`** (p021) — curly quote usage
  `„...”` preserved per ET conventions.

## Flagged blocks

- `p022` (single-sentence paragraph on p208 y=440): `Ma ei hakka raiskama
  trükiruumi, et pajatada kõigist minu haigla- ja
  sanatooriumikogemustest.` — starts at x=68.0 with first-line indent,
  correctly emitted as its own paragraph block. Source presents it as a
  discrete thought.
- `l033`..`l036` (list items p212): ordinal stripping relies on regex
  `^\d+\.\s`. Verified all four items strip cleanly; continuations (items
  3 and 4) join to form complete sentences.
- `p005` (drop-cap opener): merged `S` + `ündisin väikeses, umbes 7000
  elanikuga küla[soft-hyphen]keses Uus-Inglismaal...`. Soft-hyphen stripped
  at join time; `Uus-Inglismaal` intra-line compound hyphen preserved.

## Schema proposals

None. Existing ET conventions cover every case in this section. The
narrow-glyph drop-cap wrap-zone (x=83 for `S` vs x=100 for `M`) is an
instance of the EN "narrow-glyph wrap-zone `+20` vs wide `+35`" pattern
applied to ET — script uses section-local x-band tuning.

## Counts

| kind       | count |
|------------|-------|
| heading    | 1     |
| paragraph  | 34    |
| list-item  | 4     |
| **total**  | **39** |

EN counterpart (`story-dr-bobs-nightmare`, Wave 3): 39 blocks
(1 heading + 34 paragraphs + 4 list-items). ET matches EN structurally.

Heading text: `DOKTOR BOBI PAINAJALIK UNENÄGU`
parentGroup preservation: `personal-stories/pioneers-of-aa` (verbatim)
Drop-cap: `S` (BrushScriptStd ~33pt) merged with `ündisin` → `Sündisin`
List items: 4 (items 1–4 on p212, motivation-for-service list)
Byline: **absent** — story closes with paragraph `Sinu Taevane Isa ei vea
sind iial alt!`, no author-attribution line.
