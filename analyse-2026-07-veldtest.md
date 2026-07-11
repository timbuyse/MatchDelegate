# Diepgaande analyse MatchDelegate v0.2.8 — klaarstomen voor de veldtest

*Analyse uitgevoerd op 2026-07-11 (code-stand: commit 9db9dbe, v0.2.8). Alle regelnummers verwijzen naar `index.html`, tenzij anders vermeld.*

Deze analyse bekeek de app vanuit vijf invalshoeken: de live-wedstrijdflow, de data-architectuur en synchronisatie, security & privacy, UX & praktische bruikbaarheid op het veld, en performance & codekwaliteit.

---

## De 5 grote openstaande punten uit de vorige analyse

Deze punten bleven bewust liggen en zijn in de actielijst hieronder verwerkt:

1. **Echte offline-modus voor beheerders** (nu: rode banner + alles read-only) → actiepunt **A1**
2. **Conflictbestendige co-admin-sync** (nu: last-write-wins op het hele matchobject) → actiepunt **A3**
3. **Echte pushmeldingen voor kijkers** (nu: eerlijk gecommuniceerd dat ze er niet zijn, maar de code is half af) → actiepunt **B13**
4. **Efficiëntere Firebase-sync** (nu: hele seizoen opnieuw gedownload bij elk event) → actiepunt **B14**
5. **Opsplitsen van de monoliet / testbaarheid** (6.737 regels, 65 globals, geen tests of linter) → actiepunt **C18**

---

## Wat gaat goed

- **De wedstrijdklok is robuust.** Timestamp-gebaseerd (`getGameTimeMs`/`getQElapsed`, r. 2112–2125: rekent met `startTime`/`endTime`/`pausedAt`/`totalPaused` via `Date.now()`); de `setInterval` (r. 2323–2327) is puur display. Telefoon vergrendelen, tab slapen, app gekilld: de klok staat daarna juist. Wake lock tijdens lopend deel (r. 2330), eindsignaal met piep + trilling (r. 2333–2341).
- **De live-bediening is doordacht.** Grote knoppen, eenvoudige modus standaard aan (r. 2345–2348), undo-knop (r. 5952–5962), bevestigingsmodals op alle destructieve acties (einde deel r. 5297, einde match r. 5330, event verwijderen r. 5828, match verlaten r. 5224). Events volledig corrigeerbaar: bewerken incl. minuut (r. 5841–5884), verwijderen, retroactief toevoegen per deel (r. 6322–6348). Foutief afgesloten match is heropenbaar (r. 5315–5329). 2e geel → automatisch rood klopt (r. 6199–6210). Pauzewissels krijgen de juiste speeltijd (r. 6121–6125, 5241–5248).
- **Score en opstelling worden herberekend uit events** (`recomputeScore` r. 635, `recomputeOnField` r. 657) — consistent na verwijderen/bewerken/undo, incl. eigen doelpunten, penalty's en afgekeurde goals.
- **De Firebase-rules zijn defensief**: deny-by-default (`$other`, rules r. 141–144), notities op apart admin-only pad `teamNotes` (rules r. 121–129), nieuwe leden kunnen zichzelf enkel als viewer toevoegen (rules r. 32).
- **Privacy is serieus genomen**: echte privacyverklaring (r. 3075–3106: verwerkingsverantwoordelijke, GDPR, EER-opslag, klachtrecht GBA), account verwijderen bestaat (r. 3644–3669), foto's gaan bewust niet naar de cloud, wachtwoorden staan nergens lokaal.
- **Performance-basics kloppen**: 810KB handleiding-screenshots laden lazy (r. 3351–3364), listeners netjes opgeruimd bij teamwissel (`stopTeamListeners` r. 1329), timer update alleen het klok-element, nauwelijks console-vervuiling, iconenfont lokaal gebundeld.
- **Foutmeldingen zijn Nederlands** waar het telt (`authErrMsg` r. 1936–1947), nergens rauwe `alert()`/`prompt()`.
- **Nette CSV-export per wedstrijd** (r. 5706–5794) met BOM en `;`-separator (Excel-vriendelijk voor BE).

## De drie structurele zwaktes

