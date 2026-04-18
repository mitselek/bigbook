# Remove even-page headers: page number + ALCOHOLICS ANONYMOUS
s/^\d{1,3}\s+ALCOHOLICS ANONYMOUS\s*\n//g
# Remove odd-page headers: CHAPTER TITLE (all caps) + page number
s/^[A-Z][A-Z .'\u2019-]{5,}\s+\d{1,3}\s*\n//g
# Remove standalone page numbers (line with only digits)
s/^\d{1,3}\s*\n//g
