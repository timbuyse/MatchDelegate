# Voorstel — een speler bijzetten tijdens een lopende wedstrijd

Opgesteld 20 augustus 2026. Nog niet geïmplementeerd; dit stuk is er om over te beslissen.

## Het probleem

Vanaf het startsignaal ligt de selectie van een wedstrijd vast. Je kan iemand nog op
"niet aanwezig" zetten, maar je kan er niemand meer bíjzetten. Wie niet in de selectie
stond toen de wedstrijd begon, bestaat voor die wedstrijd niet: geen speelminuten, geen
doelpunten, geen plek in het verslag en de PDF.

Dat botst met hoe een zaterdag bij de jongste reeksen er echt uitziet. U8 speelt twee
wedstrijden tegelijk, twee groepjes, vaak twee locaties. Valt er aan het ene veld iemand
uit, dan springt er iemand van het andere veld bij. Vandaag is dat niet te registreren:
je kan die speler alleen in de vrije notitie vermelden.

Dezelfde beperking speelt bij de laatkomer — het kind dat pas na de aftrap toekomt.
Dat is waarschijnlijk zelfs het vaakst voorkomende geval.

## Wat de gebruiker zou zien

In het livescherm, tabblad **Opstelling**, onder de lijst met bankspelers komt er een knop
**"+ Speler bijzetten"**. Enkel voor beheerders, en enkel zolang de wedstrijd loopt.

Wie erop tikt, krijgt een lijstje met iedereen uit het ploegrooster die nog niet in deze
wedstrijd zit. Eén tik zet die speler op de bank van deze wedstrijd. Vanaf dat moment is
hij een gewone bankspeler: je brengt hem binnen met een gewone wissel, hij verschijnt in
de wisselknop, in het verslag en in de PDF.

Onderaan dat lijstje staat, net als in de selectiewizard, ook **"Losse speler"** voor
iemand die niet in het rooster staat (een gast, een speler uit een andere ploeg).

Zijn speelminuten beginnen pas te lopen op het moment dat hij effectief invalt. Bijzetten
alleen kost hem niets.

## Waarom dit veilig is

Ik heb de drie plaatsen nagekeken waar het mis zou kunnen gaan:

- **Speelminuten.** De berekening vertrekt van wie er bij de aftrap op het veld stond, en
  loopt daarna de wissels af. Een speler die pas later in de lijst komt en niet in enig
  event voorkomt, krijgt nul minuten. De minuten van de anderen veranderen niet.
- **Wie er op het veld staat.** Dat wordt op dezelfde manier herrekend: begonnen als
  basisspeler, plus de wissels. Een bijgezette speler staat dus op de bank tot je hem
  effectief inbrengt.
- **De opslag.** Er komt geen nieuw veld en geen nieuwe structuur bij; er wordt gewoon een
  speler aan de bestaande spelerslijst van die ene wedstrijd toegevoegd, precies zoals de
  selectiewizard dat doet. Bestaande wedstrijden blijven ongewijzigd leesbaar.

Het enige wat écht zorgvuldig moet: de bijgezette speler moet aan zijn **plek in het
rooster** gekoppeld worden. Doe je dat niet (zoals de bestaande knop "+ Speler toevoegen"
bij Namen & nummers, die een losse speler maakt), dan krijgt hij in de seizoensstatistieken
een tweede, aparte regel naast zichzelf. Daarom kiest deze knop uit het rooster in plaats
van een naam te laten typen.

## Beslissingen die ik aan jou laat

**1. Zichtbaar maken dat hij later gekomen is?**
Mijn voorstel: ja. Een klein merkje bij zijn naam in het wedstrijddetail en de PDF
("bijgekomen"), zodat je achteraf begrijpt waarom hij minder minuten heeft dan de rest.
Technisch is dat één extra veldje op die speler — oudere wedstrijden hebben het gewoon
niet en tonen dus niets. Alternatief: niets tonen, en de reden in de notitie zetten.

**2. Ook het omgekeerde geval?**
Een speler die weggaat naar het andere veld, markeer je vandaag als "niet aanwezig". Dat
werkt (zijn teller stopt, hij telt niet mee in de fair-play-noemer), maar het woord klopt
niet: hij wás er. Ik zou dat in een tweede stap aanpakken, met een keuze tussen "niet
aanwezig" en "vertrokken". Nu meteen, of later?

**3. Ook op een afgesloten wedstrijd?**
Zelfde gat bestaat achteraf: merk je 's avonds dat je iemand vergeten bent, dan kan je hem
niet meer toevoegen. Mijn voorstel: buiten scope houden voor nu — bij een afgesloten
wedstrijd hangen er al conclusies aan (verslag verstuurd, statistieken bekeken) en het
vraagt een eigen doordenking. Zeg het als je het er toch bij wil.

**4. Tornooiwedstrijden.**
Daar komt de dagselectie uit het tornooi, niet uit de wedstrijd. Wie je bijzet moet dus ook
in de tornooiselectie van die dag belanden, anders krijgt hij speelminuten zonder ergens in
een groep te staan. Die koppeling bestaat al voor het voorbereidingsscherm; ik hergebruik ze.
Dit is geen open vraag, wel iets om te weten.

## Wat er niet in zit

- Niets aan de sync of aan de rechten. Een bijgezette speler reist mee met de wedstrijd
  zoals elke andere wijziging, ook naar het tweede toestel en naar de meekijkers.
- Geen automatische band tussen de twee gelijktijdige wedstrijden. De app gaat niet zelf
  zien dat dezelfde speler op twee velden staat — behalve de waarschuwing bij het starten
  die er sinds vandaag is.
- Geen wijziging aan de selectiewizard of aan het voorbereidingsscherm.

## Wat er moet gebeuren

Eén nieuw venster en één knop in het livescherm (`js/live-match.js`), plus hergebruik van
de rooster- en tornooikoppeling die al in `js/wizard-prep.js` zit. Geschat een goede zestig
regels, in één bestand dat momenteel door geen andere sessie aangeraakt wordt.

Testen doe ik met een echte wedstrijd in de app, op deze punten:

1. Speler bijzetten terwijl het spel loopt → hij staat op de bank, niemands minuten wijzigen.
2. Hem invallen via een gewone wissel → zijn teller start op dat moment, niet eerder.
3. Doelpunt en kaart op zijn naam → komen correct in het verslag en de PDF.
4. Bijzetten tussen twee delen in, en tijdens een pauze → zelfde resultaat.
5. Een geplande opstelling voor het volgende deel gebruiken terwijl hij erbij staat → hij
   blijft netjes op de bank in plaats van de planning te verstoren.
6. Seizoensstatistieken → hij krijgt één regel, samen met zijn andere wedstrijden, niet twee.
7. Tornooiwedstrijd → hij staat ook in de selectie van de tornooidag.
8. Een bestaande, oudere wedstrijd openen → ongewijzigd.
