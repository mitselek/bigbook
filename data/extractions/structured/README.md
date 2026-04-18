# Structured extraction output

Per-section JSON + problems report produced by the "third-angle" extraction approach (see `docs/superpowers/specs/2026-04-18-structured-extraction-design.md`).

Each of the 68 sections is extracted independently by a dedicated subagent using structured PDF libraries (PyMuPDF, pdfplumber), which preserve the PDF's own font, position, and bounding-box data rather than flattening the document via `pdftotext`.

## Files

- `<section-id>.json` — one file per section, conforming to the `BookSection` TypeScript interface at `scripts/extract-en-book/types.ts`.
- `<section-id>.md` — freeform markdown problems-report from the subagent: schema decisions, structural uncertainties, and proposed refinements to the `BlockKind` enum.
- `en-4th-edition.json` — final consolidated document (produced by Plantin after all sections complete).

## Schema-evolution log

Subagents may propose new `BlockKind` values or structural refinements when the current six kinds don't fit. Accepted proposals propagate into later waves; rejected ones get re-run by the agent to conform.

_(Log entries will be appended here as proposals are accepted.)_

## Wave progress

- [ ] Wave 1 (1 section): `ch05-how-it-works`
- [ ] Wave 2 (2 sections)
- [ ] Wave 3 (3 sections)
- [ ] Wave 4 (5 sections)
- [ ] Wave 5 (8 sections)
- [ ] Wave 6 (13 sections)
- [ ] Wave 7 (18 sections)
- [ ] Wave 8 (18 sections)
