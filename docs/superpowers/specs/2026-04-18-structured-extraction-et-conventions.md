# Structural-extractor conventions — Estonian companion

**Date:** 2026-04-18
**Status:** Living document — seeded empty, fills as waves complete.
**Parent:** `2026-04-18-structured-extraction-conventions.md` (English, shared baseline).

This document records **Estonian-only** rule additions and refinements. Anything applicable to both languages goes in the parent conventions doc. Read the parent doc first, then apply the additions below for ET sections.

## Schema

Unchanged from parent. Same `BookSection` / `Block` shape, same `BlockKind` values.

## Text normalization (ET additions)

- **Estonian diacritics** — `õ`, `ä`, `ö`, `ü` (and capitals `Õ Ä Ö Ü`): preserve as-is. These are authored content, not typographic artifacts. PyMuPDF delivers them as Latin-Extended-A/-B codepoints.
- **Ligatures** — expected to be same as EN (U+FB01 `ﬁ` → `fi`, etc.). Verify in pilot.
- _(Further ET-specific rules added as waves progress)_

## Cross-line hyphenation (ET additions)

Estonian compound-word rules differ from English. The EN allowlist (`self-`, `well-`, `co-`, `non-`, etc.) is **not** applicable to ET — different word roots.

**Seed allowlist for ET** (to be refined by pilot):

- None. Start with the assumption that any line-end `-` strips-and-joins without space. Agents flag cases where this produces mangled words; PO decides what to add to the allowlist.

Known Estonian compound prefixes that may surface (for reference, not yet in allowlist):

- `pere-` (family-), `töö-` (work-), `taas-` (re-), `üle-` (over-), `ala-` (under-)
- ordinal forms: `esimese-`, `teise-`, `kolmanda-`, etc. (`first-`, `second-`, `third-`...)

## Evolution log

- **2026-04-18 (outline built, pilot dispatched)** — initial ET conventions seeded empty. All rules from the parent EN conventions apply as baseline. ET-specific additions will be captured here as they emerge.
