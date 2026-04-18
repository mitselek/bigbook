#!/usr/bin/env python3
"""m_003: Remove print production artifacts (Alco_*.qxd lines)."""
from pathlib import Path
from apply_re import parse_re_file, apply_fixes

here = Path(__file__).parent
text = (here / "m_002.txt").read_text()
fixes = parse_re_file(here / "m_003_fixes.re")
text, applied = apply_fixes(text, fixes)
(here / "m_003.txt").write_text(text)
print(f"m_003: {applied}/{len(fixes)} patterns applied")
