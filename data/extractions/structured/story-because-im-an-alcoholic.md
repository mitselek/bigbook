# story-because-im-an-alcoholic — extraction report

## Summary

Part II.B "They Stopped In Time" story (8). Pages 349-358 (10 pages). Emitted
**35 blocks**: 1 heading + 34 paragraphs. No list-items, verse, footnote, table,
byline, or blockquote. No schema proposals; all Wave 5/6 rules applied cleanly.

## Method

- `pymupdf.open(PDF).get_text("dict")` per page for span-level font/size/bbox.
- Drop rules: running header `y0<50 AND size<=9.5`; top-of-page page numbers
  `y0<50 AND digits-only`; bottom page numbers `digits-only AND y0>500`;
  story-number `(8)` prefix on first page.
- Heading detection: first line on first page with `13.0 <= size < 20.0` AND
  `y0 < 125` AND text containing "ALCOHOLIC". Matches the `size=13.50` heading
  at y=102 on page 349.
- Subtitle detection: italic (`NewCaledonia-Italic`) ~11pt, `y0 < 160` on first
  page. Two lines captured. First-line indent at x=93.28, continuation at
  x=81.27 — single indent group, emitted as one `paragraph` block.
- Drop-cap detection: `font == "ParkAvenue" AND size > 40`. Found `I` at y=168.85.
- First body line after drop-cap: same y-band (±25pt) AND `x0 > body_margin + 20`.
  Matches the `NewCaledonia-SC` span starting "suppose I always wondered...".
- Paragraph split on `x0 >= body_margin + 8` per page-parity:
  odd pages (349, 351, 353, 355, 357) body margin 69.28, indent threshold 77.28;
  even pages (350, 352, 354, 356, 358) body margin 52.28, indent threshold 60.28.
- Cross-page paragraph merge: implicit, via the "no indent = continuation" rule.
  Verified manually on p005→p006 (ends "morning's hangover." before indent on
  350), p009/p010 (p351 internal split), p013/p014 (p352 internal split), and
  p014/p015 (spans 352→353: "Afraid my colleagues or students" → "would smell
  my breath at work"), all correct.

## Schema decisions

- **Story-number `(8)` dropped** (conventions: structural numbering, not content).
  The "(8)" line on page 349 at y=79.13, size=12.50, is filtered by the explicit
  regex match `^\(\d+\)\s*$` on first page.
- **Heading text preserves curly apostrophe:** `BECAUSE I'M AN ALCOHOLIC` (the
  Unicode RIGHT SINGLE QUOTATION MARK U+2019). Matches the source visual rendering.
  Section-metadata `title` stays prose-case "Because I'm an Alcoholic".
- **Subtitle emitted as one paragraph block** — the italic deck's single first-line
  indent (no additional indented groups) indicates one logical sentence-paragraph.
  Subtitle text: `This drinker finally found the answer to her nagging question,
  "Why?"`
- **Drop-cap merge: `I` + `suppose` → `I suppose`** (space-joined). This is the
  standalone-single-letter-word variant per Wave 2 convention refinement — unlike
  missing-link's `W`+`hen`→`When` (no space, because `W` is the first letter of
  `When`), here the `I` is itself the pronoun, and `suppose` is the next full word.
- **SC-pronoun flatten safety net:** `\bi\b → I` applied to the merged drop-cap
  line. In this case the SC span only covered `suppose ` (no lowercase `i` token),
  so the regex is a no-op here — retained defensively per conventions.
- **No byline emitted.** Story ends with "I no longer feel alone." on page 358,
  y=317.08. No author-attribution signature line in the bbox data.

## Flagged blocks

- **`p002` (subtitle):** emitted as `paragraph`; the conventions reserve `verse`
  for tombstone-style content and `blockquote` for editorial interludes, so
  `paragraph` is the correct kind here. Flagged only because downstream consumers
  may want to distinguish decks — a future `subtitle` kind could be considered,
  but not proposing in this agent's wave.
- **`p020` / `p021` / `p023` (dialogue):** short paragraphs built around direct
  quotes from the therapist (`"Say it the other way," he suggested. "I am an
  alcoholic."`, `"Call her now." He handed me the telephone.`). Kept as
  `paragraph` per conventions ("Dialogue passages in prose — keep them inside
  their surrounding paragraph block"). The PDF's typography here uses hanging
  first-line indent for each new speaker turn, which is what produced the
  split — this is authentic paragraph structure, not verse.

## Schema proposals

None. Wave 5/6 conventions covered everything in this story. No new kinds or
rules surfaced.
