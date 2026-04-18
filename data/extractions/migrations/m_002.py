#!/usr/bin/env python3
"""m_002: Remove running headers/footers and standalone page numbers.

Patterns:
  - Even pages:  "  10              ALCOHOLICS ANONYMOUS"
  - Odd pages:   "  BILL'S STORY                    11"
  - Standalone:  "                          258"
"""
import re
from pathlib import Path

here = Path(__file__).parent
src = here / "m_001.txt"
dst = here / "m_002.txt"

lines = src.read_text().splitlines()
removed = 0
out = []

for line in lines:
    # Even-page header: page number then ALCOHOLICS ANONYMOUS
    if re.match(r'^\s*\d{1,3}\s+ALCOHOLICS ANONYMOUS\s*$', line):
        removed += 1
        continue
    # Odd-page header: CHAPTER TITLE (all caps, may include .'-) then page number
    if re.match(r"^\s*[A-Z][A-Z .'\u2019-]{5,}\s+\d{1,3}\s*$", line):
        removed += 1
        continue
    # Standalone page number
    if re.match(r'^\s*\d{1,3}\s*$', line):
        removed += 1
        continue
    out.append(line)

dst.write_text("\n".join(out) + "\n")
print(f"m_002: {len(lines)} -> {len(out)} lines ({removed} removed)")
