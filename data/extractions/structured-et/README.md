# Structured extraction — Estonian

Per-section JSON + problems report for the **Estonian** translation of the Big Book, produced by PyMuPDF-based subagents under the shared conventions.

Source PDF: `legacy/_source/BIGBOOK layout.pdf` (608 pages)

## Files

- `outline.json` — 67 sections in document order with metadata (id, kind, title, pdfPage ranges, bookPage ranges)
- `<section-id>.json` — one file per section (filled by subagents, one per wave)
- `<section-id>.md` — freeform problems report per section
- `et-4th-edition.json` — final consolidated document (produced after all sections complete)

## Conventions

- **Parent:** `docs/superpowers/specs/2026-04-18-structured-extraction-conventions.md` (English, shared baseline)
- **ET additions only:** `docs/superpowers/specs/2026-04-18-structured-extraction-et-conventions.md`
- **Design spec:** `docs/superpowers/specs/2026-04-18-structured-extraction-et-design.md`

## Wave progress

- [x] Wave 1 (1 section): `ch01-billi-lugu` — pilot
- [x] Wave 2 (3 sections): `ch05-kuidas-see-toetab`, `story-doktor-bobi-painajalik-unenagu`, `appendix-i-aa-traditsioonid`
- [x] Wave 3 (6 sections): `ch02-lahendus-on-olemas`, `ch11-tulevikupilt-teie-jaoks`, `story-tanulikkus-tegudes`, `story-ka-naised-on-haiged`, `appendix-vii-kaksteist-kontseptsiooni`, `arsti-arvamus`
- [x] Wave 4 (16 sections — 12 new + 4 repeatability re-runs): ch01/ch05/dr-bob/appendix-i re-runs (vs `backup-wave-1-2/`), `ch03-alkoholismist-lahemalt`, `ch04-meie-agnostikud`, `ch06-tegutsema`, `ch07-too-teistega`, `ch08-naistele`, `eessona`, `story-anonuumne-alkohoolik-number-kolm`, `story-meie-sober-lounast`, `story-noiaring`, `story-jimi-lugu`, `story-mees-kes-seljatas-hirmu`, `story-ta-alahindas-enda-vaartust`
- [x] Wave 5 (23 sections): `copyright-info`, 4 forewords, `ch09-perekond-hiljem`, `ch10-tooandjatele`, `story-kuningriigi-votmed`, `appendix-ii-vaimne-kogemus`, `appendix-iii-meditsiiniline-vaade-aa-le`, 13 Part II stories
- [x] Wave 6 (22 sections; 3 retried after rate-limit): 4 Part II tail + 15 Part III stories + appendices IV, V, VI

**Completed: 67 of 67 sections. Full Estonian extraction DONE.**

## Final block stats

- Total blocks: **2,065**
- Paragraphs: 1,885
- Headings: 80 (includes copyright-info's 6 part-openers + section headings)
- List-items: 61 (Twelve Steps + Twelve Traditions short + long + Twelve Concepts + Six Steps in ta-alahindas + Dr. Bob's four reasons)
- Footnotes: 15
- Blockquotes: 11 (editorial interlude in story-anonuumne-alkohoolik-number-kolm pp220-221)
- Bylines: 5 (ch01 Bill W., 2 Silkworth signatures, Herbert Spencer epigraph, eessona-1st "Anonüümsed Alkohoolikud")
- Tables: 7 (5 TOC tables in copyright-info, ch05 resentment inventory, appendix-i LISAD TOC)
- Verse: 1 (Hampshire Grenadier tombstone in ch01)

## Consolidated artifact

`et-4th-edition.json` — single `BookSection[]`-shaped document with all 67 sections in document order. Matches EN shape for side-by-side comparison.

## No para-id pairing in this cycle

This extraction produces the Estonian artifact standalone. Para-id pairing with the English `data/extractions/structured/` outputs is deferred to a separate future workstream.
