---
type: rule
status: live
---

- src/content/{en,et}/ is generated only by the bootstrap script from the structured extractions plus the pairing artifact: 70 files per language, 68 sections in four TOC groups. Nobody hand-edits it except end users via the live editor. `v:2026-09-19`
  - `ev: scripts/bootstrap-content/bootstrap.ts:213-217; data/extractions/; npm run bootstrap`
  - `rf: git log -- src/content shows only bootstrap and editor commits`
- Bootstrap is a fixed point since issue 41: Prettier pass inside emit, no generatedAt in the manifest, regression test shells out and asserts a clean tree. `v:2026-09-19`
  - `ev: commits 3f1c8d9 5358898 328c505; tests/scripts/bootstrap-content/idempotency.test.ts`
  - `rf: CONTENT_BOOTSTRAP=1 npm run bootstrap && git status --porcelain src/content`
- Pairing artifact: 67 paired sections plus one EN-only unpaired (a-pamphlets), 2033 paraIds, two accepted N:M splits, zero needs-review; verify script must stay OK. `v:2026-09-19`
  - `ev: data/extractions/pairing/en-et.json; issue 39`
  - `rf: npm run pair:verify`
- Numbering debt: extractions number blocks by position-in-section, pairing and content by within-kind ordinal. PO rejected keeping both as accepted design; pick one scheme at the next pipeline revisit. `v:2026-09-19`
  - `ev: docs/superpowers/specs/2026-04-19-en-et-pairing-artifact-design.md "Known design debt"; commit c2ee691`
  - `rf:`
- Asymmetric blocks are filled from the manual worksheet first, then the Boderie translation cache; the PO hand-translated all 64 so the API path never fired. Machine or worksheet text carries the (_BB:Boderie_) attribution. `v:2026-09-19`
  - `ev: data/extractions/pairing/manual-translations.json; data/extractions/pairing/translation-cache.json; scripts/bootstrap-content/boderie.ts`
  - `rf: =ev`
- The Estonian edition's Lasker Award appendix (a-iv) contains only the salutation; its ET body is a worksheet translation, not source text. An authoritative version needs a PDF supplement or hand-authoring. `v:2026-09-19`
  - `ev: data/extractions/structured-et/et-4th-edition.json a-iv; session 15`
  - `rf: legacy/assets ET PDF appendix IV`
- ch01's closing death-date line was reclassified paragraph to byline in the EN extraction to match ET; any re-extraction must preserve that kind or the pairing count breaks. `v:2026-09-19`
  - `ev: data/extractions/structured/en-4th-edition.json ch01 last block; session 14`
  - `rf: npm run pair:verify after re-extraction`
