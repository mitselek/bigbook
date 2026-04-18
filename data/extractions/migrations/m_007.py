#!/usr/bin/env python3
"""m_007: Join wrapped lines into proper paragraphs."""
from pathlib import Path

here = Path(__file__).parent
lines = (here / "m_006.txt").read_text().splitlines()
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

(here / "m_007.txt").write_text("\n".join(paragraphs) + "\n")
orig_nonblank = sum(1 for l in lines if l.strip())
new_nonblank = sum(1 for l in paragraphs if l.strip())
print(f"m_007: {orig_nonblank} content lines -> {new_nonblank} paragraphs")
