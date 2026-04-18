# story-tightrope — extraction report

## Summary

Structured extraction of "Tightrope" (PDF pages 370–379, 1-indexed). Part II.B /
**They Stopped in Time** — `parentGroup`: `personal-stories/they-stopped-in-time`.
Story (10) within Part II.B. The author's first-person account of dual-life
alcoholism as a closeted gay man, followed by recovery with a patient A.A.
sponsor.

Emitted **30 blocks**: 1 heading + 29 paragraphs. No list-items, verse,
footnotes, tables, blockquotes, or bylines.

## Method

- **Library:** PyMuPDF (`pymupdf`) via `page.get_text("dict")`. No `pdfplumber` needed.
- **Heuristics fired:**
  - Heading detection: font size ≥ 13 on first page, title-word match (`"TIGHTROPE"`).
  - Running headers dropped at `y0 < 50` AND (`size <= 9.5` OR digit-only).
  - Bottom page-number drop (page 370's `359` at y=540.74, size=9) via digit+y>500.
  - Story-number `(10)` at y=79 on first page dropped as structural numbering.
  - Italic subtitle detection (`"Italic"` in font, size < 11.5, y < 170).
  - Drop-cap detection: `font == "ParkAvenue"` and `size > 40`.
  - Body-margin alternation: even pages 52.28, odd pages 69.28; paragraph indent
    threshold = body margin + 8.
  - Drop-cap wrap-window: lines with `y0 < dropcap_y + 45` and `x0 > body_margin + 15`
    on page 370 are treated as continuation of the drop-cap's first paragraph.
  - Cross-line hyphenation with Wave 6 allowlist (9 prose prefixes + 10 small-number
    prefixes + 8 ordinal-decade prefixes + capitalized-stem preservation).
  - Em-dash line-join: no space inserted after line-end `—` (Wave 5 rule).
  - Multi-hyphen compound preservation (regex `-[A-Za-z]+-$`) — not triggered here.
- **Cross-page paragraph merge:** not needed — every page-transition in this story
  either falls inside a paragraph that continues (no first-line indent on the new
  page's first line, e.g. p370→p371 at y=54.21 x=69.28 is body-margin → continuation
  of the previous paragraph) OR starts a new paragraph with an indent. The
  paragraph-start rule plus the absence of forced page-breaks already produces the
  correct boundaries; no post-pass needed.

## Schema decisions

- **`parentGroup`:** `personal-stories/they-stopped-in-time` (second structured-
  extraction output in this sub-group after the-missing-link).
- **Story-number `(10)`:** dropped per conventions (structural numbering, not
  authored content).
- **Heading text:** `"TIGHTROPE"` — visual all-caps rendering. Section metadata
  `title` is prose-case `"Tightrope"`. Intentional divergence per Wave 1B rule.
- **Subtitle (`p002`):** single paragraph. The 3-line italic deck has ONE indent
  (first line at x=76.28, continuations at x=64.27 on lines 2 and 3). One indent
  group → one paragraph per the Wave 3 subtitle rule. Output:
  `"Trying to navigate separate worlds was a lonely charade that ended when this
  gay alcoholic finally landed in A.A."`
- **Drop-cap merge (`p003`):** `D` (ParkAvenue 51.65) + first body fragment
  `rinking was always a part of my family` → `Drinking was always a part of my
  family` (no space between `D` and `rinking`). The first body line's leading
  span is `NewCaledonia-SC` for the word `rinking`, and the remainder is
  `NewCaledonia`. Unlike missing-link, this line contains no standalone `i`
  pronoun in the SC tail, so the `\bi\b → I` safety fix is a no-op here (still
  applied defensively).
- **No byline:** story ends on page 379 at y=346.29 with `"...bonds of shared pain
  and joy."` The only lines below that y are the next page's running header/footer
  (y=37.24 digit `368` and y=39.94 `ALCOHOLICS ANONYMOUS`). Confirmed from probe.
- **Dialogue kept inline:** two quoted-sentence interjections (`"You don't have to
  drink again."` in p019 and `"You don't have to be alone anymore."` in p020) stay
  inside their enclosing paragraphs per conventions. Similarly the narrator's
  `"focus"`, `"hard sell"`, `"read"`, `"acting as if"`, and `"the God concept"`
  scare-quoted terms all stay inline.
- **Compound-hyphen preservation verified:**
  - `self-pity` preserved (p016 and p022) — `self-` allowlist entry.
  - `short-sleeved`, `deep-voiced`, `half-gallon`, `coffee-making` preserved as
    single-line compounds (no cross-line split involved).
- **Cross-line hyphen drops verified:** `suddenly`, `bookish`, `commuted`,
  `disinclination`, `increased`, `separate` (twice), `became`, `during`,
  `accelerating`, `rationalization`, `regularity`, `compare` (twice),
  `unacknowledged`, `resentments`, `anything`, `afford`, `decision`,
  `transportation`, `cartons`, `convinced`, `insane`, `decided`, `meeting`,
  `communicative`, `victimization`, `developing`, `individuals`, `bedridden`,
  `heterosexual` (from `heterosex-ual` on p371 y=244.06/258.67) — all joined
  correctly.
- **Em-dash at line-end verified:** p370 `"my father—and later"` (no space),
  p371 `"homosexual—the word"` (no space), `"use—was unthinkable"` (no space),
  `"lives—that of the gay"` (no space), p371→p006 `"shame—as well as the
  drinking—increased"` (both `—` clean, and the cross-line `in-` + `creased`
  hyphen dropped), p372 `"again—and"` (no space), p376 `"doubts—everything"`
  (no space), p377 `"world—in short"` (no space).

## Flagged blocks

- **None with semantic uncertainty.** All 30 blocks come out cleanly with the
  Wave 5/6 rule set. The extraction is straightforward — this is a 10-page
  continuous-prose story with no special elements (no lists, verse, tables,
  footnotes, bylines, blockquotes, epigraphs, or sub-headings).

## Schema proposals

- **None.** All Wave 6 accepted rules applied cleanly without needing extension
  or adjustment.

## Uncertainties

- **Ligature `ﬁ` in the subtitle:** PyMuPDF emitted `ﬁnally` as the ligature U+FB01
  in the italic deck span. Normalized to `finally` via the ligature table. Same
  treatment for `ﬁrst`, `ﬁnd`, `difﬁcult`, `ﬁrm`, `ﬁlled`, `standofﬁsh`, etc.
  throughout the body. Verified no remaining U+FB0x codepoints in the output.
