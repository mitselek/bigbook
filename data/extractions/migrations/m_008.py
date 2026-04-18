#!/usr/bin/env python3
"""m_008: Join wrapped lines into proper paragraphs.

Tag lines ([[type]]) are preserved on their own line.
Consecutive non-blank, non-tag lines are joined with a space.
"""
import re
from pathlib import Path

here = Path(__file__).parent
lines = (here / "m_007.txt").read_text().splitlines()

TAG_RE = re.compile(r'^\[\[.+\]\]$')
NO_JOIN_TAGS = {'[[verse]]'}  # Tags whose content lines should not be joined

paragraphs = []
current = []
current_tag = None

for line in lines:
    stripped = line.rstrip()
    if TAG_RE.match(stripped):
        # Flush current block
        if current:
            if current_tag in NO_JOIN_TAGS:
                paragraphs.append('\n'.join(current))
            else:
                paragraphs.append(' '.join(current))
            current = []
        paragraphs.append(stripped)
        current_tag = stripped
    elif stripped:
        current.append(stripped)
    else:
        if current:
            if current_tag in NO_JOIN_TAGS:
                paragraphs.append('\n'.join(current))
            else:
                paragraphs.append(' '.join(current))
            current = []
        paragraphs.append('')
        current_tag = None

if current:
    if current_tag in NO_JOIN_TAGS:
        paragraphs.append('\n'.join(current))
    else:
        paragraphs.append(' '.join(current))

(here / "m_008.txt").write_text("\n".join(paragraphs) + "\n")
orig_nonblank = sum(1 for l in lines if l.strip())
new_nonblank = sum(1 for l in paragraphs if l.strip())
print(f"m_008: {orig_nonblank} content lines -> {new_nonblank} paragraphs")