1. **Offline is de achilleshiel.** Herstart zonder bereik → Firebase-SDK laadt niet (sw.js cachet externe verzoeken bewust niet, sw.js r. 21–22) → alles read-only (`canManage`/`offlineWithKnownCloudTeam` r. 1516–1517, `ro=true` in `renderLive` r. 5096). Of de SDK laadt wél uit browsercache → `onAuthChanged` blijft eeuwig hangen op `once('value')`-calls die offline nooit resolven (r. 817–828, 861, 1238) → blanco scherm na de splash.
2. **Sync is last-write-wins op hele objecten.** Elke save pusht het complete matchobject (`r.set(c)`, r. 1301); roster en tornooien gaan als hele array (r. 1314–1321). Co-admins overschrijven elkaars doelpunten, kwartstarten en wissels. De event-merge (r. 1371–1379) repareert alleen events, alleen lokaal in IndexedDB, en pusht nooit terug. Cloud-writes falen bovendien geruisloos (geen `.catch`, geen sync-indicator).
3. **De beheerflow schaalt niet.** Beheerder worden vereist goedkeuring van de app-eigenaar, die daarvan geen notificatie krijgt (alleen een badge in de app). De aanvrager ziet zijn goedkeuring pas na een volledige app-herstart (`maybeNotifyApproved` draait alleen in `onAuthChanged`, r. 832–834).

---

## DE ACTIELIJST

### Tier A — blockers: fixen vóór de veldtest

| # | Punt | Details / regelnummers |
|---|------|------------------------|
| **A1** | **Offline herstart op het veld → onbruikbaar of blanco scherm** | Rol lokaal cachen (bv. `voetbal_lastRole_<teamId>`), timeout (`Promise.race`) rond alle `once('value')`-calls in de authflow (r. 817–828, 861, 1238), Firebase-SDK lokaal hosten of in de SW-cache opnemen, offline beheer toestaan op de eigen lokale live-match met sync bij reconnect. *(memory-punt 1)* |
| **A2** | **Foto's worden na opslaan lokaal gewist door de cloud-echo** | `pickPhoto` (r. 6469–6482) bewaart foto in IndexedDB; de cloud-push gaat zonder foto (r. 1295); de eigen `matches`-listener overschrijft daarna de lokale match zónder foto (`applyCloudMatches` r. 1360–1390 merget notities wel, `photo1`/`photo2` niet). Fix: foto's net als notities uit `existing` overnemen. |
| **A3** | **Co-admin overschrijft co-admin (last-write-wins)** | `r.set(c)` van hele match (r. 1301); `cloudRefreshUI` ververst in-memory `match` alléén voor niet-admins (r. 1507–1509), dus een admin pusht daarna zijn verouderde staat en wist de events van de ander. Minimaal: in-memory match van admins ook verversen bij cloud-events. Structureel: granulaire writes (per event `matches/$id/events/$eid`, velden via `update()`). Noodmaatregel voor de test: één persoon bedient de match. *(memory-punt 2)* |
| **A4** | **Dubbeltik-guards op `startQuarter`/`resumeQuarter`/`confirmGoal`** | Twee snelle tikken op "Hervatten" (r. 5289–5295): tweede call ziet `pausedAt === null` → `totalPaused += Date.now() - null` → klok springt naar 00:00, speeltijden onherstelbaar corrupt. Zelfde venster bij `startQuarter` (r. 5235–5238, fantoomkwart) en `confirmGoal` (r. 6064–6075, dubbele goal). Fix: guards + knop disablen bij eerste tik. |
| **A5** | **Back-up terugzetten in cloudmodus wordt stil weer verwijderd** | `doRestore` (r. 3475–3513) schrijft met `st.put` zonder cloud-push; herstelde matches hebben `fromCloud: true` en worden bij de eerstvolgende value-event weer gewist (r. 1364). Fix: `fromCloud` strippen en/of expliciet naar de cloud pushen, of restore blokkeren met uitleg. |
| **A6** | **Goedkeuring komt pas door na app-herstart** | Geen listener op `approvedAdmins/{uid}` of de eigen rol in `teams/*/members`; `maybeNotifyApproved`/`maybeNotifyRejected` alleen in `onAuthChanged` (r. 832–834). Handleiding belooft "meteen een melding" (handleiding_content.md r. 266) — klopt niet. Fix: `.on('value')` op eigen rol + toast "Je bent nu co-beheerder". |
| **A7** | **Stille sync-fouten** | `cloudOnLocalMatchSave` (r. 1291–1307) e.a.: promise-rejections niet afgevangen; bij permission-denied of flaky netwerk blijft de wijziging lokaal zonder enige melding. Fix: `.catch(() => showToast('Synchronisatie mislukt', 'err'))` + klein "gesynchroniseerd/offline"-statusdotje op het live-scherm. |
| **A8** | **Beheerdersaanvraag: notificatie naar de eigenaar + wachtstatus voor de aanvrager** | Aanvraag (r. 954–981) is alleen zichtbaar als badge in de app van de eigenaar; de aanvrager kan intussen niets (knop "+ Nieuwe ploeg" onzichtbaar, r. 2023–2025). Fix: e-mailnotificatie naar de eigenaar + duidelijke wachtstatus of demo-ploeg. |

