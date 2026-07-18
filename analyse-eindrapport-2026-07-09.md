# Eindanalyse MatchDelegate — 9 juli 2026

Grondige eindanalyse vóór de testfase, vanuit drie perspectieven: (i) gebruiker/kijker, (ii) gebruiker/beheerder, (iii) designer/eigenaar. Gebaseerd op volledige codelezing van index.html (6.468 regels), sw.js (cache v34) en database.rules.json.

## TL;DR

De app staat er sterk voor: het rollenmodel is waterdicht afgedwongen in de Firebase-rules, de live-registratie is doordacht en snel, en de afwerking (donkere modus, exports, handleiding, privacyverklaring) is boven verwachting. **Klaar voor testers, mits een tiental gerichte fixes.** De belangrijkste: ±99 KB dode base64 in het bestand, statistieken tonen "schoten/reddingen" die nergens meer geregistreerd kunnen worden, drie foutjes in de CSV-export, en er ontbreekt een versienummer + feedbackkanaal. Grootste structurele risico's: offline-gedrag en het ontbreken van echte pushmeldingen.

---

## (i) Perspectief kijker

### Goed
- Lage instapdrempel: QR/link → registreren → automatisch bij de juiste ploeg (pending-join overleeft registratie). Gastmodus zonder account.
- Live meekijken: kijker start op Verloop-tab, miniscore bovenaan, doelpunten geaccentueerd, ruis (kwartstart/-einde, positiewissels) weggefilterd. In-app goal/live-banners.
- Welkomstkaart bij eerste bezoek.
- Opstelling-per-kwart-carousel: topfeature voor ouders.
- Veldweergave helder: positienummer in bol, naam eronder, keeper oranje, kapiteins-©, legende erbij.

### Beter
- **Meldingen**: `new Notification()` werkt niet op Android-PWA; permissievraag zonder user-gesture bij selectTeam (regel ±1308) wordt genegeerd. Kijker met dichtgeklapte app hoort niets. → Eerlijk communiceren in de app + permissievraag naar bewuste toggle in Instellingen. Voorspelbare #1 testklacht.
- Leeg homescherm buiten wedstrijddagen: twee lege "Geen geplande…"-blokken. Verberg lege secties.
- "Vraag co-beheer aan" is jargon voor een ouder — één zin uitleg toevoegen.
- Gastmodus belooft "enkel live wedstrijden", maar rules geven gast leestoegang tot de hele ploeg.
- `user-scalable=no` blokkeert zoomen — toegankelijkheidsdrempel.

### Slecht
- Offline valt de app terug op lokale modus waarin een kijker beheerknoppen ziet (`canManage()` true zonder cloud, regel ±1458). Toon een "Je bent offline"-scherm voor cloud-gebruikers.

---

## (ii) Perspectief beheerder

### Goed (kern van de app, zit erg goed)
- Live-registratie: grote nummerknoppen, doelpuntenmakers gesorteerd op eerdere goals, bank gesorteerd op minst gespeeld (●).
- Blessureflow (registreren → verlaat veld → direct wisselvoorstel); pauzewissels/pauze-positiewissels automatisch doorgevoerd bij start volgend deel.
- Foutcorrectie volwassen: undo, elk event bewerkbaar, retro-events met kwart- én minuutkeuze, score/veld herberekend.
- Fair-play: speeltijd-percentagebalkjes, minste-speeltijd-ranking, speeltijd per kwart.
- Wizard: 3 stappen, plannen zonder selectie, auto-plaats, gastspelers, losse spelers, template-klonen, dubbele-rugnummerwaarschuwing, lijst plakken.
- Bevestigingsdialoog bij "Nu starten"; snel resultaat invoeren; rijke exports (PDF met veld-SVG per kwart, CSV, JSON, WhatsApp).

### Beter
- Beheer verspreid over drie plekken (Beheer-chip, Instellingen, teamselect-Beheerstools). Eén "Ploeg & beheer"-scherm of kruisverwijzingen.
- Twee spelerswerelden: rooster (tegel Spelers) vs. wedstrijdspelers (Spelers bewerken). Zin uitleg toevoegen ("wijzigt enkel deze wedstrijd").
- "Wissel" en "Positie" hebben hetzelfde icoon (IC.swap) naast elkaar.
- Afgesloten wedstrijd kan niet heropend; verlenging/extra deel kan niet. → "Heropen als live"-knop.
- Co-admin gelijktijdigheid half opgelost: event-merge ok, maar `players`-status wordt overschreven (hele match ge-set). Advies handleiding: één registrator per match.
- Back-upherinnering passief; foto's enkel lokaal (verdwijnen bij wissen browserdata) — hint bij foto-slot.

### Bugs
1. **Schoten/reddingen niet registreerbaar**: shot_us/shot_them/save_us/save_them hebben labels, statskaartjes, PDF-stats en bewerkvelden, maar geen enkele knop maakt ze aan (niet in eventrij, niet onder "Meer", regel ±5742). Terugbrengen of stats-code schrappen.
2. **CSV-export**: positiekolom gebruikt `p.pos` maar wedstrijdspelers hebben `line` → altijd leeg; afwezige spelers verschijnen als "Bank" (`p.status === 'out'` bestaat niet, `p.absent` genegeerd); typfout "Truitkleur" (regel ±5638).
3. **WhatsApp-share**: doelpuntminuut = cumulatieve `gameMin`, app/PDF = minuut per deel. Gelijktrekken met `eventMinSummaryText`.
4. **Posities herplaatsen** (`_epClickSlot`, regel ±5353): klik op bezet slot verwijdert de vorige bewoner stilletjes i.p.v. te wisselen.
5. Handleiding zegt "6-cijferige code", token is 6 tekens letters+cijfers.
6. Registreren zonder naam mogelijk → lege naam in ledenlijst.

