export interface SectionMapEntry {
  canonicalSlug: string
  enSectionId: string | null
  etSectionId: string | null
}

const NON_STORY_ENTRIES: readonly SectionMapEntry[] = [
  { canonicalSlug: 'copyright', enSectionId: 'copyright-info', etSectionId: 'copyright-info' },
  { canonicalSlug: 'preface', enSectionId: 'preface', etSectionId: 'eessona' },
  { canonicalSlug: 'fw1', enSectionId: 'foreword-1st-edition', etSectionId: 'eessona-1st' },
  { canonicalSlug: 'fw2', enSectionId: 'foreword-2nd-edition', etSectionId: 'eessona-2nd' },
  { canonicalSlug: 'fw3', enSectionId: 'foreword-3rd-edition', etSectionId: 'eessona-3rd' },
  { canonicalSlug: 'fw4', enSectionId: 'foreword-4th-edition', etSectionId: 'eessona-4th' },
  { canonicalSlug: 'arsti', enSectionId: 'doctors-opinion', etSectionId: 'arsti-arvamus' },
  { canonicalSlug: 'ch01', enSectionId: 'ch01-bills-story', etSectionId: 'ch01-billi-lugu' },
  {
    canonicalSlug: 'ch02',
    enSectionId: 'ch02-there-is-a-solution',
    etSectionId: 'ch02-lahendus-on-olemas',
  },
  {
    canonicalSlug: 'ch03',
    enSectionId: 'ch03-more-about-alcoholism',
    etSectionId: 'ch03-alkoholismist-lahemalt',
  },
  { canonicalSlug: 'ch04', enSectionId: 'ch04-we-agnostics', etSectionId: 'ch04-meie-agnostikud' },
  {
    canonicalSlug: 'ch05',
    enSectionId: 'ch05-how-it-works',
    etSectionId: 'ch05-kuidas-see-toetab',
  },
  { canonicalSlug: 'ch06', enSectionId: 'ch06-into-action', etSectionId: 'ch06-tegutsema' },
  {
    canonicalSlug: 'ch07',
    enSectionId: 'ch07-working-with-others',
    etSectionId: 'ch07-too-teistega',
  },
  { canonicalSlug: 'ch08', enSectionId: 'ch08-to-wives', etSectionId: 'ch08-naistele' },
  {
    canonicalSlug: 'ch09',
    enSectionId: 'ch09-the-family-afterward',
    etSectionId: 'ch09-perekond-hiljem',
  },
  { canonicalSlug: 'ch10', enSectionId: 'ch10-to-employers', etSectionId: 'ch10-tooandjatele' },
  {
    canonicalSlug: 'ch11',
    enSectionId: 'ch11-a-vision-for-you',
    etSectionId: 'ch11-tulevikupilt-teie-jaoks',
  },
  {
    canonicalSlug: 'a-i',
    enSectionId: 'appendix-i-the-aa-tradition',
    etSectionId: 'appendix-i-aa-traditsioonid',
  },
  {
    canonicalSlug: 'a-ii',
    enSectionId: 'appendix-ii-spiritual-experience',
    etSectionId: 'appendix-ii-vaimne-kogemus',
  },
  {
    canonicalSlug: 'a-iii',
    enSectionId: 'appendix-iii-the-medical-view-on-aa',
    etSectionId: 'appendix-iii-meditsiiniline-vaade-aa-le',
  },
  {
    canonicalSlug: 'a-iv',
    enSectionId: 'appendix-iv-the-lasker-award',
    etSectionId: 'appendix-iv-lasker-award',
  },
  {
    canonicalSlug: 'a-v',
    enSectionId: 'appendix-v-the-religious-view-on-aa',
    etSectionId: 'appendix-v-religioosne-vaade-aa-le',
  },
  {
    canonicalSlug: 'a-vi',
    enSectionId: 'appendix-vi-how-to-get-in-touch-with-aa',
    etSectionId: 'appendix-vi-kuidas-aaga-uhendust-votta',
  },
  {
    canonicalSlug: 'a-vii',
    enSectionId: 'appendix-vii-the-twelve-concepts',
    etSectionId: 'appendix-vii-kaksteist-kontseptsiooni',
  },
  { canonicalSlug: 'a-pamphlets', enSectionId: 'appendix-aa-pamphlets', etSectionId: null },
]

