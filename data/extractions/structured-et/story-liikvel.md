# story-liikvel extraction report

## Summary

Estonian structured extraction of the story **"Liikvel"** (EN counterpart:
`story-on-the-move`, Part III "They Lost Nearly All"). PDF pages 518–525, book
pages 486–493.

**24 blocks emitted:** 1 `heading` + 23 `paragraph`. No list-items, verses,
blockquotes, footnotes, or bylines (anonymous story — matches EN counterpart's
unsigned close).

The extraction ran cleanly under the Wave-4 ET conventions baseline. No
typographic surprises beyond the standard ET soft-hyphen cross-line mechanism.

## Method

- **Library:** `pymupdf` via `.venv/bin/python`.
- **API:** `page.get_text("dict")` → per-line spans with bbox / font / size.
- **Sort order:** `(pdf_page, y0, x0)`.
- **Probe file:** `.tmp/liikvel-probe.txt` (274 lines across 8 PDF pages).
- **Extraction script:** `.tmp/extract-story-liikvel.py` (template: `extract-story-minu-voimalus-elada.py`).

### Drop rules applied

- Running headers / top-page numerics: `y0 < 45 AND (size <= 11.5 OR isdigit)`
  — catches the 11pt `LIIKVEL` / `ANONÜÜMSED ALKOHOOLIKUD` / numeric page
  numbers at `y ≈ 34.99` on every page.
- Story-number `(7)` at y≈57.66, size 14 on page 518: dropped by
  `pdf_page == 518 AND y0 < 65 AND matches ^\(\d+\)\s*$`.
- Bottom-of-page numeric footer `486` at y≈530.79 on page 518: dropped by
  `isdigit AND size <= 11.5 AND y0 > 520`.

### Heuristics fired

- **Heading detection** — `LIIKVEL` on page 518 at size 14, `y0 = 72.66` (not
  at y<45, so the running-header rule doesn't touch it).
- **Italic deck** — two NewCaledoniaLTStd-It lines on page 518 in `y0 ∈ [97, 113]`,
  joined into one `paragraph` per ET default (no multi-indent signal to split).
- **Drop-cap merge** — BrushScriptStd 'A' at `(x=54.69, y=130.97, size=33)`
  on page 518. First body fragment at `(x=85.25, y=135.42)` with text
  `arvasin, et mu elu on läbi...`. The body stream retained the lowercase
  first letter `a`, so I replaced it with the drop-cap capital: `A` + `rvasin...`
  → `Arvasin, et mu elu on läbi...`. (This is a **deviation from the
  minu-voimalus-elada template**, where the body stream had the first letter
  stripped. The choice is documented below under "Schema decisions".)
- **Drop-cap wrap-zone** — `y ∈ [130, 170]`, `x ∈ [82, 95]` on page 518 (A is a
  wide glyph, `+30` offset works). The wrap line at y≈149.92 was correctly
  absorbed as a continuation, not a new paragraph start.
- **Paragraph-start indent** — `64 ≤ x0 < 80` (x≈68.03 vs wrap x≈56.69).

### Cross-line hyphenation

Pure Estonian soft-hyphen pattern: all cross-line splits used **U+00AD**
(soft hyphen). Strip-and-join applied at join time. No U+002D line-end hyphens
observed. No compound-word allowlist needed.

## Schema decisions

1. **Story-number `(7)` dropped entirely** — per convention, decorative
   story numbering is not authored content. Heading block contains only
   `LIIKVEL`.

2. **Italic deck as single paragraph** — two lines, no structured multi-paragraph
   signal. Emitted as `p002` joined with soft-hyphen-strip logic.

3. **Drop-cap merge deviation from template** — the `extract-story-minu-voimalus-elada.py`
   template used a raw `dropcap + body` concatenation because its body stream
   was pre-stripped of the first letter (`A` + `stusin sisse` → `Astusin sisse`).
   For `liikvel`, the body stream retains the first letter (`arvasin`), so I
   added a conditional: if the body's first character lowercased matches the
   drop-cap lowercased, strip the body's first character before concatenating.
   Result: `A` + `rvasin...` → `Arvasin...`. Documented in the script docstring.

4. **No byline** — this anonymous story matches its EN counterpart which also
   has no signed close.

## Flagged blocks

- **`story-liikvel-p016`** — contains the phrase `teenindus majanduskoosolekule`
  (service / economics meeting). Source PDF splits `teenin-` across a line
  (soft hyphen), with `dus majanduskoosolekule` on the next line. The
  soft-hyphen strip joins to `teenindus`, leaving a space before
  `majanduskoosolekule`. Faithful to source. Could be a single compound
  `teenindusmajanduskoosolekule` semantically, but the source typesetting
  clearly separates them.

- **`story-liikvel-p024`** — contains mid-sentence punctuation `... kui see on
  olnud. – ja see sobib mulle hästi.`. The en-dash after a period in mid-sentence
  is a source quirk (probably a typesetting error or unusual rhetorical pause).
  Preserved verbatim per ET "fidelity beats correction" convention.

- **`story-liikvel-p006`** — contains `ja ja tulin taas teadvusele` (duplicated
  `ja`). Source probe confirms this is one line at y=92.41, so it's authored
  (or a source typo). Preserved verbatim.

- **`story-liikvel-p011`** — contains `ainut kaks asja mulle öelda` (`ainut`
  should be `ainult`). Source typo at y=324.41. Preserved verbatim per convention.

- **`story-liikvel-p022`** — block text mentions `kainusaastal` (correctly
  joined from cross-line soft-hyphen `kainu-` + `saastal`; single Estonian word).

## Schema proposals

None. The Wave-4 ET conventions handled every case in this section without
needing new rules. The drop-cap-body-stream variance (first letter retained vs
stripped) is a per-PDF-page artifact of PyMuPDF's text-layer extraction; each
agent should handle it locally with the conditional-prefix pattern used here.
