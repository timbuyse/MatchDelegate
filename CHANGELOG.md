# Changelog — MatchDelegate

Leesbaar overzicht van de wijzigingen per versie, nieuwste bovenaan. Bedoeld als
naslag naast de technische commit-messages. Versies vóór 0.5.19 staan in de
git-geschiedenis en in de `analyse-*`-bestanden in de repo.

De meeste wijzigingen sinds 0.5.19 komen uit een grondige audit van het nieuwe
clubmodel (rollen: eigenaar → clubbeheerder → ploegbeheerder → kijker → gast).

---

## v0.20.2
- **Een geplande wissel hoort nu bij een deel.** Bij het klaarzetten kies je "voor kwart 3", en dan
  duikt die wissel ook pas in kwart 3 op met zijn knop **'Nu doorvoeren'**. In de andere delen blijft
  hij wel zichtbaar — je wil je hele plan kunnen zien — maar met het label *Gepland voor kwart 3*.
  Het telletje op de knop toont alleen nog wat je in dít deel kan doorvoeren. Kies je geen deel, dan
  is de wissel overal bruikbaar, net als vroeger; bestaande geplande wissels blijven dus werken.
- **Tijdens de wedstrijd zie je de planning voor wat nog komt.** Onderaan het tabblad **Opstelling**
  staat een blok *Planning* waarin je per nog te spelen deel het veld, de bank en de geplande
  wissels van dat deel bekijkt. Alleen-lezen — wijzigen doe je waar je dat al deed. Het blok
  verdwijnt zodra er niets meer te tonen valt.
- Bij een geplande wedstrijd staan **'Wissels plannen'** en **'Opstelling per kwart wijzigen'** als
  twee knoppen onder het veld, in die volgorde. Ze zijn daarmee uit het bewerkmenu gehaald: je zoekt
  ze terwijl je naar de opstelling kijkt, niet in een menu.
- **Een andere formatie wist je opstelling per deel.** Die stond immers op de plaatsen van de oude
  formatie, en leverde bij 'Geplande opstelling gebruiken' positiewissels op die niemand bedoeld
  had. Je krijgt de vraag zodra je een andere formatie kiest — annuleren laat alles staan — en de
  bevestiging volgt pas bij het opslaan.
- **De planning waarschuwt zelf als de selectie wijzigt.** Staat er iemand in je opstelling voor een
  volgend deel die intussen uit de selectie is of op *niet aanwezig* staat, dan zegt een kadertje
  onder de planning welk deel je moet nakijken en om wie het gaat. Markeer je iemand tijdens de
  wedstrijd als niet aanwezig, dan meld de app dat meteen. Het plan zelf blijft staan: wie zijn
  plaats inneemt, beslis jij.
- De melding *"N speler(s) uit het plan minder op het veld dan er nu staan"* is vervangen door
  *"Er komt niemand in de plaats voor X — hij blijft op het veld."*

## v0.20.0
- **De planning staat nu in het scherm zelf.** Bij een geplande wedstrijd vervangt één blok
  **Planning** de losse knop 'Opstelling per kwart' én de aparte blokken 'Opstelling' en 'Bank': je
  bladert met **‹ ›** door de delen, ziet per deel het veld met de bank die eronder meeschuift, en
  past dat deel aan met het **potlood** rechtsboven.
- **Ook kwart 1 pas je zo aan.** Het potlood werkt op élk deel, ook op de startopstelling — bank en
  veld tikken doet daar meteen ook wie start en wie op de bank begint. Bij een wedstrijd die al
  loopt is deel 1 alleen-lezen: er hangen dan al speelminuten en events aan die opstelling. De knop
  bovenaan heet daarom voortaan gewoon **'Selectie'** (namen, nummers, kapitein).
- **De wizard eindigt altijd op een ingeplande wedstrijd.** Na de opstelling kies je **'Plannen'**
  of **'Opstelling volgende kwarten'** — die laatste plant de wedstrijd in en opent meteen de
  planner voor deel 2. Diezelfde knop staat ook onder de planningskaart van een geplande wedstrijd.
  De knop 'Nu starten' is weg: je **start** een wedstrijd voortaan bewust vanuit het
  wedstrijdscherm, met dezelfde waarschuwing als vroeger.
- **Alles wat je aan een geplande wedstrijd kan doen zit onder één knop 'Bewerken'.** Die opent een
  menu met zes keuzes, elk met een regel uitleg: *Info bewerken* (tegenstander, datum, uur,
  formaat), *Selectie* (basis / wissel / NB), *Opstelling & formatie*, *Namen, nummers & notities*,
  *Geplande wissels* en *Snel resultaat invoeren*. Elk scherm doet nog één ding en eindigt op
  **Opslaan** — geen doorloop meer door de hele wizard om één veld te wijzigen. Wat spelers nodig
  heeft, staat uit zolang er nog geen selectie is.
- Het voorbereidingsscherm zelf houdt daardoor nog drie knoppen over: **starten**, **bewerken** en
  **verwijderen**, met de planning ertussen. Bij een wedstrijd zonder selectie staat *Selectie
  ingeven* er nog naast — dat is dan de volgende stap.
- Het selectiescherm opent voortaan **met je bestaande selectie al ingevuld**. Vroeger belandde je
  bij een wedstrijd die al een selectie had in 'Spelers bewerken' (namen en nummers), en begon het
  selectiescherm zelf met een leeg blad.
- Zet je iemand in de basis zonder plaats, dan krijgt hij er automatisch een — verzetten doe je
  daarna met het potlood. De **formatie** staat onderaan bij de opstelling van deel 1.
- **'Geplande wissels'** legt nu uit waarvoor het dient: een wissel **tijdens** een deel, op een
  moment dat jij kiest. Wie er bij de **start** van een deel staat, regel je met de planning.
- Herbewerk je een wedstrijd die al **loopt**, dan kom je na 'Opslaan' weer in het livescherm
  terecht in plaats van in het voorbereidingsscherm.
- **'Deel score'** staat niet meer in de weg tijdens de wedstrijd; die knop verschijnt zodra ze
  afgelopen is.
- **'Snel resultaat invoeren'** staat onderaan bij de andere zeldzame acties, en **'Gebruik als
  template'** is uit het voorbereidingsscherm verdwenen (bij een tornooiwedstrijd blijft 'Kloon als
  nieuwe tornooiwedstrijd' staan).

## v0.19.10
- **Nieuw: opstelling per deel vooraf plannen.** In het voorbereidingsscherm van een geplande
  wedstrijd staat nu **'Opstelling per kwart'** (of helft/deel). Per deel tik je een **bankspeler en
  dan een veldspeler** om te wisselen, of **twee veldspelers** om ze van plaats te wisselen — net
  zoals in de pauze. Elk deel begint als een kopie van het vorige, dus je past enkel aan wat
  verandert.
- **Vooraf nakijken:** in datzelfde scherm blader je met de tabjes bovenaan door de delen en zie je
  telkens het volledige veld met de bank eronder. Een deel waarvoor je zelf iets plande krijgt een
  stipje.
- **Gebruiken doe je zelf.** In de pauze verschijnt **'Geplande opstelling gebruiken'**. Dat scherm
  rekent uit welke wissels en positiewissels er nodig zijn om die opstelling te krijgen, toont ze,
  en zet ze klaar voor de start van het volgende deel — waar je ze nog kan aanpassen of weggooien.
  Er gebeurt nooit iets zonder dat jij erop drukt.
- Het omrekenen kiest het **kleinst mogelijke aantal wissels**: een invaller neemt bij voorkeur
  meteen de juiste plaats over, en spelers die enkel van plaats ruilen worden in zo weinig mogelijk
  positiewissels gegoten. Staat er iemand uit je plan intussen op afwezig, dan wordt dat gemeld en
  overgeslagen in plaats van stil doorgevoerd.
- **Op het velddiagram** tellen positiewissels die bij de **start** van een deel gebeuren voortaan
  mee — dat is precies wat een geplande opstelling is, dus je plan staat correct in het verslag.
  Positiewissels tijdens het spel blijven genegeerd, zoals sinds v0.19.2.
- Het menu **'Geplande wissels'** (v0.19.6) blijft ernaast bestaan voor losse wissels die je op
  eender welk moment doorvoert.

