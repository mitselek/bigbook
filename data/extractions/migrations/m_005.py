#!/usr/bin/env python3
"""m_005: Fix spaced-out drop-cap words."""
from pathlib import Path
from apply_re import parse_re_file, apply_fixes

here = Path(__file__).parent
text = (here / "m_004.txt").read_text()
fixes = parse_re_file(here / "m_005_fixes.re")
text, applied = apply_fixes(text, fixes)
(here / "m_005.txt").write_text(text)
print(f"m_005: {applied}/{len(fixes)} patterns applied")
