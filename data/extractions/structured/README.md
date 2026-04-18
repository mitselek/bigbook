# Structured extraction output

Per-section JSON + problems report produced by the "third-angle" extraction approach (see `docs/superpowers/specs/2026-04-18-structured-extraction-design.md`).

Each of the 68 sections is extracted independently by a dedicated subagent using structured PDF libraries (PyMuPDF, pdfplumber), which preserve the PDF's own font, position, and bounding-box data rather than flattening the document via `pdftotext`.

Conventions for subagents live in `docs/superpowers/specs/2026-04-18-structured-extraction-conventions.md`.

## Files

- `<section-id>.json` — one file per section, conforming to the extended `BookSection` schema in the conventions doc.
- `<section-id>.md` — freeform markdown problems-report from the subagent: schema decisions, structural uncertainties, and proposed refinements to the `BlockKind` enum.
- `en-4th-edition.json` — final consolidated document (produced by Plantin after all sections complete).

## Schema-evolution log

Subagents propose new `BlockKind` values or structural refinements when existing kinds don't fit. Plantin reviews between waves; accepted proposals propagate to later waves via the conventions doc.

Canonical log lives in the conventions doc's "Evolution log" section. Summary of accepted additions so far:

- `table` kind (Wave 1 ch05 proposal) — for the resentment inventory table.
- `byline` kind (Wave 1B ch01 proposal, broadened Wave 4) — for author-attribution sign-offs at end of stories AND signed letters.
- Compound-word hyphen allowlist (Wave 1B → Wave 3 refinement): 17 prefixes including `self-` / `well-` / `co-` / `non-` / `semi-` / `anti-` / `multi-` / `so-` / `one-`..`ten-`.
- `blockquote` reserved for editorial interludes (Wave 4 aa-three precedent) — smaller font + own indent column + stage-direction brackets. Not for dialogue or pull-quotes.
- Cross-page paragraph merge heuristics (Wave 4): right-margin carry-over for indented sections, terminal-punctuation for front-matter.

## Wave progress

- [x] Wave 1 (1 section): `ch05-how-it-works` — _pilot output discarded; re-piloted as Wave 1B under revised conventions_
- [x] Wave 1B (1 section): `ch01-bills-story`
- [x] Wave 2 (2 sections): `ch08-to-wives`, `story-gratitude-in-action`
- [x] Wave 3 (3 sections): `story-dr-bobs-nightmare`, `ch02-there-is-a-solution`, `appendix-i-the-aa-tradition`
- [x] Wave 4 (5 sections): `ch11-a-vision-for-you`, `story-aa-number-three`, `preface`, `foreword-2nd-edition`, `doctors-opinion`
- [ ] Wave 5 (8 sections)
- [ ] Wave 6 (13 sections)
- [ ] Wave 7 (18 sections)
- [ ] Wave 8 (18 sections)

**Completed: 12 of 68 sections.**
