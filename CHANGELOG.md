# Changelog — MatchDelegate

Leesbaar overzicht van de wijzigingen per versie, nieuwste bovenaan. Bedoeld als
naslag naast de technische commit-messages. Versies vóór 0.5.19 staan in de
git-geschiedenis en in de `analyse-*`-bestanden in de repo.

De meeste wijzigingen sinds 0.5.19 komen uit een grondige audit van het nieuwe
clubmodel (rollen: eigenaar → clubbeheerder → ploegbeheerder → kijker → gast).

---

## v1.18.0

**De prullenmand is geen eenrichtingsstraat meer: wat erin zit, kan je nu ook definitief wissen.**
Tot nu kon je een verwijderde wedstrijd, een tornooi of een ploeg enkel terugzetten. Wat er ooit in
belandde, bleef er dus voor altijd staan — ook wat je bewust en definitief kwijt wou.

Naast elke regel staat nu een rode knop **'Definitief wissen'**, met een bevestiging die zegt dat het
onomkeerbaar is. Daarna is de bewaarde kopie echt weg: er wordt bewust geen tweede back-up gemaakt,
anders zou "definitief" niet definitief zijn.

Wie wat mag, blijft gelijk aan wie mag terugzetten: een ploegbeheerder voor de wedstrijden en
tornooien van zijn eigen ploeg, en enkel de eigenaar voor de verwijderde ploegen. De Firebase-regels
zijn hiervoor niet gewijzigd — wissen is technisch dezelfde bewerking die "Terugzetten" als eerste
stap al deed.

## v1.17.4

**Het potloodje voor een snelle notitie verdween achter de tabbalk, en twee handleidingbeelden liepen
niet zuiver af.** Twee kleine dingen, allebei gevonden door de schermbeelden pixel voor pixel na te
kijken.

De twee zwevende knoppen tijdens een wedstrijd — *snelle notitie* en *moment markeren* — stonden
onder de tabbalk onderaan (`z-index` 49 tegenover 50). Zolang die balk aan de onderkant plakt raken ze
elkaar niet, maar helemaal naar beneden gescrold zakt de balk terug naar zijn eigen plek en schuift
het potloodje erachter. Nu staan de knoppen erboven.

In de handleiding is het beeld van de **seizoenscijfers** opnieuw genomen: de bovenrand liep dwars
door de eerste rij tegels, zodat je van *Gespeeld / Winst / Gelijk* enkel de labels zag en de cijfers
half. Het beeld van het **pauzescherm** is meegenomen, zodat het potloodje er nu volledig op staat.

## v1.17.3

**De zusterploegen bleven leeg voor een gewone ploegbeheerder.** Wie geen eigenaar of clubbeheerder
is — dus zowat iedereen — kreeg geen enkele andere ploeg te zien: de knop verscheen niet, en bij het
inlezen van een voorbereiding werd er nergens anders gezocht. Oorzaak was v1.17.2 van een uur eerder:
die vroeg van elke ploeg op of ze gearchiveerd was, en dat veld mag een beheerder van een zusterploeg
niet lezen. Eén geweigerde lezing en de hele lijst viel weg. De app gaat nu verder met wat ze wél mag
lezen in plaats van de ploeg te laten vallen.

> Er horen twee kleine leesregels bij, voor de **naam** en het **archiefvinkje** van een ploeg uit je
> eigen club. Publiceer ze in de Firebase-console. Zonder die regels werkt alles gewoon, met twee
> schoonheidsfoutjes: een gearchiveerde ploeg kan nog in de keuzelijst staan, en een ploeg die
> hernoemd is draagt daar nog haar oude naam.

## v1.17.2

**Gearchiveerde ploegen stonden tussen de zusterploegen.** Bij "+ Speler van andere ploeg" en bij
"Speler bijzetten" kon je een speler kiezen uit een ploeg die je club gearchiveerd had. Overal elders
in de app is zo'n ploeg verborgen; nu ook hier. Een ploeg zonder spelers verdwijnt meteen uit de
keuzelijst in plaats van er leeg in te blijven staan.

Onderhuids ook de manier waarop de app de juiste kern bij een ploeg zoekt: die vergeleek het id van
de ploeg met dat van haar spelerskern, en die twee zijn nooit gelijk (ze schelen één teken, ze worden
milliseconden na elkaar aangemaakt). Het werkte tot nu toe door een tweede poging die op "heeft
spelers" zocht — toeval dus. Nu wordt de kern op naam herkend, en de ploegnaam komt van de ploeg zelf
in plaats van uit de kern, zodat een hernoeming meteen doorwerkt.

## v1.17.1

**De handleiding en de opstartmelding leggen nu ook uit wat er met een speler van een andere ploeg
gebeurt.** De functie zelf kwam er in v1.17.0, maar nergens stond het beschreven — en het is net iets
waarvan je moet wéten dat het gebeurt.

Op de handleidingpagina *"Voorbereiding van de trainer"* staat er een eigen stuk over: dat de app een
naam die niet in je eigen kern staat ook opzoekt bij de andere ploegen van je club, dat zo iemand als
**gastspeler** bijgezet wordt mét de koppeling naar zijn eigen kern, en dat zijn speelminuten daardoor
ook in **zijn** cijfers meetellen. Met de grens er duidelijk bij: dit werkt binnen je eigen club en
enkel bij ploegen waar jij beheerder van bent. Speelt er iemand mee van een andere club, dan kies je
*"+ als losse speler toevoegen"* — die komt wel op het blad, maar zonder koppeling.

Het venster dat bij het opstarten verschijnt, kreeg er een punt over bij.

## v1.17.0

**Een speler van een andere ploeg van je club bijzetten.** Tot nu had je de knop "+ Speler van andere
ploeg" enkel als je zelf meer dan één ploeg beheerde. Wie maar één ploeg heeft — de meeste
afgevaardigden en trainers — kon alleen een naam intikken bij "Losse speler", en die speler bleef
voor de app een onbekende. Nu staan de **andere ploegen van je eigen club** gewoon in dat lijstje:
je kiest de speler zoals hij bij hen bekendstaat, en zijn optreden telt daardoor ook mee in zijn
eigen cijfers ("ook gastspeler bij"). Over de clubgrens heen verandert er niets.

> Dit steunt op een verruiming van de leesrechten: een ploegbeheerder mag de **kern** (namen,
> rugnummers, posities) van de zusterploegen van zijn club inkijken. Wedstrijden, notities en
> ledenlijsten blijven dicht. De aangepaste regels moeten in de Firebase-console gepubliceerd worden;
> zolang dat niet gebeurd is, gedraagt de app zich exact zoals voordien.

**Ook tijdens de wedstrijd.** "Speler bijzetten" in het livescherm had enkel je eigen rooster en
"Losse speler". Daar staat nu ook **"Speler van een andere ploeg"**, met dezelfde ploegen van je
club. Handig voor precies het geval waarvoor die knop bestaat: iemand die van het andere veld komt
bijspringen. Hij komt op de bank, met het merkje "gast".

**PSD-import: een naam die niet in je kern staat.** Twee dingen opgelost:

- Bij elke naam van het blad kan je nu **"+ als losse speler toevoegen"** kiezen. Hij komt met de
  naam van het blad in deze ene wedstrijd terecht, met het merkje "gast", en verschijnt gewoon in de
  opstelling, het verslag en de PDF. Voordien kon je zo'n naam enkel laten vallen, en bleef zijn
  plaats op het veld leeg.
- De app **zoekt de naam ook in de andere ploegen van je club** en koppelt hem daar als hij er
  eenduidig in staat — dan komt hij als gastspeler binnen in plaats van als losse speler.

**PSD-import liep vast wanneer er één speler ontbrak.** Kon één veldspeler niet gekoppeld worden, dan
weigerde het overnemen met "Zet 8 spelers op het veld — er staan er nu 7": een melding waar je in dat
scherm niets mee kon, want er staat geen veld. De import stopte en er werd niets bewaard. Nu vraagt
de app vooraf of het zo mag, noemt ze wie er niet gekoppeld is, en wijst ze naar de losse speler. Ga
je toch door, dan komt de opstelling binnen met die ene plaats open — die vul je daarna zelf aan.

## v1.16.1

**Een nieuwe functie wordt nu vaker aangekondigd, met een vinkje om ervan af te zijn.** Het venster
"wat is er nieuw" verscheen één keer bij het opstarten en daarna nooit meer. Wie het wegklikte omdat
hij net met iets anders bezig was, kreeg het nooit terug — en heeft dus nooit geweten dat de functie
bestond.

Nu komt zo'n melding bij elke start terug, met twee remmen erop. Onderaan staat een vinkje
**"Niet meer tonen"** waarmee je er meteen van af bent, en zonder dat vinkje stopt ze na drie keer
vanzelf; bij die derde keer staat eronder dat het de laatste is. Zo blijft een aankondiging opvallen
zonder iemand te blijven onderbreken die er niet in geïnteresseerd is.

Er staat ook een knop **"Meer uitleg in de handleiding"** bij, die rechtstreeks naar het juiste
hoofdstuk springt in plaats van naar de eerste pagina.

Het vinkje wordt bewaard op het moment dat je het aanzet, niet pas bij het sluiten — het venster gaat
ook dicht als je ernaast tikt, en anders zou je keuze verloren gaan. Wie de app voor het eerst
installeert krijgt zo'n melding nog steeds niet, en wie alleen meekijkt evenmin — wordt die later
ploegbeheerder, dan krijgt hij ze alsnog.

Op dit moment is de aankondiging die terugkomt die van de **voorbereiding van de trainer** (v1.15).

---

## v1.16.0

**De tijdstippen in het verslag lopen door over de hele wedstrijd.** Op vraag van de trainers: een
doelpunt in het derde blok stond er als "1'" omdat de klok bij elk blok opnieuw begon te tellen. Nu
staat er "31'", zoals je het op televisie en op elk wedstrijdblad ziet. Loopt een blok uit, dan telt
die extra tijd apart mee: de zestiende minuut van het eerste blok is "15'+1'".

Dat geldt voor het verloop op het scherm, voor de wissels en positiewisselingen in de kaders per
blok, en voor de tijdlijn in de PDF. De samenvatting bovenaan het verslag, de deel-tekst voor
WhatsApp en de export naar Excel rekenden al zo — die drie en het verslag spreken elkaar nu niet
langer tegen.

Wil je een tijdstip rechtzetten, dan tik je nog altijd de minuut **binnen dat blok** in; het venster
zegt dat er nu uitdrukkelijk bij.

**En er wordt nergens nog een minuut verzonnen.** Geef je een uitslag in met "Snel resultaat", dan
hebben die doelpunten geen moment — ze zijn nooit op een klok gelogd. In het verloop stond daar al
een streepje, maar in de samenvatting bovenaan het verslag en in de tekst voor WhatsApp stonden ze
allemaal op "1'", alsof er vier doelpunten in de eerste minuut vielen. De samenvatting toont nu ook
een streepje; in de WhatsApp-tekst valt de minuut gewoon weg, want "⚽ – Jonas" leest als een
tikfout.

---

## v1.15.3

**Het inlezen werkt nu ook met een blad dat op één pagina bewaard is, en met 5v5.** Een trainer stuurde
een wedstrijdvoorbereiding door die er anders uitzag: 5 tegen 5, en alles op één lange bladzijde in
plaats van vier bladzijden — hij kon dat niet anders bewaren. De app zei daarop dat er geen
spelerslijst op het blad stond, terwijl die er wel degelijk was.

Dat lag niet aan één ding. Zo'n bestand van een **Mac** zit fundamenteel anders in elkaar dan een
afdruk uit Chrome: de tekst staat er op een andere manier in en verwijst naar de lettertypes op een
andere plaats, waardoor er letterlijk geen letter uit te halen viel. Daarbovenop staan de momenten
daar in een **raster** van drie naast elkaar en twee onder elkaar, terwijl de app één rij verwachtte;
en de shirtjes op het veld plakten de titels van drie blokken aan elkaar tot één onleesbare regel.
Alle vier die punten zijn opgelost.

Meteen ook de eerste **5v5**-voorbereiding die door de molen ging: de opstelling wordt herkend als
*Ruit (1-2-1)* en alle vijf de momenten komen op het juiste blok terecht. Valt een moment buiten de
wedstrijd — het blad ging tot 60', bij vier blokken van een kwartier houdt het op 60 op — dan wordt
dat overgeslagen en staat erbij hoeveel.

Accenten in namen worden nu ook uit zulke bestanden juist gelezen, wat nodig is om ze aan je kern te
kunnen koppelen. De twee bladen die al werkten, geven exact hetzelfde resultaat als voordien.

## v1.15.2

**Bij de uitleg staat nu dat je de PDF op een computer maakt.** De stappen naar de
wedstrijdvoorbereiding leidden je door ProSoccerData zonder te zeggen op wélk toestel. Wie het op zijn
gsm probeerde, liep vast bij de laatste stap: in de PSD-app op een telefoon of tablet is er geen
printvenster, dus raak je daar niet aan een PDF. Stap 1 zegt nu "ga op een computer naar
ProSoccerData" — op het inleesscherm zelf én op de handleidingpagina — en op beide plaatsen staat het
er onder de stappen nog eens apart bij, met de reden. Met de vermelding dat het inlezen zelf daarna
gewoon kan op het toestel waar je de PDF bij de hand hebt. Het punt in het "wat is er nieuw"-venster
van 1.15 zegt hetzelfde.

## v1.15.1

**De handleiding legt de PSD-import uit.** Er staat een nieuwe pagina *"Voorbereiding van de trainer"*
tussen *Selectie & opstelling* en *Live wedstrijd bijhouden*: waar de knop staat en waarom hij
verdwijnt zodra er een selectie is, hoe je in ProSoccerData aan die PDF komt, wat je op het
voorstelscherm te zien krijgt en wat er na het overnemen klaarstaat.

Twee dingen staan er uitdrukkelijk bij, omdat ze anders voor verrassingen zorgen: het blad zegt
**niet** wie er niet beschikbaar is (dat vul je nadien aan, anders klopt het aanwezigheidspercentage
niet), en de wedstrijdgegevens zelf — uur, terrein, soort, truikleur — blijven staan zoals ze in
de app stonden. Bovenaan de pagina staat, net als in de app zelf, dat dit voorlopig een demo-functie
is.

De pagina heeft nog geen schermafbeeldingen; de PDF-download van de handleiding werkt gewoon mee.

## v1.15.0

**De voorbereiding van de trainer inlezen uit een PDF.** Werkt je trainer in ProSoccerData, dan
drukt hij zijn wedstrijdvoorbereiding af als PDF: op dat blad staan de selectie, de startopstelling
en de opstelling bij elk volgend moment. Die kan je nu rechtstreeks inlezen in plaats van alles over
te tikken. Bij een geplande wedstrijd waar nog geen selectie is, staat er een knop
**"Voorbereiding van de trainer (PDF)"**.

Je krijgt eerst een voorstel te zien: welke wedstrijd op het blad staat, wie de trainer selecteerde
en wie dat in jouw kern is, en de opstelling per moment met de positienummers erbij. Namen die niet
letterlijk gelijk zijn worden herkend ("Reyes Henao Julio Cesar" is "Julio Reyes", en een
schrijfwijze die Ã©Ã©n letter afwijkt ook); wat de app niet zeker weet, wijs je zelf aan in een
keuzelijst. Pas als je op **Overnemen** tikt wordt er iets bewaard.

Wat er dan klaarstaat is een gewone selectie met een gewone opstelling en een gewoon wedstrijdplan:
alles blijft daarna te bewerken zoals altijd. De momenten van het blad landen op het juiste blok â€”
15' is de start van kwart 2, 7' het wisselmoment halverwege kwart 1 â€” en de wissels en
positiewissels leidt de app zelf af uit de opstelling die de trainer tekende, precies zoals wanneer
je in de planningskaart een eindveld tekent.

De opstelling wordt herkend aan haar vorm (hoeveel spelers per rij, van achter naar voor), dus de
formatie wordt mee ingevuld. Herkent de app de vorm niet, dan zet ze de spelers zo goed mogelijk op
het veld en zegt ze dat erbij.

Er is geen PDF-bibliotheek voor nodig: net als bij de kalenderimport leest de app het bestand zelf,
op het toestel. Er gaat niets naar een server, en de app wordt er niet zwaarder van.

Op het scherm staat stap voor stap hoe je aan die PDF komt (in PSD: een geplande wedstrijd openen,
rechtsbovenaan "Bekijk wedstrijdvoorbereiding", dan het printicoon en bewaren als PDF). Er staat ook
duidelijk bij dat dit voorlopig een **demo-functie** is en vatbaar voor fouten — zowel op de
uitlegpagina als op het voorstelscherm waar je beslist om over te nemen. Wie de app al gebruikt,
krijgt bij de eerstvolgende opstart eenmalig een venster over deze nieuwe functie.

## v1.14.4

**Bij "Uitslag ingeven" staat de thuisploeg nu links.** De twee invulvakjes hadden altijd de eigen
ploeg links staan, terwijl de hele app de score in thuisploeg-eerst volgorde schrijft. Bij een
uitwedstrijd tikte je dus een 3 in het linkervakje, en zei de knop eronder `1-3` — die volgde de
juiste volgorde al wél. Nu wisselen de vakjes mee: thuis staat je eigen ploeg links, uit staat de
tegenstander links. Bij een tornooiwedstrijd blijft je eigen ploeg vooraan, want daar is geen
thuisploeg.

Aan de opgeslagen uitslag verandert niets: de vakjes horen bij de ploeg en niet bij de plaats, dus
wat je in het vakje met jouw ploegnaam tikt, blijft jouw score.

## v1.14.3

**"Accounts zonder ploeg" bij Alle gebruikers.** Dat scherm bouwde zijn lijst per ploeg op, dus wie
zich aanmeldde maar bij geen enkele ploeg zit, kwam nergens voor — net de persoon die je zoekt als
iemand belt met "ik zie niets in de app". Onderaan staat nu een groep met die accounts: naam,
e-mailadres, en een merkje wanneer iemand clubbeheerder is, ploegen mag aanmaken of een openstaande
aanvraag heeft. Staat een e-mailadres nog niet bevestigd, dan staat dat erbij — op zo'n adres kan je
iemand niet als beheerder aanstellen.

Er was hiervoor geen wijziging aan de beveiligingsregels nodig: de app houdt al een e-mailindex bij
die bij elke aanmelding geschreven wordt en die de eigenaar volledig mag lezen.

**De ploegen staan nu dicht.** Elke ploeg stond open, en met een club vol ploegen werd dat één lange
lijst. Nu zie je eerst de ploegen met hun aantal leden, met bovenaan één knop om alles open of dicht
te klappen. Het zoekveld werkt voortaan ook op de ploegnaam en klapt open wat overeenkomt.

---
## v1.14.2

**De uitslag kleurt nu naar het resultaat.** Op de wedstrijdkaart stond de score altijd in dezelfde
kleur, en in het verslag stond óns cijfer altijd groen — ook na een 1-3, wat las als winst. Nu is
een gewonnen wedstrijd groen, een verloren wedstrijd rood en blijft een gelijkspel staan zoals hij
stond. In het verslag kleuren allebei de cijfers mee, zodat `1 – 3` in het rood meteen leest als een
verlies.

Een gewonnen strafschoppenreeks kleurt groen, ook al staat de score gelijk — dezelfde regel die de
statistiek en de tornooipunten al volgden. Een wedstrijd zonder bijgehouden uitslag krijgt geen
kleur.

Enkel bij afgesloten wedstrijden. Tijdens een live wedstrijd blijft de score staan zoals hij was:
daar is nog geen uitslag om te kleuren, en de score zou bij elk doelpunt van kleur wisselen.

## v1.14.1

**Geïmporteerde clubnamen en plaatsen staan niet meer in kapitalen.** De bondskalenders leveren de
tegenstander als `R. KNOKKE FC` of `KSK DE JEUGD LOVENDEGEM` en de plaats als `SPORTPARK DE LEIE,
KORTRIJKSESTRAAT 12`, en zo kwamen die in de lijst, in het verslag en in de PDF terecht. Bij het
importeren worden ze nu omgezet naar `R. Knokke FC`, `KSK De Jeugd Lovendegem` en `Sportpark De
Leie, Kortrijksestraat 12`. Afkortingen blijven kapitaal (FC, KSV, KAA, OHL), streepjes en punten
beginnen opnieuw (`Sint-Eloois-Winkel`, `K.V.C.`, `A. Rodenbachstraat`), en tekst waar al een kleine
letter in staat blijft onaangeroerd — die heeft iemand bewust zo getypt. Werkt zowel voor een
ICS-kalender als voor een xlsx- of csv-tabel. Bestaande wedstrijden die je opnieuw importeert en
laat bijwerken, krijgen de nette schrijfwijze mee.

## v1.14.0

**"Geselecteerd" telt nu per speeldag in plaats van per wedstrijd.** Speel je met twee ploegen
tegelijk, dan is dat één kans om geselecteerd te worden — je kan maar in één van beide staan. Toch
woog zo'n dag verschillend: wie bij de ene meespeelde kwam op 1/1 (de andere werd hem niet
aangerekend, want hij was die dag elders opgesteld), maar wie bij géén van de twee gekozen werd,
kreeg 0/2. Nu telt de speeldag voor iedereen één keer.

**Uitgestelde wedstrijden horen bij dezelfde speeldag.** Twee wedstrijden vormen samen één speeldag
als hun datums binnen één dag van elkaar liggen (dezelfde dag, of zaterdag en zondag) óf als er bij
allebei hetzelfde in het veld **Speeldag** staat. Zo blijft speeldag 12 één speeldag, ook wanneer de
tweede wedstrijd naar woensdag verschoven wordt. Dat geldt enkel binnen dezelfde ploeg, hetzelfde
seizoen en dezelfde soort, en enkel wanneer het veld bij allebei ingevuld is — je moet dus niets
verplicht invullen, het werkt alleen scherper wanneer je het wél doet.

Het getal naast het percentage leest daardoor als "in 8 van de 10 **speeldagen**". Op de
statistiekenpagina en in het spelerdetail staat nu hetzelfde cijfer; de uitleg in de handleiding is
mee aangepast.

---
## v1.13.2

**De opstelling staat nu in een kader, de wissels eronder erbuiten.** De twee chips, het veld en de
bank horen bij één moment in het blok en wisselen samen mee; "Geplande wissels tijdens kwart 1" geldt
voor het hele kwart en blijft daarom staan. Zonder scheiding las dat als één geheel, alsof de
wissellijst bij de getoonde opstelling hoorde. Nu staat het moment in een licht omrand vak en de
wissels eronder. Ook op het livescherm en tijdens het bewerken, zodat het kader niet verschijnt en
verdwijnt als je van chip wisselt.

**"Geplande wissels tijdens dit kwart" heet nu "tijdens kwart 1".** Dat "dit" verwees naar het kwart
waar de kaart op stond, en net dat is wat de chips laten schuiven. Met het nummer erin staat het
er los van.

**Staat er niets klaar, dan vraagt het scherm het gewoon.** "Er staat niets klaar tijdens kwart 1: de
ploeg blijft staan zoals bij de aftrap" met een knop "Wissels klaarzetten tijdens kwart 1" werd:
*De ploeg blijft staan zoals bij de aftrap. Wil je tijdens kwart 1 wisselen?* met daaronder de korte
knop **Wissels klaarzetten**. En de wissellijst blijft ook in dat geval onder het kader staan, in
plaats van te verdwijnen zodra je naar de tweede chip gaat.

---
## v1.13.1

**"Alles doorvoeren" staat er nu altijd.** De knop verscheen enkel wanneer er meer dan één ding
klaarstond — bij één wissel volstond volgens de opbouw de knop *Nu* ernaast. Aan de zijlijn werkt dat
niet: je zoekt de knop waar je hem de vorige keer vond. Nu staat hij er altijd, en uitgegrijsd
wanneer er niets klaarstaat, zodat de plek herkenbaar blijft en je meteen ziet dát er niets is.

De knop bij elke wissel apart verandert niet.

---
## v1.13.0

**De positiewissels staan nu ook onder het velddiagram**, in het verslag én in de PDF. Ze stonden
enkel in de tijdlijn bij alle gebeurtenissen, terwijl het ook wissels zijn: wie het verslag per kwart
leest, kijkt naar het kader onder het veld en niet naar een lijst twee bladzijden verder.

Ze delen dat kader met de gewone wissels, op tijd gesorteerd — een positiewissel op 7' hoort boven
een wissel op 12'. Per moment één regel met het **eindpunt** van elke speler ("Emiel naar 7 RM ·
Gust naar 11 LM"), niet de losse ruilen: die tonen een tussenstand die nooit op het veld gestaan
heeft. Verhuizingen naar een lege plek krijgen hun eigen regeltje. De kop volgt de inhoud: *Wissels*,
*Positiewissels*, of *Wissels en positiewissels*.

Vier velddiagrammen blijven vier: de startopstelling per kwart, met eronder wat er tijdens dat kwart
verandert.

**Ook rechtgezet, vóór het kon gebeuren:** bij deze versie zou iedereen die de melding van 1.12 al
gezien had, de melding van 1.0 opnieuw hebben gekregen — een versie zonder eigen tekst viel terug op
de major. Wie een tekst van dezelfde reeks al zag, krijgt nu niets; wie er nog nooit een zag, krijgt
de recentste.

---
## v1.12.9

**Bij Posities staat nu hoe er geteld wordt.** Eén wedstrijd en toch "GK×4" leest als een fout, tot
je weet dat er per kwart geteld wordt. Dat staat er nu bij: geteld per kwart of helft, niet per
wedstrijd.

**En wie tijdens een blok invalt, telt voortaan mee.** Tot nu keek de telling enkel naar de
opstelling bij de start van elk blok. Wie er tijdens een kwart inkwam, bleef voor dat kwart
onzichtbaar — net de speler die het minst speelt. Nu telt elke plek waar iemand in dat blok gestaan
heeft, één keer per plek: schuif je halverwege van RM naar CA, dan telt dat blok voor allebei.

---
## v1.12.8
- **Je ziet nu waar de naam uit twee delen bestaat.** Er stond MATCHDELEGATE in
  volle hoofdletters; nu zijn de **M** en de **D** vol en staat de rest in klein kapitaal. De
  bedoeling stond er eigenlijk al — er was zowel "alles in hoofdletters" als
  "klein kapitaal" opgegeven — maar die twee heffen elkaar op: het eerste maakt van élke
  letter een echte hoofdletter, en klein kapitaal werkt alleen op kleine letters. De hoofdletterregel is nu weg.
- Op drie plaatsen doorgevoerd: het **opstartscherm**, het **aanmeldscherm** en de kop van het
  **ploegkeuzescherm**. De website kopieert het opstartscherm van de app en is meegetrokken.

## v1.12.7
- **De naam wordt overal aan elkaar geschreven: MatchDelegate.** Op de website stond het al zo, in de
  app op dertig plaatsen met een spatie — het opstartscherm, de paginatitel, de naam onder het
  pictogram op je beginscherm, het aanmeldscherm, het deelbericht bij een uitnodiging, de handleiding
  en de voettekst van elke PDF. Nu is dat overal gelijk.
- Het pictogram op je beginscherm draagt de nieuwe naam pas nadat je de app opnieuw installeert; wie
  ze al staan heeft, ziet de oude naam. Dat is hoe een telefoon met zo'n snelkoppeling omgaat.
## v1.12.6
- **De naam onderaan verwijst nu naar de website.** *Match Delegate · App created by Tim Buyse* stond
  er als gewone tekst; de naam is nu een link naar `matchdelegate.be`, die in een nieuw tabblad
  opengaat — wie er per ongeluk op tikt, mag zijn lopende wedstrijd niet kwijtspelen. Reden: de
  website is nieuw en er wees nog geen enkele verwijzing naartoe, wat het voor een zoekmachine
  onmogelijk maakt haar te vinden.

## v1.12.5

**Het "wat is er nieuw"-venster is enkel nog voor wie ergens beheert.** Een ouder die alleen
meekijkt, kreeg een lijst met dingen die hij niet kan doen — precies de melding die je wegklikt
zonder te lezen. Beheer je érgens een ploeg of een club, dan zie je ze wel, ook als je bij díe ploeg
enkel meekijkt.

Een kijker krijgt daarbij geen "gezien"-stempel: wordt hij later trainer, dan komt de melding alsnog.

---
## v1.12.4

