# story-safe-haven — structured extraction report

## 1. Summary

Section: `story-safe-haven` — "Safe Haven", Part III (They Lost Nearly All),
story `(3)`, pages 458-463 (6 pages). Emitted **21 blocks**: 1 `heading` + 20
`paragraph`. No list-items, no verse, no footnotes, no table, no byline. Two
superscript-fraction references (`4 1⁄2 years` on p461, `3 1⁄2 years` on p462)
rendered inline in PyMuPDF's text output — no fraction-fold required. One
cross-page paragraph merge (p458→p459, block `p005`). One notable hyphen-
preservation near-miss caught by a tightened `so-` tail qualifier (see §3).

## 2. Method

- Library: PyMuPDF (`pymupdf`), `page.get_text("dict")` for per-line spans with
  font/size/bbox. No pdfplumber needed.
- Probe script: `.tmp/probe-safe-haven.py` → `.tmp/probe-safe-haven.txt`
  (206 line entries across 6 pages).
- Extractor: `.tmp/extract-story-safe-haven.py`.

Heuristics that fired:

- **Drop top-of-page running headers/page-numbers**: `y0 < 50 AND (size ≤ 9.5
  OR text.isdigit())` — dropped `SAFE HAVEN` small-caps header and the 12pt
  page numbers on pages 459-463.
- **Drop bottom-of-page page number**: p458 "452" at y=540.74 size=9pt.
- **Drop story-number prefix**: `(3)` at y=79.13 size=12.5 on p458.
- **Heading detection**: size ≥ 13.0 AND contains "SAFE" (`SAFE HAVEN` at 13.5pt).
- **Subtitle italic-deck detection**: `Italic` in font AND size ≤ 11.5 AND
  y < 180. Three lines at y=130.78..158.39. Indent threshold 87.0 (continuation
  x=81.27, indent x=93.28) — one indent group → **one paragraph block**.
- **Drop-cap**: `P` in ParkAvenue 51.65 at y=182.81 x=70.23. First body line
  `rison. What a wonderful life it is. Here I am,` at y=196.01 x=106.90
  (wrap-indent past body-margin + 35). Merged `P` + `rison...` → `Prison...`
  (no space). Wrap-line y=210.82 x=106.90 absorbed into same paragraph via
  `dropcap_wrap_y_max` guard.
- **Body-margin parity**: even pages (458, 460, 462) body margin 69.28,
  paragraph indent 81.28; odd pages (459, 461, 463) body margin 52.28,
  paragraph indent 64.28. Threshold = body-margin + 8.
- **Cross-page paragraph merge** (right-margin carry-over): when prev block's
  last line has `x1 > 280` AND next page's first line starts at body margin
  (no indent), merge. Fired for p458→p459 (block p005: `"I recall too well..."
  ...told my friend I couldn't go on..."` continues with `"friend I couldn't go
  on any longer and needed to re-turn home"`).

Cross-line hyphen strips that fired correctly: `neigh-borhood`, `re-turn`,
`employ-ment`, `eventu-ally`, `con-trol`, `haz-ards`, `re-port`, `fight-ing`,
`com-mitted`, `spon-sor`, `gen-uinely`, `alco-holism`, `air-plane`. All stem
tokens are NOT in any allowlist → strip → correct.

## 3. Schema decisions

