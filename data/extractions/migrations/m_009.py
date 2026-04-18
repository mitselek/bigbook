#!/usr/bin/env python3
"""m_009: Normalize blank lines — collapse runs of 2+ into 1."""
from pathlib import Path

here = Path(__file__).parent
lines = (here / "m_008.txt").read_text().splitlines()
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

while out and not out[0]:
    out.pop(0)
while out and not out[-1]:
    out.pop()

(here / "m_009.txt").write_text("\n".join(out) + "\n")
print(f"m_009: {len(lines)} -> {len(out)} lines")
