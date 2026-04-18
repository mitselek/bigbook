# m_006: tag paragraph types
# Format: s/^PATTERN$/[[type]]\nMATCH/
# \n in replacement = literal newline

# === HEADINGS (broad patterns) ===
s/^(Chapter\s+\d+)$/[[heading]]\n\1/g
s/^(Preface)$/[[heading]]\n\1/g
s/^(FOREWORD TO (?:FIRST|SECOND|THIRD|FOURTH) EDITION)$/[[heading]]\n\1/g
s/^(THE DOCTORS OPINION)$/[[heading]]\n\1/g
s/^(BILL['’]S STORY)$/[[heading]]\n\1/g
s/^(THERE IS A SOLUTION)$/[[heading]]\n\1/g
s/^(MORE ABOUT ALCOHOLISM)$/[[heading]]\n\1/g
s/^(WE AGNOSTICS)$/[[heading]]\n\1/g
s/^(HOW IT WORKS)$/[[heading]]\n\1/g
s/^(INTO ACTION)$/[[heading]]\n\1/g
s/^(WORKING WITH OTHERS)$/[[heading]]\n\1/g
s/^(TO WIVES\*?)$/[[heading]]\n\1/g
s/^(THE FAMILY AFTERWARD)$/[[heading]]\n\1/g
s/^(TO EMPLOYERS)$/[[heading]]\n\1/g
s/^(A VISION FOR YOU)$/[[heading]]\n\1/g
s/^(DOCTOR BOB['’]S NIGHTMARE)$/[[heading]]\n\1/g
s/^(ALCOHOLICS ANONYMOUS)$/[[heading]]\n\1/g
# Story titles (Part I, II, III)
s/^(ALCOHOLIC ANONYMOUS)$/[[heading]]\n\1/g
s/^(GRATITUDE IN ACTION)$/[[heading]]\n\1/g
s/^(WOMEN SUFFER TOO)$/[[heading]]\n\1/g
s/^(OUR SOUTHERN FRIEND)$/[[heading]]\n\1/g
s/^(THE VICIOUS CYCLE)$/[[heading]]\n\1/g
s/^(JIM['’]S STORY)$/[[heading]]\n\1/g
s/^(THE MAN WHO MASTERED FEAR)$/[[heading]]\n\1/g
s/^(HE SOLD HIMSELF SHORT)$/[[heading]]\n\1/g
s/^(THE KEYS OF THE KINGDOM)$/[[heading]]\n\1/g
s/^(THE MISSING LINK)$/[[heading]]\n\1/g
s/^(TIGHTROPE)$/[[heading]]\n\1/g
s/^(FEAR OF FEAR)$/[[heading]]\n\1/g
s/^(INTO ACTION)$/[[heading]]\n\1/g
s/^(THE NEWS HAWK)$/[[heading]]\n\1/g
s/^(ACCEPTANCE WAS THE ANSWER)$/[[heading]]\n\1/g
s/^(WINDOW OF OPPORTUNITY)$/[[heading]]\n\1/g
s/^(STUDENT OF LIFE)$/[[heading]]\n\1/g
s/^(CROSSING THE RIVER OF DENIAL)$/[[heading]]\n\1/g
s/^(DOCTOR, ALCOHOLIC, ADDICT)$/[[heading]]\n\1/g
s/^(UNTO THE SECOND GENERATION)$/[[heading]]\n\1/g
s/^(ME AN ALCOHOLIC\?)$/[[heading]]\n\1/g
s/^(A DRUNK, LIKE YOU)$/[[heading]]\n\1/g
s/^(THE PERPETUAL QUEST)$/[[heading]]\n\1/g
s/^(WINNER TAKES ALL)$/[[heading]]\n\1/g
s/^(A HELL OF A BUSINESS)$/[[heading]]\n\1/g
s/^(STARS DON['’]T FALL)$/[[heading]]\n\1/g
s/^(FLOODED WITH FEELING)$/[[heading]]\n\1/g
s/^(BECAUSE I['’]M AN ALCOHOLIC)$/[[heading]]\n\1/g
s/^(DRINKING WAS MY TICKET)$/[[heading]]\n\1/g
s/^(MY BOTTLE, MY RESENTMENTS, AND ME.*)$/[[heading]]\n\1/g
s/^(HE LIVED ONLY TO DRINK)$/[[heading]]\n\1/g
s/^(SAFE HAVEN)$/[[heading]]\n\1/g
s/^(LISTENING TO THE WIND)$/[[heading]]\n\1/g
s/^(TWICE GIFTED)$/[[heading]]\n\1/g
s/^(BUILDING A NEW LIFE)$/[[heading]]\n\1/g
s/^(ON THE MOVE)$/[[heading]]\n\1/g
s/^(A VISION OF RECOVERY)$/[[heading]]\n\1/g
s/^(GUTTER BRAVADO)$/[[heading]]\n\1/g
s/^(EMPTY ON THE INSIDE)$/[[heading]]\n\1/g
s/^(GROUNDED)$/[[heading]]\n\1/g
s/^(ANOTHER CHANCE)$/[[heading]]\n\1/g
s/^(A LATE START)$/[[heading]]\n\1/g
s/^(FREEDOM FROM BONDAGE)$/[[heading]]\n\1/g
s/^(A\.A\. TAUGHT HIM TO HANDLE.*)$/[[heading]]\n\1/g
s/^(APPENDICES)$/[[heading]]\n\1/g
s/^(THE A\.A\. TRADITION)$/[[heading]]\n\1/g
s/^(SPIRITUAL EXPERIENCE)$/[[heading]]\n\1/g
s/^(THE MEDICAL VIEW ON A\.A\.)$/[[heading]]\n\1/g
s/^(THE LASKER AWARD)$/[[heading]]\n\1/g
s/^(THE RELIGIOUS VIEW ON A\.A\.)$/[[heading]]\n\1/g
s/^(HOW TO GET IN TOUCH WITH A\.A\.?)$/[[heading]]\n\1/g
s/^(THE TWELVE CONCEPTS.*)$/[[heading]]\n\1/g
s/^(NUMBER THREE)$/[[heading]]\n\1/g
# Part headers
s/^(PART [I]+)$/[[heading]]\n\1/g
s/^(PIONEERS OF A\.A\.)$/[[heading]]\n\1/g
s/^(THEY STOPPED IN TIME)$/[[heading]]\n\1/g
s/^(THEY LOST NEARLY ALL)$/[[heading]]\n\1/g
# Titles from TOC not yet covered
s/^(THE HOUSEWIFE WHO DRANK)$/[[heading]]\n\1/g
s/^(AT HOME)$/[[heading]]\n\1/g
s/^(PHYSICIAN, HEAL THYSELF.*)$/[[heading]]\n\1/g
s/^(MY CHANCE TO LIVE)$/[[heading]]\n\1/g
s/^(IT MIGHT HAVE BEEN WORSE)$/[[heading]]\n\1/g
# Section number markers: (N) for stories, Roman numerals for appendices
s/^(\(\d+\))$/[[heading]]\n\1/g
s/^([IVX]+)$/[[heading]]\n\1/g
# Mixed-case headings
s/^(The Twelve Traditions)$/[[heading]]\n\1/g
# Join consecutive headings into one (remove extra [[heading]] tags first)
s/\[\[heading\]\]\n\[\[heading\]\]/[[heading]]/g
s/\[\[heading\]\]\n(.+)\n\[\[heading\]\]\n(.+)/[[heading]]\n\1 \2/g
# Second pass for triple-heading sequences (e.g. (1) + TITLE + SUBTITLE)
s/\[\[heading\]\]\n(.+)\n\[\[heading\]\]\n(.+)/[[heading]]\n\1 \2/g
# Separate heading content from following text (insert blank line)
s/(\[\[heading\]\]\n.+)\n([A-Za-z("])/\1\n\n\2/g

# === FOOTNOTES (broad pattern) ===
s/^(\* .+)$/[[footnote]]\n\1/g

# === LIST ITEMS ===
s/^(\d+\.\s.+)$/[[list-item]]\n\1/g
# Twelve Traditions short form (One—, Two—, etc.)
s/^((?:One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve)—)/[[list-item]]\n\1/g
# Twelve Traditions long form (1.—, 2.—, etc.)
s/^(\d+\.—)/[[list-item]]\n\1/g