### Tier B — hoog: fixen tijdens de eerste testweken

| # | Punt | Details / regelnummers |
|---|------|------------------------|
| **B9** | **XSS via spelersnamen en vrije tekst** | `pName()` (r. 2249) en `e.reason` (r. 2271–2272) gaan ongeëscaped via `evtLabel` → `renderEventLog` (r. 2315) in `innerHTML`, bij alle kijkers. `esc()` bestaat (r. 6673) en wordt elders 172× correct gebruikt. Fix: `esc()` in `pName`/`evtLabel`. |
| **B10** | **Invite-tokens zwak en permanent** | 6 tekens uit `Math.random().toString(36)` (r. 1608), aangemaakt bij teamcreatie, geen vervaldatum of rotatie; `/invites/$token` leesbaar voor elke ingelogde gebruiker (rules r. 91). Gelekte WhatsApp-link = blijvende toegang tot data over minderjarigen. Fix: crypto-random langer token + regenereer-optie, evt. vervaldatum. |
| **B11** | **Service worker: netwerk-eerst zonder timeout** | sw.js r. 25–34: bij "lie-fi" hangt de app tientallen seconden op de splash tot de browser-fetch timeout. Fix: `Promise.race` met ~3s timeout → cache-fallback. |
| **B12** | **PDF-knop maakt geen PDF** | `exportPDF` eindigt op `document.write` zonder `print()` (r. 6667–6669); `window.open` faalt op iOS-PWA. De handleiding-PDF doet het wél goed (r. 3428). Fix: `w.print()` + iOS-fallback. |
| **B13** | **Meldingen: kies (dode code of echte feature)** | `Notification.permission === 'granted'` wordt gecheckt (r. 1431, 1446) maar de permissie wordt nooit aangevraagd → notificaties vuren nooit. Ofwel permissie vragen bij de kijker-welkomstkaart, ofwel de dode code verwijderen. *(memory-punt 3)* |
| **B14** | **Hele seizoen opnieuw gedownload bij elk event** | Value-listener op de volledige `matches`-node (r. 1341) + volledige IndexedDB-herschrijf per event (r. 1365–1390). Met 30+ wedstrijden: honderden KB per doelpunt per kijker. Fix: `child_added/changed/removed` of query op recente/live wedstrijden. *(memory-punt 4)* |
| **B15** | **Laadgewicht: ~2,3 MB cold start, ~1,7 MB overbodig** | 632KB `MD_cropped.png` als favicon (r. 12–13 + sw.js precache), 1,07 MB tabler-iconfont voor slechts 28 gebruikte iconen (er is al een inline-SVG-systeem `IC`, r. 480). Fix: mini-favicon (~5KB) + font-subset of alles naar SVG. |
| **B16** | **Versieproces al ontspoord** | `APP_VERSION='0.2.8'` (r. 433) vs `CACHE='voetbal-v37'` (sw.js r. 1): laatste bump was bij v0.2.5; v0.2.6–0.2.8 vergeten. Geen git-tags. Fix: één versiebron (bv. `sw.js?v=<APP_VERSION>` registreren). |
| **B17** | **Live-randgevallen** | (a) Vergeten af te sluiten → kwart van 2 uur vertekent alle speeltijden (r. 2116, 5795–5799); prompt bij grote overtime + bewerkbare deelduur. (b) Goal nét na "Einde deel" tijdens de rust niet in te voeren (r. 5106–5107; `modalAddPostEvent` r. 6322 alleen in detail-view) → knop "Event toevoegen aan vorig deel" tijdens `between`. (c) Eindsignaal klinkt alleen op de Wedstrijd-tab met scherm aan (r. 2363, 5223) → overtime-check in eigen interval. (d) Keeper-minuten kloppen niet bij keeperwissel binnen een deel (r. 5266–5282) → keeper-intervallen bijhouden. |