---

## v0.19.9
- **Opgelost:** een **afgesloten tornooi** bleef op het **startscherm** nog onder 'Gepland' staan,
  terwijl het in de tornooilijst wel al bij de gespeelde stond. Het blok 'eerstvolgende tornooi'
  keek enkel naar de datum. Nu verdwijnt een afgesloten tornooi daar meteen en schuift het
  eerstvolgende openstaande tornooi door; heropen je het, dan staat het er weer.

---

## v0.19.8
- **Nieuw: een tornooi afsluiten.** Onderaan de tornooipagina staat nu **'Tornooi afsluiten'**. Het
  tornooi verhuist dan naar de **gespeelde tornooien** — ongeacht de datum — en er kunnen geen
  wedstrijden meer bijkomen. Bovenaan zie je wanneer het afgesloten werd, en met **'Tornooi
  heropenen'** draai je het terug.
- Staan er bij het afsluiten nog **wedstrijden op gepland**, dan zegt het scherm er hoeveel, met de
  keuze om ze **meteen mee te verwijderen** of gewoon te laten staan.
- Naam, selectie en info van een afgesloten tornooi blijven gewoon **aanpasbaar** — je hoeft niet
  eerst te heropenen om iets recht te zetten. Enkel wedstrijden toevoegen en klonen valt weg.
- Voordien bepaalde alleen de **datum** waar een tornooi in de lijst stond: dat van vandaag bleef de
  hele dag onder 'Gepland' staan, en er was geen manier om het zelf op te bergen. Tornooien die je
  niet afsluit volgen die datumregel gewoon verder, dus aan bestaande tornooien verandert er niets.

---

## v0.19.7
- **Het velddiagram toont voortaan enkel de opstelling bij de start van dat deel.** Geen namen van
  vervangers meer onder de bollen, en geen kaartjes. De bollen tonen wat altijd klopt: positienummer,
  naam, de kapitein en de oranje doelman.
- **De wissels staan nu in een kader onder het veld**, met de minuut erbij: wie eraf ging (rood
  pijltje omlaag) en wie erin kwam (groen pijltje omhoog).
- **Wissels in dezelfde minuut staan samen op één regel** — de spelers die eraf gaan bij elkaar, de
  invallers bij elkaar. Een dubbele wissel is één beslissing en leest zo ook zo. Zijn het er veel,
  dan breken de namen netjes af binnen hun kolom.
- Reden: het diagram houdt sinds v0.19.2 bewust geen rekening met positiewisselingen. Een vervanger
  onder een bol hangen suggereerde dan een positie die hij misschien nooit gespeeld heeft. In het
  kader gaat het enkel over wie en wanneer, en dat klopt altijd.
- **Kaarten staan niet meer op het veld** — die vind je in de tijdlijn van de events, waar ook de
  minuut en de rest van het verloop staat. Hetzelfde geldt voor een positiewissel naar doel: die
  staat in de tijdlijn, niet meer bij het veld.
- De **PDF** krijgt exact hetzelfde kader als het scherm: dun kadertje, kopje **WISSELS**, en per
  regel de minuut met dezelfde rode en groene pijltjes (met lijnen getekend, want de PDF-lettertypes
  hebben geen pijlteken). Enkel de pijltjes zijn gekleurd; de namen staan in de gewone tekstkleur.
- **Spelersknoppen tonen nu dezelfde naam als op het veld:** voornaam met de beginletter van de
  familienaam. Vroeger stond daar enkel de familienaam, zodat je op het veld *Sam D.* las en in de
  wisselmodal *De Wit*. Geldt voor alle knoppen waar je een speler kiest — wissel, positiewissel,
  goal, assist, eigen doel, kaart, penalty, blessure, kapitein en de geplande wissels. Hebben twee
  spelers dezelfde voornaam, dan komen er letters bij (*Lars Mer.* naast *Lars Mee.*), net als op het
  velddiagram.

---

## v0.19.6
- **Nieuw: geplande wissels.** Je kan nu **wissels en positiewissels op voorhand klaarzetten** —
  al bij een geplande wedstrijd, en tijdens een lopend deel of in de pauze. Ze blijven staan tot jij
  ze doorvoert. Het menu opent met de knop **'Geplande wissels'** op het tabblad Wedstrijd en in het
  voorbereidingsscherm; het telletje op de knop toont hoeveel er klaarstaan.
- In dat menu pas je een klaargezette wissel aan (potlood), gooi je hem weg (×) of druk je op
  **'Nu doorvoeren'**. Loopt er een deel, dan komt de wissel meteen in het verloop. Zit je in de
  pauze, dan wordt hij klaargezet bij de start van het volgende deel. Vóór de aftrap kan je enkel
  klaarzetten — dat staat er ook bij.
- **Er gaat nooit iets vanzelf af.** Een klaargezette wissel blijft wachten, ook bij de start van een
  nieuw deel. De **pauze-opstelling** die je in het tabblad Opstelling maakt (bankspeler + veldspeler
  aantikken) verandert niet: die wordt nog altijd automatisch doorgevoerd bij de start van het
  volgende deel. Beide lijsten staan wel samen in dit ene menu, elk onder hun eigen kop, zodat je in
  één oogopslag ziet wat er klaarstaat.
- Is de situatie intussen veranderd — de speler is al gewisseld, staat niet meer op het veld of is
  afwezig gemarkeerd — dan zegt het menu waarom die wissel nu niet kan en verdwijnt de knop
  'Nu doorvoeren'. Wie afwezig gemarkeerd wordt, verdwijnt meteen uit de klaargezette lijst.

---

## v0.19.5
- **Nieuw:** een **keeperwissel is nu zichtbaar op het velddiagram**. Dat was de enige positiewissel
  die de tekening feitelijk onjuist maakte: de oranje bol op de doellijn beweerde dat die speler dat
  deel gekeept had, ook als hij al lang niet meer in doel stond.
- Gebeurde de keeperwissel **in de pauze**, dan staat de nieuwe doelman meteen oranje op de doellijn
  van dat deel, en de oude op de veldpositie die hij overnam. Gebeurde ze **tijdens** een deel, dan
  blijft dat deel tonen wie er bij de aftrap in doel stond — dat klopte immers — met een regeltje
  bij die bol: het handschoenicoon en de naam van wie overnam. Vanaf het volgende deel staat de
  nieuwe keeper gewoon op de doellijn.
- Alle **andere** positiewisselingen blijven zoals sinds v0.19.2: die verplaatsen niets op het
  diagram. Er kunnen ook geen bollen door overlappen — een positiewissel verwisselt twee plaatsen
  binnen dezelfde formatie.
- In de PDF staat zo'n regeltje als **'doel: naam'** in plaats van met het handschoenicoon: de
  PDF-lettertypes hebben dat teken niet.

---

## v0.19.4
- **Opgelost:** werd een speler tijdens hetzelfde deel **twee keer vervangen**, dan stonden beide
  vervangers achter elkaar op één regeltje onder zijn naam. Dat paste niet en werd afgekapt met
  puntjes. Ze staan nu **onder elkaar**, elk op hun eigen regeltje, in de volgorde waarin ze
  invielen. Zowel op het scherm als in de PDF.
- **Opgelost:** bij een speler helemaal onderaan het veld — in de praktijk de **doelman** — viel het
  wisselregeltje buiten het veld. Op het scherm werd het afgeknipt, in de PDF werd het zelfs op het
  wit naast het veld getekend. Dat gebeurde ook al bij één enkele wissel. Die regeltjes staan nu
  **naast de bol**, richting het midden van het veld, waar ze tegen de speler aan sluiten.
- Nagekeken op alle formaties van alle wedstrijdtypes (3v3 tot 11v11), met elke speler twee keer
  gewisseld: geen enkel naam- of wisselplaatje valt nog buiten het veld of wordt afgekapt.

---

## v0.19.3
- **Nieuw:** een **positiewissel achteraf toevoegen** bij een afgewerkte wedstrijd. Bij
  **'Event toevoegen'** staat nu een knop **Positiewissel**, naast Wissel. Je kiest eerst het deel
  (en optioneel de minuut), daarna de twee spelers. Enkel spelers die in dat deel op het veld
  stonden worden aangeboden — met iemand van de bank van positie wisselen betekent niets.
