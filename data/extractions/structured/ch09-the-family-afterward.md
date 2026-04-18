# ch09-the-family-afterward — extraction report

**Wave 6** · 2026-04-18

## Summary

Extracted `ch09-the-family-afterward` (PDF pages 143–156) into **48 blocks**:
1 `heading` + 47 `paragraph`. No footnotes, no verse, no lists, no tables, no
byline. Chapter opens with a ParkAvenue drop-cap `O` on p143 and closes with
three short italic mottoes on p156 ("First Things First" / "Live and Let
Live" / "Easy Does It."), each emitted as its own paragraph block. Dialogue
passages and quoted speech stay inline within their surrounding paragraph per
conventions.

| Kind      | Count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 47    |
| **total** | 48    |

## Method

- PyMuPDF `page.get_text("dict")` for per-line spans with font/size/bbox,
  iterated over PDF pages 143–156.
- Running-header drop: `y0 < 50` AND (`size <= 9.5` OR `text.isdigit()`) —
  catches the 9pt `THE FAMILY AFTERWARD` / `ALCOHOLICS ANONYMOUS` running
  titles as well as the 12pt NewCaledonia-SC page-number digits (e.g. `123`)
  that live in the same top band on even pages.
- Page-number drop at foot of chapter opener (p143): numeric-only, `y0 > 525`.
  Captured the `122` page number at `y≈538`.
- "Chapter 9" italic label drop on p143: regex `^Chapter\s+\d+\s*$` + font
  contains `Italic`.
- Body margin inferred per page as `min x0` of size-12 NewCaledonia body
  lines, restricted to `x0 < 110` to exclude the drop-cap wrap line (x≈99.8)
  on p143 and the centered-italic mottoes (x=145) on p156. Odd pages settle
  at ~72, even pages at ~55 — consistent with chapter convention.
- Paragraph-start heuristic: `body_margin + 8 <= x0 <= body_margin + 20`
  (i.e. +12pt indent zone).
- Drop-cap merge: 'O' glyph (ParkAvenue 51.65pt at y≈127, x≈71) + first body
  line ('ur women folk have suggested certain attitudes...' at y≈140, small-caps
  tail) → 'Our women folk...'. No space inserted; small-caps tail case is
  naturally preserved by the span text.
- Drop-cap wrap-zone: the 2nd body line on p143 (y≈155, x≈99.8) still wraps
  around the drop-cap. Treated as continuation of the first paragraph
  (`L.y0 < 175 AND L.x0 > body_margin + 20`).
- Cross-line hyphenation: final conventions allowlist (7 prefixes + small
  numbers `one-`..`ten-`). `re-won` → `rewon` (not in allowlist); all
  intentional compounds (`self-pity`, `self-centered`, `self-justification`,
  `well-being`, `non-denominational`, `over-indulged`, `over-concentration`,
  `by-paths`, `make-believe`) preserved correctly (either already intact on a
  single line, or prefix in the allowlist, or multi-hyphen tail regex).
- Em-dash line-end join: no space inserted (Wave 5 rule). Confirmed on the
  "—these things are now ruined or damaged" join and the `—dead wrong` and
  `—the key to life` joins.
- Cross-page paragraph merge: used the **first-line indent** signal (body
  prose has paragraph indents), so any non-indented first line on a new page
  continues the previous page's paragraph. No special terminal-punctuation
  heuristic needed here.

## Schema decisions

- **"Chapter 9" label** — dropped per conventions.
- **Drop-cap 'O'** — merged with first body line, no space, no standalone
  block.
- **Dialogue** — every instance kept inline with the surrounding paragraph.
  Ch09 is dialogue-heavy: direct quotes from an unnamed doctor (p4), interior
  monologues about family reactions (p16, p22), and the passive-voice
  hypotheticals. None split from their paragraph.
- **Three mottoes on p156** — "First Things First", "Live and Let Live",
  "Easy Does It." Each rendered centered-italic at x=145, size 12pt, on its
  own line, separated from the preceding body prose by a clear y-gap.
  Considered three options:
  - *verse*: tempting (short lines, shared x, blank-surround), but these are
    slogans/mottoes, not poetry. The conventions doc explicitly urges
    restraint on verse ("err on the side of NOT emitting verse when the
    signal is ambiguous") and cites the Hampshire Grenadier tombstone as the
    only known true verse. Rejected.
  - *list-item*: no numeric/alphabetic/roman marker; typographically they
    read as centered aphorisms, not a marked list. Rejected.
  - *paragraph × 3*: each motto is a complete standalone statement. Emitting
    as three separate `paragraph` blocks honors the source's line-per-motto
    typography without reaching for a kind that doesn't cleanly fit.
    **Chosen.**

  A later reader can recognize the mottoes by their short text, shared page,
  and trailing position after the "three little mottoes which are apropos.
  Here they are:" lead-in (p045 in this JSON). If a dedicated `motto` or
  `aphorism` kind becomes worthwhile later, these three blocks are easy to
  reclassify. Flagged below.

## Flagged uncertainties

- **Mottoes as paragraph vs verse vs list-item** (blocks `p046`, `p047`,
  `p048`). See "Schema decisions" above. The chosen rendering loses the
  semantic grouping — a downstream consumer sees three disconnected
  `paragraph` blocks with no signal that they form a unit beyond "they are
  sequential, short, and follow a colon-lead-in."
- **`re-establish`** in `p040` survives intact (not a cross-line break in the
  source — arrived on a single line). No action needed; flagged only because
  `re-` is deliberately NOT in the hyphen allowlist, and reviewers may want
  to confirm no similar compound got stripped incorrectly elsewhere.

## Schema proposals

None new this wave. Every decision fit cleanly into the conventions doc.

Optional future consideration (not a blocker): a dedicated `motto` /
`aphorism` / `pull-quote` kind could serve short, typographically isolated,
centered lines that aren't verse, not list-items, and not ordinary prose. Ch09
has exactly three; other sections may have similar structures (to be seen).
If such a kind is introduced, revisit blocks `p046`-`p048` here.

## Deliverables

- `data/extractions/structured/ch09-the-family-afterward.json` — 48 blocks,
  valid JSON.
- `data/extractions/structured/ch09-the-family-afterward.md` — this report.
