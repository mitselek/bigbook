# appendix-iii-meditsiiniline-vaade-aa-le — extraction report

## Summary

Two-page ET appendix (pp. 601-602, book pp. 569-570). Ten blocks emitted: 1 heading, 8 paragraphs, 1 footnote — **exact structural parity with the EN counterpart** (`appendix-iii-the-medical-view-on-aa`, 10 blocks, same kind distribution). No verse / list-item / blockquote / byline / table. Clean extraction; one cross-page paragraph merge fired; one source typo preserved verbatim in the heading.

## Method

- **Library:** PyMuPDF `page.get_text("dict")` only. No `pdfplumber` needed.
- **Heuristics fired:**
  - ET running-header / page-number drop — dropped `'569'` (y=530.79, p601) and `'570'` (y=34.99, p602). Both pure-digit, body-size 11pt, at y-boundaries (y>520 or y<45).
  - Two-line appendix heading merge (`III` + `MEDITSIINILNE VAADE AA-le`) → single heading block joined by space. Both lines at sz=14 NewCaledoniaLTStd at the top of p601 (y=48.66 and y=63.66).
  - Paragraph-start detection via first-line indent `x0 >= 64` (body margin ~56.69, indent column ~68.03). Nine paragraphs detected.
  - Cross-page paragraph continuation: Bauer's paragraph starts on p601 (y=406, `Dr W W Bauer ütles 1946. aastal...`) and the first three lines of p602 (y=49..114 ending `aastateks.`) arrive at body-margin `x=56.69` (wrap column, not indent) → absorbed into the same paragraph block (`p006`).
  - Soft-hyphen join (ET default) — multiple cross-line splits joined cleanly. Zero U+002D cross-line splits in this section.
  - Footnote detection: line starts with `*`, `y > 500`, italic font (`TimesNewRomanPS-ItalicMT`). Fired once on p601 y=534.62 → `* 1944.` as `footnote` block.

## Schema decisions

### Heading: two-line merge with preserved source typo

Emitted as single `heading` block with text `"III MEDITSIINILNE VAADE AA-le"`.

**Source typo preserved verbatim:** the PDF renders `MEDITSIINILNE` (missing the final `I` in `MEDITSIINILINE`). The section metadata `title` field is the corrected `"III Meditsiiniline vaade AA-le"` (prose-case, the canonical form). The `heading` block preserves the visual rendering with the typo, per the ET conventions fidelity-over-correction principle and the parent conventions' note on `title`-vs-`heading` divergence. Similar precedent: EN heading uses all-caps with periods `THE MEDICAL VIEW ON A.A.`; ET uses mixed case `VAADE AA-le` (lowercase `le` suffix on `AA-le`).

Also noteworthy: the `AA-le` compound retains its intra-line U+002D hyphen (authored compound, not a line-break artifact) — consistent with ET convention for authored hyphen compounds.

### Footnote placement within page (Wave 4 ordering)