- **Nieuw:** een **bestaande positiewissel bewerken**. Via het potloodje in het verloop pas je nu
  ook aan **welke twee spelers** van positie wisselden, niet langer alleen de minuut. Twee keer
  dezelfde speler wordt geweigerd; de rest van de bewerking blijft dan onaangeroerd.
- Na zo'n toevoeging of aanpassing worden de posities en de **keeperminuten** opnieuw opgebouwd
  vanaf de startopstelling, zodat een keeperwissel die via een positiewissel gebeurde ook achteraf
  nog correct in de minuten belandt.
- De filter **'Wissels'** boven het verloop toont voortaan ook de positiewisselingen — anders vond
  je een net toegevoegde niet terug.
- Ter herinnering: het **velddiagram** toont sinds v0.19.2 enkel de startopstelling en de wissels.
  Een positiewissel die je hier toevoegt of aanpast verschijnt dus in het verloop en in de
  keeperminuten, maar verplaatst geen bollen op de tekening.

---

## v0.19.2
- **Opgelost:** op het **velddiagram in het wedstrijdverslag** konden spelers boven elkaar belanden
  of naast hun positie zweven, vooral bij een wedstrijd met veel wissels én positiewisselingen.
- Het diagram toont voortaan de **startopstelling met enkel de wissels erop toegepast**: een
  invaller neemt de plaats in van wie eraf ging. **Positiewisselingen tellen niet meer mee** in de
  tekening — die blijven gewoon in het wedstrijdverloop staan en tellen ook nog altijd mee voor de
  keeperminuten. Let wel: verandert een speler tijdens het deel van doel via een positiewissel, dan
  blijft op het diagram de oorspronkelijke doelman op de doellijn staan; de juiste keeper vind je in
  het verloop en bij 'Keeper(s)'.
- **Opgelost:** bij een wedstrijd van **één deel** (zoals vrijwel alle tornooiwedstrijden) werd het
  diagram helemaal niet gereconstrueerd — het toonde de basisspelers op hun *eindpositie*, inclusief
  een speler die al lang gewisseld was. Daar kwamen de dubbele bollen het duidelijkst naar boven.
  Nu loopt ook dat geval via dezelfde reconstructie, op het scherm én in de PDF.
- **Opgelost:** alles wat bij de start van een deel tegelijk werd doorgevoerd (pauzewissels en
  pauze-positiewissels) kreeg hetzelfde tijdstip, waardoor de reconstructie van een vroeger deel die
  gebeurtenissen in de verkeerde volgorde terugdraaide. Dat is nu sluitend, wat ook de
  keeperminuten na zo'n pauze correcter maakt.

---

## v0.19.1
- **Nieuw:** in **'Ploeg bewerken'** geef je nu **zoveel trainers en ploegverantwoordelijken in als
  je wil**. De limiet van drie trainers is weg, en de ploegverantwoordelijke — tot nu één enkel
  veld — kreeg dezelfde behandeling. Vul een naam in en tik op **'+ Nog een trainer'** of
  **'+ Nog een ploegverantwoordelijke'** voor de volgende; met het rode kruisje haal je er één weg.
- **Nieuw:** ook de **ploegverantwoordelijken** kies je nu per wedstrijd en per tornooi met een
  aanvinklijst, net zoals de trainers sinds v0.19.0. Wie niet in de ploeg staat, typ je in het vrije
  veld eronder (meerdere namen mogen, gescheiden door een komma).
- Bij een nieuwe wedstrijd of een nieuw tornooi staat voortaan de **eerste trainer én de eerste
  ploegverantwoordelijke** van de ploeg aangevinkt. Voordien werden bij de ploegverantwoordelijke
  alle namen tegelijk overgenomen.
- In het ploegoverzicht worden trainers en ploegverantwoordelijken **genummerd** zodra er meer dan
  één is; bij precies één blijft het gewoon "Trainer" en "Ploegverantw.".
- Opnieuw **geen wijziging aan het datamodel**: meerdere ploegverantwoordelijken zitten
  komma-gescheiden in hetzelfde veld `responsible`, zoals de trainers in `trainer`. Bestaande
  ploegen, wedstrijden en tornooien blijven onveranderd leesbaar.

## v0.19.0
- **Nieuw:** een wedstrijd kan door **meer dan één trainer** begeleid worden. Waar vroeger één
  trainer uit een keuzelijst kwam, staat nu een **aanvinklijst** met de trainers van de ploeg: vink
  er zoveel aan als er die dag bij zijn. Eronder blijft één vrij veld voor iemand die niet in het
  ploegrooster staat (ook daar mogen meerdere namen, gescheiden door een komma).
- Dat geldt op de drie plaatsen waar je trainers ingeeft: de **nieuwe-wedstrijdwizard** (onder
  '+ Meer details'), **'Info bewerken'** bij een lopende of geplande wedstrijd, en **stap 1 van een
  tornooi**. Bij een tornooiwedstrijd zelf blijft het ongewijzigd: die neemt de trainers van het
  tornooi over, zoals voordien.
- In het verslag, de PDF en het tornooioverzicht staat het label op **"Trainers"** zodra er meer dan
  één is, en anders gewoon op "Trainer".
- Onder de motorkap verandert er **niets aan het datamodel**: meerdere trainers zitten als één
  komma-gescheiden tekst in hetzelfde veld. Bestaande wedstrijden en tornooien blijven dus
  onveranderd leesbaar, en er is geen migratie nodig.

## v0.18.6
- **Nieuw:** een **Agenda** op het startscherm van de ploeg, als brede tegel onder de vier andere.
  Daar staan wedstrijden **en** tornooidagen samen op één kalender — het enige scherm waar dat zo
  is. Tik op een tornooidag en je gaat naar het tornooi, tik op een wedstrijd en je gaat naar de
  wedstrijd. De blokken "Eerstvolgende wedstrijd", "Laatst gespeeld" en "Eerstvolgende tornooi"
  blijven gewoon staan; de agenda is er om verder vooruit te kijken.
- Van een tornooi staat enkel de **dag** in de agenda, niet elke wedstrijd ervan apart — anders zou
  één tornooidag de kalender vullen.
- Beide kalenders openen op de **huidige maand**, ook als je de vorige keer verder gebladerd had.

## v0.18.5
- **Nieuw:** de wedstrijden kunnen nu ook als **kalender** getoond worden. Bovenaan het scherm staat
  een schakelaar **Lijst · Kalender**; je keuze wordt onthouden.
- De kalender toont een maand met een stip per wedstrijd: oranje voor gepland, rood voor live en
  grijs voor gespeeld. Tik een dag aan en je ziet die wedstrijden eronder; tik je niets aan, dan
  staat de hele maand op volgorde onder de kalender. Met de pijltjes blader je door de maanden.
- Net als de lijst in dat scherm toont de kalender **enkel losse wedstrijden** — tornooien horen bij
  hun eigen scherm.

## v0.18.4
- **Nieuw:** per ongeluk op **"Wedstrijd starten"** getikt? In het livescherm staat nu onder de
  startknop **"Toch nog niet gestart"**, die de wedstrijd terugzet naar gepland. Ze is dan ook niet
  langer live zichtbaar voor kijkers. Voordien was zo'n misklik in de app niet meer terug te
  draaien — de enige uitweg was de wedstrijd uitspelen of afsluiten.
- De knop verschijnt **alleen zolang er echt niets gebeurd is**: geen enkel deel gelopen en geen
  enkele gebeurtenis gelogd. Daarna zou terugzetten speelminuten en gebeurtenissen in een halve
  toestand achterlaten, en weigert de app het ook als je het langs een omweg probeert.

## v0.18.3
- **Gewijzigd:** een gast die afmeldt, verdwijnt nu ook **uit de ledenlijst**. Tot nu toe bleef hij
  daar als naamloze kijker staan ("(naam nog niet gekend)") nadat zijn account al weg was — een
  regel die naar niets meer verwees. Zijn lidmaatschap, eventuele beheeraanvraag en persoonlijke
  index-records worden nu opgeruimd vlak vóór het account zelf, want daarna staan de
  beveiligingsregels geen enkele wijziging meer toe.
