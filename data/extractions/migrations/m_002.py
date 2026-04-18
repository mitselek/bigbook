#!/usr/bin/env python3
"""m_002: Strip leading whitespace from all lines."""
from pathlib import Path

here = Path(__file__).parent
lines = (here / "m_001.txt").read_text().splitlines()
out = [l.lstrip() for l in lines]
changed = sum(1 for a, b in zip(lines, out) if a != b)
(here / "m_002.txt").write_text("\n".join(out) + "\n")
print(f"m_002: stripped leading whitespace from {changed} lines")
