# De kalender van een ploeg bij de RBFA ophalen — meting 31-08-2026

Gemeten vanaf `localhost:3002` (de app-oorsprong van deze werkmap), dus met dezelfde
browserbeperkingen als de echte app. Vier ploegen van Sparta Petegem Deinze (club 1641) plus één
ploeg van een andere club, en de faalgevallen erbij. Nog geen code: dit is de verkenning waar de
import op gebouwd wordt.

## 1. Geen vingerafdruk nodig

De verkenning startte met een *persisted query* (een sha256-hash die de server herkent in plaats van
een vraag). Die werkt, maar blijkt **niet nodig**: hetzelfde endpoint neemt gewoon de querytekst aan,
precies zoals `js/import-vv.js` het al doet.

```
POST https://datalake-prod2018.rbfa.be/graphql
{"query": "<onze eigen tekst>", "variables": {...}}
```

Getest en bevestigd voor zowel de kalender als de clubploegenlijst. Daarmee valt de hele
afhankelijkheid van de hash weg: verandert de site haar vraag, dan verandert er voor ons niets. Wat
er *wel* kan gebeuren is dat de bond een veld hernoemt in haar schema — dan komt er een gewone
GraphQL-foutmelding terug, met de naam van het veld erin. Dat is netjes te melden.

CORS staat open: het antwoord komt binnen vanaf een willekeurige oorsprong, zonder sleutel of
aanmelding.

### Toch: hoe je een hash opnieuw vindt

Bewaard omdat het één keer nodig was om de vraagteksten te vinden, en omdat het de enige manier is om
een query te leren kennen die de site alleen server-side stelt.

1. Haal `main.<hash>.js` van rbfa.be op. Daar staan **alle** GraphQL-vraagteksten in klare taal, en
   `query <Naam>` erboven. De namen die er staan: `getClub`, `getClubInfo`, `getClubTeams`,
   `getClubGrounds`, `GetTeam`, `GetTeamCalendar`, `GetTeamMembers`, `GetPlayerStatistics`,
   `GetSeriesCalendar`, `GetSeriesRankings`, `getTeamsInSeries`, `DoSearch`, en een dertigtal andere.
2. Wil je de bijhorende hash: neem de ruwe tekst, haal twee spaties indent weg, haal de spatie voor
   `(` na de operatienaam weg, en zet `__typename` als laatste veld in **elke** geneste
   selectieverzameling (niet in de buitenste). Sha256 daarvan is de hash.
3. Gecontroleerd op twee queries: `GetTeamCalendar` gaf `3f0441e6…6383` en `GetTeam` gaf
   `e16f98f7…3858`, beide exact gelijk aan wat de site zelf verstuurt.

Onderscheppen werkt ook, maar alleen binnen één paginabezoek: `window.fetch` overschrijven en dán
**binnen** de pagina doorklikken. Een volledige herlaadbeurt wist je onderschepper. En veel
clubpagina's halen hun data server-side op, dus daar valt niets te onderscheppen — vandaar de bundel.

## 2. De kalender

```graphql
query GetTeamCalendar($teamId: ID!, $language: Language!, $sortByDate: SortDirection) {
  teamCalendar(teamId: $teamId, language: $language, sortByDate: $sortByDate) {
    id startTime channel showScore state startDateTimeInThePassed ageGroup
    homeTeam { id name clubId logo }
    awayTeam { id name clubId logo }
    outcome { status homeTeamGoals homeTeamPenaltiesScored awayTeamGoals awayTeamPenaltiesScored subscript }
    series { id name }
    officials { lastName firstName status personAssigned }
  }
}
```

Variabelen: `{teamId, language: "nl", sortByDate: "asc"}`. Eén verzoek per ploeg, het hele seizoen in
één keer.

Gemeten bij vier ploegen van één club:

| Ploeg | teamId | wedstrijden | reeksen |
|---|---|---|---|
| U19 | 380596 | 17 | `FRN_881` U19 · `CHP_133274` U19 Interprov Voetb V D |
| Eerste Elftal A | 361264 | 38 | `FRN_874` · `CHP_136062` 2de Afd Voetb Vl A · `CHP_136560` Beker van Vlaanderen A · `CUP_3726` Croky Cup |
| U9 A | 381183 | 17 | `FRN_890` U9 · `CHP_135571` Provinciaal U9 E |
| G-voetbal A | 379993 | 10 | `CHP_132622` G-voetbal Ovl - Reeks 1 |

