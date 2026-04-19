# story-puuduv-luli — extraction report

## Summary

First story of Part II.B (*They Stopped in Time* / ET `personal-stories/they-stopped-in-time`). PDF pages 313–320, book pages 281–288. Emitted **23 blocks**: 1 `heading` + 22 `paragraph`. English counterpart `story-the-missing-link` also has 23 blocks (1 heading + 22 paragraph) — block-count parity exact.

`parentGroup` carried through verbatim from the supplied metadata: `personal-stories/they-stopped-in-time`. Section `title` ("Puuduv lüli", prose-case metadata) is distinct from the `heading` block text ("PUUDUV LÜLI", source visual rendering) per convention.

## Method

- PyMuPDF `get_text("dict")` over pages 313–320.
- Lines sorted by `(pdf_page, y0, x0)` for reading order.
- ET running-header drop rule: `y0 < 45 AND (size <= 11.5 OR pure-digit text)`.
- Bottom-of-page numeric footer drop: `digit AND size <= 11.5 AND y0 > 520`.
- Story-number `(1)` drop on page 313 (y≈83.64, size=13) via regex `^\(\d+\)\s*$`.
- Heading detection: page 313, size 13.5–15.0, text contains "PUUDUV" and "LÜLI" (y≈102.72, size=14, x≈145).
- Italic deck detection: page 313, NewCaledoniaLTStd-It, y in `[120, 150]` → two wrapped lines merged into one paragraph.
- Drop-cap detection: page 313, BrushScriptStd 33pt (y≈161.61, x=52.69).
- Drop-cap merge: `K` + `ui olin kaheksa...` → `Kui olin kaheksa...` (wide glyph; next body line at x≈89.26 within y-band `[160, 175]`).
- Drop-cap wrap-zone: body lines at x in `[82, 95]` within y-band `[160, 185]` are continuations, not new paragraphs.
- Paragraph-start heuristic: x in `[64, 80]` (body indent ≈ 68.03); continuation at x≈56.69.
- Cross-page transitions: all eight page boundaries are mid-paragraph; no terminal-punctuation splits needed.
- Join rules (ET): strip-and-join soft hyphens (U+00AD); en-dash / minus-sign at line-end preserved with conditional space per trailing-space signal; em-dash preserved tight.

## Schema decisions

1. **Story-number `(1)` dropped entirely** (not emitted as heading, not merged into heading text) — per ET/EN conventions, decorative structural numbering is not authored content. First story of Part II.B gets the `(1)` number; this drop matches the Part II.A / pioneer-story convention used across Wave 1–4.
2. **Italic deck** (2 lines on page 313: `Ta pidas oma õnnetuse põhjuseks kõike, välja arvatud alkoholi.`) emitted as a **single `paragraph` block** (`p002`) — no multi-paragraph indent signal in the deck, default rule applies.
3. **Heading** emitted as upper-case visual form `PUUDUV LÜLI`; section `title` metadata is `Puuduv lüli` (prose-case). No abbreviation expansion considered (the heading has no A.A./Dr. tokens).
4. **Drop-cap** merged with first body word — `K` + `ui olin kaheksa või üheksa aastat vana...` → `Kui olin kaheksa või üheksa aastat vana...`. Wide-glyph `+30` x-offset for wrap-zone detection worked cleanly (the `K` is slightly narrower than `W` but wider than `I`; x=89.26 landed inside the default `+35` band).
5. **No bylines, list items, verses, footnotes, or blockquotes** — the story is continuous narrative prose.

## Flagged blocks

- **`p023` (page 320) — typesetter soft-hyphen quirk: `kuidhulk`.** Raw line-pair:
  ```
  unistasin, kuid¬
  hulk tööd on veel ees.
  ```
  The source encodes a soft hyphen between two separate Estonian words (`kuid` = "but", `hulk` = "amount"). Correct text should read `kuid hulk`. Per ET conventions ("strip soft hyphen, join no-space"), the output is `kuidhulk`. This is a source-side encoding quirk, not an extraction bug. Preserved verbatim per the "fidelity to source beats grammatical correctness" principle. No conventions change proposed; the pattern is rare enough to not warrant a rule.

- **Curly-quote style mix in `p014` and `p017`.** Several quotation-mark pairs use the "wrong" ET opener:
  - `p014`: `Hüüatasin: "Kas arvad, et mul on joomisprobleem?"` — opener is U+201D RIGHT DOUBLE QUOTATION MARK, not the expected ET `„` (U+201E). The surrounding quotes in the same paragraph correctly use `„` + `"` pair. Preserved verbatim.
  - `p017`: `„Seitsmes samm"` — closer is U+201C LEFT DOUBLE QUOTATION MARK where ET convention would use `"` (U+201D). Preserved verbatim.
  - `p017`: `„Mis pagana asjad need puudused üldse on?"` — same U+201C-as-closer pattern. Preserved verbatim.

  These are typesetter inconsistencies present in the source PDF; per ET convention ("preserve curly quotes as authored"), emitted unchanged.

- **`p008` tight minus-sign usage.** `Tol ööl ma armusin jooki − alkoholi.` — U+2212 MINUS SIGN with surrounding spaces, handled by the "space-padded dash → preserve with space" rule. Correct output.

## Schema proposals

None. All rules from the parent EN conventions and the ET companion applied cleanly. Block-count parity with EN counterpart is exact (23 = 23, same `kind` distribution).
