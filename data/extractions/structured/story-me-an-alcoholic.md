# story-me-an-alcoholic — structured extraction report

## Summary

Wave 7 Part II.B story, 6 pages (PDF 393..398). **24 blocks emitted:** 1 `heading` + 23 `paragraph`. No list, verse, footnote, table, byline, or blockquote. Story-number prefix `(13)` dropped per conventions. Drop-cap `W` merged with small-caps tail `hen i try...` → `When I try...` (with `\bi\b → I` pronoun fix).

## Method

- Single pass with PyMuPDF `page.get_text("dict")` over pages 393..398.
- Line filters: `y0 < 50 AND size <= 9.5` (running headers), `y0 < 50 AND isdigit` (12pt page numbers leaking as body-size integers — fires on pages 394/396/398), `y0 > 500 AND isdigit` (bottom-of-page number on page 393), `^\(\d+\)\s*$` first-page story-number drop.
- First-page slot detection: heading (size ≥ 13, title-word match), subtitle (italic < 11.5pt, `y0 < 165`), drop-cap (ParkAvenue size > 40).
- Subtitle indent threshold 85.0 (continuation at x=81.27, indent at x=93.28 → single paragraph).
- Drop-cap merge: `"W"` + first body line `"hen i try to reconstruct..."` → `"When I try to reconstruct..."`. Single-letter + partial word = no space. Small-caps tail `i` pronoun flattened; targeted `re.sub(r"\bi\b", "I", merged_text)`.
- Body margins: odd pages 69.28 (393, 395, 397), even pages 52.28 (394, 396, 398). Paragraph indent threshold = margin + 8.
- Cross-line hyphen joins: Wave 6 compound-word allowlist applied; no compound splits hit the allowlist in this story (all cross-line hyphens here are plain-syllable breaks that get joined without a hyphen).

## Schema decisions

- **Heading preserves `?`**: visual rendering `ME AN ALCOHOLIC?` retained as-is in `blocks[0].text`; section `title` metadata is prose-case `Me An Alcoholic?` (both have the `?`; the slug drops it).
- **Story-number `(13)` dropped** (structural numbering, not authored content; convention says lean DROP and document).
- **Subtitle emitted as one paragraph** (`p002`). The italic deck is 2 lines with one indent group.
- **Drop-cap merge**: `W` + `hen` → `When`, no space (single letter + partial word pattern, same as Wave 6 missing-link).
- **Dialogue paragraphs (p015–p018)**: each dialogue turn renders at the paragraph-indent x-coordinate on page 396, so they become individual `paragraph` blocks. This matches the source typography (each speaker's turn indented as a new paragraph) and is consistent with Wave 5 dialogue handling in similar stories.
- **No byline**: story ends with a narrative sentence, not an author sign-off.

### Hyphen-join rule adjustments made in this script

Two small fixes applied to the Wave 6 template; each is a localized patch in this agent's script and is documented here so Plantin can consider promoting or scoping them in the conventions doc.

1. **Narrow the capitalized-stem hyphen preservation rule.** The Wave 6 convention (`if tail_token[:1].isupper(): keep_hyphen = True`) fires on `More-` + `over` at a cross-line break (p397→p397 internal), emitting `More-over` instead of `Moreover`. The false-positive class is "sentence-initial common English word ending with `-` because of a line break." I narrowed the rule to a small explicit proper-noun prefix allowlist: `God-`, `Anglo-`, `Franco-`, `Judeo-`, `Indo-`, `Sino-`, `Afro-`, `Euro-`. In this story the allowlist does not fire (no proper-noun compound splits), so the behavior is identical to the pre-Wave-6 code for this section. Recommend adopting this narrowing into conventions if future waves don't turn up a legitimate `<capitalized-stem>-<lowercase-continuation>` cross-line break outside the allowlist.
2. **Em-dash at line-start.** Wave 5 formalized that an em-dash at line-END joins without a space. The dual case occurs on page 393 where the em-dash sits at the START of the next line: `"stay there"` wraps and the next line begins `"—until the inevitable..."`. Without a fix this emits `"stay there —until..."` (space before em-dash). Added a mirror rule: when the next line starts with `\u2014`, join without inserting a space. Observed once in this story; same cosmetic class as the Wave 5 flag.

## Flagged blocks

- **p005** — contains the em-dash-at-line-start fix case. Resulting text ends `"...and stay there—until the inevitable next time."`. Verified flowing correctly.
- **p022** — contains the `Moreover` fix case. Text includes `"...during those seven years. Moreover, I am deeply convinced..."`. Verified.
- **p015 / p016 / p017** — short one-line dialogue paragraphs. Each turn starts at the paragraph-indent x on p396, so the paragraph-indent rule splits them. This is correct per source typography; flagging only for review awareness.

## Schema proposals

- **Capitalized-stem hyphen preservation scope** — narrow to an explicit proper-noun-prefix allowlist (see Fix 1 above). The current `tail_token[:1].isupper()` rule produces false positives on common words at line breaks, and the concrete motivator (`God-consciousness` in appendix-ii) is already covered by a named allowlist.
- **Em-dash line-start join** — mirror of the Wave 5 line-end rule. Applies when the continuation line starts with `\u2014`. Useful whenever a paragraph wraps such that the em-dash migrates to the next line's start.

## Constants check

| Check                                 | Value / result                                           |
| ------------------------------------- | -------------------------------------------------------- |
| Pages                                 | 393..398 (6 pages)                                       |
| Blocks emitted                        | 24 (1 heading, 23 paragraph)                             |
| Heading preserves `?`                 | Yes: `"ME AN ALCOHOLIC?"`                                |
| Title metadata                        | `"Me An Alcoholic?"` (prose-case, `?` preserved)         |
| Story-number `(13)` dropped           | Yes                                                      |
| Drop-cap merge                        | `"When I try to reconstruct what my life was like..."`   |
| Ligatures normalized                  | Yes (no `\ufb01` / `\ufb02` / etc. remain)               |
| Lowercase bare `i` pronouns in output | 0                                                        |
| Soft hyphens, NUL bytes               | None                                                     |
| JSON valid                            | Yes                                                      |
| Closing line                          | `"...never again have to go through them alone."` (p398) |