- Diezelfde opruiming gebeurde al bij **Account verwijderen** in Instellingen. Beide gebruiken nu
  één gedeelde routine, zodat ze niet uit elkaar kunnen groeien. Wedstrijden en spelers van de
  ploeg blijven onaangeroerd — die zijn van de anderen.

## v0.18.2
- **Gewijzigd:** een **gast wordt bij het afmelden ook verwijderd**, niet enkel afgemeld. Zijn
  anonieme account is daarna toch onbruikbaar — er hangt geen e-mailadres aan om mee terug te keren —
  en bleef tot nu toe als leeg account achter. Bij elke nieuwe kijker kwam er zo weer een bij.
  Dit gebeurt uitsluitend bij een gast: een gewoon account wordt gewoon afgemeld, nooit verwijderd.
  Lukt het verwijderen niet, dan volgt gewoon afmelden, zodat niemand op dat scherm blijft hangen.
- Dit hangt bewust aan de **afmeldknop**, niet aan het sluiten van de app: die signalen vuren ook
  als je even naar een andere app kijkt, en op een iPhone komt er bij het wegvegen vaak helemaal
  geen signaal. Een gast die de app wegveegt zonder af te melden, laat dus nog steeds een account
  achter — dat kan alleen aan de serverkant opgeruimd worden.

## v0.18.1
- **Opgelost:** de **logo's in de PDF waren onscherp**. Drie oorzaken, alle drie aangepakt:
  - De naam "Match Delegate" in de voettekst was een *afbeelding* van tekst, pal naast de scherpe
    lettertekst van de clubnaam ernaast. Nu staat daar het pictogram als beeld met de naam als
    echte tekst — even scherp als de rest, op elke zoomstand en bij elke printer.
  - Logo's werden in één keer van hun volle grootte naar het eindformaat verkleind. De app doet dat
    nu in halveringsstappen, waardoor randen scherp blijven in plaats van te vervagen.
  - De resolutie ging van vier naar acht beeldpunten per punt (≈576 dpi).
- **Opgelost:** een PDF was daardoor onnodig zwaar. jsPDF bewaart afbeeldingen standaard
  ongecomprimeerd — een logo van 320 bij 320 kostte zo 400 KB aan ruwe beeldpunten. Alle
  afbeeldingen worden nu samengeperst: een wedstrijdverslag ging van 500 naar **80 KB**, dus ook
  lichter dan vóór deze reeks, en dat mét de dubbele resolutie.

## v0.18.0
- **Nieuw:** er is nu een **merkje met de naam erin**, in de opmaak van de opstartanimatie: het
  pictogram met "Match Delegate" (en bij de hoge versie de groene balk en "Manage · Track · Share").
  Tot nu toe bestond het merk enkel als los pictogram zonder naam, of als naam op een donkere tegel —
  die tegel werkte nergens op een licht blad. Vier bestanden: liggend en staand, elk in een versie
  voor een lichte en een donkere ondergrond.
- **Gewijzigd:** in de **voettekst van beide PDF's** staat nu dat liggende merkje. De naam zit in het
  beeld, dus in het midden staat enkel nog de clubnaam, met rechts de paginanummering.
- **Gewijzigd:** de titelpagina van de **handleiding-PDF** draagt nu dat staande merkje, in plaats
  van de naam en de baseline als losse tekstregels.
- **Opgelost:** op het **gastmodus-scherm** stond "Gastmodus" in witte letters op een lichte
  achtergrond — onleesbaar. Dat scherm heeft nu dezelfde kop als het aanmeldscherm (het logo op de
  fotoachtergrond met de naam eronder), en "Gastmodus" staat als gewone titel in de kaart eronder,
  net als "Welkom" bij het aanmelden. Meteen ook de donkere tegel weg die daar als enige nog stond.
- **Gewijzigd:** het logo op het aanmeld- en gastscherm is iets groter (110 → 128 px).

## v0.17.9
- **Gewijzigd:** in beide PDF's staat het **clublogo nu linksboven**, op de plaats waar eerder het
  MatchDelegate-logo stond. Een wedstrijd- of tornooiverslag is een document van de club, dus die
  hoort er als eerste te staan. Heeft de club geen logo, dan begint de titel gewoon op de marge.
- **Gewijzigd:** het **app-logo verhuisde naar de voettekst**, die nu uit drie delen bestaat: links
  het logo (op dezelfde marge als het clublogo bovenaan), in het midden "Match Delegate · clubnaam",
  rechts de paginanummering. Daar staat de transparante versie van het logo — de vierkante tegel met
  donkere achtergrond woog op wit papier zwaarder dan de club zelf.
- **Gewijzigd:** "app created by Tim Buyse" staat niet meer in de voettekst.

## v0.17.8
- **Opgelost:** het **clublogo stond wazig in de PDF**. Het werd op 40 bij 40 pixels getekend voor
  een vak van 40 bij 40 punten — dat is 72 dpi, precies de resolutie waarop een logo vervaagt zodra
  je inzoomt of afdrukt. Nu krijgt het vier pixels per punt (160 bij 160, ≈288 dpi), in de
  wedstrijd-PDF én het tornooiverslag. Het MatchDelegate-logo ernaast ging in dezelfde beweging van
  96 naar 160 pixels.
- **Gewijzigd:** een clublogo wordt bij het uploaden bewaard op **maximaal 512 pixels** in plaats van
  256, zodat er marge is voor scherpe weergave. Valt de PNG te groot uit, dan verkleint de app hem
  eerst een stap (384, dan 256) voor ze naar JPEG overschakelt: een logo hoort zijn doorzichtige
  achtergrond te houden, anders krijg je een witte blokrand op een donkere ondergrond. **Heb je je
  clublogo al ingesteld? Laad het opnieuw op** — wat er nu staat is nog de oude, kleinere versie.

## v0.17.7
- **Gewijzigd:** in het tornooiverslag staan **speeltijd en fair-play nu in één tabel** in plaats van
  twee lijsten onder elkaar met dezelfde namen. Per speler staan beide gemiddelden naast elkaar:
  *Gespeeld · Totaal speelminuten · Gem. per gespeelde match · Gem. per selectie*. Zo zie je in één
  oogopslag het verschil tussen "hoe lang speelde hij als hij speelde" en "hoeveel kwam hij aan
  spelen over de hele dag". De lijst staat gesorteerd met de minste speeltijd per selectie bovenaan.
- Een beheerder kan speelminuten en fair-play nog altijd **apart** tonen of verbergen voor kijkers:
  de kolom "Gem. per selectie" hoort bij fair-play, de rest bij de speelminuten, en de tabel past
  zich aan naargelang wat zichtbaar is.

## v0.17.6
- **Nieuw:** wijzig je de standaardduur van een tornooi, dan vraagt de app of de **al geplande
  wedstrijden** mee moeten. Ze somt op welke wedstrijden nu een andere duur hebben, zodat je ziet wat
  je overschrijft. Lopende en gespeelde wedstrijden blijven altijd ongemoeid — daar zijn de blokken
  al afgewerkt.
- **Opgelost in het tornooiverslag (scherm en PDF):**
  - De tabel **Speeltijd over de dag** heeft duidelijke kolomkoppen die op één regel passen:
    *Gespeelde wedstrijden · Totaal speelminuten · Gem. per gespeelde match*. Voordien brak
    "Gem./match" middenin een woord af, en die kop verzweeg bovendien dat de deler het aantal
    **gespeelde** wedstrijden is. Alle cijferkolommen zijn nu rechts uitgelijnd, koppen inbegrepen.
  - In de **fair-play-tabel** stond onder de kop "In selectie" de tekst "2 van 3 gespeeld" — twee
    gegevens onder één kop, waarvan het gespeelde deel al in de tabel erboven staat. Er staat nu
    enkel *Aantal keer geselecteerd*, met het gemiddelde per selectie ernaast.
  - **Doelpunten en assists** staan elk op een eigen regel in plaats van achter elkaar.
  - De **wedstrijdduur** staat nu ook in de kop van het tornooiverslag, en de puntenzin eronder
    herhaalt het schema niet meer (dat staat één regel hoger al).
- **Opgelost:** bij een wedstrijd van **één blok** ontbrak de **bankregel** onder het velddiagram in
  de PDF, terwijl het scherm ze wel toonde. Dat trof net tornooiwedstrijden, die vrijwel altijd uit
  één blok bestaan.