---

## (iii) Perspectief designer/eigenaar

### Goed
- Security-rules netjes: eenmalige owner-claim, aanmaakrecht enkel approvedAdmins, delete gebonden aan createdBy, self-join enkel als viewer, `$other` default-deny.
- deletedTeams-backup vóór verwijderen + wachtwoordbevestiging bij destructieve acties.
- Onderhoudsmodus met live-listener; wees-ploeg-pruning; "Alle gebruikers"-overzicht.
- Privacyverklaring professioneel (verwerkingsverantwoordelijke, rechtsgrond, GBA).
- SW: network-first shell, stale-while-revalidate assets — juiste keuze.

### Beter
1. **±99 KB dode code**: MAINT_PHOTO_B64 + MAINT_LOGO_B64 (regels 2491–2492) nergens gebruikt; renderMaintenance gebruikt de gewone afbeeldingen.
2. **Zware assets**: MD_cropped.png 632 KB als icoon, logo_no_background.png 373 KB, App_pitch…pptx 4,4 MB mee in de publieke Pages-repo.
3. **Wees-invites na owner-delete**: query op /invites (regel ±1180) faalt stil (rules: geen root-read) → token blijft werken → spookploeg. Fix: invite-ref direct verwijderen zoals doDeleteCloudTeam.
4. **"Enkel zichtbaar voor beheerders" is UI-only**: wedstrijd- en spelernotities zitten in het matchobject dat elke kijker/gast kan lezen. Coachnotities over kinderen → apart admin-only pad of label afzwakken.
5. **Offline-strategie**: Firebase SDK van gstatic (niet gecachet) → offline = lokale modus met beheer-UI. Minimum: read-only melding.
6. Onderhoudbaarheid: `playersAtStart` in exportPDF dupliceert `playersAtPeriodStart`; `lastName` én `_lastName` bestaan allebei.
7. **Geen versienummer in UI, geen feedbackkanaal** — cruciaal voor testfase. "v34"/datum in Instellingen + "Probleem melden" (mailto, voorgevuld).
8. QR via api.qrserver.com: externe afhankelijkheid + join-URL lekt naar derde partij. Lokale QR-generator (~1,5 KB).
9. Geen e-mailverificatie, wachtwoord min. 6 tekens: acceptabel op deze schaal, bewust noteren.

### Juiste balans (niet aankomen)
- Keeper automatisch via doellijn; hoekschop zonder details; tegendoel in 3 taps; eenvoudige eventmodus standaard aan.

---

## Te complex vs. te eenvoudig

**Te complex:**
1. Rollen-/aanvraagmodel: twee bijna identieke aanvraagflows met verschillende goedkeurders (beheerdersaanvraag bij eigenaar vs. co-beheer bij ploegadmin). Labels differentiëren: "Zelf een ploeg starten (goedkeuring maker)" vs. "Meehelpen bij deze ploeg".
2. Beheerfuncties over drie plekken.
3. Rooster vs. wedstrijdspelers.
4. Twee velden met label "Locatie" in dezelfde wizard (Thuis/Uit vs. veldnaam).

**Te eenvoudig / ontbrekend:**
1. Meldingen (FCM) — bewust uitgesteld, gemis voelbaar.
2. Wedstrijd heropenen / verlenging.
3. Versienummer + feedbackknop.
4. Nergens vermeld dat tornooiwedstrijden niet meetellen in statistieken — één regel onder de filterbalk.
5. Geen seizoensafsluiting/archief (seizoenfilter vangt veel op; laag prioritair).

---

## Prioriteiten vóór de testfase

| # | Actie | Waarom | Omvang |
|---|-------|--------|--------|
| 1 | Versienummer + "Probleem melden"-knop in Instellingen | Testfeedback anders onbruikbaar | klein |
| 2 | Dode base64 (99 KB) weg; iconen verkleinen; pptx uit deploy | Laadtijd oudere telefoons | klein |
| 3 | Schoten/reddingen terug onder "Meer" óf stats-code weg | Zichtbaar gat | klein |
| 4 | Notification-prompt → bewuste toggle + eerlijke uitleg | #1 klacht voorkomen | klein |
| 5 | CSV-fixes + WhatsApp-minuutnotatie gelijktrekken | Exports worden meteen gedeeld | klein |
| 6 | Handleiding: "code van 6 tekens" | Invoerverwarring | mini |
| 7 | Offline read-only melding voor cloud-gebruikers | Dataverlies-risico | middel |
| 8 | "Wedstrijd heropenen" (done → live) | Foutklik onherstelbaar | klein |
| 9 | Wees-invite fix bij owner-delete | Spookploeg | klein |
| 10 | Notities naar admin-only pad (of label aanpassen) | Privacy kinderdata | middel |

Punten 1–6: samen < 1 dag werk. Punten 7–10 kunnen tijdens de testfase.

**Eindoordeel**: functioneel rijk, visueel consistent, veiligheidstechnisch degelijk. Live-registratie en fair-play-inzichten zijn onderscheidend. Zwaktes zitten in de randen: dode features, offline, meldingen, testfase-gereedschap. Met de top-6 fixes klaar voor testers.
