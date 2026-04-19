# ch06-tegutsema — structured extraction report

## Summary

Estonian chapter 6 "Tegutsema" (Into Action), spanning PDF pages 104..120
(book pages 72..88). Emitted **53 blocks**: 1 heading + 52 paragraphs. Zero
verse, zero footnotes, zero list-items, zero bylines. Block-count parity with
the EN counterpart (`ch06-into-action`) is **exact** (53 blocks each, same
kind distribution: 1 heading + 52 paragraph). The chapter is long and
dialogue-driven, with several italic prayers and pull-quotes (Seventh-Step
Prayer, `„Sinu tahtmine sündigu."`, etc.) — all kept inline per conventions.

## Method

- **Library:** PyMuPDF only (`page.get_text("dict")`).
- **Script:** `.tmp/extract-ch06-et.py` (derived from `.tmp/extract-ch11-et.py`
  template, simplified — ch06 has no footnotes, no part-opener pages, no
  cross-page structural boundaries).
- **Heuristics fired:**
  - ET running-header drop: `y0 < 45 AND (size <= 11.5 OR text.strip().isdigit())`.
    Caught 9 even-page book-title headers, 8 odd-page chapter-title headers,
    16 running page numbers (all at y=35, size=11).
  - Bottom-of-page page-number drop: only page 104 has its page number at the
    bottom (y=530.8 size=11, "72"). Dropped by extra `y > 520 AND digit` rule.
  - Chapter-label drop: `6. peatükk` italic NewCaledoniaLTStd-It size 12.5
    at y=52.8 on page 104. Dropped via regex `^\d+\.\s*peatükk\s*$`.
  - Heading detection: size ≥ 13.0 ∧ ≤ 15.0 matching `TEGUTSEMA` on page 104
    (single hit at y=77.8, size 14.0).
  - Drop-cap detection: BrushScriptStd at size > 20 on page 104. Single hit:
    `K` at y=103 size 33.
  - Drop-cap merge: first body line at y=107, x=92.1 (wrap indent around
    the `K` glyph); merged `K` + `ui isiklik...` → `Kui isiklik...`.
  - Drop-cap wrap zone: second line at y=121.5 x=92.1 recognised as wrap
    continuation (not a new paragraph).
  - Paragraph-start detector: body margin 56.7, indent at ~68; `x >= 64 AND
    x <= 80` marks first line of a new paragraph.
  - Cross-page continuation: paragraphs that wrap across a page boundary
    continue without flush when the new-page first line is not indented. No
    body-prose paragraph actually wraps across a page in this chapter (every
    page boundary coincides with a paragraph boundary), but the logic is in
    place defensively.
  - Soft-hyphen strip-and-join: U+00AD is the primary ET cross-line mechanism
    (~100 occurrences in this chapter). Stripped at join time, no space
    inserted.
  - En-dash (U+2013) space-padded join: en-dash at line end preserved with
    space when it had trailing space in the source; ~20 occurrences.
  - Minus-sign (U+2212) item-separator: used twice in this chapter for the
    visual dash `−` (in `p013`: `viimse kui ühe?`, and in `p041`:
    `neutraalsesse asendisse − turvaliselt`). Joined with space, preserved
    verbatim.

## Schema decisions

- **Drop-cap:** followed the chapter/story convention — merge `K` glyph with
  the first body word `ui...` to produce `Kui...`, no space. The wrap zone
  (second line indented at x=92.1) is recognised to not start a new
  paragraph.
- **Third/Seventh Step Prayer, Ninth Step Promises, embedded short prayers:**
  kept **inline** in their surrounding paragraphs per conventions — italics
  alone is not a split signal.
  - Seventh-Step Prayer inline at `p014`: `„Mu Looja, ma olen valmis..."`
  - Short inline prayer at `p042`: `„Kuidas saaksin ma Sind kõige paremini
    teenida – Sinu tahtmine (mitte minu) sündigu."`
  - Short inline prayer at `p050`: `„Sinu tahtmine sündigu."`
  - Ninth-Step Promises prose spans `p038` (the "we are going to know a new
    freedom..." passage) plus the answer-paragraph `p039`. Emitted as regular
    paragraphs, not blockquotes.
- **U+002D hyphens at line-end:** the ET conventions doc notes Estonian
  typography uses U+00AD (soft hyphen) for cross-line splits and U+002D only
  for authored compound hyphens (intra-line). Audited the chapter: only one
  U+002D line-end (`Võib-` + `olla` on p106), and it is a legitimate compound
  (`Võib-olla`). Rule: when a line ends with U+002D, **preserve** the
  hyphen and join without space. This is the inverse of the EN rule (which
  strips U+002D before lowercase). Produced `Võib-olla` correctly at seven
  places in the chapter.
- **No footnote, verse, list-item, byline, blockquote, or table blocks.** The
  chapter is pure narrative prose + inline dialogue + inline prayers. Block
  kinds used: `heading` (1), `paragraph` (52).

## Flagged blocks

None. All 53 blocks cleanly bucketed. Spot-audited the full output at
`.tmp/ch06-et-audit.txt`; no header leaks, no digit-only blocks, no stray
soft hyphens in output text, no double spaces.

Minor source quirks noted but preserved verbatim (fidelity-over-correction
per ET conventions):

- `p030`: `"Naine võib võib meilt nõuda..."` — duplicated `võib` in source.
  Preserved.
- `p018`: `"Inimene, kelle juurde oleme tulnud ka oma süüd"` — capitalised
  `Inimene` mid-sentence in the Estonian source. Preserved.
- `p020`: `"raha võlgu"` (no hyphen), consistent with source — no fix needed.
- `p038`: `"teele  jõuame"` (double space in source at y=121) — the join
  pass collapses it via `re.sub(r"[ \t]{2,}", " ", out)` so output has a
  single space.

## Schema proposals

None from this section. The ch11 template applied cleanly after two small
adjustments for ch06's simpler structure:

1. Dropped the footnote-detection and footnote-emission machinery (ch06 has
   no footnotes).
2. Inverted the U+002D-at-line-end rule: **preserve** the hyphen rather than
   strip. This aligns with the ET conventions doc's statement that U+00AD is
   the cross-line mechanism and U+002D is authored content — but the current
   ch11 ET template still carried the EN strip-on-lowercase rule as a
   fallback. For ET, that fallback is incorrect; U+002D at line-end should
   always be preserved (or at minimum, requires an ET-specific allowlist that
   is wider than EN's). The Wave 1 ET conventions doc noted "Real U+002D
   hyphens in ET body text: present but intra-line only" — ch06 produced a
   single counter-example (`Võib-olla` split across p106 y=222/237), so the
   "intra-line only" claim is empirically false for this chapter. **Proposed
   conventions update:** in ET, line-end U+002D should be preserved
   unconditionally (join without space). This mirrors what the ch11 template
   actually did (it didn't encounter line-end U+002D, so the bug was latent).
