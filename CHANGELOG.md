# Changelog — MatchDelegate

Leesbaar overzicht van de wijzigingen per versie, nieuwste bovenaan. Bedoeld als
naslag naast de technische commit-messages. Versies vóór 0.5.19 staan in de
git-geschiedenis en in de `analyse-*`-bestanden in de repo.

De meeste wijzigingen sinds 0.5.19 komen uit een grondige audit van het nieuwe
clubmodel (rollen: eigenaar → clubbeheerder → ploegbeheerder → kijker → gast).

---

## v0.9.1
- **Nieuw:** je kan de **puntenverdeling per tornooi zelf ingeven** — winst / gelijk / verlies, in de
  tornooi-info (stap 1 van de wizard), zowel bij het aanmaken als achteraf, bijvoorbeeld samen met de
  eindstand. Standaard 3/1/0, dus bestaande tornooien veranderen niet. Het verslag rekent ermee en
  noemt het schema erbij ("3 punten volgens 2/1/0"), op het scherm, in de PDF en in het deelbericht.
  Zet je alle drie op 0, dan verdwijnt de puntenregel volledig — voor een tornooi waar niet op punten
  gespeeld wordt. Wijkt het schema af van 3/1/0, dan staat het ook op de tornooipagina.
- **Opgelost:** bij een wedstrijd van **één** deel nam het velddiagram in de PDF een volledige pagina
  in. De eerste pagina bleef daardoor zo goed als leeg (enkel de info), de kop "Opstelling" stond
  alleen op een pagina en het veld kwam er onnodig groot achteraan. Oorzaak: bij één diagram was er
  geen tweede kolom die de hoogte begrensde, dus volgde die uit de volledige paginahoogte. Het veld
  vult nu de ruimte die op die pagina nog over is (met een bovengrens van iets meer dan een halve
  pagina), zodat de info en het veld samen op één pagina staan en de tabellen erna doorlopen. Is er te
  weinig ruimte over voor een leesbaar veld, dan begint het op de volgende pagina met die maat.
  Resultaat voor het testtornooi: een wedstrijdverslag gaat van 5 naar 3 pagina's en de tornooi-PDF
  van 19 naar 10. Wedstrijden met meerdere delen (twee of meer diagrammen) blijven ongewijzigd.

## v0.9.0
- **Nieuw: tornooiverslag als PDF.** In het tornooiverslag staat naast "Delen" nu een knop **PDF**.
  Die maakt hetzelfde dagoverzicht als op het scherm, in dezelfde opmaak als de wedstrijd-PDF: kop met
  clublogo's, dagresultaat, alle uitslagen met doelpuntenmakers, de dagselectie in vier groepen, een
  tabel speeltijd (met "2 van de 3" en de afmeldingen), een fair-play-tabel, doelpunten en assists,
  keeper(s) met clean sheets en kaarten. **Daarachter volgt elk wedstrijdverslag apart**, in volgorde
  en elk op een nieuwe pagina, met een kop "Wedstrijd 2 van 3", de uitslag en de wedstrijdinfo — dus
  zonder de tornooi-informatie te herhalen. Eén document met alles van die dag.
  Bestandsnaam: `datum_tornooinaam_tornooiverslag.pdf`.