1. **Story-number `(3)` dropped**, not emitted (per conventions default "lean
   toward drop"). Heading is the clean prose form `SAFE HAVEN`.
2. **Subtitle → single paragraph block.** The italic deck has one clear first-
   line indent (x=93.28) and two continuation lines (x=81.27), matching the
   default "single paragraph" convention. Text: `"This A.A. found that the
   process of discovering who he really was began with knowing who he didn't
   want to be."`
3. **Drop-cap merge → no space.** Single-letter drop-cap `P` + partial-word
   continuation `rison. ...` → `Prison. ...`. The small-caps tail `rison` was
   already rendered lowercase by PyMuPDF; `.lstrip()` on the body chunk plus
   `re.sub(r"\bi\b", "I", ...)` pass (no-op here since no bare `i` pronoun in
   the merged prefix).
4. **`so-` tail qualifier — new guard in local script.** The conventions
   allowlist includes `so-` (added Wave 3 for `so-called`). On p461 the source
   has a cross-line split `"six months of so-"` + `"briety"`. A blanket
   allowlist-keep would emit `"so-briety"` (artifact). Added a narrow
   `SO_COMPOUND_TAILS = {"called", "so", "and"}` tail-qualifier mirroring the
   NUMBER_PREFIXES → NUMBER_COMPOUND_TAILS pattern from Wave 6. With this
   guard, `so-` only preserves before a known so-compound tail, so `so-briety`
   correctly strips to `sobriety`. See §5 for schema proposal.
5. **No byline emitted.** The story's final paragraph ends `"...make a brand-
   new end."` with no italicized sign-off, no em-dash-attribution, no signed
   closing — consistent with many Part II/III stories.
6. **Cross-page paragraph merge heuristic: right-margin carry-over.** Preferred
   over terminal-punctuation since this section has first-line paragraph
   indents (not a front-matter layout).

## 4. Flagged blocks

None of the blocks I'm uncertain about. A few to call out as worth a skim:

- **p003** (first paragraph after drop-cap): `"Prison. What a wonderful life
  it is. Here I am, sitting in a cell waiting for my hotpot to heat up so I
  can have a cup of instant coffee and reminisce. As I ponder my current
  circumstance, I reflect on the undeniable fact that I am well into my
  fourth year of incarceration. I still wake up some mornings wishing it
  were all a bad dream."` — drop-cap merge + wrap-line absorb + body
  continuation all behaved correctly.
- **p005** (cross-page merge 458→459): `"I recall too well the morning when
  another guy and I stole my dad's credit card and pickup truck so we could
  run off to California to become movie stars. ... My friend refused to turn
  back, so I let him out of the truck; I never saw him again. My parents may
  have recognized my behavior as some serious adolescent rebellion, but they
  had no idea it was fueled by the disease of alcoholism."` — merged from
  p458 last block into p459 first body run. Punctuation check passes.
- **p013**: `"...I might get a good six months of sobriety under my belt..."`
  — was the `so-briety` false-positive risk; confirmed stripped correctly.
- **p018** (ends on p462, wraps to p463): contains `"airplane to become
  airborne"` (cross-line `air-` + `plane` stripped correctly) and
  `"4 1⁄2 years"` (oh wait — that's p013; p018 has `"3 1⁄2 years"`). Both
  fractions rendered inline — no fold needed.
- **p018** also has `"peace of God through an active God consciousness"`
  across a wrap boundary — the source renders as two unhyphenated words on
  two lines, joined with a space. This differs from the Wave 6 documented
  capitalized-stem compound `God-consciousness` but reflects the source
  accurately: there's no hyphen in the PDF here, and `"active God
  consciousness"` reads as three words, not a hyphenated compound.

## 5. Schema proposals

**Proposal: tighten `so-` allowlist entry with a tail qualifier.**

- **Current convention** (Wave 3): `so-` is in `COMPOUND_PREFIXES` (lowercase
  allowlist). Triggers "keep hyphen" for any cross-line `...so-` + `<word>`
  continuation.
- **Problem**: false positive on `sobriety` (observed in safe-haven p461:
  `"...six months of so-"` + `"briety..."`). Without a tail guard the emitted
  text is `so-briety` (not a real word).
- **Fix applied locally**: `SO_COMPOUND_TAILS = {"called", "so", "and"}` —
  keep `so-` hyphen only before known so-compound tails (`so-called`,
  `so-so`, `so-and-so`). Otherwise strip.
- **Precedent**: identical pattern to Wave 6 `NUMBER_PREFIXES` tail
  qualification (`NUMBER_COMPOUND_TAILS`).
- **Scope**: low. `so-` + `<lower>` cross-line splits are rare; the known
  legit compound is `so-called`. The risk of missing a genuine `so-` compound
  by tightening is smaller than the risk of emitting `so-briety`-style
  artifacts in future sections.
- **Proposed evolution-log entry** (Wave 8):
  > `so-` tail qualification: keep hyphen only when next word ∈
  > `SO_COMPOUND_TAILS = {"called", "so", "and"}`. Mirrors NUMBER_PREFIXES
  > pattern. Prevents `so-` + `briety` → `so-briety` false positive.
  > safe-haven p461.

If accepted, Wave 8+ agents should apply the same tail qualifier and later
waves (if any) inherit it. No retro-fix required on prior outputs unless a
reviewer finds a `so-briety`-class artifact in earlier wave output.

**Non-proposals (noted for record):**

- `God-consciousness` as a single hyphenated token is NOT applicable here
  because the source PDF on p463 renders `"an active God"` + `"consciousness"`
  across a line wrap with no hyphen at all. The join correctly produces
  `"active God consciousness"` (three words). Different structural case than
  appendix-ii's `God-consciousness`.
- No new `BlockKind` needed; `heading` + `paragraph` sufficed.
