#!/usr/bin/env python3
"""m_006: Join wrapped lines into proper paragraphs.

Consecutive non-blank lines are joined with a single space.
Blank lines are preserved as paragraph separators.
"""
from pathlib import Path

here = Path(__file__).parent
src = here / "m_005.txt"
dst = here / "m_006.txt"

lines = src.read_text().splitlines()
paragraphs = []
current = []

for line in lines:
    stripped = line.rstrip()
    if stripped:
        current.append(stripped)
    else:
        if current:
            paragraphs.append(' '.join(current))
            current = []
        paragraphs.append('')

if current:
    paragraphs.append(' '.join(current))

dst.write_text("\n".join(paragraphs) + "\n")

orig_nonblank = sum(1 for l in lines if l.strip())
new_nonblank = sum(1 for l in paragraphs if l.strip())
print(f"m_006: {orig_nonblank} content lines -> {new_nonblank} paragraphs")
