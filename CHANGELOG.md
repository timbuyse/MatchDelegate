# Changelog — MatchDelegate

Leesbaar overzicht van de wijzigingen per versie, nieuwste bovenaan. Bedoeld als
naslag naast de technische commit-messages. Versies vóór 0.5.19 staan in de
git-geschiedenis en in de `analyse-*`-bestanden in de repo.

De meeste wijzigingen sinds 0.5.19 komen uit een grondige audit van het nieuwe
clubmodel (rollen: eigenaar → clubbeheerder → ploegbeheerder → kijker → gast).

---

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
