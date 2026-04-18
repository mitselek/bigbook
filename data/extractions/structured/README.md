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
- [x] Wave 5 (8 sections): `ch03-more-about-alcoholism`, `ch04-we-agnostics`, `ch06-into-action`, `story-women-suffer-too`, `story-our-southern-friend`, `story-the-vicious-cycle`, `foreword-1st-edition`, `appendix-iii-the-medical-view-on-aa`
- [x] Wave 6 (13 sections): `ch07-working-with-others`, `ch09-the-family-afterward`, `ch10-to-employers`, `copyright-info`, `foreword-3rd-edition`, `foreword-4th-edition`, `appendix-ii-spiritual-experience`, `appendix-vii-the-twelve-concepts`, `story-jims-story`, `story-the-man-who-mastered-fear`, `story-he-sold-himself-short`, `story-the-keys-of-the-kingdom`, `story-the-missing-link`
- [x] Wave 7 (18 sections): `ch05-how-it-works` (re-pilot), `story-fear-of-fear`, `story-the-housewife-who-drank-at-home`, `story-physician-heal-thyself`, `story-my-chance-to-live`, `story-student-of-life`, `story-crossing-the-river-of-denial`, `story-because-im-an-alcoholic`, `story-it-might-have-benn-worse`, `story-tightrope`, `story-flooded-with-feeling`, `story-winner-takes-all`, `story-me-an-alcoholic`, `story-the-perpetual-quest`, `story-a-drunk-like-you`, `story-acceptance-was-the-answer`, `story-window-of-opportunity`, `appendix-iv-the-lasker-award`
- [x] Wave 8 (18 sections): `story-my-bottle-my-resentments-and-me`, `story-he-lived-only-to-drink`, `story-safe-haven`, `story-listening-to-the-wind`, `story-twice-gifted`, `story-building-a-new-life`, `story-on-the-move`, `story-a-vision-of-recovery`, `story-gutter-bravado`, `story-empty-on-the-inside`, `story-grounded`, `story-another-chance`, `story-a-late-start`, `story-freedom-from-bondage`, `story-aa-taught-him-to-handle-sobriety`, `appendix-v-the-religious-view-on-aa`, `appendix-vi-how-to-get-in-touch-with-aa`, `appendix-aa-pamphlets`

**Completed: 68 of 68 sections. Full extraction DONE.**

## Final block stats

- Total blocks: **2,094**
- Paragraphs: 1,883
- List-items: 110 (Twelve Steps, Twelve Traditions short + long form, Twelve Concepts, Six Steps, `(a)(b)(c)` sub-lists, A.A. Pamphlets catalog)
- Headings: 69 (67 visible + 2 appendix-ii bylines/epigraph attributions count separately; `copyright-info` has no heading)
- Footnotes: 15
- Blockquotes: 12 (all in `story-aa-number-three`'s Bill W. editorial interlude pp. 203-204)
- Bylines: 3 (2 signed letters in Doctor's Opinion + 1 epigraph attribution in appendix-ii)
- Tables: 1 (resentment inventory in ch05)
- Verse: 1 (Hampshire Grenadier tombstone in ch01)