The footnote `"* 1944."` sits physically at p601 y=534 (page bottom). EN's counterpart footnote is on its section's final page (p575, i.e. EN's page 2 of 2). In ET, the footnote is on p601 (page 1 of 2). The `pdfPage` field records the literal page (601), and the draft-sort key ensures footnotes appear **after** the body blocks on their own page but before the next page's body blocks — matching the Wave 4 "footnote before byline, body before footnote" reading-order rule. The footnote `*` marker is preserved as the first character; a space is inserted between `*` and `1944.` to match the EN convention (`* 1944`).

The in-paragraph reference site is in `p002`: `"...iga aastasel New Yorgi osariigi meditsiiniühenduse koosolekul*:"` — the `*` is carried inline as authored.

### Italic parenthetical on p602 (y=283..335) → `paragraph`, not `blockquote`

The closing paragraph `"(See pöördumine on nüüd avalikustatud brošüürina...)"` uses `NewCaledoniaLTStd-It` (italic) for all lines, wrapped in parentheses. **Same font size (~11pt) and same x-indent (68.03 first-line / 56.69 wrap)** as surrounding body — only italic styling differs. Under conventions, `blockquote` requires smaller font **AND** distinct indent column **AND** parenthetical framing. Only the parenthetical frame is present here. Emitted as `paragraph` (block `p010`), matching the EN counterpart's identical decision for its `p009`.

### Source quirks preserved verbatim

Per ET conventions' fidelity principle:

- **`MEDITSIINILNE`** (heading) — missing `I`. Should be `MEDITSIINILINE`. Preserve.
- **`Silkworth’i`** (p002) — Estonian genitive construction on English proper noun with curly apostrophe. Preserve.
- **`Dr`, `Dr G Kirby`, `Dr W W Bauer`, `Dr John F Stouffer`** — no periods after title/initials, unlike EN (`Dr.`, `G.`, `W. W.`). Consistent ET omission; preserve.
- **`AA-ga`, `AA-le`** — inflected Estonian forms with intra-line U+002D; preserve.
- **Collier's closing quote is missing** (p004 ends `väärib meie tähelepanu.` with no closing `”`). EN has a closing `"`. Source punctuation bug; preserve.
- **`sisemne`** (p005) — should be `sisemine` (missing `i`). Preserve as source artifact.
- **`risti-rüütlid`** (p006, was `risti\xadrüütlid` in raw) — soft-hyphen join produced `ristirüütlid` in output; this is a mid-word cross-line split using U+00AD (ET standard mechanism), correctly stripped.
- **`Bill W“`** (p010) — single curly closing quote style opening with `„` and closing with `“`. Preserve as authored.
- **Two-dot ellipsis / three-dot** — `…` (single-char U+2026) used once in Bauer (`probleemid…`), three-dot `...` used in Kennedy (`kaaslaste sekka...`). Both source-authored; preserve.

### No heading for "in-line" doctor sub-sections

Like EN, each doctor excerpt (Kennedy, Collier, Tiebout, Bauer, Stouffer) starts with an attribution phrase (`"Dr Foster Kennedy, neuroloog: „..."`) as the opening clause of its paragraph. Not a sub-heading — kept as ordinary `paragraph` per EN parity.

### Cross-page paragraph merge (Bauer's excerpt)

Bauer's paragraph starts on p601 (y=406, `"Dr W W Bauer ütles 1946. aastal..."`) and continues onto p602 (y=49..114, ending `"...kuud aastateks."`). The merge fires because the first line of p602 arrives at the wrap column `x=56.69` (not the first-line indent `x≥64`) — the algorithm simply doesn't start a new paragraph, so the continuation appends to the open block. Terminal-punctuation heuristic also agrees: p601's last Bauer line ends with `"ega "` (no terminal punctuation), signaling continuation. Final merged paragraph (`p006`) remains tagged `pdfPage: 601` (first page of origin).

## Flagged blocks

None requiring escalation. All 10 blocks align 1-to-1 with EN's 10 blocks.

Minor curiosities worth the PO's awareness (documented above):

- **`h001`** — source heading has typo `MEDITSIINILNE`; metadata `title` has corrected spelling `Meditsiiniline`. Heading preserves source per conventions.
- **`p004`** (Collier) — missing closing `”`. Source punctuation bug; preserved.
- **`p005`** (Tiebout) — `sisemne` should be `sisemine`. Source typo; preserved.
- **`p010`** — italic parenthetical; kept as `paragraph` (matches EN).

## Schema proposals

None. Extraction conformed cleanly to existing parent + ET companion conventions.

## Block inventory

| id                                                    | kind      | page | first 60 chars                                                 |
| ----------------------------------------------------- | --------- | ---- | -------------------------------------------------------------- |
| appendix-iii-meditsiiniline-vaade-aa-le-h001          | heading   | 601  | III MEDITSIINILNE VAADE AA-le                                  |
| appendix-iii-meditsiiniline-vaade-aa-le-p002          | paragraph | 601  | Alates Dr Silkworth’i toetuseavaldusest Anonüümsetele Alkoho   |
| appendix-iii-meditsiiniline-vaade-aa-le-p003          | paragraph | 601  | Dr Foster Kennedy, neuroloog: „See Anonüümsete Alkohoolikute   |
| appendix-iii-meditsiiniline-vaade-aa-le-p004          | paragraph | 601  | Dr G Kirby Collier, psühhiaater: „Ma olen mõistnud, et AA on   |
| appendix-iii-meditsiiniline-vaade-aa-le-p005          | paragraph | 601  | Dr Harry M Tiebout, psühhiaater: „Olen psühhiaatrina palju m   |
| appendix-iii-meditsiiniline-vaade-aa-le-p006          | paragraph | 601  | Dr W W Bauer ütles 1946. aastal Ameerika Meditsiini Ühingu e   |
| appendix-iii-meditsiiniline-vaade-aa-le-f007          | footnote  | 601  | \* 1944.                                                       |
| appendix-iii-meditsiiniline-vaade-aa-le-p008          | paragraph | 602  | Dr John F Stouffer, peapsühhiaater, Philadelphia üldhaiglas    |
| appendix-iii-meditsiiniline-vaade-aa-le-p009          | paragraph | 602  | Ameerika Psühhiaatrite ühing palus 1949. aastal, et üks Ano    |
| appendix-iii-meditsiiniline-vaade-aa-le-p010          | paragraph | 602  | (See pöördumine on nüüd avalikustatud brošüürina, mida saab    |

Kind counts: `{heading: 1, paragraph: 8, footnote: 1}`. Total 10. EN parity: exact match.
