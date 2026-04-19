# appendix-vii-kaksteist-kontseptsiooni — extraction report

## Summary

Estonian appendix VII ("Kaksteist Kontseptsiooni", short form). 15 blocks emitted:
1 heading + 2 intro paragraphs + 12 list-items (one per Concept I..XII).

Pages 606..607 in the PDF (p608 is the blank final leaf of the book). The section
is fully contained on two printed pages and has no running headers, no page
numbers visible, no footnotes, no tables, no verse, and no byline. Only
schema divergence from the English counterpart: ET emits **2** intro paragraphs
where EN emits 1 (typesetter split the 1971-date sentence off as a separate
indented paragraph).

## Method

- Library: **PyMuPDF** via `page.get_text("dict")`. No `pdfplumber`, no other
  APIs.
- Classifier: heading region detected by `y0 <= 90 AND size >= 13.5` on p606
  (three lines). Remaining lines split into "intro-prose" and "list-items" at
  the first line whose stripped text matches
  `^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\.\s`.
- Intro-prose paragraph boundaries detected by first-line indent (`x0 >= 64`).
  Body margin x≈56.69; paragraph-indent x≈68.03.
- List-items split on roman-numeral marker match.
- `join_lines_et()` handles soft-hyphen join (no space), en-dash / minus
  space-padding, em-dash no-space, and default single-space join. Soft
  hyphens stripped only at join time, per ET conventions.

## Schema decisions

### Heading — three-line merge

Source page 606 top renders the heading as three centered lines at
NewCaledonia 14pt:

- `VII` (y=48.66)
- `KAKSTEIST KONSEPTSIOONI` (y=63.66)  — note: source spells `KONSEPTSIOONI`
  with a single `S`, matching the body-form `Konseptsiooni`. This diverges
  from the outline metadata's prose-case title `Kontseptsiooni` (with `T`).
  The section `title` metadata stays as given; the heading block preserves
  source visual spelling.
