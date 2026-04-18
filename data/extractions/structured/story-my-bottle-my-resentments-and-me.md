# story-my-bottle-my-resentments-and-me — extraction report

## Summary

Extracted pages 443–451 of the Big Book 4th edition — the first personal story in **Part III "They Lost Nearly All"**. Produced **26 blocks** total: 1 heading + 25 paragraphs. No list-items, no verse, no footnotes, no table, no byline, no editorial blockquote. JSON validated.

## Method

Used **PyMuPDF** (`pymupdf`) via `page.get_text("dict")` to obtain per-line spans with font, size, and bbox coordinates. No pdfplumber. Extraction script at `.tmp/extract-story-bottle.py`; PDF probe dump at `.tmp/bottle-probe.txt`.

Heuristics applied:

- Running headers dropped: `y0 < 50 AND size <= 9.5` OR digits-only (running page numbers).
- Bottom-of-page page-number drop: digits-only at `y0 > 500`.
- Story-number `(1)` at y=79.13 on page 443 dropped (structural numbering; Part III resets to `(1)`).
- Two-line heading merge (see Schema decisions).
- Drop-cap `W` + body remainder `hen i rode into...` → `When I rode into...` (single-letter-plus-word merge; `\bi\b → I` to fix SC pronoun).
- Body-margin parity inferred per page:
  - Pages 443, 445, 447, 449, 451 → body margin 52.28, paragraph indent ≥ 60.28.
  - Pages 444, 446, 448, 450 → body margin 69.28, paragraph indent ≥ 77.28.
  - Note: parity is flipped relative to story-the-missing-link (which had odd-page margin 69.28). The body-margin helper therefore uses the **observed** parity for this section, not a fixed odd/even convention shared across stories.
- Cross-page paragraph merge happens implicitly: PyMuPDF emits each page as separate blocks, but the per-page first-line-indent splitter leaves the first line of each continuation page (body-margin x0, no indent) attached to the preceding paragraph. Verified against pp. 443→444 (p005) and pp. 448→449 (p019).
- Applied Wave 5/6/7 hyphenation rules: em-dash bidirectional no-space join, cross-line hyphen strip with compound-prefix allowlist, number-prefix qualification via `NUMBER_TAILS`, narrowed capitalized-stem allowlist (`PROPER_NOUN_STEMS`) with sentence-initial exclusion.
- Multi-hyphen rule tightened further (see Schema proposals).

## Schema decisions

### Heading — two-line centered title merged with a space

Source has:

```
y=102.22 "MY BOTTLE, MY RESENTMENTS,"   (size 13.5, x=78.94, centered)
y=122.22 "AND ME"                       (size 13.5, x=159.46, centered)
```

Merged to a single `heading` block: `MY BOTTLE, MY RESENTMENTS, AND ME` (joined with a space; interior whitespace collapsed via `re.sub(r"\s+", " ", ...)` defensive pass). This follows the housewife-who-drank-at-home precedent (another two-line centered title merged with a space).

Verdict: **two-line merge applied**.

### Subtitle — single paragraph

Three italic deck lines on page 443:

```
y=150.37 x=76.28 "From childhood trauma to skid row drunk, this hobo"
y=163.96 x=64.27 "finally found a Higher Power, bringing sobriety and a"
y=177.56 x=64.27 "long-lost family."
```

Only one first-line indent (x=76.28 on line 1; continuations at x=64.27). Emitted as a single `paragraph` block per the conventions' default.

### Story-number `(1)` dropped

Decorative structural numbering. First story in Part III — Part III re-starts the numbering from `(1)`. Dropped per conventions.

### Drop-cap merge

`W` (ParkAvenue 51.65 at y=201.78) + first body chunk `hen i rode into a small mountain town in` → `When I rode into a small mountain town in`. Applied `\bi\b → I` to flatten the SC pronoun.

### No byline, no verse, no footnote, no table, no blockquote

Story closes with `I believe that I am living proof of the A.A. saying "Don't give up until the miracle happens."` — no sign-off byline. No scripture quotes, prayers, song titles, or dialogue segments that would trigger verse candidates.

### parentGroup

`personal-stories/they-lost-nearly-all` — NEW parentGroup (first story in Part III). Verified against the metadata in the agent prompt.

### Front-matter verdicts

- **Heading block**: emitted as a single two-line merged heading. Verdict: PRESENT, merge applied correctly.
- **Subtitle paragraph**: emitted as 1 block (single indent group). Verdict: PRESENT.
- **Drop-cap merge**: applied (W + hen + SC pronoun fix). Verdict: PRESENT.
- **Byline**: ABSENT (story has no author-attribution sign-off).

## Flagged blocks

None. All 26 blocks read cleanly, compound hyphens preserved where appropriate (`long-lost`, `lice-infested`, `two-year`, `day-labor`, `wild-eyed`, `thirty-three`, `ex-wife`, `twenty-five`, `modern-day`, `sister-in-law`, `twenty-four`, `twenty-seven`), line-break hyphens correctly stripped (`self-centeredness` not `self-centered-ness`; `camp outside` joined across pages).

One item worth noting (not flagged, just documented): `p016` contains an em-dash-at-line-START join — `thought was If he can do that, I can do that—and much better...` — where `—and much better` continues from the previous line without an inserted space. Wave 7 bidirectional em-dash rule handled this correctly.

## Schema proposals

### Multi-hyphen compound preservation: require a CONNECTOR intermediate word

The Wave 7 "tightened" regex `^\w+-\w+-$` (or "≥ 2 intermediate hyphens") incorrectly triggers on content-word compounds like `self-centered-` (which continues on the next line with `ness` → should be `self-centeredness`, NOT `self-centered-ness`). The regex matches both `life-and-` (desired) and `self-centered-` (undesired). My script uses a stricter rule:

- Preserve the trailing hyphen only when the out-buffer's last token, when split on `-`, contains a CONNECTOR word (`and`, `to`, `a`, `in`, `of`, `or`) in one of the non-first segments.

This keeps `life-and-death`, `face-to-face`, `ten-dollar-a-week`, `get-to-gether → get-together` behavior but correctly reduces `self-centered-ness` to `self-centeredness`.

Other extracted outputs already emit `self-centeredness` (ch01, ch05, ch09), so this rule aligns my output with theirs. Concrete evidence: `data/extractions/structured/ch01-bills-story.json` line 367 `"destruction of self-centeredness"`; `ch05-how-it-works.json` line 181 `"Selfishness—self-centeredness!"`.

Suggest adding this refinement to the conventions doc's Wave 8 evolution entry.

## Counts

- Total blocks: 26
- `heading`: 1
- `paragraph`: 25
- `list-item`, `blockquote`, `verse`, `footnote`, `table`, `byline`: 0
- Pages covered: 443, 444, 445, 446, 447, 448, 449, 450, 451 (all 9 pages).
