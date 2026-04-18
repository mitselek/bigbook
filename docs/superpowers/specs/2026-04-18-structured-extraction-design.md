# Structured extraction — third-angle design

**Date:** 2026-04-18
**Status:** Design approved; pilot in flight
**Related:** Issues #35-38 context · normalize.ts path (`scripts/extract-en-book/`) · migrations path (`data/extractions/migrations/`)

## Context

Two prior approaches extracted the Big Book PDF into a structured JSON:

1. **normalize.ts** — TypeScript pipeline over `pdftotext -layout` output, using regex-driven heuristics.
2. **migrations** — Python pipeline applying sequential text transformations (`m_001.py` … `m_009.py` + fixes) over raw text.

Both approaches share a fundamental limitation: they flatten the PDF to 2D-stripped text via `pdftotext`, losing structural information (font size, precise coordinates, bounding boxes). Every downstream bug (verse fragmenting, hanging-indent list truncation, multi-line title splits, drop-cap gaps) is a symptom of reconstructing structure from whitespace.

The third angle: **use structured PDF extraction libraries that preserve the PDF's own structural data**, dispatch one subagent per section to handle section-specific edge cases with focused context, and collect the outputs into the same `BigBookEnglish` JSON shape.

## Approach

- **Extraction libraries:** PyMuPDF (`pymupdf`) and `pdfplumber`, both installed in a repo-local virtualenv at `.venv/`. Agents may use either; recommend pymupdf for speed and pdfplumber for bbox/char-level structure.
- **Parallel subagents:** one subagent per section (68 total), dispatched in Fibonacci-shaped waves: **1, 2, 3, 5, 8, 13, 18, 18** = 68. Plantin sanity-checks each wave's output before dispatching the next.
- **Input to each subagent:** PDF path, section metadata (id, title, kind, page range), and the raw TypeScript interface source at `scripts/extract-en-book/types.ts`.
- **Output from each subagent:** two files under `data/extractions/structured/`:
  - `<section-id>.json` — a valid `BookSection` matching the TypeScript interface.
  - `<section-id>.md` — a freeform markdown problems-report documenting decisions, schema proposals, and any uncertainty.
- **Schema flexibility:** the current `BlockKind` enum (`heading | paragraph | blockquote | verse | list-item | footnote`) may not cover everything. Agents are encouraged to propose new kinds or structural refinements when existing values don't fit cleanly. Proposals live in the agent's `.md` report; Plantin reviews between waves and either propagates an accepted proposal into subsequent agents' prompts or asks the agent to conform.

## Output directory

```
data/extractions/structured/
├── README.md                  (rationale + schema evolution log)
├── <section-id>.json          (one per 68 sections)
├── <section-id>.md            (one per 68 sections)
└── en-4th-edition.json        (final consolidated artifact, written last by Plantin)
```

## Wave plan

| Wave | Count | Cumulative | Purpose                                                                 |
| ---- | ----- | ---------- | ----------------------------------------------------------------------- |
| 1    | 1     | 1          | Pilot on `ch05-how-it-works` — stress-tests hanging-indent Twelve Steps |
| 2    | 2     | 3          | Mix: one chapter, one story (probes both structural classes)            |
| 3    | 3     | 6          | Continue structural-variety probe                                       |
| 4    | 5     | 11         | Scale out; remaining chapters and early stories                         |
| 5    | 8     | 19         | Stories with varied difficulties                                        |
| 6    | 13    | 32         | Continue stories                                                        |
| 7    | 18    | 50         | Remaining stories                                                       |
| 8    | 18    | 68         | Appendices + any remaining sections                                     |

Between every wave: Plantin reviews output JSON against schema, reads problems-reports, decides whether to propagate schema proposals, and whether any section needs a re-run with adjusted prompt.

## Convergence check (already in place)

The normalize and migrations outputs remain as cross-checks. Once the structured-extraction artifact exists, a three-way diff on paragraph boundaries and block kinds becomes a strong validation signal.

## Hard constraints

- **Agents do not modify source code** (`scripts/`, `tests/`, anything outside `data/extractions/structured/`).
- **Agents do not push.** Plantin commits and pushes.
- **Agents work per-section;** cross-section dependencies are not allowed in this architecture.

## Out of scope

- Deprecating the normalize.ts path (decision deferred until structured output is validated).
- Changing `BlockKind` enum in `types.ts` (agents propose in markdown; Plantin decides).
- Replacing the outline/section boundaries (all 68 sections already ordered correctly per earlier verification; this approach respects the current outline).

## Pilot (Wave 1)

Section: `ch05-how-it-works` (pages 79-92). Chosen because it exercises:

- Chapter-heading detection.
- The Twelve Steps, which both prior approaches fragmented — a hanging-indent numbered list that needs coordinate-based detection.
- Mostly prose surrounding the list, so basic paragraph handling is also exercised.

Pilot success criteria (Plantin's review checklist for Wave 1):

- [ ] JSON parses and conforms to `BookSection` (either exactly the current interface or with documented deviations)
- [ ] Twelve Steps rendered as 12 complete `list-item` blocks with no fragmentation
- [ ] Heading block emitted for "How It Works"
- [ ] No obviously-merged or obviously-split paragraphs in surrounding prose
- [ ] Problems report readable, honest about uncertainty, suggests schema refinements where useful
