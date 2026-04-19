# Wave 1-2 backup — cross-run repeatability evidence

Original outputs from ET Wave 1 (`ch01-billi-lugu`) and Wave 2
(`ch05-kuidas-see-toetab`, `story-doktor-bobi-painajalik-unenagu`,
`appendix-i-aa-traditsioonid`) preserved here before Wave 4 re-runs.

## Repeatability analysis (Wave 4)

Fresh extractions produced at canonical paths on 2026-04-18 vs these
backup originals:

| Section                                | Blocks old → new | 5-gram Jaccard | Divergence                             |
| -------------------------------------- | ---------------- | -------------- | -------------------------------------- |
| `ch05-kuidas-see-toetab`               | 61 → 61          | **1.00000**    | byte-identical                         |
| `ch01-billi-lugu`                      | 71 → 71          | 0.99908        | footnote ↔ byline order swap at bottom |
| `appendix-i-aa-traditsioonid`          | 33 → 34          | 0.99866        | fresh run caught extra sub-heading     |
| `story-doktor-bobi-painajalik-unenagu` | 39 → 39          | 0.99671        | list-item marker inclusion variance    |

**Verdict:** the extraction method is highly reproducible. All three
variance sources are documented conventions gaps that were formalized
in the Wave 4 refinements of the ET conventions doc, not systematic
bugs. The re-runs replace these originals as the canonical outputs.

Subagents must not consult files in this directory — referencing them
biases any future re-run.
