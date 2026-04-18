#!/usr/bin/env python3
"""m_001: Remove print production artifacts.

Lines like: Alco_1893007162_6p_01_r5.qxd 4/4/03 11:17 AM Page 576
"""
import re
from pathlib import Path

here = Path(__file__).parent
src = here.parent / "en-4th-edition.raw.txt"
dst = here / "m_001.txt"

lines = src.read_text().splitlines()
out = [l for l in lines if not re.match(r'\s*Alco_\d+.*\.qxd\b', l)]
dst.write_text("\n".join(out) + "\n")
print(f"m_001: {len(lines)} -> {len(out)} lines ({len(lines)-len(out)} removed)")