- Intern: de wedstrijdsecties van de PDF (selectie, opstelling per deel, tussenstand, statistieken,
  keeper(s), spelers, foto's, notities, tijdlijn) zitten nu in één functie die zowel de losse
  wedstrijd-PDF als de tornooi-PDF gebruikt, met een gedeelde opmaaklaag (marges, sectiekoppen,
  tabellen, voettekst). Zo blijven beide PDF's automatisch hetzelfde ogen.
- **Nieuw:** de **wedstrijd-PDF van een tornooiwedstrijd** begint nu met een sectie **Tornooi**: naam,
  "Wedstrijd 2 van 4", datum, locatie, format, trainer, ploegverantwoordelijke, eindstand, en de
  dagselectie (geselecteerd · niet geselecteerd · niet beschikbaar). Een PDF wordt los doorgestuurd,
  dus die informatie hoort erin — op het scherm blijft ze op de tornooipagina staan. In het verslag op
  het scherm staat nu ook een regel **Tornooi** met de naam.
- **Nieuw:** de PDF gebruikt nu **dezelfde icoontjes als het scherm** in de volledige tijdlijn en bij
  de doelpunten in "Tussenstand per deel". De echte app-iconen worden daarvoor omgezet naar kleine
  afbeeldingen (jsPDF kan geen SVG tekenen), dus scherm en PDF blijven gelijk.

## v0.8.3
- **Verbeterd:** in het verslag (en de PDF) van een **tornooiwedstrijd** stond de volledige selectie
  nog eens opgesomd, terwijl die voor elke wedstrijd van dat tornooi dezelfde is. Die kaart valt nu
  weg; er blijft enkel over wat per wedstrijd kán verschillen, en enkel als het voorkomt: wie **niet
  aanwezig** was (bv. iemand die na twee wedstrijden naar huis ging) en, mocht de trainer toch iemand
  uitgevinkt hebben, wie niet voor die wedstrijd geselecteerd was. De volledige lijsten staan op de
  tornooipagina en in het tornooiverslag.
- **Verbeterd:** in de selectie staat nu ook een label **"Geselecteerd:"** vóór de namen — op de
  tornooipagina, in het tornooiverslag én in de kaart "Selectie" van een gewoon wedstrijdverslag (en
  de PDF daarvan), waar de eerste lijst zonder label stond en dus niet benoemd was.

## v0.8.2
- **Verbeterd:** op de tornooipagina stond bij Selectie enkel "10 spelers · 8v8". De **namen** staan
  er nu bij (met rugnummer, alfabetisch op familienaam), net als in het tornooiverslag.
- **Opgelost:** de lijsten "Niet beschikbaar" en "Niet geselecteerd" waren rechts uitgelijnd, wat
  onleesbaar werd zodra ze over meerdere regels liepen. Ze staan nu links, onder elkaar.
- **Verbeterd:** volgorde is nu selectie → niet geselecteerd → niet beschikbaar, zowel op de
  tornooipagina als in het tornooiverslag (daar met "geselecteerd maar niet aanwezig" direct na de
  selectie, want dat gaat wél over die dag).

## v0.8.1
- **Opgelost:** de uitslag van een tornooiwedstrijd stond omgekeerd. Een 3-1 winst las als "1-3", in
  de wedstrijdlijst, het verslag, de PDF en het deelbericht. Oorzaak: de locatie van een
  tornooiwedstrijd is de locatie van het tornooi ("Sportpark Aalter"), en alles wat niet letterlijk
  "Thuis" is, gold als uitwedstrijd — dus kwam je eigen score tweede. Een tornooi is neutraal
  terrein: je eigen ploeg staat er nu altijd eerst.
- **Opgelost:** de selectie in het tornooiverslag toonde drie groepen; de vierde — **Niet
  geselecteerd** (spelers uit het rooster die je bij de tornooiselectie niet aanduidde) — ontbrak.
  Nu staan alle vier de groepen er, net zoals in het wedstrijdverslag.
- **Opgelost:** bij wedstrijden van vóór v0.5.34 (die nog geen vaste ploegverwijzing hebben) bleef de
  groep **Niet geselecteerd** in het verslag en de PDF leeg. De ploeg wordt nu ook op naam gezocht,
  zoals elders in de app al gebeurde.
- **Verbeterd:** wie niet beschikbaar of niet geselecteerd is, geldt voor de hele tornooidag en stond
  daarom onnodig in elk wedstrijdverslag van dat tornooi. In het verslag van een tornooiwedstrijd
  staat nu enkel wat per wedstrijd verschilt: de selectie, wie niet aanwezig was, en wie **niet voor
  deze wedstrijd** geselecteerd was (uit de spelers die meegingen). De volledige lijsten staan op de
  tornooipagina — die heeft naast "Niet beschikbaar" nu ook een regel **Niet geselecteerd** — en in
  het tornooiverslag.
- **Verbeterd:** in "Speeltijd over de dag" stond bij een speler die zich voor één wedstrijd afmeldde
  "2/2 gespeeld", wat leest als "van de wedstrijden van dit tornooi". Er staat nu **"2 van de 3
  tornooiwedstrijden gespeeld · 1× niet aanwezig"**. De rekenregel blijft dezelfde: een wedstrijd
  waarvoor een speler zich afmeldde, drukt zijn gemiddelde niet — anders lijkt het alsof de trainer
  hem geen speelkansen gaf. Dat staat nu ook expliciet bij Fair-play, waar de teller "2/2 in
  selectie" heet.

## v0.8.0
- **Nieuw: tornooiverslag.** Op de tornooipagina staat een knop **Tornooiverslag** zodra er één
  wedstrijd afgewerkt is (ook voor kijkers). Het geeft het overzicht van de hele dag samen:
  dagresultaat (winst/gelijk/verlies, doelpunten, saldo, punten volgens 3/1/0), alle uitslagen op een
  rij met de doelpuntenmakers (tik erop om naar die wedstrijd te gaan), de dagselectie met de
  niet-beschikbare spelers en hun reden, de speeltijd van elke speler over de hele dag, een
  fair-play-lijstje (gemiddelde speeltijd per selectie, laagste bovenaan), doelpunten en assists,
  keeper(s) met clean sheets, kaarten, en de notities van de wedstrijden (enkel voor beheerders).
- **Nieuw:** knop **Dagoverzicht delen** — één blok tekst voor de ploeggroep met de uitslagen, de
  doelpuntenmakers en het dagresultaat.
- **Nieuw:** een tornooi heeft een optioneel veld **Eindstand** (bv. "3e van 8"). Dat vul je zelf in:
  de app kent de uitslagen van de andere ploegen niet, dus een echt klassement kan ze niet berekenen.
  De punten in het verslag gaan enkel over je eigen wedstrijden en zijn geen officiële stand.
- Bewust niet in het tornooiverslag: de opstelling per deel en de tijdlijn. Die staan al in het
  verslag en de PDF van elke wedstrijd apart, en zouden het dagoverzicht drie keer zo lang maken.
- De PDF-export van het tornooiverslag volgt in een volgende versie.

## v0.7.5
- **Opgelost:** bij een tornooi duidde je bij de selectie al aan wie meegaat en wie niet beschikbaar
  is (NB), maar in de wedstrijden van dat tornooi doken NB-spelers toch weer op in de selectielijst.
  Dat gebeurde bij "Selectie & opstelling", bij "Kloon als nieuwe wedstrijd" en bij "Bewerken" — bij
  dat laatste kwam zelfs de volledige ploegkern terug in de lijst, ook spelers die helemaal niet in
  de tornooiselectie zaten. In een tornooiwedstrijd zie je nu overal exact de spelers die meegaan.
- **Verbeterd:** in een tornooiwedstrijd heb je nog maar twee keuzes per speler: **Basis** of
  **Wissel**. De NB-knop is daar weg, want beschikbaarheid geef je één keer in bij de selectie van
  het tornooi. Nog eens op dezelfde knop tikken betekent nog altijd "niet geselecteerd voor deze
  wedstrijd" (bv. een speler die één wedstrijd rust).
- **Nieuw:** op de tornooipagina staat nu een regel **Niet beschikbaar** met de namen en de reden
  (ziek, geblesseerd, speelt elders…), zodat die informatie zichtbaar blijft.
- Een NB bij een tornooi telt niet als gemiste wedstrijd in de statistieken: één ziekmelding voor een
  tornooidag zou anders als vier gemiste wedstrijden gaan wegen.

## v0.7.4
- **Opgelost:** de handleiding-PDF liep uit tot 48 pagina's met paginagrote afbeeldingen en veel
  witruimte. De schermafbeeldingen werden over de volle breedte uitgerekt, waardoor ze hoger werden
  dan een A4 en elk een eigen pagina opeisten. Ze staan nu op een vaste hoogte (ongeveer 10,5 cm),
  twee naast elkaar, en er komt geen gedwongen pagina-einde meer na elke sectie. Resultaat: rond de
  13 pagina's zonder halflege bladen.

## v0.7.3
- **Verbeterd:** alle schermafbeeldingen in de handleiding zijn vernieuwd. Ze kwamen nog van eind
  juni en toonden onder meer het oude kruisje in de selectie, de oude beheerschermen en het oude
  wedstrijdverslag. De nieuwe beelden gebruiken een verzonnen testploeg, dus er staan geen echte
  namen in.
- **Nieuw:** er staan nu ook beelden bij de pauze-opstelling, de statistiekenpagina (met de
  oog-icoontjes), het tornooi, het homescherm en het aanmaken van een ploeg.
- **Opgelost:** stond een speler door een oudere of half bewerkte wedstrijd zowel in de selectie als
  in de afwezigenlijst, dan verscheen hij in het verslag in twee elkaar tegensprekende groepen. Wie
  in de selectie zat, wint nu.
- De handleiding-PDF gebruikt intern gecomprimeerde beelden, waardoor die download rond 900 KB
  blijft in plaats van meer dan 3 MB.

## v0.7.2
- **Nieuw:** de handleiding heeft een pagina **Statistieken**: wat elke sectie betekent, hoe fair-play
  gemeten wordt, hoe je met het oog-icoontje per sectie kiest wat kijkers mogen zien, wat er op de
  spelerdetailpagina staat, en dat tornooiwedstrijden niet meetellen.
- **Nieuw:** de pagina **Tornooi** was een placeholder en beschrijft nu de volledige flow: tornooi
  aanmaken, selectie voor de hele dag, wedstrijden toevoegen, klonen en het overzicht.
- **Verbeterd:** de pagina over het wedstrijdverslag legt nu uit wat er in het verslag en de PDF
  staat (de vier selectiegroepen, opstelling per deel met bank en kaarten, tussenstanden, tijdlijn),
  en waarschuwt dat "Posities herplaatsen" niet meer werkt zodra er wissels gebeurd zijn.
- **Verbeterd:** bij ploegbeheer staat nu de kant-voorkeur voor verdedigers (centraal/links/rechts) en
  de standaard wedstrijdvorm + opstelling per ploeg beschreven; bij de live wedstrijd hoe je iemand
  als niet aanwezig markeert.

## v0.7.1
- **Verbeterd:** de tekst in de PDF staat groter en is daardoor vlotter leesbaar op papier: de namen
  op het veld en de bankregel eronder (van 7,7 naar 9,3 pt), de inforegels in de kop, de
  selectielijst, de sectietitels, de spelerstabel en de tabellen met tussenstanden en tijdlijn. De
  eindscore en de wedstrijdtitel stonden al groot genoeg en blijven ongewijzigd. Het verslag blijft
  even lang.
- **Opgelost:** een lange notitie kon net te breed afbreken, omdat de regelbreedte op de oude
  lettergrootte berekend werd.

## v0.7.0
- **Nieuw:** wissels en positiewissels in de pauze regel je nu **door op het veld te tikken**, in het
  tabblad Opstelling (met een oranje stipje op dat tabblad zolang de pauze duurt). Tik een bankspeler
  en dan een speler op het veld om te wisselen, of tik twee spelers op het veld om ze van positie te
  wisselen. Je kan zoveel wijzigingen doen als je wil zonder telkens een venster te openen, en het
  veld toont meteen de opstelling van het volgende deel.
- **Verbeterd:** tik je opnieuw op een plek waar al een wissel gepland staat, dan pas je die aan in
  plaats van er een tweede bovenop te stapelen; kies je de oorspronkelijke speler terug, dan valt de
  wissel weg. Twee keer dezelfde positiewissel maakt ze ongedaan.
- **Verbeterd:** de bank staat gesorteerd op minst gespeeld, met de speelminuten erbij.
- **Verbeterd:** de zwevende knopjes voor een snelle notitie en "moment markeren" zijn tijdens de
  pauze verborgen — ze lagen over de bankspelers. Een notitie krijgt haar tijdstempel uit de
  gespeelde tijd, dus die is in de pauze hetzelfde als bij de start van het volgende deel.
- **Verwijderd:** de aparte vensters "Pauzewissel toevoegen" en "Positiewissel toevoegen". Tijdens het
  spel blijven de knoppen Wissel en Positie gewoon werken zoals voorheen.
- **Verbeterd (PDF):** de velddiagrammen staan weer vanaf de eerste pagina en mogen over twee
  pagina's lopen (bv. twee velden op pagina 1 en twee op pagina 2). Ze zijn daardoor bovendien
  breder — bij vier kwarten ongeveer een kwart groter dan in v0.6.3 — en pagina 1 blijft niet meer
  half leeg.
- **Verwijderd (PDF):** de legenderegel onder de velddiagrammen. Oranje keeper, positienummer,
  kapiteinsteken, wisselpijltjes en kaartjes spreken voor zich.
- **Verbeterd:** de bankregel onder een veld staat nu in dezelfde lettergrootte als de namen op het
  veld, en de titel heet "Opstelling per kwart" (of per helft/deel) i.p.v. "Startopstelling".

## v0.6.4
- **Opgelost:** in v0.6.3 werd er geen PDF meer gemaakt — het genereren liep stuk op een
  achtergebleven verwijzing naar de oude manier van kaarten tekenen.

## v0.6.3
- **Verbeterd:** de velddiagrammen in de PDF krijgen een eigen pagina en worden zo groot getekend
  als daarop past — bij vier kwarten een derde breder dan voorheen. De app kiest zelf de beste
  rij-indeling: één deel wordt één groot veld over de volle breedte, twee helften komen naast
  elkaar, drie of vier delen in twee rijen.
- **Nieuw:** onder elk velddiagram staat nu de **bank** van dat deel: wie in de selectie zat maar dat
  deel niet op het veld kwam. Wie inviel, zie je al op het veld staan bij de speler die hij verving.
- **Nieuw:** gele en rode kaarten staan nu ook op de velddiagrammen, als een kaartje achter de naam
  van de speler.
- **Verbeterd:** de vervanger wordt aangeduid met het wisselicoon van de app in plaats van met ».
- **Verwijderd:** de tabel "Opstelling per kwart" is weg, zowel uit de PDF als uit het verslag in de
  app. De velddiagrammen tonen nu dezelfde informatie (bank, wissels, kaarten) én laten zien waar
  iemand stond.

## v0.6.1
- **Verbeterd:** de aparte knop **NG** is weer weg — met vier knoppen werd de rij te breed op een
  smartphone. Niets aanduiden betekent gewoon "niet geselecteerd", en een tweede tik op Basis,
  Wissel of NB maakt je keuze weer ongedaan. Bovenaan de selectie staat dat nu ook uitgelegd.
  Geldt voor de wedstrijd- en de tornooiselectie; NB met reden blijft ongewijzigd.

## v0.6.0
- **Nieuw:** de selectie heeft nu vier duidelijke standen per speler: **Basis**, **Wissel**,
  **NG** (niet geselecteerd) en **NB** (niet beschikbaar, wat vroeger het kruisje was). Een tweede
  tik op de actieve stand doet niets meer, zodat je niet meer per ongeluk terugvalt op "niets
  aangeduid".
- **Nieuw:** bij **NB** kan je een reden kiezen — ziek, geblesseerd, speelt elders of andere reden.
  Dat is optioneel: geen reden kiezen werkt zoals voorheen.
- **Nieuw:** koos je **"speelt elders"**, dan telt die wedstrijd niet als gemiste wedstrijd in het
  aanwezigheidspercentage. De app deed dat al automatisch voor A/B-ploegen op dezelfde dag; nu kan
  je het ook zelf aangeven, bijvoorbeeld als die andere wedstrijd niet in de app staat.
- **Verbeterd:** het verslag en de PDF tonen de selectie in vier groepen: de selectie zelf, dan
  "Niet beschikbaar" (met de reden tussen haakjes), "Geselecteerd maar niet aanwezig" en
  "Niet geselecteerd".
- **Verbeterd:** "Afwezig" heet nu "Niet aanwezig" wanneer het gaat over iemand die wel geselecteerd
  was maar er niet was — minder scherp voor wie zich last minute afmeldt. De CSV-export gebruikt
  daar ook Basis/Wissel/Niet aanwezig.
- Ook de tornooiselectie werkt met NG/NB en een reden, en de handleiding is bijgewerkt.

## v0.5.48
- **Verbeterd:** onder de tabel "Opstelling per kwart" staat nu een legende die de positielabels
  uitlegt (KP = keeper, V/M/S = verdediging/middenveld/spits, L/C/R = links/centraal/rechts) — in
  de PDF en in het verslag in de app.

## v0.5.47
- **Verbeterd:** de wedstrijd-PDF is nu ongeveer 45x kleiner (van ~8 MB naar ~170 KB). De
  velddiagrammen worden getekend als echte PDF-vectoren in plaats van als foto's, dus ze blijven
  ook scherp als je inzoomt of afdrukt, en de rugnummers en namen zijn selecteerbare tekst.
- **Verbeterd:** de voettekst en een paginanummer ("2 / 3") staan nu op elke pagina van de PDF —
  voorheen enkel op de laatste.
- **Verbeterd:** de sectie Selectie toont nu rugnummers, staat op familienaam gesorteerd en
  vermeldt ook wie afwezig was en wie niet geselecteerd was.
- **Verbeterd:** de bank staat in de tabel "Opstelling per kwart" nu op één rij met de namen onder
  elkaar, i.p.v. rijen "Bank 1/2/3" waarin dezelfde rij per kwart van speler verwisselde.
- **Verbeterd:** bij elke tussenstand staat nu vermeld welke ploeg vooraan staat (thuis – uit), en
  de wedstrijdstatistieken lezen als "1 voor / 0 tegen" i.p.v. "1 – 0", dat op een score leek.
- **Verbeterd:** een doelpunt van de tegenstander heet nu "Doelpunt <ploegnaam>" i.p.v.
  "Tegendoel", in lijn met de andere gebeurtenissen die de ploegnaam vermelden.
- **Nieuw:** het wedstrijdverslag in de app toont nu ook de Selectie en de tabel
  "Opstelling per kwart" (zijwaarts schuifbaar, met de positiekolom vast in beeld) — die stonden
  tot nu enkel in de PDF.
- **Verbeterd:** namen onder de spelers op het veld krijgen een donker plaatje, zodat ze leesbaar
  blijven waar twee spelers dicht bij elkaar staan; in de PDF blijven ze binnen het veld.
- **Nieuw:** in de velddiagrammen staat bij een speler die tijdens dat deel gewisseld werd nu ook
  wie hem kwam vervangen ("» Hebbrecht"), en bij twee wissels op dezelfde plek de hele reeks
  ("» Segers » Deprez"). Zowel in de app als in de PDF.
- **Verbeterd:** de titel boven de velddiagrammen is nu "Startopstelling per kwart" (of per helft /
  per deel), want ze tonen de stand bij het begin van elk deel — niet één opstelling voor de
  hele wedstrijd.

## v0.5.46
- **Verbeterd:** in de tabel "Opstelling per kwart" van de wedstrijd-PDF staan nu de volledige
  namen (voorheen afgekort als "Voornaam A."); een markering zoals "(wissel uit)" staat op een
  eigen regel onder de naam.
- **Verbeterd:** in de volledige tijdlijn van de PDF staat de tussenstand nu naast het kwart
  i.p.v. eronder (de kop loopt over de volle breedte).
- **Verbeterd:** tabellen in de PDF worden zoveel mogelijk in één stuk gehouden — past een tabel
  met zijn titel niet meer op de pagina, dan schuift het geheel naar de volgende pagina, en een
  rij met meerdere regels wordt nooit middendoor geknipt.
- **Opgelost:** bij een uitwedstrijd stond de tussenstand in de PDF-tijdlijn omgekeerd (eigen
  ploeg eerst) — nu overal dezelfde volgorde: thuisploeg – uitploeg.

## v0.5.42 – v0.5.45
- **Nieuw:** de wedstrijd-PDF heeft een sectie **Selectie** (alfabetisch, zonder afwezigen) en een
  tabel **Opstelling per kwart** met per periode wie op welke veldpositie stond, de bank, en
  markeringen voor wissels, rood en blessure.
- **Verbeterd:** de tabel "Opstelling per kwart" staat vóór de velddiagrammen, en de diagrammen
  blijven als één blok samen op één pagina.
- **Opgelost:** de oranje lijn in de PDF-header liep soms door de infotekst bij een lange titel.

## v0.5.41
- **Verbeterd:** in 8v8 "2-3-2" kregen de centrale middenvelder en een aanvaller allebei
  bolnummer 10 — het duo voorin is nu 9/10 en de centrale middenvelder 8 (flanken blijven 11/7).
- **Opgelost:** een gearchiveerde ploeg bleef voor leden gewoon bruikbaar (o.a. na herstart) —
  leden worden nu naar het ploegkeuzescherm geleid; eigenaar/clubbeheerder behoudt toegang.
- **Opgelost:** een ploeg zonder leden was voor de eigenaar nergens te verwijderen — ze staat nu
  (met "geen leden") in het scherm "Alle gebruikers".
- **Opgelost:** het oog-icoon op de statistiekenpagina klapte alle openstaande secties dicht; en
  een mislukte zichtbaarheids-wijziging wordt nu gemeld en teruggedraaid i.p.v. stil genegeerd.
- **Opgelost:** de assist-telling verschilde tussen seizoensoverzicht, spelerdetail en carrière —
  overal geldt nu hetzelfde criterium (assist bij een echt doelpunt).
- **Opgelost:** doelpunten/kaarten van een intussen verwijderde speler klonterden samen in een
  anonieme "?"-rij die in Topschutters kon opduiken.
- **Opgelost:** het ongedaan maken of verwijderen van een kapiteinwissel herstelt nu ook de
  kapitein zelf.
- **Opgelost:** dubbeltik-gaten gedicht bij het verwijderen van ingeplande pauzewissels en bij
  "Wedstrijd heropenen" (gaf anders een extra fantoomdeel).
- **Opgelost:** de minuut van een pauzewissel is niet meer bewerkbaar (die vindt per definitie
  bij de deelstart plaats — een aangepaste minuut brak de speeltijdberekening).
- **Opgelost:** een kijker zag bij een falende verbinding kortstondig de beheerdersweergave van
  de statistieken; klikbare spelersrijen die voor kijkers nergens toe leidden zijn weggehaald.
- **Opgelost:** "Ploeg definitief verwijderen" controleert de rechten nu vóór er iets gewist
  wordt, en ruimt ook openstaande ploegbeheer-aanvragen mee op.
- **Opgelost:** back-up herstellen meldt een fout i.p.v. stil te blijven hangen; account-opkuis
  neemt nu ook de ploegvolgorde-voorkeur mee.
- **Verbeterd:** diverse kleinere punten (clubkopje niet meer boven club-loze ploegen, melding
  bij mislukte club-registratie van een nieuwe ploeg, correcte aanvraag-melding, handleiding-
  brondocument mee hernoemd naar "ploegbeheerder").

## v0.5.40
- **Opgelost:** de "Aantal blokken"-keuze bij een tornooimatch deed niets (de match bleef altijd
  1 blok, terwijl de selector "3 delen" toonde). Er is nu een expliciete "1 blok"-optie
  (standaard) en de keuze wordt echt toegepast.
- **Opgelost:** een tornooimatch herbewerken maakte er stil een gewone wedstrijd met 3 delen
  van (incl. ploegselector) — herbewerken blijft nu in tornooi-modus met het juiste aantal
  blokken.
- **Opgelost:** een wedstrijd herbewerken na het hernoemen van de ploeg verloor de koppeling
  met de spelerslijst — de ploeg wordt nu via de vaste ploeg-referentie gevonden.
- **Opgelost:** aangepaste tornooi-rugnummers gingen verloren bij het herbewerken van het
  tornooi.
- **Opgelost:** "Gebruik als template" bij een tornooimatch toont nu ook de squadspelers die
  in de bronmatch afwezig/niet geselecteerd waren (voorheen enkel via de gast-modal terug toe
  te voegen).
- **Opgelost:** eerst het format kiezen en daarna pas de ploeg zette het format stil terug naar
  de ploegstandaard.
- **Opgelost:** "Andere…" als competitie zonder ingevulde naam bewaarde de interne code
  "__other__" als competitienaam.

## v0.5.39
- **Verbeterd:** de spelerselectie legt het verschil nu duidelijk uit: **✗ afwezig** =
  onbeschikbaar/afgemeld (telt mee in het aanwezigheids-%), **niets aanduiden** = niet
  geselecteerd / niet overwogen (telt nergens in mee, bv. speler van de B-ploeg). Zelfde
  uitleg in de tornooiselectie.

## v0.5.38
- **Opgelost:** één wedstrijd zonder datum kon "Onbekend" tot standaardseizoen maken waardoor de
  statistieken leeg leken; "Onbekend" staat nu achteraan en de seizoenskeuze toont enkel seizoenen
  van de eigen ploeg.
- **Opgelost:** een speler die tijdens de wedstrijd "Niet aanwezig" gemarkeerd werd (no-show),
  telt in de statistieken nu als afwezig i.p.v. als geselecteerd met 0 minuten — hij staat dus
  niet meer bovenaan Fair-play alsof hij geen kansen kreeg.
- **Opgelost:** het carrière-overzicht ("eerder bij") werkt nu ook meteen na de éérste
  overzetting van een speler — zijn eerdere wedstrijden worden aan zijn blijvende spelers-id
  gekoppeld.
- **Verbeterd:** wijzigt een beheerder welke statistieken publiek zijn, dan zien kijkers met de
  app al open dat meteen (live), niet pas na herstart.
- **Verbeterd:** na "Speler overzetten" keer je terug naar het clubbeheer-scherm.

## v0.5.37
- **Opgelost:** een clubbeheerder die (zonder ploeglid te zijn) via Clubbeheer een ploeg opende,
  kreeg in die sessie geen wedstrijdnotities en geen badge bij openstaande ploegbeheer-aanvragen.
- **Opgelost:** account verwijderen ruimt nu ook het e-mailregister en de eigen
  clubbeheerder-vermeldingen op, en laat geen wees-aanvraag met naam/e-mail meer achter
  (vereist eenmalige publicatie van de bijgewerkte databaseregels).
- **Opgelost:** een fout wachtwoord bij account verwijderen toont nu ook bij nieuwere
  Firebase-versies de juiste melding.
- **Opgelost:** een ploeg vervoegen zonder internet meldt nu "Geen verbinding" i.p.v. stil te
  sluiten of "Code niet gevonden" te tonen.
- **Opgelost:** een afgemelde gebruiker kon via Handleiding → terug op een leeg startscherm
  belanden — alle schermen behalve aanmelden/handleiding sturen nu terug naar het aanmeldscherm.
- **Opgelost:** een clubbeheerder die geen ploeglid is, wordt niet meer als "Kijker" in de
  ledeninfo van de ploeg geregistreerd.

## v0.5.36
- **Opgelost:** een vergeten wissel achteraf toevoegen aan een afgelopen deel verstoorde de
  huidige opstelling en de keeperminuten — posities en keepers worden nu correct herrekend.
- **Opgelost:** bij het bewerken van een event in een uitgelopen (nog lopend) deel werd de
  minuut stil teruggezet naar de geplande deelduur; ook kon een event "in de toekomst" gezet
  worden. De grens is nu de werkelijk verstreken speeltijd.
- **Opgelost:** de foutieve 2e gele kaart verwijderen neemt nu ook de automatische rode kaart
  mee (zoals "Ongedaan maken" al deed); bij het omhangen van zo'n gele naar een andere speler
  verschijnt een waarschuwing.
- **Opgelost:** een keeperwissel via "Positiewissel" telt nu meteen mee in de keeperminuten.
- **Opgelost:** de duurcorrectie in "Wedstrijd afsluiten" werd genegeerd als het laatste deel
  al beëindigd was — ze wordt nu toegepast.
- **Opgelost:** een speler die tijdens de rust "Niet aanwezig" gemarkeerd wordt, wordt uit de
  ingeplande pauzewissels gehaald en niet meer het veld op gestuurd.
- **Verbeterd:** "Event toevoegen" met deel "Onbekend" plaatst het event nu echt onder "Overig"
  i.p.v. stil op de slotminuut van het laatste deel; een wissel vraagt om een concreet deel.
- **Verbeterd:** na een formatiewijziging met reeds gelogde wissels verschijnt geen doodlopende
  "posities herplaatsen"-knop meer, maar een verwijzing naar "Positiewissel".

## v0.5.35
- **Opgelost (belangrijk):** "Plannen zonder selectie" bij het bewerken van een bestaande
  wedstrijd wiste stil de volledige selectie, opstelling, events en notities — nu worden
  enkel de gewijzigde infovelden bijgewerkt en blijft de rest bewaard.
- **Opgelost (belangrijk):** "Opslaan zonder selectie" bij het bewerken van een bestaand
  tornooi wiste stil de tornooiselectie — die blijft nu behouden.
- **Opgelost:** twee snelle tikken op "Laatste actie ongedaan maken" konden ongemerkt twee
  events verwijderen — de knop is nu beveiligd tegen dubbeltikken.
- **Opgelost:** het eindsignaal (piep/trilling) bij het verstrijken van een deel klonk niet
  wanneer je op de tab Opstelling of Verloop stond — het werkt nu op alle tabbladen van de
  live wedstrijd.

## v0.5.34
- **Opgelost:** dubbeltik op "Ploeg permanent verwijderen" kon de veiligheidsback-up
  overschrijven — nu geblokkeerd tijdens het verwijderen.
- **Opgelost:** een club met "0 ploegen" was soms toch niet verwijderbaar (wees-verwijzingen
  van al verwijderde ploegen werden meegeteld) — die worden nu genegeerd en opgekuist.
- **Opgelost:** een nieuwe wedstrijd bewaart nu de ploeg-referentie mee, zodat het hernoemen
  van een ploeg bestaande wedstrijden niet meer in de war stuurt.
- **Opgelost:** een gastspeler die intussen tot de eigen ploeg hoort, komt niet meer dubbel
  in de selectie na een ploegwissel.
- **Opgelost:** de afwezigheidscorrectie voor A/B-ploegen werkt nu ook wanneer het ene record
  een rugnummer/rosterId heeft en het andere niet.
- **Opgelost:** een gast ziet op het startscherm enkel nog de live wedstrijden van de ploeg
  die hij volgt.
- **Verbeterd:** in de CSV-export heet "Thuis/Uit" nu ook zo, en de speellocatie (veldnaam)
  is toegevoegd als "Locatie".

## v0.5.33
- **Verbeterd:** namen met niet-westerse letters (bv. Turks ş/ğ, Pools ł/ć, Tsjechisch č/ř)
  worden in de PDF nu leesbaar weergegeven i.p.v. verkeerde tekens.
- **Opgelost:** "Posities herplaatsen" wordt geblokkeerd zodra er al wissels/positiewissels
  gebeurd zijn (dat verstoorde de opstelling per kwart); vóór de eerste wissel werkt het gewoon.

## v0.5.32
- **Verbeterd:** de app cachet geen mislukte downloads meer (voorkomt dat een tijdelijke fout
  blijft "hangen").
- **Opgelost:** "Gebruik als template" bij een tornooiwedstrijd behoudt nu de formatie én de
  opstelling.
- **Nieuw:** waarschuwing bij een dubbel rugnummer onder de geselecteerde spelers in de
  wedstrijd-wizard.

## v0.5.31
- **Opgelost:** bij "een tornooiwedstrijd plannen zonder opstelling" werd de gekozen blokduur
  genegeerd.
- **Verbeterd:** "Snel resultaat" waarschuwt nu als je meer doelpuntenmakers aanduidt dan de
  ingevulde eindstand, i.p.v. de score stil op te trekken.
- **Opgelost:** de overtime-piep werkt weer betrouwbaar wanneer meerdere beheerders meekijken.
- **Verbeterd:** PDF-opmaak: een lange titel overlapt de datumregel niet meer; een niet-afgesloten
  kwart toont een zinvolle duur i.p.v. "0 min".

## v0.5.30
- **Opgelost:** de onderhoudsmodus geldt nu ook voor gasten.
- **Opgelost:** een als "niet aanwezig" gemarkeerde speler krijgt 0 speelminuten, ook als hij
  eerder inviel.
- **Opgelost:** een bewerkte minuut van een event blijft binnen het juiste kwart.
- **Verbeterd:** diverse kleine schermkwesties ("Alle gebruikers" laadt niet oneindig meer,
  seizoensweergave bij een ontbrekende datum, dubbele-klik op "Nieuwe club", handleiding-tekst).

## v0.5.29
- **Verbeterd:** in de spelerslijst-editor is de ploegnaam niet meer bewerkbaar (dat deed daar
  niets); hernoemen gebeurt via **Beheer → "Naam ploeg wijzigen"**.

## v0.5.28
- **Verbeterd:** de rol "co-beheerder" heet overal consistent **"ploegbeheerder"**; een oud,
  verwarrend rol-label is opgeruimd.

## v0.5.27
- **Opgelost:** de clubkeuzelijst in "Mijn club beheren" toont voor elke club de echte naam
  i.p.v. een interne code.

## v0.5.26
- **Opgelost:** een wissel-event achteraf bewerken herberekent nu correct de veldposities;
  keeperminuten kloppen weer na het ongedaan maken/verwijderen van een wissel.

## v0.5.25
- **Opgelost:** een wissel achteraf toevoegen aan een afgelopen deel wordt correct geregistreerd
  i.p.v. stil een pauzewissel te worden.
- **Opgelost:** een tweede gele kaart ongedaan maken haalt ook de automatische rode kaart weg.
- **Opgelost:** een afwezig gemarkeerde speler belandt niet meer terug op het veld.

## v0.5.24
- **Nieuw:** extra beveiliging tegen dubbele registraties (positiewissel, afgekeurd doelpunt,
  snelle notitie) en tegen het per ongeluk heropenen van een afgesloten deel.
- **Opgelost (veiligheid):** een ploegnaam met speciale tekens kan geen ongewenste code meer
  uitvoeren in de beheerschermen.

## v0.5.23
- **Nieuw:** de standaardopstelling van een ploeg is nu zichtbaar in het ploegoverzicht.

## v0.5.22
- **Nieuw:** bij het aanmaken van een ploeg kies je een **standaard wedstrijdvorm** (bv. 11v11)
  en **standaard opstelling** (bv. 1-4-3-3). Die staan klaar bij een nieuwe wedstrijd en blijven
  per wedstrijd aanpasbaar; achteraf wijzigbaar via "Ploeg bewerken".

## v0.5.21
- **Opgelost:** bij het herbewerken van een geplande wedstrijd gaan afwezige en nog-niet-gekozen
  spelers niet meer verloren.
- **Opgelost:** statistieken van een andere ploeg op hetzelfde toestel lekken niet meer mee.

## v0.5.20
- **Nieuw:** statistieken zijn nu per sectie regelbaar voor kijkers. De ploegbeheerder kiest met
  een oog-icoon welke secties publiek zijn; bij de rest zien kijkers de melding
  "Meer statistieken enkel beschikbaar voor ploegbeheerders". Het individuele spelerdetail blijft
  voorbehouden aan beheerders.

## v0.5.19
- **Opgelost:** een reeks problemen met de clubbeheerder-rol (speler overzetten, ledenscherm,
  rol-behoud, notities-synchronisatie).
- **Opgelost:** de tornooi-selectie ("Selectie & opstelling") liep dood met een lege spelerslijst.
