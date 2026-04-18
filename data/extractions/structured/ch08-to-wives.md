# ch08-to-wives — extraction report

**Wave 2A** · 2026-04-18

_Note: the original Wave 2A subagent completed JSON extraction but hit an auth error before writing this report. This report was reconstructed by Plantin from the produced JSON. Original subagent's methodology is not preserved beyond what the output encodes._

## Summary

Extracted `ch08-to-wives` (pdfPages 125-142) into 66 blocks conforming to the current conventions schema. Output shape inferred from JSON only; no method narrative from the agent.

High-level shape:

| Kind      | Count |
| --------- | ----- |
| heading   | 1     |
| paragraph | 63    |
| footnote  | 2     |
| **total** | 66    |

## Key verdicts (inferred from JSON)

- **Heading**: `h001` = `TO WIVES`. "Chapter 8" label correctly dropped.
- **Drop-cap**: `p002` opens with "With few exceptions, our book thus far has spoken of men...". No visible gap, no duplicated letter — drop-cap merge succeeded.
- **Footnotes (2)**:
  - `f065` on pdfPage 125 — the "Written in 1939" attribution-footnote about the chapter's gendered framing. Leading `*` preserved per conventions.
  - `f066` on pdfPage 142 — the Al-Anon footnote appearing at the end of the chapter. Leading `*` preserved.
- **Byline**: none. The chapter ends on body prose (`...we say "Good luck and God bless you!"`). Correct — To Wives has no author attribution.
- **No `verse` or `list-item`**: consistent with the chapter being pure prose with no numbered lists or quoted poetry.
- **Ordinal scheme**: continuous (heading → paragraph → paragraph → ... → final paragraph → footnote → footnote), per conventions.

## Notes

- Both footnotes appear at the end of the block list despite being anchored on different pages (125 and 142). This matches conventions' "footnotes emitted at end of section" shape typical of structured PDF extraction.
- Chapter's 18 pages are the longest we've done so far (ch01 = 16, ch05 = 14). Block-to-page ratio 66/18 ≈ 3.7 blocks per page — similar to ch01 (72/16 = 4.5) and ch05 (62/14 = 4.4), indicating consistent paragraph-detection behavior at scale.

## Flagged uncertainties

None. The JSON is shape-consistent with conventions. A deeper review would require the agent's method notes; happy to re-run extraction with a fresh agent if PO wants a canonical report.

## Deliverables

- `data/extractions/structured/ch08-to-wives.json` — 66 blocks, valid JSON.
- `data/extractions/structured/ch08-to-wives.md` — this reconstructed report.
