# ch11 section-boundary fix backup

The original Wave 3 extraction of `ch11-tulevikupilt-teie-jaoks` used
an outline range of PDF pp. 183-202, but content of the chapter
actually ends at p. 196. Pages 197-202 are Part I section openers
(`1. osa / AA TEERAJAJAD` + decorative material) that belong
structurally BEFORE the first story, not inside ch11.

This caused the Wave 3 output to emit 77 blocks for ch11 including
15 transitional part-opener blocks that don't belong to the chapter.

The outline was updated: `pdfPageEnd: 196`, `bookPageEnd: 164`.
ch11 was re-extracted under the corrected range and now has the
chapter's real content only.

This backup preserves the pre-fix output for reference. Subagents
must not consult files in this directory.
