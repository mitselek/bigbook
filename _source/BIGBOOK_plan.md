# BIGBOOK Konverteerimisplaan (Uuendatud)

## Ülevaade

See dokument kirjeldab plaani "ANONÜÜMSED ALKOHOOLIKUD" (Alcoholics Anonymous "Big Book" Eesti keeles) PDF-i konverteerimiseks hästi struktureeritud markdown-formaati ning sellest staatilise veebilehe loomiseks.

## Lähtefaili teave

- **Pealkiri**: ANONÜÜMSED ALKOHOOLIKUD
- **Väljaanne**: NELJAS VÄLJAANNE
- **Lehekülgede arv**: 576
- **Keel**: Eesti keel
- **Algne vorming**: PDF

## Sihtstruktuur

Raamat on konverteeritud hierarhiliseks kogumiks markdown-faile, mis on organiseeritud järgnevalt:

### 1. Esilehekülg

- Tiitelleht (BIGBOOK.md - peamine viitelink)
- Muud AA raamatud
- Autoriõiguse teave
- Kirjastaja teave

### 2. Sisukord

- Eraldi sisukorra fail (TOC.md) linkidega kõikidele osadele

### 3. Eessõnad

- Peamine eessõna ja arsti arvamus (eraldi failid front_matter/ kaustas)
- Esimese, teise, kolmanda ja neljanda väljaande eessõnad

### 4. Põhipeatükid (11 peatükki)

- Iga peatükk eraldi markdown-failina chapters/ kaustas
- Peatükk 1: Billi lugu
- Peatükk 2: Lahendus on olemas
- Kuni peatükk 11: Tulevikupilt teie jaoks

### 5. Isiklikud kogemuslood

- Organiseeritud stories/ kaustas, jagatud kolmeks osaks:
- **I osa**: AA teerajajad (stories/part1/ kaustas)
- **II osa**: Nad lõpetasid aegsasti (stories/part2/ kaustas)
- **III osa**: Nad kaotasid peaaegu kõik (stories/part3/ kaustas)
- Iga lugu eraldi markdown-failina

### 6. Lisad

- Lisad koondatud lisad/ kausta
- I: AA Traditsioonid
- II: Vaimne kogemus
- Kuni lisa VII: Kaksteist Kontseptsiooni

## Markdown-vorminduse juhised

- Kasuta `#` pealkiri jaoks
- Kasuta `##` alajaotiste pealkirjade jaoks
- Kasuta `###` peatükkide pealkirjade jaoks
- Kasuta `####` alapeatükkide jaoks
- Kasuta `>` esiletõstetud tsitaatide või erimärkuste jaoks
- Kasuta õiget vahekaugust sektsioonide vahel
- Lisa lehekülje numbrid sulgudes iga sektsiooni alguses viitena
- Säilita originaalteksti vormindus, kui see on oluline (kursiivis, loetelud jne)
- Kasuta suhtelisi linke failide vahel liikumiseks

## Protsess

1. Teksti sisu eraldamine PDF-ist
2. Sisu jagamine eraldi markdown-failideks loogilise struktuuri alusel
3. Vormindamine kasutades markdown-süntaksit
4. Erivorminduse ja paigutuse säilitamine, kus see on tähenduslik
5. Failide vaheliste linkide loomine navigeerimiseks
6. Puhta, loetava ja navigeeritava dokumentide kogu loomine

## Veebis publitseerimine

1. GitHub Pages või GitHub Wiki keskkonna kasutamine
   - Eelistame GitHub Pages võimalust kasutades Jekyll põhist staatilise lehe genereerimist
   - Alternatiivina võime kasutada GitHub Wiki formaati lihtsamaks haldamiseks
2. Sisukorra ja navigeerimissüsteemi loomine
3. Sektorite vahel liikumiseks linkide tagamine
4. Mobiilisõbraliku kuvamise optimeerimine
5. Otsingu funktsionaalsuse lisamine (kasutades GitHub sisseehitatud otsingut või Jekyll pluginaid)
6. Lehe temaatika ja stiili kohandamine lugejasõbralikuks
7. Vajadusel kohandatud domeeni seadistamine

## Erilised kaalutlused

- Eesti keele täpitähtede korrektne kuvamine
- Originaalteksti struktuurse terviklikkuse säilitamine
- Korrektse hierarhilise organisatsiooni tagamine
- Loetava ja masinloetava dokumendi loomine
- Veebilehe kiiruse ja ligipääsetavuse optimeerimine
- Versioonihalduse eelis: muudatused on jälgitavad ja turvaliselt talletatud

## Väljundid

- **Peamine väljund**: Hierarhiline markdown-failide kogum struktueeritud kaustades
- **Veebileht**: GitHub Pages või Wiki põhine veebileht
- **Navigatsioon**: Sisukorra ja peatükkide vaheliste linkide süsteem
- **Otsimisvõimalus**: GitHub sisseehitatud otsing või kohandatud lahendus
