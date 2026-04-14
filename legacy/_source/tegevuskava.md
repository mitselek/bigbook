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

- Iga peatükk eraldi markdown-failina peatykid/ kaustas
- Peatükk 1: Billi lugu
- Peatükk 2: Lahendus on olemas
- ...
- .. peatükk 11: Tulevikupilt teie jaoks

### 5. Isiklikud kogemuslood

- Organiseeritud kogemuslood/ kaustas, jagatud kolmeks osaks:
- **I osa**: AA teerajajad (kogemuslood/I_osa/ kaustas)
- **II osa**: Nad lõpetasid aegsasti (kogemuslood/II_osa/ kaustas)
- **III osa**: Nad kaotasid peaaegu kõik (kogemuslood/III_osa/ kaustas)
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

## Veebis publitseerimine (uuendatud)

### GitHub Pages seadistamine

1. **Põhiseadistus**
   - Loo `_config.yml` fail projekti juurkausta Jekyll seadistuste jaoks
   - Määra sobiv Jekyll teema (nt "minima", "just-the-docs", "jekyll-rtd-theme")
   - Konfigureeri põhiparameetrid (pealkiri, kirjeldus, keeleseaded)

2. **Navigatsiooni loomine**
   - Loo `index.md` - avalehekülg põhiinfo ja sisukorra lingiga
   - Lisa navigatsiooninupud lehtede vahel liikumiseks (eelmine/järgmine)
   - Konfigureeri külgriba navigatsiooniks (Jekyll teemast sõltuvalt)

3. **Failide ettevalmistamine**
   - Lisa YAML frontmatter igasse Markdown-faili navigatsiooni jaoks:

     ```yaml
     ---
     layout: page
     title: "Peatüki pealkiri"
     permalink: /peatükk/alamleht/
     nav_order: 1
     ---
     ```

   - Ühilda failinimed URL-sõbralikuks (asenda täpitähed, tühikud jne)
   - **URL kokkulepe:** Kasutada sõnavahedena sidekriipse (`-`) mitte alakriipse (`_`), 
     näiteks `/peatykid/billi-lugu/` mitte `/peatykid/billi_lugu/`. See järgib veebistandardeid, 
     parandab SEO-d ja on linkidena visuaalselt selgem.

4. **Lokaliseerimine ja kohandamine**
   - Lisa eesti keele tugi (vajadusel loo kohandatud lokalisatsiooni fail)
   - Kohandatud CSS rakendamine AA raamatu stiilide jaoks
   - Optimiseeri mobiiliseadmetele

5. **Tehnilise funktsionaalsuse lisamine**
   - Otsingufunktsiooni konfigureerimine (Jekyll-search või Algolia)
   - Sätesta Google Analytics (kui vajalik)
   - Lisa trükkimise tugi (printimisvaade)

6. **Testimine ja publitseerimine**
   - Testi lehte lokaalselt Jekyll serveriga
   - Tee vajalikud korrektiivid
   - Aktiveeri GitHub Pages repositooriumi seadetes
   - Vali main haru või docs/ kaust avaldamise allikana

### Alternatiiv: GitHub Wiki seadistamine

1. **Wiki aktiveerimine**
   - Lülita repositooriumi seadetes Wiki sektsioon sisse
   - Loo Home.md fail Wiki avalehena

2. **Sisu ülesehitus**
   - Kanna Markdown failid üle Wiki sektsioonile
   - Säilita hierarhiline struktuur
   - Loo navigatsioonileht (_Sidebar.md)

3. **Navigatsiooni loomine**
   - Koosta külgmenüü lehtede vahel navigeerimiseks
   - Lisa lehekülje alumisse ossa navigatsioonilülid

4. **Välimus ja funktsionaalsus**
   - Lisa kohandatud päis ja jalus (\_Footer.md, \_Header.md)
   - Lisa CSS kohandused (kui Wiki toetab)

## Erilised kaalutlused

- Eesti keele täpitähtede korrektne kuvamine
- Originaalteksti struktuurse terviklikkuse säilitamine
- Korrektse hierarhilise organisatsiooni tagamine
- Loetava ja masinloetava dokumendi loomine
- Veebilehe kiiruse ja ligipääsetavuse optimeerimine
- Versioonihalduse eelis: muudatused on jälgitavad ja turvaliselt talletatud

## Jekyll konfiguratsioonifaili näidis

```yaml
# _config.yml
title: Anonüümsed Alkohoolikud
description: Alcoholics Anonymous "Big Book" Eesti keeles
lang: et
theme: minima

# Navigatsiooni seaded
header_pages:
  - TOC.md
  - front_matter/eessonad.md
  - kogemuslood/cover.md
  - lisad/lisad.md

# Üldised seaded
markdown: kramdown
kramdown:
  input: GFM
  syntax_highlighter: rouge

# Otsingufunktsionaalsus
search_enabled: true

# URL struktuur
permalink: /:title/

# Pluginad
plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap
```

## Avalehe näidis (index.md)

```markdown
---
layout: home
title: Anonüümsed Alkohoolikud
---

# ANONÜÜMSED ALKOHOOLIKUD

Neljas väljaanne eesti keeles.

## Alcoholics Anonymous "Big Book"

See on Anonüümsete Alkohoolikute põhitekst, tuntud ka kui "Big Book".

* [Sisukord](TOC.md)
* [Eessõnad](front_matter/eessonad.md)
* [Peatükid](peatykid/ch01_billi_lugu.md)
* [Kogemuslood](kogemuslood/cover.md)
* [Lisad](lisad/lisad.md)
```

## Väljundid

- **Peamine väljund**: Hierarhiline markdown-failide kogum struktueeritud kaustades
- **Veebileht**: GitHub Pages põhine veebileht Jekyll'i abil
- **Navigatsioon**: Sisukorra ja peatükkide vaheliste linkide süsteem
- **Otsimisvõimalus**: Jekyll otsingufunktsionaalsus või GitHub sisseehitatud otsing
- **Mobiilisõbralikkus**: Responsive disain erinevate seadmete jaoks
- **SEO**: Optimeeritud otsingumootoritele (jekyll-seo-tag abil)