- `(LÜHIKESEL KUJUL)` (y=78.66)  — disambiguator parenthesized line, merges
  per convention ("parenthesized disambiguator on a following centered line
  at heading font-size merges into the same heading text").

Merged heading text: **`VII KAKSTEIST KONSEPTSIOONI (LÜHIKESEL KUJUL)`**.

Note also that the metadata `title` uses `(Lühidalt)` (Estonian short form)
whereas the visual heading uses `(LÜHIKESEL KUJUL)` (literally "in short form").
Both mean the same thing; source visual preserved.

### Two intro paragraphs

The ET typesetter split the EN-single intro paragraph into two paragraphs:

1. p002 (y=107..185) — explains the Concepts and credits Bill W. 1962.
2. p003 (y=198..211) — notes the 1971 General Service Conference adoption of
   the short form.

Both are x=68.03 first-line indents on their first line; both continuation
lines drop to x=56.69. Detection via the existing `x0 >= 64` heuristic.

The EN counterpart has 1 intro paragraph; ET thus produces 14+1 = 15 blocks
(vs EN's 14). Structural parity is maintained modulo the 1-paragraph vs
2-paragraph typesetter choice — all 12 Concepts are present as list-items.

### List-item marker style

Estonian uses **Roman numerals `I.` through `XII.`**, the same as the EN
counterpart. No word-cardinal form here (that form is reserved for the
short-form Traditions in appendix-i). Marker regex:
`^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\.\s`.

Note the source uses `\t` (tab) between the marker and the rest of the line
(e.g., `I.\t AA ülemaailmse teeninduse...`). The tab is normalized to a
single space during text-load, producing `I. AA ülemaailmse...`.

### En-dash (not em-dash)

Item III contains en-dash interpolation: `elemendile – Konverentsile, ... –
andma`. The en-dash is space-padded per ET convention. `join_lines_et()`
handles the second dash (which would be mid-sentence across a line break)
correctly by preserving the space. Actual emitted text in `l006`:

> `III. Et tagada toimiv juhtimine, peaksime igale AA elemendile – Konverentsile, AA Teenistuse Üldkogule ja selle teenistuskorporatsioonile, töötajatele, kommiteedele ja täidesaatvatele isikutele – andma traditsioonilise „Otsustamisõiguse."`

### Curly-quote codepoints

The source uses `„` (U+201E, DOUBLE LOW-9 — opener) paired with `"` (U+201C,
LEFT DOUBLE QUOTATION MARK — used as closer). This is inconsistent with the
ET conventions note that expected `„` + `"` (U+201D). **Preserved verbatim**
per the ET "text quirks" rule — if the PDF renders a character, we emit it.
Appears in blocks p003, l006, l007, l008.

### Soft-hyphen joins

104 equivalent of... well, this section is much shorter than ch01. Counted
**~20** soft-hyphen cross-line splits (e.g., `tagami­seks`, `põhi­mõtteid`,
`Teenin­duse`, `kommi­teed`, `eelkõige` etc.). All handled by the standard
ET strip-and-join rule. No U+002D line-end hyphens observed.

### No running headers or page numbers

Unlike pages inside appendix-i (p594-p598), appendix-vii pages 606-607 render
without any running header at `y0<55` and without any page-number line. I
kept the defensive page-number-drop rule in the extractor but it never
fired. Worth documenting: the **last three pages of the book** (606-608,
where 608 is blank) have no running elements.

### Page range kept at 606..608

The prompt metadata gives `pdfPageEnd: 608` even though p608 is the blank
back-leaf (zero text). I preserved the metadata verbatim. The extractor's
page-iteration upper bound is clamped to `doc.page_count`, so reading p608
produces zero lines and no spurious blocks.

## Flagged blocks

None. All 15 blocks were emitted with clean detection and joined text.

One potential uncertainty: the `title` vs `heading` spelling divergence
(`Kontseptsiooni` vs `KONSEPTSIOONI`) is kind of a source typo pair (one or
the other is intended) but I treated both as authored per the conventions
("do not fix source quirks").

## Schema proposals

None. The parent EN conventions, ET companion conventions, and Wave 6
"three-line heading support" rule all apply cleanly here.

## Block summary

| id   | kind       | page | prefix text |
| ---- | ---------- | ---- | ---------------------------------------------------- |
| h001 | heading    | 606  | VII KAKSTEIST KONSEPTSIOONI (LÜHIKESEL KUJUL) |
| p002 | paragraph  | 606  | AA Kaksteist Sammu on põhimõtted... |
| p003 | paragraph  | 606  | Need „lühikesel kujul" Konseptsioonid võeti vastu 1971... |
| l004 | list-item  | 606  | I. AA ülemaailmse teeninduse kohusetunne... |
| l005 | list-item  | 606  | II. AA Teeninduse Üldkonverents... |
| l006 | list-item  | 606  | III. Et tagada toimiv juhtimine... |
| l007 | list-item  | 606  | IV. Kõigil vastutatavatel tasemetel... |
| l008 | list-item  | 606  | V. Kogu meie struktuuri ulatuses... |
| l009 | list-item  | 606  | VI. Konverents leiab, et enamikes maailmaasjades... |
| l010 | list-item  | 607  | VII. Teeninduse Üldkogu Harta ja Eeskirjad... |
| l011 | list-item  | 607  | VIII. Eestkostjaliikmed on peamised planeerijad... |
| l012 | list-item  | 607  | IX. Hea teeninduse juhatamine... |
| l013 | list-item  | 607  | X. Iga teenindusega seonduva vastutusega... |
| l014 | list-item  | 607  | XI. Eestkostjaliikmetel võiksid alati olla parimad... |
| l015 | list-item  | 607  | XII. Teeninduse Üldkonverents lähtub kõigis oma tegevustes... |

Kind counts: heading=1, paragraph=2, list-item=12. Total=15.