### Tier C — belangrijk, na de eerste testronde

| # | Punt | Details |
|---|------|---------|
| **C18** | **Onderhoudbaarheid** | Monoliet van 6.737 regels, 65 top-level globals, 442 functies, geen tests/linter/build. Minimale stap: JS opsplitsen in losse `<script src>`-modules + ESLint. Opruimen: ~16 dode functies (o.a. `saveSettings`, `canEditMatch`, `keeperMinutes`-varianten, `handleLogoFile`) + legacy v1-opslag (`voetbal_teams`/`voetbal_rosters`). *(memory-punt 5)* |
| **C19** | **Rollen en handleiding gelijktrekken** | Vijf feitelijke rollen (eigenaar / goedgekeurde beheerder / team-admin / kijker / gast) vs. drie in de handleiding; "Beheerder" (r. 1992, 1754) vs "Co-beheerder" (r. 1138) voor dezelfde rol; handleiding §6 beschrijft een niet-bestaande flow ("Instellingen → Nieuwe ploeg aanmaken"); "6-cijferige code" is 6 tekens letters+cijfers; tab heet "Verloop", handleiding zegt "Log". Eén redactieronde tegen v0.2.8. |
| **C20** | **Data-hygiëne** | (a) Matches hebben geen `teamId` — oude lokale wedstrijden lekken naar de actieve ploeg en worden daar geüpload (r. 1291–1301, 2682, 2836–2845). (b) Roster/tornooien als hele-array-`set()` → zelfde LWW-probleem (r. 610/614 → 1314–1321). (c) Wedstrijd verwijderen: definitief, fire-and-forget, geen vangnet (r. 6555, 1309–1313). (d) `teamNotes` blijft als wees achter na teamverwijdering (r. 3721–3763); geen herstel-UI voor `deletedTeams`. (e) Account verwijderen wist alleen de auth-user; `users/$uid`, `memberInfo` en memberships blijven staan — in strijd met de privacyverklaring (r. 3095). (f) `migrateTeams` kan opnieuw draaien na "Alles vervangen"-restore (r. 618, 3483–3485). (g) Clienttijd i.p.v. `ServerValue.TIMESTAMP`. (h) `voetbal_activeTeamId` wordt geschreven maar nooit teruggelezen (r. 1267 vs 842–852) → multi-ploeg-gebruiker belandt altijd op teamselect. |
| **C21** | **UX-polish & security-restjes** | (a) Join-link zonder context voor niet-ingelogden (banner op auth-scherm bij `voetbal_pending_join`). (b) QR via externe dienst `api.qrserver.com` zonder fallback (r. 1688). (c) Donker thema standaard terwijl jeugdvoetbal in fel zonlicht doorgaat (r. 577); `prefers-color-scheme` volgen. (d) Lege-staat geeft kijkers onuitvoerbare instructies (r. 2706–2708). (e) Seizoens-CSV voor de clubsecretaris ontbreekt. (f) `.validate`-rules toevoegen in database.rules.json. (g) E-mailverificatie overwegen. (h) Resterende Engelse foutteksten (`e.message`-patroon, o.a. r. 1020, 1716, 1804). (i) Wake lock niet heraangevraagd bij terugnavigeren naar live (r. 2425). (j) `#timer-lbl` ("GEPAUZEERD") wordt gezocht maar nooit gerenderd (r. 2356 vs 5129–5134). (k) Undo van een wissel herstelt posities/keeper-detectie niet (r. 6128–6130). (l) Manifest: 512px-icoon ook als "192x192" gedeclareerd + `purpose: "any maskable"` gecombineerd. (m) `logo.png` niet in SW-precache maar wel op het auth-scherm. (n) "Deel via WhatsApp" opent het generieke deelmenu. |

---

## Advies voor de veldtest

Tier A is één gerichte werkronde: A2, A4, A5, A6 en A7 zijn elk klein; A1 en A3 zijn de echte klussen. Doe die vóór er één vrijwilliger met de app op een veld staat — A1 en A3 zijn precies de scenario's die op zaterdagochtend gebeuren, en A2/A5 zijn stille dataverliezen die het vertrouwen van testers in één week breken. Tier B kan parallel met de eerste testweken; Tier C daarna.