## v0.17.5
- **Gewijzigd:** op het **velddiagram** staat nu de **voornaam met de eerste letter van de
  familienaam** ("Maxim B.") in plaats van de familienaam. Dat is hoe een ploeg elkaar noemt, en op
  een jeugdploeg herken je zo sneller wie waar staat. Geldt overal waar het veld getekend wordt: in
  de app, in de wizard, in het verslag en in de PDF, inclusief de bankregel eronder en het naampje
  van wie inviel. Hebben twee spelers dezelfde voornaam én dezelfde beginletter (Lars Marysse naast
  Lars Meersman), dan komen er letters bij tot ze verschillen: "Lars Ma." en "Lars Me.".
- In **tabellen en lijsten** verandert er niets: de selectie, de spelerstabel, de doelpunten, de
  tijdlijn en de notities houden overal de volledige naam.
- **Nieuw:** de puntenverdeling van een tornooi kan een **gelijkspel met doelpunten anders belonen
  dan een 0-0**. Er staan nu vier vakjes (winst · gelijk mét doelpunten · gelijk 0-0 · verlies) en
  het verslag toont dan bijvoorbeeld "3/2/1/0". Vul je bij allebei hetzelfde in, dan blijft alles
  zoals het was en staat er gewoon "3/1/0". Bestaande tornooien rekenen ongewijzigd verder: een
  ontbrekende 0-0-waarde volgt vanzelf de gewone gelijkspelwaarde.

## v0.17.4
- **Nieuw:** een tornooi bepaalt nu ook de **standaardduur van zijn wedstrijden** — aantal blokken en
  duur per blok, naast het type wedstrijd dat er al stond. Dat is het principe van een tornooi: alle
  wedstrijden van de dag duren even lang, dus geef je het één keer in. Elke nieuwe wedstrijd neemt
  het over, met onder de velden de vermelding wat de standaard van de dag is — ook onder het
  **format** (8v8 bijvoorbeeld), dat al werd overgenomen zonder dat je zag waar het vandaan kwam;
  wijkt één wedstrijd af
  (een langere finale bijvoorbeeld), dan pas je dat gewoon in die wedstrijd aan. De duur staat ook op
  de tornooipagina en in het tornooiverslag.
- Tornooien van vóór deze versie hebben nog geen standaardduur en vallen terug op **1 blok van 20
  minuten** — exact wat de app tot nu toe bij elke nieuwe tornooiwedstrijd invulde, dus daar verandert
  niets aan. Zodra je zo'n tornooi bewerkt en opslaat, ligt de standaard vast.

## v0.17.3
- **Gewijzigd:** het label **"Ploegverantwoordelijke" heet in de infolijstjes overal "Ploegverantw."**,
  zoals het al stond in het wedstrijdverslag. Het stond nog voluit op de tornooipagina, in het
  tornooiverslag, in de geplande wedstrijd en in het ploegscherm, waar het voluit tegen de naam
  ernaast botst. In de invulvelden blijft het woord voluit staan — daar is plaats genoeg.

## v0.17.2
- **Opgelost:** **trainer en ploegverantwoordelijke van een tornooiwedstrijd komen nu van het tornooi
  zelf.** Ze werden bij het aanmaken van de wedstrijd één keer overgenomen, dus wie ze nadien in het
  tornooi wijzigde, zag dat in geen enkele wedstrijd terug — en via "Info bewerken" kon je ze per
  wedstrijd nog eens anders zetten ook. Op een tornooidag zijn ze voor alle wedstrijden dezelfde: je
  geeft ze één keer in bij het tornooi, en elke wedstrijd, elk verslag en elke PDF volgt. In "Info
  bewerken" staan ze bij een tornooiwedstrijd nu als leesregel, net zoals de locatie. Bestaande
  tornooiwedstrijden zijn meteen mee — er verandert niets aan de bewaarde gegevens.
- **Opgelost:** **"Gebruik als template" verdwijnt bij een tornooiwedstrijd.** Die knop maakte een
  losse wedstrijd zonder tornooi, wat op een tornooidag nooit de bedoeling is. In de plaats staat er
  nu **"Kloon als nieuwe tornooiwedstrijd"**, dezelfde actie als op de tornooipagina, zodat je er niet
  meer voor terug moet.
- **Opgelost:** bij het **bewerken** van een wedstrijd of tornooi heette de tweede knop nog altijd
  "Plannen zonder selectie" of "Opslaan zonder selectie", ook als er al lang een selectie ingevuld was.
  Er staat nu gewoon **"Opslaan"**.
- **Opgelost:** **"Gebruik als template" bij een gewone wedstrijd nam de opstelling niet mee.** De
  kloon viel altijd terug op de eerste formatie en opende met een leeg veld. Nu blijven formatie,
  posities, kapitein en gastlabels behouden, en spelers die deze wedstrijd niet meededen staan meteen
  in de lijst in plaats van enkel als "gast" toevoegbaar te zijn.

## v0.17.1
- **Gewijzigd:** de **QR-code van een uitnodiging wordt nu op het toestel zelf getekend** in plaats van
  opgehaald bij een externe dienst. Die dienst werkte niet zonder internet — net aan de zijlijn waar je
  iemand wil laten aansluiten — en viel tijdens het testen ook effectief een keer weg. Bovendien ging de
  uitnodigingslink, mét de geldige toegangscode, mee naar die server. De code is nu een scherpe tekening
  in plaats van een afbeelding, werkt offline, en als het tekenen toch mislukt blijft de bestaande
  terugval met code en link staan.
- **Nieuw:** de **onderhoudsmodus vraagt bevestiging bij het aanzetten**. Die ene tik sloot de app voor
  alle ploegen en alle kijkers, ook tijdens een lopende wedstrijd, en was de enige zware actie zonder
  drempel — een kijker verwijderen vroeg wel bevestiging, een ploeg verwijderen zelfs het wachtwoord.
  Uitzetten herstelt alles en blijft dus één tik.
- **Gewijzigd:** "Ploeg verwijderen" in het beheerscherm was een klein tekstlinkje, terwijl dezelfde
  actie in het tornooischerm een volwaardige knop is. Nu ook hier een echte rode knop.

## v0.17.0
- **Nieuw:** de **donkere modus kan de instelling van je toestel volgen**. In Instellingen staan nu drie
  keuzes: altijd licht, altijd donker, of "volg toestel", met de huidige stand van het toestel erbij
  vermeld. Altijd licht blijft bewust de standaard: wie de app enkel opent om mee te kijken, mag niet
  plots een ander uiterlijk krijgen omdat zijn telefoon op donker staat. Zet je toestel 's avonds
  vanzelf om, dan schakelt de app meteen mee, zonder herstart.
- **Opgelost:** in het selectiescherm zaten **Basis/Wissel/NB** tegen elkaar aan, waardoor een tik die
  een paar pixels afweek op de buurknop landde. Het zijn nu drie losse knopjes met ruimte ertussen; die
  ruimte komt uit een smaller rugnummervakje, zodat de rij niet breder wordt. Dezelfde knoppen stonden
  ook op een harde witte achtergrond en gaven in donkere modus witte blokken.
- **Opgelost:** de **verwijderknop bij een gebeurtenis was te klein** voor wat hij doet — tijdens een
  lopende wedstrijd haalt hij een speler van het veld of gooit hij een geplande wissel weg. Hij is
  merkbaar groter, net als de bewerkknop ernaast.
- **Gewijzigd:** in Instellingen werd "Ploeg uitnodigen, leden beheren of verwijderen" duidelijker als
  "Kijkers uitnodigen, beheren of verwijderen".

## v0.16.3
- **Opgelost:** de **ploegnaam werd in de kopbalk afgekapt** op courante telefoonbreedtes — op een smal
  scherm zelfs tot "U1...". De clubnaam onder de ploegnaam verschijnt nu pas op bredere schermen (hij
  staat toch voluit onderaan), het clublogo is iets kleiner en de naam krijgt alle ruimte die overblijft.
- **Opgelost:** op het **opstellingsveld in de wizard** werden lange familienamen afgekapt
  ("Franciszek Dabrow…"). Daar staat nu, net als op het live-veld en in het wedstrijdverslag, enkel de
  achternaam, met een initiaal erbij als twee spelers dezelfde achternaam hebben.
