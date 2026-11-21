# TODO: hockey en minivoetbal

Werklijst voor de afwerking van de sporten naast voetbal (PR #19, branch `ccr-816c24ce-nioeeg`, versie 2.38.0 bij het laatste
nakijken). Bijgehouden naast de code, zodat ze niet verloren gaat. Streep af of verwijder wat klaar is.

## Hoe het nu zit

- **Sport per club** (voetbal, hockey, minivoetbal): enkel de eigenaar kiest ze bij het aanmaken van een club
  (`clubs/{id}/info/sport`), gekopieerd naar `teams/{id}/info/sport`. Ontbrekend veld = voetbal.
- **Hockey:** import van ploegen en kalender vanaf hockey.be (jeugd U7 tot U19, één ploeg per leeftijd en geslacht met het label per
  wedstrijd), formaat per leeftijd, zaalhockey via het optionele veld `zaal`, hockeyvelden buiten en in de zaal, kaarten met timer
  (groen, geel, rood), woorden Strafcorner, Strafbal en Vrije slag.
- **Minivoetbal:** altijd 5 tegen 5 (4 x 13), cornerteller met cornerbal na de vierde corner, protestcorner, cornerbalreeks bij
  gelijkspel, zaalveld.
- Alles wat nieuw is, is optioneel of een nieuwe soort gebeurtenis; er is geen migratie nodig en voetbal is ongewijzigd.

## Nog te doen

### Hockey
- [ ] **Timer voor kaarten van de staf (trainer, bank).** Een groene of gele kaart voor de staf betekent dat de ploeg 5 minuten (zaal 2)
  met een speler minder speelt zonder dat iemand op de strafbank gaat. Er valt geen veld of speelminuut mee te corrigeren, dus
  enkel een aftelling "ploeg een man minder". Laag in prioriteit; bouwen als er vraag naar is.
- [ ] **De duur van 3v3, 6v6 (veld) en 8v8 laten bevestigen** door iemand van hockey. Enkel 2 x 35 (groot veld), 2 x 30 (U14) en
  4 x 15 (zaal) staan in de reglementen; de rest is een startwaarde van 4 x 15.
- [ ] **Uitzoeken wie de groene kaarttijd bijhoudt** (technisch verantwoordelijke, scheidsrechter of zaalverantwoordelijke, zie de
  reglementen: KBHB artikel 40 buiten, artikel 31 in de zaal) en daar eventueel een geluidje of melding bij zetten als de tijd om is.
- [ ] **De zaalhockeykalender importeren.** De buitenkalender werkt via het Sportlink-endpoint op hockey.be; of de zaalkalender
  op dezelfde manier binnenkomt (soort "Indoor" in de bron), is nog niet bekeken.
- [ ] **De pdf met de hockeyvelden** (buiten en zaal) als echte pdf nakijken. Op het scherm is het gecontroleerd, de pdf niet.
- [ ] **Statistiek:** een groene kaart komt nog niet in de tuchtstatistiek, en een schorsing telt als "wissel zonder invaller" in de
  statistiek van het aantal wissels.
- [ ] **De jeugdvelden (U7 tot U12)** tonen nu het volledige veld met de spelers geschaald. Eventueel een afgebakend deel van het veld
  tonen.

### Minivoetbal
- [ ] **De cornerbal-knop in de smalle balk** op het tabblad Opstelling. De cornerstand staat nu op het wedstrijdtabblad en bij kijkers.
- [ ] **Het vervangen na een tweede gele kaart** controleren: bij minivoetbal mag een uitgesloten speler na twee gele kaarten vervangen
  worden, na een directe rode niet (Boek M, art. M11.2). De app kent de tweede-gele-regel al, maar dit is niet apart getest.
- [ ] **De selectiegrootte** van minivoetbal (staat niet in de brochure).
- [ ] Of de koppelingen met de voetbalbond ("Ploegen van de voetbalbond", "Wedstrijdinfo ophalen") voor een minivoetbalclub echt
  de juiste gegevens geven. Ze staan aan voor minivoetbal; dat is niet met een echte club gecontroleerd.

### Algemeen
- [ ] **Handleiding en teksten aanpassen** aan de nieuwe sporten (de in-app handleiding spreekt nog over de voetbalbond en over
  hoekschoppen).
- [ ] **De echte test op Firebase** met een testclub per sport: club aanmaken, ploegen aanmaken, de hockey-import, en live wedstrijden
  (kaarten en terugkeer bij hockey, cornerbal bij minivoetbal). Alles is tot nu toe in een test met nagemaakte gegevens bekeken.
- [ ] **Bij het mergen van PR #19** controleren dat `APP_VERSION` boven de versie van `master` staat, en de changelog-entry onder
  die van master laten volgen.

## Handig bij het testen

- Een testclub met een sport maak je als eigenaar aan; verwijder ze daarna weer (eigenaar: Clubs beheren, eerst de ploegen, dan de club).
- Lokaal werken: houd de sportbranch in een eigen map (`git worktree add`), niet in dezelfde map als `master`, en laat altijd maar
  één plek tegelijk aan deze branch wijzigen.
