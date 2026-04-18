#!/usr/bin/env python3
"""m_001b: Insert blank lines at paragraph boundaries.

Detects paragraph starts by indent increase of 3+ spaces
compared to the previous non-blank line. Inserts a blank line
before such lines to create explicit paragraph boundaries.

Exception: hanging-indent continuations after list-item markers
(e.g. "1. ...", "One—...") are NOT treated as new paragraphs.
"""
import re
from pathlib import Path

here = Path(__file__).parent
src = here / "m_001.txt"
dst = here / "m_001b.txt"

LIST_MARKER = re.compile(
    r'^\s*(\d+\.[\s—]'          # 1. or 1.—
    r'|(?:One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve)—'
    r'|[IVX]+\.\s)'             # I. II. etc
)

lines = src.read_text().splitlines()
out = []
prev_indent = -1  # -1 = after blank line
prev_line = ''

for line in lines:
    stripped = line.rstrip()
    if not stripped:
        out.append('')
        prev_indent = -1
        prev_line = ''
        continue

    indent = len(stripped) - len(stripped.lstrip())

    # If indent increased by 3+ from previous content line, insert blank line
    # UNLESS previous line was a list-item marker (hanging indent continuation)
    if prev_indent >= 0 and indent - prev_indent >= 3:
        if not LIST_MARKER.match(prev_line):
            out.append('')

    out.append(stripped)
    prev_indent = indent
    prev_line = stripped

dst.write_text("\n".join(out) + "\n")

# Count inserted blanks
orig_blanks = sum(1 for l in lines if not l.strip())
new_blanks = sum(1 for l in out if not l)
print(f"m_001b: inserted {new_blanks - orig_blanks} paragraph breaks")
