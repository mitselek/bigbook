# story-twice-gifted

## Summary

Extracted the 6-page story "Twice Gifted" (PDF pp. 476–481), the 5th story in Part III
(*They Lost Nearly All*). Emitted **16 blocks**: 1 heading + 1 subtitle paragraph + 14
body paragraphs. No list-items, verse, footnotes, tables, or bylines. Cross-page
paragraph merges applied via right-margin carry-over heuristic on 3 boundaries
(p476→477, p477→478, p480→481). Note: pages p478→479 and p479→480 boundaries coincide
with paragraph ends (the previous-page paragraph closes naturally before the break), so
no merge fires there.

## Method

- **Library:** PyMuPDF (`pymupdf`) only. `page.get_text("dict")` for per-line spans.
- **Pipeline:** probe → extract → filter running headers/page numbers/story-number →
  detect heading + subtitle + drop-cap on first page → paragraph split on first-line
  indent past body-margin → cross-page right-margin merge.
- **Heuristics fired:**
  - Running-header drop (y<50 AND (size≤9.5 OR isdigit)) on pp. 477–481.
  - Bottom-of-page page-number drop (isdigit AND y>500) on p476 (`470`).
  - Story-number `(5)` drop on p476 (y=79, NewCaledonia 12.5 — structural numbering).
  - Heading detect: size 13.5 NewCaledonia on p476 y=102 → `TWICE GIFTED`.
  - Subtitle detect: italic NewCaledonia-Italic 11pt, y<160 on p476 → single paragraph.
  - Drop-cap detect: ParkAvenue size 51.65 at y=168 on p476.
  - First-body after drop-cap: same page, y in [dc.y0+5, dc.y0+25], x > body-margin+15.
  - Drop-cap wrap zone: y < dc.y0+45 on first page treats indented lines as
    continuations (not new paragraphs).
  - Per-page body margins: **even** pages (476, 478, 480) body=69.28, indent=81.28;
    **odd** pages (477, 479, 481) body=52.28, indent=64.28. Opposite parity to
    `story-acceptance-was-the-answer`; margins depend on recto/verso, not global parity.
  - Cross-page merge: right-margin carry-over (prev last-line x1 > 280) unless the new
    page's first line starts past the paragraph-indent threshold.

## Schema decisions

- **Story-number `(5)`**: DROPPED. Structural numbering, not authored content.
  Per conventions "Lean toward DROP".
- **Heading**: emitted as visual ALL-CAPS `"TWICE GIFTED"` (metadata `title` remains
  prose-case `"Twice Gifted"`).
- **Subtitle**: 2 italic lines, single indent group → single `paragraph` block:
  `"Diagnosed with cirrhosis, this sick alcoholic got sobriety—plus a lifesaving liver
  transplant."` Em-dash preserved, no space around it.
- **Drop-cap**: `T` (ParkAvenue) + small-caps body tail `oday is sunday, my favorite
  day of the week.` → merged as `"Today is sunday, my favorite day of the week."`
  (single-letter drop-cap + word-remainder, no space). Applied `\bi\b → I` — no
  instances in this first line, so no substitution occurred.
- **No byline**: story ends mid-page on p481 at `"not found the door of Alcoholics
  Anonymous."` No author sign-off, no italic attribution line. Emitted no `byline`
  block.

## Flagged blocks

### p003: flattened small-caps proper noun `sunday`

```
"Today is sunday, my favorite day of the week."
```

The source renders the first body line in small-caps (`SUNDAY`), and PyMuPDF returns
the SC span as real lowercase codepoints. Flattening per conventions produces the
lowercase `sunday` — losing the proper-noun capitalization. Conventions only prescribe
`\bi\b → I` as a post-flatten fix; they do not mandate proper-noun capitalization in
the SC tail. I preserved the flattened lowercase as-is. Later in the text (p004 start
`"Sunday used to be pretty wild"`) the proper noun is preserved correctly because it
is set in regular case, not small-caps.

The next paragraph (p004) independently starts with `"Sunday used to be pretty wild"`
in regular-case body text, so the reader still sees `Sunday` capitalized one sentence
later — the flattened `sunday` in p003 is a small local artifact, not a pattern loss.

## Schema proposals

None. Current Wave 7 conventions handled this section cleanly:

- Narrowed capitalized-stem allowlist never fired (no cross-line uppercase compounds).
- Compound-hyphen allowlist never fired (no lowercase prefix cross-line splits).
- Em-dash-at-line-end/start rules had no cross-line instances (all em-dashes are
  intra-line in this story: `relationships—at least`, `sobriety—plus`, `A.A.—patience`,
  `myself—are`).
- Multi-hyphen preservation never needed.
- No superscript fractions, no letter-spaced numerals, no inline-style-change merges,
  no facsimile pages, no narrow-glyph drop-cap wrap zones (drop-cap is `T`, wide).

**Possible future-work note (not a proposal)**: if a later section exhibits
proper-noun loss in the SC drop-cap tail that genuinely affects readability, a
targeted "restore common proper nouns" pass (days of week, month names) could be
considered. For this story the impact is limited to a single word in the first line.
