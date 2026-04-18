#!/usr/bin/env python3
"""m_007: Normalize blank lines — collapse runs of 2+ blank lines into 1."""
from pathlib import Path

here = Path(__file__).parent
src = here / "m_006.txt"
dst = here / "m_007.txt"

lines = src.read_text().splitlines()
out = []
prev_blank = False

for line in lines:
    if not line.strip():
        if not prev_blank:
            out.append('')
        prev_blank = True
    else:
        out.append(line)
        prev_blank = False

# Strip leading/trailing blank lines
while out and not out[0]:
    out.pop(0)
while out and not out[-1]:
    out.pop()

dst.write_text("\n".join(out) + "\n")
print(f"m_007: {len(lines)} -> {len(out)} lines")