- **Opgelost:** na **"Plannen zonder selectie"** verdwenen "+ Speler van andere ploeg" en "+ Losse
  speler" uit het selectiescherm, waardoor je achteraf geen gastspeler meer kon toevoegen. Die knoppen
  blijven nu staan; enkel bij een tornooiwedstrijd zijn ze verborgen, want daar komen gasten via de
  tornooiselectie binnen.

## v0.16.2
- **Opgelost:** speelminuten werden op sommige plaatsen **afgekapt** en op andere **afgerond**.
  Daardoor stond dezelfde speler in het wedstrijdverslag op 9' en in het dagoverzicht van het tornooi
  op 10', las een wissel op exact 4 minuten als "3' · 20%" (20% van 20 min is 4') en stond in de
  statistieken "47' · gem. 48'/match". Alles rondt nu af, dus elk getal klopt met het getal ernaast.
  Geldt voor het verslag, het livescherm, de wissel- en pauzeschermen, beide PDF's, de CSV en de
  statistieken.
- **Opgelost:** in het tornooiverslag stond bij fair-play "1/3 **in selectie**", terwijl dat cijfer
  het aantal **gespeelde** wedstrijden is — wie de hele dag in de selectie zat maar één keer speelde,
  las dat als "ik stond er maar één keer bij". Er staat nu "1/3 gespeeld", net zoals in de PDF en in
  de seizoensstatistieken. Het gemiddelde ernaast blijft bewust per **selectie** gerekend: dat is net
  wat fair-play meet.

## v0.16.1
- **Gewijzigd:** de regel voor rugnummers is nu simpel: **een nummer wordt getoond als die speler er
  een heeft**. Het vinkje bij de ploeg regelt enkel het rooster (de kolom, de invoervakjes, sorteren
  op nummer) en of een *nieuwe* wedstrijd of tornooiselectie nummers overneemt. Een wedstrijd die al
  gespeeld is, draagt haar eigen nummers en blijft die tonen — dat is de waarheid van dát verslag.
  Daarmee is de aanpak van v0.16.0 teruggedraaid.
- **Nieuw:** knop **Rugnummers** op het wedstrijdverslag. Daar pas je de nummers van een afgewerkte
  wedstrijd aan of wis je ze in één tik ("Alle nummers wissen"). Bewust een apart venster: via
  "Spelers bewerken" kan je ook spelers verwijderen en lijnen wijzigen, en dat wil je op een
  gespeelde wedstrijd niet, want de events en statistieken hangen eraan.
- **Gewijzigd:** **élke spelerslijst staat nu alfabetisch op familienaam** — de speelminuten in het
  verslag, de spelerstabel in de PDF, de CSV, de bank bij de voorbereiding, "op het veld" en "bank"
  in het livescherm, en de spelersnotities. "Sorteer op naam" bij een ploeg sorteerde op *voornaam*
  en doet dat nu ook op familienaam. Klassementen (topschutters, meeste minuten, fair-play) en de
  bank in de pauze-opstelling ("minst gespeeld eerst") houden hun eigen orde.
- **Nieuw:** de spelerslijst van een ploeg is sorteerbaar op de drie kolommen die er staan: nummer,
  naam en voorkeurspositie. Op positie volgt hij de vaste volgorde Keeper → Spits, niet de alfabetische:
  zo leest die lijst als een opstelling.
- **Opgelost:** "Posities herplaatsen" stond op elk verslag, maar weigert zodra er een wissel of
  positiewissel gelogd is — bij een echt gespeelde wedstrijd was het dus een knop die enkel een
  foutmelding gaf. Ze heet nu **"Startopstelling herplaatsen"** en verschijnt enkel als het ook kan;
  anders staat er een regel die naar "Positiewissel" verwijst.
- **Opgelost:** in de spelersnotities stonden "#1", "#2" voor de namen, ook bij een ploeg zonder
  rugnummers.

## v0.16.0
Aanpak "geen rugnummers = nergens rugnummers, ook met terugwerkende kracht". **Teruggedraaid in
v0.16.1**: ze botste met de mogelijkheid om per wedstrijd tóch een nummer in te vullen (geleende
truitjes), want dat invoerveld werd dan een dode belofte.

## v0.15.0
- **Nieuw:** **rugnummers zijn optioneel per ploeg** — vinkje "Vaste rugnummers gebruiken" in het
  spelersbeheer. Bij jeugdploegen zijn vaste nummers vaak niet de norm. Staat het uit, dan verdwijnen
  de kolom Rugnr, de invoervakjes, de waarschuwing voor dubbele nummers en "sorteer op nummer", en
  neemt een nieuwe wedstrijd of tornooiselectie geen nummers meer over uit het rooster. Uitzetten
  **wist niets**: zet je het later weer aan, dan staat alles er nog. Per wedstrijd een nummer
  invullen blijft altijd mogelijk.
- **Opgelost:** een leeg rugnummer werd overal als **"?"** getoond. Nu verdwijnt het hele bolletje
  als er geen nummer is (een leeg gevuld rondje leest als een fout), en toont een spelerknop de naam
  groot i.p.v. een nummer.
- **Gewijzigd:** de bol op het velddiagram toont **enkel het positienummer**, ook in de PDF. Voordien
  viel hij bij een ontbrekend positienummer terug op het rugnummer, wat twee soorten cijfers door
  elkaar haalde.
- **Opgelost:** in de PDF's valt de kolom "#" weg als geen enkele speler van die wedstrijd een nummer
  heeft. De CSV houdt bewust zijn kolom "Nummer" met lege cellen: een export met een vaste
  kolomindeling blijft importeerbaar.

## v0.14.2
Laatste ronde uit de doorlichting van de tornooimodule — **daarmee is die volledig afgewerkt**.
- **Opgelost:** een speler die je pas later aan de tornooiselectie toevoegde, stond in de verslagen
  van de wedstrijden van vóór dat moment bij "niet geselecteerd". De app onthoudt nu wanneer iemand
  bij de selectie kwam.
- **Opgelost:** de kapitein ging verloren bij "Kloon als nieuwe wedstrijd".
- **Opgelost:** een tornooi dat (nog) niet gevonden werd, gaf een kale "Niet gevonden"-melding zonder
  weg terug; nu een echte lege staat met een knop naar de lijst.
- **Opgelost:** twee naamgenoten in dezelfde ploeg werden in de dagselectie samengevoegd tot één
  speler.
- **Opgelost:** stond iedereen op niet beschikbaar, dan kwam je in een selectiescherm zonder één
  speler terecht.
- **Opgelost:** een bewust leeggemaakt rugnummer viel bij het herbewerken van een tornooi terug op
  het nummer uit het rooster.
- **Verbeterd:** vierde groep "Niet geselecteerd" ook op de tornooipagina, clean sheets bij de
  cijfers bovenaan, de voetnoot over de scorevolgorde ook op het scherm, geen lege "0/0/0"-regel meer,
  het ploeg-label in de PDF-kop, "Tornooilocatie" in de CSV, en de tornooi-PDF is merkbaar sneller
  (de iconen worden één keer omgezet i.p.v. bij elke wedstrijd).
- **Opgelost:** een gast zag starttegels die voor hem toch niet werken; die zijn nu weg.

## v0.14.1
- **Opgelost:** het tornooiverslag verest zich nu ook wanneer een medebeheerder tijdens de dag iets
  wijzigt — voordien bleef je naar de oude cijfers kijken tot je het scherm verliet.
- **Opgelost:** het deelbericht meldt nu of er nog wedstrijden **niet afgewerkt** zijn. "1W · 1G · 1V"
  las in de ploeggroep anders als het volledige tornooi.
- **Opgelost:** een wedstrijd die je via "Snel resultaat" invoerde (score zonder speeltijd) verlaagde
  het fair-play-gemiddelde van iedereen. Zulke wedstrijden tellen nu niet meer mee in dat gemiddelde,
  maar wél als "in de selectie".
- **Opgelost:** de wedstrijden in de tornooi-PDF zijn doorlopend genummerd over de hele dag, gelijk
  aan wat op het scherm staat.