**De handleiding heeft een hoofdstuk 'Gegevens en privacy'.** Het gaat om gegevens van kinderen, dus
dat hoort in de handleiding te staan en niet enkel in een juridische tekst die niemand opent. Wat de
app bewaart en wat niet (geen geboortedatum, adres, telefoonnummer of foto's), waar het staat, en wie
wat ziet.

Inclusief het eerlijke punt: een kijker krijgt de wedstrijden van je ploeg wél volledig op zijn
toestel binnen — zijn scherm toont niet alles, maar de gegevens zijn er. Dat blijft zo, en daarom
staat het er nu bij.

---
## v1.12.3

**Een wedstrijd die al dagen "loopt" zegt dat nu zelf.** Tim wilde een geplande wedstrijd starten en
kon niet: volgens de app liep ze al lang. Dat klopte ook — ze was ooit per ongeluk gestart en de klok
telde sindsdien door. Je zag een lopende tijd met een gigantisch "+ extra tijd", geen startknop, en
nergens een aanwijzing wat je dan wél moest doen.

Nu verschijnt bovenaan het livescherm een rood kader met hoelang de klok al loopt en sinds wanneer,
plus de twee uitwegen: *Opnieuw beginnen* (de wedstrijd staat weer klaar om te starten, en dat is
omkeerbaar) of het blok alsnog beëindigen als het echt gespeeld is.

De grens ligt ruim — drie keer de blokduur, en minstens een uur daarboven — zodat een verlenging of
een vergeten fluitsignaal er niet onder valt. Bij een blok van 15 minuten slaat het pas aan na 75.

---
## v1.12.2

**De seizoensexport van je ploeg gaf een leeg bestand.** Bij Statistieken → exporteren stond er
nul wedstrijden terwijl er tientallen zijn.

De filter vergeleek het id van de wedstrijd met dat van de actieve ploeg — maar dat zijn twee
verschillende dingen: een wedstrijd draagt het id van de spelerskern, niet dat van de ploeg. Die
twee worden vlak na elkaar aangemaakt en lijken op elkaar, maar ze komen nooit overeen, dus vond de
filter altijd niets. De statistiekenpagina gebruikt hiervoor al jaren de ploegNAAM, en dat is meteen
het veld dat op elke wedstrijd staat. De export doet nu hetzelfde.

Nagemeten op een echte ploeg met 107 wedstrijden op het toestel: 36 van de eigen ploeg gevonden,
de andere 71 van andere ploegen blijven er netjes buiten.

---
## v1.12.1

**Na het affluiten kom je meteen op het verslag.** Je bleef op het livescherm staan met een
afgesloten wedstrijd erin: uitgegrijsd, zonder de dingen die je op dat moment wil. Pas wie wegging
en terugkwam, zag het verslag. Daar staat nu ook **Wedstrijd heropenen** bovenaan, naast
*Strafschoppenreeks toevoegen* — allebei dingen die je in de minuut na het affluiten doet. De knop
onderaan blijft ook staan.

**In de pauze keek de app naar een verouderd beeld.** Had het komende kwart geen eigen opstelling,
dan viel de voorspelling terug op het laatste kwart dat je zelf invulde, en negeerde ze dus wat er
intussen echt gebeurd was. Dat raakte alleen wat het scherm voorspelde en de controle "kan deze
klaargezette wissel nog?" — nooit waar de spelers werkelijk terechtkwamen.

Gevonden met een nieuw harnas dat volledige wedstrijden speelt: plan tekenen, spelen, doorvoeren
tijdens het spel en in de pauze, en daarbovenop het onverwachte — een startopstelling die afwijkt
van het plan, spelers afwezig gemeld, een geblesseerde die het veld verlaat terwijl hij in een
geplande wissel zit, rode kaarten, losse wissels en positiewissels. Ruim 3.000 uitgespeelde
wedstrijden zonder fout, waarvan 500 met echte wedstrijden en hun eigen plan.

---
## v1.12.0

**Iedereen krijgt één keer te zien wat er veranderd is aan het plannen van wissels.** De tekst is
door Tim geschreven en goedgekeurd; het venster verschijnt eenmalig bij wie de app al gebruikte.

Het "wat is er nieuw"-venster ging tot nu enkel af bij een major-sprong (1 → 2). Een verandering van
dit formaat had dan pas bij versie 2 verteld kunnen worden, dus de sleutel is nu MAJOR.MINOR. Er
gebeurt nog steeds alleen iets voor een versie die in de tabel staat — dus enkel wanneer er een
goedgekeurde tekst voor bestaat. Wie de app voor het eerst installeert, krijgt niets.

---
## v1.11.1

**Een wedstrijd opent weer op de startopstelling.** De planningskaart onthield waar je de vorige
keer gebleven was, dus een wedstrijd waar je op kwart 4 gestopt was ging daar opnieuw open —
terwijl je bij het openen net wil zien waarmee er begonnen wordt. Nu altijd blok 1, eerste chip.

**Geen vraag meer naar de minuut bij het tekenen.** De chip zegt het moment al — bij een blok van
15 minuten is *7,5'* precies minuut 8 — dus een veld dat er nog eens naar vroeg was dubbelop. Het
gold bovendien voor alle wissels van dat blok samen, terwijl je een afwijking net per wissel wil
kunnen zetten. De afgeleide wissels krijgen nu automatisch die minuut, met het seintje aan; wil je
er één anders, dan pas je die ene aan met het potloodje in de lijst.

**De pijltjes lopen door de tijdlijn, niet door de blokken.** Eén tik naar rechts brengt je naar het
volgende moment: van *Start* naar *7,5'*, en van daaruit naar *15'* — meteen de start van kwart 2. Zo
lees je de hele wedstrijd als één reeks, terwijl de kop blijft zeggen in welk blok je zit. Onder die
kop staat een rij bolletjes, één per moment, met het gevulde bolletje waar je staat. Dezelfde
bediening in het voorbereidingsscherm en in de planningskaart tijdens de wedstrijd.

Meteen ook een vangnet dat er nog niet was: een openstaande werkkopie van de planner hoort bij de
wedstrijd waarin je ze maakte. Bleef die staan bij het wisselen van wedstrijd, dan werd ze bij het
volgende opslaan op de verkeerde wedstrijd toegepast.

---
## v1.11.0

**Je tekent het eindresultaat; de app bepaalt de wissels.** Kies je bij een blok de chip
*Na de wissels* terwijl het potloodje aanstaat, dan teken je hoe de ploeg er tijdens dat blok moet
komen te staan — speler en dan een plek, een bankspeler en dan iemand op het veld, of twee keer op
een speler om hem eraf te halen. Onder het veld verschijnt meteen wat de app daarvoor klaarzet.

Het onderscheid tussen een wissel en een positiewissel verdwijnt daarmee uit de invoer: de app leidt
zelf af wie erin komt, wie eraf gaat en wie er verschuift, en kiest daarbij het kleinste aantal
instructies. Aan de opslag en de uitvoering verandert niets — er komen dezelfde geplande wissels en
positiewissels uit als wanneer je ze met de hand intikte.

Eén wisselmoment per blok, dus één minuut en één seintje voor alles wat er dan gebeurt, standaard
het midden van het blok. Wat je op het moment zelf beslist, geef je zoals altijd live in.

**De chips dragen nu het tijdstip.** Bij kwarten van 15 minuten lees je de wedstrijd als één
tijdlijn: *Start* · *7,5'* · *15'* · *22,5'* · *30'* … Bij 20 minuten wordt dat *Start* · *10'* ·
*20'* · *30'*, bij helften van 45 minuten *Start* · *22,5'* · *45'* · *67,5'*. Het eerste blok heet
"Start" — een chip met 0' erop leest als een fout.

**De tweede chip begint leeg.** Staat er voor dat blok nog niets klaar, dan toont hij geen kopie van
het veld ernaast (waardoor het lijkt alsof er al iets gepland is) maar één zin en een knop
*Wissels klaarzetten tijdens dit kwart*.

**Weg omdat ze niets meer toevoegden:** de knoppen "+ Wissel" en "+ Positiewissel" onder elk blok —
je tekent nu het veld — en de knop "Opstelling & wissels aanpassen", die alleen nog het potloodje
aanzette op de kaart erboven. In het Bewerken-menu blijft het item enkel staan zolang er nog géén
opstelling is; dan is er nog geen veld om in te tekenen.

**Het veld blijft op zijn plaats** bij het bladeren en bij het wisselen van chip. De tekst erboven is
soms één en soms twee regels lang, en het veld schoof daardoor telkens mee.

Nagemeten: 220 getekende opstellingen leveren via de echte app-functie exact het getekende veld op,
en 60 keer eind-tot-eind (tekenen, opslaan, doorvoeren tijdens het spel) komt de ploeg precies zo te
staan. Nooit twee spelers op één plek.

---
## v1.10.0

**De planning krijgt twee velden per blok, en je bewerkt ze ter plekke.**

*Bij de start / Na de wissels.* Het wedstrijdplan-PDF toont per blok al twee velden naast elkaar;
op het scherm zag je er maar één. Nu staan er twee chips boven het veld die het ter plekke
omwisselen. De tweede verschijnt alleen als er voor dat blok iets klaarstaat — anders zou er twee
keer hetzelfde staan, precies de regel die de PDF al hanteert. De bank volgt het getoonde veld,
zodat een invaller niet tegelijk op het veld en op de bank staat. Dezelfde chips in het
voorbereidingsscherm en in de planningskaart tijdens de wedstrijd, uit één gedeelde berekening die
hetzelfde recept gebruikt als de PDF. Nagemeten: scherm en papier geven exact dezelfde opstelling.

*Het potloodje is een slot geworden.* Vroeger opende het een venster met een eigen veld, eigen bank
en eigen pijltjes — allemaal dingen die de kaart eronder al had. Nu wordt het veld in de kaart zelf
aantikbaar: uit is kijken en bladeren, aan is bewerken. Onderaan staat *Wijzigingen opslaan* zodra
er iets openstaat, anders gewoon *Opslaan*; opslaan sluit het slot weer. Bladeren naar een ander
blok werkt zoals voorheen en schrijft onderweg weg, want het volgende blok erft van dit blok.

Er is nog steeds één planner met dezelfde inhoud, alleen niet langer in een venster. Kom je er
meteen na de wizard terecht — waar die kaart nog niet getekend is — dan opent ze zoals vroeger.

---
## v1.9.8

**In de pauze deed de app iets anders dan wat ze toonde.** Zette je meerdere dingen klaar voor
het volgende blok en bevestigde je die tijdens de pauze, dan kon de ploeg anders komen te staan
dan op het scherm beloofd werd — twee spelers op elkaars plek, of een weigering
"die staat daar al" bij de laatste.

Oorzaak: in de pauze schrijft de app niet op het veld maar in de opstelling van het volgende
blok. De controles en de vraag "wie staat er op die plek?" keken ondertussen nog naar het veld
zoals het bij het fluitsignaal van het vorige blok stond. Dat beeld schoof dus niet mee met wat
er al klaargezet was. Nu is de opstelling van het volgende blok het ijkpunt.

Tijdens het spel was er niets aan de hand — daar klopte alles al. Ook de gegevens waren nooit in
gevaar: het ging om een verkeerde opstelling, niet om beschadigde wedstrijden.

Gemeten op de echte app-weg (plannen in het venster, doorvoeren met de knoppen): vier
positiewissels in de pauze gingen eerst in 50 van de 100 gevallen mis, twee in 6 van de 100.
Na de fix: 750 gevallen zonder fout, en 60 keer eind-tot-eind gecontroleerd dat het kwart ook
echt start met de opstelling die de pauze beloofde.

---
## v1.9.7

**Speeltijd volgens het plan: een wissel valt in het MIDDEN van de gekozen minuut.**
Tim merkte op dat een wissel op minuut 8 van een blok van 15 aan de ene speler 8 minuten
gaf en aan de andere 7, terwijl je alleen weet dat de wissel érgens in die minuut valt.
Nu krijgen ze allebei 7,5.

Waar het vandaan kwam: vóór v1.9.1 droeg een geplande wissel geen minuut, en rekende de
app met "de helft van het blok" — precies die 7,5 om 7,5. In v1.9.1 kwam de minuut erbij,
standaard ingevuld op het midden, en die werd letterlijk als het begin van de minuut
gelezen (minuut 8 = 7:00). Dezelfde wissel liep daardoor plots door een andere rekenweg.

Het SEINTJE blijft wél op het begin van de minuut staan: dan heb je een volle minuut om
een spelonderbreking af te wachten. Enkel de speeltijdverdeling gebruikt het midden.

---
## v1.9.6
### Een positiewissel kan weer op voorhand klaargezet worden
- **De knop '+ Positiewissel' is terug**, naast '+ Wissel' — zowel onder elk blok in de planning als in het venster *Wissels plannen*. Hij verdween in augustus met de redenering dat je een verschuiving niet vooraf plant maar op het veld tekent. Dat klopt maar half: het veld tekenen legt vast waar iedereen bij de **start** van een blok staat, terwijl een positiewissel zegt wat er **tijdens** dat blok verandert. Precies hetzelfde onderscheid als bij een gewone wissel — en daar bleef de knop wél staan.
- Alles eronder is al die tijd blijven werken: bestaande positiewissels waren zichtbaar, aanpasbaar en uitvoerbaar. Alleen kon je er geen nieuwe meer maken.
- **Een positiewissel draagt nu ook een minuut en een seintje**, net als een gewone wissel. De minuut staat al ingevuld op het midden van het blok, en het vinkje *"Geef me een seintje bij het begin van die minuut"* staat standaard aan. Zo staan de twee soorten echt gelijkwaardig naast elkaar in dezelfde lijst — met dezelfde weergave en dezelfde herinnering tijdens het spel.
- **Het veld toont meteen het resultaat.** Tik je een speler aan en daarna een plek, dan verschuift hij ter plekke op het veld — of ruilen de twee van plaats als die plek bezet is. Tot nu bleef het veld staan zoals het was en kreeg een lege plek hooguit een oranje kader; bij een **bezette** plek zag je zelfs dat niet. Het wérkte wel, maar je zag het niet, en dan lijkt het alsof je op een bezette plek niet kan tikken.
- **De planning zegt wat er netto verandert.** Twee klaargezette positiewissels kunnen drie spelers verplaatsen: ruil A met B, daarna A met C — dan schuift ook B mee, zonder dat je dat apart klaarzette. Onder de wissels staat nu *"Zo staat het veld erna"* met per speler zijn eindpunt, plus hoeveel er meeschuiven. Die regel verschijnt alleen wanneer er méér spelers verschuiven dan je hebt aangeduid; bij één losse verplaatsing zou ze hetzelfde zeggen als de instructie erboven.
- **Het wedstrijdplan-PDF toont dezelfde eindpunten** in plaats van de losse instructies — dat is het blad dat je aan de zijlijn leest.

---

## v1.9.5
### Opslaan zonder selectie kan nu ook vanaf de selectiestap
- **Twee knoppen leken te veel op elkaar.** Op de wedstrijdgegevens stond *"Plannen zonder selectie"*, op de selectiestap *"Opslaan zonder opstelling"* — twee schermen na elkaar, twee verschillende werkwoorden, en één woord verschil in wat je overslaat. Nu spiegelt elke knop de stap erboven: **Volgende → Selectie** / **Opslaan zonder selectie**, en **Volgende → Opstelling** / **Opslaan zonder opstelling**. Hetzelfde patroon, en het woord achter "zonder" zegt precies welk onderdeel je overslaat.
- **Met niemand aangeduid werkt opslaan nu gewoon.** Twijfel je bij het samenstellen, of haal je bij een bestaande wedstrijd iedereen uit de selectie, dan kreeg je *"duid minstens één speler aan"* — een melding zonder uitweg. Je moest terug met het pijltje naar de vorige stap om daar op *zonder selectie* te tikken, en dat vindt niemand. Nu vraagt de app: *"Je hebt geen spelers aangeduid. Wil je de wedstrijd opslaan zonder selectie en die later invullen?"*
- Had die wedstrijd al een opstelling per blok of klaargezette wissels, dan staat erbij dat die mee verdwijnen — die horen bij spelers die er straks niet meer zijn.
- Bij een **lopende** wedstrijd kan het niet: daar hangen speelminuten en gebeurtenissen aan de spelers. Wie iemand kwijt wil, gebruikt *Niet aanwezig* — dat bewaart wat er al gebeurd is.
- *Volgende → Opstelling* blijft wél weigeren met nul spelers: een opstelling zonder spelers heeft geen zin.

### Het vinkje bij een geplande wissel was onzichtbaar
- **"Geef me een seintje" leek niet te werken.** Het vinkje stond in hetzelfde kader als het minuutveld, en de opmaak van zo'n kader is gemaakt voor tekstvelden: een rand, wat ruimte eromheen, en de eigen tekening van de browser uitgezet. Een aanvinkvakje wordt daardoor een leeg vierkant van 36 bij 36 **zonder vinkje erin**. Je kon er wél op tikken, maar je zag nooit of het aan of uit stond.
- Nu is het weer een gewoon vinkje. Dat geldt meteen voor élk aanvinkvakje in de app, ook de vinkjes bij een blessure en bij de rugnummers — dezelfde valkuil was daar eerder al eens apart opgelost, nu is ze in één keer voor alles weg.

---

## v1.9.4
### "Je bent offline" verscheen veel te vaak
- Sinds v1.9.0 volgt de balk op het startscherm de échte verbinding met de databank in plaats van alleen de netwerkstatus van je toestel. Dat was de bedoeling — maar die verbinding valt ook weg bij een onderbreking van **één seconde**, waarna ze zichzelf meteen herstelt. Gevolg: de balk flitste voorbij bij elke hik, ook als er niets aan de hand was.
- **Nu wacht de app een aantal seconden** voor ze het meldt. Een korte onderbreking zie je niet meer; een echte wel. Zodra de verbinding terug is, verdwijnt de melding meteen — daar valt niets op te wachten.
- Zegt je toestel zelf dat er geen netwerk is (vliegtuigmodus, wifi uit), dan staat de melding er wél onmiddellijk: dan valt er niets te bevestigen.
- Het **bolletje op het wedstrijdscherm** blijft wel meteen reageren. Dat is een klein signaal dat mag flikkeren, en aan de zijlijn wil je juist direct zien of je werk aankomt.

---

## v1.9.3
### Je eigen seizoen exporteren
- **Onderaan de statistieken staat nu 'Seizoen exporteren'.** Dezelfde Excel- en CSV-bestanden als de clubexport, maar voor jouw ploeg — zodat je de speeltijd van een heel seizoen kan meenemen naar een gesprek zonder dertig losse wedstrijdbestanden samen te voegen. Die export zat tot nu alleen bij Clubbeheer, waar een gewone ploegbeheerder niet komt.
- Je kiest eerst het seizoen. Het Excel-bestand heeft dezelfde zes tabbladen; los kan je ook de speeltijd of de wedstrijdenlijst als CSV nemen. Tornooiwedstrijden staan apart en tellen niet mee in de speeltijd. Alleen zichtbaar voor wie de ploeg beheert.

### De formatie is nu ook een spiegel
- **Wijkt je opstelling sterk af van de gekozen formatie, dan zegt de app dat één keer bij het opslaan** — bijvoorbeeld *"je zet 3 spelers in de aanval, Dubbele ruit heeft er 1"*. Met de keuze om gewoon door te gaan of terug te keren naar het veld.
- Geen blokkade: je bepaalt zelf waar je spelers staan, dat was de bedoeling van het positierooster. Maar de naam van de formatie belandt wél in het verslag, het wedstrijdplan en de PDF, en dan hoort ze te kloppen met wat er op het veld staat.
- **Alleen bij een echt verschil** — twee spelers of meer in één linie. Eén speler die een rij opschuift is een accent, geen andere formatie, en daar krijg je dus niets voor te zien. Ook niet wanneer je met minder spelers dan plaatsen speelt.

---

## v1.9.2
### Iemand verwijderen is nu blijvend
- **Wie je uit de ploeg zette, kon zichzelf meteen weer toevoegen.** Om als kijker binnen te komen wordt niet gecontroleerd of je een geldige uitnodiging hebt — alleen of je het interne ploegnummer kent, en dat staat in élke uitnodigingslink. Wie er ooit een kreeg, kende het voorgoed. De uitnodiging intrekken hielp niet, want er werd niet naar gekeken.
- **Nu onthoudt de app wie je verwijderde.** Zolang iemand op die lijst staat, weigert Firebase dat hij zichzelf toevoegt. In de ledenlijst staat onderaan **'Eerder verwijderd'** met de namen en de datum, en één tik op **'Toegang herstellen'** haalt hem er weer af. Stel je hem later zelf aan als ploegbeheerder, dan verdwijnt de blokkade ook automatisch.
- *Eerlijk gezegd:* de blokkade hangt aan het account. Maakt iemand een volledig nieuw account aan, dan is hij niet meer geblokkeerd. Dit houdt de gemakkelijke weg tegen — dezelfde persoon met dezelfde oude link — niet iemand die vastberaden is. De sluitende oplossing vraagt het betalende Firebase-plan.

### Uitnodigingen verlopen na twee maanden
- Een uitnodigingslink of code van vorig seizoen werkte vandaag nog gewoon. **Nu vervalt ze na twee maanden.** In het uitnodigingsvenster staat tot wanneer ze geldig is; daarna maak je met de bestaande knop een nieuwe code aan. Wie een verlopen link gebruikt, krijgt te horen dat hij een nieuwe moet vragen — geen vage foutmelding.
- Uitnodigingen zonder aanmaakdatum (van heel oude ploegen) blijven werken: iemand buitensluiten op een gegeven dat er niet is, is de verkeerde kant om je te vergissen.

### Opgeruimd
- **De oude 'beheerdersaanvraag' hield nog een verbinding open.** Die aanvraag — systeembreed toestemming vragen om ploegen te mogen aanmaken — bestaat niet meer sinds het clubmodel, en de knop stond al lang niet meer in de app. Maar bij elke opstart als eigenaar werd er nog wel live meegeluisterd naar aanvragen die niemand nog kan indienen. Dat is nu uit.

---

## v1.9.1
### De minuut van een geplande wissel telt zoals de rest van de app
- **"Minuut 8" betekende twee verschillende dingen.** Overal in de app is *8'* de periode van 7:00 tot 7:59 — een doelpunt op 7:30 staat in het verslag als 8'. Maar bij een geplande wissel ging het seintje pas af op 8:00 verstreken, en dat is volgens diezelfde telling het begin van minuut 9. Nu geldt overal dezelfde regel: **minuut 8 loopt van 7:00 tot 8:00**.
- **Het seintje komt daardoor bij het begín van de bedoelde minuut.** Bij minuut 8 krijg je de melding op 7:00 — een volle minuut om een spelonderbreking af te wachten, in plaats van een seintje op het moment dat de wissel al had moeten gebeuren. De melding zegt nu *"Minuut 8: Kobe voor Tibo staat klaar"* in plaats van *"8' voorbij"*.
- **De minuut staat altijd ingevuld**, ook wanneer je een oudere wissel bewerkt die er nog geen had: het midden van het deel, dus minuut 8 bij een deel van 15 en minuut 11 bij een deel van 20. Er zit dus geen aanname meer achter de schermen — wat er staat, is waarmee gerekend wordt. Onder het veld staat in gewone taal welke tijd die minuut beslaat.

---

## v1.9.0
### Vier dingen aan de zijlijn
- **De duur van een blok rechtzetten kan nu in de pauze.** Vergat je de klok te stoppen op het einde van kwart 2, dan moest je de hele wedstrijd uitspelen met een scheve klok en scheve speelminuten in beeld — precies waar je in kwart 3 en 4 op stuurt. Het venster bestond al en werkt op elk afgesloten blok; alleen stond de knop enkel in het verslag van een afgelopen wedstrijd. Nu staat hij ook bij *Wat kan je doen in de pauze*, met de huidige duur erin.
- **De app zegt het als er nog iemand met dezelfde wedstrijd bezig is.** Doelpunten, wissels en blokken worden netjes samengevoegd, maar de klok en de wissels die je klaarzet komen van wie het laatst schreef. Twee mensen die tegelijk bijhouden, konden elkaar dus stil overschrijven. Er staat nu een balk: *"Er is nog iemand met deze wedstrijd bezig — spreek af wie ze bijhoudt."* Geen blokkade; aan de zijlijn los je dat op door het even tegen elkaar te zeggen. De melding verdwijnt vanzelf vijf minuten na de laatste wijziging van de ander.
- **Eén eerlijk antwoord op "ben ik offline?"** Het startscherm keek naar de netwerkverbinding van je toestel, het bolletje op het wedstrijdscherm naar de échte verbinding met de databank. Op de wifi van een kantine die je niet doorlaat, zeiden die twee iets anders. Nu telt elk signaal dat er iets mis is — je ziet dus meteen dat je werk niet aankomt, in plaats van het pas achteraf te merken.
- **Het tornooivinkje staat nu op alle drie de wegen.** *"Ook niet beschikbaar voor de rest van het tornooi"* zat alleen bij het ×-knopje naast een spelersnaam. Ging je via *Meer* of *Event toevoegen* naar *Speler verlaat de wedstrijd*, dan stond dat kind gewoon weer in de selectie van de volgende wedstrijd van de dag.

### De geplande wissels tellen eindelijk mee in de speeltijd
- **`Speeltijd volgens dit plan` telde hele blokken.** Zette je een wissel klaar bínnen kwart 2, dan kreeg de speler die eraf ging dat hele kwart toegeschreven en de invaller nul — terwijl ze elk ongeveer de helft spelen. Precies de invallers werden dus onzichtbaar in de verdeling waar ouders je op aanspreken. Sinds v1.8.0 liep diezelfde berekening ook door in de seizoenscijfers van een wedstrijd die je enkel afsluit.
- **Nu bouwt de app per blok een kleine tijdlijn:** wie staat er aan de start, en op welk moment gaat elke wissel af. In de demoploeg betekent dat bijvoorbeeld *2,5 van 4 · 38'* in plaats van *3 van 4 · 45'* — een halve blok is nu gewoon een halve blok.
- **De minuut van een geplande wissel staat voortaan standaard ingevuld** op de helft van het blok. Je kan ze aanpassen of leeghalen; laat je ze leeg, dan rekent de app alsnog met de helft.
- **Het seintje is losgekoppeld van die minuut.** Tot nu deed één veld twee dingen: wie geen melding wou, liet de minuut leeg — en dan wist de app ook het moment niet meer. Er staat nu een apart vinkje *"Geef me een seintje op dat moment"*, standaard aan. Zet je het uit, dan telt de minuut nog steeds mee voor de speeltijd maar krijg je geen melding; de minuut staat dan grijs in plaats van oranje.
- Zowel het scherm als het wedstrijdplan-PDF gebruiken dezelfde berekening.

### Rechtgezet
- **"E-mailadres niet bevestigd" bij iemand die je net had aangesteld.** Stelde je als eigenaar een ploegbeheerder aan op e-mailadres, dan stond hij in de ledenlijst van die ploeg meteen met een waarschuwing dat zijn adres niet bevestigd was — terwijl dat onmogelijk is: het aanstelvenster laat een onbevestigd adres niet door. De oorzaak: de ledeninformatie van een ploeg wordt door de persoon zélf geschreven, wanneer hij die ploeg opent. Tot dan viel de lijst terug op zijn accountgegevens, en die dragen wel een naam en een adres maar geen bevestigingsvinkje — "weet ik nog niet" werd getoond als "niet bevestigd", precies naast de knop waar je op die melding zou aarzelen. Bij het aanstellen wordt dat nu meteen ingevuld.

---

## v1.8.0
### Een wedstrijd afsluiten die je niet gevolgd hebt
- **Eén venster voor beide uitkomsten.** De knop onderaan het wedstrijdscherm heette *Afsluiten als gespeeld zonder uitslag* en deed precies dat — wie de score wél kende, moest langs *Bewerken → Uitslag ingeven*. De knop heet nu **Afsluiten met of zonder uitslag** en opent hetzelfde venster, waar je kiest.
- **Ook zonder selectie staat de uitslagknop bovenaan.** Daar stonden twee knoppen (*Bewerken* en *Selectie ingeven*); het zijn er nu drie: **Bewerken · Selectie · Uitslag**. Juist een wedstrijd zonder selectie is er vaak een die niemand gevolgd heeft.
- **Doelpuntenmakers:** de lijst toont enkel wie meeging — de niet-beschikbare spelers stonden er ook tussen, dus je kon een doelpunt geven aan iemand die er niet was. Zonder selectie valt de lijst helemaal weg.

### Speelminuten uit het wedstrijdplan
- **Stond er een opstelling per blok klaar, dan tellen die minuten mee.** Tot nu leverde een afgesloten wedstrijd nooit speeltijd op, ook al lag het hele plan er. Nu rekent de app uit wie hoeveel speelde en gebruikt dat in *Meeste speelminuten*, *Fair-play* en het verslag.
- **Alleen bij een echte verdeling over de blokken.** Staat er enkel een startopstelling, dan komen er geen minuten bij: daaruit zou volgen dat de basis alles speelde en de bank niets, en dat is een sterke bewering over een wedstrijd die niemand volgde.
- **Het venster zegt vooraf wat er gaat gebeuren** — of de minuten meetellen of niet — zodat je het niet pas achteraf in de statistieken ontdekt.
- **Zichtbaar waar het getal vandaan komt:** in het verslag en de PDF staat dat de wedstrijd niet live gevolgd is, en bij Fair-play staat *"1× speeltijd volgens het wedstrijdplan"* bij de speler.
- Heropen je de wedstrijd, dan verdwijnen die geplande minuten weer: je gaat ze alsnog volgen, en dan telt de klok.

### Rechtgezet
- **Een wedstrijd zonder uitslag gaf de doelman een clean sheet.** De stand *– . –* wordt intern als 0 bewaard, en dat las de app als "geen tegendoel" — terwijl je juist níét weet of er tegengescoord is. Op dezelfde kaart stond dan *Ploeg 0/0* met een keeper op 1. Nu telt zo'n wedstrijd nergens mee bij clean sheets, ook niet in het spelersdetail.

---

## v1.7.3
### Nieuwe schermafbeeldingen in de handleiding
- **Alle twintig beelden opnieuw genomen.** Ze waren van vóór v1.4.0 en toonden nog dingen die niet meer bestaan: de fotovakken in het verslag, de kijkmodusschakelaar op het beheerscherm, en de oude knopindeling op het wedstrijdscherm. Nu staan er ook de nieuwe zaken op: *Allemaal mee* en *Vorige selectie* bij de selectie, *Te vroeg gestopt* in de pauze, het potlood per kwart in het verslag, en het opengeklapte *Meer details* bij een nieuwe wedstrijd.
- **De voorbeeldploeg heet nu U11IP** in plaats van *U11 Groen*. Die naam werd in de titelbalk afgekapt tot *"U11 Gr…"* zodra er een knop naast stond.
- **Het beeld bij "Als kijker" klopte niet:** het toonde *Kijkmodus* in de titelbalk — de stand van een beheerder die zichzelf even als ouder bekeek. Die knop bestaat sinds v1.6.1 niet meer. Nu staat er *Kijken*, wat een echte kijker ook ziet, en dat is ook wat de tekst ernaast zegt.

---

## v1.7.2
### De handleiding klopt weer
- **Bijgewerkt met alles wat er sinds v1.4.0 bijkwam:** gespeeld zonder uitslag, de vraag "komt hij nog terug?" bij een ernstige blessure, *Toch nog niet gestart*, het PAUZE-opschrift op een stilstaande klok, het potlood om een gebeurtenis aan te passen, de richtminuut bij een geplande wissel, *Speeltijd volgens dit plan*, en de snelknoppen *Allemaal mee* en *Vorige selectie*.
- **Twee zinnen die niet meer klopten, rechtgezet:** de kijkmodus stond er nog in (die knop bestaat sinds v1.6.1 niet meer), en de waarschuwing dat twee beheerders elkaars werk konden overschrijven — sinds v1.7.0 blijven gelijktijdige doelpunten en wissels allebei bewaard.
- **Een schermafbeelding kan nu bij zijn eigen uitleg staan.** Op pagina's met twee beelden stonden ze allebei bovenaan, dus las je eerst twee beelden en pas daarna waar ze over gingen. Het tweede beeld staat nu telkens bij het onderdeel waar het over gaat — op het scherm en in de handleiding-PDF.
- Nog niet gedaan: de schermafbeeldingen zelf dateren van vóór de wijzigingen van gisteren.

---

## v1.7.1
### Kleur zegt wat een knop doet
- **"Afsluiten als gespeeld zonder uitslag" stond in het groen** en leek daardoor een gewone handeling zoals *Wedstrijd starten* of *Opstelling & wissels aanpassen*. Hij is nu grijs, net als *Wedstrijd annuleren*, met een neutraal streepje erboven naar het model van de rode lijn boven *Wedstrijd verwijderen*. Op het wedstrijdscherm lees je nu in één oogopslag: groen is de wedstrijd doen, grijs is ze afsluiten, rood is ze weggooien.

---
## v1.7.0
### Twee toestellen kunnen elkaars werk niet meer stil wissen
Uit een echte tweetoestellentest op 24-08-2026, met twee aanmeldingen op dezelfde ploeg. Wat al goed werkte: een wedstrijd aanmaken komt aan, twee doelpunten op exact hetzelfde moment blijven allebei staan, een toestel dat een half minuutje offline gaat verliest niets, en de klok loopt op beide toestellen gelijk.

- **De kern werd als één blok bewaard.** Bewerkten twee beheerders tegelijk — de een hernoemt een speler, de ander voegt er een toe — dan won wie het laatst opsloeg en verdween het werk van de ander zonder melding, ook uit de cloud. Nu wordt er **per speler** samengevoegd: de nieuwste wijziging van elke speler wint, wat het ene toestel heeft en het andere niet blijft bestaan, en een verwijderde speler komt niet terug. De opgeslagen vorm verandert niet, dus bestaande kernen werken ongewijzigd verder. (De tornooien gingen al per stuk sinds v0.9.3.)
- **Een invaller kon zijn plaats op het veld verliezen.** Voerden twee beheerders op hetzelfde moment een wissel door, dan overleefden beide wissels wel, maar de invaller van het ene toestel kwam er zónder positie op te staan — waardoor hij ontbrak op het velddiagram, in de PDF en in de positiestatistiek. Bij het samenvoegen worden de plaatsen nu mee herbouwd, langs dezelfde weg die het verslag gebruikt. Wedstrijden die al in die toestand staan, herstellen zichzelf bij de eerstvolgende synchronisatie.

---

## v1.6.1
### De kijkmodus is weg
- **De schakelaar "Bekijken als kijker" is verwijderd.** Hij was een val: de schakelaar stond op het beheerscherm, maar zodra de kijkmodus aanstond, opende de chip bovenaan het gewone ploegscherm in plaats van het beheerscherm — de enige weg terug zat dus achter een deur die je net had dichtgedaan. De app herladen was de enige uitweg.
- **Extra vangnet:** de chip bovenaan brengt een ploegbeheerder nu altijd op zijn beheerscherm, wat er verder ook aan staat. Zo kan een weg terug nooit meer verdwijnen.
- De onderliggende kijkersrechten blijven ongewijzigd — daar verandert niets aan voor wie écht kijker is.

---

## v1.6.0
### Gespeeld zonder uitslag, en een opgeruimd wedstrijdscherm
- **Nieuw: een wedstrijd afsluiten zonder uitslag.** Bij een vriendschappelijke noteert soms niemand de score, en dan bleef die wedstrijd voor eeuwig gevlagd als *niet afgesloten*. Je kan ze nu afsluiten met **– . –** als uitslag: ze staat dan als **gespeeld** en telt mee in het aantal wedstrijden, maar levert geen winst, gelijk, verlies, doelpunten of nul gehouden. Speelminuten tellen wél mee als je die toevallig bijhield. Later alsnog een uitslag ingeven kan altijd — en omgekeerd ook. Twee wegen ernaartoe: de knop **Afsluiten als gespeeld zonder uitslag** onderaan het wedstrijdscherm (ook als er nog geen selectie is), en in het venster *Uitslag ingeven*. Niet bij een tornooiwedstrijd: daar hoort een uitslag bij.
- **De uitslagvelden staan niet meer op 0.** Ze zijn leeg met een streepje als plaatshouder, zodat je nooit per ongeluk een 0-0 opslaat die je niet bedoelde. De groene knop zegt wat je gaat opslaan: *Opslaan als gespeeld met uitslag: 3-1*.
- **De doelpuntenmakers staan dichtgeklapt** in dat venster. Met een volledige kern moest je langs veertien rijen scrollen voor je de knoppen zag.
- **Bij een wedstrijd op – . – staan Delen, PDF en Export er niet.** Er valt niets door te sturen. In hun plaats staan *Alsnog een uitslag ingeven* en *Wedstrijd heropenen*, naast elkaar.
- **Eén woord voor één ding: uitslag.** De app gebruikte *uitslag*, *resultaat* en *score* door elkaar. Het venster heet nu *Uitslag ingeven* (was "Snel resultaat"), en de teksten in de cijfers en de handleiding volgen. *Score* blijft waar het over het cijfer zelf gaat.
- **De melding "niet afgesloten" op het startscherm is kleiner en uitklapbaar.** Dichtgeklapt is het één regel met het aantal; open staat erbij wat je kan doen — de uitslag ingeven, of registreren als gespeeld zonder uitslag.
- **Het wedstrijdplan (PDF) staat nu bovenaan**, naast de kop *Planning*, in plaats van helemaal onderaan. Het is het blad dat je meeneemt naar het veld.
- **"Opstelling en wissels per kwart (2 klaargezet)" heet nu "Opstelling & wissels aanpassen".** Die teller telde alle blokken bij elkaar op, terwijl je per blok al ziet wat er klaarstaat.
- **"Meer details" staat open** bij het aanmaken én het bewerken van een wedstrijd. Scheidsrechter, terrein, trainer en ploegverantwoordelijke zijn precies wat je bij een wedstrijd invult; achter een tik verstopt worden ze vooral vergeten. Dichtklappen kan nog altijd.

---

## v1.5.0
### De foto's zijn eruit
- **Teamfoto en actiefoto zijn weg** — uit het verslag, uit de PDF en uit de opslag van nieuwe wedstrijden. Ze werden niet gebruikt en kostten onevenredig veel: een gsm-foto ging **ongewijzigd** de opslag in. Gemeten: 3,8 MB per foto, 7,6 MB voor één wedstrijd met twee, tot 25 MB in het uiterste geval. Elke keer dat zo'n wedstrijd bewaard werd, ging dat hele blok mee — én nog eens door de kopie die de synchronisatie maakt om de foto's er dan weer uit te gooien. De PDF gebruikte ze op zo'n 600 px breed en duurde er 5 seconden over in plaats van 3,5.
- **Foto's bij bestaande wedstrijden worden niet gewist.** Ze worden alleen niet meer getoond. Ze blijven ook uit de cloud, net als voorheen.

---

## v1.4.2
### Wat een kijker ziet op een verslag
- **Bij een lokale (niet-gesynchroniseerde) wedstrijd bleven de bewerkknoppen zichtbaar voor een kijker.** Het verslagscherm verborg die zone met een eigen formule die enkel afging bij een wedstrijd uit de cloud, terwijl de rest van datzelfde scherm de gewone rolcontrole al gebruikte. Precies dezelfde fout die op 23-08-2026 in het voorbereidingsscherm rechtgezet is; dit scherm bleef toen staan. Gevolg: in de **kijkmodus** kreeg je voor zulke wedstrijden een weergave die niet klopte met wat een kijker echt ziet, en *Event toevoegen* en *Spelernotities* — de enige twee knoppen daar zonder eigen wachter — deden hun werk gewoon. Naar de cloud ging er niets: dat pad vraagt de beheerdersrol en de serverregels weigeren het.
- Die twee vensters hebben nu ook zelf een wachter, zoals de andere.
- De toelichting bij de cijferrechten zei dat het seizoensoverzicht enkel voor beheerders was. Dat klopt niet: een kijker mag dat overzicht openen en de oogjes bepalen welke blokken hij ziet. Alleen het individuele spelerdetail is beheerdersgebied. Tekst gelijkgezet met de code.

---

## v1.4.1
### Twee toestellen: een blok zonder start kan niet meer
- **Een teruggenomen blok kon terugkeren zonder zijn startgebeurtenis.** Nam je een blok terug (*Toch nog niet gestart*) of begon je opnieuw, en schreef een tweede toestel daarna nog met verouderde gegevens weg, dan kwam dat blok terug uit de cloud terwijl zijn start als verwijderd gemarkeerd stond. Je hield een kwart over dat volgens de gegevens nooit begonnen is, met speelminuten die niet meer klopten. Het samenvoegen laat de wismarkering nu ook gelden voor het blok zelf. Blijkt uit de gegevens dat het andere toestel dat blok tóch gespeeld heeft (er staat bijvoorbeeld een doelpunt in), dan blijft het blok staan en komt de start terug — er gaat nooit iets van iemand anders verloren om een blok te kunnen verwijderen.
- Dit trof enkel wedstrijden die op **twee toestellen tegelijk** bijgehouden worden, waarvan er één een tijd zonder verbinding zat. Met één toestel kon het niet gebeuren. Gevonden met een nieuwe samenvoegtest (twaalf scenario's) op 24-08-2026; het gold ook al vóór v1.4.0, via *Opnieuw beginnen*.

---

## v1.4.0
### De zijlijnketen: twee gaten gedicht
Uit de ketentest van 24-08-2026, waarin de volledige stroom van een afgevaardigde is nagespeeld — plan klaarzetten, live bijhouden, pauzes, strafschoppen, verslag en PDF — over twaalf wedstrijden in alle spelvormen en blokindelingen. De cijfers klopten overal tot op de minuut; deze twee punten zaten in het verloop.

- **Een speler die geblesseerd van het veld ging, stond het volgende blok zwijgend weer op het veld.** Stond hij in het plan van de trainer, dan zette de app hem er gewoon terug op — het plan is immers van vóór de wedstrijd. Nu vraagt de app bij een **ernstige** blessure waarbij hij het veld verlaat meteen of hij nog terugkomt. Antwoord je "nee", dan wordt hij nergens meer opgesteld of ingewisseld, precies zoals bij een speler die de wedstrijd verlaat. Bij kramp of een lichte blessure wordt er niets gevraagd: daar meldt de **pauze** het gewoon wanneer zo iemand weer in de opstelling staat ("Cas ging in kwart 2 geblesseerd van het veld en staat nu weer in de opstelling. Kan hij verder?"). Achteraf recht te zetten via het potloodje bij de gebeurtenis. Bijkomend: bij "Ernstig" staat **Speler verlaat het veld** nu standaard aan, en *Volgens plan* kondigt geen spelers meer aan die daarna toch overgeslagen worden.
- **Een stilgezette klok zag eruit als een lopende klok.** Zelfde cijfers, zelfde kleur; het enige verschil was de knop die "Hervatten" zei. Wie na een blessure vergat te hervatten, merkte dat pas veel later — en dan klopte de speeltijd van iedereen op het veld niet meer. De klok kleurt nu op en er staat **PAUZE** onder.
- **Een klaargezette wissel kan nu een richtminuut krijgen.** Trainers zeggen "wissel Bas na acht minuten", en daar was niets voor. Je vult optioneel een minuut in; zodra die voorbij is, krijg je een piep en een melding, en de knop *Geplande wissels* springt eruit met "· nu". De wissel gaat nog altijd **niet** vanzelf af — jij kiest het moment.
- **Het opstellingsscherm in de pauze is korter.** Speeltijden, bank en planning zitten nu achter één regel die je opentikt. In de pauze zie je dus het veld en wat er verandert; tijdens het spel blijft alles gewoon openstaan.
- **Een vertrokken of definitief geblesseerde speler werd nog aangeboden als invaller** in het venster *Wissel klaarzetten*. De andere lijsten pasten die regel al toe sinds v1.0.3; dit venster was toen vergeten.
- **Nieuw: "Speeltijd volgens dit plan".** Op het wedstrijdscherm en in het wedstrijdplan-PDF staat nu per speler in hoeveel blokken hij aan de start staat en wat dat in minuten is, met de minst spelende speler opgelicht. Zo zie je vóór de aftrap hoe het plan de speeltijd verdeelt.
- **Twee snelknoppen bij de selectie:** *Allemaal mee* zet iedereen ineens in de selectie, *Vorige selectie* neemt die van de vorige wedstrijd van deze ploeg over. Wie je op NB zette, blijft NB.
- **Een kaart kan nu ook voor een bankspeler.** De blessuremodal bood de bank al aan, de kaartmodal niet — terwijl geel voor protest vanaf de bank gewoon bestaat.
- **Het verslag zegt nu dat je met een man minder speelde.** Na een rode kaart of een eenzijdige wissel klopten de minuten wel, maar nergens stond waaróm de percentages lager lagen. Er staat nu één regel bij de speelminuten, ook in de PDF.
- **Kleinere punten:** het bolletje ● bij de banklijsten wordt uitgelegd waar het staat ("minst gespeeld eerst (●)"), en de melding bij een onvolledige wissel zegt nu precies wat er ontbreekt in plaats van altijd "kies wie eraf gaat en wie erin komt".
- **Een per ongeluk gestart blok kon je niet terugnemen.** Tikte je te vroeg op "Start kwart 2", dan liep de klok en was de enige weg terug *Opnieuw beginnen* — de hele wedstrijd naar nul. Er staat nu, net als bij "Te vroeg gestopt", een knop **Toch nog niet gestart** onder de klok. Hij verschijnt in de eerste twee minuten van een blok en verdwijnt zodra je iets logt. Je komt terug in de pauze **met de opstelling die je klaarzette nog klaar**, dus je hoeft niets opnieuw in te tikken. Bij de aftrap zet hij de wedstrijd terug op "gepland".

---

## v1.3.7
### De laatste drie punten van de audit
- **Een speler die zich alleen maar afmeldde, kreeg een leeg scherm.** Zijn detail zei "nog geen gespeelde wedstrijden", terwijl de statistiekenpagina hem wél toonde. Nu staat er voor welke wedstrijden hij afgemeld was, met de datums.
- **"Geen tegendoel" telde een snel ingevoerde uitslag mee bij de ploeg, maar niet bij de keepers.** Op dezelfde kaart stond dan bijvoorbeeld "3/8" bij de ploeg terwijl de keepers samen op 2 kwamen. Nu dezelfde noemer voor beide, met de uitleg erbij welke wedstrijden niet meetellen en waarom.
- **De ploegverantwoordelijke heette in het exportbestand en in de PDF "Afgevaardigde"** en in de rest van de app "Ploegverantwoordelijke". Nu overal hetzelfde woord.

---

## v1.3.6
### De cijfers: posities per kwart, een A/B-filter en eerlijke aantallen
- **"Posities" telde alleen de plek waar een speler bij het eindsignaal stond.** Wie drie kwarten centraal achterin stond en het laatste kwart spits speelde, stond in dat blok als spits — één keer. Nu wordt per kwart geteld, wat het opschrift ("hoe vaak per plek") ook belooft.
- **Nieuw: een ploeglabel-filter (A/B) in de cijfers.** De wedstrijdenlijst had die al; de cijfers telden A en B altijd samen en je kon dat nergens splitsen.
- **Het filterpaneel zegt nu hoeveel wedstrijden er overblijven** ("1 van de 3 gespeelde wedstrijden in dit seizoen") en heeft een knop **Filter wissen**. Voordien moest je het paneel sluiten en naar de kaart "Gespeeld" kijken.
- **Niet-afgesloten wedstrijden verdwenen zonder woord uit de cijfers.** Er staat nu een regel boven: hoeveel er niet meetellen, en dat je ze via het startscherm kan afsluiten.
- **In de prullenmand zegt de bevestiging nu wat er met het tornooi is.** Zet je een wedstrijd terug van een tornooi dat óók verwijderd is, dan hoor je of dat tornooi nog in de prullenmand staat (zet dat dan eerst terug) of definitief weg is (dan komt ze terug als losse wedstrijd).
- Onder de motorkap: een oude, onbereikbare herstelroutine is verwijderd. Ze hoorde bij een back-upformaat van vóór versie 3 en zou bij een moderne back-up de clubnaam, het clublogo, **de spelerskern** en het thema uit de opslag hebben gewist.

---

## v1.3.5
### Het verslag: kloppende blokduur, de stand per blok, en niets meer wegschrijven bij het kijken
- **Een blok zonder eindtijd toonde de duur van een ánder blok.** Bij een halverwege afgebroken of gesynchroniseerde wedstrijd stond bij kwart 2 de tijd van het laatste kwart. Nu staat er een streepje: alleen voor het lopende blok is de verstreken tijd het juiste antwoord.
- **De kaart per kwart toont nu ook de stand van dát kwart**, onder het bloknummer. "1–1" alleen las als de stand van dat kwart, terwijl het de doorlopende stand was. De tijdlijn en de PDF deden dat al.
- **Een verslag openen kon de wedstrijd wegschrijven en naar de cloud sturen.** Er liep bij elke tekening een reparatie van oude positienummers mee, zonder rolcontrole — dus ook wanneer een kijker enkel keek. Dat gebeurt nu alleen nog voor wie de wedstrijd mag bijhouden.
- **In de PDF stond bij een wedstrijd van één blok de láátste kapitein op de startopstelling**, terwijl het scherm de eerste toont. Dat raakt vooral tornooiwedstrijden, die meestal uit één blok bestaan.
- **Een kijker zag in de PDF meer dan op het scherm**: de positiewisselingen stonden er wel in. Die worden nu ook in de PDF weggelaten voor wie alleen mag lezen.

---

## v1.3.4
### Snel resultaat naast Bewerken, en de opstelling houdt haar plekken
- **Nieuw: de knop "Uitslag" naast "Bewerken"** op het wedstrijdscherm, op een kwart van de breedte. Een uitslag invoeren zonder de wedstrijd live te volgen zat weggestopt in het bewerkmenu — daar staat hij nog steeds, maar nu ook meteen in zicht. Hij verschijnt zodra de selectie ingegeven is; daarvoor staat er "Bewerken" en "Selectie ingeven", zoals altijd.
- **Twee spelers bijna op dezelfde plek kan niet meer ontstaan uit een oud plan.** De regel "één speler per plek" keek naar de coördinaten in plaats van naar de plek zelf. Bij opstellingen van vóór het positierooster konden twee spelers zo naast elkaar door de controle glippen en op het veld bijna op elkaar terechtkomen.
- **"Geplande wissels" telde iets dat het venster niet toonde.** Stond je enige klaargezette wissel op "Altijd", dan las je "(1)" op de knop en "nog niets klaargezet voor kwart 2" in het venster. Nu opent het venster op het tabblad waar die wissel staat.
- **"Herstel" bij een afwezige verdwijnt na het eindsignaal**, net als het kruisje ernaast — dat wist speelminuten, en dat op een afgesloten wedstrijd is nooit de bedoeling. Rechtzetten kan nog via het verslag.
- **Een afwezig gemelde speler blokkeerde "Startopstelling herplaatsen".** Hij stond bij "Nog te plaatsen" en zolang hij daar stond, weigerde het opslaan — voor iemand die er niet was.

---

## v1.3.3
### Gebeurtenissen: geen verzonnen minuten, en ongedaan maken kan in de pauze
- **Een gebeurtenis zonder tijdstip stond in het verloop op 1'.** Kies je "Onbekend" als moment, dan bewaart de app bewust géén tijdstip — en toch las het verloop "1'". Datzelfde gold voor élk doelpunt uit "Snel resultaat": een 3-1 leek vier doelpunten in de eerste minuut. Nu staat er een streepje.
- **"Laatste actie ongedaan maken" verdween net in de pauze** — het moment waarop je nakijkt wat je hebt ingetikt. Nu staat de knop er ook daar. Ná het eindsignaal blijft hij weg; dan hoort het via het verslag.
- **Geef je een blessure of vertrek achteraf in, dan zie je nu de bank van dát blok** in plaats van de bank van nu. Er konden spelers tussen staan die op dat moment net op het veld stonden.
- **Bij een vrije trap achteraf zijn ingevallen spelers nu ook kiesbaar**, met een "bank"-merkje — net zoals bij een doelpunt, een kaart of een strafschop.
- **Een wissel was bewerkbaar naar "X voor X".** Nu weigert de app dat: iemand kan zichzelf niet vervangen. Die controle bestond al voor een positiewissel.
- **Een onmogelijke minuut werd stil weggeslikt.** Typte je 0 of een negatief getal, dan sloot het venster met de oude waarde en zei niets. Nu krijg je een melding.
- **Een derde gele kaart gaf een tweede automatische rode kaart.** En bij het verwijderen werd er maar één ontkoppeld, dus er bleef een rode kaart staan die niemand gegeven had. Nu gaat het automatisch alleen bij precies de tweede gele, en verdwijnen ze allemaal mee.
- **"Dit gebeurde tijdens het spel" zette de gebeurtenis op minuut 2** in plaats van in de eerste minuut, zoals het venster belooft.
- **Het bewerkvenster van een hoekschop vroeg nog naar nemer en type** — twee dingen die je bij het ingeven bewust niet meer invult.
- **Een reeks positiewisselingen wissen slaat nu één keer op** in plaats van één keer per wisseling. Voordien gingen er ook halve tussenstanden naar de cloud.

---

## v1.3.2
### Dezelfde cijfers op elk scherm, en de clubexport klopt weer
- **Belangrijk: de clubexport uit v1.2.3 gaf elke speler een regel per wedstrijd.** Bij het scheiden van naamgenoten gebruikte ik een kenmerk dat per wedstrijd verschilt, dus in plaats van één regel per speler per seizoen kreeg je er één per wedstrijd. Nu op het vaste spelersnummer uit de kern: één regel per speler, naamgenoten uit verschillende ploegen nog steeds apart, en een echt doorgeschoven speler nog steeds samengeteld.
- **Het spelerdetail rekende "Geselecteerd" anders dan de statistiekenpagina.** Dezelfde speler kon twee percentages hebben, afhankelijk van welk scherm je opende. De speeldag-regel staat nu op één plek en beide schermen gebruiken ze — dus ook in het spelerdetail telt een zaterdag-zondagverdeling over twee ploeglabels niet als gemiste wedstrijd.
- **Delen op het verslag nam de strafschoppenreeks niet mee.** Dat was de laatste van de vijf plekken; een op strafschoppen gewonnen wedstrijd werd dus als "1-1" doorgestuurd.
- **Een los ingelezen wedstrijdbestand kwam binnen zonder ploegcontrole** en werd daarna weggeschreven naar de ploeg waar je toevallig in stond. Een wedstrijd van U9 kon zo bij U13 belanden. Nu wordt het geweigerd met de uitleg naar welke ploeg je eerst moet wisselen.
- **"Volgens plan" vergeleek met het huidige veld** in plaats van met de opstelling die je voor het volgende deel getekend had. Daardoor zei het venster soms "staat al klaar zoals in het wedstrijdplan" terwijl dat niet zo was — en verborg het dan de bevestigknop.
- **Een verzette kapiteinswissel werkt de kapitein bij.** Had je twee kapiteinswissels en verzette je er één in de tijd, dan bleef de oude kapitein staan.
- **De clubexport telt een strafschopdoelpunt nu als doelpunt** (de app deed dat al), en "niet komen opdagen" staat in een eigen kolom naast "niet beschikbaar" — die twee zaten door elkaar.

---

## v1.3.1
### De oogjes gelden nu ook in het verslag, afwezigheden apart, en cijfers per ploeg
- **Wat je voor kijkers verbergt, blijft nu ook verborgen in het verslag en de PDF.** Zet je Kaarten op onzichtbaar, dan verdwijnen de kaartentellers én de kaarten met naam uit de tijdlijn — voordien stonden die er altijd, ook al had je ze net verborgen. Zet je Speelminuten op onzichtbaar, dan verdwijnt ook het keeperblok; dat zijn immers speelminuten. Voor jou als beheerder verandert er niets.
- **"Afgemeld" en "niet komen opdagen" staan nu apart** bij Geselecteerd: *"3× afgemeld · 1× niet komen opdagen"*. Tot nu telde dat als hetzelfde, terwijl het tornooiverslag die twee al apart hield.
- **Nieuw: "Cijfers per ploeg" in Clubbeheer.** Eén regel per ploeg met winst-gelijk-verlies, doelpunten voor en tegen, en de gemiddelde speeltijd van een speler in een wedstrijd waarin hij meedeed — plus een regel voor de club samen. Zo zie je in de app of er ergens iets scheefloopt, zonder eerst een Excel-bestand te openen. Het staat achter een knop, want het haalt de wedstrijden van alle ploegen op.
- **De wedstrijdfilter blijft niet meer hangen bij een andere ploeg.** Tikte je op de melding "N wedstrijden zijn niet afgesloten", dan stond de lijst gefilterd. Wisselde je daarna van ploeg, dan bleef die filter staan en zag je bij de nieuwe ploeg een halve lijst zonder te weten waarom. Nu gaat hij weg bij het wisselen — net als het rooster en de clubgegevens. De keuze tussen lijst en kalender blijft wel staan, dat is een voorkeur.
- **"Annuleren" bij Rugnummers en Spelernotities annuleert nu echt.** Die twee vensters schreven meteen weg, dus Annuleren draaide niets terug — en het gevolg was wisselvallig: soms werd je wijziging stil ongedaan gemaakt, soms werd ze definitief. Nu werk je in een kopie, en pas bij Opslaan gaat het naar de wedstrijd. Ook na "Alle nummers wissen" is Annuleren een echte uitweg.
- **De fair-playlijst zegt nu waarom iemand weinig minuten heeft.** Wie de wedstrijd verliet of pas onderweg bijkwam, kreeg een laag gemiddelde en klom daardoor naar de top van "minste speeltijd" — de lijst die juist toont wie meer kansen verdient. Die wedstrijden tellen nog steeds mee, maar er staat nu bij: *"1× vertrokken tijdens de wedstrijd"* of *"1× onderweg bijgekomen"*.
- **Een eenzijdige wissel staat weer in het verslag.** Komt iemand erbij zonder dat er iemand af gaat (of omgekeerd), dan viel die uit het wisselkader onder het velddiagram — en dan kwam die speler in de hele opstellingssectie niet voor. Nu staat er "—" aan de kant die leeg is.
- **Kleinere rechtzettingen.** Het afsluitvenster zei "corrigeer hieronder de werkelijke duur" ook wanneer er niets te corrigeren viel (het blok was al afgesloten); nu wijst het naar de juiste weg. Het getal bij "Events" telt wat er echt in de lijst staat. Een wedstrijd zonder locatie leest niet meer "undefined". Kom je op een livescherm van een wedstrijd die niet meer bestaat, dan staan er nu knoppen om weg te gaan. In de PDF kan de regel met de strafschopnemers weer netjes afbreken. En zes functies uit de vensters van vóór v0.57 zijn opgeruimd — die praatten tegen knoppen die niet meer bestaan.
- **Bewust niet gewijzigd:** de kapitein wijzigen blijft onder "Meer" en dus buiten de pauze. Dat staat nu ook zo in de code, zodat het niet per ongeluk "gerepareerd" wordt.

---

## v1.3.0
### Vier keuzes van Tim, en "Geselecteerd" meet nu wat het belooft
- **Kaarten kunnen nu ook bij 3v3 en 5v5.** Bij die spelvormen kon je live géén gele kaart geven, maar wél een rode via "Meer" — en achteraf allebei. De beperking gold dus enkel op het hoofdscherm en was daardoor vooral verwarrend.
- **Blessure staat in de eenvoudige knoppenrij.** "Blessure en dan wissel" is aan de zijlijn een van de meest voorkomende handelingen; die hoort niet achter "Meer". De uitleg bij die instelling beweerde trouwens al dat Blessure erin zat.
- **"Geselecteerd — X%" rekende het omgekeerde van wat het beloofde.** Het percentage keek alleen naar de wedstrijden waarvoor iets over een speler ingevuld was. Wie 5 van de 10 wedstrijden simpelweg niet gekozen werd, stond op **100%** — precies de speler die dat blok moet opsporen, zag er perfect uit. Nu is de noemer: alle wedstrijden van de ploeg **vanaf de eerste waarin hij voorkomt**. Wie in januari bij de ploeg komt, krijgt september niet als gemiste wedstrijd.
- **En dat houdt rekening met één speeldag over twee dagen.** Speelt de ene helft van je spelers bij ploeglabel A en de andere helft bij B — ook als dat de ene op zaterdag en de andere op zondag is — dan mist niemand een wedstrijd. Dezelfde regel geldt wanneer een speler meedoet bij een andere ploeg. Je hoeft daarvoor nergens een speeldag in te vullen: wie binnen één dag ervoor of erna in een selectie stond, was die speeldag opgesteld.
- **Wie niet komt opdagen, staat niet meer op het veld in het verslag.** Meld je iemand tijdens de wedstrijd als "toch niet aanwezig" (dat wist zijn speelminuten), dan bleef hij toch in de opstelling en op het velddiagram van het eerste kwart staan. Normaal pas je de opstelling meteen aan; dit is voor de keer dat je dat vergeet. Wie de wedstrijd **verliet** blijft wel staan — dat is een feit met minuten.

---

## v1.2.5
### Eén regel voor wie wat mag, en je notities blijven ook zonder verbinding
- **Kijkmodus werkte niet op een wedstrijd die niet in de cloud staat.** Op het livescherm, het verslag en het verloop bleven dan alle knoppen staan. Een deel weigerde stil, maar een ander deel deed het echt: de opstelling, de wissels, de kapitein en het afwezig melden. Nu geldt overal dezelfde regel als op het voorbereidingsscherm: geen gast, geen kijkmodus, en zonder verbinding mag alles wat live kan gebeuren.
- **Zonder verbinding zag je je notities niet meer.** De notitiekaart in het verslag, de notities per speler en de notities in de PDF hingen aan "verbinding nodig" — terwijl je aan de zijlijn wél notities kan schrijven. Je typte dus in het niets tot je weer bereik had. Nu staan ze er ook offline.
- **"Export" is voor wie de wedstrijd beheert.** Die knop stond voor iedereen op het verslag, en het bestand bevat de wedstrijd ongefilterd: jouw notities, de notities per speler en de reden van een afwezigheid — precies wat het scherm voor een kijker verbergt. **Delen en PDF blijven wel voor iedereen**: de PDF houdt zich aan jouw oogjes, en een ouder mag de uitslag doorsturen.

---

## v1.2.4
### Doelpunten die niet klopten met wat je zag
- **Het doelpuntvenster kon "eigen doel" tonen en een gewoon tegendoel opslaan.** Wisselde je van ploeg en terug, dan bleef het schakelaartje op "Eigen doel" staan mét de speler die je had aangeduid — maar er werd een gewoon tegendoel bewaard, zonder speler. De stand was gelijk, het verloop en de spelersstatistiek niet. Nu gaat dat deel van het venster mee terug wanneer je van ploeg wisselt.
- **Een eigen doel van de tegenstander stond in geen enkele doelpuntenlijst per blok.** Het telde wél mee in de stand, dus op de blokkaart sprong de tussenstand van 0-0 naar 1-0 met een streepje in de doelpuntenkolom. Nu staat het er, op het scherm en in de PDF.
- **"Opnieuw beginnen" liet twee dingen achter.** De opstelling die je voor het volgende kwart getekend had bleef staan, dus bij de eerste pauze van je nieuwe poging tekende de app de opstelling van de vorige — terwijl er tegelijk stond dat er niets te wijzigen was. En de gewiste gebeurtenissen werden niet als verwijderd gemarkeerd, waardoor ze bij twee beheerders op één wedstrijd konden terugkomen via de synchronisatie. Beide rechtgezet.

---

## v1.2.3
### Wisselen na een vertrek in de pauze, en naamgenoten in de clubexport
- **Meld je in de pauze iemand als vertrokken, dan kan je nu ook echt iemand inbrengen.** De app bood die wissel al aan, maar er gebeurde niets: je kreeg "X staat niet in de opstelling van het volgende kwart" en je ploeg bleef met één speler minder staan. De invaller neemt nu de plek over die de vertrokken speler net vrijmaakte. Staat daar intussen al iemand anders, dan zegt de app dat — in plaats van twee spelers op één plek te zetten.
- **De clubexport plakte naamgenoten uit verschillende ploegen samen.** Twee kinderen die allebei "Jonas Peeters" heten, één in U9 en één in U13, werden één regel met hun minuten, doelpunten en selecties bij elkaar opgeteld. In het tabblad dat juist de vraag "heeft dit kind genoeg gevoetbald?" moet beantwoorden, en in een bestand dat naar een bestuur gaat. Nu staan ze apart. Een speler die écht doorgeschoven is naar een andere ploeg (via "Spelers doorschuiven") blijft wél samengeteld, zoals bedoeld.

---

## v1.2.2
### Wat je tekent is wat er gebeurt
- **Het pauzeveld en de start liepen uit elkaar.** Je tekende de opstelling voor het volgende kwart, en toch stond er iemand anders op het veld na de start. Dat kon zodra het veld nog veranderde nadat je die opstelling getekend had — bijvoorbeeld: pauze, opstelling tekenen, dan "te vroeg gestopt" om het vorige kwart te hervatten, daarin nog wisselen, en dan starten. De app voerde dan een verouderd lijstje wissels uit in plaats van jouw opstelling. Het aantal spelers klopte wel, dus het viel niet op. Nu is de getekende opstelling altijd wat er gebeurt, en het pauzekaartje toont vanaf het begin van de pauze het juiste aantal wijzigingen.
- **Twee spelers op één plek na "geplande wissel nu doorvoeren".** Was de speler die eraf moest in werkelijkheid al gewisseld, dan kreeg de invaller diens oude plek — en daar stond intussen iemand anders. Nu weigert de app dat met een duidelijke melding in plaats van twee shirts op elkaar te zetten. Gevonden door de willekeurige testronde; deze fout zat er al langer in.
- **Een snel ingevoerde uitslag terugzetten naar "gepland" hield de doelpunten.** Het venster zei zelfs dat de wedstrijd "nooit gestart" was, wat voor een uitslag die je zelf ingaf niet klopt. Startte je haar daarna echt, dan begon het scorebord op 3-1. Nu zegt het venster wat er staat te gebeuren en verdwijnen die doelpunten mee — je selectie en opstelling blijven staan.

---

## v1.2.1
### De strafschoppenregel van v1.2.0 werkte niet
- **Wat er misging.** v1.2.0 beloofde dat een strafschoppenreeks alleen nog bij een gelijke stand getoond wordt. Die regel is toen op één plek gezet — een hulpfunctie die door **geen enkel scherm** gebruikt werd. Het beginscherm, het verslag, de PDF en "Deel score" haalden hun tekst elk apart op, dus in de app veranderde er niets: na een verlenging met een extra doelpunt las het verslag nog altijd "1-0 · pen. 4-3".
- **Nu.** Alle vier de plekken gebruiken dezelfde regel. Bij een gelijke stand staat de reeks er zoals altijd; is de stand niet gelijk, dan verdwijnt ze uit de uitslag, de zin "X wint na strafschoppen", de PDF en het gedeelde bericht.
- **De reeks blijft wel bewaard en bereikbaar.** Op het verslag blijft het blok met de strafschoppen staan — dat is de enige plek waar je ze kan aanpassen of wissen — met een regel erbij die zegt waarom ze niet bij de uitslag staat. Verdwijnt dat doelpunt weer, dan staat de reeks gewoon terug bij de uitslag.

---

## v1.2.0
### Het livescherm doorgelicht: de klok, de pauze en wie er nog meedoet
Eerste helft van de zijlijn-audit. De belangrijkste vondsten waren geen schoonheidsfoutjes maar
speelminuten die niet konden kloppen, en een scherm dat zichzelf tegensprak zodra je de klok stilzette.

- **Een blok korter zetten sleept de gebeurtenissen nu mee.** Je vergeet af te sluiten, er wordt op 30 minuten gewisseld, en bij het afsluiten zet je de werkelijke duur op 15. Tot nu bleef die wissel op 30 minuten staan: de uitgewisselde speler kreeg 30 minuten in een blok van 15, en de ingebrachte **min 15**. Nu schuift het einde mee, wordt wat erna valt op de slotminuut gezet, en zegt een melding hoeveel gebeurtenissen dat waren. Precies wat het venster "Duur aanpassen" op het verslag al deed.
- **De werkelijke duur is nu altijd in te vullen** bij het afsluiten van een blok, niet enkel bij een ruime overschrijding. Achttien minuten op een blok van vijftien was voordien niet recht te zetten. Bevestig je de voorgestelde waarde, dan verandert er niets.
- **Met de klok op pauze werkt het opstellingstabblad weer.** Tijdens een klokpauze kon je niet meer op het veld tikken en weigerde "Doorvoeren" met de melding dat er geen deel bezig was — terwijl de knoppen voor doelpunt, kaart en wissel gewoon bleven werken. Een stilgelegd spel is juist het moment om te wisselen.
- **Wie de wedstrijd verlaat, blijft zichtbaar.** Hij stond in geen enkele lijst meer: niet op het veld, niet op de bank, niet bij "Niet aanwezig". Nu staat hij onder **'Weg uit de wedstrijd'**, met zijn gespeelde minuten en een **Herstel**-knop. Voordien kon je een mistik alleen terugdraaien door het event op te zoeken bij Verloop.
- **Een blok kan niet meer starten terwijl het vorige nog openstaat.** Zo'n open blok bleef in de speeltijd doortellen tot nu — een blok dat nooit stopt.
- **De strafschoppenreeks staat alleen nog bij een gelijke stand.** Heropende je een wedstrijd voor een verlenging en viel er nog een doelpunt, dan las het verslag "1-0 · pen. 4-3". De reeks blijft wel bewaard: verdwijnt dat doelpunt weer, dan staat ze er weer.
- **Zonder verbinding werkt er meer.** Het pennetje om de duur van een afgesloten blok recht te zetten was offline weg (en dat is de enige plek waar dat kan), de twee waarschuwingen op het beginscherm over een doorlopende of vastzittende wedstrijd verdwenen precies langs de lijn, en een gedeeld verslag verloor stil zijn notities.
- **Teksten die niet meer waar waren.** "De klok stopt en je kan dit kwart niet meer hervatten" — terwijl daar sinds vorige week precies die knop staat. De belofte dat je "een dag lang" kan terugdraaien, terwijl die knop verdwijnt zodra je opnieuw start. Twee meldingen die je naar een knop "Positiewissel" stuurden die niet bestaat. Het kader "deze wedstrijd zit vast" dat altijd dezelfde oorzaak noemde, ook wanneer die niet klopte.
- **Kleinere rechtzettingen.** De klokknop toont wat je tik doet in plaats van de huidige stand, en verdwijnt bij een wedstrijd zonder blokduur (er valt dan niets af te tellen). Het ×-knopje naast een speler heet "Van het veld" zodra hij gespeeld heeft. In de pauze staat er nu bij welk deel de onderste opstelling hoort. De knoppen voor een snelle notitie en een gemarkeerd moment blijven in de pauze staan. Ná het eindsignaal kan je niemand meer afwezig melden — dat wiste zijn speelminuten.
- Onder de motorkap: negentien klok- en afsluitfuncties kregen de rolcontrole die er nog niet stond (in kijkmodus opende "Wedstrijd afsluiten" nog een venster), en een dode dubbele functie is opgeruimd.

---

## v1.1.17
### Het ploegscherm is weer twee schermen: de ploeg apart van het beheer
- **Wat er misging.** Sinds v1.0.4 stond alles over een ploeg op één lange lijst: de spelers en de standaardinstellingen, maar daaronder ook uitnodigen, leden, de ploegnaam, de kijkmodus en de prullenmand. Het dagelijkse werk (spelers bekijken of aanpassen) stond zo tussen handelingen die je een paar keer per seizoen doet. Scrollen om bij je spelers te komen, en telkens langs knoppen die je daar niet nodig had.
- **Nu.** Twee schermen, en de knop waarmee je erin gaat bepaalt welk:
  - De tegel **'Ploeg'** op het startscherm brengt je bij **de ploeg zelf**: de spelers, de trainers en ploegverantwoordelijken, en de standaardinstellingen.
  - De groene knop **'Beheer'** rechtsboven brengt je bij **wie toegang heeft en de ploeg als geheel**: uitnodigen, leden, naam wijzigen, kijkmodus en prullenmand.
  Onderaan elk van de twee staat de knop naar het andere, dus je moet niet eerst terug naar het startscherm. Het blijft ook één navigatiestap: de terugknop brengt je meteen terug naar waar je vandaan kwam, niet door twee versies van dezelfde ploeg.
- **Bewerken begint nu met een potlood.** Op het ploegscherm stond een kaartje met het woord 'Aan'. Dat las als een schakelaar die al aanstond, terwijl het juist de knop was waarmee je begint te bewerken. Nu staat er een potlood; het kleurt groen zolang bewerken aanstaat.
- Een kijker merkt niets van de splitsing: voor hem bestaat het beheerdeel niet en gaat zowel de tegel als de knop rechtsboven naar de ploeg met de spelers.
- De handleiding is meegegaan (de pagina's over het ploegscherm en over beheerder zijn).

---

## v1.1.16
### Een vergeten wedstrijd is nu te zien, en de kalender zegt hetzelfde als de lijst
- **Wat er misging.** Een wedstrijd waarvan de datum voorbij is en die je nooit hebt afgesloten, zag er
  in de lijst **precies uit als een gewone geplande**: dezelfde oranje rand, dezelfde badge "Gepland".
  Net het geval waar jij nog iets moet doen, was dus niet te onderscheiden van iets dat nog komt.
- **Nu** hebben alle vijf de toestanden hun eigen kleur: live rood, gepland oranje, **niet afgesloten
  geel** met de badge *Niet afgesloten*, gespeeld groenblauw, geannuleerd grijs. Geel leest als "dit
  wacht op jou"; grijs blijft van geannuleerd, want dat gaat niet door.
- **Op het beginscherm** stond een blok met de twee recentste van die wedstrijden — je zag nooit
  hoeveel er in totaal open stonden. Nu staat er één regel met het **echte aantal**: *"3 wedstrijden
  zijn niet afgesloten"*, met de reden erbij (ze tellen niet mee in de statistieken) en een knop naar
  **alle** wedstrijden in die toestand. Op die lijst staat meteen het filterteken *Niet afgesloten* met
  de teller, dus je ziet waarom ze korter is en zet hem met één tik uit.
- **De kalenderstippen zeiden iets anders dan de lijst.** Gepland was daar blauw en gespeeld grijs,
  terwijl de lijst oranje en groenblauw gebruikt. Nu volgen de stippen exact de lijst, met een gele
  stip voor niet afgesloten. De legende krijgt die regel erbij — net als bij geannuleerd en tornooi
  alleen wanneer zo'n wedstrijd er ook echt is.

## v1.1.15
### Twaalf kleine dingen uit de audit, in één keer
- **De man van de match bleef niet.** Opende je een gespeelde wedstrijd opnieuw om bijvoorbeeld een
  rugnummer recht te zetten, dan was die keuze daarna weg. Nu blijft hij staan zolang die speler in de
  selectie zit.
- **Minder blokken kiezen liet een plan achter dat je niet meer zag.** Ging je van vier kwarten naar
  twee helften, dan bleven de opstelling en de wissels van kwart 3 en 4 onzichtbaar bestaan en doken ze
  weer op als je later terugschakelde. Die vallen nu weg, met een melding die zegt wat er verdween.
- **Bij de formatiekeuze staat nu wat ze doet:** *"Een formatie licht de plekken op die erbij horen en
  bepaalt de positienummers. Ze verplaatst niemand."* Voordien koos je er een en gebeurde er zichtbaar
  niets.
- **Niemand in het doel** geeft nu een melding zodra het veld verder vol is — geen blokkade, want bij
  3v3 speel je soms zonder keeper, maar anders merk je het pas aan lege keeperminuten.
- **Rugnummers zijn positief:** het veld aanvaardde "-5" en "0". En de waarschuwing over dubbele
  nummers verschijnt nu meteen in plaats van één handeling later.
- **In de planner kan je iemand naar de bank sturen:** tik een speler op het veld twee keer aan. Dat
  kon nergens — een plan kon alleen groeien — terwijl een blok met een man minder wél te spelen is.
- **"+ Speler van andere ploeg" verdwijnt** wanneer er geen andere ploeg is; die gaf daar enkel een
  foutmelding. *"+ Losse speler"* blijft.
- **Het lege beginscherm** zei "tik dan +" terwijl die knop daar niet stond. Nu staat er een knop
  **Ploeg aanmaken**, en een kijker krijgt geen instructies meer die hij niet kan uitvoeren.
- **De terugpijl in het importscherm verlaat het scherm**, zoals overal in de app. Terug naar de
  bestandskeuze doet de knop onderaan, die dat ook letterlijk zegt.
- **Een kijker ziet nu het verschil** tussen "het plan is verborgen" en "er is nog geen opstelling".
- **Alleen-lezen volgt één regel** op het voorbereidingsscherm en in het livescherm; die liepen net
  iets uiteen, waardoor de knop *Wedstrijdplan (PDF)* soms op het ene scherm stond en op het andere niet.
- **De keuzelijsten in de import komen uit de centrale lijsten**, dus een nieuwe wedstrijdvorm of
  soort verschijnt daar automatisch mee.
- En de uitleg in de planner belooft geen **positiewissels** meer om vooraf te plannen — die knop is er
  sinds v0.58.0 uit. Ook de handleiding is bijgewerkt.

## v1.1.14
### "Startopstelling herplaatsen" wiste je opstelling in plaats van ze te tonen
- **Wat er misging.** Dat venster kwam uit het oude model, waarin een formatie de plaatsen vastlegde.
  Het opende met **niemand** op het veld — het zocht wie waar stond via coördinaten die sinds het
  rooster van 26 plekken niet meer bestaan. En het opslaan wist eerst alle posities en zette daarna
  enkel de toewijzingen terug: één tik op Opslaan veegde dus de volledige startopstelling van een
  **gespeelde** wedstrijd weg, inclusief de vastgelegde aftrap. Nagemeten: 8 spelers met een plaats
  werden 0.
- **Nu** werkt het met dezelfde 26 plekken en hetzelfde tikken als de planner en het livescherm. Het
  opent met **iedereen op zijn eigen plek**: je tikt een speler en dan een andere plek, of twee spelers
  om ze te laten ruilen. Opslaan weigert zolang er iemand naast het veld staat, dus dit venster kan
  nooit meer een opstelling wissen.
- **En de vraag na een formatiewijziging doet weer wat ze belooft.** *"Wil je de spelers ook op de
  aanbevolen plekken van deze formatie zetten?"* zet ze nu echt op de plekken die bij die formatie
  horen — dezelfde die de wizard oplicht. Heeft de nieuwe formatie minder plaats in een linie (2-3-2
  heeft twee verdedigers, 3-3-1 drie), dan komt die speler op de dichtstbijzijnde vrije plek en zie je
  hem daar staan; één tik zet hem waar jij hem wil.
- Is er al gewisseld, dan blijft de knop verborgen met dezelfde uitleg als voordien: de startopstelling
  is dan het fundament van de kwart-reconstructie en wordt niet meer herplaatst.

## v1.1.13
### De ploegfilter in de agenda deed niets
- **Wat er misging.** Koos je in de agenda een andere ploeg, dan bleef die keuze in de lijst staan
  alsof ze toegepast was — maar er veranderde niets op het scherm. De filter werd wel gezet, alleen
  werd het verkeerde scherm herladen (het beginscherm in plaats van de agenda), en dat keert stil terug.
- **Nu** herlaadt de agenda zichzelf. Nagemeten met wedstrijden op 5, 12 (ploeg A) en 19 september
  (ploeg B): alle ploegen markeert de drie dagen, ploeg A de eerste twee, ploeg B enkel de 19de. En de
  agenda blijft staan op de maand waar je naar kijkt.

### Een actieve filter kon onzichtbaar zijn
- **Wat er misging.** Het filterteken op de wedstrijdenlijst verscheen pas vanaf vier wedstrijden,
  terwijl het filteren zelf altijd werkt. Met drie wedstrijden waarvan de filter er twee verborg, toonde
  de lijst er één en stond er nergens een teken, een kaartje of een teller — terwijl de tegel op het
  beginscherm er drie meldde. Dat leest als "mijn wedstrijden zijn verdwenen".
- **Nu** staat het filterteken er zodra er een filter aan staat, met de teller erbij: *"1 van 3"*.
  (Filterde je álles weg, dan stond er al een knop "Filter wissen"; dit gat zat in het geval dat er nog
  iets overblijft.)

## v1.1.12
### Bij een half gevuld veld opende het plan van een ándere wedstrijd
- **Wat er misging.** Zette je in een nieuwe wedstrijd nog niet genoeg spelers op het veld en tikte je
  *Verder → wissels en volgende kwarten*, dan weigerde de app terecht ("zet 8 spelers op het veld") —
  maar opende ze daarna alsnog de planner. En die hoorde bij de wedstrijd die je daarvóór open had,
  volledig bewerkbaar en met een Opslaan-knop. Je was een nieuwe wedstrijd aan het inplannen en zat
  plots in het plan van die van vorige week.
- **Nu** gaat de planner alleen open wanneer het opslaan echt gelukt is; bij een half gevuld veld blijf
  je gewoon in de wizard staan met de melding.

## v1.1.11
### Het telletje bij "Opstelling en wissels" telde dubbel
- **Wat er misging.** Dat telletje telde *alle* geplande wissels, ook die zonder vast kwart — en die
  staan in een eigen knop daaronder. Twee losse wissels plus één in kwart 2 las dan als
  *"(3 wissels)"* naast *"(2)"*: vijf voor drie. Wie op de eerste knop drukte om die drie na te kijken,
  vond er één, want daar staat per kwart alleen wat aan dat kwart hangt.
- **Nu** telt die knop enkel wat je in dat scherm ook ziet: *"(1 klaargezet)"* naast *"(2)"* — samen
  drie. Het woord is ook eerlijker: in oudere wedstrijden kan er een positiewissel tussen zitten, en
  dan klopte "wissels" niet. Waar het totaal wél juist was, blijft het staan: *Selectie wissen* zegt
  nog steeds hoeveel geplande wissels er in totaal verdwijnen.

## v1.1.10
### De planningskaart zegt nu waar een opstelling vandaan komt
- **Wat er misging.** Bladerde je in het voorbereidingsscherm naar een kwart waarvoor je géén eigen
  opstelling had ingegeven, dan toonde de kaart een veld waarin de geplande wissels van de vorige
  kwarten **al doorgevoerd** waren. Maar geplande wissels gaan nooit vanzelf af. Wat je aan de trainer
  liet zien als "zo begint kwart 3" was in werkelijkheid "zo begint kwart 3 als je die wissel in kwart
  2 ook echt doorvoert" — en er stond geen woord bij. Nagemeten: de kaart toonde de invaller, en wie
  die wissel niet doorvoerde begon kwart 3 met de speler die er nog stond.
- De app zelf doet het wél correct: het pauzescherm toont altijd de werkelijkheid, en een niet
  doorgevoerde wissel blijft klaarstaan. Alleen die kaart, dagen eerder, beloofde iets anders.
- **Nu** staat onder elk veld waar die opstelling vandaan komt: *"De opstelling waarmee je aftrapt"*,
  *"Eigen opstelling — de app zet ze klaar bij het einde van kwart 1"*, of *"Volgt kwart 2, met de
  wissels die je onderweg doorvoert — geplande wissels gaan niet vanzelf af"*. Een kwart met een eigen
  opstelling krijgt in de titel een ● , hetzelfde teken als in de planner, zodat je bij het bladeren
  ziet welke kwarten je zelf hebt ingevuld.
- **Enkel de weergave**: aan de berekening van die opstellingen en aan wat er bij een kwartovergang
  gebeurt is niets gewijzigd.

## v1.1.9
### Het importscherm kon de app doen stilvallen
- **Wat er misging.** De knop *Kalender importeren* is verborgen wanneer je niet mag beheren, maar via
  de terugknop van je telefoon kwam je er wél. Het scherm zette dan geen toestand op en liep vast
  midden in het tekenen: er veranderde niets op het scherm, terwijl de app dacht dat je op het
  importscherm stond. **Vanaf dat moment crashte élke hertekening** — een lopende wedstrijd werd niet
  meer bijgewerkt, meldingen verschenen niet meer, wijzigingen van een ander toestel bleven onzichtbaar.
  De app leek bevroren. Nog eens op de terugknop tikken bracht je eruit, maar niets wees je daarop.
- Dit gebeurde in elke situatie waarin je niet mag beheren: **geen verbinding** (het meest
  waarschijnlijke: thuis inlezen, aan het veld je bereik verliezen, terugknop tikken), kijkmodus, of
  als kijker. Een gast kwam er al niet, want daar bestond die poortwachter wél.
- **Nu** stuurt de app je naar de wedstrijdenlijst, net zoals ze dat al deed voor het spelerdetail van
  een kijker. En het tekenen heeft een vangnet: zonder toestand krijg je een gewoon scherm met een weg
  terug in plaats van een vastgelopen app.

### Een kalender inlezen kan niet meer zonder ploeg
- **Wat er misging.** De import wachtte niet tot de spelers van je ploeg binnen waren — de knop
  *+ Nieuwe wedstrijd* doet dat wel. Was de ploegenlijst nog leeg, dan werden alle wedstrijden
  weggeschreven **zonder ploeg**, met "Ploeg" als naam. Elke lijst filtert op de ploegnaam, dus die
  wedstrijden stonden daarna nergens meer op het scherm — terwijl de melding zei dat het gelukt was.
  Het slot dat dit had moeten tegenhouden liet juist dat geval door.
- **Nu** wacht het importscherm met dezelfde melding als bij een nieuwe wedstrijd, en wordt er zonder
  ploeg niets weggeschreven: *"Maak eerst een ploeg aan — een wedstrijd hoort altijd bij een ploeg."*

## v1.1.8
### Een kalenderimport is nu terug te draaien
- **Wat er misging.** Het inlezen van een kalender schreef in één keer nieuwe wedstrijden weg en werkte
  bestaande bij, zonder bevestiging vooraf en zonder enig spoor achteraf. Verkeerd bestand of verkeerde
  ploeg gekozen? Dan moest je dertig wedstrijden één per één openen en verwijderen, en bij de
  bijgewerkte wedstrijden waren de oude datum, het oude uur en het oude terrein definitief weg.
- **Nu** staat er na een import een balk bovenaan de wedstrijdenlijst — *"Kalender ingelezen — 3
  wedstrijden toegevoegd · 2 bijgewerkt"* — met **Import ongedaan maken**. Aangemaakte wedstrijden
  verdwijnen weer, bijgewerkte krijgen hun tegenstander, datum, uur, thuis/uit, terrein en
  agendanummer terug. Zelfde vorm en dezelfde 24 uur als het ongedaan maken van *Meerdere aanpassen*,
  en alleen bij de ploeg waar de import gebeurde.
- **Werk gaat nooit verloren aan zo'n ongedaan-maken.** Een ingelezen wedstrijd waar je intussen aan
  werkte — een selectie ingegeven, of ze zelfs al gespeeld — blijft staan; alleen de nog lege
  wedstrijden verdwijnen. De melding zegt hoeveel er echt weg zijn.

### "Alles aan" laat gespeelde wedstrijden staan
- **Wat er misging.** Een bestaande wedstrijd stond bij het inlezen terecht standaard uit, maar
  *Alles aan* zette zonder onderscheid álles aan — ook een wedstrijd die al gespeeld was, met verslag
  en gebeurtenissen. Het kaartje zei enkel "Staat er al", niet dat er een verslag aan hing. En de
  koppeling op het agendanummer vindt zo'n wedstrijd ook terug wanneer de **datum** in het bestand
  verschoven is: nagemeten ging een afgesloten wedstrijd van 6 september naar 5 juli, met haar 1-0 en
  haar drie gebeurtenissen erin. Verschuift zo'n datum over 1 juli, dan valt die wedstrijd in een
  ander seizoen en verdwijnt ze uit de statistieken waar ze hoorde.
- **Nu** staat op het kaartje *"Staat er al · gespeeld"* (of *"· loopt nu"*), en laat *Alles aan* die
  regels uit staan, met een melding erbij. Wil je er toch één bijwerken, dan vink je ze zelf aan.

## v1.1.7
### De ploeg van een wedstrijd staat vast
- **Wat er misging.** Bij *Bewerken → Info bewerken* kon je in de keuzelijst **Eigen ploeg** een andere
  ploeg kiezen. De wedstrijd verhuisde dan wel, maar de selectie niet: een wedstrijd van ploeg B met
  de spelers van ploeg A erin, zonder één vraag of melding. Je merkt dat pas veel later, en dan als
  twee losse raadsels — de wedstrijd is uit de lijst van ploeg A verdwenen, en in de cijfers van ploeg
  B staan spelers die daar niet spelen.
- Dezelfde handeling had bovendien twee tegengestelde uitkomsten: via *Volgende* wiste de app de hele
  selectie en bouwde ze opnieuw op met de nieuwe ploeg, via *Opslaan* bleef de oude selectie staan.
  Beide zonder een woord.
- **Nu** staat de ploeg bij het bewerken als tekst in plaats van als keuzelijst. Hoort een wedstrijd
  bij een andere ploeg, dan verwijder je ze en maak je ze opnieuw aan bij die ploeg. De rest van de
  app deed dat al zo: bij *Meerdere aanpassen* staat de ploeg bewust niet tussen de velden die je kan
  wijzigen.
- **Ook geen keuzelijst wanneer er niets te kiezen valt.** Je maakt een wedstrijd altijd binnen de
  ploeg die open staat, en in cloudmodus bevat die lijst enkel je actieve ploeg — dus stond er een
  keuzelijst met één regel. Vanaf nu enkel de naam. Met meerdere ploegen op één toestel blijft de
  keuzelijst, anders kan je geen wedstrijd voor de tweede meer aanmaken.

## v1.1.6
### Zonder verbinding kan je nu écht een wedstrijd volgen
> Deze wijziging kwam uit de feature-audit en liep over twee commits: de schermen in v1.1.5, en de
> functie waar ze op rekenen in v1.1.6. Tussen die twee stond het livescherm even stil — twee sessies
> werkten tegelijk in dezelfde map en de helft van de wijziging kwam eerst. Meteen hersteld.

- **Wat er misging.** Op een veld zonder bereik stonden alle knoppen er nog, maar een hele reeks deed
  **stil niets** — geen venster, geen melding. Gemeten: een speler op het veld aantikken om hem te
  verzetten, *"Volgens plan"*, een geplande wissel toevoegen of bewerken, de blokduur van een kwart
  rechtzetten, *"Toch nog niet gestart"*, *"Opnieuw beginnen"*, een doelpunt naar een ander kwart
  verplaatsen en *"Strafschoppenreeks toevoegen"* op het verslag. Het planningsblok zei zelfs
  *"enkel zichtbaar voor ploegbeheerders"* — tegen de ploegbeheerder.
- De oorzaak: het **scherm** besliste met "is dit een cloudwedstrijd waarvan ik geen beheerder ben"
  (zonder verbinding onwaar, dus de knoppen stonden er) en de **knop zelf** met "mag ik beheren"
  (zonder verbinding altijd onwaar). Die twee zijn nu gelijkgetrokken voor alles wat bij het verloop
  van een wedstrijd hoort.
- **Nu** werkt alles wat tijdens een wedstrijd gebeurt ook zonder verbinding: starten, doelpunten,
  wissels, kaarten, penalty's, blessures, kwarten starten en afsluiten, de opstelling in de pauze,
  het plan per kwart, de strafschoppenreeks, en afsluiten. Alles blijft lokaal en wordt gesynct zodra
  er weer verbinding is — dat werkte al zo en is niet gewijzigd.
- **Wat bewust dicht blijft**, want dat hoort bij beheren en niet bij een wedstrijd volgen: de
  wedstrijdgegevens wijzigen, annuleren en verwijderen. Op het voorbereidingsscherm verdwijnen die
  drie knoppen nu zonder verbinding, met één regel uitleg in de plaats: *"Geen verbinding — je kan de
  wedstrijd starten, volgen en de opstelling ingeven."* Voordien stonden ze er en deden Bewerken en
  Annuleren niets, terwijl **Wedstrijd verwijderen als enige gewoon doorging**. Dat gat is dicht:
  verwijderen weigert nu met uitleg, ook wanneer het langs een andere weg wordt aangeroepen.
- **Een kijker kan hierdoor niets extra.** Nagemeten in kijkmodus: veld aantikken, "Volgens plan",
  geplande wissels, opnieuw beginnen en verwijderen zijn alle vijf geweigerd.

## v1.1.5
### Een ploeg verwijderen kan enkel nog vanuit Clubbeheer
- **Wat er misging.** De knop *Ploeg verwijderen* stond onderaan het ploegscherm, tussen de
  dagelijkse handelingen. Archiveren stond ergens anders, in Clubbeheer. Twee knoppen die allebei
  "deze ploeg moet weg" betekenen, op twee plaatsen — en de gevaarlijkste van de twee stond op de
  plek waar je elke week komt.
- **Nu.** Aanmaken, archiveren en verwijderen staan alle drie in **Clubbeheer**, naast elkaar bij
  de ploeg. Op het ploegscherm staat geen van beide meer.
- **Verwijderen is grijs voor een clubbeheerder.** Enkel de maker van de app kan een ploeg
  definitief wissen — dat stond al zo in de databankregels, maar was in de app niet te zien. Tik je
  er toch op, dan zegt de app waarom en wijst ze je naar Archiveren, waar alle gegevens bewaard
  blijven. Geen dode knop dus.
- Verwijdert de eigenaar een ploeg die hij zelf volgt, dan verdwijnt ze nu meteen uit "Jouw
  ploegen" in plaats van bij de volgende opstart.

---
## v1.1.4
Twee punten uit de feature-audit van het klaarzetten van een wedstrijd.

### Het terugpijltje gooide een gewijzigd uur stil weg
- **Wat er misging.** Bij *Bewerken → Info bewerken* pas je het uur, de tegenstander, de datum, het
  terrein of de scheidsrechter aan, en je tikt het pijltje links boven in plaats van *Opslaan*. Er
  kwam geen vraag en alles was weg. De vraag *"Wijzigingen niet bewaren?"* bestond wél — maar ze
  vergeleek alleen wat de app al in het geheugen had, en wat je op de eerste stap intikt komt daar
  pas in op het moment dat je doorklikt of opslaat. Van alle velden op die stap werd er dus precies
  één opgemerkt (de wedstrijdvorm), bij toeval.
- **Nu** leest de app vóór die vergelijking uit wat er op het scherm staat. Alle velden van stap 1
  tellen mee: tegenstander, ploeg-label, datum, uur, thuis/uit, wedstrijdvorm, aantal blokken,
  blokduur, soort, speeldag, truikleur, scheidsrechter en terrein. De vraag die al bestond verschijnt
  nu wanneer ze hoort te verschijnen, en niet wanneer je enkel kwam kijken.
- **Ook bij een nieuwe wedstrijd.** Daar keek dezelfde vraag enkel naar de tegenstander en de
  selectie: had je alleen een datum, een terrein of een scheidsrechter ingevuld en tikte je terug,
  dan ging dat zonder vraag verloren. Nu geldt daar dezelfde regel.
- Trainer en ploegverantwoordelijke blijven bewust buiten die vergelijking: die komen uit een eigen
  kiezer, en een vraag die verschijnt terwijl je niets wijzigde is erger dan een gemiste vraag.

### "Gebruik als template" liet je opstelling achter
- **Wat er misging.** De knop op een afgesloten wedstrijd nam de wedstrijdgegevens en de selectie mee,
  maar de opstelling niet: de nieuwe wedstrijd opende met een leeg veld en iedereen op de bank.
  Nochtans probeerde de code die opstelling wél terug te zetten — ze zocht de plaats van een speler op
  door in de gekozen formatie een plek met exact dezelfde coördinaten te zoeken. Sinds het rooster van
  26 plekken (v0.34.0) staan spelers op roosterplekken en de formaties op hun eigen coördinaten: die
  vallen in **geen enkele** formatie van geen enkel formaat samen, dus die zoektocht mislukte altijd.
- **Nu** gebeurt het zoals bij *Info bewerken*, waar het al goed ging: eerst de bewaarde plek van de
  speler, en anders de dichtstbijzijnde plek **binnen zijn eigen linie** — zo wordt een verdediger
  nooit stil een middenvelder. Staan er twee op dezelfde plek, dan houdt de eerste ze en gaat de
  tweede naar de bank.
- Dezelfde fout zat in **"Kloon als nieuwe tornooiwedstrijd"**; die is meteen meegenomen. De regel
  staat nu op één plaats in plaats van drie keer apart.

## v1.1.3
### De handleiding-screenshots tonen de nieuwe schermen
- `05_beheer` toonde nog het oude "Beheer"-scherm. Het ploegscherm is te lang voor één
  telefoonhoogte, dus het zijn er nu **twee**: de kop met "De ploeg" en de spelers, en daaronder
  "Mensen met toegang" en "Deze ploeg".
- `13_cobeheer_aanvragen` (ploegbeheer aanvragen) verwees ook naar dat oude scherm; het staat nu
  onderaan het ploegscherm, bij "Meedoen".
- Nieuw beeld **`26_jouw_ploegen`** bij de pagina *Rollen in de app*: de ploegen gegroepeerd per
  club, met de groene clubbalk en de rol achter elke ploeg. Die pagina had nog geen enkel beeld,
  terwijl ze net over clubs en rollen gaat.

---
## v1.1.2
Eerste drie punten uit de feature-audit van het klaarzetten van een wedstrijd: staat elke knop op een
logische plek, en doet hij wat zijn label belooft?

### Het veld liet twaalf spelers toe voor acht plaatsen, en zei dat het klopte
- **Wat er misging.** In de opstelling van een nieuwe wedstrijd werd er bij het plaatsen niet geteld.
  Op een 8v8-wedstrijd kon je er twaalf op zetten: de teller sprong naar **12/8** in het **groen**,
  met eronder "Het veld is vol", en het opslaan bewaarde alle twaalf als basisspeler. Geen woord.
  Dat gebeurt makkelijker dan het lijkt: wijzig je het formaat van 11v11 naar 8v8, dan blijven de
  spelers staan die je al geplaatst had.
- **Waarom dat telt.** De aftrapopstelling is de bron voor de speelminuten, de keeperminuten, het
  plan voor de volgende blokken en het verslag. Twaalf man daar laat alles daarna met twaalf rekenen.
- **Nu.** Hetzelfde als in het pauzescherm — het mag, maar je ziet het: de teller wordt oranje en er
  staat *"Je zet 12 spelers op een veld voor 8. Dat mag — je speelt dan met 4 spelers te veel — maar
  kijk het even na."* Onder de bank staat hoe je iemand er weer af haalt. Spelen met zeven man voor
  acht plaatsen blijft groen en zonder waarschuwing, want dan zijn er gewoon niet meer spelers.

### Een andere formatie kiezen wiste je hele plan per blok
- **Wat er misging.** Koos je in de opstelling een andere formatie, dan verdwenen de opstellingen die
  je voor de volgende blokken had ingegeven — met enkel een mededeling áchteraf en geen weg terug.
  Terwijl die formatiekeuze zichtbaar niemand verplaatst: sinds v0.34.0 licht ze enkel plekken op.
- **Waarom het niet meer nodig was.** De reden ervoor ("die opstellingen staan op de plaatsen van de
  oude formatie") gold in het oude model. Elke planregel draagt nu zijn eigen roosterplek en
  coördinaten, en die zijn formatie-onafhankelijk.
- **Nu.** Het plan blijft staan. Wat wél van de formatie afhangt is het *nummer* van een plek — dat
  is een label — en dat wordt bij een formatiewijziging hernummerd.

### Te veel spelers na een rode kaart: nu ook zichtbaar in de pauze
- Na een rode kaart speel je met een man minder, maar een plan van vóór die kaart zet er nog een vol
  veld klaar. De waarschuwing daarover stond enkel op het tabblad *Opstelling*, en de vraag pas op
  het moment dat je op *Start* tikte.
- **Nu** staat het ook op het pauzekaartje bij *Wat kan je doen in de pauze?* — *"Er staan nu 8
  spelers op het veld voor 7 plaatsen — je begint met een man te veel."* — en in de melding waarmee
  de app het plan klaarzet.

### "Namen, nummers & notities" opende een venster dat spelers verwijderde
- **Wat er misging.** Het menu-item beloofde rugnummers, kapitein en een notitie. Het venster dat
  openging heette *Spelers bewerken* en had per speler ook een **×** die hem onmiddellijk uit de
  wedstrijd gooide, zonder bevestiging. **"Annuleren" bracht hem niet terug**: het venster schreef
  rechtstreeks in de wedstrijd, dus de eerstvolgende gewone handeling — de wedstrijd starten, bijvoorbeeld —
  maakte het definitief, en het plan hield een regel over voor een speler die niet meer bestond.
- Datzelfde venster had ook een keuzelijst voor de **lijn** van een speler en een veld voor zijn
  **positienummer**. Dat zijn sinds v0.34.0 afgeleiden van zijn plek op het veld. Ze los overschrijven
  liet hem staan waar hij stond maar verlegde zijn plek naar een andere lijn — waardoor een geplande
  positiewissel hem niet meer vond en de aftrap een plek vastlegde die niet overeenkwam met het veld
  dat je zag.
- **Nu.** Het venster heet zoals het menu-item en bevat precies dat: naam, rugnummer, notitie,
  kapitein. Wie meespeelt regel je via *Selectie*, twee regels hoger in hetzelfde menu. En het werkt
  op een werkkopie, dus **"Annuleren" annuleert echt**. Een speler die je in dít venster toevoegde,
  kan je er ook weer uit halen — dat is je eigen tik terugnemen.

## v1.1.1
### "Ploeg toevoegen" beloofde iets wat die knop niet doet
- **Wat er misging.** Op *Jouw ploegen* stond het kopje **Ploeg toevoegen** met daaronder de knop
  *Ploeg bekijken via code*. Je voegt daar geen ploeg toe — je gaat er een volgen met een code die
  je van een trainer kreeg. Een nieuwe ploeg **maken** gebeurt in Clubbeheer. Erger nog: dezelfde
  handeling had drie namen — de kop zei "toevoegen", de knop "bekijken" en het venster "vervoegen".
- **Nu.** Overal hetzelfde woord: **volgen**. Het kopje heet *Een ploeg volgen*, de knop *Ploeg
  volgen via code*, het venster *Ploeg volgen*. Eronder staat wat de knop doet, en wie een club
  beheert leest erbij dat een nieuwe ploeg in Clubbeheer gemaakt wordt.
- De handleiding zei bij een uitnodigingslink "tik op 'Ploeg vervoegen'", maar die knop bestaat
  niet: via een link of QR-code komt de ploeg vanzelf in je lijst. Rechtgezet.

### De handleiding volgt de nieuwe schermen
- Vier pagina's beschreven nog de oude indeling: *Als kijker* (sprak van een tegel "Spelers" — die
  heet al sinds v0.45.0 "Ploeg"), *Ploegbeheer aanvragen*, *Ploeg & spelers beheren* (verwees naar
  een scherm "Ploeg bewerken") en *Als clubbeheerder* ("Mijn club beheren", "Beheren" bij een ploeg).
- Nieuw stukje **"Waar je terechtkomt"** bij het aanmelden: het scherm *Jouw ploegen* stond nergens
  beschreven, terwijl je daar na het inloggen landt.
- "Wedstrijd verwijderen" heette "verwijder definitief" — dat klopt niet meer sinds er een
  prullenmand is. Idem bij een tornooi.

---
## v1.1.0
De beheerschermen zijn herschikt. Wat verspreid stond over negen plaatsen, staat nu op vier
schermen — één per niveau: jij, de ploeg, de club, de app.

### Het woord "Beheer" is als knopnaam verdwenen
- **Wat er misging.** Er waren drie knoppen die "Beheer" of "Beheren" heetten en telkens iets
  anders deden. Erger nog: één en hetzelfde scherm had twee inhouden. Kwam je er via het
  homescherm, dan beheerde je de actieve ploeg; kwam je via de ploegenlijst, dan zag je de
  eigenaarstools. Welke van de twee je kreeg, hing af van een onzichtbare schakelaar.
- **Nu.** Elk scherm zegt waarover het gaat: **Ploeg**, **Clubbeheer**, **App-beheer**,
  **Instellingen**.

### Eén ploeg staat niet langer over twee schermen verdeeld
- **Wat er misging.** De spelers en de standaardinstellingen zaten in het ene scherm, de mensen
  (uitnodigen, leden, rollen) en de ploegnaam in het andere. Er stond letterlijk in het ene scherm
  dat je voor de ploegnaam elders moest zijn.
- **Nu.** Het ploegscherm heeft drie blokken in de volgorde waarin je ze nodig hebt: **De ploeg**
  (spelers, trainers, standaardinstellingen), **Mensen met toegang** (uitnodigen, leden) en
  **Deze ploeg** (naam, kijkmodus, prullenmand, verwijderen).

### "Teruggevonden" heet Prullenmand en staat er altijd
- **Wat er misging.** De knop verscheen alleen met internetverbinding én als beheerder, in een
  scherm dat er anders uitzag naargelang waar je vandaan kwam. Ze leek dus eens wel en dan weer
  niet te bestaan. Bovendien toonde één lijst drie verschillende dingen door elkaar.
- **Nu.** De **Prullenmand** hangt aan de ploeg en staat er altijd, ook leeg. Verwijderde ploegen
  zijn iets anders en zitten in App-beheer.

### De clubkop is de ingang naar je club
- Op **Jouw ploegen** staan de ploegen gegroepeerd per club. Beheer je die club, dan is de hele
  clubbalk de knop naar Clubbeheer — niet meer een knopje van dertig pixels pal boven een ploegrij,
  waar je met een vinger aan de zijlijn steevast naast tikte.
- Wie een club beheert zonder er zelf een ploeg van te volgen, houdt de knop onderaan.

### Kleinere dingen
- Op het clubscherm heet "Beheren" bij een ploeg nu **Openen**, en het brengt je naar het
  ploegscherm zelf in plaats van naar een beheerscherm.
- Het clubscherm toont wie de club beheert. Aanstellen blijft bij de maker van de app.
- De chip rechtsboven op het homescherm zegt **Ploeg** in plaats van "Beheer".
- In Instellingen heet "Back-up & herstel" nu **Dit toestel**, met erbij wat er in dat bestand zit
  en waar je moet zijn om iets verwijderds terug te halen. Dat botste met de Prullenmand: het één
  is overzetten naar een ander toestel, het ander is terughalen.

---
## v1.0.4
Sluitstuk van de zijlijntest: het laatste verschil tussen de opgeslagen opstelling en wat de app
ervan herberekent.

### Afwezig melden verschoof de posities van ándere spelers
- **Wat er misging.** "Afwezig" is een vlag zonder tijdstip: je zet ze bijvoorbeeld in het derde
  blok, terwijl die speler de twee eerste blokken gewoon meespeelde. Bij het herberekenen van de
  opstelling — wat gebeurt zodra je achteraf een gebeurtenis bewerkt, verwijdert of toevoegt — deed
  de app alsof hij er de héle wedstrijd niet was. Elke positiewissel waar hij in een vroeger blok bij
  betrokken was, werd dan overgeslagen, en dáárdoor belandden **andere** spelers op een verkeerde
  plek. Dat werd blijvend opgeslagen, dus het velddiagram en de PDF klopten daarna niet meer.
- **De fix.** Het herberekenen volgt nu gewoon de gebeurtenissen; alleen de eindstand houdt hem van
  het veld. De blokken die hij wél speelde blijven dus intact, en de anderen blijven staan waar ze
  stonden.
- Gemeten: in 40 willekeurige wedstrijden bleven er vier over waarin de herberekening afweek van de
  opgeslagen stand — nu nul. Daarmee is de hele reeks vondsten uit de zijlijntest van 22-08
  afgewerkt: wat er nog overblijft zijn twee bewuste keuzes (met meer spelers dan plaatsen mogen
  starten, en het correctieveld dat alleen bij een ruime overschrijding verschijnt).

## v1.0.3
Laatste van de vijf punten uit de zijlijntest van 22-08.

### Wie de wedstrijd verlaten heeft, doet niet meer mee
- **Een vertrokken speler bleef overal kiesbaar** — en omdat de banklijsten op minst gespeeld
  sorteren, stond hij vaak bovenaan als eerst voorgestelde invaller, terwijl hij al thuis was. Eén
  verstrooide tik en je had iemand opgesteld die er niet was.
- Hij verdwijnt nu uit de wisselkeuze, de bank van het pauzescherm en van het livescherm, het
  blessurescherm en de keuze wie een strafschop neemt. Een klaargezette wissel met hem als invaller
  wordt geweigerd met de reden erbij.
- **Vertrekt hij tijdens de pauze**, dan verdwijnt hij ook meteen uit de getekende opstelling van
  het volgende blok — anders zette de start hem alsnog het veld op. Dezelfde regel gold al voor
  afwezig melden en voor een rode kaart.
- **Het verleden blijft ongemoeid**, en dat was hier de moeilijkheid: iemand die in het laatste blok
  vertrok, hoort in de startopstelling en in de blokken die hij wél speelde gewoon te blijven staan,
  met zijn speelminuten. Daarom is dit een aparte regel ("mag nog meedoen") naast de bestaande ("mag
  op het veld staan"), in plaats van die laatste aan te passen — die wordt namelijk ook gebruikt om
  het verslag en de PDF te tekenen.
- Gemeten: het scenario met een vertrokken speler valt volledig uit de foutenlijst, en de
  scenariolijst zakt van 7 naar 4 meldingen — wat overblijft zijn twee bewuste keuzes (met meer
  spelers dan plaatsen mogen starten, en het correctieveld bij het afsluiten van een blok).

## v1.0.2
Het pauzeveld toont voortaan altijd wat er écht gaat gebeuren. Twee vondsten uit de zijlijntest
met dezelfde wortel, plus een derde die tijdens het testen bovenkwam.

### Wat het pauzeveld toont, is wat er start
- **Een wissel via de knop stond niet op het veld — en verdween bij de eerste tik.** Sinds v0.49.0
  is het veld op het tabblad *Opstelling* de opstelling van het volgende blok, en zijn de wissels
  daar enkel een gevolg van. Maar de wisselknop, de positiewisselknop en "Nu doorvoeren" van een
  klaargezette wissel schreven hun wijziging er buitenom in. Gevolg: die wissel stond niet op het
  veld terwijl hij bij de start wél gebeurde, en zodra je daarna één keer op het veld tikte werd
  alles opnieuw afgeleid en was hij stilletjes weg. Alle vier de paden lopen nu langs de opstelling.
- **Wie je in de rust afwezig meldt, verdwijnt nu ook van het veld.** De klaargezette wissels werden
  al opgeruimd, maar op het getekende veld bleef hij staan — aantikbaar en wel. Bij de start gebeurde
  dan iets anders dan wat je zag.
- **Een rode kaart haalt de speler uit de opstelling van het volgende blok.** Ook wanneer die
  opstelling pas ná de kaart uit je plan wordt overgenomen: een plan kan spelers bevatten die
  intussen uitgesloten of afwezig zijn, en die horen er niet meer in.
- Die laatste regel staat nu op één plek — de enige plek waar de opstelling geschreven wordt —
  in plaats van bij elke knop apart. Zo kan er langs geen enkele weg nog iemand in belanden die bij
  de start toch overgeslagen wordt.
- Vangnet: een klaargezette wissel met een speler die al van het veld is (rode kaart, blessure)
  wordt overgeslagen in plaats van er een speler bij te zetten.
- Gemeten in de sandbox: het verschil tussen "wat het veld belooft" en "wat er start" is nul
  geworden (was 17 gevallen in 40 gefuzzde wedstrijden), net als de gevallen van twee spelers op
  één plek. De scenariolijst zakt van 12 naar 7 meldingen — wat overblijft zijn de vertrokken
  speler (nog te doen) en twee bewuste keuzes.

## v1.0.1
Tweede kritieke vondst uit de zijlijntest van 22-08 opgelost.

### De speelminuten crashten na een eenzijdige wissel
- **Wat er misging.** Ging er iemand van het veld **zonder vervanger**, en kwam er later iemand
  **bij zonder dat er iemand af ging**, dan liep de berekening van de speelminuten stuk. Alles wat
  minuten toont viel dan mee uit: het pauzescherm, de wisselkeuze ("minst gespeeld eerst"), het
  blessurescherm, het verslag en de statistieken. Bij een jeugdploeg zijn dat allebei doodgewone
  handelingen, dus dit trof net de wedstrijden waarin het druk was.
- **De oorzaak.** Bij een eenzijdige wissel is er geen invaller (of geen vertrekker). De teller
  werd toch onder een lege naam weggeschreven, en het eerstvolgende eenzijdige event struikelde
  daarover. Beide plekken die speelminuten berekenen hadden dezelfde fout — ook die voor de
  minuten *per blok*, die bij de eerste vaststelling nog niet opgemerkt was.
- Meteen ook een vangnet: een speler die intussen uit de selectie gehaald is, laat de berekening
  niet meer struikelen.
- Gemeten in de sandbox: het scenario met eenzijdige wissels valt volledig uit de foutenlijst, en
  in 40 willekeurige wedstrijden gingen de 53 crashes naar nul.

## v1.0.0 — uit de testfase
De eerste **major** versie: de app is niet langer "in testfase". Aanleiding is de
strafschoppenreeks, maar er zit een hele reeks verbeteringen in van 23 augustus 2026.

### Strafschoppenreeks
- Eindigt een wedstrijd op een **gelijkspel**, dan vraagt de app bij het afsluiten of er
  strafschoppen volgden. Je kiest wie begint en geeft dan schot per schot in: bij de eigen ploeg
  wie neemt en of hij scoort, bij de tegenstander enkel raak of gemist. De **bolletjes** lopen op
  zoals op tv (groen = raak, rood = gemist), en jij bepaalt wanneer de reeks afgelopen is — de app
  rekent geen "best of five", want bij de jeugd neemt vaak iedereen een strafschop.
- **Wie de reeks wint, heeft gewonnen.** Dat telt mee als overwinning in de seizoensstatistieken en
  in de tornooistand (punten inbegrepen). Internationaal blijft zo'n wedstrijd officieel een
  gelijkspel, maar bij de jeugd ís de reeks de beslissing van de dag — een bewuste keuze.
- **De wedstrijdscore blijft ongemoeid**: 1-1 blijft 1-1. Een strafschop uit de reeks is dus géén
  doelpunt en verschijnt niet bij de topschutters, precies zoals in het echte voetbal. Zo blijft
  "doelpunten voor" gelijk aan de som van de topschutterslijst.
- De uitslag staat overal als **`1-1 · pen. 4-3`**: op het wedstrijdkaartje, in het verslag (met de
  bolletjes en de nemers), in de PDF en in het deelbericht.
- Achteraf aan te passen of te wissen vanuit het wedstrijdverslag.

### Statistieken
- Nieuwe regel **"Strafschoppenreeksen — X van de Y gewonnen"** bij de seizoenscijfers.
- Bij een **speler** een blok **Strafschoppen** met genomen en gescoord, waarbij een strafschop
  tijdens de wedstrijd en één uit een reeks samengeteld worden — voor een speler is het dezelfde
  vaardigheid.
- De statistieken openen voortaan op je **competitiewedstrijden** in plaats van op alles. Zijn er in
  dat seizoen nog geen competitiewedstrijden gespeeld, dan blijft het "alle wedstrijden".
- Seizoen en soort zitten achter één **filtertekentje**, met de actieve keuzes als kaartjes ernaast.

### Wedstrijdenlijst
- De **soort wedstrijd** (competitie, beker, vriendschappelijk) staat nu op elk wedstrijdkaartje.
- Een **filter** op soort, status, thuis/uit, ploeglabel en seizoen — met hetzelfde filtertekentje en
  dezelfde kaartjes als bij de statistieken. Bewust enkel in de lijstweergave: in de kalender zou een
  filter stil dagen leegmaken.
- "Kalender importeren" en "Meerdere aanpassen" staan naast elkaar op halve breedte.
- De keuzelijst "Alle ploegen" verschijnt enkel nog bij méér dan één ploeg op het toestel.

### Nieuw bij een major-versie: "Wat is er nieuw"
- Bij elke **major**-versie ziet iedereen één keer een venster met wat er veranderd is. Bewust enkel
  bij major: een melding bij elke kleine update went, en wat went wordt weggeklikt zonder lezen. Wie
  de app voor het eerst installeert, krijgt niets te zien.

## v0.58.0
Drie dingen die Tim opmerkte bij het gebruiken, alle drie aan de zijlijn.

### Ongedaan maken vraagt eerst, en blijft van je plan af
- **Er komt een bevestiging** met de gebeurtenis erin ("Doelpunt Gust — ongedaan maken?"). Voordien
  verdween de laatste actie meteen, zonder te zeggen wát; je zag het pas in de melding achteraf.
- **Enkel je eigen acties uit het lopende blok.** De wissels die de app bij de start van een blok
  automatisch doorvoert om je opstelling te halen, zijn geen actie van jou — die stonden hier tussen
  en konden één voor één weggeklikt worden, waardoor je opstelling stil uit elkaar viel. Die pas je
  aan op het tabblad Opstelling of achteraf in het verslag. Ook alles uit een vórig blok valt weg:
  dat corrigeer je in het verslag, niet met een knop die je blind kan blijven indrukken.
- Staat er niets van jou in dit blok, dan verdwijnt de knop.

### Een blok dat je te vroeg afsloot, kan je hervatten
- Nieuwe knop in de pauze: **"Te vroeg gestopt — verder in kwart X"**, met een bevestiging die zegt
  op welke minuut je terugkomt. De klok hervat exact waar ze stond en de tijd sinds het (foute)
  afsluiten telt niet mee als speeltijd — alsof je nooit gestopt was.
- Dit bestond al, maar enkel op een **afgesloten** wedstrijd via "Wedstrijd heropenen" — precies niet
  waar je staat op het moment dat de mistik gebeurt. De enige zichtbare uitweg was tot nu "Opnieuw
  beginnen", dat de hele wedstrijd wist.

### Geen positiewissels meer inplannen
- De knop **"+ Positiewissel"** is weg uit de planningskaart. Een positiewissel plan je niet vooraf,
  die gebeurt à la minute op het veld; waar iedereen bij de start van een blok staat, teken je op het
  veld en de app rekent de verschuivingen zelf uit. Echte wissels plan je bij de jeugd wél vooraf, dus
  "+ Wissel" blijft. Dezelfde opruiming was al gebeurd in het scherm "Wissels plannen" — deze kaart
  was vergeten. Bestaande klaargezette positiewissels blijven zichtbaar, aanpasbaar en uitvoerbaar.

## v0.57.1
Eerste fix uit de doorgedreven zijlijntest van 22/23-08 (twee kritieke vondsten; dit is nr. 1).

### Een verhuizing naar een vrije plek liet haar bestemming naslepen
- **De bug.** Verplaatste je tijdens het spel een speler via het veld naar een **vrije plek**, dan
  bleef die bestemming onzichtbaar hangen — voor altijd, zelfs tot in de volgende wedstrijd. Elke
  volgende **positiewissel via het veld** werd daardoor stil een verhuizing naar die oude plek:
  het venster beloofde *"X en Y wisselen van positie"*, maar X belandde bovenop wie er intussen op
  die plek stond en Y bewoog niet. Spelers op elkaar, lege plekken, wissels waarvan onduidelijk was
  wat er gebeurde — een flink deel van de frustratie van de veldtest. Alleen de oude knop-weg
  ruimde op; de tikbediening via het veld (sinds v0.57.0 dé weg) niet.
- **De fix.** De keuze (wie, met wie, welke lege plek) wordt voortaan altijd in haar geheel gezet
  — een ruil wist dus automatisch een oude lege-plek-bestemming — en na elke doorgevoerde
  positiewissel wordt ze gewist. Bij een afgebroken poging blijft je selectie staan zodat je kan
  corrigeren.
- **Vangnet erbovenop.** Blijkt de vrije plek bij het doorvoeren tóch bezet (bv. een co-admin op
  een tweede toestel zette daar net iemand), dan gebeurt er niets en zegt de app *"… is intussen
  bezet door … — tik opnieuw"*. Nooit stil iemand overschrijven.
- Getest in de sandbox: het chaos-scenario dat hierop 32 fouten gaf, geeft er nu 0; overlap in de
  willekeurige-tikreeksen zakte van ~15 per wedstrijd naar vrijwel nul.

## v0.57.0
Twee ontwerpkeuzes van Tim na het pauzescherm-herontwerp van v0.56.0.

### Het pauzekaartje als tegels (keuze "1B")
- **Eén brede oranje hoofdknop** — *"Opstelling nakijken of wijzigen"*, want dát doe je in elke
  pauze — met daaronder de drie kleinere handelingen als **tegels** in de stijl van de
  eventknoppen: *Uit je plan* (alleen als er een plan is), *Leeg veld* en *Event in kwart X*.
- Het **×-icoon** bij "leeg veld" las als "sluiten" en is vervangen door een **gum** (Tabler
  *eraser*, broncode letterlijk overgenomen): het veld uitvegen en opnieuw opstellen. Ook bij de
  "Leeg veld"-knop op het tabblad Opstelling.

### Wissels en posities: één plek voor alles met plaatsen (keuze "2B")
- De knop **"Positie"** op het tabblad Wedstrijd heet nu **"Opstelling"** en brengt je naar het
  gelijknamige tabblad. Daar doe je álles met plaatsen, met dezelfde tikbediening als in de pauze:
  een speler naar een vrije plek, twee spelers laten ruilen, een bankspeler en een veldspeler
  wisselen, en onderaan "Speler bijzetten". Tijdens het spel vraagt elke beweging eerst een
  bevestiging (het wordt meteen een event met tijdstip).
- De knop **"Wissel"** met zijn snelle keuzemodal blijft — dat is het snelste gebaar voor de
  gewone wissel. Een positiewissel achteraf (in een al afgelopen kwart) blijft bereikbaar via
  **"Meer" → event toevoegen**.
- De knop "Opstelling" doet ook dienst in de pauze (hij springt gewoon naar het tabblad), dus hij
  staat nooit uitgegrijsd.
- Op het live-opstellingstabblad staat de uitleg (*"Tik een bankspeler en dan een speler op het
  veld…"*) nu **boven** het velddiagram, net als in de pauze.

### Niet meer kunnen starten met een leeg veld
- **"Start kwart X" controleert voortaan het veld.** Een leeg veld achterlaten (bv. leeggemaakt en
  vergeten te vullen) en dan starten was een echte fout die de app gewoon liet passeren. Nu komt er
  een vraag: is er een plan voor dat kwart, dan *"Je veld is leeg — starten met je geplande
  opstelling?"* (ja = plan toepassen en starten, nee = naar het opstellingsveld). Zonder plan kan
  je niet starten en brengt de knop je naar de opstelling.
- Staan er **minder (of meer) spelers dan er plaats is**, dan vraagt de app het ook even na: *"Kwart
  X start met minder spelers dan er plaats is — is het de bedoeling?"* Ja = zo starten (met minder
  spelen mag), nee = naar de opstelling.
- De hoofdknop op het pauzekaartje is nu écht **oranje** (de "org"-kleur in het palet bleek het
  merkblauw te zijn — er is een aparte oranje knopstijl bijgekomen).
- Duidelijker benamingen: de plantegel heet **"Volgens plan"**, en de drie startpunten op het
  opstellingstabblad heten nu **"Opstellen volgens plan"**, **"Herneem einde kwart X"** en
  **"Maak veld leeg"**. Staat het veld al zoals gepland, dan zegt de bevestiging dat ook zo:
  *"De opstelling voor kwart X staat al klaar zoals in het wedstrijdplan."*

## v0.56.0
Tims observaties na een avond oefenen met testwedstrijden — het pauzescherm opgeruimd en een reeks
kleinere ergernissen weggewerkt.

### Het pauzekaartje
- **"Wat kan je doen in de pauze?"** vervangt de lijst met afgeleide wissels op het tabblad
  Wedstrijd. Die wissels had niemand ingegeven (de app leidt ze af uit het veld), dus ze lazen als
  iets dat je moest nakijken. Nu: één zin — *"Kwart X start automatisch met het veld op het tabblad
  Opstelling"* — en de vier dingen die je in een pauze echt doet: **opstelling nakijken of
  wijzigen**, **opstelling uit je plan gebruiken**, **opnieuw opstellen (leeg veld)** en **event
  toevoegen aan het vorige kwart**.
- **"Leeg veld" springt meteen naar het tabblad Opstelling** — daar staat het lege veld dat je gaat
  vullen.
- Op het tabblad Opstelling is de lijst *"Wat er bij de start gebeurt"* vervangen door diezelfde ene
  zin, en onderaan staat een knop **"Terug naar de wedstrijd"**. De drie startpunten (uit je plan /
  zoals nu / leeg veld) blijven daar gewoon staan.
- De bevestiging bij **"Opstelling uit je plan"** vraagt nog gewoon *"Kwart X volgens je plan?"* —
  zonder wisselopsomming. Wat er níet kan (een afwezige speler uit het plan) wordt wel nog gemeld.
- De knop *"Wissels & posities op het veld"* is weg (dubbel met "Opstelling nakijken").

### Wissels plannen
- **Geen "+ Positiewissel" meer bij het klaarzetten.** Wie er bij de start van een blok waar staat,
  teken je op het veld — de app rekent de verschuivingen uit. Een positiewissel apart klaarzetten
  was gereedschap uit het oude model. Bestaande klaargezette positiewissels blijven zichtbaar,
  aanpasbaar en uitvoerbaar.
- **In de pauze staan er geen doorvoerknoppen meer** — doorvoeren kan alleen terwijl een blok loopt;
  in de pauze regel je alles op het tabblad Opstelling. De pauze-afgeleiden ("gaat automatisch…")
  staan er ook niet meer tussen, mét hun verwijderknop — dat was dubbel gereedschap.
- **Het kwartkeuzetabblad springt mee met de wedstrijd.** Het bleef op het oude kwart staan (jij in
  kwart 3, de keuze op kwart 2), en omdat de "Nu"-knoppen enkel op het huidige kwart staan, leek er
  dan niets doorvoerbaar — ook de vermiste knop bij één klaargezette wissel in kwart 4 was hiervan
  een gevolg.

### Klein maar dagelijks
- **"dit kwart: 0–0" staat er nu ook bij een blok zonder doelpunten.** Eerst stond de regel enkel
  bij blokken mét doelpunten, maar dan las het ontbreken als een gat in plaats van als "hier viel
  niets". Op het scherm en in de PDF.
- **De terugpijl van een wedstrijd brengt je terug waar je vandaan kwam.** Opende je een wedstrijd
  vanaf het homescherm, dan kwam je met de terugpijl altijd op de wedstrijdenlijst uit. Nu onthoudt
  de app of je van het homescherm of de lijst kwam. Tornooiwedstrijden blijven naar hun tornooi
  teruggaan.
- **Het scherm springt niet meer naar boven** bij elke tik in de opstellingsplanner — de
  schuifpositie blijft behouden bij het hertekenen.
- **Bij een leeg veld zijn de formatieplekken groter** dan de overige vrije plekken (met hun
  positienummer erbij), zoals overal.
- **Zodra je een speler vastheb, krijgen de vrije plekken een gestippeld randje** — dat zijn de
  bestemmingen waar je op kan tikken.
- **"Info" (wedstrijdinfo bewerken) staat nu in de kop van het livescherm**, en **"Afsluiten" is
  verhuisd naar onderaan het tabblad Verloop** — in de kop was één mistik genoeg om de wedstrijd
  dicht te doen. De gewone weg blijft de knop *"Einde match"* bij het laatste blok.

## v0.55.1
- **"Nieuwe ploeg zonder rugnummers" geldt nu ook voor een ploeg via de club.** Er zijn twee
  manieren om een ploeg aan te maken, en v0.55.0 had er maar één aangepast — wie via *Nieuwe ploeg
  in deze club* werkte (de gewone weg), kreeg het vinkje toch weer aan.
- **De bank bij de startopstelling is nu een momentopname.** Ze toonde wie het hele blok geen minuut
  speelde — de regel van het kader onder het velddiagram — en dus stond er na wissels tijdens het
  blok niemand, ook al begonnen er wél spelers op de bank. Bij een *start*opstelling hoort wie er
  **op dat moment** op de bank zat, ook wie vijf minuten later inviel. Wie afwezig was, vertrokken
  was of een rode kaart had, staat er terecht niet bij. Het kader onder het velddiagram behoudt zijn
  eigen regel (dat gaat over het hele blok).

## v0.55.0
- **Een nieuwe ploeg start zonder vaste rugnummers.** Bij jeugdploegen zijn die niet de norm, dus
  het vinkje *Vaste rugnummers gebruiken* staat bij het aanmaken uit. Bestaande ploegen veranderen
  niet — wie nummers gebruikt, houdt ze gewoon.
- **Bij een doelpunt, kaart of penalty achteraf is nu élke speler kiesbaar.** De lijst toonde enkel
  wie het gekozen blok begón — een doelpunt van iemand die op minuut 10 inviel was dus niet toe te
  kennen. Nu staat de rest van de selectie erachter, gemerkt met *bank* (ook bij de assist en het
  eigen doelpunt). Dezelfde oplossing als bij blessure en vertrek; tijdens het spel verandert er
  niets.
- **Geen automatische volgnummers meer.** Een nieuwe speler kreeg stilzwijgend het volgende nummer
  (1, 2, 3, …) mee, ook als de rugnummers uitstonden — zette je ze later aan, dan stond de hele
  lijst vol volgnummers alsof dat echte rugnummers waren. Het vakje blijft nu leeg; wie vaste
  nummers gebruikt, vult ze zelf in. Bij *Lijst plakken* wordt een nummer vooraan een regel wél
  gewoon overgenomen, zoals altijd.

## v0.54.2
- **Wat in de pauze gebeurde, staat vóór de startopstelling — en heet "pauze".** Een speler die in
  de rust de wedstrijd verliet, stond in het verloop van het volgende blok op "minuut 1", ná de
  startopstelling. Allebei onwaar: het gebeurde vóór de aftrap van dat blok, en in de pauze loopt
  geen klok. Pauzegebeurtenissen staan nu bovenaan hun blok met **pauze** als tijdstip, vóór de
  startopstelling-regel — op het scherm, in de filterweergave en in de PDF-tijdlijn.

## v0.54.1
- **De bank staat bij de startopstelling.** De samengevouwen regel per blok op het verslag zegt nu
  ook wie er op dat moment op de bank zat — en wie de wedstrijd verlaten had, staat daar terecht
  niet bij (die is weg, niet beschikbaar). Op het scherm en in de PDF-tijdlijn.
- **"Jan-Arthur voor ?" leest nu als wat het is.** Een wissel kan sinds v0.49.0 eenzijdig zijn —
  iemand komt erbij zonder dat er op dat moment iemand via een wissel af gaat (bijvoorbeeld omdat de
  vrijgekomen plaats van een speler is die de wedstrijd **verliet**, wat een eigen regel heeft). Het
  verloopetiket kende die vorm niet en toonde een vraagteken. Nu staat er *"… komt erbij op CVM
  (10)"* respectievelijk *"… gaat van het veld — geen vervanger"*, op het scherm en in de PDF.

## v0.54.0
- **De startopstelling wordt voortaan bewaard.** Tot nu werd ze bij élk tekenen opnieuw *berekend*,
  door vanaf de eindtoestand alle wissels en positiewissels achterstevoren terug te draaien. Dat is
  een conclusie die alleen klopt zolang elke momentopname in elk event klopt — en op 22 augustus
  bleek hoe broos dat is: één scheve momentopname en alle kwarten stonden tegelijk scheef, en zelfs
  een reparatie van de startopstelling werd bij het eerstvolgende tekenen weer weggerekend. Vanaf nu
  wordt de opstelling **vastgelegd op het moment van de aftrap** en is ze een feit: alles wordt er
  vooruit uit doorgerekend, en de tekstregel, het velddiagram en de veldbezetting lezen allemaal
  diezelfde ene bron.
  - **Bestaande wedstrijden blijven gewoon werken**: zonder het nieuwe veld rekent de app zoals
    voorheen. Er verandert niets aan opgeslagen gegevens en er is geen migratie.
  - "Startopstelling herplaatsen" en "Opnieuw beginnen" houden het bewaarde veld netjes bij.
  - En dit maakt een reparatie eindelijk blijvend: zet de startopstelling recht, en de kwarten
    volgen — in plaats van teruggerekend te worden naar de oude fout.
- **Een zet naar een bezette plek wordt een ruil.** Een verhuizing naar een lege plek en een speler
  die erbij komt dragen een **absolute** plek mee in hun gebeurtenis. Wordt de startopstelling
  naderhand rechtgezet, dan kan die plek op dat moment bezet blijken — en dan stonden er weer twee
  spelers op elkaar. Nu ruilt de bewoner netjes mee (naar de oude plaats van de verhuizer als die
  vrij is, anders naar de eerste vrije plek op zijn lijn). Voor een gewone wedstrijd verandert er
  niets: de plek wás leeg toen de zet gebeurde.
- Nagegaan met **100 volledig nagespeelde wedstrijden**, elk vier keer beproefd: als nieuwe
  wedstrijd, als bestaande wedstrijd zonder het nieuwe veld, na een rechtzetting van de
  startopstelling (willekeurige herschikking), en na een rechtzetting op een oude wedstrijd. Nul
  dubbele plekken, tekst en diagram overal gelijk, en elke rechtzetting hield stand na een tweede
  herberekening.

## v0.53.1
Punt 6 van de veldtest van 22 augustus 2026, plus de reparatie van twee spelers op één plek in de
velddiagrammen.

### Twee shirts op één plek — opgelost
- **De oorzaak.** Sinds v0.49.0 bestaan er wissels waarbij iemand **erbij** komt zonder dat er iemand
  af gaat. De reconstructie die de velddiagrammen tekent, gaf zo'n speler zijn plaats via de speler
  die eraf ging — en die is er niet. Hij bleef dus zonder plaats in de boekhouding, en een latere
  positiewissel verplaatste dan enkel de ándere speler: twee shirts op dezelfde plek, met een lege
  plaats ernaast.
- **Ook opgelost:** een positiewissel werd nog uitgevoerd met een speler die op dat moment al
  gewisseld was. De reconstructie houdt nu bij wie er op elk moment staat en ruilt alleen tussen twee
  spelers die er beide zijn.
- **De tekstregel en het velddiagram komen nu uit dezelfde berekening.** Ze deden dat niet: de regel
  *Startopstelling* rekende achterwaarts terug, het diagram bouwde voorwaarts op. Twee wegen naar
  hetzelfde antwoord lopen altijd uiteen — de tekst zette een speler op CAM terwijl het diagram hem
  op LM tekende. Nu is het één en dezelfde bron, dus kunnen ze niet meer verschillen.
- **Een wissel omhangen kan geen tegenspraak meer maken.** Schuif je een wissel naar de start van een
  blok terwijl er tússen het oude en het nieuwe tijdstip nog iets met dezelfde spelers gebeurt, dan
  zou er van plaats geruild worden met iemand die al gewisseld is — en dat trok de opstelling van
  élk blok scheef, ook de startopstelling. De app zegt nu wat er in de weg staat en laat het niet
  doorgaan. Een gewone correctie op minuut 1 blijft gewoon werken.
- **Een overgeslagen wissel laat ook geen spoor meer na.** Slaat de voorwaartse herberekening een
  positiewissel over omdat een van de twee spelers al gewisseld was, dan worden ook de momentopnames
  van dat event gewist. Anders draaide het terugspoelen naar de startopstelling die zet tóch terug,
  en kwam de fout langs de achterdeur weer binnen — daardoor had het rechtzetten van een
  startopstelling gewoon geen effect. Nagegaan als eigenschap: na een herberekening geeft het
  terugspoelen exact het vertrekpunt terug (60 nagespeelde wedstrijden, geen enkele afwijking).
- Nagegaan met **100 volledig nagespeelde wedstrijden**, telkens met wissels, positiewissels,
  verhuizingen naar een lege plek, spelers die erbij komen en die vertrekken, gevolgd door het
  omhangen van een wissel en een volledige herbouw: geen enkele dubbele plek meer, en de tekst en het
  diagram gaven overal hetzelfde.

### Punt 6 — de duur van een blok

- **De duur van een gespeeld blok is achteraf aan te passen.** Stopte je te vroeg (13' in plaats van
  15') of liep de wedstrijd langer door dan je afsloot, dan zet je dat nu recht: op het verslag staat
  bij **Per blok** een potloodje naast de duur. Er bestond al een correctieveld op het *moment* van
  afsluiten, maar daarna niet meer.
- **Je ziet eerst wat het doet, per speler.** Het nakijkscherm zegt "Kwart 2 gaat van 15 naar 17
  minuten" en zet daaronder iedereen van wie de speeltijd verandert, met het oude en het nieuwe
  getal. Dat voorbeeld wordt berekend op een kopie, met exact dezelfde code die daarna ook echt
  schrijft — zodat wat je te zien krijgt niet kan afwijken van wat er gebeurt.
- **De gebeurtenissen in de latere blokken schuiven mee.** Elke gebeurtenis draagt de verstreken
  speeltijd sinds de aftrap, en die begint voor een later blok dus later zodra je een eerder blok
  verlengt. Zonder dat meeschuiven zou een doelpunt uit blok 3 op een verkeerde minuut belanden. De
  keeperminuten schuiven om dezelfde reden mee.
- **Bij inkorten wordt gewaarschuwd wat er niet meer past.** Kort je een blok in tot vóór een
  gebeurtenis die erin stond, dan schuift die naar de slotminuut — en is haar oorspronkelijke minuut
  weg. Het nakijkscherm zegt hoeveel gebeurtenissen dat zijn vóór je bevestigt. Verlengen kan niets
  verliezen.
- Zet je de duur terug op de oude waarde, dan staat alles weer precies zoals het was (nagegaan tot
  op de minuut per speler) — behalve gebeurtenissen die door een eerdere inkorting al geschoven zijn.

## v0.52.0
Vier meldingen over de speler die de wedstrijd verlaat, alle vier uit het gebruik van v0.51.0.

- **Wie vertrokken is, staat niet meer op de bank.** Onder het velddiagram van elk volgend blok
  stond hij er nog bij, alsof hij nog kon invallen. De oorzaak: hij is niet *niet aanwezig* — hij was
  er wél en speelde mee, hij is enkel weg — en de banklijst keek alleen naar "niet aanwezig". Nu
  wordt per blok gekeken wie op dat moment al vertrokken was. Op het scherm en in de PDF.
- **Het teken bij een vertrek is geen blessure-icoon meer.** Een vertrek werd onder water als
  blessure bijgehouden en kreeg daardoor ook dat icoontje. Nu een kruisje, hetzelfde teken als op de
  knop waarmee je het registreert, en de regel leest *"Verliet de wedstrijd"*. Een echte blessure
  houdt haar eigen icoon.
- **Een merkje bij zijn speeltijd.** Achter zijn naam staat nu **vertrokken** (met de reden erbij als
  je die invulde) — het spiegelbeeld van het bestaande *bijgekomen*. Zonder dat merkje leest zijn
  lagere speeltijd als een keuze van de trainer.
- **Geen rood alarm meer bij wie vertrok of later bijkwam.** Het aantal minuten en het percentage
  blijven staan: hij speelde écht minder, dat is gewoon waar. Maar de rode markering betekent "deze
  speler kreeg te weinig speeltijd", en dat verwijt klopt niet voor iemand die halverwege naar huis
  ging. Een speler die zonder reden weinig speelde, blijft wel rood.

## v0.51.0
- **"Dit hoorde bij de opstelling van dit blok."** Een wissel of positiewissel die je vlak na de
  aftrap van een blok doet, is bijna altijd geen wissel maar een **correctie**: de trainer had de
  opstelling nog gewijzigd en dat kwam pas op het veld aan het licht. Tot nu bleef die als een echte
  wissel in het verloop staan ("1' Simon voor Sebastian"), en hij vertekende ieders speelminuten met
  die minuut. Open zo'n event met het potloodje en er staat nu een knop om hem om te hangen naar de
  **startopstelling van dat blok**. De losse regel verdwijnt, de speler staat in de startopstelling,
  en de speelminuten kloppen.
  - De bevestiging zegt eerst **hoeveel minuten er verschuiven en bij wie**, want dit raakt de
    statistieken van twee spelers.
  - **Omkeerbaar.** Zet je het per ongeluk om, tik dan bovenaan het verloop de filter **Wissels**
    aan — dan zijn de pauzewijzigingen weer los te zien, en staat er in hetzelfde venster de
    omgekeerde knop.
- **"Speler verlaat de wedstrijd" is nu te vinden.** Iemand die naar huis gaat of naar het tweede
  veld vertrekt, is geen blessure — maar die keuze was alleen te bereiken via *Meer… → Blessure*, en
  daar stond ze niet eens in de lijst met types. Nu staat er een eigen knop, zowel bij **Event
  toevoegen** (ook op het verslag van een afgesloten wedstrijd, dus achteraf) als onder *Meer…*, met
  een **vrij in te vullen reden** erbij ("naar huis", "speelt op het tweede veld"). Die reden komt in
  het verloop en in de PDF te staan. Zijn speelminuten stoppen op dat moment; wat hij al speelde
  blijft staan.
- **Een gebeurtenis kan nu ook in de pauze vallen.** Bij *Event toevoegen* staat tussen de blokken
  telkens een knop **"Pauze na blok X"**. Nodig voor het geval dat er niet in paste: een speler die
  in de rust weggaat stond aan het einde van het vorige blok misschien al niet meer op het veld
  (hij was gewisseld), en aan het begin van het volgende ook niet. In de pauze loopt de klok niet,
  dus dit wordt vastgelegd op het moment tussen de twee blokken — wie dan vertrekt, houdt precies de
  minuten die hij daarvóór speelde.
- **Bij een blessure of vertrek kan je nu élke speler kiezen, niet enkel wie op het veld stond.**
  Wie vertrekt zit vaak al op de bank, want hij was eerder gewisseld — die was dus onmogelijk aan te
  duiden. Spelers die op dat moment op het veld stonden komen vooraan; wie op de bank zat, is
  gemerkt met *bank*.
- Een vertrek zonder het veld te verlaten was een onmogelijke toestand die de app toch toeliet (met
  speelminuten die dan doorliepen). Bij *vertrokken* staat dat vinkje er niet meer en ligt het vast.
- **De startopstelling leest beter in de PDF.** Er stond *Vincent F. — GK (1) · Briek D. — …*, en met
  die streepjes en middelpunten werd het één lange brij. Nu: *Vincent F. (GK, 1), Briek D. (CV, 3),
  Milan P. (LCV), …* — plaats en positienummer samen tussen één stel haakjes, spelers gescheiden door
  komma's.
- De **roosterplek van een speler wordt weer meegeschreven** bij het bewaren van de startopstelling.
  Voordien bleef daar de code van zijn vorige plaats staan. De app tekende altijd correct (ze leest
  de coördinaten), maar wie een probleem uitzoekt, las een plekcode die nergens meer op klopte.

## v0.50.0
Punt 3 en punt 5 van de veldtest van 22 augustus 2026, beide over het verslag.

- **Eén "Startopstelling" per blok in plaats van tientallen losse wissels.** Bij een jeugdploeg staat
  er in de rust bijna een nieuwe ploeg op het veld, en al die wissels en positiewissels kwamen als
  aparte regels op het verslag — de doelpunten en kaarten verdronken daarin. Nu staat er per blok één
  regel met wie er staat en waar: *Bram V. `GK` · Noah D. `CV` · Lars M. `LCV` …*, op leesbare
  volgorde (doel eerst, dan achteruit naar voren, links naar rechts). In het voorbeeld waarmee dit
  getest is, ging een blok van negen regels naar drie.
  - Wil je de losse wissels tóch zien, tik dan de filter **Wissels** aan bovenaan het verloop: dan
    verschijnen ze weer, precies zoals voordien.
  - Ook in de wedstrijd-PDF, met dezelfde opstelling — de tekst en het scherm lezen uit één bron.
  - **Er wordt niets weggegooid.** Alle wissels blijven onder water bewaard: de speelminuten, de
    keeperminuten, de veldweergave en het terugspoelen naar een eerdere opstelling gebruiken ze
    allemaal. Dit is enkel een kwestie van wat je te zien krijgt.
- **De tussenstand per blok zegt nu ook wat er in dat blok zelf gebeurde.** Er stond enkel de totale
  stand, en die las als de score van dat blok: bij *Kwart 2 — 1–3* leek het alsof er in kwart 2
  één keer voor en drie keer tegen gescoord werd. Nu staat er **dit kwart: 0–3** onder. Enkel bij
  een blok waarin ook echt gescoord werd, anders zou er overal een nutteloze 0–0 staan. Op het
  scherm en in beide plaatsen in de PDF (de tussenstandtabel en de tijdlijn).

## v0.49.0
Punt 2 van de veldtest van 22 augustus 2026: de opstelling wijzigen tussen twee blokken. Bij een
jeugdploeg verandert daar veel, en dat liep mis — spelers verdwenen achter elkaar op het veld, en wat
je aantikte was niet wat er gebeurde.

- **Het veld in de pauze ís de opstelling van het volgende blok.** Voordien hield de app een lijst
  losse wijzigingen bij, die elk berekend waren tegen de stand van dát moment maar pas bij de start
  achter elkaar werden uitgevoerd. Zet je er zes achter elkaar klaar, dan kon een latere wijziging
  een plaats opeisen die een eerdere al weggaf: **twee shirts op exact dezelfde plek**, waarvan je er
  één ziet. Dat is de speler die "gewoon verdween" — hij lag eronder. Nu is er één opstelling waarin
  elke plaats precies één bewoner heeft, en zijn de wissels daar de uitkomst van.
- **Wat je ziet, is wat er gebeurt.** De voorstelling op het scherm werd door andere code berekend
  dan de werkelijkheid bij de start, met net andere regels. Die twee zijn samengebracht. Nagegaan met
  60 willekeurige reeksen van in totaal bijna 400 tikken: geen enkel verschil meer, en nooit twee
  spelers op één plek.
- **Drie startpunten bovenaan het pauzescherm.** *Uit je plan* · *Zoals nu* · **Leeg veld**. Die
  laatste is nieuw: het veld gaat leeg en je zet iedereen opnieuw op zijn plaats, zoals bij de
  aftrap. Bij veel wijzigingen is dat sneller dan tien spelers één voor één verschuiven. Na elk
  startpunt kan je nog gewoon bijtikken.
- **Een speler van het veld halen zonder vervanger.** Tik hem aan en gebruik de knop eronder. Dat kon
  voordien niet: een wissel was altijd één van twee spelers, en daarom kon je ook niet aanduiden dat
  iemand na de rust naar huis ging. Zijn speelminuten stoppen op dat moment.
- **Iemand erbij zetten die er nog niet was** kan nu ook vanaf de bank op een vrije plaats — nodig om
  vanaf een leeg veld te kunnen beginnen.
- **Een verkeerd aantal spelers mag, maar valt op.** Staat er "7 spelers op een veld voor 8", dan
  zegt de app dat en laat ze je begaan: met een man minder spelen komt echt voor. Voordien werd de
  overtallige speler er stil bijgehouden of viel de bijkomende stil weg.
- Onder water: een wissel kan nu eenzijdig zijn (iemand gaat eraf zonder vervanger, of komt erbij
  zonder dat er iemand af gaat). Bestaande wedstrijden merken hier niets van, en de speelminuten,
  keeperminuten, het verslag en de PDF's lopen door dezelfde berekening als altijd.

## v0.48.0
Naar aanleiding van de veldtest van 22 augustus 2026, waarbij een wedstrijd op een scherm zonder
één bruikbare knop terechtkwam en daardoor een nacht lang bleef doorlopen.

- **Het aantal blokken wordt weer volledig bewaard.** Bij *Meerdere wedstrijden aanpassen* zette
  "Aantal blokken" maar de helft van wat erbij hoort: de app houdt dat in twee gegevens bij (de soort
  — kwarten, helften, delen — en hoeveel er zijn), en enkel de eerste werd geschreven. Een wedstrijd
  bleef dan op haar oude aantal staan. Na het laatste "gekende" blok viel daardoor élke knop weg:
  geen volgend blok, geen einde, geen gebeurtenissen. Ze worden nu samen gezet, het ongedaan-maken
  zet ze samen terug, en de keuzelijst kent ook **1 deel** — dat kon je er voordien niet eens
  instellen.
- **Een wedstrijd kan niet meer vastzitten.** Staat er om welke reden ook geen volgende stap, dan
  zegt de app dat nu met zoveel woorden en biedt ze drie uitwegen: **nog een blok spelen**,
  **afsluiten**, of **opnieuw beginnen**.
- **Opnieuw beginnen.** "Oei, dit was niet de bedoeling": de wedstrijd gaat terug naar *gepland* en
  kan opnieuw gestart worden, met de opstelling van de aftrap terug op het veld — ook de wissels en
  positiewissels van tijdens de wedstrijd worden teruggespoeld. De bevestiging noemt eerst de
  wedstrijd bij **ploeg, tegenstander, datum, uur en terrein**, zodat je dit niet op de verkeerde
  wedstrijd doet, en ze zegt precies wat verdwijnt. Selectie, plan en notities blijven staan, en er
  staat een dag lang een knop klaar om alles terug te zetten zoals het was.
- **"Er loopt nog een wedstrijd" wordt niet meer weggefilterd.** Die melding volgde de ploegfilter
  van je beginscherm. Stond die op een andere ploeg, dan was een doorlopende klok nergens te zien —
  precies wat er die ochtend gebeurde. De melding geldt nu voor de hele club en noemt de ploeg.
- **Twee verschillende problemen, twee verschillende meldingen.** "De klok loopt door" werd ook
  gezegd over een wedstrijd waarvan het laatste blok netjes afgesloten was. Dat is nu gesplitst: een
  klok die écht doortikt (dringend, want het vertekent de speelminuten) tegenover een wedstrijd die
  enkel nooit afgesloten is (de minuten kloppen, het verslag is niet af).

## v0.47.0
- **De handleiding is bij.** Er staan twee nieuwe stukken in en een nieuwe pagina:
  - Nieuwe pagina **"Meerdere wedstrijden aanpassen"**, met wat je wel en niet in bulk kan wijzigen, het
    nakijkscherm en de ongedaan-maken.
  - Bij **"Ploeg & spelers beheren"** staat nu het aantal blokken en de duur per blok, inclusief
    "Vrij…" voor een speelduur die niet in de lijst staat. De tegel heet daar ook "Ploeg" in plaats van
    "Spelers".
  - Bij **"Als ploegbeheerder"**: **Teruggevonden**, en het blok **"Niet afgesloten"** op het startscherm.
  - Bij **"Als clubbeheerder"**: **Spelers doorschuiven** (met de waarschuwing dat met de hand
    overtikken het carrière-overzicht breekt, en de tip om bij de oudste ploeg te beginnen) en de
    **Clubexport** met wat er in elk tabblad staat.
- **Nieuwe en bijgewerkte schermafbeeldingen.** De pagina "Kalender importeren" had er nog geen; die is er
  nu. Verder nieuw: het scherm om meerdere wedstrijden aan te passen. Bijgewerkt: het startscherm (de
  tegel heette daar nog "Spelers") en het ploegscherm (daar stonden de twee nieuwe instellingen nog niet
  op).
- **Opgelost onderweg:** bij het aantikken van een wedstrijd in dat bulk-scherm werd alleen het vakje
  groen, zonder vinkje erin. Enkel rijen die al aangevinkt stonden bij het openen kregen er een. Gevonden
  doordat het op de schermafbeelding een leeg groen blokje bleef.

## v0.46.0
- **Tornooien vervuilden de clubexport.** Een tornooidag is vijf wedstrijdjes van tien minuten. Die
  meerekenen in "gemiddelde minuten per wedstrijd" maakt dat cijfer waardeloos — en de statistieken in de
  app laten tornooien al buiten, dus de export was ook inconsistent. Tornooiwedstrijden staan nu in een
  eigen tabblad **Tornooiwedstrijden** en tellen niet mee in Spelers, Wedstrijden of Speeltijd. In het
  **Overzicht** staat per ploeg hoeveel **tornooien** en hoeveel **wedstrijden in tornooien** er waren.
- **Je kiest nu een seizoen bij het exporteren.** Anders groeit het bestand elk jaar aan. Standaard het
  huidige seizoen, met "alle seizoenen" als keuze; het gekozen seizoen staat in het Overzicht en in de
  bestandsnaam. De app haalt de gegevens één keer op in plaats van bij elke knop opnieuw.
- **Het tabblad Spelers telde alle seizoenen samen op één regel.** Dat waren dus verkeerde getallen: een
  speler met drie seizoenen achter zich kreeg één opgeteld totaal, zonder dat je zag waarover het ging.
  Nu staat er één regel per speler **per seizoen**, en elke tabel heeft een kolom **Seizoen**.
- **Een speler die middenin het seizoen van ploeg verandert** — zoals bij de leeftijdsrotatie — staat nu
  in twee tabellen, elk met een eigen vraag. **Spelers** telt zijn seizoen over al zijn ploegen samen:
  *heeft dit kind genoeg gevoetbald?* **Spelers per ploeg** splitst hem per ploeg: *hoe is de speeltijd
  in mijn ploeg verdeeld?* Enkel per ploeg tonen zou hem in beide ploegen te weinig laten spelen.
- Die samenvoeging werkt op het blijvende spelersnummer. Een speler die met de hand in de nieuwe ploeg
  ingetikt is in plaats van via "Spelers doorschuiven", blijft dus twee personen — net zoals zijn
  carrière-overzicht dan leeg blijft.

## v0.45.0
- **"Ongedaan maken" na een bulkwijziging bleef bij élke ploeg staan.** Wissel je van ploeg en open je
  daar de wedstrijdenlijst, dan stond die knop er nog — en een tik erop zette de oude waarden terug bij
  de ploeg die op dat moment open stond. Dat is dezelfde soort verschuiving die eerder een wedstrijd
  uit een lijst deed verdwijnen. De ongedaan-maken hoort nu bij één ploeg: je ziet ze enkel bij de ploeg
  waar je de wijziging deed, en nergens anders.
- **Aantal blokken en duur per blok staan nu bij de ploeg.** Tot nu stond 4 × 15 minuten vast in de app,
  en moest je dat bij elke wedstrijd van elke ploeg opnieuw bijstellen — een U8 speelt geen kwartieren
  van een kwartier. Je kiest het nu bij het aanmaken van een ploeg en je past het aan bij **Ploeg**,
  naast de wedstrijdvorm en de standaardopstelling. Een nieuwe wedstrijd én een ingelezen kalender nemen
  het over, en per wedstrijd kan je nog altijd afwijken.
- Bestaande ploegen hebben die instelling nog niet, en werken dus precies zoals voordien (4 × 15) tot je
  ze instelt. De keuze voor de duur volgt het aantal blokken: bij helften 30 of 45 minuten, bij kwarten
  10, 15 of 20, bij delen 15 of 20 — **en overal "Vrij…"**, waarmee je elk aantal minuten kan intikken.
  Zo kan je ook 3 × 10 als standaard zetten, wat in de vaste lijst niet bestond; per wedstrijd kon dat al.
- **De tegel "Spelers" op het startscherm heet nu "Ploeg".** Erachter zitten immers ook de trainers, de
  ploegverantwoordelijken en de standaardinstellingen. Het getal eronder blijft het aantal spelers, en de
  knop onderaan dat scherm heet nu overal "Ploeg opslaan".

## v0.44.0
- **De clubexport is één echt Excel-bestand geworden, met vier tabbladen.**
  - **Overzicht** — club, exportdatum, en per ploeg het aantal spelers en wedstrijden.
  - **Spelers** — één regel per speler: bij welke ploeg(en) hij speelde, hoeveel keer hij geselecteerd
    was, hoeveel wedstrijden hij effectief speelde, zijn totale minuten, zijn gemiddelde per gespeelde
    wedstrijd én per selectie, doelpunten, assists, kaarten en keeperbeurten. Dit is het tabblad waar
    een jeugdcoördinator naar kijkt zonder eerst zelf te moeten rekenen.
  - **Wedstrijden** — per ploeg alle wedstrijden, ook de geplande.
  - **Speeltijd** — de ruwe tabel: één regel per speler per wedstrijd.
- **Een speler die is doorgeschoven, staat op één regel.** Speelde hij dit seizoen bij U11 en volgend
  seizoen bij U12, dan zie je zijn totalen samen, met beide ploegen en beide rugnummers erbij. Wie
  afwezig was, telt niet mee als selectie — anders lijkt hij minder te spelen dan hij deed.
- De twee CSV-bestanden blijven bestaan voor wie de gegevens in een ander programma wil inlezen.
- Onder de motorkap: **geen extra bibliotheek.** Een Excel-bestand is een zipbestand met XML erin, en de
  app bouwt die zip nu zelf op — onverpakt, want dat mag en dan is er geen compressie nodig. Getest door
  het eigen bestand weer door de Excel-lezer van de kalenderimport te halen: vier tabbladen, alle cellen
  correct, getallen als getal, en namen met aanhalingstekens of een ampersand blijven heel.

## v0.43.0
- **Clubexport: alle ploegen in één bestand, in Excel.** Bij Clubbeheer staat een knop *Clubexport*, voor
  de clubbeheerder en de eigenaar. Twee bestanden om uit te kiezen.
- **Speeltijd per speler.** Eén regel per speler per gespeelde wedstrijd: ploeg, seizoen, datum,
  tegenstander, minuten, basis of bank, of hij beschikbaar was, doelpunten, assists, kaarten en
  keeperbeurten. Dat is de tabel waaruit een jeugdcoördinator met een draaitabel alles haalt wat hij wil —
  wie te weinig speelt, hoe de speeltijd over een ploeg verdeeld is, hoe iemand evolueert. Wie niet
  beschikbaar was, staat er ook in: zonder die regels lijkt iemand die vaak niet kon even weinig te
  spelen als iemand die wel kwam maar niet opgesteld werd.
- **Wedstrijdenlijst.** Eén regel per wedstrijd, ook de geplande: datum, uur, tegenstander, thuis of uit,
  terrein, format en de uitslag.
- **Uit de databank, niet van je toestel.** Ook ploegen die je op dit toestel nooit opende zitten erin —
  anders zou je uitvoer afhangen van waar je toevallig geweest bent.
- **Spelernotities en kwetsuurdetails zitten er bewust niet in.** In de app zijn die enkel voor
  beheerders; in een bestand dat naar een bestuur gemaild wordt, zijn ze dat niet meer.
- Geplande wedstrijden staan niet in het speeltijdbestand: nul minuten zou elk gemiddelde vertekenen. Ze
  staan wel in de wedstrijdenlijst.

## v0.42.0
- **Een hele lichting doorschuiven in één keer.** "Speler overzetten" heet nu **Spelers doorschuiven** en
  werkt met vinkjes in plaats van met één speler per keer. Je kiest van-ploeg en naar-ploeg, vinkt aan wie
  meegaat — met **Allemaal** als snelkoppeling — en zet ze samen over. Bij een seizoensovergang was dat
  vijftien keer dezelfde vier stappen; nu is het één handeling per ploeg.
- **Vinkjes en geen "alles automatisch"**, omdat er altijd iemand achterblijft: wie stopt met voetballen,
  of wie een jaar in dezelfde categorie blijft.
- **Iedereen houdt zijn verleden.** Een doorgeschoven speler behoudt zijn blijvende spelers-id, dus op
  zijn pagina blijft "Carrière — eerder bij" zijn wedstrijden bij de vorige ploeg tonen. Had hij dat id
  nog niet, dan wordt het ook in zijn oude wedstrijden bijgeschreven — in één doorloop, niet per speler.
- **Nakijken vóór het opslaan:** je krijgt de lijst te zien van wie meegaat, en hoeveel spelers bij de
  bronploeg achterblijven.
- **En het kan in één klik terug.** Na een doorschuifbeurt staat er *"Ongedaan maken"*, dat beide
  spelerslijsten exact terugzet. Eén stap, tot een dag erna.
- Praktische tip die de app niet voor je kan bedenken: **begin bij de oudste ploeg.** Schuif U12 naar U13,
  dan U11 naar U12, dan U10 naar U11. Omgekeerd staan er even twee lichtingen in één lijst.
- Wie achterblijft en gestopt is, haal je uit de spelerslijst via **Spelers** — daar kan je dat sinds
  v0.41.0 ook ongedaan maken.

## v0.41.0
- **Nieuw scherm "Teruggevonden": wat je per ongeluk wiste, staat er nog.** Bij **Beheer** vind je nu de
  verwijderde wedstrijden en tornooien terug, met wanneer ze gewist zijn en door wie, en je zet ze in één
  klik terug — volledig, met gebeurtenissen, opstelling en notities. Die back-ups bestonden al, maar er
  was geen enkel scherm om ze te zien: in de praktijk waren ze onbereikbaar.
- Voor elke beheerder, niet enkel voor de eigenaar: wie zijn eigen wedstrijd wist, moet ze zelf kunnen
  terughalen zonder iemand te moeten bellen.
- **Een verwijderde ploeg** kan de eigenaar er ook volledig terugzetten: spelers, wedstrijden, leden en
  notities. De oude uitnodigingslink werkt daarna niet meer — maak een nieuwe aan.
- **Een tornooi zonder wedstrijden verdwijnt niet meer zonder vangnet.** Dat was het enige dat nergens
  bewaard werd; de bevestiging zei zelfs dat het niet ongedaan te maken was. Nu wordt het bewaard en
  vind je het terug bij Teruggevonden.
- **En een speler per ongeluk uit je spelerslijst tikken, kan je nu ongedaan maken.** Dat kruisje staat
  klein tussen twee tekstvelden, en op een telefoon gaat dat mis. Verwijderde spelers komen op een
  stapeltje: één tik zet de laatste terug op zijn oude plaats, en dat kan meerdere keren. Er staat ook
  bij dat er nog niets opgeslagen is — het scherm verlaten zonder opslaan liet je al terugkeren, maar
  dat wist je niet.

## v0.40.0
- **Een back-up neemt nu de spelers van al je ploegen mee.** Tot nu zaten er wél de wedstrijden van
  álle ploegen in, maar enkel de spelers van de ploeg die op dat moment open stond. Het tandwieltje
  staat op elk scherm, dus je wist zelden welke ploeg dat was: je nam een back-up zonder te weten wiens
  spelers je meenam. Nu zit elke ploeg met haar eigen spelers in het bestand. Staat een ploeg nog niet
  op je toestel, dan haalt de app haar erbij. Na het downloaden zegt de app wat er in het bestand zit.
- **Terugzetten gaat per ploeg.** In plaats van "samenvoegen" of "alles vervangen" krijg je een lijst
  van de ploegen in het bestand, met per ploeg hoeveel wedstrijden, spelers en tornooien erin zitten.
  Je vinkt aan wat terug moet en kiest per ploeg tussen **toevoegen wat ontbreekt** (de veilige weg, en
  de standaard) of **volledig terugzetten**. Wat je niet aanvinkt, blijft exact zoals het is.
- **"Alles vervangen" bestaat niet meer, en dat was de bedoeling.** Die knop wiste de wedstrijden van
  álle ploegen op je toestel en overschreef bovendien de spelerslijst van de ploeg die open stond — dus
  een back-up van U11 terugzetten terwijl U13 open stond, overschreef de spelers van U13. Dat kan nu
  niet meer: een spelerskern gaat altijd terug naar haar eigen ploeg.
- **Een ploeg uit het bestand die niet bij jouw ploegen zit**, kan je niet terugzetten — haar spelers
  horen bij een ploeg die je niet beheert. In plaats daarvan kan je haar wedstrijden **toewijzen aan een
  ploeg die je wél beheert**, of overslaan. Zonder die keuze zouden ze op je toestel staan zonder ooit
  ergens te verschijnen.
- Bij een ploeg waar je enkel kijker bent, worden de wedstrijden teruggezet maar de spelers niet — die
  schrijfactie zou de databank toch weigeren, en dan mislukt het stil.
- Een back-up zet je clubnaam, clublogo en je donkere modus niet meer terug: het clublogo staat
  intussen bij de club zelf, en je weergave-instellingen overschrijven bij een herstel is een
  verrassing die niemand vraagt.

## v0.39.0
- **Meerdere wedstrijden in één keer aanpassen.** Bij "Wedstrijden" staat een knop *Meerdere aanpassen*.
  Je tikt de wedstrijden aan die je samen wil wijzigen, kiest één ding, en past het toe. Bedoeld voor wat
  na een kalenderimport altijd terugkomt: dertig wedstrijden staan op ploeg-label "B" en dat moet "Zwart"
  worden.
- **Zoek eerst, vink dan aan.** De zoekbalk blijft werken in dat scherm, en "Alles in de lijst" volgt je
  zoekterm — dus wat je weggefilterd hebt, wordt ook niet aangevinkt.
- **Wat je kan aanpassen:** ploeg-label, soort wedstrijd, terrein, truikleur, trainer en
  ploegverantwoordelijke. En op **geplande** wedstrijden ook wedstrijdvorm, aantal blokken en blokduur —
  die bepalen mee de speelminuten, dus op een gespeelde wedstrijd blijven ze onaangeroerd. Zitten er zulke
  wedstrijden in je selectie, dan zegt de app vooraf hoeveel er dus niet meewijzigen.
- **Wat je bewust niet kan aanpassen:** de ploeg, de tegenstander, de datum, het uur, thuis of uit, en
  alles rond selectie, opstelling, plan en gebeurtenissen. Dat is geen vergetelheid: één misklik op de
  ploeg deed vandaag een wedstrijd uit de lijst verdwijnen.
- **Nakijken vóór het opslaan.** Je krijgt te zien bij hoeveel wedstrijden wat verandert, met de lijst
  erbij en per wedstrijd de waarde die er nu staat. Wat al goed stond, wordt overgeslagen.
- **En daarna kan het in één klik terug.** Na een wijziging staat er bovenaan de wedstrijdenlijst
  *"Ongedaan maken"*, dat de oude waarden terugzet. Eén stap terug, tot een dag na de wijziging.

## v0.38.1
- **Nieuw blok "Niet afgesloten" op het ploegscherm.** Wedstrijden waarvan de dag voorbij is en die
  nooit afgesloten werden — nooit gestart, of gestart maar nooit beëindigd. Die stonden tot v0.38.0 bij
  "Eerstvolgende", waar ze niet hoorden, maar ze mogen ook niet gewoon verdwijnen: er hangt een verslag
  aan dat nog afgewerkt moet worden. De recentste staat bovenaan, maximaal twee. Enkel voor wie de
  ploeg beheert — een kijker kan er niets aan doen. Een afgelaste wedstrijd staat er niet bij, en een
  wedstrijd die al bovenaan in de gele melding staat ook niet: dezelfde wedstrijd twee keer op één
  scherm leest als twee problemen.
- **"Laatst gespeeld" toont er nu twee in plaats van één**, en — belangrijker — de **juiste** twee. Dat
  blok was gesorteerd op wanneer een wedstrijd was *aangemaakt*, niet op wanneer ze gespeeld was. Sinds
  de kalenderimport bestaan er wedstrijden die vandaag zijn ingelezen maar over maanden gespeeld worden,
  en dan stond onder "laatst gespeeld" de laatst ingelezen wedstrijd.

## v0.38.0
- **Een wedstrijd van vorige week staat niet meer bij "Eerstvolgende wedstrijden".** Een geplande
  wedstrijd die nooit gestart of afgesloten werd, bleef daar staan alsof ze nog moest komen — en duwde
  zo de échte volgende wedstrijd van het startscherm. Nu tonen we enkel wat vandaag of later is. Een
  wedstrijd die loopt blijft altijd staan, ook als ze gisteren begon: die moet je kunnen openen. In de
  volledige wedstrijdenlijst staat alles nog gewoon.
- **Het rugnummer past nu in zijn vakje bij het samenstellen van de selectie.** Bij een nummer van twee
  cijfers was het laatste cijfer niet meer te zien. De oorzaak waren de pijltjes omhoog/omlaag die een
  getalveld standaard meebrengt: die aten de breedte op, precies terwijl je typte. Die pijltjes zijn nu
  weg — voor een rugnummer tik je het getal toch. Het vakje is even groot gebleven en de cijfers zijn
  niet kleiner geworden.
- **Een wedstrijd van een andere ploeg is nu gewoon te bewerken, selectie en opstelling inbegrepen.** De
  app had altijd maar de spelers van één ploeg in handen — die van de ploeg die je open hebt — terwijl je
  wedstrijden van al je ploegen op je toestel staan. Bij een wedstrijd van een andere ploeg kende het
  bewerkscherm die spelers dus niet: sinds v0.37.5 kreeg je daar een waarschuwing, en kon je de selectie
  niet aanpassen. Nu haalt de app die spelers zelf op. Meestal staan ze al op je toestel van een eerder
  bezoek — dan gaat het onmiddellijk en werkt het ook zonder internet.
- Lukt het ophalen niet, bijvoorbeeld bij een ploeg die je op dit toestel nog nooit opende én zonder
  verbinding, dan blijft het gedrag van v0.37.5: je kan de gegevens van de wedstrijd bijwerken, de ploeg
  blijft ongewijzigd, en de app zegt waarom de selectie niet kan.
- Die opgehaalde spelerslijst wordt bewust **niet** bij je ploegenlijst gezet: die lijst hoort bij de
  ploeg die je open hebt, en er iets aan toevoegen zou háár spelers kunnen overschrijven. Ze bestaat dus
  enkel zolang het scherm open staat.

## v0.37.5
- **Een wedstrijd bewerken kan haar niet meer naar een andere ploeg verhuizen.** Bovenaan stap 1 staat
  een keuzelijst "Eigen ploeg". Stonden de spelers van die ploeg nog niet op je toestel, dan zette die
  lijst geen vinkje — en een keuzelijst zonder vinkje toont zijn eerste optie. Bij het doorklikken nam
  de app dat over als de ploeg van de wedstrijd. Gevolg: de wedstrijd verhuisde stil naar een andere
  ploeg en verdween daarna uit de lijst van haar eigen ploeg, zonder één melding. Niets ging verloren —
  ze stond onder de verkeerde naam — maar je kon ze niet meer vinden.
- Nu staat de eigen ploeg van de wedstrijd zelf in die lijst, aangevinkt, met de vermelding **"nog niet
  geladen"**. Klik je gewoon door, dan blijft alles staan zoals het was. Er komt ook een waarschuwing
  bij: je kan de gegevens van de wedstrijd bijwerken, maar wil je de selectie of de opstelling
  aanpassen, kies die ploeg dan eerst bij Ploegen.

## v0.37.4
- **"Klik de link in de mail die we je stuurden" — maar die was er nooit.** Accounts van vóór v0.37.0
  hebben nooit een bevestigingsmail gekregen, en die stonden dus naar een mail te zoeken die niet bestaat.
  De melding zegt nu dat je ze hieronder opnieuw kan sturen als je er geen gekregen hebt, en waarom dat
  bij een ouder account zo is. Enkel tekst.

## v0.37.3
- **De herinnering over je e-mailadres dreigt niet langer.** Er stond "zonder bevestiging kan je niet als
  club- of ploegbeheerder aangesteld worden" — maar wie dat leest, ís dat meestal al, en dan klinkt het
  alsof je iets gaat verliezen. Nu staat er dat je behoudt wat je hebt, en waarvoor bevestigen dan wél
  dient. Enkel tekst; er verandert niets aan wat de app doet.

## v0.37.2
- **Bevestigd is nu ook meteen bevestigd.** Klikte je de link aan, dan bleef de herinnering staan tot je
  je afmeldde en opnieuw aanmeldde. Nu volstaat het om terug te keren naar de app: zodra ze weer op de
  voorgrond komt, kijkt ze het na. Er staat ook een knop **"Ik heb de link aangeklikt"** bij, voor wie
  niet wil wachten — die zegt eerlijk of het al doorgekomen is of niet.
- **Belangrijker, want dit zag je niet:** onder water bleef je ook ná het aanklikken onaanstelbaar. De app
  wist dat je bevestigd was, maar het bewijs dat ze aan de databank voorlegde was nog het oude — en dat
  werd stil geweigerd. Alleen opnieuw aanmelden haalde een nieuw bewijs op. Dat vernieuwt de app nu zelf.
- **Iemand promoveren via de ledenlijst kende de bevestiging niet.** En dat is net de weg die je in de
  praktijk gebruikt: een trainer komt binnen via een uitnodigingslink en wordt daarna gepromoveerd. Wie
  zich met het adres van iemand anders registreerde, stond dus met díe naam in je ledenlijst. Nu staat er
  bij zo iemand **"e-mailadres niet bevestigd"**, en waarschuwt de app je nog eens op het moment dat je
  promoveert. Hetzelfde bij het goedkeuren van iemand die zelf ploegbeheer aanvraagt.
- Bewust géén blokkade op die twee wegen: jij gaf de uitnodiging zelf en kent de persoon meestal. Bij het
  aanstellen op e-mailadres — waar dat adres het énige bewijs is — blijft het wél een weigering.
- Vraagt een nieuwe publicatie van de databankregels.

## v0.37.1
- **Na het registreren zegt de app nu écht dat er een mail onderweg is.** In v0.37.0 stond die boodschap
  op het aanmeldformulier, maar een nieuw account heeft nog geen ploeg, dus springt de app onmiddellijk
  naar het ploegkeuzescherm — het formulier met die tekst was dan al weg en niemand zag ze ooit. Nu komt
  er een venster dat blijft staan tot je het wegklikt, met het adres erin en de tip om in de spammap te
  kijken. Lukt het versturen niet, dan zegt het venster dat ook, in plaats van te zwijgen.

## v0.37.0
- **Een nieuw account krijgt een bevestigingsmail.** Wie zich registreert, krijgt een mail met een link.
  Aanmelden werkt meteen, ook vóór die link aangeklikt is — je staat nooit stil aan de zijlijn omdat een
  mail nog in een spammap ligt.
- **Bevestigen telt waar het moet tellen: bij het aanstellen van een beheerder.** Een clubbeheerder of
  ploegbeheerder stel je aan door zijn e-mailadres in te tikken. Registreren met het adres van iemand
  anders kon tot nu, en zo kon je andermans aanstelling opvangen. Nu lukt een aanstelling enkel naar een
  bevestigd adres, en zegt de app ook dát — niet langer "geen account gevonden", maar "dit e-mailadres is
  nog niet bevestigd". Die controle zit ook in de databankregels, niet enkel in het scherm.
- **Nog niet bevestigd? Dat staat in Instellingen → Account**, met een knop om de mail opnieuw te sturen.
  Klik je de link aan en open je de app opnieuw, dan verdwijnt de herinnering vanzelf.
- De handleiding vermeldt de bevestigingsmail bij "Account aanmaken".
- **Bestaande beheerders moeten niets doen.** Wie vandaag ploeg- of clubbeheerder is, blijft dat, en ook
  een uitnodigingslink of code werkt onveranderd. De controle geldt enkel op het moment dat iemand nieuw
  aangesteld wordt door zijn e-mailadres in te tikken.
- **Contactadres is nu `info@matchdelegate.be`** in plaats van een privé-gmailadres — bij "Probleem
  melden", in de privacyverklaring en in het foutmeldingsvenster.

## v0.36.1
- **"Doelpunt" in plaats van "Goal".** In het verslag, de tijdlijn en het deelbericht stond bij een
  eigen doelpunt *"Goal Mats Keppens"* en bij de tegenpartij *"Doelpunt KVV Beukenhof"*. Nu staat er
  in beide gevallen **Doelpunt**. De knop tijdens de wedstrijd heet nog altijd *Goal* — dat is een
  korte actietekst op een tegel, geen omschrijving van wat er gebeurd is.

## v0.36.0
- **De kalender van je reeks komt er nu in één keer in.** Bij "Wedstrijden" staat een tweede knop,
  *Kalender importeren*. Je geeft het agendabestand (`.ics`) dat Foot24 bij je reeks aanbiedt, of een
  tabel (`.xlsx`/`.csv`), en je krijgt de hele lijst te zien met vinkjes: datum, uur, tegenstander,
  thuis of uit en het adres van het terrein. Wat je aanvinkt, komt als geplande wedstrijd binnen.
  Format, aantal blokken, blokduur en soort staan in geen enkele kalender, dus die kies je één keer
  bovenaan voor alles wat je nu inleest.
- **Wat er al staat, wordt niet stil overschreven.** Een wedstrijd die de app al kent, draagt
  "Staat er al" en is niet aangevinkt. Vink je ze toch aan, dan worden enkel tegenstander, datum,
  uur, thuis/uit en plaats bijgewerkt — selectie, opstelling, plan, gebeurtenissen en notities
  blijven staan. Dat maakt een verschoven kalender een kwestie van opnieuw inlezen.
- **Korte en officiële clubnamen worden aan elkaar geknoopt.** Foot24 schrijft "SPORTKRING
  ROESELARE" waar jij "SK Roeselare" intikte; de app ziet dat het om dezelfde wedstrijd gaat en zegt
  onder welke naam ze al bestaat. Staat er die dag een wedstrijd die er niet bij past, dan is het een
  waarschuwing en geen dubbel — de regel blijft aangevinkt, jij beslist.
- **Een A- en een B-ploeg blijven van elkaar gescheiden.** Speelt jouw ploeg in twee delen, dan staan
  er op dezelfde dag twee wedstrijden, en het ploeg-label bepaalt welke van de twee bij de kalender
  hoort die je inleest. Dat label stelt de app zelf voor uit de reeksnaam in het bestand ("U11 A" →
  label A); voor de kalender van de andere ploeg wijzig je dat ene veld. Staat de wedstrijd van die
  dag onder het ándere label, dan zegt de waarschuwing dat er ook al "Olsa Brakel (B)" staat — zo zie
  je meteen of er iets verkeerd gelabeld is in plaats van een dubbel te krijgen.
- Reclame die zo'n agenda meesleept, valt weg: van de 33 items in een echte Foot24-kalender zijn er
  16 wedstrijden, de rest zijn aankondigingen. Alleen wat "eigen ploeg – tegenstander" is, komt in de
  lijst.
- Onder de motorkap: geen extra bibliotheek in de app. Een `.xlsx` is een zipbestand, en dat pakt de
  browser zelf uit — inclusief het uitlezen van de opmaakcodes, zodat een Excel-datum geen kaal
  getal wordt. Nieuw bestand `js/import-cal.js` (achtste script).
- De schermafbeeldingen in de handleiding tonen dit scherm nog niet; de tekst wel.

## v0.35.1
- **De handleiding kent de nieuwe mogelijkheden.** Bij "Live wedstrijd bijhouden" staat nu hoe je een
  speler bijzet en wat "Vertrokken" doet, plus een stuk over twee wedstrijden van dezelfde ploeg op
  hetzelfde uur — dat het gewoon kan, ook met hetzelfde account op twee toestellen, en wanneer de app
  wél waarschuwt. Bij "Selectie & opstelling" staat er eindelijk bij dat een formatie een voorstel is:
  de bijhorende plekken worden groter getekend, maar je mag iedereen overal zetten, en een andere
  formatie verhuist niemand. En bij het wedstrijdverslag dat "bijgekomen" of "speelt elders" achter
  een naam kan staan.
- De screenshots in de handleiding tonen de knop "Speler bijzetten" nog niet.

## v0.35.0
- **Je kan nu een speler bijzetten terwijl de wedstrijd loopt.** Tot nu lag de selectie vast vanaf het
  startsignaal: een laatkomer, of iemand die vanaf een tweede veld komt bijspringen, was niet te
  registreren. In het livescherm, onder de bank, staat daarvoor de knop "Speler bijzetten". Je kiest
  hem uit het rooster (of als losse speler), hij komt op de bank, en je brengt hem in met een gewone
  wissel. Zijn speeltijd start pas wanneer hij effectief het veld op gaat; aan de minuten van de
  anderen verandert er niets. Bij een tornooiwedstrijd komt hij ook in de selectie van die dag.
- **Bij zijn naam staat "bijgekomen"** — in de app, in het verslag en in de PDF. Zonder die vermelding
  leest zijn lagere speeltijd als een keuze van de trainer.
- **"Vertrokken" naast "Blessure" en "Niet aanwezig".** Voor wie al speelde: zijn teller stopt, zijn
  gespeelde minuten blijven staan en je kan meteen iemand inbrengen — maar het heet geen blessure
  meer. Voor wie nog niet speelde: hij komt onder "Niet aanwezig" te staan met de reden "speelt
  elders", en die wedstrijd telt niet als gemist in zijn aanwezigheidscijfer.
- **De 8v8-formaties "Dubbele ruit" en "3-3-1" lichtten exact dezelfde shirts op**, zodat ze op het
  veld niet uit elkaar te houden waren. De 3-3-1 heeft nu wat hij hoort te hebben: een vlakke rij van
  drie op het middenveld en een echte spits, waar de ruit een diepe middenvelder en een punt houdt.
  Bij de 2-3-2 staan de twee spitsen nu centraal vooraan in plaats van op de vleugels, zoals de
  formatie ze ook tekent. En bij de 5v5-ruit staan de twee middenvelders niet langer pal tegen de
  zijlijn maar wat naar binnen. Alle rugnummers blijven dezelfde, en geen enkele bewaarde opstelling
  verschuift: dit bepaalt alleen welke plekken de app als voorstel aanduidt.
- **Twee wedstrijden van dezelfde ploeg tegelijk starten geeft geen waarschuwing meer.** Bij de
  jongste reeksen is dat de normale gang van zaken: twee groepjes, twee locaties, hetzelfde uur. De
  waarschuwing komt nu alleen nog wanneer er echt iets misloopt — de andere wedstrijd staat vergeten
  open (haar klok tikt door), of er staan spelers in beide selecties, en dan met hun namen erbij.

## v0.34.1
- **De aanval staat op de grote baklijn, en de shirts zijn groter.** De voorste rij (LFA t/m RFA)
  stond een eindje onder het strafschopgebied en staat nu op die lijn. De vijf rijen liggen daardoor
  ook alle even ver van elkaar — eerst was dat 14/14/14/16 procent, en die kleinste afstand begrensde
  hoe groot een shirt kon zijn.
- **Het shirt hangt nu aan de breedte van het veld** in plaats van aan een vast aantal pixels. Op een
  telefoon van 390 punten breed groeit het van 50 naar 57 pixels, op een grotere naar 60. Vaste pixels
  liepen mis op een smal toestel: daar krimpt het veld mee terwijl het shirt bleef staan, en dan liep
  een naamplaatje over het shirt van de rij eronder. Nu schaalt alles samen.
- **De screenshots in de handleiding tonen weer wat de app doet.** Die van de opstelling, de pauze en
  het verslag stonden nog met de oude bollen van voor v0.34.0.
- Een speler zonder bewaarde veldpositie (uit een oude of half ingevulde opstelling) wordt op de
  hoogte van zijn lijn getekend, en die hoogtes volgen nu dezelfde rijen als het rooster.

## v0.34.0
- **Shirts in plaats van bollen op elk velddiagram.** In het shirt staat het **rugnummer** — een shirt
  vraagt daar om, en dat is het enige nummer dat de trainer én de spelers zelf gebruiken; waar iemand
  staat, ís zijn positie. De naam staat eronder, de doelman is oranje. Gebruikt een ploeg geen
  rugnummers, dan blijft het shirt leeg. Ook de PDF tekent nu shirts, zodat het verslag hetzelfde
  toont als het scherm.
- **Het positienummer staat niet meer op het veld.** Het leeft voort in de lijsten, de tijdlijn, het
  pauzescherm en de PDF, als bijvoorbeeld *CAM (9)*.
- **Een lege plek toont zijn positiecode** (bv. `CA`) onder het open shirt; die verdwijnt zodra er
  iemand op staat.
- **Je zet je spelers vrij op het veld.** Er staan **26 plekken** op het veld — 5 kolommen × 5 rijen
  plus de doelman — en je zet elke speler waar je wil. De plekken lagen tot nu vast per formatie: acht
  vakjes in een dubbele ruit, en verder niets. Wil je één speler wat meer naar voren of naar de flank,
  dan kan dat nu gewoon.
- **De formatie is een voorstel geworden, geen dwangbuis.** Kies je *Dubbele ruit*, dan lichten die
  acht plekken sterker op; de rest van het rooster staat er lichter bij en is even goed aan te tikken.
  Daardoor vervalt ook de oude waarschuwing *"de plaatsen veranderen, je stelt iedereen opnieuw op"* —
  een andere formatie (of een andere wedstrijdvorm) verzet niemand meer, en je opstellingen voor de
  volgende delen blijven staan.
- **Elke plek heeft een positienummer, en binnen een opstelling komt elk nummer één keer voor.** De
  nummers volgen de Nederlands-Belgische traditie (1 keeper, 2 rechtsback, 3-4 centraal, 5 linksback,
  6 en 8 middenveld, 10 aanvallende middenvelder, 7 rechts, 9 spits, 11 links) en staan per **formatie**
  vast, niet per wedstrijdvorm: in een 4-3-3 is de linksbuiten de 11, in een 4-4-2 is de 11 een spits.
  Met één nummer per plek liep dat vast — bij 8v8 2-3-2 kwamen 11 en 7 twee keer op het veld.
- **De statistiek *Posities* gaat per plek** in plaats van per linie: *CAM×5 · CM×3 · RM×1* zegt meer
  dan *Middenveld×9*. De linie staat er als samenvatting onder. Voor wedstrijden van vóór deze versie
  wordt de plek afgeleid uit lijn en veldpositie, dus je seizoen blijft leesbaar.
- **Grotere shirts en meer lucht tussen de linies**, zodat aantikken op een telefoon makkelijker gaat.
  Onder het veld staat niet meer dat het gekleurde shirt de doelman is — dat leest je van het veld af.
- **In de planner kan je een speler op een vrije plek zetten**, per deel. Tik hem aan en tik een lege
  plek: hij verhuist en zijn oude plaats blijft leeg. Tot nu kon je daar enkel *ruilen* — twee spelers
  van plaats laten wisselen — en was er na het opslaan geen weg terug naar het scherm met alle plekken.
  De vrije plekken zijn alleen daar te zien: in het wedstrijdscherm, het verslag, de PDF en bij een
  kijker blijft het veld enkel de opstelling tonen.
- **Na een rode kaart blijft het een man minder.** Van de bank iemand op een vrijgekomen plek zetten
  wordt geweigerd; een speler die al op het veld staat mag er wél naartoe verhuizen. Dat laatste is
  precies waarvoor dit bestaat: na een uitsluiting je ploeg herschikken.
- **Ook tijdens de wedstrijd en in de pauze kan je een speler naar een vrije plek zetten.** Tik hem
  aan, tik de lege plek: hij verhuist en zijn oude plaats blijft leeg. In de pauze komt het in de
  wachtrij voor het volgende deel (*"Wout M. naar CAM (9)"*), tijdens het spel gaat het meteen door.
  Tot nu kon een positiewissel enkel een **ruil** zijn — er moest iemand op die plek staan — en na een
  rode kaart was je ploeg dus niet meer te herschikken. In het verloop staat het als één beweging:
  *"Wout Maes → CAM (9)"*.
- **Een positiewissel die je klaarzet, wijst nu naar een plek op het veld.** Je kiest de speler en
  tikt daarna op het veld aan waar hij naartoe gaat — lege plekken inbegrepen. Tot nu koos je uit een
  lijstje spelers die op dat moment op het veld stonden, en werd het positienummer bewaard. Dat gaf
  drie problemen: je kon geen lege plek plannen (net het geval dat je na een rode kaart nodig hebt),
  de meeste van de 26 plekken dragen geen nummer en waren dus onkiesbaar, en een nummer betekent iets
  anders per formatie — wijzigde je die na het plannen, dan wees je plan naar een andere plek. Bij het
  doorvoeren geldt nog altijd: staat er iemand, dan ruilen ze; staat er niemand, dan verhuist hij.
  Wissels die je eerder al klaarzette blijven werken, en zodra je er een bewerkt schrijft de app ze
  naar de nieuwe vorm om.
- **Spelers staan netjes op hun roosterplek.** Een wedstrijd van vóór deze versie draagt nog de
  coördinaten van een formatieslot, en die vallen net tussen de rijen — drie spelers van dezelfde lijn
  stonden dan op drie hoogtes. Ze worden nu op hun plek getekend, op het scherm en in de PDF. De
  bewaarde gegevens blijven ongewijzigd; dit is enkel weergave.
- Bestaande opstellingen worden binnen hun eigen lijn op het rooster teruggevonden, zodat niemand stil
  van linie verandert. De doelmanscode heet **`GK`**.
- Eén markering voor alle drie de velddiagrammen (wizard, pauzescherm/planner/verslag, en "posities
  herplaatsen"). Die waren uit elkaar gegroeid als bol mét en zónder rand.

## v0.33.1
- **Een wedstrijd met een onbekende wedstrijdvorm blokkeert het bewerkscherm niet meer.** Stond er in
  een wedstrijd een vorm die niet (meer) in de app bestaat, dan klapte zowel *Selectie* als
  *Opstelling* dicht zonder enige melding — en net daar, op stap 1, zit de enige plek waar je de vorm
  kan rechtzetten. Nu valt de app terug op de standaardvorm van de ploeg (of 8v8) en zegt een melding
  wélke vorm niet herkend werd, met de vraag ze na te kijken. Bij het opslaan krijgt de wedstrijd de
  geldige vorm mee. Hetzelfde voor *'Spelers bewerken'*, dat op zo'n wedstrijd ook vastliep.
- Dit is preventief: elke wedstrijd die de app zelf aanmaakt heeft een geldige vorm, want die kies je
  uit een lijstje. Het wordt pas echt wanneer een wedstrijdvorm ooit hernoemd of geschrapt wordt —
  wedstrijden die dan al op de toestellen staan houden de oude naam.

## v0.33.0
- **De selectie zegt enkel nog wie meegaat.** De knoppen *Basis · Wissel · NB* worden **Mee · NB**.
  Wie start bepaal je bij de opstelling, en **wie je niet op het veld zet, staat automatisch op de
  bank**. De reden: basis/wissel was al lang geen keuze meer maar een gevolg — een basisspeler die je
  nooit plaatste werd bij het opslaan stil wisselspeler, en sinds v0.31.x overschrijft de planner de
  hele veldbezetting van deel 1. Twee plaatsen bepaalden dus hetzelfde feit. Meteen ook dezelfde
  woordkeuze als de tornooiselectie, die al met *Mee · NB* werkte.
- **De teller bovenaan de selectie** toont nu gewoon **hoeveel spelers je geselecteerd hebt**, met het
  aantal niet-beschikbare ernaast. Er stond eerst *geselecteerd / veldgrootte* (bv. `10/8`), maar die
  noemer doet alleen iets op de grens en leest erboven als een fout — de veldgrootte is hier geen
  bovengrens: je mag een ruime kern meenemen. Het getal is groen zodra je genoeg spelers hebt, oranje
  als het er te weinig zijn, en dan legt de waarschuwing eronder uit hoeveel je er tekort komt.
- **De uitleg bij de selectie zit onder *'Hoe werkt dit?'*.** Dat blok stond volledig open en besloeg
  een halve telefoonhoogte vóór je de eerste speler zag; nu staat er één regel en klap je de rest open
  als je ze nodig hebt — hetzelfde patroon als in de planner.
- **Minder spelers dan het veld groot is: een waarschuwing, geen blokkade.** Heb je 7 spelers voor
  8v8, dan staat er *"dan begin je met 1 speler minder op het veld"* en kan je gewoon door. Voordien
  blokkeerde de selectiestap op het aantal basisspelers.
- **'Auto-plaats' is weg.** Die vulde het veld met de spelers die je als *Basis* had aangeduid; nu de
  selectie dat niet meer zegt, zou hij uit je kern zelf een basiself moeten kiezen. Het veld begint
  leeg en je zet de spelers er zelf op. *'Wissen'* heet nu *'Veld leegmaken'*.
- **Eén lijst onder het veld** in plaats van *'Nog te plaatsen'* + *'Op de bank'* — het waren altijd
  dezelfde spelers. Zolang het veld niet vol is heet ze *'Nog op het veld te zetten'*, daarna *'Op de
  bank'*.
- Het datamodel is onveranderd: `starting` betekent nog exact hetzelfde en wordt nog door dezelfde
  code gezet. Bestaande wedstrijden openen en bewaren zoals voordien.
- **Alle 16 screenshots in de handleiding zijn opnieuw genomen.** De vorige waren van 29 juli en
  toonden nog het oude positiemodel, de knoppen *Basis · Wissel* en de formatie *1-3-3-1*, die niet
  meer bestaat. De ingebedde versie voor de PDF (`handleiding-screenshots.js`) is meegegenereerd.
- **Op het homescherm staat bij een live wedstrijd het deel op een eigen regeltje** onder *LIVE*.
  *"LIVE · KWART 1"* stond ernaast en botste op een telefoon tegen de eerste ploegnaam — op één regel
  is er geen plaats voor een status, twee ploegnamen én de score.

## v0.32.0
- **Een wedstrijd annuleren.** Onderaan een geplande wedstrijd staat nu *'Wedstrijd annuleren'*, voor
  een match die afgelast wordt zonder ooit gestart te zijn. Er is een optioneel redenveld (bv.
  *"onbespeelbaar terrein"*). Voordien was verwijderen de enige uitweg, en dan verdween ze helemaal —
  of ze bleef als geplande wedstrijd staan die nooit kwam.
- **Geannuleerd is een eigen toestand.** Niet gepland, niet gespeeld: in de wedstrijdenlijst staat ze
  in een eigen groep *'Geannuleerde wedstrijden'*, met een grijze rand en de badge *Geannuleerd*. In de
  agenda krijgt ze een hol bolletje (met een eigen regel in de legende), zodat ze niet te verwarren is
  met de volle stip van een gespeelde wedstrijd. Ze verdwijnt uit de uitslagen en uit alle statistieken,
  en telt in een tornooi niet mee in de balans — ze houdt het afsluiten van dat tornooi ook niet meer
  tegen.
- **Bij *'Eerstvolgende wedstrijden'* blijft ze staan tot en met haar eigen dag.** *"Die van zaterdag
  gaat niet door"* is nieuws zolang die zaterdag niet voorbij is; daarna verdwijnt ze daar (maar ze
  blijft in de agenda en in de wedstrijdenlijst staan). Daarin verschilt ze van een geplande wedstrijd,
  die bewust blijft staan zodat je ziet dat je vergat ze te starten.
- **Omkeerbaar.** De selectie, de opstelling en het hele wedstrijdplan blijven bewaard; met
  *'Annulering ongedaan maken'* staat de wedstrijd weer op gepland zoals ze was. Starten kan niet
  zolang ze geannuleerd is — de knop is weg en de handler weigert het ook zelf.

## v0.31.15
- **Verder gaan staat nu rechts.** Op het eerste kwart is er geen terugknop, en dan schoof
  *'Kwart 2 →'* naar de linkerkolom — onder *'+ Wissel'*, waar je een terugknop verwacht. Terug staat
  nu altijd links (onder *'+ Wissel'*), verder altijd rechts (onder *'+ Positiewissel'*).

## v0.31.14
- **Eén planner in plaats van twee.** Er waren twee varianten: één waarin je de kwarten na de wizard
  één voor één doorliep (met de geplande wissels eronder, afgesloten met *'Klaar'*), en één waarin je
  via het potloodje op de planningskaart één kwart bijstelde — daar zag je de opstelling wél maar de
  wissels van dat kwart niet. Nu is het overal hetzelfde scherm.
- **Vooruit én achteruit bladeren.** Onderaan staan nu `← Kwart 2` en `Kwart 4 →` (met nummer, zodat
  je ziet waar je naartoe gaat), en daaronder gewoon **Opslaan**. *'Klaar — rest volgt deze
  opstelling'* is weg.
- **De melding bij opslaan klopt nu.** *'Opgeslagen tot kwart 3'* somde alleen de kwarten ná je
  stoppunt op, dus kwart 2 bleef onvermeld terwijl dat evengoed geen eigen opstelling had. Nu één
  regel die altijd waar is: *'Wedstrijdplan opgeslagen. Kwarten zonder eigen opstelling beginnen zoals
  het vorige eindigt — later aanpasbaar via Planning.'*
- **Je ziet welk kwart losgekoppeld is.** Het bolletje op de kwart-knop heeft een legende (*'● = eigen
  opstelling'*) en een tooltip, en bij zo'n kwart staat er nu: *'Dit kwart heeft een eigen opstelling
  en volgt kwart 2 dus niet meer.'* Met *'Plan voor kwart X wissen'* maak je dat ongedaan.
- In de uitklapper *'Hoe werkt dit?'* staat de bijhorende tip: doorloop de kwarten van voor naar
  achter, want een kwart dat je zelf invult volgt de eerdere kwarten daarna niet meer.

## v0.31.13
- **De uitleglijn bovenaan de startopstelling stond verkeerd.** Het blokje is een flexbox, en door het
  vette woord in de tekst werd elk stukje tekst een apart item op één rij. De tekst zit nu in één
  geheel, het icoon staat netjes op de eerste regel en krimpt niet meer mee. Geldt ook voor dezelfde
  uitleglijn in de statistieken.

## v0.31.12
- **Een uitgesloten speler mag niet vervangen worden — de app houdt zich daar nu aan.** Dat een rode
  kaart (ook de automatische na twee gele) de speler van het veld haalt, klopte al. Maar het plan wist
  niets van rood: hij stond nog in de geplande opstellingen, hij stond nog op de bank om aangetikt te
  worden, en in sommige gevallen zette de app hem bij de start van een volgend kwart zelfs terug op
  het veld. Nu blijft zijn plaats leeg en speelt de ploeg met een man minder — zoals de spelregels
  vragen.
- Concreet: hij verdwijnt uit de bank (in de wisselmodal, het pauzescherm, de planner en de
  planningskaart), uit de geplande opstellingen van de volgende kwarten en uit het wedstrijdplan-PDF.
  Een wissel die hem zou inbrengen wordt geweigerd met een duidelijke melding, en een opstelling die
  je vóór de kaart ingaf krijgt een waarschuwing: *'is uitgesloten (rode kaart) — zijn plaats blijft
  leeg'*.
- Ook een wissel die per ongeluk ná de kaart in de gebeurtenissen staat, zet hem niet meer terug op
  het veld. Verwijder je de kaart (verkeerd ingegeven), dan komt alles gewoon terug zoals het was.

## v0.31.11
- **Een kwart zonder eigen opstelling begint nu zichtbaar zoals het vorige *eindigt*.** De drie
  planningsschermen toonden de opstelling waarmee het vorige kwart *begon*, zonder de wissels die je
  daarin plande — terwijl het PDF van dezelfde wedstrijd, en de wedstrijd zelf, wél van het einde
  vertrokken. Planner, planningskaart, PDF en de wedstrijd geven nu alle vier hetzelfde antwoord.
- Daardoor loopt de keten door: pas je kwart 1 aan, dan volgen kwart 2, 3 en 4 automatisch, zolang je
  ze niet zelf invulde. Wandel je enkel door de reeks zonder iets te verslepen, dan wordt er niets
  vastgelegd en blijft die keten in stand.
- **De meldingen zeggen nu wat er echt gebeurt.** "begint met die van het kwart ervoor" was
  dubbelzinnig — begin of einde van dat kwart? Op drie plekken staat nu *'begint zoals het vorige
  eindigt, met de wissels die je daar doorvoert erin'*.
- De uitklapper *'Hoe werkt dit?'* maakt het onderscheid dat er echt is: **vul je een kwart in**, dan
  vergelijkt de app bij het einde van het vorige kwart het *werkelijke* veld met jouw plan en zet ze de
  nodige wissels klaar — ook als er iets heel anders gebeurde dan gepland. **Vul je het niet in**, dan
  zet ze niets klaar en loopt het gewoon door.

## v0.31.10
- **Stap 3 van een nieuwe wedstrijd heet nu "Startopstelling"** (bij meer dan één deel), met eronder
  één regel: *'Dit is de opstelling waarmee je begint. De opstelling van de volgende kwarten en de
  wissels geef je in de volgende stap in.'* Voordien stond dat alleen onderaan, en dan nog
  geformuleerd rond opslaan.
- **In het planningsvenster staat een uitklapper "Hoe werkt dit?"** die uitlegt wat de app zelf doet:
  sluit je een kwart af, dan vergelijkt ze het veld met je plan voor het volgende en zet ze de nodige
  wissels klaar in het pauzescherm; bij de start worden die automatisch doorgevoerd. Wissels die je
  voor *tijdens* een kwart plant, gaan niet vanzelf af — die voer je zelf door. En een kwart dat je
  niet invult, begint met de opstelling van het kwart ervoor.
- Bewust een uitklapper en geen pop-up: geen extra klik bij elke wedstrijd, en de uitleg blijft
  bereikbaar in plaats van na één keer *'niet meer weergeven'* voorgoed te verdwijnen.

## v0.31.9
- **Je ziet nu dat je op een speler kan tikken.** In de statistieken waren de spelersnamen al
  aanklikbaar (naar zijn persoonlijke statistieken), maar het enige signaal was de muisaanwijzer — op
  een telefoon dus niets. Bovenaan staat nu één regel *'Tik op een speler voor zijn persoonlijke
  statistieken'*, en elke aanklikbare rij krijgt een chevron (›) achteraan.
- Alleen voor ploegbeheerders: kijkers hebben geen spelerdetail en zien dus ook geen uitleg of
  chevrons. Rijen zonder detail (bv. *'Ploeg (geen tegendoel)'* bij de clean sheets) blijven zonder
  chevron.

## v0.31.8
- **Een nieuwe ploeg neemt het clublogo nu over.** Bij het aanmaken werd alleen de clubnáám op de
  ploeg gezet, niet het logo. Het logo belandde enkel op een ploeg wanneer je het in Clubbeheer
  opsloeg — en dan alleen op de ploegen die op dat moment bestonden. Een ploeg die je daarna aanmaakte
  bleef dus zonder logo, in de app én op elke PDF.
- **Bestaande ploegen herstellen zichzelf.** Merkt de app bij het openen van een ploeg dat het logo
  ontbreekt terwijl de club er een heeft, dan vult een clubbeheerder het bij. Eén keer, op de
  achtergrond — daarna zien ook de kijkers van die ploeg het logo. Je hoeft het logo dus niet opnieuw
  op te laden.
- **Terugval binnen dezelfde club:** kent je toestel het logo van een andere ploeg van dezelfde club,
  dan gebruikt het dat meteen — ook offline en ook als je geen beheerder bent. Een ploeg van een
  ándere club leent nooit een logo.

## v0.31.7
- **Het clublogo staat nu ook op het wedstrijdplan (PDF).** Het stond er in de code al sinds v0.23.0,
  op exact dezelfde plek als bij het verslag — maar het logo zelf komt uit een ophaalactie die aan het
  veld (traag of geen netwerk) kan mislukken. Net het wedstrijdplan maak je daar, terwijl je het
  verslag thuis op wifi maakt: zelfde code, ander moment, en dus enkel op het plan een lege plek.
- Het clublogo wordt daarom **per ploeg op het toestel bewaard** en dient als terugval. Elk document
  — wedstrijdplan, wedstrijdverslag en tornooiverslag — draagt het logo nu ook zonder bereik, en
  altijd dat van de juiste ploeg.

## v0.31.6
- **Een tornooi in de agenda ziet er niet langer uit als een geplande wedstrijd.** Het kaartje onder
  de kalender droeg de oranje rand en badge van een geplande wedstrijd — ook wanneer het tornooi al
  afgesloten was. Het heeft nu de **eigen tornooikleur** (groen), dezelfde als de stip in de kalender
  en de legende die er net boven staat.
- Een **afgesloten** tornooi krijgt er een badge *Afgesloten* bij en de vermelding *'· afgesloten'*
  in de onderregel — dezelfde woordkeuze als op het Tornooien-scherm. De kleur zegt dus wát het is,
  de badge in welke staat het is.

## v0.31.5
- **Van ploeg wisselen laadt de spelers meteen.** Het rooster stond in één lokale sleutel die enkel
  de actieve ploeg bevatte, en die werd pas overschreven zodra de cloud antwoordde. In dat gaatje —
  op traag 4G makkelijk enkele seconden — zag je de spelers van de *vorige* ploeg, of niemand. Elke
  ploeg heeft nu zijn eigen bewaarde spelerslijst op het toestel: bij een tweede bezoek staat ze er
  onmiddellijk, ook zonder bereik.
- **"Nog geen spelers" wordt niet meer gezegd als ze enkel nog moeten laden.** Zolang de lijst
  onderweg is staat er *'Spelers laden…'* — op het spelersscherm, in de selectiestap van een
  wedstrijd en bij de tornooiselectie. Enkel als de ploeg écht leeg is, zegt de app dat ook.
- Een **nieuwe wedstrijd of een nieuw tornooi** beginnen kan pas als de spelerslijst binnen is; je
  krijgt anders de vraag om het een paar seconden later opnieuw te proberen. Voordien kon zo'n
  wizard een lege of verkeerde selectie vastzetten die zich daarna niet meer herstelde.
- De **spelerslijst vult zich nu zelf aan** wanneer het rooster pas na het openen binnenkomt. Tijdens
  het bewerken gebeurt dat niet, zodat ingetypte wijzigingen nooit verloren gaan.
- **Vangnet tegen een verkeerde ploeg overschrijven:** een wijziging aan de spelers wordt niet meer
  gesynchroniseerd zolang de lijst van de actieve ploeg niet binnen is. Voordien kon de lijst van de
  vorige ploeg zo bij de nieuwe ploeg terechtkomen.

## v0.31.4
- **Kijkers zien de planning niet meer.** Onder *Planning* stonden de velddiagrammen per kwart, de
  bank en de geplande wissels — ook voor wie enkel meekijkt. Daar staat nu: *'De opstelling en
  geplande wissels zijn enkel zichtbaar voor ploegbeheerders.'* Dat het plan bestaat blijft dus
  zichtbaar; wat erin staat niet.
- Dat geldt **ook tijdens de wedstrijd**, in het tabblad *Opstelling*. Daar toonde hetzelfde blok de
  nog te spelen kwarten — net de gevoeligste informatie, want dat is wat er nog gaat gebeuren.
- Is er helemaal geen plan, dan blijft het blok weg zoals voorheen; er verschijnt geen melding over
  iets dat niet bestaat.
- Voor ploegbeheerders verandert er niets.

## v0.31.3
- **De bank staat nu ook op de opstellingsstap.** Onder het veld stond enkel *'Nog te plaatsen'*;
  wie je op **Wissel** gezet had, was hier onzichtbaar. Merkte je pas op dit scherm dat je iemand
  verkeerd aangeduid had, dan moest je terug naar de selectie. Nu tik je hem aan in de lijst **'Op
  de bank'** en daarna de speler op het veld die hij vervangt: die twee **ruilen van plaats**. Het
  veld blijft daardoor vanzelf even vol.
- **Het veld moet vol zijn voor je kan opslaan.** Bovenaan staat een teller (*8/8*), en opslaan met
  een half bezet veld wordt geweigerd. Heeft je ploeg minder spelers dan er plaatsen zijn — zeven
  voor 8v8 — dan volstaan die zeven; dat blijft dus gewoon werken.
- **Wie na het vullen van het veld overblijft, wordt automatisch bank.** Voorheen kon iemand als
  basisspeler zonder plaats achterblijven en dan nergens meer opduiken.
- **'Auto-plaats'** plaatst nog steeds enkel de basisspelers en laat de bank ongemoeid.
- Op de selectiestap wordt niet langer gevraagd of je verder wil met minder basisspelers dan
  plaatsen: dat vul je nu aan op de opstellingsstap, waar de bank bij staat.

## v0.31.2
- **Het terugpijltje brengt je weer waar je vandaan kwam.** Ging je bij een bestaande wedstrijd naar
  *Bewerken → Selectie* en tikte je bovenaan op ‹, dan belandde je in de wedstrijdgegevens — een
  scherm dat je nooit geopend had — en vroeg een tweede tik of je de wedstrijd wel wou bewaren. Nu
  keer je in één tik terug naar de wedstrijd. Hetzelfde geldt voor *Info bewerken* en voor het
  bewerken van een lopende wedstrijd, dat netjes naar het wedstrijdscherm terugkeert.
- Vanaf de opstellingsstap gaat ‹ eerst nog naar de selectie (dezelfde stap als '← Vorige (selectie
  aanpassen)') en dan pas terug naar de wedstrijd.
- **Er wordt enkel nog gevraagd of je wijzigingen mag laten vallen als je er ook echt maakte.** De
  app vergelijkt met hoe de selectie erbij lag toen je binnenkwam; deed je niets, dan ga je gewoon
  terug. De wedstrijd zelf blijft in beide gevallen zoals ze was — teruggaan slaat nooit iets op.
- **Verbeterd:** boven een bestaande wedstrijd stond *'Nieuwe wedstrijd · Selectie'*. Dat is nu
  *'Wedstrijd bewerken · Selectie'*.
- Bij een nieuwe wedstrijd verandert er niets: ‹ op de eerste stap vraagt nog steeds of je wil
  verlaten zonder bewaren.

## v0.31.1
- **Eén knop voor het wedstrijdplan.** Onder het veld stonden *'Opstelling per kwart wijzigen'* en
  *'Wissels plannen'* naast elkaar, elk met hun eigen scherm voor de helft van hetzelfde plan. Nu
  staat er **'Opstelling en wissels per kwart'**, die dezelfde reeks opent als bij het aanmaken.
  Hetzelfde geldt voor het item in het menu *Bewerken*. Gericht één kwart bijstellen doe je nog
  altijd met het **potlood** in de planningskaart.
- Wissels die je bewust op *'geen voorkeur — altijd beschikbaar'* zette, horen bij geen enkel kwart
  en komen dus in die reeks niet voor. Daarvoor verschijnt nu een aparte knop **'Wissels zonder vast
  kwart'** — enkel wanneer je er hebt.
- Het **potlood** naast het velddiagram doet onveranderd wat het deed: dat ene kwart openen om
  gericht bij te stellen, met 'Opslaan' en 'Sluiten' en de vraag bij niet-opgeslagen wijzigingen.
- **Verbeterd:** de melding bij het onderbreken van de reeks klopte niet wanneer een later kwart al
  een eigen opstelling had. Ze zei dan dat álle resterende kwarten deze opstelling overnemen. Nu
  worden enkel de kwarten zonder eigen opstelling genoemd, en staat er correct dat ze die van het
  kwart ervoor volgen. Hebben alle resterende kwarten al een eigen opstelling, dan verschijnt de
  melding niet meer.

## v0.31.0
- **Het wedstrijdplan bouw je nu kwart per kwart op, in de volgorde waarin het gespeeld wordt.** Na
  de startopstelling tik je op **'Verder → wissels en volgende kwarten'** en krijg je telkens
  hetzelfde scherm: bovenaan de opstelling waarmee dat kwart begint, eronder de **wissels tijdens
  dat kwart** met '+ Wissel' en '+ Positiewissel', en onderaan de knop naar het volgende kwart. De
  titel zegt waar je bent (*'Kwart 2 van 4'*).
- **Stop je onderweg, dan zegt de app wat er met de rest gebeurt:** *'Kwart 3 en 4 beginnen met
  dezelfde opstelling als kwart 2'*, met de keuze om toch verder te gaan. Dat gedrag bestond al —
  een kwart zonder eigen opstelling volgt het vorige — maar je moest het maar weten.
- Ook bij een wedstrijd van één blok kan je nu meteen de wissels voor dat blok klaarzetten; vroeger
  verscheen die stap enkel bij meer dan één deel.
- De knop **'← Vorige'** op de opstellingsstap heet nu **'← Vorige (selectie aanpassen)'**, zodat op
  voorhand duidelijk is waar hij naartoe gaat.
- Los een kwart bewerken vanuit het wedstrijdscherm blijft precies zoals het was, met 'Opslaan' en
  'Sluiten'. De opstelling wordt tussentijds bewaard zodra je in de reeks een wissel plant, zodat er
  niets tussenuit valt.

## v0.30.0
- **Je kan een selectie opslaan zonder al een opstelling te maken.** Onderaan de selectiestap staan
  nu twee uitwegen: **'Volgende → Opstelling'** om meteen door te gaan, of **'Opslaan zonder
  opstelling'** om enkel te bewaren wie er meespeelt. Dat laatste is wat je 's avonds wil wanneer de
  ploeg al rond is maar je nog niet weet wie waar begint. Geldt zowel bij een nieuwe wedstrijd als
  bij een wedstrijd die je eerder zonder selectie inplande.
- **Zolang er geen opstelling is, blijft het blok Planning weg** — een velddiagram zou daar spelers
  tonen die je nooit geplaatst hebt. In de plaats staat er **'Opstelling aanmaken'**, en zodra die
  er is verschijnt alles: de opstelling per kwart, de geplande wissels en het wedstrijdplan als PDF.
  De wedstrijd starten kan pas als er een opstelling is.
- **Bij het opslaan van de opstelling staat er nu bij wat dat betekent:** alle kwarten beginnen met
  die opstelling, en je past ze later enkel aan waar er iets verandert. Dat was al zo, maar het
  stond nergens — de knop 'Opstelling volgende delen' leek daardoor verplicht werk.
- Heeft een wedstrijd al een opstelling, dan verandert er niets: 'Selectie opslaan' laat bestaande
  plaatsen staan en geeft nieuwe basisspelers automatisch een vrije plek, zoals voorheen. Bestaande
  wedstrijden op je toestel merken niets van deze wijziging.

## v0.29.1
- **Het startscherm toont nu de twee eerstvolgende wedstrijden** in plaats van één. Met één
  wedstrijd zag je wel wat er aankomt, maar niet of er datzelfde weekend nog iets volgde. De kop
  heet dan *'Eerstvolgende wedstrijden'*; staat er maar één klaar, dan blijft alles zoals het was.
  Een lopende wedstrijd komt nog altijd bovenaan.

## v0.29.0
- **De geplande wissels bewerk je nu rechtstreeks in de planningskaart.** Naast de opstelling stond
  al een potlood; de wissels eronder waren enkel te lezen. Nu heeft elke geplande wissel en
  positiewissel er een **potlood** en een **kruisje** naast, en onder het lijstje staan **'+ Wissel'**
  en **'+ Positiewissel'** die er meteen een klaarzetten voor het kwart waar je naar kijkt. Het
  scherm *'Wissels plannen'* blijft bestaan en werkt onveranderd — dit is dezelfde planning, maar
  bij het kwart zelf.
- Na het aanpassen of toevoegen kom je terug in het planningsscherm waar je vandaan kwam, niet in
  het wisselmenu. Wijzig je in de keuzelijst alsnog het kwart, dan springt de kaart mee naar dat
  kwart, zodat je ziet waar je wissel terechtgekomen is.
- Tijdens de wedstrijd blijft de planning zoals ze was: daar is ze om na te kijken, niet om te
  herwerken.

## v0.28.0
- **De opstelling per kwart wijzig je nu met 'Opslaan' of 'Sluiten'.** Elke tik werd meteen bewaard,
  ook als je enkel aan het proberen was — en onderaan stond alleen 'Sluiten', wat het omgekeerde
  liet vermoeden. Nu blijven je wijzigingen in het scherm staan tot je op **Opslaan** drukt; met
  **Sluiten** gooi je ze weg. Heb je iets gewijzigd en sluit je toch, dan wordt eerst gevraagd wat
  er moet gebeuren. Ook 'Plan voor kwart N wissen' telt als een wijziging die je nog kan annuleren.
- **De knoppen onder het velddiagram staan in de volgorde waarin je plant:** eerst *'Opstelling per
  kwart wijzigen'*, dan *'Wissels plannen'*.
- **Een selectie kan je nu ook helemaal wissen.** Onder *Bewerken* staat bij een geplande wedstrijd
  **'Selectie wissen'**: dat haalt de selectie, de opstellingen per kwart en de geplande wissels
  weg. De wedstrijd zelf (tegenstander, datum, formaat) blijft staan en komt weer op *'selectie nog
  niet ingegeven'*, zodat je van nul kan herbeginnen zonder de wedstrijd te verwijderen en opnieuw
  aan te maken. Enkel zolang de wedstrijd nog niet gestart is.

## v0.27.1
- **Positiewissels op hetzelfde moment staan nu als één regel in het verloop, de PDF en de CSV.**
  Pauzepositiewissels (en positiewissels in dezelfde speelminuut) horen samen: *"A ruilt met B"*
  gevolgd door *"B ruilt met C"* is netto één herschikking. Elk event apart tonen liet een
  tussenstand zien die nooit op het veld gestaan heeft — in het verslag van kwart 4 stond bv.
  *"Marco naar 9, Iluca naar 10"* en daarna *"Theo naar 9, Marco naar 3"*, terwijl het gewoon
  *"Théo naar 9 · Marco naar 3 · Iluca naar 10"* was. De reeks wordt nu doorgerekend en per speler
  staat enkel het eindpunt; wie netto op zijn plek blijft, valt weg.
- De onderliggende events blijven apart opgeslagen (niets aan de data verandert); alleen de
  weergave voegt samen. Verwijderen wist de hele reeks in één keer — de losse delen hebben apart
  geen betekenis — met een bevestigingsvraag die de gecombineerde beweging toont.

## v0.27.0
- **Ook de knoppen 'Wissel' en 'Positiewissel' werken nu op het velddiagram.** Ze toonden nog rijen
  naamkaartjes, terwijl het tabblad *Opstelling* sinds v0.24.0 al met het veld werkte — twee
  manieren voor hetzelfde ding. Nu tik je overal hetzelfde: bij een wissel de speler op het veld die
  eraf gaat en dan wie er van de bank in komt, bij een positiewissel de speler die verplaatst en dan
  de plek waar hij naartoe gaat. Onderaan staat in gewone taal wat er gaat gebeuren
  (*"Dries komt voor Finn"*, *"Bram B. naar 9 CAM · Lars L. naar 5 LV"*) voor je bevestigt.
- De knoppen blijven bestaan omdat ze iets kunnen wat het veldtabblad niet kan: een wissel toevoegen
  aan een **kwart dat al gespeeld is** (via *Event toevoegen*). Het veld toont dan de opstelling van
  dát kwart. In de pauze wordt het net als vroeger een pauzewissel, met de opstelling van het
  volgende kwart op het veld.
- *Wissel na blessure* houdt zijn eigen scherm: daar is al bekend wie eraf gaat, dus hoef je alleen
  nog te kiezen wie invalt.

## v0.26.1
- **Overal waar een positiewissel getoond wordt, staat nu waar elke speler terechtkomt**:
  *"Bram Bal → 7 RM · Gust Geens → 5 LV"* in plaats van *"Bram Bal ↔ Gust Geens"*. Dat geldt voor
  het verloop op het scherm, de tijdlijn in de PDF, de CSV-export en de klaargezette wissels — en
  ook voor een gewone ruil van twee, niet alleen voor een keten. Bij oudere wedstrijden waarin de
  posities niet meegeschreven werden, blijft de oude vorm staan.
- **'Niet geselecteerd' staat niet meer in de PDF** van het wedstrijdverslag. Dat document gaat naar
  buiten en gaat over de wedstrijd die gespeeld is, niet over wie er die dag thuisbleef. Op het
  scherm blijft de groep gewoon staan, en *'Niet beschikbaar'* en *'Geselecteerd maar niet
  aanwezig'* blijven ook in de PDF — die zeggen iets over de wedstrijd zelf.

## v0.26.0
- **Klaargezette positiewissels lezen nu als bewegingen**, met de plek waar elke speler belandt:
  *"Bram B. naar 7 RM"*. Voordien stond er *"Emiel wisselt met Bram"*, en bij een keten van drie
  spelers stond er dan iemand twee keer in — dat las alsof er iets fout ging terwijl de uitkomst
  klopte. Nu krijgt elke speler die verhuist zijn eigen regel.
- Ze staan **samen in één blok** onder de kop *Positiewissels*, in plaats van elk in een eigen rij.
  Het kruisje wist ze allemaal tegelijk: bij een keten hoort dat zo — er één uithalen zou de rest op
  een onbedoelde plek achterlaten. De gewone wissels blijven wel elk hun eigen regel en kruisje
  houden.

## v0.25.2
- **Fout rechtgezet in het velddiagram van het verslag.** Gebeurde er een positiewissel tijdens een
  deel, dan verwisselde het diagram van een later deel twee spelers. Op het veld stond alles goed —
  het was de reconstructie die de opstelling opbouwt voor het verslag en de PDF. Ze sloeg
  positiewissels uit **vorige** delen over, terwijl die wel degelijk gebeurd waren; elke pauzewissel
  daarna bouwde dan verder op een verkeerde stand. Gevonden bij het nagaan van een simulatie, en
  nagerekend over 150 wedstrijden met wissels en positiewissels in elk deel: nu geen enkele
  afwijking meer tussen het diagram en de werkelijke veldbezetting.
- Positiewissels **binnen** het deel dat je bekijkt blijven buiten het diagram — dat toont de
  opstelling waarmee het deel begint. Een keeperwissel halverwege telt dus pas mee vanaf het
  volgende deel, precies zoals voordien.

## v0.25.1
- **De PDF van het wedstrijdverslag toont nu ook de positiewisselingen**, in een eigen kadertje
  onder de wissels van dat deel: *"11' Bram B. → 7 RM"*, met het positienummer en de code van de
  plek waar de speler naartoe ging. Elke positiewissel levert twee regels — beide spelers
  verhuizen. Het velddiagram toont enkel de opstelling waarmee een deel begint, dus zonder dit
  kadertje was nergens te zien dat iemand halverwege verschoof. Delen zonder positiewisselingen
  krijgen geen kader.

## v0.25.0
- **De opstelling die je voor een kwart tekende, staat vanaf de pauze vanzelf klaar.** Zodra je een
  kwart beëindigt, rekent de app uit welke wissels er nodig zijn om het volgende kwart met jouw
  opstelling te beginnen, en zet die klaar — je krijgt te zien wat het zijn. Voordien moest je daar
  in de pauze een knop voor indrukken; vergat je dat, dan begon het volgende kwart stil met wie het
  vorige eindigde, en leek je opstelling genegeerd.
- Je houdt de controle: de wissels staan gewoon in het pauzescherm, met een kruisje per regel om er
  één weg te halen, en je kan er op het veld nog bij tikken. Pas bij *Start kwart 2* worden ze
  doorgevoerd.
- **Wat je zelf al klaarzette, blijft met rust.** Stond er al iets klaar, dan raakt de app het niet
  aan — dat zou je handwerk wissen. De knop heet dan *'Geplande opstelling opnieuw toepassen'* en
  vervangt op jouw vraag alsnog alles door het plan.

## v0.24.0
- **Wisselen tijdens de wedstrijd doe je nu gewoon op het veld.** In het tabblad *Opstelling* staat
  onder het veld de **bank**, met de minst gespeelde speler eerst. Tik een bankspeler en dan een
  speler op het veld om te wisselen, of twee veldspelers om ze van plaats te ruilen — precies zoals
  je dat in de pauze al deed. Het verschil: tijdens het spel wordt het meteen een event, dus komt er
  eerst een bevestiging. De knoppen *Wissel* en *Positiewissel* blijven gewoon bestaan.

## v0.23.0
- **Nieuw: het wedstrijdplan als PDF.** Eén knop bij een geplande wedstrijd én tijdens de wedstrijd
  (onderaan het tabblad *Opstelling*). Per deel zie je **twee velddiagrammen** naast elkaar —
  *bij de start* en *na de geplande wissels* — met de wissels ertussen in twee kolommen (**out** met
  een rood pijltje omlaag, **in** met een groen omhoog), en de positiewissels daaronder. Onder elk
  veld staat de bank **van dat moment**. Voor een deel zonder geplande wissels staat er één veld.
- Er passen **twee delen op een pagina**, ook op de eerste met de kop erboven.
- **Een speler hernoemen in het rooster werkt nu door in bestaande wedstrijden.** Een wedstrijd
  bewaart zijn eigen kopie van de naam — dat blijft zo voor gasten en voor wie de ploeg intussen
  verliet — maar bij een naamcorrectie wordt die kopie overal meegetrokken: in de wedstrijden, bij
  de niet-beschikbare spelers en in de tornooiselecties. Je krijgt te zien in hoeveel wedstrijden
  het is aangepast. Rugnummers en posities blijven per wedstrijd staan, die mogen afwijken.
- Ook het scherm **Selectie** haalt de naam voortaan uit het rooster, zodat het opnieuw opslaan van
  een selectie een achtergebleven naam alsnog rechtzet.
- De **formatie** staat niet meer in het infokaartje van een geplande wedstrijd: ze hoort bij de
  opstelling, en daar staat ze ook (met het linkje om ze te wijzigen).
- Het plan rekent **door over de delen heen**: een wissel in kwart 1 werkt door in de opstelling van
  kwart 2, tenzij je voor dat kwart zelf een opstelling plande — die beschrijft een eindtoestand en
  gaat dus voor. Delen die al gespeeld zijn, tonen wat er écht stond.

## v0.22.0
- **Een geplande positiewissel wijst nu naar een plek, niet naar een speler.** Je zet klaar dat
  iemand *"naar positie 5"* gaat; wie daar op dát moment staat, neemt zijn plaats over. Voordien
  werd de tegenpartij al bij het plannen vastgelegd, en dat liep mis zodra een eerdere wissel uit
  hetzelfde kwart die plek aan iemand anders gaf — dan kreeg je een foutmelding over een speler die
  al van het veld was. Positiewissels die je vóór deze versie klaarzette, blijven werken zoals ze
  waren.
- **Wissels plan je per kwart.** 'Wissels plannen' heeft tabjes per deel (plus *Altijd* voor wat
  aan geen enkel deel hangt): je kiest het kwart bovenaan, ziet wat daar al klaarstaat, en alles wat
  je toevoegt hoort er meteen bij. De keuzelijst in het invoerscherm staat dan al **voorgevuld** op
  dat kwart — je hoeft niets te kiezen, maar je kan het nog bijstellen. Doe je dat, dan springt de
  lijst mee naar het kwart waar je wissel beland is.
- **De spelerslijst houdt rekening met wat je al plande.** Zet je voor kwart 2 eerst "A eruit, B
  erin" klaar, dan staat B daarna gewoon tussen de veldspelers wanneer je een volgende wissel of
  positiewissel voor dat kwart plant — en A niet meer. Voordien vertrok die lijst nog van de
  opstelling bij de *start* van het kwart, waardoor je je eigen invaller niet kon kiezen.
- **'Alle N doorvoeren'** werkt de hele lijst van een kwart in één keer af: eerst de wissels, dan de
  positiewissels. Die volgorde is precies wat het bovenstaande mogelijk maakt — een positiewissel
  naar "plaats 5" vindt zo de invaller die daar door een wissel uit diezelfde reeks net beland is.
  Elke regel houdt daarnaast zijn eigen knop, voor wanneer je ze één voor één wil nemen.

## v0.21.0
- **Een positiewissel kies je nu op de plek, niet op de tweede speler.** Je duidt aan wie
  verplaatst en daarna de **positie** waar hij naartoe gaat; wie daar staat, neemt zijn plaats over.
  Zoals een trainer het zegt: "jij gaat naar de 9". Je hoeft niet meer op te zoeken wie daar ook
  alweer stond. Geldt zowel voor een positiewissel tijdens de wedstrijd als voor eentje die je
  klaarzet.
- **Bij elk positienummer staat de code.** Bij 11v11: 1 DM · 2 RV · 3 CV · 4 CV · 5 LV · 6 CVM ·
  7 RA · 8 CM · 9 SP/CA · 10 CAM · 11 LA. Op een klein veld heten dezelfde nummers anders — daar is
  9 een CAM, 10 een CVM en zijn 7 en 11 middenvelders (RM/LM) in plaats van aanvallers. De knoppen
  staan op positienummer gesorteerd (1 achteraan, 9 vooraan) en tonen wie er nu op die plek staat.
- **Tijdens de wedstrijd wissel je posities ook gewoon door twee spelers op het veld aan te tikken**,
  net als in de pauze. Omdat dit meteen een event met een tijdstip wordt, volgt er wel altijd een
  bevestiging — in de pauze staat een misklik enkel klaar, tijdens het spel niet.
- Wat er opgeslagen wordt verandert niet: het blijft een gewone positiewissel tussen twee spelers,
  dus het verloop, de keeperminuten en het verslag werken precies zoals vroeger.

## v0.20.4
- **Een wissel voor een later deel kijkt nu naar dát deel.** Zette je een wissel klaar voor kwart 3,
  dan toonde het scherm nog altijd wie er bij de aftrap van de wedstrijd op het veld stond. Nu
  toont het wie er volgens de planning aan kwart 3 begint — kies je een ander kwart, dan schuiven de
  lijsten mee. Dezelfde correctie geldt voor de melding *"X staat niet op het veld"*: die keek naar
  de huidige stand en verscheen dus bij spelers die pas vanaf dat kwart meedoen.
- Geldt voor gewone wissels én positiewissels. Zonder gekozen deel blijft alles zoals het was: dan
  is de huidige veldbezetting het uitgangspunt.
- Het kopje onder het veld heet nu **'Geplande wissels tijdens dit kwart'** (of deze helft, of dit
  deel), zodat duidelijk is dat het om klaargezette wissels gaat.
- **'Herstel' bij een niet-aanwezige speler zet hem weer in de basis** zolang de wedstrijd nog niet
  begonnen is. Voordien bleef hij achter als basisspeler die tegelijk niet op het veld stond: de
  planning telde hem mee, de veldbezetting niet. Bij een wedstrijd die al loopt blijft hij bewust
  van het veld — daar hoort een echte wissel bij.

## v0.20.3
- **De wissels die je aan een deel koppelde, staan nu onder het veld van dát deel** — in de
  planningskaart van een geplande wedstrijd én in het blok *Planning* tijdens de wedstrijd. Blader
  je naar kwart 3, dan zie je de opstelling waarmee dat kwart begint, de bank, en daaronder de
  wissels die je voor kwart 3 klaarzette. Een wissel zonder gekozen deel staat er niet bij: die
  hoort nergens specifiek thuis en blijft in *Wissels plannen* staan.

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