Plus SK Roeselare U19 (`360199`, andere club): 18 wedstrijden. **Exact dezelfde dertien velden bij
alle vijf.** Het patroon klopt.

Bereik: het eerste elftal loopt van 25-07-2026 tot 25-04-2027, dus de kalender is het volledige
seizoen, gespeeld én gepland, in één antwoord.

### Wat er wél in zit

* **`id` — het wedstrijdnummer.** Zeven cijfers, exact het nummer dat `import-vv.js` nu met de hand
  geplakt moet krijgen. Dit is de hoofdbuit.
* `startTime` — `"2026-08-19T20:00:00"`, zonder tijdzone. Lokale Belgische tijd, en al gesplitst in
  datum en uur zoals de app ze bewaart.
* `homeTeam` / `awayTeam` met `id`, `name`, `clubId` en een clublogo-URL.
* `outcome.status` (`finished` / `planned`) en de doelpunten. `homeTeamPenaltiesScored` /
  `awayTeamPenaltiesScored` staan er voor een strafschoppenreeks, maar stonden in álle gemeten
  wedstrijden op `null` — ook bij bekerwedstrijden die gespeeld waren.
* `series` met `id` (`FRN_` / `CHP_` / `CUP_` + nummer) en `name`.
* `officials` — de scheidsrechter(s), als naam of als status (`"Nog aan te duiden"`, `"BAKBVB"`).
* `showScore` — bij U9 staat die op `false`: de bond publiceert daar geen uitslagen. Klopt met wat
  het scherm van "Wedstrijdinfo ophalen" al zegt over de jongste reeksen.

### Wat er niet in zit

**Geen terrein en geen adres.** Nergens een `venue` of `location`. Dat komt pas mee bij het ophalen
per wedstrijd. `impVoerUit` zet `venue` dus op leeg — waar de ICS-import dat veld wél vulde.

## 3. Vier dingen waar de import op moet letten

### a. De clubnaam is niet betrouwbaar, `clubId` wel

Binnen één ploeg staat de eigen club onder verschillende namen in verschillende wedstrijden. Bij het
eerste elftal alleen al vier: `KFC Sparta Petegem A`, `SPARTA PETEGEM DEINZE`,
`SPARTA PETEGEM DEINZE A`, `Sparta Petegem Deinze A`. De vriendschappelijke reeksen schrijven alles
in hoofdletters zonder achtervoegsel; de competitiereeksen gebruiken gewone schrijfwijze mét
achtervoegsel.

**Thuis of uit nooit op naam bepalen.** `homeTeam.id === <onze teamId>` is exact en gratis. De
ICS-import moest wel op naam werken (`impIcsNaarRegels` vergelijkt `impNorm(d.thuis)` met de eigen
club) — hier hoeft dat niet.

### b. De naam van de tegenstander draagt bondsachtervoegsels

`Koninklijke Eendracht Aalst Lede 3-2`, `RFC Wetteren A 3-2`, `TK Meldert A 3-2`, `VK Ninove 3`,
`FCV Dender EH 3`. Die `3`, `3-2` en losse `A` zijn het niveau- en ploegnummer van de bond, geen deel
van de clubnaam. Die moeten eraf voor de naam op het kaartje komt, en vóór `impZelfdeClub` erop
losgelaten wordt.

Goed nieuws voor de dubbeldetectie: `impZelfdeClub` kijkt naar gedeelde woorden van vier letters of
langer, dus `RFC Wetteren A 3-2` en een eerder ingetikte `RFC Wetteren` matchen al op `wetteren`. Het
tweede net houdt. Het opkuisen is dus voor de leesbaarheid, niet om de detectie te redden.

### c. `series.id` zegt niet of het een beker is

`Beker van Vlaanderen A` zit onder `CHP_136560`, niet onder `CUP_`. Alleen de Croky Cup is `CUP_`.
Het voorvoegsel is dus geen betrouwbaar signaal voor het wedstrijdformat; de reeks*naam* is dat beter
(`beker` erin). `FRN_` = vriendschappelijk lijkt wel te kloppen op alle gemeten gevallen.

### d. `channel` bepaalt welke wedstrijdpagina erbij hoort

`voetbalvlaanderen` bij alles behalve de twee Croky Cup-wedstrijden, die op `belgianfootball` staan.
`import-vv.js` haalt zijn gegevens bij hetzelfde GraphQL-endpoint op (`matchDetail`), dus dit raakt
alleen een eventuele link naar de publieke pagina, niet het ophalen zelf.