- **Opgelost:** wie je via "Spelers bewerken" aan een tornooiwedstrijd toevoegt, komt nu ook in de
  **tornooiselectie** van die dag — anders kreeg hij speelminuten zonder in de selectie te staan.
- **Opgelost:** een gastspeler verloor zijn label "gast" bij het klonen of herbewerken van een
  wedstrijd.
- **Opgelost:** bij een tornooiwedstrijd stond nog een thuis/uit-keuze; een tornooi is neutraal
  terrein, dus daar staat nu gewoon de locatie.
- **Opgelost:** koos je bij een tornooiwedstrijd "2 helften" na eerder 20 minuten, dan werd dat stil
  2 × 20 minuten. En het veld voor een vrije duur toont nu het ingevulde getal i.p.v. leeg "Vrij…".
- **Opgelost:** de wizard van een tornooiwedstrijd bracht je bij het teruggaan naar het startscherm
  i.p.v. naar het tornooi, en vroeg niets bij het verlaten van half ingevulde gegevens. Bij het
  bewerken van een tornooi vraagt de app dat nu enkel als er écht iets gewijzigd is.

## v0.14.0
- **Nieuw:** de **voorkeurspositie** van een speler is fijner geworden: Keeper, Verdediger (links,
  centraal, rechts), Middenvelder (verdedigend, centraal, aanvallend), Vleugelspeler (links, rechts)
  en Spits. Voordien was het de linienaam met enkel bij de verdediging een kant. Oude waarden blijven
  leesbaar en worden automatisch omgezet ("Aanval" wordt Spits — wie eigenlijk vleugelspeler is, zet
  je zelf om).
- **Verbeterd:** **Auto-plaats** gebruikt die verfijning. Een uitgesproken keuze (links, rechts,
  verdedigend, aanvallend) krijgt eerst zijn plek en "centraal" vult op — voordien bepaalde de
  volgorde in de spelerslijst waar iemand belandde. Bij een formatie met één spitspositie schuift een
  vleugelspeler naar de breedste vrije middenveldplek i.p.v. de spits te verdringen.
- De vier linies (Doel, Verdediging, Middenveld, Aanval) blijven ongewijzigd: formaties, het
  velddiagram en "posities per linie" in de statistieken werken zoals voordien.

## v0.13.0
- **Nieuw:** **filter op soort wedstrijd** in de statistieken én in het detail van een speler: alle
  wedstrijden (standaard), competitie, vriendschappelijk, beker of andere. De keuze geldt op beide
  schermen, zodat wie naar de bekerwedstrijden kijkt en dan op een speler tikt, daar hetzelfde ziet.
- **Nieuw:** het **seizoen staat nu altijd bovenaan** de statistieken, ook als er maar één seizoen
  is — dezelfde balk als in het spelerdetail. Deze cijfers gelden altijd over één seizoen, en zonder
  die regel leken ze over alles te gaan.
- **Opgelost:** een wedstrijd zonder datum werd door de alfabetische sortering het standaardseizoen,
  waardoor de statistiekenpagina leeg leek. "Onbekend" staat nu achteraan.
- **Opgelost:** het kadertje **Tornooien** in het spelerdetail was onbereikbaar wanneer een tornooi
  vóór de eerste wedstrijd van dat seizoen viel: dat seizoen bestond dan niet in de kiezer.

## v0.12.2
- **Opgelost:** **Wedstrijd heropenen** voegde altijd een deel toe. Sloot je per ongeluk te vroeg af,
  dan kreeg je een fantoomdeel in het verslag. De app vraagt nu waarom je heropent: *verkeerd
  afgesloten* hervat het laatste deel (zonder extra deel, en de tijd tussen het foute afsluiten en nu
  telt niemand als speeltijd), *verlenging* voegt een deel toe, en *nooit gestart* zet de wedstrijd
  terug op gepland.
- **Opgelost:** een wedstrijd die nooit gestart is, kon je stil afsluiten op 0-0; nu vraagt de app
  eerst, met de veilige uitweg vooraan.
- **Verbeterd:** de waarschuwing "ben je vergeten af te sluiten?" hangt nu aan de **lengte van het
  blok** (een kwart ervan, minimaal 3 minuten) i.p.v. aan een vaste 10 minuten. Bij blokken van 20
  minuten kon je zo 9 minuten te laat afsluiten — 45% extra speeltijd voor iedereen op het veld —
  zonder één waarschuwing.

## v0.12.1
- **Gewijzigd:** een tornooi hoort bij de ploeg waarin je het aanmaakt, dus die ploeg staat er nu als
  **vaste regel** i.p.v. als keuzelijst. Bij een bestaand tornooi was wisselen zelfs verkeerd: de al
  aangemaakte wedstrijden bleven bij de oude ploeg staan.
- **Opgelost:** kende de app het rooster van de ploeg even niet (bv. nog niet gesynchroniseerd), dan
  kon het bewaren van een tornooi de hele dagselectie **inclusief de redenen van afwezigheid** wissen,
  ook in de cloud. Nu blijft een bestaande selectie staan en zegt de app wat er scheelt.
- **Opgelost:** een speler die je tijdens de dag als afwezig markeerde, kon via het ongedaan maken van
  een actie of via de wisselknop tóch weer op het veld belanden.
- **Opgelost:** "ook niet beschikbaar voor de rest van het tornooi" deed stil niets bij een gastspeler
  of bij iemand die de ploeg intussen verliet; nu krijg je een eerlijke melding.

## v0.12.0
- **Opgelost (privacy):** wie **niet beschikbaar** was en **waarom** ("ziek", "blessure") stond in het
  deel van de tornooigegevens dat elk ploeglid kan lezen — ook een kijker of een gast, rechtstreeks
  uit de databank en dus buiten de app om. Voor minderjarigen is dat het gevoeligste stukje gegevens
  in de app. Dat deel verhuist nu naar hetzelfde beheerder-only pad als de wedstrijdnotities. Wat een
  kijker mag zien blijft ongewijzigd: wie meegaat is zichtbaar, wie niet gekozen of niet beschikbaar
  was niet. Bestaande tornooien worden automatisch omgezet.

## v0.11.3
- **Nieuw:** onderaan het tornooiverslag en het wedstrijdverslag staat nu voor beheerders een regel
  die zegt **wat een kijker daar níet ziet**, met een knop naar Statistieken om het aan te passen.
  Sinds v0.11.2 bepalen die oogjes ook de verslagen, maar in het verslag zelf was daar niets van te
  merken. Staat alles publiek, dan zegt de regel dat het verslag volledig zichtbaar is. Kijkers zien
  deze regel niet.

## v0.11.2
- **Opgelost:** je keuzes over wat kijkers mogen zien (de oogjes bij de statistieken) golden **niet**
  in het tornooiverslag en het wedstrijdverslag. Een ouder-kijker zag daar dus de speelminuten per
  speler, de rangschikking "wie speelde het minst", de kaarten en de volledige selectie met wie
  afwezig was en waarom — precies wat je in Statistieken had uitgezet. Die verslagen volgen nu
  dezelfde keuzes, op het scherm én in de PDF's (die een kijker kan downloaden). **Wie meegaat of
  meespeelde blijft altijd zichtbaar**; wie niet gekozen werd of niet beschikbaar was, volgt je
  keuze. Zet je een sectie publiek, dan verschijnt ze ook in de verslagen. Notities blijven zoals
  altijd enkel voor beheerders.
- **Opgelost:** een clubbeheerder die geen lid is van een ploeg, kon stil zonder beheerknoppen komen
  te zitten: zijn rechten hingen aan één gegevensoproep die na 4 seconden opgaf, zonder melding, en
  alleen een herstart hielp. De app probeert nu drie keer, onthoudt bij welke club een ploeg hoort
  (zodat je rechten de volgende keer meteen goed staan, ook bij een trage verbinding) en zegt het
  eerlijk als het echt niet lukt.

## v0.11.1
- **Opgelost:** beheer je meerdere ploegen, dan toonde de tornooilijst ook de tornooien van je
  **andere** ploeg. Ze waren daar zelfs bewerkbaar, en bij opslaan belandde die gegevens onder de
  ploeg die op dat moment actief was. De lijst laat nu enkel nog de tornooien van de actieve ploeg
  zien. Tornooien die (nog) bij geen enkele ploeg horen — pas aangemaakt, of van vóór de cloud —
  blijven zichtbaar, zodat er niets onbereikbaar wordt; die worden wel enkel lokaal bewaard en de app
  meldt dat.

