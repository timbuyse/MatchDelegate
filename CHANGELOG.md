# Changelog — MatchDelegate

Leesbaar overzicht van de wijzigingen per versie, nieuwste bovenaan. Bedoeld als
naslag naast de technische commit-messages. Versies vóór 0.5.19 staan in de
git-geschiedenis en in de `analyse-*`-bestanden in de repo.

De meeste wijzigingen sinds 0.5.19 komen uit een grondige audit van het nieuwe
clubmodel (rollen: eigenaar → clubbeheerder → ploegbeheerder → kijker → gast).

---

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
