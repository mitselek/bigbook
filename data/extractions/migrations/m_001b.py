#!/usr/bin/env python3
"""m_001b: Insert blank lines at paragraph boundaries.

Detects paragraph starts by indent increase of 3+ spaces
compared to the previous non-blank line. Inserts a blank line
before such lines to create explicit paragraph boundaries.
"""
from pathlib import Path

here = Path(__file__).parent
src = here / "m_001.txt"
dst = here / "m_001b.txt"

lines = src.read_text().splitlines()
out = []
prev_indent = -1  # -1 = after blank line

for line in lines:
    stripped = line.rstrip()
    if not stripped:
        out.append('')
        prev_indent = -1
        continue

    indent = len(stripped) - len(stripped.lstrip())

    # If indent increased by 3+ from previous content line, insert blank line
    if prev_indent >= 0 and indent - prev_indent >= 3:
        out.append('')

    out.append(stripped)
    prev_indent = indent

dst.write_text("\n".join(out) + "\n")

# Count inserted blanks
orig_blanks = sum(1 for l in lines if not l.strip())
new_blanks = sum(1 for l in out if not l)
print(f"m_001b: inserted {new_blanks - orig_blanks} paragraph breaks")
