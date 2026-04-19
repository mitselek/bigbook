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
- [ ] Wave 5 (22 sections)
- [ ] Wave 6 (23 sections)

**Completed: 22 of 67 sections.**

## No para-id pairing in this cycle

This extraction produces the Estonian artifact standalone. Para-id pairing with the English `data/extractions/structured/` outputs is deferred to a separate future workstream.