const STORY_ENTRIES: readonly SectionMapEntry[] = [
  {
    canonicalSlug: 's01',
    enSectionId: 'story-dr-bobs-nightmare',
    etSectionId: 'story-doktor-bobi-painajalik-unenagu',
  },
  {
    canonicalSlug: 's02',
    enSectionId: 'story-aa-number-three',
    etSectionId: 'story-anonuumne-alkohoolik-number-kolm',
  },
  {
    canonicalSlug: 's03',
    enSectionId: 'story-gratitude-in-action',
    etSectionId: 'story-tanulikkus-tegudes',
  },
  {
    canonicalSlug: 's04',
    enSectionId: 'story-women-suffer-too',
    etSectionId: 'story-ka-naised-on-haiged',
  },
  {
    canonicalSlug: 's05',
    enSectionId: 'story-our-southern-friend',
    etSectionId: 'story-meie-sober-lounast',
  },
  { canonicalSlug: 's06', enSectionId: 'story-the-vicious-cycle', etSectionId: 'story-noiaring' },
  { canonicalSlug: 's07', enSectionId: 'story-jims-story', etSectionId: 'story-jimi-lugu' },
  {
    canonicalSlug: 's08',
    enSectionId: 'story-the-man-who-mastered-fear',
    etSectionId: 'story-mees-kes-seljatas-hirmu',
  },
  {
    canonicalSlug: 's09',
    enSectionId: 'story-he-sold-himself-short',
    etSectionId: 'story-ta-alahindas-enda-vaartust',
  },
  {
    canonicalSlug: 's10',
    enSectionId: 'story-the-keys-of-the-kingdom',
    etSectionId: 'story-kuningriigi-votmed',
  },
  { canonicalSlug: 's11', enSectionId: 'story-the-missing-link', etSectionId: 'story-puuduv-luli' },
  { canonicalSlug: 's12', enSectionId: 'story-fear-of-fear', etSectionId: 'story-hirm-hirmu-ees' },
  {
    canonicalSlug: 's13',
    enSectionId: 'story-the-housewife-who-drank-at-home',
    etSectionId: 'story-koduperenaine-kes-joi-kodus',
  },
  {
    canonicalSlug: 's14',
    enSectionId: 'story-physician-heal-thyself',
    etSectionId: 'story-arst-ravi-iseennast',
  },
  {
    canonicalSlug: 's15',
    enSectionId: 'story-my-chance-to-live',
    etSectionId: 'story-minu-voimalus-elada',
  },
  { canonicalSlug: 's16', enSectionId: 'story-student-of-life', etSectionId: 'story-elu-opilane' },
  {
    canonicalSlug: 's17',
    enSectionId: 'story-crossing-the-river-of-denial',
    etSectionId: 'story-eitamise-joe-uletamine',
  },
  {
    canonicalSlug: 's18',
    enSectionId: 'story-because-im-an-alcoholic',
    etSectionId: 'story-sest-ma-olen-alkohoolik',
  },
  {
    canonicalSlug: 's19',
    enSectionId: 'story-it-might-have-benn-worse',
    etSectionId: 'story-oleks-voinud-ka-hullemini-minna',
  },
  { canonicalSlug: 's20', enSectionId: 'story-tightrope', etSectionId: 'story-kois' },
  {
    canonicalSlug: 's21',
    enSectionId: 'story-flooded-with-feeling',
    etSectionId: 'story-tunnetest-ule-ujutatud',
  },
  {
    canonicalSlug: 's22',
    enSectionId: 'story-winner-takes-all',
    etSectionId: 'story-voitja-votab-koik',
  },
  {
    canonicalSlug: 's23',
    enSectionId: 'story-me-an-alcoholic',
    etSectionId: 'story-mina-alkohoolik',
  },
  {
    canonicalSlug: 's24',
    enSectionId: 'story-the-perpetual-quest',
    etSectionId: 'story-alatine-otsing',
  },
  {
    canonicalSlug: 's25',
    enSectionId: 'story-a-drunk-like-you',
    etSectionId: 'story-joodik-nagu-sinagi',
  },
  {
    canonicalSlug: 's26',
    enSectionId: 'story-acceptance-was-the-answer',
    etSectionId: 'story-leppimine-oli-lahendus',
  },
  {
    canonicalSlug: 's27',
    enSectionId: 'story-window-of-opportunity',
    etSectionId: 'story-voimaluste-aken',
  },
  {
    canonicalSlug: 's28',
    enSectionId: 'story-my-bottle-my-resentments-and-me',
    etSectionId: 'story-minu-pudel-minu-vimmad-ja-mina',
  },
  {
    canonicalSlug: 's29',
    enSectionId: 'story-he-lived-only-to-drink',
    etSectionId: 'story-ta-elas-vaid-selleks-et-juua',
  },
  { canonicalSlug: 's30', enSectionId: 'story-safe-haven', etSectionId: 'story-turvaline-sadam' },
  {
    canonicalSlug: 's31',
    enSectionId: 'story-listening-to-the-wind',
    etSectionId: 'story-kuulates-tuult',
  },
  {
    canonicalSlug: 's32',
    enSectionId: 'story-twice-gifted',
    etSectionId: 'story-topelt-onnistatud',
  },
  {
    canonicalSlug: 's33',
    enSectionId: 'story-building-a-new-life',
    etSectionId: 'story-ehitades-uut-elu',
  },
  { canonicalSlug: 's34', enSectionId: 'story-on-the-move', etSectionId: 'story-liikvel' },
  {
    canonicalSlug: 's35',
    enSectionId: 'story-a-vision-of-recovery',
    etSectionId: 'story-nagemus-tervenemisest',
  },
  {
    canonicalSlug: 's36',
    enSectionId: 'story-gutter-bravado',
    etSectionId: 'story-rentsli-bravuur',
  },
  {
    canonicalSlug: 's37',
    enSectionId: 'story-empty-on-the-inside',
    etSectionId: 'story-hinges-tuhi',
  },
  { canonicalSlug: 's38', enSectionId: 'story-grounded', etSectionId: 'story-maapinnale-toodud' },
  {
    canonicalSlug: 's39',
    enSectionId: 'story-another-chance',
    etSectionId: 'story-veel-uks-voimalus',
  },
  { canonicalSlug: 's40', enSectionId: 'story-a-late-start', etSectionId: 'story-hiline-algus' },
  {
    canonicalSlug: 's41',
    enSectionId: 'story-freedom-from-bondage',
    etSectionId: 'story-koidikutest-vabaks',
  },
  {
    canonicalSlug: 's42',
    enSectionId: 'story-aa-taught-him-to-handle-sobriety',
    etSectionId: 'story-aa-opetas-teda-kainust-kontrollima',
  },
]

export const SECTION_MAP: readonly SectionMapEntry[] = [
  ...NON_STORY_ENTRIES.slice(0, 18), // copyright..ch11 (18 entries)
  ...STORY_ENTRIES, // s01..s42 (task 4)
  ...NON_STORY_ENTRIES.slice(18), // a-i..a-pamphlets (8 entries)
]

const enIndex = new Map(
  SECTION_MAP.filter((e) => e.enSectionId !== null).map((e) => [e.enSectionId as string, e]),
)
const etIndex = new Map(
  SECTION_MAP.filter((e) => e.etSectionId !== null).map((e) => [e.etSectionId as string, e]),
)
const slugIndex = new Map(SECTION_MAP.map((e) => [e.canonicalSlug, e]))

export function slugForEnSection(enId: string): string | null {
  return enIndex.get(enId)?.canonicalSlug ?? null
}

export function slugForEtSection(etId: string): string | null {
  return etIndex.get(etId)?.canonicalSlug ?? null
}

export function entryForSlug(slug: string): SectionMapEntry | null {
  return slugIndex.get(slug) ?? null
}
