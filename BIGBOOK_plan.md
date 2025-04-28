# BIGBOOK Konverteerimisplaan

## Ülevaade

See dokument kirjeldab plaani "ANONÜÜMSED ALKOHOOLIKUD" (Alcoholics Anonymous "Big Book" Eesti keeles) PDF-i konverteerimiseks hästi struktureeritud markdown-formaati ning sellest staatilise veebilehe loomiseks.

## Lähtefaili teave

- **Pealkiri**: ANONÜÜMSED ALKOHOOLIKUD
- **Väljaanne**: NELJAS VÄLJAANNE
- **Lehekülgede arv**: 576
- **Keel**: Eesti keel
- **Algne vorming**: PDF

## Sihtstruktuur

Markdown-dokument korraldatakse järgmiseks hierarhiliseks struktuuriks:

### 1. Esilehekülg

- Tiitelleht
- Muud AA raamatud
- Autoriõiguse teave
- Kirjastaja teave

### 2. Sisukord

- Vormindatud navigeeritava markdownina koos linkidega igale osale

### 3. Eessõnad

- Peamine eessõna
- Esimese, teise, kolmanda ja neljanda väljaande eessõnad

### 4. Põhipeatükid (11 peatükki)

- Peatükk 1: Billi lugu
- Peatükk 2: Lahendus on olemas
- Kuni peatükk 11: Tulevikupilt teie jaoks

### 5. Isiklikud kogemuslood

- **I osa**: AA teerajajad
- **II osa**: Nad lõpetasid aegsasti
- **III osa**: Nad kaotasid peaaegu kõik

### 6. Lisad

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

## Protsess

1. Teksti sisu eraldamine PDF-ist
2. Sisu struktureerimine vastavalt ülaltoodud kavandile
3. Vormindamine kasutades markdown-süntaksit
4. Erivorminduse ja paigutuse säilitamine, kus see on tähenduslik
5. Puhta, loetava ja navigeeritava dokumendi loomine

## Staatiline veebileht

1. Markdown teisendamine HTML-iks
2. Veebilehe disaini loomine (CSS)
3. Navigeerimissüsteemi loomine
4. Otsingu funktsionaalsuse lisamine
5. Lehekülgede vahelise linkimise tagamine
6. Mobiilisõbraliku kuvamise optimeerimine
7. Veebilehe majutamine (nt GitHub Pages, Netlify)
8. Domeeni seadistamine (vajadusel)

## Erilised kaalutlused

- Eesti keele täpitähtede säilitamine
- Originaalteksti struktuurse terviklikkuse säilitamine
- Korrektse hierarhilise organisatsiooni tagamine
- Loetava ja masinloetava dokumendi loomine
- Veebilehe kiiruse ja ligipääsetavuse optimeerimine

## Väljundid

- **Peamine väljund**: BIGBOOK.md - Raamatu täielik markdown-versioon
- **Sekundaarne väljund**: Peatükipõhised failid (kui hiljem soovitakse)
- **Veebileht**: Täielikult navigeeritav staatiline veebileht koos otsingufunktsionaalsusega
