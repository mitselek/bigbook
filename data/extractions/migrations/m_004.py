#!/usr/bin/env python3
"""m_004: Strip leading whitespace from all lines."""
from pathlib import Path

here = Path(__file__).parent
src = here / "m_003.txt"
dst = here / "m_004.txt"

lines = src.read_text().splitlines()
out = [l.lstrip() for l in lines]
changed = sum(1 for a, b in zip(lines, out) if a != b)
dst.write_text("\n".join(out) + "\n")
print(f"m_004: stripped leading whitespace from {changed} lines")