## 4. Waar het ploegnummer vandaan komt

Het nummer staat in de link van de ploegpagina: `rbfa.be/nl/club/1641/ploeg/380596/overzicht`. Maar
het is ook op te vragen, met dezelfde ruwe query:

```graphql
query getClubTeams($clubId: ID!, $language: Language!) {
  clubTeams(clubId: $clubId, language: $language) { id clubId name discipline }
}
```

Sparta Petegem gaf 39 ploegen, SK Roeselare 31 — met nette namen: `Eerste Elftal A`, `Reserven B`,
`U19`, `U17 A`, `U11 B`, `G-voetbal C`. Dus: **clubnummer intikken → lijst → aanvinken.** Het
clubnummer staat in de link van de clubpagina, en is te bevestigen met:

```graphql
query getClub($clubId: ID!, $language: Language!) {
  club(clubId: $clubId, language: $language) { id name registrationNumber logo typLigue }
}
```

Club 1641 → `SPARTA PETEGEM DEINZE`, stamnummer `03821`. Zo ziet de gebruiker meteen of hij het
juiste nummer heeft. (Er bestaat ook een `DoSearch` waarmee je op clubnaam kan zoeken — dan hoeft er
zelfs geen nummer meer aan te pas te komen. Nog niet uitgetest: die query heeft `channel` en
`location` als verplichte variabelen.)

## 5. Eén MD-ploeg kan twee RBFA-ploegen zijn

Bij ons is U11IP één ploeg met ploeglabels (A = Groen, B = Zwart); bij de bond zijn dat U11 A en
U11 B, elk in een eigen poule met een eigen kalender. De instelling moet dus een **lijst** van
ploegnummers zijn, niet één nummer.

Gevolgen:

* Eén verzoek per ploegnummer, en de antwoorden samenvoegen.
* Ontdubbelen op `id` (het wedstrijdnummer): mochten twee ploegen van dezelfde club tegen elkaar
  spelen, dan staat die wedstrijd in beide kalenders — één keer bewaren.
* Thuis-of-uit tegen **álle** ingestelde ploegnummers controleren, niet tegen één.
* De app heeft hier al een plaats voor: `m.subteam`, het label waarmee een A- en een B-ploeg van
  elkaar gehouden worden. `impSubteamUitReeks` leidt dat nu af uit de reeksnaam (`"U11 A"` → `A`).
  Per RBFA-ploegnummer een label meegeven doet hetzelfde, alleen exact in plaats van geraden — en
  `impMarkeerDubbels` gebruikt `subteam` al in zijn sleutel en in `impZelfdeSubteam`, dus de
  dubbeldetectie houdt A en B vanzelf uit elkaars weg.

Geen nieuw veld op de wedstrijd nodig voor de A/B-splitsing.

## 6. Faalgevallen, gemeten

| Wat | Antwoord |
|---|---|
| Onbestaand ploegnummer (`999999999`) | 200, `{"data":{"teamCalendar":[]}}` |
| Leeg ploegnummer | 200, lege lijst |
| Tekst als ploegnummer (`abc`) | 200, lege lijst |
| Onbestaand clubnummer bij `getClubTeams` | 200, `{"data":{"clubTeams":null}}` |
| Verkeerde persisted hash | 200, `{"errors":[{"message":"PersistedQueryNotFound",…}]}` |

Let op de eerste drie: een verkeerd ploegnummer is **niet te onderscheiden** van een ploeg zonder
wedstrijden. Beide geven een lege lijst. Daarom is de weg via de clubploegenlijst meer dan comfort:
zo kan er geen verkeerd nummer ingetikt worden, en betekent "geen wedstrijden" ook echt dat.

Een `getClubTeams` die `null` teruggeeft is wél een duidelijk signaal: dat clubnummer bestaat niet.

## 7. Buiten de browser lukt het niet

Vanuit PowerShell (`Invoke-WebRequest`, ook mét `Origin`-, `Referer`- en `User-Agent`-koppen) gaf
hetzelfde verzoek **status 200 met een leeg antwoord** — `Content-Length: 0`. Vermoedelijk een filter
dat op de TLS-vingerafdruk kijkt. Geen probleem voor de app, die in een browser draait, maar wel iets
om te weten: dit is niet met `curl` te testen.