## v0.11.0
- **Opgelost:** iemand als **niet aanwezig** markeren terwijl hij al gespeeld had, wiste stil zijn
  speelminuten — terwijl zijn doelpunten uit diezelfde wedstrijd wél bleven staan, er geen enkel
  event gelogd werd, er geen vervanger gevraagd werd (je speelde dus met 7 verder) en hij in het
  verslag nog op zijn positie op het veld stond. "Niet aanwezig" is bedoeld voor wie niet opdaagt,
  en dat blijft ongewijzigd. Maar staat of stond de speler op het veld, dan stelt de app nu eerst
  **"Blessure / verlaat het veld"** voor: die stopt zijn teller op het juiste moment (zijn 15
  gespeelde minuten blijven dus bewaard), logt een event en biedt meteen een vervanger aan. Wie hem
  écht per ongeluk in de selectie had gezet, kan nog altijd kiezen voor "Toch niet aanwezig", nu met
  de vermelding hoeveel minuten daarmee gewist worden.
- **Nieuw:** bij een tornooiwedstrijd kan je iemand in één beweging **ook voor de rest van het
  tornooi** op niet beschikbaar zetten. Voordien was zo'n afmelding enkel voor die ene wedstrijd:
  wie na wedstrijd 2 naar huis ging, stond in wedstrijd 4 automatisch weer in de basis en kreeg
  minuten toegeschreven die hij niet speelde.
- **Verbeterd:** de schermafbeeldingen in de handleiding waren te groot — ze werden zelfs opgeblazen
  tot boven hun eigen formaat, wat ze ook onscherp maakte. Ze staan nu op maximaal 300 px, en waar
  een pagina twee afbeeldingen heeft, komen die op een breed scherm naast elkaar (die pagina's zijn
  daardoor ongeveer 40% korter). Op een telefoon verandert er niets; inzoomen kan gewoon met een
  pinch.

## v0.10.0
Tweede ronde uit de doorlichting van de tornooimodule, plus één nieuwe functie die er tijdens het
nakijken uit voortkwam.
- **Nieuw: gastspelers in de tornooiselectie.** Je kan nu een **speler van een andere ploeg** of een
  **losse speler** toevoegen aan de selectie van een tornooi — dat kon voordien alleen per wedstrijd.
  Zo'n gast staat apart onder "Gastspelers" met zijn herkomst erbij, en verschijnt overal als
  "(gast · U11B)": in de dagselectie, het tornooiverslag, het deelbericht en beide PDF's. Hij blijft
  bewaard als je het tornooi later opnieuw opent, en zijn gastlabel gaat mee bij het toevoegen en
  klonen van wedstrijden. Voordien moest je zo iemand ofwel in je ploegkern zetten (waar hij dan in
  je seizoenscijfers bleef staan), ofwel per wedstrijd toevoegen, waarna hij in de speeltijd stond
  maar in geen enkele selectielijst.
- **Opgelost:** een tornooi bewerken liet spelers vallen die **niet meer in de ploegkern** stonden —
  bijvoorbeeld iemand die de ploeg verliet — terwijl zijn minuten en doelpunten in hetzelfde verslag
  bleven staan. Die spelers blijven nu in de dagselectie.
- **Opgelost:** "Selectie & opstelling" liep **vast** als er minder spelers meegingen dan het veld
  vraagt. Met 7 beschikbare spelers voor 8v8 bleef er "Kies exact 8 basisspelers (nu 7)" staan,
  zonder uitweg. Nu vraagt de app of je met 7 verder wil en blijft er simpelweg een positie leeg.
  Meer spelers opstellen dan het veld toelaat, blijft uiteraard geweigerd.
- **Opgelost:** een wedstrijd die je **vergeet af te sluiten** liet zijn klok gewoon doorlopen, zodat
  elke basisspeler er na twee uur ~140 minuten bij kreeg en de speeltijdtabel van de dag onbruikbaar
  werd. Drie dingen zijn aangepast: start je een volgende wedstrijd terwijl er nog een loopt, dan
  waarschuwt de app met het startuur erbij en kan je die eerst afsluiten; het correctieveld stelt bij
  een duidelijk vergeten klok de **voorziene** blokduur voor in plaats van de verstreken tijd (wie
  gewoon bevestigde, zette voordien die 140 minuten vast); en op het homescherm komt een melding met
  een afsluitknop zodra een wedstrijd een half uur voorbij zijn voorziene einde nog openstaat.

## v0.9.3
Eerste ronde uit de grondige doorlichting van de tornooimodule, vóór de veldtest van 16 augustus.
Dit zijn de drie zwaarste punten:
- **Opgelost:** een tornooi verwijderen maakte al zijn wedstrijden **onvindbaar**. Ze bleven wel
  bewaard, maar verdwenen uit de wedstrijdenlijst, van het homescherm en uit de statistieken —
  terwijl de bevestiging beloofde dat ze zouden blijven. Nu kan een tornooi met wedstrijden niet
  meer zomaar verwijderd worden: verwijder die eerst, of kies uitdrukkelijk **"Wedstrijden meteen
  ook verwijderen"**. Die weg vraagt je wachtwoord, waarschuwt dat het onomkeerbaar is, en bewaart
  eerst een back-up (met de notities en de volledige tornooigegevens) die de app-eigenaar kan
  terugvinden. Lukt die back-up niet, dan wordt er niets verwijderd.
- **Opgelost:** tornooien konden **stil verloren gaan**. Ze werden als één geheel naar de cloud
  geschreven en bij het terugkomen zonder meer over je eigen versie gekopieerd. Wie zonder
  verbinding een selectie of eindstand aanpaste en de app sloot vóór de synchronisatie, zag dat
  werk verdwijnen; en twee mensen die elk een tornooi toevoegden, wisten elkaars tornooi. Nu wordt
  elk tornooi apart bewaard en behoudt de app de recentste versie. *(Twee mensen die op hetzelfde
  moment hetzelfde tornooi bewerken: daar geldt nog steeds dat de laatste het haalt — zelfde
  afspraak als voor de klok tijdens een wedstrijd: laat één persoon registreren.)*
- **Opgelost:** bij een wedstrijd van **één blok** maakte "Wedstrijdinfo bewerken" er stil **3 delen**
  van, ook als je alleen het uur of de tegenstander aanpaste. Na 20 minuten kwam er dan "Einde
  deel 1" in plaats van "Einde match", verscheen de pauzewissel en bleef de wedstrijd op "live"
  staan (en dus buiten het tornooiverslag). De keuze **"1 blok"** staat nu ook in dat scherm.
- **Nieuw:** je kan een gewone wedstrijd nu ook in **één blok** laten spelen; dat kon voordien
  alleen bij een tornooiwedstrijd.

## v0.9.2
Naar boven gekomen bij het nalezen van de eerste echte PDF's:
- **Opgelost:** bij een wedstrijd van één blok stond er **"1 delen × 20 min"** in de PDF. Nu "1 deel".
- **Opgelost:** in de wedstrijd-PDF stond de **locatie twee keer** (in de datumregel én als "Locatie:"
  in de inforegel). Bij een tornooiwedstrijd zijn die immers gelijk; ze staat er nu één keer.
- **Verbeterd:** het tornooiblok in de wedstrijd-PDF herhaalde datum, locatie, format, trainer en
  ploegverantwoordelijke die al bovenaan stonden. Er blijft nu over wat het écht toevoegt:
  "Wedstrijd 3 van 4", de eindstand, de puntenverdeling en de dagselectie. Wijkt de datum of locatie
  van het tornooi af van die van de wedstrijd (bv. een verplaatste wedstrijd), dan komt ze er wel bij.
- **Opgelost:** in de tabel Uitslagen van de tornooi-PDF had de W/G/V-kolom geen kop, en met een kop
  wikkelde die over twee regels. De kolom is nu breed genoeg en heet **W/G/V**; de uitleg eronder is
  ingekort tot "Bij een tornooi staat de eigen ploeg altijd eerst."

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
